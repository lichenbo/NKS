// js/automata-engine.js

/**
 * @file Core engine for Cellular Automata animations.
 * This file provides a unified, configuration-driven engine for rendering
 * various cellular automata, abstracting away the specific computation backend
 * (CPU, WebGL, WebGPU). It is designed to be flexible and easily extensible.
 *
 * Key Components:
 * - AutomataAnimator: The main controller class that manages the animation loop,
 *   state, rendering, and user interactions for a single CA instance.
 * - AnimationStateManager: Manages the grid state, history, and dimensions.
 * - CellularAutomataRenderer: Handles the visual rendering of the grid onto a
 *   2D canvas, including all styling and color effects.
 */

window.APP = window.APP || {};

(function (APP) {
    'use strict';

    // Moved from cellular-automata-shared.js
    /**
     * Manages the grid state, row tracking, and animation lifecycle for a cellular automaton.
     * This class is responsible for the data and state of the automaton, but not its
     * computation or rendering.
     */
    class AnimationStateManager {
        constructor(cols, rows) {
            this.cols = cols;
            this.rows = rows;
            this.reset();
        }

        reset() {
            this.grid = new Array(this.cols).fill(0);
            if (this.cols > 0) {
                this.grid[Math.floor(this.cols / 2)] = 1; // Start with center cell active
            }
            this.drawnRows = [];
            this.currentRow = 0;
        }

        updateDimensions(cols, rows) {
            if (this.cols === cols && this.rows === rows) {
                return; // No change
            }
            this.cols = cols;
            this.rows = rows;
            this.reset();
        }

        storeCurrentGeneration() {
            if (this.currentRow < this.rows) {
                this.drawnRows[this.currentRow] = [...this.grid];
            }
        }

        advanceGeneration(nextGrid) {
            this.grid = nextGrid;
            this.currentRow++;
        }

        isAnimationComplete() {
            return this.currentRow >= this.rows - 1;
        }
    }

    // Moved from cellular-automata-shared.js
    /**
     * Handles the rendering of cellular automata grids to a 2D canvas.
     * This class encapsulates all drawing logic, including color gradients and effects,
     * separating the visual representation from the simulation state.
     */
    class CellularAutomataRenderer {
        static render(ctx, drawnRows, cols, rows, cellSize, options = {}) {
            const {
                offsetX = 0,
                offsetY = 0,
                globalAlpha = 1.0,
                baseAlpha = 0.1,
                minIntensity = 0.2,
                ageFadeFactor = 0.3,
            } = options;

            const maxDistance = Math.sqrt(Math.pow(cols / 2, 2) + Math.pow(rows / 2, 2));

            for (let r = 0; r < drawnRows.length; r++) {
                const rowData = drawnRows[r];
                if (!rowData) continue;

                for (let c = 0; c < rowData.length; c++) {
                    if (rowData[c] === 1) {
                        const distance = Math.sqrt(Math.pow(c - cols / 2, 2) + Math.pow(r - rows / 2, 2));
                        const intensity = Math.max(minIntensity, 1.0 - distance / maxDistance);

                        const age = drawnRows.length - r;
                        const ageFactor = Math.max(0.1, 1.0 - age / (rows * ageFadeFactor));

                        const alpha = intensity * ageFactor * baseAlpha * globalAlpha;
                        const red = Math.floor(212 * intensity * ageFactor);
                        const green = Math.floor(175 * intensity * ageFactor);
                        const blue = Math.floor(55 * intensity * ageFactor);

                        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                        ctx.fillRect(c * cellSize + offsetX, r * cellSize + offsetY, cellSize - 0.5, cellSize - 0.5);
                    }
                }
            }
        }
    }

    /**
     * The main controller for a cellular automaton animation.
     * This class orchestrates the entire process, bringing together the runner (computation),
     * state manager (data), and renderer (visuals). It is configured via an options
     * object, allowing it to drive different types of CA animations (e.g., background, header).
     */
    class AutomataAnimator {
        constructor(canvasId, runner, options = {}) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                console.error(`Canvas with ID "${canvasId}" not found.`);
                return;
            }
            this.ctx = this.canvas.getContext('2d');
            this.runner = runner;
            this.options = {
                cellSize: 3,
                animationSpeed: 200,
                isHeader: false,
                rule: 30,
                ...options,
            };

            this.stateManager = new AnimationStateManager(0, 0);
            this.renderer = CellularAutomataRenderer;
            this.animationFrameId = null;
            this.lastAnimateTime = 0;
            this.isRunning = false;

            if (this.options.isHeader) {
                this.breathingEffect = new APP.CellularAutomataShared.BreathingEffect();
                this.currentRule = this.options.rule;
            }

            this.init();
        }

        init() {
            this.setupCanvas();
            this.setupResizeListener();
            this.stateManager.updateDimensions(
                Math.floor(this.canvas.width / this.options.cellSize),
                Math.floor(this.canvas.height / this.options.cellSize)
            );
            this.start();
        }

        setupCanvas() {
            const parent = this.canvas.parentElement;
            this.canvas.width = this.options.isHeader ? window.innerWidth : parent.clientWidth;
            this.canvas.height = parent.clientHeight;
            this.ctx.imageSmoothingEnabled = false;
        }

        setupResizeListener() {
            let resizeTimeout;
            const onResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.stop();
                    this.setupCanvas();
                    this.stateManager.updateDimensions(
                        Math.floor(this.canvas.width / this.options.cellSize),
                        Math.floor(this.canvas.height / this.options.cellSize)
                    );
                    this.start();
                }, 250);
            };
            window.addEventListener('resize', onResize);
            this.onResize = onResize; // Store for cleanup
        }

        async cycleRule() {
            this.currentRule = APP.CellularAutomataShared.CellularAutomataRules.getRandomRule(this.currentRule);

            if (this.runner.updateRule) {
                await this.runner.updateRule(this.currentRule);
            }

            APP.CellularAutomata.updateHeaderRuleIndicatorWithVFX(this.currentRule.toString());
            this.stateManager.reset();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        async animate(timestamp) {
            if (!this.isRunning) return;

            this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

            const elapsed = timestamp - this.lastAnimateTime;
            if (elapsed < this.options.animationSpeed) {
                return;
            }
            this.lastAnimateTime = timestamp;

            if (this.options.isHeader && this.stateManager.isAnimationComplete()) {
                await new Promise(resolve => setTimeout(resolve, 1800));
                await this.cycleRule();
            }

            if (this.stateManager.currentRow === 0) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.stateManager.drawnRows = [];
            }

            this.stateManager.storeCurrentGeneration();

            const renderOpts = {
                offsetX: (this.canvas.width - this.stateManager.cols * this.options.cellSize) / 2,
                offsetY: (this.canvas.height - this.stateManager.rows * this.options.cellSize) / 2,
                globalAlpha: this.options.isHeader ? this.breathingEffect.update() : 1.0,
                baseAlpha: this.options.isHeader ? 1.0 : 0.08,
            };

            this.renderer.render(
                this.ctx,
                this.stateManager.drawnRows,
                this.stateManager.cols,
                this.stateManager.rows,
                this.options.cellSize,
                renderOpts
            );

            if (!this.stateManager.isAnimationComplete()) {
                const nextGrid = await this.runner.computeNextGeneration(
                    this.stateManager.grid,
                    this.options.isHeader ? this.currentRule : this.options.rule
                );
                this.stateManager.advanceGeneration(nextGrid);
            }
        }

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.lastAnimateTime = performance.now();
            this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        }

        stop() {
            if (!this.isRunning) return;
            this.isRunning = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
        }

        cleanup() {
            this.stop();
            window.removeEventListener('resize', this.onResize);
            if (this.runner.cleanup) {
                this.runner.cleanup();
            }
        }
    }

    /**
     * A runner that computes the next generation of the cellular automaton on the CPU.
     * It's the simplest implementation and serves as the fallback.
     */
    class CPURunner {
        constructor(options = {}) {
            this.ruleCache = {};
        }

        async computeNextGeneration(grid, ruleNumber) {
            const rule = this.getRule(ruleNumber);
            const newGrid = new Array(grid.length).fill(0);
            for (let i = 0; i < grid.length; i++) {
                const left = grid[i - 1] || 0;
                const center = grid[i];
                const right = grid[i + 1] || 0;
                const pattern = left * 4 + center * 2 + right;
                newGrid[i] = rule[pattern];
            }
            return newGrid;
        }

        getRule(ruleNumber) {
            if (!this.ruleCache[ruleNumber]) {
                this.ruleCache[ruleNumber] = APP.CellularAutomataShared.CellularAutomataRules.getRule(ruleNumber);
            }
            return this.ruleCache[ruleNumber];
        }

        cleanup() {
            // Nothing to clean up for CPU runner
        }
    }

    // ... existing classes in automata-engine.js

    // Add classes from cellular-automata-shared.js
    class CellularAutomataRules {
        static RULES = {
            30: [0, 1, 1, 1, 1, 0, 0, 0],
            90: [0, 1, 0, 1, 1, 0, 1, 0],
            110: [0, 1, 1, 1, 0, 1, 1, 0],
            54: [0, 1, 1, 0, 1, 1, 0, 0],
            150: [1, 0, 1, 0, 0, 1, 0, 1],
            126: [0, 1, 1, 1, 1, 1, 1, 0]
        };
        static RULE_KEYS = Object.keys(CellularAutomataRules.RULES);
        static getRule(ruleNumber) {
            return CellularAutomataRules.RULES[ruleNumber] || CellularAutomataRules.RULES[30];
        }
        static toWebGPUFormat(ruleNumber) {
            const rule = CellularAutomataRules.getRule(ruleNumber);
            const gpuRule = new Uint32Array(8);
            for (let i = 0; i < 8; i++) {
                gpuRule[i] = rule[i];
            }
            return gpuRule;
        }
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
    }

    class BreathingEffect {
        constructor(options = {}) {
            this.globalAlpha = options.initialAlpha || 0.3;
            this.fadeDirection = 1;
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
    }

    APP.CellularAutomataShared = {
        CellularAutomataRules,
        BreathingEffect
    };

    APP.AutomataEngine = {
        AutomataAnimator,
        AnimationStateManager,
        CellularAutomataRenderer,
        CPURunner,
    };

})(window.APP);
