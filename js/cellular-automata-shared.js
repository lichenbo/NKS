// js/cellular-automata-shared.js

/**
 * Shared Utilities for Cellular Automata Implementations
 * Contains common functionality used across CPU, WebGL, and WebGPU implementations
 * 
 * Features:
 * - Centralized rule definitions and management
 * - Shared rendering logic with golden gradient effects
 * - Animation state management
 * - Unified performance monitoring
 * - GPU resource management utilities
 * 
 * Usage: Load before other cellular automata modules
 * Dependencies: None (standalone utilities)
 */

window.APP = window.APP || {};

(function(APP) {
    'use strict';

    /**
     * Centralized Cellular Automata Rules Management
     * Provides rule definitions, conversions, and utilities for Elementary CA rules
     * 
     * Features:
     * - Standard rule definitions (30, 90, 110, 54, 150, 126)
     * - Rule format conversions for different GPU architectures
     * - Rule validation and lookup utilities
     */
    class CellularAutomataRules {
        static RULES = {
            30: [0, 1, 1, 1, 1, 0, 0, 0],   // Chaotic - Classic chaos pattern
            90: [0, 1, 0, 1, 1, 0, 1, 0],   // Fractal - Sierpinski triangle
            110: [0, 1, 1, 1, 0, 1, 1, 0],  // Complex - Turing complete
            54: [0, 1, 1, 0, 1, 1, 0, 0],   // Symmetric - Mirror patterns
            150: [1, 0, 1, 0, 0, 1, 0, 1],  // XOR - Simple additive
            126: [0, 1, 1, 1, 1, 1, 1, 0]   // Dense - High activity
        };

        static RULE_KEYS = Object.keys(CellularAutomataRules.RULES);

        /**
         * Get rule array by number
         * @param {number} ruleNumber - Elementary CA rule number (30, 90, etc.)
         * @returns {Array<number>} Rule lookup table [0,1,1,1,1,0,0,0]
         */
        static getRule(ruleNumber) {
            return CellularAutomataRules.RULES[ruleNumber] || CellularAutomataRules.RULES[30];
        }

        /**
         * Apply cellular automata rule to three cells
         * @param {number} left - Left neighbor (0 or 1)
         * @param {number} center - Center cell (0 or 1)
         * @param {number} right - Right neighbor (0 or 1)
         * @param {Array<number>} rule - Rule lookup table
         * @returns {number} Next generation cell state (0 or 1)
         */
        static applyRule(left, center, right, rule) {
            const pattern = left * 4 + center * 2 + right;
            return rule[pattern];
        }

        /**
         * Convert rule number to WebGL uniform format
         * @param {number} ruleNumber - Elementary CA rule number
         * @returns {Float32Array} Rule array for WebGL shaders
         */
        static toWebGLFormat(ruleNumber) {
            const rule = CellularAutomataRules.getRule(ruleNumber);
            return new Float32Array(rule);
        }

        /**
         * Convert rule number to WebGPU uniform format
         * @param {number} ruleNumber - Elementary CA rule number
         * @returns {Uint32Array} Rule array for WebGPU compute shaders
         */
        static toWebGPUFormat(ruleNumber) {
            const rule = CellularAutomataRules.getRule(ruleNumber);
            const gpuRule = new Uint32Array(8);
            for (let i = 0; i < 8; i++) {
                gpuRule[i] = rule[i];
            }
            return gpuRule;
        }

        /**
         * Get random rule different from current one
         * @param {number} currentRuleNumber - Current rule to avoid
         * @returns {number} Different random rule number
         */
        static getRandomRule(currentRuleNumber = null) {
            if (currentRuleNumber === null) {
                const randomIndex = Math.floor(Math.random() * CellularAutomataRules.RULE_KEYS.length);
                return parseInt(CellularAutomataRules.RULE_KEYS[randomIndex]);
            }

            let newRule;
            do {
                const randomIndex = Math.floor(Math.random() * CellularAutomataRules.RULE_KEYS.length);
                newRule = parseInt(CellularAutomataRules.RULE_KEYS[randomIndex]);
            } while (newRule === currentRuleNumber && CellularAutomataRules.RULE_KEYS.length > 1);
            
            return newRule;
        }

        /**
         * Validate if rule number exists
         * @param {number} ruleNumber - Rule number to validate
         * @returns {boolean} True if rule exists
         */
        static isValidRule(ruleNumber) {
            return ruleNumber in CellularAutomataRules.RULES;
        }
    }

    /**
     * Shared Cellular Automata Renderer
     * Handles common rendering logic including golden gradients and age-based fading
     * 
     * Features:
     * - Golden gradient color calculations
     * - Age-based fading effects
     * - Distance-based intensity variations
     * - Optimized rendering for cellular automata patterns
     */
    class CellularAutomataRenderer {
        /**
         * Render cellular automata rows with golden gradient effect
         * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
         * @param {Array<Array<number>>} drawnRows - 2D array of cell states
         * @param {number} cols - Number of columns
         * @param {number} currentRow - Current generation row
         * @param {number} cellSize - Size of each cell in pixels
         * @param {Object} options - Rendering options
         */
        static renderRows(ctx, drawnRows, cols, currentRow, cellSize, options = {}) {
            const {
                offsetX = 0,
                offsetY = 0,
                globalAlpha = 1.0,
                baseAlpha = 0.08,
                minIntensity = 0.2,
                minAgeFactor = 0.1,
                ageFadeFactor = 0.3,
                rows = drawnRows.length
            } = options;

            // Pre-calculate maximum distance for normalization
            const maxDistance = Math.sqrt(cols * cols / 4 + rows * rows / 4);

            for (let row = 0; row < drawnRows.length; row++) {
                if (!drawnRows[row]) continue;

                for (let col = 0; col < cols; col++) {
                    if (drawnRows[row][col] === 1) {
                        // Calculate gradient effect based on position
                        const distance = Math.sqrt(
                            Math.pow(col - cols / 2, 2) + Math.pow(row - currentRow / 2, 2)
                        );
                        const intensity = Math.max(minIntensity, 1 - distance / maxDistance);

                        // Calculate age effect - older rows fade
                        const age = currentRow - row;
                        const ageFactor = Math.max(minAgeFactor, 1 - age / (rows * ageFadeFactor));

                        // Golden color with breathing/global alpha effect
                        const alpha = intensity * ageFactor * baseAlpha * globalAlpha;
                        const red = Math.floor(212 * intensity * ageFactor);
                        const green = Math.floor(175 * intensity * ageFactor);
                        const blue = Math.floor(55 * intensity * ageFactor);

                        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                        ctx.fillRect(
                            col * cellSize + offsetX,
                            row * cellSize + offsetY,
                            cellSize - 0.5,
                            cellSize - 0.5
                        );
                    }
                }
            }
        }

        /**
         * Render with background-specific settings (subtle effect)
         * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
         * @param {Array<Array<number>>} drawnRows - 2D array of cell states
         * @param {number} cols - Number of columns
         * @param {number} currentRow - Current generation row
         * @param {number} cellSize - Size of each cell in pixels
         * @param {number} offsetX - X offset for centering
         * @param {number} offsetY - Y offset for centering
         */
        static renderBackgroundRows(ctx, drawnRows, cols, currentRow, cellSize, offsetX = 0, offsetY = 0) {
            CellularAutomataRenderer.renderRows(ctx, drawnRows, cols, currentRow, cellSize, {
                offsetX,
                offsetY,
                globalAlpha: 1.0,
                baseAlpha: 0.08,
                minIntensity: 0.2,
                minAgeFactor: 0.1,
                ageFadeFactor: 0.3
            });
        }

        /**
         * Render with header-specific settings (breathing effect)
         * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
         * @param {Array<Array<number>>} drawnRows - 2D array of cell states
         * @param {number} cols - Number of columns
         * @param {number} currentRow - Current generation row
         * @param {number} cellSize - Size of each cell in pixels
         * @param {number} globalAlpha - Global alpha for breathing effect
         * @param {number} offsetX - X offset for centering
         * @param {number} offsetY - Y offset for centering
         */
        static renderHeaderRows(ctx, drawnRows, cols, currentRow, cellSize, globalAlpha, offsetX = 0, offsetY = 0) {
            CellularAutomataRenderer.renderRows(ctx, drawnRows, cols, currentRow, cellSize, {
                offsetX,
                offsetY,
                globalAlpha,
                baseAlpha: 1.0,
                minIntensity: 0.3,
                minAgeFactor: 0.2,
                ageFadeFactor: 0.4
            });
        }
    }

    /**
     * Animation State Manager
     * Manages grid state, row tracking, and animation lifecycle
     * 
     * Features:
     * - Grid initialization and management
     * - Row history tracking for rendering
     * - Animation state transitions
     * - Memory-efficient state management
     */
    class AnimationStateManager {
        constructor(cols, rows) {
            this.cols = cols;
            this.rows = rows;
            this.reset();
        }

        /**
         * Reset animation state to initial conditions
         */
        reset() {
            this.grid = new Array(this.cols).fill(0);
            this.grid[Math.floor(this.cols / 2)] = 1; // Start with center cell active
            this.drawnRows = [];
            this.currentRow = 0;
        }

        /**
         * Update dimensions and reset state
         * @param {number} cols - New column count
         * @param {number} rows - New row count
         */
        updateDimensions(cols, rows) {
            this.cols = cols;
            this.rows = rows;
            this.reset();
        }

        /**
         * Update dimensions while preserving current animation state
         * @param {number} cols - New column count
         * @param {number} rows - New row count
         */
        updateDimensionsPreserveState(cols, rows) {
            const oldCols = this.cols;
            const oldGrid = [...this.grid];
            const oldCurrentRow = this.currentRow;
            
            this.cols = cols;
            this.rows = rows;
            
            // Preserve existing grid state, adjusting for new width if needed
            if (cols !== oldCols) {
                this.grid = new Array(cols).fill(0);
                
                // Copy existing grid, centering it in the new width
                if (oldGrid.length > 0) {
                    const oldCenter = Math.floor(oldCols / 2);
                    const newCenter = Math.floor(cols / 2);
                    const offset = newCenter - oldCenter;
                    
                    for (let i = 0; i < oldGrid.length; i++) {
                        const newIndex = i + offset;
                        if (newIndex >= 0 && newIndex < cols) {
                            this.grid[newIndex] = oldGrid[i];
                        }
                    }
                }

                // Also re-center previously drawn rows to the new width
                if (Array.isArray(this.drawnRows) && this.drawnRows.length) {
                    const oldDrawn = this.drawnRows;
                    const newDrawn = new Array(oldDrawn.length);
                    const oldCenter = Math.floor(oldCols / 2);
                    const newCenter = Math.floor(cols / 2);
                    const offset = newCenter - oldCenter;
                    for (let r = 0; r < oldDrawn.length; r++) {
                        const rowData = oldDrawn[r];
                        if (!Array.isArray(rowData)) { newDrawn[r] = rowData; continue; }
                        const newRow = new Array(cols).fill(0);
                        for (let c = 0; c < rowData.length; c++) {
                            const nc = c + offset;
                            if (nc >= 0 && nc < cols) newRow[nc] = rowData[c];
                        }
                        newDrawn[r] = newRow;
                    }
                    this.drawnRows = newDrawn;
                }
            }
            
            // Keep the same current row if it's still valid
            this.currentRow = Math.min(oldCurrentRow, this.rows - 1);
            
            // Preserve drawn rows that are still valid
            if (this.drawnRows.length > this.rows) {
                this.drawnRows = this.drawnRows.slice(0, this.rows);
            }
        }

        /**
         * Store current generation for rendering
         */
        storeCurrentGeneration() {
            this.drawnRows[this.currentRow] = [...this.grid];
        }

        /**
         * Compute next generation using CPU
         * @param {Array<number>} rule - Cellular automata rule
         * @returns {Array<number>} Next generation grid
         */
        computeNextGenerationCPU(rule) {
            const newGrid = new Array(this.cols).fill(0);
            for (let i = 0; i < this.cols; i++) {
                const left = this.grid[i - 1] || 0;
                const center = this.grid[i];
                const right = this.grid[i + 1] || 0;
                newGrid[i] = CellularAutomataRules.applyRule(left, center, right, rule);
            }
            return newGrid;
        }

        /**
         * Advance to next generation
         * @param {Array<number>} nextGrid - Next generation grid
         */
        advanceGeneration(nextGrid) {
            this.grid = nextGrid;
            this.currentRow++;
        }

        /**
         * Check if animation is complete
         * @returns {boolean} True if animation has reached the end
         */
        isAnimationComplete() {
            return this.currentRow >= this.rows - 1;
        }

        /**
         * Get current animation state
         * @returns {Object} Current state information
         */
        getState() {
            return {
                currentRow: this.currentRow,
                totalRows: this.rows,
                cols: this.cols,
                hasGrid: Array.isArray(this.grid) && this.grid.length === this.cols,
                drawnRowsCount: this.drawnRows.length
            };
        }
    }

    /**
     * Unified Performance Monitor
     * Tracks FPS, performance metrics, and handles automatic fallbacks
     * 
     * Features:
     * - Frame rate monitoring
     * - Rolling average calculations
     * - Automatic performance-based fallbacks
     * - Configurable thresholds and sampling
     */
    class CAPerformanceMonitor {
        constructor(options = {}) {
            this.frameCount = 0;
            this.lastTime = performance.now();
            this.fps = 60;
            this.averageFPS = 60;
            this.measurements = [];
            
            // Configuration options
            this.maxMeasurements = options.maxMeasurements || 60;
            this.fallbackThreshold = options.fallbackThreshold || 25;
            this.checkInterval = options.checkInterval || 30; // frames
            this.onFallback = options.onFallback || null;
            
            this.isMonitoring = false;
            this.lastRenderTime = 0;
        }

        /**
         * Start performance monitoring
         */
        startMonitoring() {
            this.isMonitoring = true;
            this.lastTime = performance.now();
            this.frameCount = 0;
            this.measurements = [];
        }

        /**
         * Stop performance monitoring
         */
        stopMonitoring() {
            this.isMonitoring = false;
        }

        /**
         * Measure frame performance
         * @param {number} renderTime - Time spent rendering this frame (optional)
         */
        measureFrame(renderTime = 0) {
            if (!this.isMonitoring) return;

            const now = performance.now();
            const frameTime = now - this.lastTime;
            this.lastTime = now;
            this.lastRenderTime = renderTime;

            // Calculate current FPS
            this.fps = 1000 / frameTime;

            // Store measurement
            this.measurements.push(this.fps);
            if (this.measurements.length > this.maxMeasurements) {
                this.measurements.shift();
            }

            // Calculate rolling average FPS
            this.averageFPS = this.measurements.reduce((sum, fps) => sum + fps, 0) / this.measurements.length;

            // Check for performance issues periodically
            this.frameCount++;
            if (this.frameCount % this.checkInterval === 0) {
                if (this.averageFPS < this.fallbackThreshold && this.onFallback) {
                    console.warn(`Performance insufficient (${this.averageFPS.toFixed(1)} FPS), triggering fallback`);
                    this.onFallback();
                }
            }
        }

        /**
         * Get current performance statistics
         * @returns {Object} Performance stats
         */
        getStats() {
            return {
                currentFPS: Math.round(this.fps * 10) / 10,
                averageFPS: Math.round(this.averageFPS * 10) / 10,
                lastRenderTime: Math.round(this.lastRenderTime * 100) / 100,
                frameCount: this.frameCount,
                sampleCount: this.measurements.length,
                isMonitoring: this.isMonitoring
            };
        }

        /**
         * Reset all measurements
         */
        reset() {
            this.frameCount = 0;
            this.measurements = [];
            this.fps = 60;
            this.averageFPS = 60;
            this.lastTime = performance.now();
        }

        /**
         * Clean up resources
         */
        cleanup() {
            this.stopMonitoring();
            this.measurements = [];
            this.onFallback = null;
        }
    }

    /**
     * GPU Resource Manager Utilities
     * Common utilities for managing GPU resources across WebGL and WebGPU
     */
    class GPUResourceManager {
        /**
         * Check WebGL 2.0 support
         * @returns {boolean} True if WebGL 2.0 is supported
         */
        static isWebGL2Supported() {
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2');
                return !!gl;
            } catch (e) {
                return false;
            }
        }

        /**
         * Check WebGPU support
         * @returns {boolean} True if WebGPU is supported
         */
        static isWebGPUSupported() {
            return 'gpu' in navigator;
        }

        /**
         * Get best available GPU acceleration method
         * @returns {string} 'webgpu', 'webgl', or 'cpu'
         */
        static getBestAcceleration() {
            if (GPUResourceManager.isWebGPUSupported()) return 'webgpu';
            if (GPUResourceManager.isWebGL2Supported()) return 'webgl';
            return 'cpu';
        }

        /**
         * Safe GPU resource cleanup with error handling
         * @param {Function} cleanupFn - Cleanup function to execute
         * @param {string} resourceName - Name for logging purposes
         */
        static safeCleanup(cleanupFn, resourceName = 'resource') {
            try {
                cleanupFn();
            } catch (error) {
                console.warn(`Failed to cleanup ${resourceName}:`, error.message);
            }
        }

        /**
         * Calculate optimal workgroup size for compute shaders
         * @param {number} dataSize - Size of data to process
         * @param {number} maxWorkgroupSize - Maximum workgroup size (default 64)
         * @returns {number} Optimal workgroup count
         */
        static calculateWorkgroups(dataSize, maxWorkgroupSize = 64) {
            return Math.ceil(dataSize / maxWorkgroupSize);
        }
    }

    /**
     * Breathing Effect Manager
     * Manages the breathing alpha animation for header cellular automata
     */
    class BreathingEffect {
        constructor(options = {}) {
            this.globalAlpha = options.initialAlpha || 0.3;
            this.fadeDirection = 1; // 1 for fade in, -1 for fade out
            this.minAlpha = options.minAlpha || 0.2;
            this.maxAlpha = options.maxAlpha || 0.6;
            this.fadeSpeed = options.fadeSpeed || 0.01;
        }

        /**
         * Update breathing effect and return current alpha
         * @returns {number} Current global alpha value
         */
        update() {
            this.globalAlpha += this.fadeDirection * this.fadeSpeed;
            
            if (this.globalAlpha >= this.maxAlpha) {
                this.fadeDirection = -1;
            } else if (this.globalAlpha <= this.minAlpha) {
                this.fadeDirection = 1;
            }
            
            return this.globalAlpha;
        }

        /**
         * Reset to initial state
         */
        reset() {
            this.globalAlpha = 0.3;
            this.fadeDirection = 1;
        }

        /**
         * Get current alpha value without updating
         * @returns {number} Current global alpha value
         */
        getCurrentAlpha() {
            return this.globalAlpha;
        }
    }

    // Expose all utilities to APP namespace
    APP.CellularAutomataShared = {
        CellularAutomataRules,
        CellularAutomataRenderer,
        AnimationStateManager,
        CAPerformanceMonitor,
        GPUResourceManager,
        BreathingEffect
    };

    // Backward compatibility - expose individual classes to global scope
    window.CellularAutomataRules = CellularAutomataRules;
    window.CellularAutomataRenderer = CellularAutomataRenderer;
    window.AnimationStateManager = AnimationStateManager;
    window.CAPerformanceMonitor = CAPerformanceMonitor;
    window.GPUResourceManager = GPUResourceManager;
    window.BreathingEffect = BreathingEffect;

})(window.APP);
