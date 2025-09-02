/**
 * Unified Cellular Automata Implementation
 * Combines CPU/WebGL/WebGPU rendering with strategy pattern
 * Reduces code duplication while preserving all GPU acceleration features
 */

(function(window) {
    'use strict';

    // Import shared utilities
    const { CellularAutomataRules, AnimationStateManager, CAPerformanceMonitor, BreathingEffect, CellularAutomataRenderer } = window;

    /**
     * Base Compute Engine Interface
     */
    class ComputeEngine {
        constructor(canvas, options = {}) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.options = options;
            this.isInitialized = false;
        }

        async initialize() {
            this.isInitialized = true;
            return true;
        }

        computeNextGeneration(currentGrid, rule) {
            // Abstract method - must be implemented by subclasses
            console.warn('ComputeNextGeneration not implemented:', currentGrid, rule);
            return currentGrid;
        }

        renderToCanvas(grid, colors) {
            // Abstract method - must be implemented by subclasses
            console.warn('RenderToCanvas not implemented:', grid, colors);
        }

        cleanup() {
            // Default cleanup
        }

        getCapabilities() {
            return {
                type: 'base',
                maxGridSize: 1000,
                asyncCompute: false
            };
        }
    }

    /**
     * CPU Compute Engine - Pure JavaScript implementation
     */
    class CPUComputeEngine extends ComputeEngine {
        constructor(canvas, options = {}) {
            super(canvas, options);
            this.imageData = null;
        }

        async initialize() {
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.imageData = this.ctx.createImageData(this.width, this.height);
            await super.initialize();
            return true;
        }

        computeNextGeneration(currentGrid, rule) {
            const width = currentGrid.length;
            const nextGrid = new Uint8Array(width);
            
            for (let i = 0; i < width; i++) {
                const left = currentGrid[(i - 1 + width) % width];
                const center = currentGrid[i];
                const right = currentGrid[(i + 1) % width];
                
                const index = (left << 2) | (center << 1) | right;
                nextGrid[i] = (rule >> index) & 1;
            }
            
            return nextGrid;
        }

        renderToCanvas(grid, colors) {
            const data = this.imageData.data;
            const width = this.width;
            const height = this.height;
            const cellWidth = Math.ceil(width / grid.length);
            
            // Clear the image data
            data.fill(0);
            
            for (let x = 0; x < grid.length; x++) {
                if (grid[x] === 1) {
                    const startX = x * cellWidth;
                    const endX = Math.min(startX + cellWidth, width);
                    
                    for (let pixelX = startX; pixelX < endX; pixelX++) {
                        for (let y = 0; y < height; y++) {
                            const index = (y * width + pixelX) * 4;
                            data[index] = colors.r;     // Red
                            data[index + 1] = colors.g; // Green
                            data[index + 2] = colors.b; // Blue
                            data[index + 3] = colors.a; // Alpha
                        }
                    }
                }
            }
            
            this.ctx.putImageData(this.imageData, 0, 0);
        }

        getCapabilities() {
            return {
                type: 'cpu',
                maxGridSize: 2000,
                asyncCompute: false
            };
        }
    }

    /**
     * WebGL Compute Engine - Fragment shader acceleration
     */
    class WebGLComputeEngine extends ComputeEngine {
        constructor(canvas, options = {}) {
            super(canvas, options);
            this.gl = null;
            this.programs = {};
            this.textures = {};
            this.framebuffers = {};
        }

        async initialize() {
            this.gl = this.canvas.getContext('webgl2');
            if (!this.gl) {
                throw new Error('WebGL2 not supported');
            }

            await this._initializeShaders();
            await this._initializeTextures();
            await super.initialize();
            return true;
        }

        async _initializeShaders() {
            // Vertex shader for full-screen quad
            const vertexShaderSource = `#version 300 es
                in vec2 a_position;
                out vec2 v_texCoord;
                void main() {
                    gl_Position = vec4(a_position, 0.0, 1.0);
                    v_texCoord = (a_position + 1.0) * 0.5;
                }
            `;

            // Fragment shader for cellular automata computation
            const fragmentShaderSource = `#version 300 es
                precision highp float;
                uniform sampler2D u_currentState;
                uniform float u_rule;
                uniform vec2 u_resolution;
                in vec2 v_texCoord;
                out vec4 fragColor;
                
                void main() {
                    vec2 onePixel = 1.0 / u_resolution;
                    float left = texture(u_currentState, v_texCoord + vec2(-onePixel.x, 0.0)).r;
                    float center = texture(u_currentState, v_texCoord).r;
                    float right = texture(u_currentState, v_texCoord + vec2(onePixel.x, 0.0)).r;
                    
                    int index = int(left * 4.0 + center * 2.0 + right);
                    float result = mod(floor(u_rule / pow(2.0, float(index))), 2.0);
                    
                    fragColor = vec4(result, result, result, 1.0);
                }
            `;

            this.programs.compute = this._createProgram(vertexShaderSource, fragmentShaderSource);
        }

        async _initializeTextures() {
            const gl = this.gl;
            
            // Create ping-pong textures for computation
            this.textures.current = this._createTexture(this.canvas.width, this.canvas.height);
            this.textures.next = this._createTexture(this.canvas.width, this.canvas.height);
            
            // Create framebuffers
            this.framebuffers.current = this._createFramebuffer(this.textures.current);
            this.framebuffers.next = this._createFramebuffer(this.textures.next);
        }

        computeNextGeneration(currentGrid, rule) {
            const gl = this.gl;
            
            // Upload current grid to texture
            this._uploadGridToTexture(currentGrid, this.textures.current);
            
            // Set up computation
            gl.useProgram(this.programs.compute);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers.next);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            
            // Set uniforms
            gl.uniform1f(gl.getUniformLocation(this.programs.compute, 'u_rule'), rule);
            gl.uniform2f(gl.getUniformLocation(this.programs.compute, 'u_resolution'), 
                        this.canvas.width, this.canvas.height);
            
            // Bind input texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.textures.current);
            gl.uniform1i(gl.getUniformLocation(this.programs.compute, 'u_currentState'), 0);
            
            // Draw full-screen quad to trigger computation
            this._drawFullScreenQuad();
            
            // Read result back to grid
            const nextGrid = this._readTextureToGrid();
            
            // Swap textures for next iteration
            [this.textures.current, this.textures.next] = [this.textures.next, this.textures.current];
            [this.framebuffers.current, this.framebuffers.next] = [this.framebuffers.next, this.framebuffers.current];
            
            return nextGrid;
        }

        renderToCanvas(grid, colors) {
            const gl = this.gl;
            
            // Switch to default framebuffer for rendering
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            
            // Upload grid and render with colors
            this._uploadGridToTexture(grid, this.textures.current);
            this._renderWithColors(colors);
        }

        _createProgram(vertexSource, fragmentSource) {
            const gl = this.gl;
            const vertexShader = this._createShader(gl.VERTEX_SHADER, vertexSource);
            const fragmentShader = this._createShader(gl.FRAGMENT_SHADER, fragmentSource);
            
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error('Program link failed: ' + gl.getProgramInfoLog(program));
            }
            
            return program;
        }

        _createShader(type, source) {
            const gl = this.gl;
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw new Error('Shader compile failed: ' + gl.getShaderInfoLog(shader));
            }
            
            return shader;
        }

        _createTexture(width, height) {
            const gl = this.gl;
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, height, 0, gl.RED, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            return texture;
        }

        _createFramebuffer(texture) {
            const gl = this.gl;
            const framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            return framebuffer;
        }

        _uploadGridToTexture(grid, texture) {
            const gl = this.gl;
            const data = new Uint8Array(this.canvas.width);
            const cellWidth = this.canvas.width / grid.length;
            
            for (let i = 0; i < grid.length; i++) {
                const start = Math.floor(i * cellWidth);
                const end = Math.floor((i + 1) * cellWidth);
                for (let x = start; x < end; x++) {
                    data[x] = grid[i] * 255;
                }
            }
            
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.canvas.width, 1, gl.RED, gl.UNSIGNED_BYTE, data);
        }

        _readTextureToGrid() {
            const gl = this.gl;
            const pixels = new Uint8Array(this.canvas.width * 4);
            gl.readPixels(0, 0, this.canvas.width, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            
            const grid = new Uint8Array(this.canvas.width);
            for (let i = 0; i < this.canvas.width; i++) {
                grid[i] = pixels[i * 4] > 128 ? 1 : 0;
            }
            
            return grid;
        }

        _drawFullScreenQuad() {
            // Create and bind vertex buffer for full-screen quad if not exists
            if (!this.vertexBuffer) {
                const vertices = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
                this.vertexBuffer = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
            }
            
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
            this.gl.enableVertexAttribArray(0);
            this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        }

        _renderWithColors(colors) {
            // For now, use CPU rendering fallback for color display
            // Full WebGL color rendering would need additional shaders
            const imageData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
            const pixels = new Uint8Array(this.canvas.width * this.canvas.height * 4);
            this.gl.readPixels(0, 0, this.canvas.width, this.canvas.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
            
            // Apply colors to non-zero pixels
            for (let i = 0; i < pixels.length; i += 4) {
                if (pixels[i] > 0) {
                    pixels[i] = colors.r;
                    pixels[i + 1] = colors.g;
                    pixels[i + 2] = colors.b;
                    pixels[i + 3] = colors.a;
                }
            }
            
            imageData.data.set(pixels);
            this.ctx.putImageData(imageData, 0, 0);
        }

        getCapabilities() {
            return {
                type: 'webgl',
                maxGridSize: 4096,
                asyncCompute: false
            };
        }

        cleanup() {
            if (this.gl) {
                // Clean up WebGL resources
                Object.values(this.textures).forEach(texture => this.gl.deleteTexture(texture));
                Object.values(this.framebuffers).forEach(fb => this.gl.deleteFramebuffer(fb));
                Object.values(this.programs).forEach(program => this.gl.deleteProgram(program));
            }
        }
    }

    /**
     * WebGPU Compute Engine - Compute shader acceleration
     */
    class WebGPUComputeEngine extends ComputeEngine {
        constructor(canvas, options = {}) {
            super(canvas, options);
            this.device = null;
            this.adapter = null;
            this.computePipeline = null;
            this.buffers = {};
        }

        async initialize() {
            if (!navigator.gpu) {
                throw new Error('WebGPU not supported');
            }

            this.adapter = await navigator.gpu.requestAdapter();
            if (!this.adapter) {
                throw new Error('WebGPU adapter not available');
            }

            this.device = await this.adapter.requestDevice();
            await this._initializeComputePipeline();
            await this._initializeBuffers();
            await super.initialize();
            return true;
        }

        async _initializeComputePipeline() {
            const computeShaderCode = `
                @group(0) @binding(0) var<storage, read> currentState: array<u32>;
                @group(0) @binding(1) var<storage, read_write> nextState: array<u32>;
                @group(0) @binding(2) var<uniform> params: Params;

                struct Params {
                    rule: u32,
                    width: u32,
                }

                @compute @workgroup_size(64)
                fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
                    let index = global_id.x;
                    if (index >= params.width) {
                        return;
                    }
                    
                    let left = currentState[(index - 1u + params.width) % params.width];
                    let center = currentState[index];
                    let right = currentState[(index + 1u) % params.width];
                    
                    let lookup = (left << 2u) | (center << 1u) | right;
                    nextState[index] = (params.rule >> lookup) & 1u;
                }
            `;

            const shaderModule = this.device.createShaderModule({
                code: computeShaderCode
            });

            this.computePipeline = this.device.createComputePipeline({
                layout: 'auto',
                compute: {
                    module: shaderModule,
                    entryPoint: 'main'
                }
            });
        }

        async _initializeBuffers() {
            const maxSize = 4096;
            
            // Create storage buffers for ping-pong computation
            this.buffers.current = this.device.createBuffer({
                size: maxSize * 4, // u32 = 4 bytes
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
            });

            this.buffers.next = this.device.createBuffer({
                size: maxSize * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
            });

            // Create uniform buffer for parameters
            this.buffers.params = this.device.createBuffer({
                size: 8, // 2 u32s = 8 bytes
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });

            // Create readback buffer
            this.buffers.readback = this.device.createBuffer({
                size: maxSize * 4,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
            });
        }

        async computeNextGeneration(currentGrid, rule) {
            // Upload grid data to buffer
            const gridData = new Uint32Array(currentGrid);
            this.device.queue.writeBuffer(this.buffers.current, 0, gridData);

            // Upload parameters
            const params = new Uint32Array([rule, currentGrid.length]);
            this.device.queue.writeBuffer(this.buffers.params, 0, params);

            // Create bind group
            const bindGroup = this.device.createBindGroup({
                layout: this.computePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.buffers.current } },
                    { binding: 1, resource: { buffer: this.buffers.next } },
                    { binding: 2, resource: { buffer: this.buffers.params } }
                ]
            });

            // Dispatch compute
            const commandEncoder = this.device.createCommandEncoder();
            const computePass = commandEncoder.beginComputePass();
            computePass.setPipeline(this.computePipeline);
            computePass.setBindGroup(0, bindGroup);
            computePass.dispatchWorkgroups(Math.ceil(currentGrid.length / 64));
            computePass.end();

            // Copy result to readback buffer
            commandEncoder.copyBufferToBuffer(
                this.buffers.next, 0,
                this.buffers.readback, 0,
                currentGrid.length * 4
            );

            this.device.queue.submit([commandEncoder.finish()]);

            // Read result back
            await this.buffers.readback.mapAsync(GPUMapMode.READ);
            const resultData = new Uint32Array(this.buffers.readback.getMappedRange());
            const nextGrid = new Uint8Array(resultData.slice(0, currentGrid.length));
            this.buffers.readback.unmap();

            // Swap buffers for next iteration
            [this.buffers.current, this.buffers.next] = [this.buffers.next, this.buffers.current];

            return nextGrid;
        }

        renderToCanvas(grid, colors) {
            // Use 2D context for rendering (WebGPU compute + Canvas 2D render)
            const data = this.ctx.createImageData(this.canvas.width, this.canvas.height);
            const pixels = data.data;
            const cellWidth = Math.ceil(this.canvas.width / grid.length);
            
            pixels.fill(0);
            
            for (let x = 0; x < grid.length; x++) {
                if (grid[x] === 1) {
                    const startX = x * cellWidth;
                    const endX = Math.min(startX + cellWidth, this.canvas.width);
                    
                    for (let pixelX = startX; pixelX < endX; pixelX++) {
                        for (let y = 0; y < this.canvas.height; y++) {
                            const index = (y * this.canvas.width + pixelX) * 4;
                            pixels[index] = colors.r;     // Red
                            pixels[index + 1] = colors.g; // Green
                            pixels[index + 2] = colors.b; // Blue
                            pixels[index + 3] = colors.a; // Alpha
                        }
                    }
                }
            }
            
            this.ctx.putImageData(data, 0, 0);
        }

        getCapabilities() {
            return {
                type: 'webgpu',
                maxGridSize: 8192,
                asyncCompute: true
            };
        }

        cleanup() {
            if (this.device) {
                // Clean up WebGPU resources
                Object.values(this.buffers).forEach(buffer => buffer.destroy());
            }
        }
    }

    /**
     * Unified Cellular Automata Class
     * Handles animation, state management, and rendering with pluggable compute engines
     */
    class UnifiedCellularAutomata {
        constructor(canvasId, type, computeEngine) {
            this.canvas = document.getElementById(canvasId);
            this.type = type; // 'background' or 'header'
            this.computeEngine = computeEngine;
            
            // Initialize shared components
            this.rules = new CellularAutomataRules();
            this.performanceMonitor = new CAPerformanceMonitor();
            
            if (type === 'header') {
                this.breathingEffect = new BreathingEffect();
            }
            
            // State
            this.currentGrid = null;
            this.currentRule = 30;
            this.generation = 0;
            this.isRunning = false;
            this.animationId = null;
            
            // Initialize based on type
            this._initializeForType();
        }

        async initialize() {
            try {
                await this.computeEngine.initialize();
                
                // Update canvas dimensions for proper CA rendering
                this._updateCanvasDimensions();
                
                // Initialize state manager with proper dimensions
                this.stateManager = new AnimationStateManager(this.cols, this.rows);
                
                // Initialize canvas context for rendering
                this.ctx = this.canvas.getContext('2d');
                
                this._initializeGrid();
                this._setupEventListeners();
                
                return true;
            } catch (error) {
                console.warn(`Failed to initialize ${this.computeEngine.constructor.name}:`, error);
                return false;
            }
        }
        
        _updateCanvasDimensions() {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            
            // Recalculate grid and row parameters
            this.gridSize = Math.min(200, this.canvas.width);
            this.rows = Math.floor(this.canvas.height / 2);
            this.cols = this.gridSize;  // Add cols for AnimationStateManager
            this.cellSize = Math.max(1, Math.floor(this.canvas.width / this.gridSize));
        }

        _initializeForType() {
            if (this.type === 'background') {
                this.currentRule = 30;
                this.animationInterval = 200;
                this.gridSize = Math.min(200, this.canvas.width);
            } else if (this.type === 'header') {
                this.ruleSequence = [30, 90, 110, 54, 150, 126];
                this.ruleIndex = 0;
                this.currentRule = this.ruleSequence[0];
                this.animationInterval = 150;
                this.gridSize = Math.min(300, this.canvas.width);
                this.ruleChangeInterval = 5000; // Change rule every 5 seconds
            }
            
            // Initialize cellular automata state management using existing system
            this.cols = this.gridSize;
            this.rows = Math.floor(this.canvas.height / 2); // Number of rows that fit
            this.cellSize = Math.max(1, Math.floor(this.canvas.width / this.gridSize));
        }

        _initializeGrid() {
            this.currentGrid = new Uint8Array(this.gridSize);
            
            if (this.type === 'background') {
                // Single center seed for background
                this.currentGrid[Math.floor(this.gridSize / 2)] = 1;
            } else if (this.type === 'header') {
                // Random pattern for header
                for (let i = 0; i < this.gridSize; i++) {
                    this.currentGrid[i] = Math.random() < 0.3 ? 1 : 0;
                }
            }
        }

        _setupEventListeners() {
            if (this.type === 'header') {
                // Set up rule change timer
                setInterval(() => {
                    this.cycleRule();
                }, this.ruleChangeInterval);
            }
        }

        start() {
            if (this.isRunning) return;
            
            this.isRunning = true;
            this.performanceMonitor.startMonitoring();
            this._animate();
        }

        stop() {
            this.isRunning = false;
            if (this.animationId) {
                clearTimeout(this.animationId);
                this.animationId = null;
            }
            this.performanceMonitor.stopMonitoring();
        }

        async _animate() {
            if (!this.isRunning) return;
            
            const startTime = performance.now();
            
            try {
                // Update AnimationStateManager's grid, currentRow and store current generation
                this.stateManager.grid = [...this.currentGrid];
                this.stateManager.currentRow = this.generation;
                this.stateManager.storeCurrentGeneration();
                
                // Use the proven CellularAutomataRenderer for proper CA pattern rendering
                const cellSize = Math.max(1, Math.floor(this.canvas.width / this.cols));
                const offsetX = Math.floor((this.canvas.width - (this.cols * cellSize)) / 2);
                
                if (this.type === 'background') {
                    CellularAutomataRenderer.renderBackgroundRows(
                        this.ctx, 
                        this.stateManager.drawnRows, 
                        this.cols, 
                        this.generation, 
                        cellSize, 
                        offsetX, 
                        0
                    );
                } else {
                    const globalAlpha = this.breathingEffect ? this.breathingEffect.getCurrentAlpha() : 1.0;
                    CellularAutomataRenderer.renderHeaderRows(
                        this.ctx, 
                        this.stateManager.drawnRows, 
                        this.cols, 
                        this.generation, 
                        cellSize, 
                        globalAlpha, 
                        offsetX, 
                        0
                    );
                }
                
                // Compute next generation for next frame
                const nextGrid = await this.computeEngine.computeNextGeneration(this.currentGrid, this.currentRule);
                this.currentGrid = nextGrid;
                this.generation++;
                
                // Update breathing effect for header
                if (this.type === 'header' && this.breathingEffect) {
                    this.breathingEffect.update();
                }
                
                // Check if we've completed the pattern
                if (this.generation >= this.rows) {
                    if (this.type === 'background') {
                        // Background stops when pattern is complete
                        this.stop();
                        return;
                    } else {
                        // Header restarts with new rule after a delay
                        this.generation = 0;
                        this.stateManager.reset();
                        setTimeout(() => {
                            if (this.isRunning) {
                                this.cycleRule();
                            }
                        }, 1800);
                    }
                }
                
                // Update performance metrics
                const computeTime = performance.now() - startTime;
                this.performanceMonitor.measureFrame(computeTime);
                
            } catch (error) {
                console.error('Animation error:', error);
                this.stop();
                return;
            }
            
            // Schedule next animation frame
            this.animationId = setTimeout(() => {
                if (this.isRunning) {
                    requestAnimationFrame(() => this._animate());
                }
            }, this.animationInterval);
        }


        cycleRule() {
            if (this.type === 'header') {
                this.ruleIndex = (this.ruleIndex + 1) % this.ruleSequence.length;
                this.currentRule = this.ruleSequence[this.ruleIndex];
                this._initializeGrid(); // Reset grid for new rule
                this.generation = 0; // Reset generation counter
                this.stateManager.reset(); // Clear stored generations
            }
        }

        getCurrentRule() {
            return this.currentRule;
        }

        getPerformanceStats() {
            return this.performanceMonitor.getStats();
        }

        cleanup() {
            this.stop();
            if (this.computeEngine) {
                this.computeEngine.cleanup();
            }
        }
    }

    /**
     * Factory for creating compute engines with automatic fallback
     */
    class ComputeEngineFactory {
        static async createBestEngine(canvas, options = {}) {
            const engines = [
                () => new WebGPUComputeEngine(canvas, options),
                () => new WebGLComputeEngine(canvas, options),
                () => new CPUComputeEngine(canvas, options)
            ];

            for (const createEngine of engines) {
                try {
                    const engine = createEngine();
                    const initialized = await engine.initialize();
                    if (initialized) {
                        console.log(`Using ${engine.constructor.name} for cellular automata`);
                        return engine;
                    }
                } catch (error) {
                    console.warn(`Failed to initialize ${createEngine().constructor.name}:`, error);
                }
            }

            throw new Error('No suitable compute engine available');
        }

        static async createSpecificEngine(type, canvas, options = {}) {
            let engine;
            switch (type) {
                case 'webgpu':
                    engine = new WebGPUComputeEngine(canvas, options);
                    break;
                case 'webgl':
                    engine = new WebGLComputeEngine(canvas, options);
                    break;
                case 'cpu':
                    engine = new CPUComputeEngine(canvas, options);
                    break;
                default:
                    throw new Error(`Unknown engine type: ${type}`);
            }

            await engine.initialize();
            return engine;
        }
    }

    // Export classes to global scope for compatibility
    window.UnifiedCellularAutomata = UnifiedCellularAutomata;
    window.ComputeEngineFactory = ComputeEngineFactory;
    window.CPUComputeEngine = CPUComputeEngine;
    window.WebGLComputeEngine = WebGLComputeEngine;
    window.WebGPUComputeEngine = WebGPUComputeEngine;

})(window);