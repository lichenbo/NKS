// js/cellular-automata.js

/**
 * Cellular Automata Animation System for NKS Project
 * Provides dual cellular automata animations for background and header elements
 * Includes Elementary Cellular Automata rules implementation and visual effects
 * 
 * Features:
 * - Background canvas: Static Rule 30 with golden fade effect
 * - Header canvas: Cycling through multiple CA rules with breathing animation
 * - Rule indicators with trilingual support (EN/ZH/JA)
 * - Responsive canvas handling and resize support
 * - Performance optimized animation loops
 * 
 * Usage: Access via window.APP.CellularAutomata namespace
 * Dependencies: Requires translations system for rule indicator text
 */

window.APP = window.APP || {};

(function (APP) {
    'use strict';

    // Global variables for cellular automata
    let headerRuleName = '110'; // Default value

    /**
     * Base class for cellular automata canvas rendering and animation
     * Provides common functionality for cellular automata visualization including
     * canvas management, resize handling, animation control, and rule-based evolution
     * 
     * Key Features:
     * - Canvas initialization and responsive resizing
     * - Rule-based cellular automata evolution (Elementary CA rules)
     * - Golden color scheme with gradient effects and age-based fading
     * - Configurable animation speed and grid dimensions
     * - Memory management for grid arrays
     * 
     * Time Complexity: O(n) per generation where n is grid width
     * Space Complexity: O(n) for current and next generation grids
     * 
     * @class CellularAutomataCanvas
     */
    class CellularAutomataCanvas {
        /**
         * Initialize cellular automata canvas with configuration
         * @param {string} canvasId - HTML canvas element ID
         * @param {number} cellSize - Size of each cell in pixels
         * @param {Object} options - Configuration options including animationSpeed
         */
        constructor(canvasId, cellSize, options = {}) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return null;

            this.ctx = this.canvas.getContext('2d');
            this.cellSize = cellSize;
            this.cols = 0;
            this.rows = 0;
            this.grid = [];
            this.currentRow = 0;
            this.animationInterval = null;

            // Options
            this.animationSpeed = options.animationSpeed || 200;
            this.parentElement = options.parentElement || null;
            this.skipInitialAnimation = options.skipInitialAnimation || false;

            this.init();
        }

        /**
         * Initialize canvas setup and event listeners
         * Time Complexity: O(1)
         * @returns {void}
         * @private
         */
        init() {
            this.setupCanvas();

            // Allow subclasses to skip initial animation (e.g., for WebGL timing)
            if (!this.skipInitialAnimation) {
                this.initAnimation();
            }
        }

        calculateCanvasSize() {
            let width;
            let height;

            if (this.parentElement) {
                // Use parent element height for header canvas, but align width with window
                const parent = this.canvas.parentElement;
                width = window.innerWidth;
                const fallbackHeight = this.canvas.height || window.innerHeight;
                height = parent ? parent.clientHeight : fallbackHeight;
            } else {
                width = window.innerWidth;
                height = window.innerHeight;
            }

            return { width, height };
        }

        applyCanvasSize(width, height) {
            const widthChanged = this.canvas.width !== width;
            const heightChanged = this.canvas.height !== height;

            if (widthChanged) {
                this.canvas.width = width;
            }
            if (heightChanged) {
                this.canvas.height = height;
            }

            // Keep CSS dimensions synchronized for crisp pixels
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';

            // Ensure no image smoothing for crisp pixels
            this.ctx.imageSmoothingEnabled = false;

            return { widthChanged, heightChanged };
        }

        setupCanvas() {
            const { width, height } = this.calculateCanvasSize();
            return this.applyCanvasSize(width, height);
        }

        updateCanvasDimensions() {
            this.cols = Math.floor(this.canvas.width / this.cellSize);
            this.rows = Math.floor(this.canvas.height / this.cellSize);

            // Calculate centering offsets
            this.offsetX = Math.floor((this.canvas.width - (this.cols * this.cellSize)) / 2);
            this.offsetY = Math.floor((this.canvas.height - (this.rows * this.cellSize)) / 2);
        }

        initAnimation() {
            this.updateCanvasDimensions();

            this.grid = new Array(this.cols).fill(0);
            this.grid[Math.floor(this.cols / 2)] = 1; // Start with center cell
            this.currentRow = 0;
        }

        startAnimation() {
            if (this.animationInterval) {
                clearInterval(this.animationInterval);
            }
            // Draw immediately to avoid blank frame on resize/start
            this.animate();
            this.animationInterval = setInterval(() => this.animate(), this.animationSpeed);
        }

        stopAnimation() {
            if (this.animationInterval) {
                clearInterval(this.animationInterval);
                this.animationInterval = null;
            }
        }

        // Override this method in subclasses
        animate() {
            console.warn('animate() method should be overridden in subclass');
        }

        // Override this method in subclasses  
        applyRule(left, center, right) {
            // Parameters are used by subclasses - suppress unused warning
            void left; void center; void right;
            console.warn('applyRule() method should be overridden in subclass');
            return 0;
        }

        cleanup() {
            this.stopAnimation();
        }
    }

    /**
     * Shared CPU Cellular Automata controller
     * Handles generation stepping, rendering, and rule changes
     */
    class CPUCellularAutomata extends CellularAutomataCanvas {
        constructor(canvasId, cellSize, config = {}) {
            super(canvasId, cellSize, config);
            if (!this.canvas) return;

            const {
                renderFrame,
                getAlpha,
                onFrameStart,
                onFrameEnd,
                onComplete,
                onRuleChange,
                initialRule,
                getInitialRule,
                clearOnRestart = true
            } = config;

            this.stateManager = new AnimationStateManager(this.cols, this.rows);
            this.renderFrame = typeof renderFrame === 'function'
                ? (frame) => renderFrame({ ...frame, instance: this })
                : () => {};
            this.getAlpha = typeof getAlpha === 'function'
                ? () => getAlpha(this)
                : () => 1;
            this.onFrameStart = typeof onFrameStart === 'function'
                ? () => onFrameStart(this)
                : () => {};
            this.onFrameEnd = typeof onFrameEnd === 'function'
                ? () => onFrameEnd(this)
                : () => {};
            this.onComplete = typeof onComplete === 'function'
                ? () => onComplete(this)
                : () => {};
            this._onRuleChange = typeof onRuleChange === 'function'
                ? (ruleNumber, isInitial) => onRuleChange(this, ruleNumber, isInitial)
                : () => {};
            this.clearOnRestart = clearOnRestart !== false;

            const initialRuleNumber = initialRule ?? (typeof getInitialRule === 'function'
                ? getInitialRule(this)
                : 30);
            this.changeRule(initialRuleNumber, true);

            // Keep base grid references aligned with state manager
            this.grid = this.stateManager.grid;
            this.currentRow = this.stateManager.currentRow;
        }

        changeRule(ruleNumber, isInitial = false) {
            this.currentRuleNumber = parseInt(ruleNumber, 10);
            this.rule = CellularAutomataRules.getRule(this.currentRuleNumber);
            this._onRuleChange(this.currentRuleNumber, isInitial);
        }

        restartForRule(ruleNumber, isInitial = false) {
            this.changeRule(ruleNumber, isInitial);
            if (this.stateManager) {
                this.stateManager.updateDimensions(this.cols, this.rows);
                this.grid = this.stateManager.grid;
                this.currentRow = this.stateManager.currentRow;
            }
            this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        initAnimation() {
            super.initAnimation();
            if (this.stateManager) {
                this.stateManager.updateDimensions(this.cols, this.rows);
                this.grid = this.stateManager.grid;
                this.currentRow = this.stateManager.currentRow;
            }
        }

        animate() {
            if (!this.stateManager) return;

            this.onFrameStart();

            if (this.clearOnRestart && this.stateManager.currentRow === 0) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.stateManager.drawnRows.length = 0;
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
                const nextGrid = this.stateManager.computeNextGenerationCPU(this.rule);
                this.stateManager.advanceGeneration(nextGrid);
                this.grid = this.stateManager.grid;
                this.currentRow = this.stateManager.currentRow;
                this.onFrameEnd();
            } else {
                this.onComplete();
            }
        }
    }

    /**
     * Background Cellular Automata - Static Rule 30 implementation
     */
    class BackgroundCellularAutomata extends CPUCellularAutomata {
        constructor() {
            super('cellular-automata-bg', 3, {
                animationSpeed: 200,
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
                initialRule: 30,
                onRuleChange: (_, ruleNumber) => {
                    updateBackgroundRuleIndicator(ruleNumber);
                }
            });

            if (this.canvas) {
                this.startAnimation();
            }
        }
    }

    /**
     * Header Cellular Automata - Cycling through multiple rules with breathing effect
     */
    class HeaderCellularAutomata extends CPUCellularAutomata {
        constructor() {
            const breathingEffect = new BreathingEffect();
            super('header-cellular-automata', 3, {
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
                    headerRuleName = ruleName;
                    if (isInitial) {
                        updateHeaderRuleIndicator(ruleName);
                    } else {
                        breathingEffect.reset();
                        updateHeaderRuleIndicatorWithVFX(ruleName);
                    }
                },
                onComplete: (instance) => instance.scheduleNextRule()
            });

            if (!this.canvas) return;
            this.nextRuleTimer = null;
            this.startAnimation();
        }

        scheduleNextRule() {
            if (this.nextRuleTimer) return;
            this.nextRuleTimer = setTimeout(() => {
                this.nextRuleTimer = null;
                const nextRule = CellularAutomataRules.getRandomRule(this.currentRuleNumber);
                this.restartForRule(nextRule);
            }, 1800);
        }
    }

    // Rule indicator update functions (consolidated)
    const RuleIndicators = {
        update(type, ruleNumber) {
            const elementId = type === 'background' ? 'bg-rule-text' : 'header-rule-text';
            const element = document.getElementById(elementId);
            if (!element) return;

            const translations = window.translations?.[window.currentLanguage];
            if (translations) {
                const typeKey = type === 'background' ? 'rule-bg' : 'rule-header';
                const typeText = translations[typeKey] || translations.rule || 'Rule';
                const ruleText = translations.rule || 'Rule';
                element.textContent = `${typeText}: ${ruleText} ${ruleNumber}`;
            } else {
                element.textContent = `Rule ${ruleNumber}`;
            }
        }
    };

    function updateBackgroundRuleIndicator(ruleNumber = 30) {
        RuleIndicators.update('background', ruleNumber);
    }

    function updateHeaderRuleIndicator(ruleNumber = headerRuleName) {
        RuleIndicators.update('header', ruleNumber);
    }

    function updateHeaderRuleIndicatorWithVFX(ruleName) {
        const element = document.getElementById('header-rule-text');
        const ruleToUse = ruleName || headerRuleName;

        if (element && window.APP && window.APP.RuleIndicatorVFX) {
            window.APP.RuleIndicatorVFX.applyRandomEffect(element, ruleToUse);
        } else {
            updateHeaderRuleIndicator(ruleToUse);
        }
    }

    function updateGPUStatusIndicator(status = null) {
        const element = document.getElementById('gpu-status-text');
        if (!element) return;

        const text = status || (() => {
            if (!gpuManager || !gpuManager.getAccelerationStatus) return 'Detecting...';
            const accelerationStatus = gpuManager.getAccelerationStatus();
            const path = accelerationStatus?.capabilities?.selectedPath || gpuManager.capabilities?.selectedPath;
            return path ? path.toUpperCase() : 'Detecting...';
        })();

        element.textContent = text;
        element.style.color = '';
    }

    function updateRuleIndicators() {
        updateBackgroundRuleIndicator();
        updateHeaderRuleIndicator();
        // Only update GPU status if GPU scripts are loaded
        if (window.APP && window.APP.GPUCellularAutomata) {
            updateGPUStatusIndicator();
        }
    }

    // GPU Manager for acceleration
    let gpuManager = null;

    async function ensureGPUManager() {
        if (gpuManager) return gpuManager;
        if (!window.APP || !window.APP.GPUCellularAutomata) return null;

        const manager = new window.APP.GPUCellularAutomata.GPUCellularAutomataManager();
        await manager.initialize();
        gpuManager = manager;
        return gpuManager;
    }

    async function initAutomaton(label, gpuFactory, cpuFactory) {
        const manager = await ensureGPUManager();
        if (manager) {
            try {
                const instance = await gpuFactory(manager);
                const selected = manager.capabilities?.selectedPath || 'gpu';
                console.log(`${label}: Using ${selected.toUpperCase()} acceleration`);
                updateGPUStatusIndicator();
                return instance;
            } catch (error) {
                console.warn(`${label} GPU initialization failed, falling back to CPU:`, error);
            }
        }

        console.log(`${label}: Using CPU implementation`);
        updateGPUStatusIndicator('CPU');
        return cpuFactory();
    }

    // Initialization functions
    async function initCellularAutomataBackground() {
        return initAutomaton(
            'Background',
            (manager) => manager.createBackgroundCellularAutomata(),
            () => new BackgroundCellularAutomata()
        );
    }

    async function initHeaderCellularAutomata() {
        return initAutomaton(
            'Header',
            (manager) => manager.createHeaderCellularAutomata(),
            () => new HeaderCellularAutomata()
        );
    }

    // GPU acceleration control functions
    function setGPUAcceleration(path = 'auto') {
        if (gpuManager) {
            // Normalize legacy boolean values
            if (path === false) path = 'cpu';
            if (path === true) path = 'auto';
            if (path === 'webgl') path = 'webgl2';
            
            gpuManager.setAccelerationPath(path);
        } else {
            console.log(`GPU acceleration will be set to ${path === false || path === 'cpu' ? 'CPU' : path.toUpperCase()} on next initialization`);
        }
    }

    function isGPUAccelerationEnabled() {
        return gpuManager ? gpuManager.capabilities.selectedPath !== 'cpu' : true;
    }

    function getGPUManager() {
        return gpuManager;
    }

    async function getGPUCapabilities() {
        try {
            const manager = await ensureGPUManager();
            return manager ? manager.getAccelerationStatus() : null;
        } catch (error) {
            console.warn('Failed to initialize GPU manager:', error);
            return null;
        }
    }

    // Expose to APP namespace
    APP.CellularAutomata = {
        CellularAutomataCanvas,
        CPUCellularAutomata,
        BackgroundCellularAutomata,
        HeaderCellularAutomata,
        initCellularAutomataBackground,
        initHeaderCellularAutomata,
        updateRuleIndicators,
        updateBackgroundRuleIndicator,
        updateHeaderRuleIndicator,
        updateHeaderRuleIndicatorWithVFX,
        updateGPUStatusIndicator,
        // GPU control functions
        setGPUAcceleration,
        isGPUAccelerationEnabled,
        getGPUManager,
        getGPUCapabilities
    };

    // Backward compatibility - expose to global scope
    window.initCellularAutomataBackground = initCellularAutomataBackground;
    window.initHeaderCellularAutomata = initHeaderCellularAutomata;
    window.updateRuleIndicators = updateRuleIndicators;
    window.headerRuleName = headerRuleName; // Expose for WebGPU module access
    window.RuleIndicators = RuleIndicators; // Expose for WebGPU module access

    // Development helper functions - expose to global scope for console access
    window.toggleGPUAcceleration = function () {
        const currentlyEnabled = isGPUAccelerationEnabled();
        const newPath = currentlyEnabled ? 'cpu' : 'auto';
        setGPUAcceleration(newPath);
        console.log(`GPU acceleration toggled: ${currentlyEnabled ? 'OFF' : 'ON'}`);
        console.log('Reload the page to see the effect.');
        return !currentlyEnabled;
    };

    window.checkGPUStatus = async function () {
        try {
            const capabilities = await getGPUCapabilities();
            if (capabilities) {
                console.log('GPU Capabilities:', capabilities);
                return capabilities;
            } else {
                console.log('GPU not available, using CPU fallback');
                return null;
            }
        } catch (error) {
            console.error('Error checking GPU status:', error);
            return null;
        }
    };

})(window.APP);
