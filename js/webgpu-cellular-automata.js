// gpu/webgpu-cellular-automata.js

/**
 * WebGPU Cellular Automata Implementation for NKS Project
 * High-performance GPU-accelerated cellular automata using WebGPU compute shaders
 * 
 * Features:
 * - Compute shader-based cellular automata evolution
 * - Storage buffer ping-pong for efficient memory management
 * - Support for multiple Elementary CA rules (30, 90, 110, 54, 150, 126)
 * - High-performance GPU-only implementation (no CPU fallback)
 * - Performance monitoring and quality optimization
 * 
 * Browser Support: Chrome 113+, Edge 113+, Firefox 141+, Safari 26+
 * Performance: 10-50x improvement over CPU for large grids
 * 
 * Usage: Extends existing CellularAutomataCanvas with GPU acceleration
 */

window.APP = window.APP || {};

(function (APP) {
    'use strict';

    /**
     * WebGPU-accelerated Cellular Automata Canvas
     * Extends base CellularAutomataCanvas with WebGPU compute shader acceleration
     * GPU-only implementation - requires WebGPU support or will fail
     */
    class WebGPUCellularAutomataCanvas extends APP.CellularAutomata.CellularAutomataCanvas {
        constructor(canvasId, cellSize, options = {}) {
            super(canvasId, cellSize, options);

            // Debug: log dimensions after base class initialization
            console.log('WebGPU CA initialized with dimensions:', {
                cols: this.cols,
                rows: this.rows,
                canvasWidth: this.canvas?.width,
                canvasHeight: this.canvas?.height
            });

            // WebGPU specific properties
            this.webgpuDevice = null;
            this.webgpuAdapter = null;
            this.computePipeline = null;
            this.bindGroup = null;
            this.inputBuffer = null;
            this.outputBuffer = null;
            this.uniformBuffer = null;
            this.readBuffer = null;

            // GPU state
            this.useWebGPU = false;
            this.deviceLost = false;

            // Performance monitoring using shared utility
            // Note: Cellular automata runs at ~5 FPS by design (200ms intervals)
            this.performanceMonitor = new CAPerformanceMonitor({
                fallbackThreshold: 0.1
                // No fallback callback - WebGPU should work or fail completely
            });

            // Initialize WebGPU
            this.initializationPromise = this.initializeWebGPU();
        }

        /**
         * Initialize WebGPU adapter and device
         */
        async initializeWebGPU() {
            if (!navigator.gpu) {
                throw new Error('WebGPU not supported');
            }

            this.webgpuAdapter = await navigator.gpu.requestAdapter();
            if (!this.webgpuAdapter) {
                throw new Error('No WebGPU adapter found');
            }

            this.webgpuDevice = await this.webgpuAdapter.requestDevice();
            this.webgpuDevice.lost.then(() => {
                this.deviceLost = true;
                this.useWebGPU = false;
            });

            this.useWebGPU = true;
            await this.setupWebGPUCompute();
        }

        /**
         * Setup WebGPU compute pipeline
         */
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

        /**
         * Generate WGSL compute shader for cellular automata evolution
         * @returns {string} WGSL compute shader source code
         */
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

        /**
         * Setup storage buffers for input/output cellular automata grids
         */
        setupStorageBuffers() {
            this.cleanupStorageBuffers();

            const bufferSize = this.cols * 4; // 4 bytes per u32

            this.inputBuffer = this.webgpuDevice.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
            });

            this.outputBuffer = this.webgpuDevice.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
            });

            this.readBuffer = this.webgpuDevice.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            });

            this.uniformBuffer = this.webgpuDevice.createBuffer({
                size: 48, // 12 u32 values = 48 bytes
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
        }

        /**
         * Setup bind group for compute shader resources
         */
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

        /**
         * Convert rule number to binary array for GPU uniform
         * @param {number} ruleNumber - Elementary CA rule number (0-255)
         * @returns {Uint32Array} Rule lookup table as 32-bit integers
         */
        convertRuleToGPUFormat(ruleNumber) {
            const rule = new Uint32Array(8);
            for (let i = 0; i < 8; i++) {
                rule[i] = (ruleNumber >> i) & 1;
            }
            return rule;
        }

        /**
         * Update GPU uniforms with current rule and grid size
         * @param {number} ruleNumber - Elementary CA rule number
         */
        updateGPUUniforms(ruleNumber) {
            const rule = this.convertRuleToGPUFormat(ruleNumber);
            const uniformData = new Uint32Array(12);
            uniformData.set(rule, 0);
            uniformData[8] = this.cols;
            this.webgpuDevice.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
        }

        /**
         * Upload cellular automata grid data to GPU
         * @param {Array} gridData - Current generation grid data
         */
        uploadGridToGPU(gridData) {
            const gpuData = new Uint32Array(gridData);
            this.webgpuDevice.queue.writeBuffer(this.inputBuffer, 0, gpuData);
        }

        /**
         * Execute compute shader to calculate next generation
         * @returns {Promise<Uint32Array>} Next generation grid data
         */
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
                if (this.readBuffer.mapState !== 'unmapped') {
                    this.readBuffer.unmap();
                }
            }
        }

        // CPU fallback removed - WebGPU should work or fail completely

        /**
         * Clean up storage buffers
         */
        cleanupStorageBuffers() {
            if (this.readBuffer?.mapState !== 'unmapped') {
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

        /**
         * Clean up WebGPU resources
         */
        cleanupWebGPU() {
            this.cleanupStorageBuffers();
            this.computePipeline = null;
            this.webgpuDevice = null;
            this.webgpuAdapter = null;
        }

        /**
         * Override cleanup to include WebGPU resource cleanup
         */
        cleanup() {
            super.cleanup();
            this.cleanupWebGPU();
            if (this.performanceMonitor) {
                this.performanceMonitor.cleanup();
            }
        }

        /**
         * Override initAnimation to setup GPU buffers
         */
        initAnimation() {
            super.initAnimation();
            if (this.useWebGPU && this.cols > 0) {
                this.setupStorageBuffers();
                this.setupBindGroup();
            }
        }

        /**
         * Ensure GPU buffers are created when needed
         */
        ensureGPUBuffers() {
            if (!this.inputBuffer) {
                this.setupStorageBuffers();
                this.setupBindGroup();
            }
        }

    }

    // Performance monitoring is now handled by shared CAPerformanceMonitor utility

    /**
     * WebGPU Background Cellular Automata - Rule 30 with GPU acceleration
     */
    class WebGPUBackgroundCellularAutomata extends WebGPUCellularAutomataCanvas {
        constructor(canvasId = 'cellular-automata-bg') {
            super(canvasId, 3, { animationSpeed: 200 });
            if (!this.canvas) {
                return;
            }

            // Use shared utilities
            this.ruleNumber = 30;
            this.rule = CellularAutomataRules.getRule(this.ruleNumber);
            this.stateManager = new AnimationStateManager(this.cols, this.rows);
            this.animatingGPU = false; // Prevent concurrent GPU animations

            // Initialize when WebGPU is ready
            this.initializationPromise.then(() => {
                this.initializeForRule(this.ruleNumber).then(() => {
                    this.startAnimation();
                });
            }).catch(error => {
                console.error('WebGPU background initialization failed:', error);
            });
        }

        initializeForRule(ruleNumber) {
            this.ruleNumber = ruleNumber;
            this.ensureGPUBuffers();
            this.updateGPUUniforms(ruleNumber);
        }

        applyRule(left, center, right) {
            return CellularAutomataRules.applyRule(left, center, right, this.rule);
        }

        async animate() {
            const startTime = performance.now();
            await this.animateWithGPU();
            const endTime = performance.now();
            this.performanceMonitor.measureFrame(endTime - startTime);
        }

        async animateWithGPU() {
            // Prevent concurrent GPU animations
            if (this.animatingGPU) return;
            this.animatingGPU = true;

            try {
                // Only clear if starting over
                if (this.stateManager.currentRow === 0) {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.stateManager.drawnRows.length = 0;

                    // Upload initial grid to GPU
                    this.uploadGridToGPU(this.stateManager.grid);
                }

                // Store current row for rendering
                this.stateManager.storeCurrentGeneration();

                // Use shared renderer
                CellularAutomataRenderer.renderBackgroundRows(
                    this.ctx,
                    this.stateManager.drawnRows,
                    this.cols,
                    this.stateManager.currentRow,
                    this.cellSize,
                    this.offsetX,
                    this.offsetY
                );

                // Calculate next generation using GPU
                if (!this.stateManager.isAnimationComplete()) {
                    const nextGrid = await this.computeNextGenerationGPU();
                    this.stateManager.grid = Array.from(nextGrid);
                    this.stateManager.currentRow++;
                    
                    // Keep compatibility
                    this.grid = this.stateManager.grid;
                    this.currentRow = this.stateManager.currentRow;
                }
            } finally {
                this.animatingGPU = false;
            }
        }

        // CPU animation removed - WebGPU only

        // Override initAnimation to update state manager
        initAnimation() {
            super.initAnimation();
            if (this.stateManager) {
                this.stateManager.updateDimensions(this.cols, this.rows);
            }
        }
    }

    /**
     * WebGPU Header Cellular Automata - Multiple rules with GPU acceleration
     */
    class WebGPUHeaderCellularAutomata extends WebGPUCellularAutomataCanvas {
        constructor(canvasId = 'header-cellular-automata') {
            super(canvasId, 3, {
                animationSpeed: 200,
                parentElement: true,
                resizeDebounce: 250
            });

            if (!this.canvas) {
                return;
            }

            // Use shared utilities
            this.currentRuleNumber = CellularAutomataRules.getRandomRule();
            this.currentRule = CellularAutomataRules.getRule(this.currentRuleNumber);
            this.stateManager = new AnimationStateManager(this.cols, this.rows);
            this.breathingEffect = new BreathingEffect();
            // Guard timer to prevent multiple queued rule changes
            this.nextRuleTimer = null;
            this.animatingGPU = false; // Prevent concurrent GPU animations

            // Update global rule name for indicator
            if (typeof window !== 'undefined') {
                if ('headerRuleName' in window) {
                    window.headerRuleName = this.currentRuleNumber.toString();
                }
                
                // Update rule indicator with initial rule
                if (window.RuleIndicators) {
                    window.RuleIndicators.update('header', this.currentRuleNumber);
                }
            }

            // Wait for WebGPU initialization before starting
            this.initializationPromise.then(() => {
                this.initializeForRule(this.currentRuleNumber);
                this.startAnimation();
            }).catch(error => {
                console.error('WebGPU header initialization failed:', error);
            });
        }

        initializeForRule(ruleNumber) {
            this.currentRuleNumber = ruleNumber;
            this.ensureGPUBuffers();
            this.updateGPUUniforms(ruleNumber);
        }

        applyRule(left, center, right) {
            return CellularAutomataRules.applyRule(left, center, right, this.currentRule);
        }

        async cycleToNextRule() {
            // Use shared utility to get different random rule
            this.currentRuleNumber = CellularAutomataRules.getRandomRule(this.currentRuleNumber);
            this.currentRule = CellularAutomataRules.getRule(this.currentRuleNumber);

            // Update UI with VFX
            if (typeof window !== 'undefined') {
                if ('headerRuleName' in window) {
                    window.headerRuleName = this.currentRuleNumber.toString();
                }
                if (window.APP && window.APP.CellularAutomata && window.APP.CellularAutomata.updateHeaderRuleIndicatorWithVFX) {
                    window.APP.CellularAutomata.updateHeaderRuleIndicatorWithVFX(this.currentRuleNumber.toString());
                } else if (window.RuleIndicators) {
                    window.RuleIndicators.update('header', this.currentRuleNumber);
                }
            }

            // Reset animation state using shared utilities
            this.initAnimation();
            this.stateManager.reset();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Re-initialize GPU resources for new rule
            if (this.useWebGPU && this.webgpuDevice) {
                await this.webgpuDevice.queue.onSubmittedWorkDone();
                this.cleanupStorageBuffers();

                if (!this.webgpuDevice || this.deviceLost) {
                    throw new Error('WebGPU device not available or lost');
                }

                this.setupStorageBuffers();
                this.setupBindGroup();
                this.updateGPUUniforms(this.currentRuleNumber);
            }
        }

        async animate() {
            const startTime = performance.now();

            // Update breathing effect using shared utility
            this.breathingEffect.update();

            // Use GPU acceleration - no CPU fallback
            if (this.useWebGPU && this.computePipeline) {
                await this.animateWithGPU();
            } else {
                throw new Error('WebGPU compute pipeline not available');
            }

            const endTime = performance.now();
            this.performanceMonitor.measureFrame(endTime - startTime);
        }

        async animateWithGPU() {
            if (this.animatingGPU) return;
            this.animatingGPU = true;

            try {
                // If animation has reached the end, cycle to the next rule
                if (this.stateManager.isAnimationComplete()) {
                    await new Promise(resolve => setTimeout(resolve, 1800)); // Preserve delay
                    await this.cycleToNextRule();
                }

                // Check if WebGPU is still available after potential cycling
                if (!this.useWebGPU || !this.webgpuDevice || this.recreatingResources) {
                    throw new Error('WebGPU not available or resources are being recreated');
                }

                // On the first row of a new animation, clear canvas and upload initial grid
                if (this.stateManager.currentRow === 0) {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.stateManager.drawnRows.length = 0;
                    this.uploadGridToGPU(this.stateManager.grid);
                }

                // Store current row for rendering
                this.stateManager.storeCurrentGeneration();

                // Use shared renderer with breathing effect
                const currentAlpha = this.breathingEffect.getCurrentAlpha();
                CellularAutomataRenderer.renderHeaderRows(
                    this.ctx,
                    this.stateManager.drawnRows,
                    this.cols,
                    this.stateManager.currentRow,
                    this.cellSize,
                    currentAlpha,
                    this.offsetX,
                    this.offsetY
                );

                // Calculate next generation using GPU
                const nextGrid = await this.computeNextGenerationGPU();
                this.stateManager.grid = Array.from(nextGrid);
                this.stateManager.currentRow++;
                
                // Keep compatibility
                this.grid = this.stateManager.grid;
                this.currentRow = this.stateManager.currentRow;

            } catch (error) {
                console.error('GPU animation failed:', error);
                throw error; // Don't fallback to CPU
            } finally {
                this.animatingGPU = false;
            }
        }

        // CPU animation removed - WebGPU only

        // Override initAnimation to update state manager
        initAnimation() {
            super.initAnimation();
            if (this.stateManager) {
                this.stateManager.updateDimensions(this.cols, this.rows);
            }
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
        WebGPUBackgroundCellularAutomata,
        WebGPUHeaderCellularAutomata,
        initWebGPUCellularAutomataBackground,
        initWebGPUHeaderCellularAutomata
    };

    // Backward compatibility - expose to global scope
    window.WebGPUCellularAutomataCanvas = WebGPUCellularAutomataCanvas;
    window.initWebGPUCellularAutomataBackground = initWebGPUCellularAutomataBackground;
    window.initWebGPUHeaderCellularAutomata = initWebGPUHeaderCellularAutomata;

})(window.APP);
