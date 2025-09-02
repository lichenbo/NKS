// js/webgpu-cellular-automata.js

/**
 * @file WebGPU runner for Cellular Automata.
 * This file provides a WebGPU-based computation backend for the AutomataEngine.
 * It uses compute shaders to perform cellular automata calculations on the GPU,
 * offering the highest performance on supported hardware.
 */

window.APP = window.APP || {};

(function (APP) {
    'use strict';

    /**
     * A runner that computes cellular automata generations using WebGPU.
     * It is designed to be used by the AutomataAnimator and conforms to the
     * runner interface.
     */
    class WebGPURunner {
        constructor(options = {}) {
            this.cols = options.cols || 0;
            this.device = null;
            this.pipeline = null;
            this.buffers = {};
            this.bindGroup = null;
            this.initializationPromise = this.init();
        }

        async init() {
            if (!navigator.gpu) {
                throw new Error('WebGPU not supported.');
            }
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                throw new Error('No WebGPU adapter found.');
            }
            this.device = await adapter.requestDevice();
            this.device.lost.then(() => {
                console.warn('WebGPU device lost.');
                this.cleanup();
            });
            await this.setupPipeline();
        }

        async setupPipeline() {
            const shaderModule = this.device.createShaderModule({
                code: this.getShaderCode(),
            });
            this.pipeline = this.device.createComputePipeline({
                layout: 'auto',
                compute: {
                    module: shaderModule,
                    entryPoint: 'main',
                },
            });
        }

        setupResources() {
            this.cleanupBuffers();
            const bufferSize = this.cols * 4; // u32
            this.buffers.input = this.device.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
            });
            this.buffers.output = this.device.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
            });
            this.buffers.read = this.device.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            });
            this.buffers.uniforms = this.device.createBuffer({
                size: 48, // 8 for rule, 1 for size, 3 for padding
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            this.setupBindGroup();
        }

        setupBindGroup() {
            this.bindGroup = this.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.input } },
                    { binding: 1, resource: { buffer: this.buffers.output } },
                    { binding: 2, resource: { buffer: this.buffers.uniforms } },
                ],
            });
        }

        async updateRule(ruleNumber) {
            await this.initializationPromise;
            const ruleData = new Uint32Array(12);
            ruleData.set(APP.CellularAutomataShared.CellularAutomataRules.toWebGPUFormat(ruleNumber));
            ruleData[8] = this.cols;
            this.device.queue.writeBuffer(this.buffers.uniforms, 0, ruleData);
        }

        async computeNextGeneration(grid, ruleNumber) {
            await this.initializationPromise;

            if (grid.length !== this.cols) {
                this.cols = grid.length;
                this.setupResources();
            }

            await this.updateRule(ruleNumber);

            this.device.queue.writeBuffer(this.buffers.input, 0, new Uint32Array(grid));

            const commandEncoder = this.device.createCommandEncoder();
            const passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(this.pipeline);
            passEncoder.setBindGroup(0, this.bindGroup);
            passEncoder.dispatchWorkgroups(Math.ceil(this.cols / 64));
            passEncoder.end();

            commandEncoder.copyBufferToBuffer(this.buffers.output, 0, this.buffers.read, 0, this.cols * 4);
            this.device.queue.submit([commandEncoder.finish()]);

            await this.buffers.read.mapAsync(GPUMapMode.READ);
            const resultArray = new Uint32Array(this.buffers.read.getMappedRange().slice(0));
            this.buffers.read.unmap();

            // Swap buffers
            [this.buffers.input, this.buffers.output] = [this.buffers.output, this.buffers.input];
            this.setupBindGroup();

            return Array.from(resultArray);
        }

        getShaderCode() {
            return `
                struct Params {
                    rule: array<vec4<u32>, 2>,
                    grid_size: u32,
                };

                @group(0) @binding(0) var<storage, read> input_cells: array<u32>;
                @group(0) @binding(1) var<storage, read_write> output_cells: array<u32>;
                @group(0) @binding(2) var<uniform> params: Params;

                @compute @workgroup_size(64)
                fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                    let index = global_id.x;
                    if (index >= params.grid_size) { return; }

                    let left_index = select(index - 1u, params.grid_size - 1u, index == 0u);
                    let right_index = select(index + 1u, 0u, index == params.grid_size - 1u);

                    let left = input_cells[left_index];
                    let center = input_cells[index];
                    let right = input_cells[right_index];

                    let rule_index = (left << 2u) | (center << 1u) | right;
                    let vec_idx = rule_index >> 2u;
                    let comp = rule_index & 3u;

                    var value: u32;
                    switch (comp) {
                        case 0u: { value = params.rule[vec_idx].x; }
                        case 1u: { value = params.rule[vec_idx].y; }
                        case 2u: { value = params.rule[vec_idx].z; }
                        default: { value = params.rule[vec_idx].w; }
                    }
                    output_cells[index] = value;
                }`;
        }

        cleanupBuffers() {
            for (const key in this.buffers) {
                this.buffers[key]?.destroy();
            }
            this.buffers = {};
        }

        cleanup() {
            this.cleanupBuffers();
            this.device?.destroy();
        }
    }

    APP.WebGPURunner = WebGPURunner;

})(window.APP);