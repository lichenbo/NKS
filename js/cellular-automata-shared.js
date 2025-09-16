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
            return Uint32Array.from(CellularAutomataRules.getRule(ruleNumber));
        }

        /**
         * Get random rule different from current one
         * @param {number} currentRuleNumber - Current rule to avoid
         * @returns {number} Different random rule number
         */
        static getRandomRule(currentRuleNumber = null) {
            const keys = CellularAutomataRules.RULE_KEYS;
            if (!keys.length) return 30;

            const pick = () => parseInt(keys[Math.floor(Math.random() * keys.length)], 10);
            if (currentRuleNumber === null || keys.length === 1) {
                return pick();
            }

            let candidate = pick();
            while (candidate === currentRuleNumber) {
                candidate = pick();
            }
            return candidate;
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

            const halfCols = cols / 2;
            const halfRows = rows / 2;
            const rowCenter = currentRow / 2;
            const maxDistance = Math.hypot(halfCols, halfRows);

            for (let row = 0; row < drawnRows.length; row++) {
                const rowData = drawnRows[row];
                if (!rowData) continue;

                const dy = row - rowCenter;
                for (let col = 0; col < cols; col++) {
                    if (!rowData[col]) continue;

                    // Position based gradient
                    const dx = col - halfCols;
                    const intensity = Math.max(minIntensity, 1 - Math.hypot(dx, dy) / maxDistance);

                    // Age fade keeps older rows subtle
                    const age = currentRow - row;
                    const ageFactor = Math.max(minAgeFactor, 1 - age / (rows * ageFadeFactor));

                    const colorStrength = intensity * ageFactor;
                    const alpha = colorStrength * baseAlpha * globalAlpha;
                    const red = Math.floor(212 * colorStrength);
                    const green = Math.floor(175 * colorStrength);
                    const blue = Math.floor(55 * colorStrength);

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
        BreathingEffect
    };

    // Backward compatibility - expose individual classes to global scope
    window.CellularAutomataRules = CellularAutomataRules;
    window.CellularAutomataRenderer = CellularAutomataRenderer;
    window.AnimationStateManager = AnimationStateManager;
    window.BreathingEffect = BreathingEffect;

})(window.APP);
