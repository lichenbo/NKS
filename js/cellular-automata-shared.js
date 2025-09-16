// js/cellular-automata-shared.js

window.APP = window.APP || {};

(function(APP) {
    'use strict';

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

        static getRule(ruleNumber) {
            return CellularAutomataRules.RULES[ruleNumber] || CellularAutomataRules.RULES[30];
        }

        static applyRule(left, center, right, rule) {
            const pattern = left * 4 + center * 2 + right;
            return rule[pattern];
        }

        static toWebGLFormat(ruleNumber) {
            const rule = CellularAutomataRules.getRule(ruleNumber);
            return new Float32Array(rule);
        }

        static toWebGPUFormat(ruleNumber) {
            return Uint32Array.from(CellularAutomataRules.getRule(ruleNumber));
        }

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

        static isValidRule(ruleNumber) {
            return ruleNumber in CellularAutomataRules.RULES;
        }
    }

    class CellularAutomataRenderer {
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
            const rowCenter = currentRow / 2;
            const maxDistance = Math.hypot(halfCols, rows / 2);

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

    class AnimationStateManager {
        constructor(cols, rows) {
            this.cols = cols;
            this.rows = rows;
            this.reset();
        }

                reset() {
            this.grid = new Array(this.cols).fill(0);
            this.grid[Math.floor(this.cols / 2)] = 1; // Start with center cell active
            this.drawnRows = [];
            this.currentRow = 0;
        }

                updateDimensions(cols, rows) {
            this.cols = cols;
            this.rows = rows;
            this.reset();
        }

                storeCurrentGeneration() {
            this.drawnRows[this.currentRow] = [...this.grid];
        }

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

                advanceGeneration(nextGrid) {
            this.grid = nextGrid;
            this.currentRow++;
        }

                isAnimationComplete() {
            return this.currentRow >= this.rows - 1;
        }

    }

    class BreathingEffect {
        constructor(options = {}) {
            this.globalAlpha = options.initialAlpha || 0.3;
            this.fadeDirection = 1; // 1 for fade in, -1 for fade out
            this.minAlpha = options.minAlpha || 0.2;
            this.maxAlpha = options.maxAlpha || 0.6;
            this.fadeSpeed = options.fadeSpeed || 0.01;
        }

                update() {
            this.globalAlpha += this.fadeDirection * this.fadeSpeed;
            
            if (this.globalAlpha >= this.maxAlpha) {
                this.fadeDirection = -1;
            } else if (this.globalAlpha <= this.minAlpha) {
                this.fadeDirection = 1;
            }
            
            return this.globalAlpha;
        }

                reset() {
            this.globalAlpha = 0.3;
            this.fadeDirection = 1;
        }

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
