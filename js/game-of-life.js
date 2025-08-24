// js/game-of-life.js

/**
 * Conway's Game of Life Implementation for NKS Project
 * Interactive cellular automata demonstration with multiple grid sizes and patterns
 * Supports touch controls, responsive design, and comprehensive pattern library
 * 
 * Key Features:
 * - Multiple grid sizes: 20×20, 40×40, 100×100, 300×300
 * - 12 famous Conway patterns: Glider, Blinker, Toad, Beacon, Pulsar, etc.
 * - Mobile-optimized touch controls with orientation change support
 * - Variable speed control (0.25x to 10x)
 * - Complex initial patterns including Gosper Gun and methuselahs
 * - Responsive canvas sizing and visual effects
 * 
 * Time Complexity: O(n²) per generation where n is grid size
 * Space Complexity: O(n²) for grid storage
 * 
 * Patterns Included:
 * - Basic: Glider, Blinker, Toad, Beacon
 * - Oscillators: Pulsar, Pentadecathlon  
 * - Spaceships: Lightweight Spaceship
 * - Generators: Gosper Gun
 * - Methuselahs: Acorn, Diehard, R-Pentomino
 * - Special: Infinite Growth pattern
 */

window.APP = window.APP || {};

(function(APP) {
    'use strict';

    /**
     * Initialize Game of Life instance with cleanup of existing instances
     * Ensures only one active Game of Life simulation at a time
     * 
     * Time Complexity: O(1)
     * Space Complexity: O(1)
     * 
     * @function initGameOfLife
     * @returns {void}
     */
    function initGameOfLife() {
        if (window.gameOfLifeInstance) {
            window.gameOfLifeInstance.cleanup();
            window.gameOfLifeInstance = null;
        }
        
        window.gameOfLifeInstance = new GameOfLife('game-canvas');
    }

    /**
     * Conway's Game of Life class with comprehensive interactive features
     * Implements complete cellular automata simulation with UI controls
     * 
     * @class GameOfLife
     */
    class GameOfLife {
        /**
         * Initialize Game of Life with canvas and default configuration
         * Sets up responsive canvas, grid, controls, and initial patterns
         * 
         * Time Complexity: O(n²) where n is initial grid size
         * Space Complexity: O(n²) for grid storage
         * 
         * @param {string} canvasId - DOM element ID for canvas
         */
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                console.error('Game of Life canvas not found:', canvasId);
                return;
            }
            
            this.ctx = this.canvas.getContext('2d');
            this.gridSize = 20;
            this.cellSize = 0;
            this.grid = [];
            this.nextGrid = [];
            this.isPlaying = false;
            this.interval = null;
            this.speed = 600; // Default speed for slider value 5
            
            this.setupCanvas();
            this.initializeGrid();
            this.setupEventListeners();
            this.setInitialActiveButton();
            this.draw();
        }
        
        /**
         * Configure canvas dimensions and responsive sizing
         * Handles mobile optimization and canvas scaling
         * 
         * Time Complexity: O(1)
         * @returns {void}
         * @private
         */
        setupCanvas() {
            // Make canvas responsive to container size
            const rect = this.canvas.getBoundingClientRect();
            const maxWidth = Math.min(600, rect.width || 600);
            const maxHeight = Math.min(400, window.innerWidth <= 768 ? 300 : 400);
            
            this.canvas.width = maxWidth;
            this.canvas.height = maxHeight;
            this.cellSize = Math.min(this.canvas.width / this.gridSize, this.canvas.height / this.gridSize);
            
            // Center the grid
            this.offsetX = (this.canvas.width - this.gridSize * this.cellSize) / 2;
            this.offsetY = (this.canvas.height - this.gridSize * this.cellSize) / 2;
            
            console.log(`Canvas setup: ${this.canvas.width}x${this.canvas.height}, cellSize: ${this.cellSize}, offset: (${this.offsetX}, ${this.offsetY})`);
        }
        
        /**
         * Initialize grid with sophisticated starting patterns based on grid size
         * Creates engaging initial configurations for different scales
         * 
         * Grid Size Patterns:
         * - 20×20: Simple patterns (blinker, glider)
         * - 40×40: Multiple interacting patterns (oscillators, gliders)
         * - 100×100: Complex patterns including simplified Gosper Gun
         * - 300×300: Large scale with multiple guns and methuselahs
         * 
         * Time Complexity: O(n²) where n is grid size
         * @returns {void}
         * @private
         */
        initializeGrid() {
            this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
            this.nextGrid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
            
            // Add engaging starting patterns based on grid size
            if (this.gridSize === 20) {
                // 20x20: Simple patterns for beginners
                // Add a blinker pattern in the center
                const center = Math.floor(this.gridSize / 2);
                this.grid[center-1][center] = true;
                this.grid[center][center] = true;
                this.grid[center+1][center] = true;
                
                // Add a glider in the upper left area
                this.grid[3][4] = true;
                this.grid[4][5] = true;
                this.grid[5][3] = true;
                this.grid[5][4] = true;
                this.grid[5][5] = true;
                
            } else if (this.gridSize === 40) {
                // 40x40: Multiple interacting patterns
                // Add a beacon oscillator
                this.grid[8][8] = true;
                this.grid[8][9] = true;
                this.grid[9][8] = true;
                this.grid[10][11] = true;
                this.grid[11][10] = true;
                this.grid[11][11] = true;
                
                // Add a toad oscillator
                this.grid[15][20] = true;
                this.grid[15][21] = true;
                this.grid[15][22] = true;
                this.grid[16][19] = true;
                this.grid[16][20] = true;
                this.grid[16][21] = true;
                
                // Add two gliders moving toward each other
                // Glider 1 (moving southeast)
                this.grid[5][25] = true;
                this.grid[6][26] = true;
                this.grid[7][24] = true;
                this.grid[7][25] = true;
                this.grid[7][26] = true;
                
                // Glider 2 (moving northwest)
                this.grid[30][15] = true;
                this.grid[30][14] = true;
                this.grid[30][13] = true;
                this.grid[31][15] = true;
                this.grid[32][14] = true;
                
            } else if (this.gridSize === 100) {
                // 100x100: Complex patterns including Gosper Gun
                // Add a simplified Gosper Gun for glider generation
                const gunStartRow = 40;
                const gunStartCol = 20;
                // Left block
                this.grid[gunStartRow][gunStartCol] = true;
                this.grid[gunStartRow][gunStartCol+1] = true;
                this.grid[gunStartRow+1][gunStartCol] = true;
                this.grid[gunStartRow+1][gunStartCol+1] = true;
                
                // Main gun structure (simplified)
                this.grid[gunStartRow][gunStartCol+10] = true;
                this.grid[gunStartRow+1][gunStartCol+10] = true;
                this.grid[gunStartRow+2][gunStartCol+10] = true;
                this.grid[gunStartRow-1][gunStartCol+11] = true;
                this.grid[gunStartRow+3][gunStartCol+11] = true;
                this.grid[gunStartRow-2][gunStartCol+12] = true;
                this.grid[gunStartRow+4][gunStartCol+12] = true;
                this.grid[gunStartRow+1][gunStartCol+13] = true;
                this.grid[gunStartRow-1][gunStartCol+14] = true;
                this.grid[gunStartRow+3][gunStartCol+14] = true;
                this.grid[gunStartRow][gunStartCol+15] = true;
                this.grid[gunStartRow+1][gunStartCol+15] = true;
                this.grid[gunStartRow+2][gunStartCol+15] = true;
                this.grid[gunStartRow+1][gunStartCol+16] = true;
                
                // Right structures
                this.grid[gunStartRow-2][gunStartCol+20] = true;
                this.grid[gunStartRow-1][gunStartCol+20] = true;
                this.grid[gunStartRow][gunStartCol+20] = true;
                this.grid[gunStartRow-2][gunStartCol+21] = true;
                this.grid[gunStartRow-1][gunStartCol+21] = true;
                this.grid[gunStartRow][gunStartCol+21] = true;
                this.grid[gunStartRow-3][gunStartCol+22] = true;
                this.grid[gunStartRow+1][gunStartCol+22] = true;
                this.grid[gunStartRow-4][gunStartCol+24] = true;
                this.grid[gunStartRow-3][gunStartCol+24] = true;
                this.grid[gunStartRow+1][gunStartCol+24] = true;
                this.grid[gunStartRow+2][gunStartCol+24] = true;
                
                // Final block
                this.grid[gunStartRow-1][gunStartCol+34] = true;
                this.grid[gunStartRow][gunStartCol+34] = true;
                this.grid[gunStartRow-1][gunStartCol+35] = true;
                this.grid[gunStartRow][gunStartCol+35] = true;
                
                // Add a pulsar in another area
                const pulsarRow = 70;
                const pulsarCol = 60;
                // Pulsar pattern (13x13)
                const pulsarPattern = [
                    [0,0,1,1,1,0,0,0,1,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [0,0,1,1,1,0,0,0,1,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,1,1,1,0,0,0,1,1,1,0,0],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,1,1,1,0,0,0,1,1,1,0,0]
                ];
                for (let row = 0; row < pulsarPattern.length; row++) {
                    for (let col = 0; col < pulsarPattern[row].length; col++) {
                        if (pulsarPattern[row][col] === 1) {
                            this.grid[pulsarRow + row][pulsarCol + col] = true;
                        }
                    }
                }
                
            } else if (this.gridSize === 300) {
                // 300x300: Large scale patterns and methuselahs
                // Add multiple Gosper guns creating complex interactions
                this.addGosperGun(50, 50);
                this.addGosperGun(200, 50);
                this.addGosperGun(50, 200);
                
                // Add an R-pentomino (famous methuselah)
                const rRow = 150;
                const rCol = 150;
                this.grid[rRow][rCol+1] = true;
                this.grid[rRow][rCol+2] = true;
                this.grid[rRow+1][rCol] = true;
                this.grid[rRow+1][rCol+1] = true;
                this.grid[rRow+2][rCol+1] = true;
                
                // Add an acorn (another methuselah)
                const acornRow = 100;
                const acornCol = 100;
                this.grid[acornRow][acornCol+1] = true;
                this.grid[acornRow+1][acornCol+3] = true;
                this.grid[acornRow+2][acornCol] = true;
                this.grid[acornRow+2][acornCol+1] = true;
                this.grid[acornRow+2][acornCol+4] = true;
                this.grid[acornRow+2][acornCol+5] = true;
                this.grid[acornRow+2][acornCol+6] = true;
                
                // Add a diehard pattern
                const diehardRow = 80;
                const diehardCol = 220;
                this.grid[diehardRow+1][diehardCol] = true;
                this.grid[diehardRow+1][diehardCol+1] = true;
                this.grid[diehardRow+2][diehardCol+1] = true;
                this.grid[diehardRow+2][diehardCol+5] = true;
                this.grid[diehardRow+2][diehardCol+6] = true;
                this.grid[diehardRow+2][diehardCol+7] = true;
                this.grid[diehardRow][diehardCol+6] = true;
            }
        }
        
        /**
         * Add complete Gosper Gun pattern at specified position
         * Creates glider-generating gun for complex large-grid simulations
         * 
         * @param {number} startRow - Starting row position
         * @param {number} startCol - Starting column position
         * @returns {void}
         * @private
         */
        addGosperGun(startRow, startCol) {
            const gunPattern = [
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            ];
            
            for (let row = 0; row < gunPattern.length; row++) {
                for (let col = 0; col < gunPattern[row].length; col++) {
                    if (gunPattern[row][col] === 1 && 
                        startRow + row < this.gridSize && 
                        startCol + col < this.gridSize) {
                        this.grid[startRow + row][startCol + col] = true;
                    }
                }
            }
        }
        
        /**
         * Set initial active button for default grid size
         * @returns {void}
         * @private
         */
        setInitialActiveButton() {
            // Set the correct initial active button for the default grid size (20)
            document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
            const initialBtn = document.getElementById('grid-smallest');
            if (initialBtn) initialBtn.classList.add('active');
        }
        
        /**
         * Set up comprehensive event listeners for user interaction
         * Handles canvas interaction, controls, mobile optimization, and pattern loading
         * 
         * Events:
         * - Canvas: click, touch (with mobile optimization)
         * - Controls: play/pause, step, clear, random, speed
         * - Grid size: buttons for different scales
         * - Patterns: 12 famous Conway patterns
         * - Responsive: resize and orientation change
         * 
         * @returns {void}
         * @private
         */
        setupEventListeners() {
            // Handle both mouse and touch events
            this.canvas.addEventListener('click', (e) => this.handleClick(e));
            this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
            
            // Prevent default touch behavior to avoid scrolling issues
            this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
            this.canvas.addEventListener('touchend', (e) => e.preventDefault());
            
            // Handle window resize and orientation change for mobile
            window.addEventListener('resize', () => this.handleResize());
            window.addEventListener('orientationchange', () => {
                setTimeout(() => this.handleResize(), 100); // Delay to let orientation settle
            });
            
            const playBtn = document.getElementById('play-pause-btn');
            const stepBtn = document.getElementById('step-btn');
            const clearBtn = document.getElementById('clear-btn');
            const randomBtn = document.getElementById('random-btn');
            const speedSlider = document.getElementById('speed-slider');
            const speedDisplay = document.getElementById('speed-display');
            
            if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
            if (stepBtn) stepBtn.addEventListener('click', () => this.step());
            if (clearBtn) clearBtn.addEventListener('click', () => this.clear());
            if (randomBtn) randomBtn.addEventListener('click', () => this.randomize());
            
            if (speedSlider) {
                // Set initial display value for default slider position (value=5)
                if (speedDisplay) speedDisplay.textContent = '1.00x';

                speedSlider.addEventListener('input', (e) => {
                    const sliderValue = parseInt(e.target.value);
                    let speedMultiplier;

                    if (sliderValue <= 5) {
                        // Scale from 0.25x to 1.0x for slider values 1-5
                        speedMultiplier = 0.25 + (sliderValue - 1) * 0.1875;
                    } else {
                        // Scale from 1.0x to 10.0x for slider values 5-10
                        speedMultiplier = 1.0 + (sliderValue - 5) * 1.8;
                    }
                    
                    // Update speed display
                    if (speedDisplay) speedDisplay.textContent = speedMultiplier.toFixed(2) + 'x';

                    // Calculate interval delay (1x speed = 600ms)
                    this.speed = 600 / speedMultiplier;
                    
                    if (this.isPlaying) {
                        this.stop();
                        this.play();
                    }
                });
            }
            
            const gridSmallest = document.getElementById('grid-smallest');
            const gridSmall = document.getElementById('grid-small');
            const gridMedium = document.getElementById('grid-medium');
            const gridLarge = document.getElementById('grid-large');
            
            if (gridSmallest) gridSmallest.addEventListener('click', () => this.setGridSize(20));
            if (gridSmall) gridSmall.addEventListener('click', () => this.setGridSize(40));
            if (gridMedium) gridMedium.addEventListener('click', () => this.setGridSize(100));
            if (gridLarge) gridLarge.addEventListener('click', () => this.setGridSize(300));
            
            document.querySelectorAll('.pattern-btn').forEach(btn => {
                btn.addEventListener('click', () => this.loadPattern(btn.dataset.pattern));
            });
        }
        
        /**
         * Handle mouse click events on canvas with precise coordinate calculation
         * @param {MouseEvent} e - Mouse event
         * @returns {void}
         * @private
         */
        handleClick(e) {
            const rect = this.canvas.getBoundingClientRect();
            
            // Account for canvas scaling
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const x = (e.clientX - rect.left) * scaleX - this.offsetX;
            const y = (e.clientY - rect.top) * scaleY - this.offsetY;
            
            this.toggleCell(x, y);
        }
        
        /**
         * Handle touch events on canvas with mobile optimization
         * Includes detailed logging for mobile debugging
         * 
         * @param {TouchEvent} e - Touch event
         * @returns {void}
         * @private
         */
        handleTouch(e) {
            e.preventDefault(); // Prevent default touch behavior
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0]; // Get first touch point
            
            // Account for canvas scaling and device pixel ratio
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            const x = (touch.clientX - rect.left) * scaleX - this.offsetX;
            const y = (touch.clientY - rect.top) * scaleY - this.offsetY;
            
            // Visual feedback for touch detection
            console.log(`Touch detected: clientX=${touch.clientX}, clientY=${touch.clientY}`);
            console.log(`Canvas rect: left=${rect.left}, top=${rect.top}, width=${rect.width}, height=${rect.height}`);
            console.log(`Scale: X=${scaleX.toFixed(2)}, Y=${scaleY.toFixed(2)}`);
            
            this.toggleCell(x, y);
        }
        
        /**
         * Toggle cell state at specified pixel coordinates
         * Converts pixel coordinates to grid coordinates with bounds checking
         * 
         * @param {number} x - Pixel X coordinate
         * @param {number} y - Pixel Y coordinate
         * @returns {void}
         * @private
         */
        toggleCell(x, y) {
            const col = Math.floor(x / this.cellSize);
            const row = Math.floor(y / this.cellSize);
            
            // Debug logging for mobile testing
            console.log(`Touch/Click at pixel (${x.toFixed(1)}, ${y.toFixed(1)}) -> grid (${col}, ${row})`);
            
            if (col >= 0 && col < this.gridSize && row >= 0 && row < this.gridSize) {
                this.grid[row][col] = !this.grid[row][col];
                this.draw();
                
                // Visual feedback for successful cell toggle
                console.log(`Cell toggled at grid (${col}, ${row}) to ${this.grid[row][col]}`);
            } else {
                console.log(`Touch/Click outside grid bounds`);
            }
        }
        
        /**
         * Handle window resize and orientation change events
         * @returns {void}
         * @private
         */
        handleResize() {
            console.log('Handling resize/orientation change');
            this.setupCanvas();
            this.draw();
        }
        
        /**
         * Toggle play/pause state of simulation
         * @returns {void}
         * @public
         */
        togglePlay() {
            if (this.isPlaying) {
                this.stop();
            } else {
                this.play();
            }
        }
        
        /**
         * Start simulation with translation-aware button text
         * @returns {void}
         * @public
         */
        play() {
            this.isPlaying = true;
            const playBtn = document.getElementById('play-pause-btn');
            if (playBtn) {
                const pauseText = window.translations && window.currentLanguage && window.translations[window.currentLanguage] ? window.translations[window.currentLanguage]['pause'] : '⏸ Pause';
                playBtn.textContent = pauseText;
            }
            this.interval = setInterval(() => this.step(), this.speed);
        }
        
        /**
         * Stop simulation with translation-aware button text
         * @returns {void}
         * @public
         */
        stop() {
            this.isPlaying = false;
            const playBtn = document.getElementById('play-pause-btn');
            if (playBtn) {
                const playText = window.translations && window.currentLanguage && window.translations[window.currentLanguage] ? window.translations[window.currentLanguage]['play'] : '▶ Play';
                playBtn.textContent = playText;
            }
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        }
        
        /**
         * Execute one generation step using Conway's Game of Life rules
         * Implements classic cellular automata rules:
         * - Live cell with 2-3 neighbors survives
         * - Dead cell with exactly 3 neighbors becomes alive
         * - All other cells die or remain dead
         * 
         * Time Complexity: O(n²) where n is grid size
         * @returns {void}
         * @public
         */
        step() {
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    const neighbors = this.countNeighbors(row, col);
                    const isAlive = this.grid[row][col];
                    
                    if (isAlive) {
                        this.nextGrid[row][col] = neighbors === 2 || neighbors === 3;
                    } else {
                        this.nextGrid[row][col] = neighbors === 3;
                    }
                }
            }
            
            [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
            this.draw();
        }
        
        /**
         * Count living neighbors for a cell using Moore neighborhood
         * @param {number} row - Cell row position
         * @param {number} col - Cell column position  
         * @returns {number} Number of living neighbors (0-8)
         * @private
         */
        countNeighbors(row, col) {
            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    
                    const newRow = row + i;
                    const newCol = col + j;
                    
                    if (newRow >= 0 && newRow < this.gridSize && 
                        newCol >= 0 && newCol < this.gridSize && 
                        this.grid[newRow][newCol]) {
                        count++;
                    }
                }
            }
            return count;
        }
        
        /**
         * Clear grid completely (no initial patterns)
         * @returns {void}
         * @public
         */
        clear() {
            this.stop();
            // Create completely empty grid (no initial patterns)
            this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
            this.nextGrid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
            this.draw();
        }
        
        /**
         * Randomize grid with 30% cell density
         * @returns {void}
         * @public
         */
        randomize() {
            this.stop();
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    this.grid[row][col] = Math.random() < 0.3;
                }
            }
            this.draw();
        }
        
        /**
         * Change grid size and reinitialize with appropriate patterns
         * Updates UI buttons and recreates grid with size-appropriate patterns
         * 
         * @param {number} size - New grid size (20, 40, 100, or 300)
         * @returns {void}
         * @public
         */
        setGridSize(size) {
            this.stop();
            this.gridSize = size;
            this.cellSize = Math.min(this.canvas.width / this.gridSize, this.canvas.height / this.gridSize);
            this.offsetX = (this.canvas.width - this.gridSize * this.cellSize) / 2;
            this.offsetY = (this.canvas.height - this.gridSize * this.cellSize) / 2;
            
            document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
            if (size === 20) {
                const btn = document.getElementById('grid-smallest');
                if (btn) btn.classList.add('active');
            } else if (size === 40) {
                const btn = document.getElementById('grid-small');
                if (btn) btn.classList.add('active');
            } else if (size === 100) {
                const btn = document.getElementById('grid-medium');
                if (btn) btn.classList.add('active');
            } else if (size === 300) {
                const btn = document.getElementById('grid-large');
                if (btn) btn.classList.add('active');
            }
            
            this.initializeGrid();
            this.draw();
        }
        
        /**
         * Load famous Conway's Game of Life patterns
         * Comprehensive pattern library with 12 well-known formations
         * 
         * Pattern Categories:
         * - Still lifes: (none included, but could be added)
         * - Oscillators: blinker, toad, beacon, pulsar, pentadecathlon
         * - Spaceships: glider, lightweight-spaceship
         * - Guns: gosper-gun
         * - Methuselahs: acorn, diehard, r-pentomino
         * - Special: infinite-growth
         * 
         * @param {string} pattern - Pattern name from patterns object
         * @returns {void}
         * @public
         */
        loadPattern(pattern) {
            this.clear();
            const centerRow = Math.floor(this.gridSize / 2);
            const centerCol = Math.floor(this.gridSize / 2);
            
            const patterns = {
                glider: [[0,1,0], [0,0,1], [1,1,1]],
                blinker: [[1], [1], [1]],
                toad: [[0,1,1,1], [1,1,1,0]],
                beacon: [[1,1,0,0], [1,1,0,0], [0,0,1,1], [0,0,1,1]],
                pulsar: [
                    [0,0,1,1,1,0,0,0,1,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [0,0,1,1,1,0,0,0,1,1,1,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,1,1,1,0,0,0,1,1,1,0,0],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [1,0,0,0,0,1,0,1,0,0,0,0,1],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,1,1,1,0,0,0,1,1,1,0,0]
                ],
                'lightweight-spaceship': [
                    [1,0,0,1,0],
                    [0,0,0,0,1],
                    [1,0,0,0,1],
                    [0,1,1,1,1]
                ],
                'gosper-gun': [
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                    [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                ],
                pentadecathlon: [
                    [0,0,1,0,0,0,0,1,0,0],
                    [1,1,0,1,1,1,1,0,1,1],
                    [0,0,1,0,0,0,0,1,0,0]
                ],
                acorn: [
                    [0,1,0,0,0,0,0],
                    [0,0,0,1,0,0,0],
                    [1,1,0,0,1,1,1]
                ],
                diehard: [
                    [0,0,0,0,0,0,1,0],
                    [1,1,0,0,0,0,0,0],
                    [0,1,0,0,0,1,1,1]
                ],
                'r-pentomino': [
                    [0,1,1],
                    [1,1,0],
                    [0,1,0]
                ],
                'infinite-growth': [
                    [1,1,1,0,1],
                    [1,0,0,0,0],
                    [0,0,0,1,1],
                    [0,1,1,0,1],
                    [1,0,1,0,1]
                ]
            };
            
            const patternData = patterns[pattern];
            if (!patternData) return;
            
            const startRow = centerRow - Math.floor(patternData.length / 2);
            const startCol = centerCol - Math.floor(patternData[0].length / 2);
            
            for (let row = 0; row < patternData.length; row++) {
                for (let col = 0; col < patternData[row].length; col++) {
                    const gridRow = startRow + row;
                    const gridCol = startCol + col;
                    
                    if (gridRow >= 0 && gridRow < this.gridSize && 
                        gridCol >= 0 && gridCol < this.gridSize) {
                        this.grid[gridRow][gridCol] = patternData[row][col] === 1;
                    }
                }
            }
            
            this.draw();
        }
        
        /**
         * Render current grid state to canvas with visual enhancements
         * Includes adaptive grid lines, gradient effects, and size-optimized styling
         * 
         * Visual Features:
         * - Adaptive grid line thickness based on cell size
         * - Golden color scheme with gradient effects for larger cells
         * - Cell padding for visual clarity
         * - Responsive to grid size for optimal appearance
         * 
         * @returns {void}
         * @public
         */
        draw() {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw grid lines with adaptive thickness
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = this.gridSize <= 20 ? 1 : 0.5;
            
            for (let i = 0; i <= this.gridSize; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.offsetX + i * this.cellSize, this.offsetY);
                this.ctx.lineTo(this.offsetX + i * this.cellSize, this.offsetY + this.gridSize * this.cellSize);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(this.offsetX, this.offsetY + i * this.cellSize);
                this.ctx.lineTo(this.offsetX + this.gridSize * this.cellSize, this.offsetY + i * this.cellSize);
                this.ctx.stroke();
            }
            
            // Draw live cells with better visual feedback for smaller grids
            this.ctx.fillStyle = '#ffd700';
            const cellPadding = this.gridSize <= 20 ? 2 : 1;
            
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    if (this.grid[row][col]) {
                        // Add slight gradient effect for larger cells
                        if (this.gridSize <= 20) {
                            const gradient = this.ctx.createRadialGradient(
                                this.offsetX + col * this.cellSize + this.cellSize/2,
                                this.offsetY + row * this.cellSize + this.cellSize/2,
                                0,
                                this.offsetX + col * this.cellSize + this.cellSize/2,
                                this.offsetY + row * this.cellSize + this.cellSize/2,
                                this.cellSize/2
                            );
                            gradient.addColorStop(0, '#ffdd44');
                            gradient.addColorStop(1, '#daa520');
                            this.ctx.fillStyle = gradient;
                        } else {
                            this.ctx.fillStyle = '#ffd700';
                        }
                        
                        this.ctx.fillRect(
                            this.offsetX + col * this.cellSize + cellPadding,
                            this.offsetY + row * this.cellSize + cellPadding,
                            this.cellSize - cellPadding * 2,
                            this.cellSize - cellPadding * 2
                        );
                    }
                }
            }
        }
        
        /**
         * Clean up Game of Life instance and prevent memory leaks
         * Stops simulation and removes event listeners
         * 
         * @returns {void}
         * @public
         */
        cleanup() {
            this.stop();
            if (this.canvas) {
                // Remove event listeners to prevent memory leaks
                const newCanvas = this.canvas.cloneNode(true);
                this.canvas.parentNode.replaceChild(newCanvas, this.canvas);
            }
        }
    }

    // Expose to APP namespace
    APP.GameOfLife = {
        GameOfLife,
        initGameOfLife
    };

})(window.APP);