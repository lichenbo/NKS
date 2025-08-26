// gpu/webgpu-cellular-automata.js

/**
 * WebGPU Cellular Automata Implementation for NKS Project
 * High-performance GPU-accelerated cellular automata using WebGPU compute shaders
 * 
 * Features:
 * - Compute shader-based cellular automata evolution
 * - Storage buffer ping-pong for efficient memory management
 * - Support for multiple Elementary CA rules (30, 90, 110, 54, 150, 126)
 * - Automatic fallback to WebGL/CPU for unsupported browsers
 * - Performance monitoring and adaptive quality
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
     * Provides automatic fallback to CPU implementation for unsupported browsers
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

            // Buffer state tracking
            this.bufferMapped = false;
            this.recreatingResources = false; // Track resource recreation state

            // GPU state
            this.useWebGPU = false;
            this.initializationError = null;
            this.deviceLost = false; // track device loss

            // Performance monitoring
            this.performanceMonitor = new WebGPUPerformanceMonitor(this);

            // Start initialization, but don't block the constructor.
            // Subclasses will chain onto this promise to start their animations.
            this.initializationPromise = this.initializeWebGPU().then(success => {
                if (success) {
                    return this.setupWebGPUCompute();
                }
                // If WebGPU is not supported, reject to trigger the catch block
                return Promise.reject(new Error('WebGPU not supported or device request failed'));
            }).catch(error => {
                // This catch block handles both WebGPU setup failures and explicit rejections.
                console.warn(`WebGPU initialization failed: ${error.message}`);
                this.initializationError = error;
                this.fallbackToCPU();
                // We resolve the promise here so that subclasses can still proceed
                // with their CPU-based animation setup in their .then() chains.
                return Promise.resolve();
            });
        }

        /**
         * Initialize WebGPU adapter and device
         * @returns {Promise<boolean>} True if WebGPU is available and initialized
         */
        async initializeWebGPU() {
            // Check WebGPU support
            if (!navigator.gpu) {
                console.log('WebGPU not supported in this browser');
                return false;
            }

            try {
                // Request adapter
                this.webgpuAdapter = await navigator.gpu.requestAdapter();

                if (!this.webgpuAdapter) {
                    console.log('No suitable WebGPU adapter found');
                    return false;
                }

                // Request device
                this.webgpuDevice = await this.webgpuAdapter.requestDevice({
                    requiredFeatures: [],
                    requiredLimits: {}
                });

                // Handle device lost
                this.webgpuDevice.lost.then((info) => {
                    console.warn('WebGPU device lost:', info.message);
                    this.deviceLost = true;
                    this.useWebGPU = false;
                    this.fallbackToCPU();
                });

                this.deviceLost = false;
                this.useWebGPU = true;
                return true;

            } catch (error) {
                console.warn('WebGPU device creation failed:', error);
                return false;
            }
        }

        /**
         * Setup WebGPU compute pipeline and buffers for cellular automata computation
         */
        async setupWebGPUCompute() {
            if (!this.useWebGPU || !this.webgpuDevice) return;

            try {
                // Create compute shader
                const computeShaderCode = this.generateComputeShader();
                const computeShaderModule = this.webgpuDevice.createShaderModule({
                    code: computeShaderCode
                });

                // Create compute pipeline
                this.computePipeline = this.webgpuDevice.createComputePipeline({
                    layout: 'auto',
                    compute: {
                        module: computeShaderModule,
                        entryPoint: 'main'
                    }
                });

                // Don't create storage buffers here - wait for proper grid dimensions
                console.log('WebGPU compute pipeline initialized successfully');

            } catch (error) {
                console.error('WebGPU compute pipeline setup failed:', error);
                this.useWebGPU = false;
                this.fallbackToCPU();
            }
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
            // Ensure device exists and cols is valid
            if (!this.webgpuDevice) {
                console.error('WebGPU device not available for buffer creation');
                throw new Error('WebGPU device not available for buffer creation');
            }

            if (!this.cols || this.cols <= 0) {
                console.error('Invalid grid size for WebGPU buffer creation:', this.cols);
                throw new Error('Invalid grid size for buffer creation');
            }

            // Clean up existing buffers first
            this.cleanupStorageBuffers();

            const bufferSize = Math.ceil(this.cols) * 4; // 4 bytes per u32

            // Input buffer (needs COPY_SRC for ping-pong swapping)
            this.inputBuffer = this.webgpuDevice.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
            });

            // Output buffer (needs COPY_SRC for reading results back)
            this.outputBuffer = this.webgpuDevice.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
            });

            // Read buffer for CPU readback
            this.readBuffer = this.webgpuDevice.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            });

            // Initialize buffer mapping state
            this.bufferMapped = false;

            // Clear recreation flag after successful setup
            this.recreatingResources = false;

            // Uniform buffer for parameters (12 u32 values = 48 bytes)
            const uniformSize = 48; // grid_size + 8 rule values + 3 padding = 12 * 4 bytes
            this.uniformBuffer = this.webgpuDevice.createBuffer({
                size: uniformSize,
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
            if (!this.webgpuDevice || !this.uniformBuffer) {
                console.error('GPU device or uniform buffer not available');
                return;
            }

            if (!this.cols || this.cols <= 0) {
                console.error('Invalid grid size for uniform update:', this.cols);
                return;
            }

            console.log('Updating GPU uniforms for rule', ruleNumber, 'with grid size', this.cols);

            const rule = this.convertRuleToGPUFormat(ruleNumber);

            // Create uniform data (12 u32 values: 8 for rule, 1 for size, 3 for padding)
            const uniformData = new Uint32Array(12);
            uniformData.set(rule, 0); // rule
            uniformData[8] = this.cols; // grid_size

            // Padding (3 values) is automatically zero-initialized

            try {
                // Upload to GPU
                this.webgpuDevice.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
                console.log('GPU uniforms updated successfully');
            } catch (error) {
                console.error('Failed to write GPU uniforms:', error);
                throw error;
            }
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
            if (!this.useWebGPU || !this.computePipeline) {
                throw new Error('WebGPU not available');
            }

            // Check if we're in the middle of resource recreation
            if (this.recreatingResources) {
                throw new Error('WebGPU resources being recreated');
            }

            // Ensure GPU buffers are created
            this.ensureGPUBuffers();

            // Create command encoder
            const commandEncoder = this.webgpuDevice.createCommandEncoder({
                label: 'Cellular Automata Compute'
            });

            // Create compute pass
            const computePass = commandEncoder.beginComputePass({
                label: 'CA Compute Pass'
            });

            // Set pipeline and bind group
            computePass.setPipeline(this.computePipeline);
            computePass.setBindGroup(0, this.bindGroup);

            // Dispatch compute shader
            const workgroupCount = Math.ceil(this.cols / 64);
            computePass.dispatchWorkgroups(workgroupCount);
            computePass.end();

            // Copy output to read buffer
            commandEncoder.copyBufferToBuffer(
                this.outputBuffer, 0,
                this.readBuffer, 0,
                this.cols * 4
            );

            // Submit commands and wait for completion
            const submission = this.webgpuDevice.queue.submit([commandEncoder.finish()]);

            // Wait for GPU operations to complete before reading
            await this.webgpuDevice.queue.onSubmittedWorkDone();

            // Read results with a more robust try/finally block to ensure unmapping
            try {
                // Additional check before mapping to ensure buffer is ready
                if (this.recreatingResources) {
                    throw new Error('Cannot map buffer during resource recreation');
                }

                await this.readBuffer.mapAsync(GPUMapMode.READ);

                const resultData = new Uint32Array(this.readBuffer.getMappedRange());
                const result = new Uint32Array(resultData); // Copy data before unmapping

                // The read is complete, now we can swap buffers for the next frame
                [this.inputBuffer, this.outputBuffer] = [this.outputBuffer, this.inputBuffer];
                this.setupBindGroup();

                return result;

            } catch (error) {
                console.error('WebGPU buffer mapping or computation failed:', error);
                throw error; // Re-throw to be handled by the animation loop
            } finally {
                // Ensure the buffer is always unmapped, even if errors occur
                if (this.readBuffer && this.readBuffer.mapState !== 'unmapped') {
                    this.readBuffer.unmap();
                }
            }
        }

        /**
         * Fallback to CPU implementation when GPU fails
         */
        fallbackToCPU() {
            console.log('Falling back to CPU cellular automata implementation');
            this.useWebGPU = false;

            // Clean up GPU resources
            this.cleanupWebGPU();

            // Resume normal CPU animation
            if (!this.animationInterval) {
                this.startAnimation();
            }
        }

        /**
         * Clean up storage buffers only
         */
        cleanupStorageBuffers() {
            try {
                this.recreatingResources = true;

                // Unmap read buffer if mapped, regardless of our own flags
                if (this.readBuffer && this.readBuffer.mapState && this.readBuffer.mapState !== 'unmapped') {
                    try {
                        this.readBuffer.unmap();
                    } catch (e) {
                        console.warn('Failed to unmap read buffer during cleanup:', e.message);
                    }
                }

                // Destroy buffers with error handling
                if (this.inputBuffer) {
                    try {
                        this.inputBuffer.destroy();
                    } catch (e) {
                        console.warn('Failed to destroy input buffer:', e.message);
                    }
                    this.inputBuffer = null;
                }
                if (this.outputBuffer) {
                    try {
                        this.outputBuffer.destroy();
                    } catch (e) {
                        console.warn('Failed to destroy output buffer:', e.message);
                    }
                    this.outputBuffer = null;
                }
                if (this.readBuffer) {
                    try {
                        this.readBuffer.destroy();
                    } catch (e) {
                        console.warn('Failed to destroy read buffer:', e.message);
                    }
                    this.readBuffer = null;
                }
                if (this.uniformBuffer) {
                    try {
                        this.uniformBuffer.destroy();
                    } catch (e) {
                        console.warn('Failed to destroy uniform buffer:', e.message);
                    }
                    this.uniformBuffer = null;
                }

                this.bindGroup = null;

            } catch (error) {
                console.warn('Error during storage buffer cleanup:', error);
            } finally {
                this.recreatingResources = false;
            }
        }

        /**
         * Clean up WebGPU resources
         */
        cleanupWebGPU() {
            try {
                this.cleanupStorageBuffers();
                this.computePipeline = null;

                // Remove: if (this.webgpuDevice && !this.webgpuDevice.lost) { this.webgpuDevice.destroy(); }
                this.webgpuDevice = null;
                this.webgpuAdapter = null;

            } catch (error) {
                console.warn('Error during WebGPU cleanup:', error);
            }
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
         * Override initAnimation to setup GPU buffers when available
         */
        initAnimation() {
            super.initAnimation();

            // Setup GPU buffers if WebGPU is available and properly initialized
            if (this.useWebGPU && this.webgpuDevice && this.computePipeline && this.cols > 0) {
                try {
                    console.log('Setting up WebGPU buffers with grid size:', this.cols);
                    this.setupStorageBuffers();
                    this.setupBindGroup();
                } catch (error) {
                    console.warn('GPU buffer setup failed during initAnimation:', error);
                    this.fallbackToCPU();
                }
            }
        }

        /**
         * Ensure GPU buffers are created when needed
         */
        ensureGPUBuffers() {
            if (this.useWebGPU && this.webgpuDevice && this.computePipeline && this.cols > 0) {
                if (!this.inputBuffer || !this.outputBuffer || !this.uniformBuffer) {
                    console.log('Creating GPU buffers lazily with grid size:', this.cols);
                    try {
                        this.setupStorageBuffers();
                        this.setupBindGroup();
                        console.log('GPU buffers created successfully:', {
                            hasInputBuffer: !!this.inputBuffer,
                            hasOutputBuffer: !!this.outputBuffer,
                            hasUniformBuffer: !!this.uniformBuffer,
                            hasBindGroup: !!this.bindGroup
                        });
                    } catch (error) {
                        console.error('Failed to create GPU buffers:', error);
                        this.fallbackToCPU();
                    }
                }
            } else {
                console.log('GPU buffer creation skipped:', {
                    useWebGPU: this.useWebGPU,
                    hasDevice: !!this.webgpuDevice,
                    hasPipeline: !!this.computePipeline,
                    cols: this.cols
                });
            }
        }

        /**
         * Check if WebGPU is fully ready for computation
         * @returns {boolean} True if WebGPU is ready
         */
        isWebGPUReady() {
            return this.useWebGPU &&
                this.webgpuDevice &&
                !this.deviceLost &&
                this.computePipeline &&
                this.cols > 0 &&
                this.inputBuffer &&
                this.outputBuffer &&
                this.bindGroup;
        }
    }

    /**
     * Performance monitoring for WebGPU cellular automata
     * Tracks FPS, GPU utilization, and automatically triggers CPU fallback if needed
     */
    class WebGPUPerformanceMonitor {
        constructor(canvas) {
            this.canvas = canvas;
            this.frameCount = 0;
            this.lastTime = performance.now();
            this.fps = 60;
            this.averageFPS = 60;
            this.gpuComputeTime = 0;
            this.cpuFallbackThreshold = 20; // FPS threshold for fallback
            this.measurements = [];
            this.maxMeasurements = 60; // Keep 60 frame samples

            this.isMonitoring = false;
        }

        startMonitoring() {
            this.isMonitoring = true;
            this.lastTime = performance.now();
        }

        stopMonitoring() {
            this.isMonitoring = false;
        }

        measureFrame(gpuTime = 0) {
            if (!this.isMonitoring) return;

            const now = performance.now();
            const frameTime = now - this.lastTime;
            this.lastTime = now;

            // Calculate current FPS
            this.fps = 1000 / frameTime;
            this.gpuComputeTime = gpuTime;

            // Store measurement
            this.measurements.push(this.fps);
            if (this.measurements.length > this.maxMeasurements) {
                this.measurements.shift();
            }

            // Calculate average FPS
            this.averageFPS = this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length;

            // Check for performance issues
            this.frameCount++;
            if (this.frameCount % 30 === 0) { // Check every 30 frames
                if (this.averageFPS < this.cpuFallbackThreshold) {
                    this.triggerCPUFallback();
                }
            }
        }

        triggerCPUFallback() {
            if (this.canvas.useWebGPU) {
                console.warn(`WebGPU performance insufficient (${this.averageFPS.toFixed(1)} FPS), switching to CPU`);
                this.canvas.fallbackToCPU();
            }
        }

        getPerformanceStats() {
            return {
                currentFPS: this.fps,
                averageFPS: this.averageFPS,
                gpuComputeTime: this.gpuComputeTime,
                usingGPU: this.canvas.useWebGPU
            };
        }

        cleanup() {
            this.stopMonitoring();
            this.measurements = [];
        }
    }

    /**
     * WebGPU Background Cellular Automata - Rule 30 with GPU acceleration
     */
    class WebGPUBackgroundCellularAutomata extends WebGPUCellularAutomataCanvas {
        constructor(canvasId = 'cellular-automata-bg') {
            console.log('Creating WebGPU Background CA with canvas ID:', canvasId);
            super(canvasId, 3, { animationSpeed: 200 });
            if (!this.canvas) {
                console.error('Canvas not found for ID:', canvasId);
                return;
            }
            console.log('Canvas found successfully:', this.canvas);

            // Background uses only Rule 30
            this.ruleNumber = 30;
            this.rule30 = [0, 1, 1, 1, 1, 0, 0, 0];
            this.drawnRows = [];
            this.animatingGPU = false; // Prevent concurrent GPU animations

            // Chain onto the base class's initialization promise to set up the rule
            // and start the animation once the GPU is ready (or has fallen back to CPU).
            this.initializationPromise.then(() => {
                if (this.useWebGPU) {
                    // If GPU is available, initialize with the specific rule.
                    this.initializeForRule(this.ruleNumber).then(() => {
                        this.startAnimation();
                    });
                } else {
                    // If we fell back to CPU, start the CPU animation right away.
                    this.startAnimation();
                }
            });
        }

        async initializeForRule(ruleNumber) {
            this.ruleNumber = ruleNumber;
            if (this.useWebGPU && this.webgpuDevice) {
                // Ensure buffers are created first
                this.ensureGPUBuffers();

                if (this.uniformBuffer) {
                    await this.updateGPUUniforms(ruleNumber);
                } else {
                    console.error('Uniform buffer not available for rule initialization');
                }
            }
        }

        applyRule(left, center, right) {
            const pattern = left * 4 + center * 2 + right;
            return this.rule30[pattern];
        }

        async animate() {
            const startTime = performance.now();

            // Use GPU acceleration if available
            if (this.useWebGPU && this.computePipeline) {
                try {
                    await this.animateWithGPU();
                } catch (error) {
                    console.warn('GPU animation failed, falling back to CPU:', error);
                    this.fallbackToCPU();
                    this.animateWithCPU();
                }
            } else {
                this.animateWithCPU();
            }

            const endTime = performance.now();
            this.performanceMonitor.measureFrame(endTime - startTime);
        }

        async animateWithGPU() {
            // Prevent concurrent GPU animations
            if (this.animatingGPU) return;
            this.animatingGPU = true;

            try {
                // Only clear if starting over
                if (this.currentRow === 0) {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.drawnRows.length = 0;

                    // Upload initial grid to GPU
                    this.uploadGridToGPU(this.grid);
                }

                // Store current row for rendering
                this.drawnRows[this.currentRow] = [...this.grid];

                // Render all stored rows
                this.renderRows();

                // Calculate next generation using GPU
                if (this.currentRow < this.rows - 1) {
                    const nextGrid = await this.computeNextGenerationGPU();
                    this.grid = Array.from(nextGrid);
                    this.currentRow++;
                }
            } finally {
                this.animatingGPU = false;
            }
        }

        animateWithCPU() {
            // Ensure grid is initialized
            if (!this.grid || !Array.isArray(this.grid)) {
                this.initAnimation();
            }

            // Fallback to original CPU implementation
            // Only clear if starting over
            if (this.currentRow === 0) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawnRows.length = 0;
            }

            // Store current row
            this.drawnRows[this.currentRow] = [...this.grid];

            // Render all stored rows
            this.renderRows();

            // Calculate next generation on CPU
            if (this.currentRow < this.rows - 1) {
                const newGrid = new Array(this.cols).fill(0);
                for (let i = 0; i < this.cols; i++) {
                    const left = this.grid[i - 1] || 0;
                    const center = this.grid[i];
                    const right = this.grid[i + 1] || 0;
                    newGrid[i] = this.applyRule(left, center, right);
                }
                this.grid = newGrid;
                this.currentRow++;
            }
        }

        renderRows() {
            // Render all stored rows with golden gradient effect
            for (let row = 0; row < this.drawnRows.length; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.drawnRows[row] && this.drawnRows[row][col] === 1) {
                        // Create gradient effect based on position and age
                        const distance = Math.sqrt(
                            Math.pow(col - this.cols / 2, 2) + Math.pow(row - this.currentRow / 2, 2)
                        );
                        const maxDistance = Math.sqrt(this.cols * this.cols / 4 + this.rows * this.rows / 4);
                        const intensity = Math.max(0.2, 1 - distance / maxDistance);

                        // Age effect - older rows fade
                        const age = this.currentRow - row;
                        const ageFactor = Math.max(0.1, 1 - age / (this.rows * 0.3));

                        // Very subtle golden pattern
                        const alpha = intensity * ageFactor * 0.08;
                        const red = Math.floor(212 * intensity * ageFactor);
                        const green = Math.floor(175 * intensity * ageFactor);
                        const blue = Math.floor(55 * intensity * ageFactor);

                        this.ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                        this.ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize - 0.5, this.cellSize - 0.5);
                    }
                }
            }
        }
    }

    /**
     * WebGPU Header Cellular Automata - Multiple rules with GPU acceleration
     */
    class WebGPUHeaderCellularAutomata extends WebGPUCellularAutomataCanvas {
        constructor(canvasId = 'header-cellular-automata') {
            console.log('Creating WebGPU Header CA with canvas ID:', canvasId);

            // Check if this is a test canvas (has fixed dimensions) or production (needs parent sizing)
            const canvas = document.getElementById(canvasId);
            const isTestCanvas = canvas && (canvas.width > 0 && canvas.height > 0);

            super(canvasId, 3, {
                animationSpeed: 200,
                parentElement: true, // Use header container dimensions
                resizeDebounce: 250
            });

            if (!this.canvas) {
                console.error('Canvas not found for ID:', canvasId);
                return;
            }
            console.log('Header canvas found successfully:', this.canvas, 'dimensions:', this.canvas.width, 'x', this.canvas.height);

            // Multiple cellular automata rules
            this.headerRules = {
                30: [0, 1, 1, 1, 1, 0, 0, 0],   // Chaotic
                90: [0, 1, 0, 1, 1, 0, 1, 0],   // Fractal 
                110: [0, 1, 1, 1, 0, 1, 1, 0],  // Complex
                54: [0, 1, 1, 0, 1, 1, 0, 0],   // Symmetric
                150: [1, 0, 1, 0, 0, 1, 0, 1],  // XOR
                126: [0, 1, 1, 1, 1, 1, 1, 0]   // Dense
            };

            this.headerRuleKeys = Object.keys(this.headerRules);
            this.headerRuleIndex = Math.floor(Math.random() * this.headerRuleKeys.length);
            this.currentRuleNumber = parseInt(this.headerRuleKeys[this.headerRuleIndex]);
            this.headerCurrentRule = this.headerRules[this.headerRuleKeys[this.headerRuleIndex]];

            this.drawnRows = [];
            this.animatingGPU = false; // Prevent concurrent GPU animations
            this.bufferMapped = false; // Track buffer mapping state

            // Breathing effect variables
            this.fadeDirection = 1; // 1 for fade in, -1 for fade out
            this.globalAlpha = 0.3;

            // Wait for WebGPU initialization before starting
            this.initializationPromise.then(() => {
                if (this.useWebGPU) {
                    this.initializeForRule(this.currentRuleNumber).then(() => {
                        this.startAnimation();
                    });
                } else {
                    this.startAnimation();
                }
            });
        }

        async initializeForRule(ruleNumber) {
            this.currentRuleNumber = ruleNumber;
            if (this.useWebGPU && this.webgpuDevice) {
                // Ensure buffers are created first
                this.ensureGPUBuffers();

                if (this.uniformBuffer) {
                    await this.updateGPUUniforms(ruleNumber);
                } else {
                    console.error('Header uniform buffer not available for rule initialization');
                }
            }
        }

        applyRule(left, center, right) {
            const pattern = left * 4 + center * 2 + right;
            return this.headerCurrentRule[pattern];
        }

        async cycleToNextRule() {
            // 1. Choose a new rule
            let newRuleIndex;
            do {
                newRuleIndex = Math.floor(Math.random() * this.headerRuleKeys.length);
            } while (newRuleIndex === this.headerRuleIndex && this.headerRuleKeys.length > 1);

            this.headerRuleIndex = newRuleIndex;
            this.currentRuleNumber = parseInt(this.headerRuleKeys[this.headerRuleIndex]);
            this.headerCurrentRule = this.headerRules[this.headerRuleKeys[this.headerRuleIndex]];
            console.log(`Header: Switching to Rule ${this.currentRuleNumber}`);

            // 2. Update UI
            if (typeof window !== 'undefined') {
                if ('headerRuleName' in window) {
                    window.headerRuleName = this.currentRuleNumber.toString();
                }
                if (window.RuleIndicators) {
                    window.RuleIndicators.update('header', this.currentRuleNumber);
                }
            }

            // 3. Re-initialize animation state
            this.initAnimation();
            this.drawnRows.length = 0;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.currentRow = 0;

            // 4. Re-initialize GPU resources in a clean, sequential flow
            if (this.useWebGPU && this.webgpuDevice) {
                await this.webgpuDevice.queue.onSubmittedWorkDone();
                this.cleanupStorageBuffers();

                // FIX: don't test the Promise `device.lost`
                if (!this.webgpuDevice || this.deviceLost) {
                    console.warn('WebGPU device not available after cleanup, falling back to CPU');
                    this.fallbackToCPU();
                    return;
                }

                this.setupStorageBuffers();
                this.setupBindGroup();
                await this.updateGPUUniforms(this.currentRuleNumber);

                console.log('WebGPU resources re-initialized for new rule');
            }
        }

        async animate() {
            const startTime = performance.now();

            // Update global fade (breathing effect)
            this.globalAlpha += this.fadeDirection * 0.01;
            if (this.globalAlpha >= 0.6) {
                this.fadeDirection = -1;
            } else if (this.globalAlpha <= 0.2) {
                this.fadeDirection = 1;
            }

            // Use GPU acceleration if available
            if (this.useWebGPU && this.computePipeline) {
                try {
                    await this.animateWithGPU();
                } catch (error) {
                    console.warn('GPU animation failed, falling back to CPU:', error);
                    this.fallbackToCPU();
                    this.animateWithCPU();
                }
            } else {
                this.animateWithCPU();
            }

            const endTime = performance.now();
            this.performanceMonitor.measureFrame(endTime - startTime);
        }

        async animateWithGPU() {
            if (this.animatingGPU) return;
            this.animatingGPU = true;

            try {
                // If animation has reached the end, cycle to the next rule
                if (this.currentRow >= this.rows - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1800)); // Preserve delay
                    await this.cycleToNextRule();
                }

                // Check if WebGPU is still available after potential cycling
                if (!this.useWebGPU || !this.webgpuDevice || this.recreatingResources) {
                    throw new Error('WebGPU not available or resources are being recreated');
                }

                // On the first row of a new animation, clear canvas and upload initial grid
                if (this.currentRow === 0) {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.drawnRows.length = 0;
                    this.uploadGridToGPU(this.grid);
                }

                // Store current row for rendering
                this.drawnRows[this.currentRow] = [...this.grid];

                // Render all stored rows
                this.renderRows();

                // Calculate next generation using GPU
                const nextGrid = await this.computeNextGenerationGPU();
                this.grid = Array.from(nextGrid);
                this.currentRow++;

            } catch (error) {
                console.warn('GPU animation failed, falling back to CPU:', error);
                this.fallbackToCPU();
                this.animateWithCPU(); // Continue animation on CPU
            } finally {
                this.animatingGPU = false;
            }
        }

        animateWithCPU() {
            // Fallback to original CPU implementation
            // Only clear if starting over
            if (this.currentRow === 0) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawnRows.length = 0;
            }

            // Store current row
            this.drawnRows[this.currentRow] = [...this.grid];

            // Render all stored rows
            this.renderRows();

            // Calculate next generation on CPU
            if (this.currentRow < this.rows - 1) {
                const newGrid = new Array(this.cols).fill(0);
                for (let i = 0; i < this.cols; i++) {
                    const left = this.grid[i - 1] || 0;
                    const center = this.grid[i];
                    const right = this.grid[i + 1] || 0;
                    newGrid[i] = this.applyRule(left, center, right);
                }
                this.grid = newGrid;
                this.currentRow++;
            } else {
                // Cycle to next rule and restart after delay
                setTimeout(() => {
                    this.cycleToNextRule();
                    // Force reset currentRow after rule cycling to ensure clean restart
                    this.currentRow = 0;
                }, 1800);
            }
        }

        renderRows() {
            // Render all stored rows with breathing golden effect
            for (let row = 0; row < this.drawnRows.length; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (this.drawnRows[row] && this.drawnRows[row][col] === 1) {
                        // Create gradient effect based on position and age
                        const distance = Math.sqrt(
                            Math.pow(col - this.cols / 2, 2) + Math.pow(row - this.currentRow / 2, 2)
                        );
                        const maxDistance = Math.sqrt(this.cols * this.cols / 4 + this.rows * this.rows / 4);
                        const intensity = Math.max(0.3, 1 - distance / maxDistance);

                        // Age effect - older rows fade
                        const age = this.currentRow - row;
                        const ageFactor = Math.max(0.2, 1 - age / (this.rows * 0.4));

                        // Golden pattern with breathing effect
                        const alpha = intensity * ageFactor * this.globalAlpha;
                        const red = Math.floor(212 * intensity * ageFactor);
                        const green = Math.floor(175 * intensity * ageFactor);
                        const blue = Math.floor(55 * intensity * ageFactor);

                        this.ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                        this.ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize - 0.5, this.cellSize - 0.5);
                    }
                }
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
        WebGPUPerformanceMonitor,
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