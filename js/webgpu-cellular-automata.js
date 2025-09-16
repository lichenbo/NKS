// gpu/webgpu-cellular-automata.js

window.APP = window.APP || {};

(function (APP) {
    'use strict';

    class WebGPUCellularAutomataCanvas extends APP.CellularAutomata.CellularAutomataCanvas {
        constructor(canvasId, cellSize, options = {}) {
            super(canvasId, cellSize, options);

            // WebGPU specific properties
            this.webgpuDevice = null;
            this.computePipeline = null;
            this.bindGroup = null;
            this.inputBuffer = null;
            this.outputBuffer = null;
            this.uniformBuffer = null;
            this.readBuffer = null;

            // GPU state
            this.useWebGPU = false;

            // Initialize WebGPU
            this.initializationPromise = this.initializeWebGPU();
        }

        async initializeWebGPU() {
            if (!navigator.gpu) {
                throw new Error('WebGPU not supported');
            }

            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                throw new Error('No WebGPU adapter found');
            }

            this.webgpuDevice = await adapter.requestDevice();
            this.webgpuDevice.lost.then(() => {
                this.useWebGPU = false;
            });

            this.useWebGPU = true;
            await this.setupWebGPUCompute();
        }

        async setupWebGPUCompute() {
            const computeShaderModule = this.webgpuDevice.createShaderModule({
                code: this.generateComputeShader()
            });

            this.computePipeline = this.webgpuDevice.createComputePipeline({
                layout: 'auto',
                compute: {
                    module: computeShaderModule,
                    entryPoint: 'main'
                }
            });
        }

        generateComputeShader() {
            return `
struct Params {
    // 8 values packed as 2 vec4<u32> to satisfy 16-byte alignment rules
    rule: array<vec4<u32>, 2>,
    grid_size: u32,
    // Padding to keep struct size/alignment a multiple of 16 bytes
    _pad1: u32,
    _pad2: u32,
    _pad3: u32,
};

@group(0) @binding(0) var<storage, read> input_cells: array<u32>;
@group(0) @binding(1) var<storage, read_write> output_cells: array<u32>;
@group(0) @binding(2) var<uniform> params: Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= params.grid_size) {
        return;
    }

    // Wraparound neighbors
    let left_index = select(index - 1u, params.grid_size - 1u, index == 0u);
    let right_index = select(index + 1u, 0u, index == params.grid_size - 1u);

    let left = input_cells[left_index];
    let center = input_cells[index];
    let right = input_cells[right_index];

    // Elementary CA rule index [0..7]
    let rule_index = (left << 2u) | (center << 1u) | right;

    // Map rule_index -> vec index/component
    let vec_idx = rule_index >> 2u;   // 0..1
    let comp    = rule_index & 3u;    // 0..3

    var value: u32;
    switch (comp) {
        case 0u: { value = params.rule[vec_idx].x; }
        case 1u: { value = params.rule[vec_idx].y; }
        case 2u: { value = params.rule[vec_idx].z; }
        default: { value = params.rule[vec_idx].w; }
    }

    output_cells[index] = value;
}
            `;
        }

        setupStorageBuffers() {
            this.cleanupStorageBuffers();

            const bufferSize = this.cols * 4; // 4 bytes per u32

            const storageUsage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;

            this.inputBuffer = this.webgpuDevice.createBuffer({ size: bufferSize, usage: storageUsage });
            this.outputBuffer = this.webgpuDevice.createBuffer({ size: bufferSize, usage: storageUsage });

            this.readBuffer = this.webgpuDevice.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            });

            this.uniformBuffer = this.webgpuDevice.createBuffer({
                size: 48, // 12 u32 values = 48 bytes
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
        }

        setupBindGroup() {
            this.bindGroup = this.webgpuDevice.createBindGroup({
                layout: this.computePipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: { buffer: this.inputBuffer }
                    },
                    {
                        binding: 1,
                        resource: { buffer: this.outputBuffer }
                    },
                    {
                        binding: 2,
                        resource: { buffer: this.uniformBuffer }
                    }
                ]
            });
        }

        updateGPUUniforms(ruleNumber) {
            if (!this.webgpuDevice || !this.uniformBuffer) return; // Not ready yet
            const rule = CellularAutomataRules.toWebGPUFormat(ruleNumber);
            const uniformData = new Uint32Array(12);
            uniformData.set(rule, 0);
            uniformData[8] = this.cols;
            this.webgpuDevice.queue?.writeBuffer(this.uniformBuffer, 0, uniformData);
        }

        uploadGridToGPU(gridData) {
            if (!this.webgpuDevice || !this.inputBuffer) return;
            const gpuData = new Uint32Array(gridData);
            this.webgpuDevice.queue?.writeBuffer(this.inputBuffer, 0, gpuData);
        }

        async computeNextGenerationGPU() {
            this.ensureGPUBuffers();

            const commandEncoder = this.webgpuDevice.createCommandEncoder();
            const computePass = commandEncoder.beginComputePass();

            computePass.setPipeline(this.computePipeline);
            computePass.setBindGroup(0, this.bindGroup);
            computePass.dispatchWorkgroups(Math.ceil(this.cols / 64));
            computePass.end();

            commandEncoder.copyBufferToBuffer(
                this.outputBuffer, 0,
                this.readBuffer, 0,
                this.cols * 4
            );

            this.webgpuDevice.queue.submit([commandEncoder.finish()]);
            await this.webgpuDevice.queue.onSubmittedWorkDone();

            try {
                await this.readBuffer.mapAsync(GPUMapMode.READ);
                const resultData = new Uint32Array(this.readBuffer.getMappedRange());
                const result = new Uint32Array(resultData);

                // Swap buffers for next iteration
                [this.inputBuffer, this.outputBuffer] = [this.outputBuffer, this.inputBuffer];
                this.setupBindGroup();

                return result;
            } finally {
                if (this.readBuffer && this.readBuffer.mapState !== 'unmapped') {
                    this.readBuffer.unmap();
                }
            }
        }

        cleanupStorageBuffers() {
            if (this.readBuffer && this.readBuffer.mapState !== 'unmapped') {
                this.readBuffer.unmap();
            }

            this.inputBuffer?.destroy();
            this.outputBuffer?.destroy();
            this.readBuffer?.destroy();
            this.uniformBuffer?.destroy();

            this.inputBuffer = null;
            this.outputBuffer = null;
            this.readBuffer = null;
            this.uniformBuffer = null;
            this.bindGroup = null;
        }

        cleanupWebGPU() {
            this.cleanupStorageBuffers();
            this.computePipeline = null;
            this.webgpuDevice = null;
        }

        cleanup() {
            super.cleanup();
            this.cleanupWebGPU();
        }

        initAnimation() {
            super.initAnimation();
            this.ensureGPUBuffers();
        }

        ensureGPUBuffers() {
            if (!this.inputBuffer && this.useWebGPU && this.cols > 0) {
                this.setupStorageBuffers();
                this.setupBindGroup();
            }
        }

    }

    class WebGPUAutomataScene extends WebGPUCellularAutomataCanvas {
        constructor(canvasId, cellSize, config = {}) {
            super(canvasId, cellSize, config);
            if (!this.canvas) return;

            const {
                renderFrame,
                getAlpha,
                onFrameStart,
                onComplete,
                onRuleChange,
                initialRule,
                getInitialRule
            } = config;

            this.stateManager = new AnimationStateManager(this.cols, this.rows);
            this.animatingGPU = false;

            this.renderFrame = typeof renderFrame === 'function'
                ? (frame) => renderFrame({ ...frame, instance: this })
                : () => {};
            this.getAlpha = typeof getAlpha === 'function'
                ? () => getAlpha(this)
                : () => 1;
            this.onFrameStart = typeof onFrameStart === 'function'
                ? () => onFrameStart(this)
                : () => {};
            this.onComplete = typeof onComplete === 'function'
                ? () => onComplete(this)
                : async () => {};
            this._onRuleChange = typeof onRuleChange === 'function'
                ? (ruleNumber, isInitial) => onRuleChange(this, ruleNumber, isInitial)
                : () => {};

            const initialRuleNumber = initialRule ?? (typeof getInitialRule === 'function'
                ? getInitialRule(this)
                : 30);
            this.setRule(initialRuleNumber, true);

            this.initializationPromise
                .then(() => {
                    this.initializeForRule(this.currentRuleNumber);
                    this.startAnimation();
                })
                .catch((error) => {
                    console.error('WebGPU initialization failed:', error);
                });
        }

        setRule(ruleNumber, isInitial = false) {
            this.currentRuleNumber = parseInt(ruleNumber, 10);
            this.currentRule = CellularAutomataRules.getRule(this.currentRuleNumber);
            this._onRuleChange(this.currentRuleNumber, isInitial);
        }

        initializeForRule(ruleNumber) {
            this.ensureGPUBuffers();
            this.updateGPUUniforms(ruleNumber);
        }

        restartForRule(ruleNumber, isInitial = false) {
            this.setRule(ruleNumber, isInitial);
            this.stateManager.updateDimensions(this.cols, this.rows);
            this.grid = this.stateManager.grid;
            this.currentRow = this.stateManager.currentRow;
            this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.initializeForRule(this.currentRuleNumber);
            if (this.useWebGPU) {
                this.uploadGridToGPU(this.stateManager.grid);
            }
        }

        initAnimation() {
            super.initAnimation();
            if (this.stateManager) {
                this.stateManager.updateDimensions(this.cols, this.rows);
                this.grid = this.stateManager.grid;
                this.currentRow = this.stateManager.currentRow;
            }
        }

        async animate() {
            if (this.animatingGPU) return;
            this.animatingGPU = true;

            try {
                await this.onFrameStart();

                if (this.stateManager.isAnimationComplete()) {
                    await this.onComplete();
                }

                if (this.stateManager.currentRow === 0) {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.stateManager.drawnRows.length = 0;
                    this.uploadGridToGPU(this.stateManager.grid);
                }

                this.stateManager.storeCurrentGeneration();

                this.renderFrame({
                    ctx: this.ctx,
                    drawnRows: this.stateManager.drawnRows,
                    cols: this.cols,
                    currentRow: this.stateManager.currentRow,
                    cellSize: this.cellSize,
                    offsetX: this.offsetX,
                    offsetY: this.offsetY,
                    alpha: this.getAlpha()
                });

                if (!this.stateManager.isAnimationComplete()) {
                    const nextGrid = await this.computeNextGenerationGPU();
                    this.stateManager.grid = Array.from(nextGrid);
                    this.stateManager.currentRow++;
                    this.grid = this.stateManager.grid;
                    this.currentRow = this.stateManager.currentRow;
                }
            } finally {
                this.animatingGPU = false;
            }
        }
    }

    class WebGPUBackgroundCellularAutomata extends WebGPUAutomataScene {
        constructor(canvasId = 'cellular-automata-bg') {
            super(canvasId, 3, {
                animationSpeed: 200,
                initialRule: 30,
                renderFrame: ({ ctx, drawnRows, cols, currentRow, cellSize, offsetX, offsetY }) => {
                    CellularAutomataRenderer.renderBackgroundRows(
                        ctx,
                        drawnRows,
                        cols,
                        currentRow,
                        cellSize,
                        offsetX,
                        offsetY
                    );
                },
                onRuleChange: (_, ruleNumber) => {
                    if (window.APP?.CellularAutomata?.updateBackgroundRuleIndicator) {
                        window.APP.CellularAutomata.updateBackgroundRuleIndicator(ruleNumber);
                    } else {
                        window.RuleIndicators?.update('background', ruleNumber);
                    }
                }
            });
        }
    }

    class WebGPUHeaderCellularAutomata extends WebGPUAutomataScene {
        constructor(canvasId = 'header-cellular-automata') {
            const breathingEffect = new BreathingEffect();
            super(canvasId, 3, {
                animationSpeed: 200,
                parentElement: true,
                renderFrame: ({ ctx, drawnRows, cols, currentRow, cellSize, offsetX, offsetY, alpha }) => {
                    CellularAutomataRenderer.renderHeaderRows(
                        ctx,
                        drawnRows,
                        cols,
                        currentRow,
                        cellSize,
                        alpha,
                        offsetX,
                        offsetY
                    );
                },
                getAlpha: () => breathingEffect.update(),
                getInitialRule: () => CellularAutomataRules.getRandomRule(),
                onRuleChange: (_, ruleNumber, isInitial) => {
                    const ruleName = ruleNumber.toString();
                    window.headerRuleName = ruleName;
                    if (isInitial) {
                        if (window.APP?.CellularAutomata?.updateHeaderRuleIndicator) {
                            window.APP.CellularAutomata.updateHeaderRuleIndicator(ruleName);
                        } else {
                            window.RuleIndicators?.update('header', ruleNumber);
                        }
                    } else {
                        breathingEffect.reset();
                        if (window.APP?.CellularAutomata?.updateHeaderRuleIndicatorWithVFX) {
                            window.APP.CellularAutomata.updateHeaderRuleIndicatorWithVFX(ruleName);
                        } else {
                            window.RuleIndicators?.update('header', ruleNumber);
                        }
                    }
                },
                onFrameStart: () => {},
                onComplete: async (instance) => {
                    await new Promise(resolve => setTimeout(resolve, 1800));
                    const nextRule = CellularAutomataRules.getRandomRule(instance.currentRuleNumber);
                    instance.restartForRule(nextRule);
                }
            });
        }
    }

    // Initialization functions for WebGPU-accelerated cellular automata
    function initWebGPUCellularAutomataBackground() {
        return new WebGPUBackgroundCellularAutomata();
    }

    function initWebGPUHeaderCellularAutomata() {
        return new WebGPUHeaderCellularAutomata();
    }

    // Expose to APP namespace
    APP.WebGPUCellularAutomata = {
        WebGPUCellularAutomataCanvas,
        WebGPUAutomataScene,
        WebGPUBackgroundCellularAutomata,
        WebGPUHeaderCellularAutomata,
        initWebGPUCellularAutomataBackground,
        initWebGPUHeaderCellularAutomata
    };

    // Backward compatibility - expose to global scope
    window.WebGPUCellularAutomataCanvas = WebGPUCellularAutomataCanvas;
    window.WebGPUAutomataScene = WebGPUAutomataScene;
    window.initWebGPUCellularAutomataBackground = initWebGPUCellularAutomataBackground;
    window.initWebGPUHeaderCellularAutomata = initWebGPUHeaderCellularAutomata;

})(window.APP);
