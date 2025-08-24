// js/gpu-cellular-automata-impl.js

/**
 * GPU-Accelerated Implementations of Background and Header Cellular Automata
 * Extends the base GPU system with specific implementations for NKS project
 * Maintains visual compatibility with CPU versions while providing GPU acceleration
 * 
 * Features:
 * - GPU-accelerated BackgroundCellularAutomata (Rule 30)
 * - GPU-accelerated HeaderCellularAutomata (multi-rule cycling)
 * - Texture-to-canvas rendering with golden color effects
 * - Automatic CPU fallback for compatibility
 * - Performance monitoring and optimization
 */

window.APP = window.APP || {};

(function(APP) {
    'use strict';

    /**
     * GPU-Accelerated Background Cellular Automata
     * WebGL implementation of Rule 30 with golden gradient effects
     * Maintains visual parity with CPU version while providing performance boost
     */
    class GPUBackgroundCellularAutomata extends APP.CellularAutomata.GPUCellularAutomataCanvas {
        constructor() {
            console.log('🏭 GPUBackgroundCellularAutomata constructor starting...');
            
            // Create a new canvas for GPU rendering that overlays the CPU canvas
            const originalCanvas = document.getElementById('cellular-automata-bg');
            const gpuCanvasId = 'gpu-cellular-automata-bg';
            
            console.log('🔍 Canvas environment check:');
            console.log(`   - Original canvas exists: ${!!originalCanvas}`);
            console.log(`   - Original canvas dimensions: ${originalCanvas?.width}x${originalCanvas?.height}`);
            console.log(`   - Original canvas has context: ${originalCanvas && (originalCanvas.__webglContextAttributes || originalCanvas.__context)}`);
            
            // Remove existing GPU canvas if it exists
            const existingGPUCanvas = document.getElementById(gpuCanvasId);
            if (existingGPUCanvas) {
                console.log('🧹 Removing existing GPU canvas...');
                existingGPUCanvas.remove();
                // Force garbage collection opportunity
                setTimeout(() => {}, 0);
            }
            
            // Instead of creating a new canvas, let's reuse the existing one after cleanup
            if (originalCanvas) {
                console.log('🔄 Repurposing original canvas for GPU use...');
                
                // CRITICAL: Check if canvas has ANY existing context
                console.log('   - Checking for existing contexts...');
                
                // The key issue: once a canvas has a context (2D or WebGL), it cannot create a different type
                // We need to detect this and either reuse the same type or create a fresh canvas
                
                let hasExistingContext = false;
                let existingContextType = 'none';
                
                // Method 1: Check if getContext returns something without creating
                try {
                    // This is tricky - calling getContext might create the context
                    // Let's check internal properties first
                    if (originalCanvas._context || originalCanvas.__context) {
                        hasExistingContext = true;
                        existingContextType = 'internal_property';
                    }
                } catch (error) {
                    console.log(`   - Internal property check failed: ${error.message}`);
                }
                
                // Method 2: Try to get context with null attributes to avoid creation
                if (!hasExistingContext) {
                    try {
                        // This is risky - may create context. But we need to know.
                        const test2D = originalCanvas.getContext('2d', null);
                        if (test2D && typeof test2D.fillRect === 'function') {
                            hasExistingContext = true;
                            existingContextType = '2d';
                            console.log('   - Found existing 2D context - INCOMPATIBLE with WebGL!');
                        }
                    } catch (error) {
                        console.log(`   - 2D context test failed: ${error.message}`);
                    }
                }
                
                if (hasExistingContext) {
                    console.log(`❌ Canvas has existing ${existingContextType} context - cannot create WebGL context!`);
                    console.log('🔧 Solution: Creating fresh canvas for WebGL...');
                    
                    // We must create a fresh canvas since this one is contaminated
                    const freshCanvas = document.createElement('canvas');
                    freshCanvas.width = originalCanvas.width;
                    freshCanvas.height = originalCanvas.height;
                    freshCanvas.id = 'gpu-cellular-automata-bg';
                    
                    // Copy styles
                    const computedStyle = window.getComputedStyle(originalCanvas);
                    freshCanvas.style.position = 'absolute';
                    freshCanvas.style.top = computedStyle.top || '0';
                    freshCanvas.style.left = computedStyle.left || '0';
                    freshCanvas.style.width = computedStyle.width;
                    freshCanvas.style.height = computedStyle.height;
                    freshCanvas.style.zIndex = (parseInt(computedStyle.zIndex || '1') + 1).toString();
                    freshCanvas.style.pointerEvents = 'none';
                    
                    // Insert fresh canvas and hide original
                    originalCanvas.parentNode.insertBefore(freshCanvas, originalCanvas.nextSibling);
                    originalCanvas.style.display = 'none';
                    
                    console.log('✅ Fresh canvas created for WebGL');
                } else {
                    console.log('✅ Canvas is clean - no existing contexts detected');
                }
                
                console.log('✅ Original canvas cleaned and ready for GPU use');
            }
            
            // Determine which canvas ID to use based on whether we created a fresh one
            const targetCanvasId = document.getElementById('gpu-cellular-automata-bg') ? 'gpu-cellular-automata-bg' : 'cellular-automata-bg';
            console.log(`🎯 Using canvas ID: ${targetCanvasId}`);
            
            super(targetCanvasId, 3, { 
                animationSpeed: 200,
                rule: 30
            });
            
            if (!this.canvas) return;
            
            // Background-specific properties
            this.drawnRows = [];
            this.displayCurrentRow = 0;
            
            // Initialize background rule indicator
            this.updateBackgroundRuleIndicator();
        }
        
        cleanup() {
            // Call parent cleanup
            if (super.cleanup) {
                super.cleanup();
            }
            
            // Handle cleanup based on whether we created a fresh canvas or reused original
            const originalCanvas = document.getElementById('cellular-automata-bg');
            const gpuCanvas = document.getElementById('gpu-cellular-automata-bg');
            
            if (gpuCanvas) {
                // We created a fresh canvas - remove it and restore original
                gpuCanvas.remove();
                if (originalCanvas) {
                    originalCanvas.style.display = '';  // Show original canvas
                }
                console.log('🧹 Removed GPU canvas and restored original');
            } else {
                // We reused the original canvas - just log
                console.log('🧹 Original canvas cleaned up for CPU reuse');
            }
            
            // Start animation
            this.startAnimation();
        }
        
        // Override GPU animation to include CPU-style rendering
        animateGPU() {
            // Perform GPU computation first
            super.animateGPU();
            
            // Read back GPU results and render with golden effects
            this.renderGoldenEffects();
            
            // Update display row counter
            if (this.displayCurrentRow < this.rows - 1) {
                this.displayCurrentRow++;
            }
        }
        
        renderGoldenEffects() {
            if (!this.useGPU) return;
            
            try {
                // Read back texture data from GPU
                const currentData = this.readTextureData();
                if (!currentData) return;
                
                // Store current row for rendering
                this.drawnRows[this.displayCurrentRow] = currentData.slice(0, this.cols);
                
                // Clear canvas and render all rows with golden gradient
                const ctx = this.canvas.getContext('2d');
                
                // Only clear if starting over
                if (this.displayCurrentRow === 0) {
                    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.drawnRows.length = 0;
                }
                
                // Render all stored rows with golden gradient effect
                for (let row = 0; row < this.drawnRows.length; row++) {
                    if (!this.drawnRows[row]) continue;
                    
                    for (let col = 0; col < Math.min(this.cols, this.drawnRows[row].length); col++) {
                        if (this.drawnRows[row][col] === 1) {
                            // Create gradient effect based on position and age
                            const distance = Math.sqrt(
                                Math.pow(col - this.cols / 2, 2) + Math.pow(row - this.displayCurrentRow / 2, 2)
                            );
                            const maxDistance = Math.sqrt(this.cols * this.cols / 4 + this.rows * this.rows / 4);
                            const intensity = Math.max(0.2, 1 - distance / maxDistance);

                            // Age effect - older rows fade
                            const age = this.displayCurrentRow - row;
                            const ageFactor = Math.max(0.1, 1 - age / (this.rows * 0.3));

                            // Very subtle golden pattern
                            const alpha = intensity * ageFactor * 0.08;
                            const red = Math.floor(212 * intensity * ageFactor);
                            const green = Math.floor(175 * intensity * ageFactor);
                            const blue = Math.floor(55 * intensity * ageFactor);

                            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                            ctx.fillRect(
                                col * this.cellSize, 
                                row * this.cellSize, 
                                this.cellSize - 0.5, 
                                this.cellSize - 0.5
                            );
                        }
                    }
                }
                
            } catch (error) {
                console.error('GPU texture readback failed:', error);
                this.fallbackToCPU();
            }
        }
        
        readTextureData() {
            if (!this.gl || !this.textures.current) return null;
            
            try {
                // Create temporary framebuffer for reading
                const readFramebuffer = this.gl.createFramebuffer();
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, readFramebuffer);
                this.gl.framebufferTexture2D(
                    this.gl.FRAMEBUFFER, 
                    this.gl.COLOR_ATTACHMENT0,
                    this.gl.TEXTURE_2D, 
                    this.textures.current, 
                    0
                );
                
                // Read single row of current generation
                const rowData = new Uint8Array(this.gpuGridWidth);
                this.gl.readPixels(
                    0, this.displayCurrentRow % this.gpuGridHeight,
                    this.gpuGridWidth, 1,
                    this.gl.RED, this.gl.UNSIGNED_BYTE,
                    rowData
                );
                
                // Cleanup
                this.gl.deleteFramebuffer(readFramebuffer);
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
                
                return rowData;
                
            } catch (error) {
                console.error('Texture readback error:', error);
                return null;
            }
        }
        
        // CPU fallback implementation
        animate() {
            if (this.useGPU) {
                this.animateGPU();
            } else {
                // Use original CPU implementation from parent
                this.animateCPU();
            }
        }
        
        animateCPU() {
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

            // Calculate next generation using Rule 30
            if (this.currentRow < this.rows - 1) {
                const newGrid = new Array(this.cols).fill(0);
                for (let i = 0; i < this.cols; i++) {
                    const left = this.grid[i - 1] || 0;
                    const center = this.grid[i];
                    const right = this.grid[i + 1] || 0;
                    newGrid[i] = this.applyRule30(left, center, right);
                }
                this.grid = newGrid;
                this.currentRow++;
            }
        }
        
        applyRule30(left, center, right) {
            const rule30 = [0, 1, 1, 1, 1, 0, 0, 0];
            const pattern = left * 4 + center * 2 + right;
            return rule30[pattern];
        }
        
        updateBackgroundRuleIndicator() {
            if (typeof updateBackgroundRuleIndicator === 'function') {
                updateBackgroundRuleIndicator();
            }
        }
        
        getPerformanceInfo() {
            const baseInfo = super.getPerformanceInfo();
            return {
                ...baseInfo,
                type: 'background',
                rule: 30,
                displayRow: this.displayCurrentRow,
                totalRows: this.rows
            };
        }
    }

    /**
     * GPU-Accelerated Header Cellular Automata
     * WebGL implementation with multi-rule cycling and breathing effects
     * Maintains visual parity with CPU version while providing performance boost
     */
    class GPUHeaderCellularAutomata extends APP.CellularAutomata.GPUCellularAutomataCanvas {
        constructor() {
            // Create a new canvas for GPU rendering that overlays the CPU canvas
            const originalCanvas = document.getElementById('header-cellular-automata');
            const gpuCanvasId = 'gpu-header-cellular-automata';
            
            // Remove existing GPU canvas if it exists
            const existingGPUCanvas = document.getElementById(gpuCanvasId);
            if (existingGPUCanvas) {
                existingGPUCanvas.remove();
            }
            
            // Create new GPU canvas
            if (originalCanvas) {
                const gpuCanvas = document.createElement('canvas');
                gpuCanvas.id = gpuCanvasId;
                gpuCanvas.width = originalCanvas.width;
                gpuCanvas.height = originalCanvas.height;
                
                // Copy only the essential styles, avoiding any that might trigger context creation
                const computedStyle = window.getComputedStyle(originalCanvas);
                gpuCanvas.style.position = 'absolute';
                gpuCanvas.style.top = computedStyle.top || '0';
                gpuCanvas.style.left = computedStyle.left || '0';
                gpuCanvas.style.width = computedStyle.width;
                gpuCanvas.style.height = computedStyle.height;
                gpuCanvas.style.zIndex = computedStyle.zIndex || '1';
                gpuCanvas.style.pointerEvents = 'none'; // Ensure no interaction conflicts
                
                // Insert GPU canvas after original
                originalCanvas.parentNode.insertBefore(gpuCanvas, originalCanvas.nextSibling);
                
                // Hide original canvas
                originalCanvas.style.display = 'none';
                
                console.log('🎨 Created clean GPU overlay canvas for header');
                console.log(`📊 GPU canvas dimensions: ${gpuCanvas.width}x${gpuCanvas.height}`);
            }
            
            super(gpuCanvasId, 2, { 
                animationSpeed: 150,
                parentElement: true,
                resizeDebounce: 250
            });
            
            if (!this.canvas) return;
            
            // Header-specific properties
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
            this.currentRule = parseInt(this.headerRuleKeys[this.headerRuleIndex]);
            
            this.drawnRows = [];
            this.displayCurrentRow = 0;
            
            // Breathing effect variables
            this.fadeDirection = 1; // 1 for fade in, -1 for fade out
            this.globalAlpha = 0.3;
            
            // Update global rule name for indicator
            this.updateHeaderRuleName();
            this.updateHeaderRuleIndicator();
            
            // Set GPU rule
            this.setRule(this.currentRule);
            
            // Start animation
            this.startAnimation();
        }
        
        // Override GPU animation to include CPU-style rendering
        animateGPU() {
            // Update breathing effect
            this.updateBreathingEffect();
            
            // Perform GPU computation
            super.animateGPU();
            
            // Read back GPU results and render with golden effects
            this.renderGoldenEffects();
            
            // Update display row counter and handle rule cycling
            if (this.displayCurrentRow < this.rows - 1) {
                this.displayCurrentRow++;
            } else {
                // Cycle to next rule after delay
                setTimeout(() => {
                    this.cycleToNextRule();
                }, 1800);
            }
        }
        
        updateBreathingEffect() {
            // Update global fade (breathing effect)
            this.globalAlpha += this.fadeDirection * 0.01;
            if (this.globalAlpha >= 0.6) {
                this.fadeDirection = -1;
            } else if (this.globalAlpha <= 0.2) {
                this.fadeDirection = 1;
            }
        }
        
        renderGoldenEffects() {
            if (!this.useGPU) return;
            
            try {
                // Read back texture data from GPU
                const currentData = this.readTextureData();
                if (!currentData) return;
                
                // Store current row for rendering
                this.drawnRows[this.displayCurrentRow] = currentData.slice(0, this.cols);
                
                // Clear canvas and render all rows with golden gradient
                const ctx = this.canvas.getContext('2d');
                
                // Only clear if starting over
                if (this.displayCurrentRow === 0) {
                    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.drawnRows.length = 0;
                }
                
                // Render all stored rows with breathing golden effect
                for (let row = 0; row < this.drawnRows.length; row++) {
                    if (!this.drawnRows[row]) continue;
                    
                    for (let col = 0; col < Math.min(this.cols, this.drawnRows[row].length); col++) {
                        if (this.drawnRows[row][col] === 1) {
                            // Create gradient effect based on position and age
                            const distance = Math.sqrt(
                                Math.pow(col - this.cols / 2, 2) + Math.pow(row - this.displayCurrentRow / 2, 2)
                            );
                            const maxDistance = Math.sqrt(this.cols * this.cols / 4 + this.rows * this.rows / 4);
                            const intensity = Math.max(0.3, 1 - distance / maxDistance);

                            // Age effect - older rows fade
                            const age = this.displayCurrentRow - row;
                            const ageFactor = Math.max(0.2, 1 - age / (this.rows * 0.4));

                            // Golden pattern with breathing effect
                            const alpha = intensity * ageFactor * this.globalAlpha;
                            const red = Math.floor(212 * intensity * ageFactor);
                            const green = Math.floor(175 * intensity * ageFactor);
                            const blue = Math.floor(55 * intensity * ageFactor);

                            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
                            ctx.fillRect(
                                col * this.cellSize, 
                                row * this.cellSize, 
                                this.cellSize - 0.5, 
                                this.cellSize - 0.5
                            );
                        }
                    }
                }
                
            } catch (error) {
                console.error('GPU texture readback failed:', error);
                this.fallbackToCPU();
            }
        }
        
        readTextureData() {
            if (!this.gl || !this.textures.current) return null;
            
            try {
                // Create temporary framebuffer for reading
                const readFramebuffer = this.gl.createFramebuffer();
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, readFramebuffer);
                this.gl.framebufferTexture2D(
                    this.gl.FRAMEBUFFER, 
                    this.gl.COLOR_ATTACHMENT0,
                    this.gl.TEXTURE_2D, 
                    this.textures.current, 
                    0
                );
                
                // Read single row of current generation
                const rowData = new Uint8Array(this.gpuGridWidth);
                this.gl.readPixels(
                    0, this.displayCurrentRow % this.gpuGridHeight,
                    this.gpuGridWidth, 1,
                    this.gl.RED, this.gl.UNSIGNED_BYTE,
                    rowData
                );
                
                // Cleanup
                this.gl.deleteFramebuffer(readFramebuffer);
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
                
                return rowData;
                
            } catch (error) {
                console.error('Texture readback error:', error);
                return null;
            }
        }
        
        cycleToNextRule() {
            // Choose a random rule that's different from current one
            let newRuleIndex;
            do {
                newRuleIndex = Math.floor(Math.random() * this.headerRuleKeys.length);
            } while (newRuleIndex === this.headerRuleIndex && this.headerRuleKeys.length > 1);

            this.headerRuleIndex = newRuleIndex;
            this.currentRule = parseInt(this.headerRuleKeys[this.headerRuleIndex]);
            
            console.log(`Header: Switching to Rule ${this.currentRule}`);

            // Update GPU rule
            this.setRule(this.currentRule);

            // Update global rule name and indicator
            this.updateHeaderRuleName();
            this.updateHeaderRuleIndicator();

            // Reset animation for new rule
            this.resetAnimation();
        }
        
        resetAnimation() {
            // Reset GPU textures
            if (this.useGPU) {
                this.initializeTextureData();
            } else {
                this.initAnimation();
            }
            
            this.drawnRows.length = 0;
            this.displayCurrentRow = 0;
            this.currentRow = 0;
            
            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // CPU fallback implementation  
        animate() {
            if (this.useGPU) {
                this.animateGPU();
            } else {
                this.animateCPU();
            }
        }
        
        animateCPU() {
            // Update breathing effect
            this.updateBreathingEffect();
            
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

            // Calculate next generation using current rule
            if (this.currentRow < this.rows - 1) {
                const newGrid = new Array(this.cols).fill(0);
                for (let i = 0; i < this.cols; i++) {
                    const left = this.grid[i - 1] || 0;
                    const center = this.grid[i];
                    const right = this.grid[i + 1] || 0;
                    newGrid[i] = this.applyCurrentRule(left, center, right);
                }
                this.grid = newGrid;
                this.currentRow++;
            } else {
                // Cycle to next rule after delay
                setTimeout(() => {
                    this.cycleToNextRule();
                }, 1800);
            }
        }
        
        applyCurrentRule(left, center, right) {
            const rule = this.headerRules[this.currentRule];
            if (!rule) return 0;
            
            const pattern = left * 4 + center * 2 + right;
            return rule[pattern];
        }
        
        updateHeaderRuleName() {
            if (typeof window !== 'undefined') {
                window.headerRuleName = this.currentRule.toString();
            }
        }
        
        updateHeaderRuleIndicator() {
            if (typeof updateHeaderRuleIndicator === 'function') {
                updateHeaderRuleIndicator();
            }
        }
        
        cleanup() {
            // Call parent cleanup
            if (super.cleanup) {
                super.cleanup();
            }
            
            // Restore original canvas
            const originalCanvas = document.getElementById('header-cellular-automata');
            const gpuCanvas = document.getElementById('gpu-header-cellular-automata');
            
            if (originalCanvas) {
                originalCanvas.style.display = '';  // Restore display
                console.log('🔄 Restored original header canvas');
            }
            
            if (gpuCanvas) {
                gpuCanvas.remove();
                console.log('🧹 Removed GPU header canvas');
            }
        }
        
        getPerformanceInfo() {
            const baseInfo = super.getPerformanceInfo();
            return {
                ...baseInfo,
                type: 'header',
                rule: this.currentRule,
                displayRow: this.displayCurrentRow,
                totalRows: this.rows,
                breathingAlpha: this.globalAlpha,
                availableRules: this.headerRuleKeys
            };
        }
    }

    // GPU-enabled initialization functions
    function initGPUCellularAutomataBackground() {
        return new GPUBackgroundCellularAutomata();
    }

    function initGPUHeaderCellularAutomata() {
        return new GPUHeaderCellularAutomata();
    }

    // Expose GPU implementations to APP namespace
    APP.CellularAutomata.GPUBackgroundCellularAutomata = GPUBackgroundCellularAutomata;
    APP.CellularAutomata.GPUHeaderCellularAutomata = GPUHeaderCellularAutomata;
    APP.CellularAutomata.initGPUCellularAutomataBackground = initGPUCellularAutomataBackground;
    APP.CellularAutomata.initGPUHeaderCellularAutomata = initGPUHeaderCellularAutomata;

    // Expose to global scope for compatibility
    window.initGPUCellularAutomataBackground = initGPUCellularAutomataBackground;
    window.initGPUHeaderCellularAutomata = initGPUHeaderCellularAutomata;

})(window.APP);