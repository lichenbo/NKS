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

(function(APP) {
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
            this.initAnimation();
        }
        
        setupCanvas() {
            if (this.parentElement) {
                // Use parent element dimensions (for header)
                const parent = this.canvas.parentElement;
                this.canvas.width = parent.clientWidth;
                this.canvas.height = parent.clientHeight;
            } else {
                // Use window dimensions (for background)
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
            this.ctx.imageSmoothingEnabled = false;
        }
        
        setupResizeListener() {
            let resizeTimeout;
            const handleResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.stopAnimation();
                    this.setupCanvas();
                    this.initAnimation();
                }, this.resizeDebounce);
            };
            
            window.addEventListener('resize', handleResize);
            this.handleResize = handleResize; // Store reference for cleanup
        }
        
        initAnimation() {
            this.cols = Math.floor(this.canvas.width / this.cellSize);
            this.rows = Math.floor(this.canvas.height / this.cellSize);
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
     * Uses golden color scheme with slow animation for subtle movement
     */
    class BackgroundCellularAutomata extends CellularAutomataCanvas {
        constructor() {
            super('cellular-automata-bg', 3, { animationSpeed: 200 });
            if (!this.canvas) return;
            
            // Background uses only Rule 30 (static)
            this.rule30 = [0, 1, 1, 1, 1, 0, 0, 0];
            this.drawnRows = [];
            
            // Initialize background rule indicator
            updateBackgroundRuleIndicator();
            
            // Start animation
            this.startAnimation();
        }
        
        applyRule(left, center, right) {
            const pattern = left * 4 + center * 2 + right;
            return this.rule30[pattern];
        }
        
        animate() {
            // Only clear if starting over
            if (this.currentRow === 0) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawnRows.length = 0;
            }

            // Store current row
            this.drawnRows[this.currentRow] = [...this.grid];

            // Draw all stored rows with golden gradient effect
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

            // Calculate next generation
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
            // Background animation stops when complete - pattern stays static
        }
    }

    /**
     * Header Cellular Automata - Cycling through multiple rules
     * Implements multiple Elementary CA rules with automatic cycling
     * Provides dynamic visual variety in header with breathing animation
     */
    class HeaderCellularAutomata extends CellularAutomataCanvas {
        constructor() {
            super('header-cellular-automata', 2, { 
                animationSpeed: 150, 
                parentElement: true,
                resizeDebounce: 250 
            });
            if (!this.canvas) return;
            
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
            this.headerCurrentRule = this.headerRules[this.headerRuleKeys[this.headerRuleIndex]];
            
            this.drawnRows = [];
            
            // Breathing effect variables
            this.fadeDirection = 1; // 1 for fade in, -1 for fade out
            this.globalAlpha = 0.3;
            
            // Update global rule name for indicator
            headerRuleName = this.headerRuleKeys[this.headerRuleIndex];
            
            // Initialize header rule indicator
            updateHeaderRuleIndicator();
            
            // Start animation
            this.startAnimation();
        }
        
        applyRule(left, center, right) {
            const pattern = left * 4 + center * 2 + right;
            return this.headerCurrentRule[pattern];
        }
        
        cycleToNextRule() {
            // Choose a random rule that's different from current one
            let newRuleIndex;
            do {
                newRuleIndex = Math.floor(Math.random() * this.headerRuleKeys.length);
            } while (newRuleIndex === this.headerRuleIndex && this.headerRuleKeys.length > 1);

            this.headerRuleIndex = newRuleIndex;
            this.headerCurrentRule = this.headerRules[this.headerRuleKeys[this.headerRuleIndex]];
            headerRuleName = this.headerRuleKeys[this.headerRuleIndex]; // Update global variable
            console.log(`Header: Switching to Rule ${headerRuleName}`);

            // Update header rule indicator
            updateHeaderRuleIndicator();

            // Reset animation for new rule
            this.initAnimation();
            this.drawnRows.length = 0;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        animate() {
            // Update global fade (breathing effect)
            this.globalAlpha += this.fadeDirection * 0.01;
            if (this.globalAlpha >= 0.6) {
                this.fadeDirection = -1;
            } else if (this.globalAlpha <= 0.2) {
                this.fadeDirection = 1;
            }

            // Only clear if starting over
            if (this.currentRow === 0) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawnRows.length = 0;
            }

            // Store current row
            this.drawnRows[this.currentRow] = [...this.grid];

            // Draw all stored rows with breathing golden effect
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

            // Calculate next generation
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
                }, 1800);
            }
        }
    }

    // Rule indicator update functions (consolidated)
    const RuleIndicators = {
        update: function(type, ruleNumber) {
            const elementId = type === 'background' ? 'bg-rule-text' : 'header-rule-text';
            const element = document.getElementById(elementId);
            if (element && window.translations && window.currentLanguage) {
                const currentLanguage = window.currentLanguage;
                const typeKey = type === 'background' ? 'rule-bg' : 'rule-header';
                const typeText = window.translations[currentLanguage][typeKey] || 'Rule';
                const ruleText = window.translations[currentLanguage]['rule'] || 'Rule';
                element.textContent = `${typeText}: ${ruleText} ${ruleNumber}`;
            }
        }
    };

    function updateBackgroundRuleIndicator() {
        RuleIndicators.update('background', '30');
    }

    function updateHeaderRuleIndicator() {
        RuleIndicators.update('header', headerRuleName);
    }

    function updateRuleIndicators() {
        updateBackgroundRuleIndicator();
        updateHeaderRuleIndicator();
    }

    // Initialization functions
    function initCellularAutomataBackground() {
        new BackgroundCellularAutomata();
    }

    function initHeaderCellularAutomata() {
        new HeaderCellularAutomata();
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
        updateHeaderRuleIndicator
    };

    // Backward compatibility - expose to global scope
    window.initCellularAutomataBackground = initCellularAutomataBackground;
    window.initHeaderCellularAutomata = initHeaderCellularAutomata;
    window.updateRuleIndicators = updateRuleIndicators;

})(window.APP);