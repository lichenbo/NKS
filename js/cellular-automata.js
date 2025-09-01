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
            this.resizeDebounce = options.resizeDebounce || 250;
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
            this.setupResizeListener();
            
            // Allow subclasses to skip initial animation (e.g., for WebGL timing)
            if (!this.skipInitialAnimation) {
                this.initAnimation();
            }
        }

        setupCanvas() {
            if (this.parentElement) {
                // Use parent element dimensions (for header)
                const parent = this.canvas.parentElement;
                // Use window width for alignment with background, but parent height
                this.canvas.width = window.innerWidth;
                this.canvas.height = parent.clientHeight;
            } else {
                // Use window dimensions (for background)  
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }

            // Set CSS dimensions to match canvas dimensions for 1:1 pixel ratio
            this.canvas.style.width = this.canvas.width + 'px';
            this.canvas.style.height = this.canvas.height + 'px';

            // Ensure no image smoothing for crisp pixels
            this.ctx.imageSmoothingEnabled = false;
        }

        setupResizeListener() {
            let resizeTimeout;
            const handleResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.stopAnimation();
                    this.setupCanvas();
                    this.updateCanvasDimensions();
                    this.startAnimation();
                }, this.resizeDebounce);
            };

            window.addEventListener('resize', handleResize);
            this.handleResize = handleResize; // Store reference for cleanup
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
            if (this.handleResize) {
                window.removeEventListener('resize', this.handleResize);
            }
        }
    }

    /**
     * Background Cellular Automata - Static Rule 30 implementation
     * Provides continuous Rule 30 evolution for background visual effect
     * Uses shared utilities for rendering and state management
     */
    class BackgroundCellularAutomata extends CellularAutomataCanvas {
        constructor() {
            super('cellular-automata-bg', 3, { animationSpeed: 200 });
            if (!this.canvas) return;

            // Use shared utilities
            this.ruleNumber = 30;
            this.rule = CellularAutomataRules.getRule(this.ruleNumber);
            this.stateManager = new AnimationStateManager(this.cols, this.rows);

            // Initialize background rule indicator
            updateBackgroundRuleIndicator();

            // Start animation
            this.startAnimation();
        }

        applyRule(left, center, right) {
            return CellularAutomataRules.applyRule(left, center, right, this.rule);
        }

        animate() {
            // Only clear if starting over
            if (this.stateManager.currentRow === 0) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.stateManager.drawnRows.length = 0;
            }

            // Store current row for rendering
            this.stateManager.storeCurrentGeneration();

            // Use shared renderer with background settings
            CellularAutomataRenderer.renderBackgroundRows(
                this.ctx,
                this.stateManager.drawnRows,
                this.cols,
                this.stateManager.currentRow,
                this.cellSize,
                this.offsetX,
                this.offsetY
            );

            // Calculate next generation using shared utilities
            if (!this.stateManager.isAnimationComplete()) {
                const nextGrid = this.stateManager.computeNextGenerationCPU(this.rule);
                this.stateManager.advanceGeneration(nextGrid);
                
                // Keep grid in sync for compatibility
                this.grid = this.stateManager.grid;
                this.currentRow = this.stateManager.currentRow;
            }
            // Background animation stops when complete - pattern stays static
        }

        // Override updateCanvasDimensions to update state manager
        updateCanvasDimensions() {
            super.updateCanvasDimensions();
            if (this.stateManager) {
                this.stateManager.updateDimensionsPreserveState(this.cols, this.rows);
            }
        }

        // Override initAnimation to update state manager
        initAnimation() {
            super.initAnimation();
            if (this.stateManager) {
                this.stateManager.updateDimensions(this.cols, this.rows);
            }
        }
    }

    /**
     * Header Cellular Automata - Cycling through multiple rules
     * Implements multiple Elementary CA rules with automatic cycling
     * Uses shared utilities for rule management, rendering, and breathing animation
     */
    class HeaderCellularAutomata extends CellularAutomataCanvas {
        constructor() {
            super('header-cellular-automata', 3, {
                animationSpeed: 200,
                parentElement: true,
                resizeDebounce: 250
            });
            if (!this.canvas) return;

            // Use shared utilities
            this.currentRuleNumber = CellularAutomataRules.getRandomRule();
            this.currentRule = CellularAutomataRules.getRule(this.currentRuleNumber);
            this.stateManager = new AnimationStateManager(this.cols, this.rows);
            this.breathingEffect = new BreathingEffect();

            // Update global rule name for indicator
            headerRuleName = this.currentRuleNumber.toString();

            // Initialize header rule indicator
            updateHeaderRuleIndicator();

            // Start animation
            this.startAnimation();
        }

        applyRule(left, center, right) {
            return CellularAutomataRules.applyRule(left, center, right, this.currentRule);
        }

        cycleToNextRule() {
            // Get a different random rule
            this.currentRuleNumber = CellularAutomataRules.getRandomRule(this.currentRuleNumber);
            this.currentRule = CellularAutomataRules.getRule(this.currentRuleNumber);
            const newRuleName = this.currentRuleNumber.toString();
            headerRuleName = newRuleName; // Update global variable

            // Update header rule indicator with VFX - pass rule directly
            updateHeaderRuleIndicatorWithVFX(newRuleName);

            // Reset animation state for new rule
            this.initAnimation();
            this.stateManager.reset();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        animate() {
            // Update breathing effect
            const currentAlpha = this.breathingEffect.update();

            // Only clear if starting over
            if (this.stateManager.currentRow === 0) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.stateManager.drawnRows.length = 0;
            }

            // Store current row for rendering
            this.stateManager.storeCurrentGeneration();

            // Use shared renderer with header settings and breathing effect
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

            // Calculate next generation using shared utilities
            if (!this.stateManager.isAnimationComplete()) {
                const nextGrid = this.stateManager.computeNextGenerationCPU(this.currentRule);
                this.stateManager.advanceGeneration(nextGrid);
                
                // Keep grid in sync for compatibility
                this.grid = this.stateManager.grid;
                this.currentRow = this.stateManager.currentRow;
            } else {
                // Cycle to next rule and restart after delay
                setTimeout(() => {
                    this.cycleToNextRule();
                }, 1800);
            }
        }

        // Override updateCanvasDimensions to update state manager
        updateCanvasDimensions() {
            super.updateCanvasDimensions();
            if (this.stateManager) {
                this.stateManager.updateDimensionsPreserveState(this.cols, this.rows);
            }
        }

        // Override initAnimation to update state manager
        initAnimation() {
            super.initAnimation();
            if (this.stateManager) {
                this.stateManager.updateDimensions(this.cols, this.rows);
            }
        }
    }

    // Rule indicator update functions (consolidated)
    const RuleIndicators = {
        update: function (type, ruleNumber) {
            const elementId = type === 'background' ? 'bg-rule-text' : 'header-rule-text';
            const element = document.getElementById(elementId);

            console.log(`RuleIndicators.update called:`, {
                type: type,
                ruleNumber: ruleNumber,
                elementId: elementId,
                elementExists: !!element,
                hasTranslations: !!window.translations,
                currentLanguage: window.currentLanguage,
                elementText: element ? element.textContent : 'N/A'
            });

            if (element && window.translations && window.currentLanguage) {
                const currentLanguage = window.currentLanguage;
                const typeKey = type === 'background' ? 'rule-bg' : 'rule-header';
                const typeText = window.translations[currentLanguage][typeKey] || 'Rule';
                const ruleText = window.translations[currentLanguage]['rule'] || 'Rule';
                const finalText = `${typeText}: ${ruleText} ${ruleNumber}`;
                element.textContent = finalText;
                console.log(`RuleIndicators.update: Set text to "${finalText}"`);
            } else {
                console.log(`RuleIndicators.update: Conditions not met for update`);
            }
        }
    };

    function updateBackgroundRuleIndicator() {
        RuleIndicators.update('background', '30');
    }

    function updateHeaderRuleIndicator() {
        RuleIndicators.update('header', headerRuleName);
    }

    function updateHeaderRuleIndicatorWithVFX(ruleName) {
        const element = document.getElementById('header-rule-text');
        const ruleToUse = ruleName || headerRuleName; // Use parameter or fallback to global

        console.log('VFX Debug:', {
            element: !!element,
            APP: !!window.APP,
            VFX: !!(window.APP && window.APP.RuleIndicatorVFX),
            parameterRule: ruleName,
            globalRule: headerRuleName,
            usingRule: ruleToUse,
            currentText: element ? element.textContent : 'N/A'
        });

        if (element && window.APP && window.APP.RuleIndicatorVFX) {
            // Apply random VFX effect with the correct rule
            window.APP.RuleIndicatorVFX.applyRandomEffect(element, ruleToUse, () => {
                console.log(`VFX complete for Rule ${ruleToUse}`);
            });
        } else {
            console.log('VFX fallback - using regular update');
            // Fallback to regular update if VFX not available
            updateHeaderRuleIndicator();
        }
    }

    function updateGPUStatusIndicator(status = null) {
        const element = document.getElementById('gpu-status-text');
        if (element) {
            if (status === null) {
                // Detect current status
                if (gpuManager && gpuManager.getAccelerationStatus) {
                    try {
                        const accelerationStatus = gpuManager.getAccelerationStatus();
                        if (accelerationStatus && accelerationStatus.capabilities) {
                            const path = accelerationStatus.capabilities.selectedPath;
                            element.textContent = path.toUpperCase();
                            element.style.color = ''; // Use CSS color
                        } else {
                            element.textContent = 'Detecting...';
                            element.style.color = ''; // Use CSS color
                        }
                    } catch (error) {
                        element.textContent = 'CPU';
                        element.style.color = ''; // Use CSS color
                    }
                } else {
                    element.textContent = 'Detecting...';
                    element.style.color = ''; // Use CSS color
                }
            } else {
                element.textContent = status;
                element.style.color = ''; // Use CSS color
            }
        }
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

    // Initialization functions
    async function initCellularAutomataBackground() {
        if (window.APP && window.APP.GPUCellularAutomata) {
            try {
                // Initialize GPU manager if not already done
                if (!gpuManager) {
                    gpuManager = new window.APP.GPUCellularAutomata.GPUCellularAutomataManager();
                    await gpuManager.initialize();
                }

                const gpuBackground = await gpuManager.createBackgroundCellularAutomata();
                console.log(`Background: Using ${gpuManager.capabilities.selectedPath.toUpperCase()} acceleration`);
                updateGPUStatusIndicator();
                return gpuBackground;
            } catch (error) {
                console.warn('GPU background initialization failed, falling back to CPU:', error);
                // Fall through to CPU implementation
            }
        }

        // CPU fallback
        console.log('Background: Using CPU implementation');
        updateGPUStatusIndicator('CPU');
        return new BackgroundCellularAutomata();
    }

    async function initHeaderCellularAutomata() {
        if (window.APP && window.APP.GPUCellularAutomata) {
            try {
                // Initialize GPU manager if not already done
                if (!gpuManager) {
                    gpuManager = new window.APP.GPUCellularAutomata.GPUCellularAutomataManager();
                    await gpuManager.initialize();
                }

                const gpuHeader = await gpuManager.createHeaderCellularAutomata();
                console.log(`Header: Using ${gpuManager.capabilities.selectedPath.toUpperCase()} acceleration`);
                updateGPUStatusIndicator();
                return gpuHeader;
            } catch (error) {
                console.warn('GPU header initialization failed, falling back to CPU:', error);
                // Fall through to CPU implementation
            }
        }

        // CPU fallback
        console.log('Header: Using CPU implementation');
        updateGPUStatusIndicator('CPU');
        return new HeaderCellularAutomata();
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
        if (!gpuManager) {
            try {
                gpuManager = new window.APP.GPUCellularAutomata.GPUCellularAutomataManager();
                await gpuManager.initialize();
            } catch (error) {
                console.warn('Failed to initialize GPU manager:', error);
                return null;
            }
        }
        return gpuManager.getAccelerationStatus();
    }

    // Expose to APP namespace
    APP.CellularAutomata = {
        CellularAutomataCanvas,
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