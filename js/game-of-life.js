// js/game-of-life.js

/**
 * Conway's Game of Life Implementation for NKS Project
 * This file has been refactored to use the new AutomataEngine.
 * It defines a custom runner for the Game of Life rules and a custom renderer.
 */

window.APP = window.APP || {};

(function(APP) {
    'use strict';

    /**
     * A runner for Conway's Game of Life.
     */
    class GameOfLifeRunner {
        computeNextGeneration(grid) {
            const newGrid = grid.map(arr => arr.slice());
            const rows = grid.length;
            const cols = grid[0].length;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const neighbors = this.countNeighbors(grid, row, col);
                    const isAlive = grid[row][col];

                    if (isAlive && (neighbors < 2 || neighbors > 3)) {
                        newGrid[row][col] = 0;
                    } else if (!isAlive && neighbors === 3) {
                        newGrid[row][col] = 1;
                    }
                }
            }
            return newGrid;
        }

        countNeighbors(grid, row, col) {
            let count = 0;
            const rows = grid.length;
            const cols = grid[0].length;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && grid[newRow][newCol]) {
                        count++;
                    }
                }
            }
            return count;
        }

        cleanup() {}
    }

    /**
     * Custom renderer for the Game of Life.
     */
    class GameOfLifeRenderer {
        static render(ctx, grid, cellSize, offsetX, offsetY) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;

            const rows = grid.length;
            const cols = grid[0].length;

            for (let i = 0; i <= rows; i++) {
                ctx.beginPath();
                ctx.moveTo(offsetX, offsetY + i * cellSize);
                ctx.lineTo(offsetX + cols * cellSize, offsetY + i * cellSize);
                ctx.stroke();
            }

            for (let i = 0; i <= cols; i++) {
                ctx.beginPath();
                ctx.moveTo(offsetX + i * cellSize, offsetY);
                ctx.lineTo(offsetX + i * cellSize, offsetY + rows * cellSize);
                ctx.stroke();
            }

            ctx.fillStyle = '#ffd700';
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    if (grid[row][col]) {
                        ctx.fillRect(
                            offsetX + col * cellSize + 1,
                            offsetY + row * cellSize + 1,
                            cellSize - 2,
                            cellSize - 2
                        );
                    }
                }
            }
        }
    }

    let gameInstance = null;

    function initGameOfLife() {
        if (gameInstance) {
            gameInstance.cleanup();
        }

        const runner = new GameOfLifeRunner();
        const config = {
            cellSize: 20,
            animationSpeed: 100,
            is2D: true, // Custom flag for 2D automata
            initialGrid: createInitialGrid(20, 20),
            renderer: GameOfLifeRenderer,
        };

        // A simplified animator for 2D grids.
        // This is a simplified version of the main AutomataAnimator.
        // For a full refactor, this would be merged into the main animator.
        class GameOfLifeAnimator {
            constructor(canvasId, runner, options) {
                this.canvas = document.getElementById(canvasId);
                this.ctx = this.canvas.getContext('2d');
                this.runner = runner;
                this.options = options;
                this.grid = options.initialGrid;
                this.animationFrameId = null;
                this.isPlaying = false;
                this.setupCanvas();
                this.draw();
                this.setupEventListeners();
            }

            setupCanvas() {
                const rect = this.canvas.getBoundingClientRect();
                this.canvas.width = Math.min(600, rect.width || 600);
                this.canvas.height = Math.min(400, window.innerWidth <= 768 ? 300 : 400);
                this.cellSize = this.canvas.width / this.grid[0].length;
                this.offsetX = (this.canvas.width - this.grid[0].length * this.cellSize) / 2;
                this.offsetY = (this.canvas.height - this.grid.length * this.cellSize) / 2;
            }

            draw() {
                this.options.renderer.render(this.ctx, this.grid, this.cellSize, this.offsetX, this.offsetY);
            }

            async step() {
                this.grid = await this.runner.computeNextGeneration(this.grid);
                this.draw();
                if (this.isPlaying) {
                    this.animationFrameId = setTimeout(() => this.step(), this.options.animationSpeed);
                }
            }

            togglePlay() {
                this.isPlaying = !this.isPlaying;
                if (this.isPlaying) {
                    this.step();
                } else {
                    if (this.animationFrameId) {
                        clearTimeout(this.animationFrameId);
                    }
                }
                const playBtn = document.getElementById('play-pause-btn');
                if (playBtn) {
                    playBtn.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
                }
            }
            
            clear() {
                this.isPlaying = false;
                if (this.animationFrameId) {
                    clearTimeout(this.animationFrameId);
                }
                this.grid = createInitialGrid(this.grid.length, this.grid[0].length, true);
                this.draw();
            }

            randomize() {
                this.isPlaying = false;
                if (this.animationFrameId) {
                    clearTimeout(this.animationFrameId);
                }
                this.grid = createInitialGrid(this.grid.length, this.grid[0].length, false, true);
                this.draw();
            }

            setupEventListeners() {
                document.getElementById('play-pause-btn')?.addEventListener('click', () => this.togglePlay());
                document.getElementById('step-btn')?.addEventListener('click', () => this.step());
                document.getElementById('clear-btn')?.addEventListener('click', () => this.clear());
                document.getElementById('random-btn')?.addEventListener('click', () => this.randomize());
            }
            
            cleanup() {
                this.isPlaying = false;
                if (this.animationFrameId) {
                    clearTimeout(this.animationFrameId);
                }
            }
        }

        gameInstance = new GameOfLifeAnimator('game-canvas', runner, config);
    }

    function createInitialGrid(rows, cols, empty = false, random = false) {
        const grid = Array(rows).fill().map(() => Array(cols).fill(0));
        if (empty) return grid;
        if (random) {
             for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    grid[r][c] = Math.random() < 0.3 ? 1 : 0;
                }
            }
            return grid;
        }
        // Default pattern
        const centerRow = Math.floor(rows / 2);
        const centerCol = Math.floor(cols / 2);
        const glider = [[0, 1, 0], [0, 0, 1], [1, 1, 1]];
        for (let r = 0; r < glider.length; r++) {
            for (let c = 0; c < glider[r].length; c++) {
                if (glider[r][c]) {
                    grid[centerRow + r][centerCol + c] = 1;
                }
            }
        }
        return grid;
    }

    APP.GameOfLife = {
        initGameOfLife
    };

})(window.APP);