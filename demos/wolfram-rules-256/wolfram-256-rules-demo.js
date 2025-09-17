'use strict';

/**
 * Wolfram 256 Rules Demo - Complete visualization of all elementary cellular automaton rules
 * Based on the existing wolfram-rules-explorer.js implementation with modal functionality
 */

class Wolfram256RulesDemo {
    constructor() {
        // Configuration
        this.defaultWidth = 100;
        this.defaultGenerations = 50;
        this.cellSize = 2;
        this.showRuleNumbers = true;
        
        // Current settings
        this.width = this.defaultWidth;
        this.generations = this.defaultGenerations;
        
        // DOM elements
        this.rulesGrid = document.getElementById('rules-grid');
        this.generationsSlider = document.getElementById('generations-slider');
        this.widthSlider = document.getElementById('width-slider');
        this.generationsValue = document.getElementById('generations-value');
        this.widthValue = document.getElementById('width-value');
        this.regenerateBtn = document.getElementById('regenerate-btn');
        this.toggleNumbersBtn = document.getElementById('toggle-numbers-btn');
        
        // Modal elements
        this.modal = document.getElementById('rule-modal');
        this.modalCanvas = document.getElementById('modal-canvas');
        this.modalCtx = this.modalCanvas.getContext('2d');
        this.modalCloseBtn = document.getElementById('modal-close-btn');
        this.modalTitle = document.getElementById('modal-rule-title');
        this.modalBinary = document.getElementById('modal-rule-binary');
        this.modalClassification = document.getElementById('modal-rule-classification');
        this.modalPlayBtn = document.getElementById('modal-play-btn');
        this.modalPauseBtn = document.getElementById('modal-pause-btn');
        this.modalRestartBtn = document.getElementById('modal-restart-btn');
        this.modalSpeedSlider = document.getElementById('modal-speed-slider');
        this.modalSizeSlider = document.getElementById('modal-size-slider');
        this.modalSpeedValue = document.getElementById('modal-speed-value');
        this.modalSizeValue = document.getElementById('modal-size-value');
        this.modalCurrentGeneration = document.getElementById('modal-current-generation');
        this.modalActiveCells = document.getElementById('modal-active-cells');
        this.modalDensity = document.getElementById('modal-density');
        
        // Modal animation state
        this.modalAnimationId = null;
        this.modalIsPlaying = false;
        this.modalCurrentRule = 30;
        this.modalEvolution = [];
        this.modalCurrentGen = 0;
        this.modalAnimationSpeed = 5;
        this.modalCellSize = 3;
        this.modalWidth = 150;
        this.modalGenerations = 80;
        
        // Initialize
        this.setupEventListeners();
        this.generateAllRules();
    }
    
    setupEventListeners() {
        // Main controls sliders
        this.generationsSlider.addEventListener('input', (e) => {
            this.generations = parseInt(e.target.value);
            this.generationsValue.textContent = this.generations;
        });
        
        this.widthSlider.addEventListener('input', (e) => {
            this.width = parseInt(e.target.value);
            this.widthValue.textContent = this.width;
        });
        
        // Main controls buttons
        this.regenerateBtn.addEventListener('click', () => {
            this.generateAllRules();
        });
        
        this.toggleNumbersBtn.addEventListener('click', () => {
            this.showRuleNumbers = !this.showRuleNumbers;
            this.toggleNumbersBtn.textContent = this.showRuleNumbers ? '隐藏规则编号' : '显示规则编号';
            this.updateRuleNumbersVisibility();
        });
        
        // Rule click handlers (delegated) - opens modal
        this.rulesGrid.addEventListener('click', (e) => {
            const ruleItem = e.target.closest('.rule-item');
            if (ruleItem) {
                const ruleNumber = parseInt(ruleItem.dataset.rule);
                this.openModal(ruleNumber);
            }
        });
        
        // Modal event handlers
        this.modalCloseBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal when clicking backdrop
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Modal control buttons
        this.modalPlayBtn.addEventListener('click', () => {
            this.playModalAnimation();
        });
        
        this.modalPauseBtn.addEventListener('click', () => {
            this.pauseModalAnimation();
        });
        
        this.modalRestartBtn.addEventListener('click', () => {
            this.restartModalAnimation();
        });
        
        // Modal sliders
        this.modalSpeedSlider.addEventListener('input', (e) => {
            this.modalAnimationSpeed = parseInt(e.target.value);
            this.modalSpeedValue.textContent = this.modalAnimationSpeed;
        });
        
        this.modalSizeSlider.addEventListener('input', (e) => {
            this.modalCellSize = parseInt(e.target.value);
            this.modalSizeValue.textContent = this.modalCellSize;
            this.updateModalCanvasSize();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.modal.style.display !== 'none') {
                switch (e.key) {
                    case 'Escape':
                        this.closeModal();
                        break;
                    case ' ':
                        e.preventDefault();
                        this.toggleModalAnimation();
                        break;
                    case 'r':
                    case 'R':
                        this.restartModalAnimation();
                        break;
                }
            }
        });
    }
    
    /**
     * Convert rule number to binary array (LSB-first, matching existing implementation)
     * @param {number} ruleNumber - Rule number (0-255)
     * @returns {number[]} Array of 8 bits
     */
    toBitArray(ruleNumber) {
        const arr = new Array(8);
        for (let i = 0; i < 8; i++) {
            arr[i] = (ruleNumber >> i) & 1;
        }
        return arr;
    }
    
    /**
     * Apply elementary cellular automaton rule
     * @param {number[]} rule - Rule as bit array
     * @param {number} left - Left neighbor state
     * @param {number} center - Center cell state  
     * @param {number} right - Right neighbor state
     * @returns {number} New state (0 or 1)
     */
    applyRule(rule, left, center, right) {
        const pattern = (left << 2) | (center << 1) | right;
        return rule[pattern];
    }
    
    /**
     * Generate cellular automaton evolution for a given rule
     * @param {number} ruleNumber - Rule number (0-255)
     * @param {number} width - Grid width
     * @param {number} generations - Number of generations
     * @returns {number[][]} 2D array representing the evolution
     */
    generateEvolution(ruleNumber, width, generations) {
        const rule = this.toBitArray(ruleNumber);
        const grid = [];
        
        // Initialize first generation with single center cell
        const firstGen = new Array(width).fill(0);
        firstGen[Math.floor(width / 2)] = 1;
        grid.push(firstGen);
        
        // Generate subsequent generations
        for (let gen = 1; gen < generations; gen++) {
            const prevGen = grid[gen - 1];
            const newGen = new Array(width);
            
            for (let i = 0; i < width; i++) {
                const left = prevGen[(i - 1 + width) % width];
                const center = prevGen[i];
                const right = prevGen[(i + 1) % width];
                newGen[i] = this.applyRule(rule, left, center, right);
            }
            
            grid.push(newGen);
        }
        
        return grid;
    }
    
    /**
     * Draw evolution on canvas
     * @param {HTMLCanvasElement} canvas - Target canvas
     * @param {number[][]} evolution - Evolution data
     */
    drawEvolution(canvas, evolution) {
        const ctx = canvas.getContext('2d');
        const width = evolution[0].length;
        const height = evolution.length;
        
        // Set canvas size
        canvas.width = width * this.cellSize;
        canvas.height = height * this.cellSize;
        
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw cells
        ctx.fillStyle = '#d4af37';
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (evolution[y][x] === 1) {
                    ctx.fillRect(
                        x * this.cellSize,
                        y * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }
    }
    
    /**
     * Create a rule item element
     * @param {number} ruleNumber - Rule number (0-255)
     * @returns {HTMLElement} Rule item element
     */
    createRuleItem(ruleNumber) {
        const item = document.createElement('div');
        item.className = 'rule-item';
        item.dataset.rule = ruleNumber;
        
        const header = document.createElement('div');
        header.className = 'rule-header';
        
        const title = document.createElement('h3');
        title.className = 'rule-title';
        title.textContent = `规则 ${ruleNumber}`;
        
        const binary = document.createElement('span');
        binary.className = 'rule-binary';
        binary.textContent = ruleNumber.toString(2).padStart(8, '0');
        
        header.appendChild(title);
        header.appendChild(binary);
        
        const canvas = document.createElement('canvas');
        canvas.className = 'rule-canvas';
        
        item.appendChild(header);
        item.appendChild(canvas);
        
        return item;
    }
    
    /**
     * Generate and display all 256 rules
     */
    generateAllRules() {
        // Clear existing grid
        this.rulesGrid.innerHTML = '';
        
        // Show loading message
        const loading = document.createElement('div');
        loading.className = 'loading-message';
        loading.textContent = '正在生成全部 256 条规则…';
        this.rulesGrid.appendChild(loading);
        
        // Generate rules in batches to avoid blocking UI
        let currentRule = 0;
        const batchSize = 16;
        
        const generateBatch = () => {
            const endRule = Math.min(currentRule + batchSize, 256);
            
            for (let rule = currentRule; rule < endRule; rule++) {
                const ruleItem = this.createRuleItem(rule);
                const canvas = ruleItem.querySelector('.rule-canvas');
                
                // Generate evolution
                const evolution = this.generateEvolution(rule, this.width, this.generations);
                this.drawEvolution(canvas, evolution);
                
                this.rulesGrid.appendChild(ruleItem);
            }
            
            currentRule = endRule;
            
            if (currentRule < 256) {
                // Continue with next batch
                requestAnimationFrame(generateBatch);
            } else {
                // Remove loading message
                loading.remove();
                console.log('All 256 rules generated successfully');
            }
        };
        
        // Remove loading message and start generation
        loading.remove();
        generateBatch();
    }
    
    /**
     * Update rule numbers visibility
     */
    updateRuleNumbersVisibility() {
        const ruleHeaders = document.querySelectorAll('.rule-header');
        ruleHeaders.forEach(header => {
            header.style.display = this.showRuleNumbers ? 'flex' : 'none';
        });
    }
    
    /**
     * Highlight a specific rule
     * @param {number} ruleNumber - Rule number to highlight
     */
    highlightRule(ruleNumber) {
        // Remove existing highlights
        document.querySelectorAll('.rule-item.highlighted').forEach(item => {
            item.classList.remove('highlighted');
        });
        
        // Highlight selected rule
        const ruleItem = document.querySelector(`[data-rule="${ruleNumber}"]`);
        if (ruleItem) {
            ruleItem.classList.add('highlighted');
            ruleItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Log rule information
        console.log(`Rule ${ruleNumber} selected (binary: ${ruleNumber.toString(2).padStart(8, '0')})`);
    }
    
    /**
     * Get rule classification (basic categories)
     * @param {number} ruleNumber - Rule number
     * @returns {string} Classification
     */
    getRuleClassification(ruleNumber) {
        // Some well-known classifications
        const classifications = {
            0: '均匀（I 类）',
            30: '混沌（III 类）',
            54: '复杂（IV 类）',
            90: '分形（II 类）',
            110: '复杂（IV 类）',
            150: '分形（II 类）',
            184: '复杂（IV 类）',
            255: '均匀（I 类）'
        };
        
        return classifications[ruleNumber] || '未知分类';
    }
    
    // ================================
    // MODAL FUNCTIONALITY
    // ================================
    
    /**
     * Open modal with animated rule visualization
     * @param {number} ruleNumber - Rule number to display
     */
    openModal(ruleNumber) {
        this.modalCurrentRule = ruleNumber;
        this.modal.style.display = 'flex';
        
        // Update modal content
        this.modalTitle.textContent = `规则 ${ruleNumber}`;
        this.modalBinary.textContent = ruleNumber.toString(2).padStart(8, '0');
        this.modalClassification.textContent = this.getRuleClassification(ruleNumber);
        
        // Generate evolution data
        this.modalEvolution = this.generateEvolution(ruleNumber, this.modalWidth, this.modalGenerations);
        
        // Setup canvas
        this.updateModalCanvasSize();
        
        // Reset animation state
        this.modalCurrentGen = 0;
        this.updateModalStats();
        
        // Start animation automatically
        this.restartModalAnimation();
        
        console.log(`Opened modal for Rule ${ruleNumber}`);
    }
    
    /**
     * Close modal and stop animation
     */
    closeModal() {
        this.modal.style.display = 'none';
        this.pauseModalAnimation();
    }
    
    /**
     * Update modal canvas size based on cell size
     */
    updateModalCanvasSize() {
        this.modalCanvas.width = this.modalWidth * this.modalCellSize;
        this.modalCanvas.height = this.modalGenerations * this.modalCellSize;
        
        // Redraw current state
        this.drawModalEvolutionUpToGeneration(this.modalCurrentGen);
    }
    
    /**
     * Play modal animation
     */
    playModalAnimation() {
        if (this.modalIsPlaying) return;
        
        this.modalIsPlaying = true;
        this.modalPlayBtn.disabled = true;
        this.modalPauseBtn.disabled = false;
        
        this.animateModalStep();
    }
    
    /**
     * Pause modal animation
     */
    pauseModalAnimation() {
        this.modalIsPlaying = false;
        this.modalPlayBtn.disabled = false;
        this.modalPauseBtn.disabled = true;
        
        if (this.modalAnimationId) {
            cancelAnimationFrame(this.modalAnimationId);
            this.modalAnimationId = null;
        }
    }
    
    /**
     * Restart modal animation from beginning
     */
    restartModalAnimation() {
        this.pauseModalAnimation();
        this.modalCurrentGen = 0;
        this.clearModalCanvas();
        this.updateModalStats();
        this.playModalAnimation();
    }
    
    /**
     * Toggle modal animation play/pause
     */
    toggleModalAnimation() {
        if (this.modalIsPlaying) {
            this.pauseModalAnimation();
        } else {
            this.playModalAnimation();
        }
    }
    
    /**
     * Animate one step (generation) of the modal evolution
     */
    animateModalStep() {
        if (!this.modalIsPlaying) return;
        
        if (this.modalCurrentGen < this.modalEvolution.length) {
            // Draw current generation
            this.drawModalGeneration(this.modalCurrentGen);
            this.modalCurrentGen++;
            this.updateModalStats();
            
            // Calculate delay based on speed (1 = slow, 10 = fast)
            const delay = Math.max(50, 1000 - this.modalAnimationSpeed * 90);
            
            // Schedule next frame
            this.modalAnimationId = setTimeout(() => {
                requestAnimationFrame(() => this.animateModalStep());
            }, delay);
        } else {
            // Animation complete
            this.modalIsPlaying = false;
            this.modalPlayBtn.disabled = false;
            this.modalPauseBtn.disabled = true;
            console.log(`Animation complete for Rule ${this.modalCurrentRule}`);
        }
    }
    
    /**
     * Draw a single generation line on the modal canvas
     * @param {number} generation - Generation number to draw
     */
    drawModalGeneration(generation) {
        if (generation >= this.modalEvolution.length) return;
        
        const ctx = this.modalCtx;
        const row = this.modalEvolution[generation];
        const y = generation * this.modalCellSize;
        
        for (let x = 0; x < row.length; x++) {
            if (row[x] === 1) {
                ctx.fillStyle = '#d4af37'; // Gold color
                ctx.fillRect(
                    x * this.modalCellSize,
                    y,
                    this.modalCellSize,
                    this.modalCellSize
                );
            }
        }
    }
    
    /**
     * Draw evolution up to a specific generation (for resize/redraw)
     * @param {number} maxGeneration - Maximum generation to draw
     */
    drawModalEvolutionUpToGeneration(maxGeneration) {
        this.clearModalCanvas();
        
        for (let gen = 0; gen <= Math.min(maxGeneration, this.modalEvolution.length - 1); gen++) {
            this.drawModalGeneration(gen);
        }
    }
    
    /**
     * Clear the modal canvas
     */
    clearModalCanvas() {
        this.modalCtx.fillStyle = '#000000';
        this.modalCtx.fillRect(0, 0, this.modalCanvas.width, this.modalCanvas.height);
    }
    
    /**
     * Update modal statistics display
     */
    updateModalStats() {
        const currentGen = Math.min(this.modalCurrentGen, this.modalEvolution.length - 1);
        this.modalCurrentGeneration.textContent = currentGen;
        
        if (currentGen < this.modalEvolution.length) {
            const row = this.modalEvolution[currentGen];
            const activeCells = row.reduce((sum, cell) => sum + cell, 0);
            const density = ((activeCells / row.length) * 100).toFixed(1);
            
            this.modalActiveCells.textContent = activeCells;
            this.modalDensity.textContent = `${density}%`;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.wolfram256Demo = new Wolfram256RulesDemo();
    console.log('Wolfram 256 Rules Demo initialized');
});
