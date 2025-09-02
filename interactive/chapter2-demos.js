// Chapter 2 Interactive Demos
// Cellular Automata Simulations

class CellularAutomaton {
    constructor(canvas, rule = 30) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.rule = rule;
        this.width = Math.floor(canvas.width / 2); // 2px per cell
        this.height = Math.floor(canvas.height / 2);
        this.grid = [];
        this.generation = 0;
        this.isRunning = false;
        this.speed = 5;
        this.cellSize = 2;
        
        this.initializeGrid();
        this.draw();
    }

    initializeGrid() {
        this.grid = [];
        // Initialize with single black cell in center
        const firstRow = new Array(this.width).fill(0);
        firstRow[Math.floor(this.width / 2)] = 1;
        this.grid.push(firstRow);
        this.generation = 0;
    }

    setRule(rule) {
        this.rule = rule;
    }

    // Convert rule number to binary lookup table
    getRuleBinary() {
        const binary = this.rule.toString(2).padStart(8, '0');
        return binary.split('').reverse().map(bit => parseInt(bit));
    }

    // Apply cellular automaton rule
    evolve() {
        if (this.grid.length >= this.height) return;

        const currentRow = this.grid[this.grid.length - 1];
        const newRow = new Array(this.width).fill(0);
        const ruleBits = this.getRuleBinary();

        for (let i = 0; i < this.width; i++) {
            const left = i > 0 ? currentRow[i - 1] : 0;
            const center = currentRow[i];
            const right = i < this.width - 1 ? currentRow[i + 1] : 0;
            
            // Convert neighborhood to binary index
            const neighborhood = left * 4 + center * 2 + right;
            newRow[i] = ruleBits[neighborhood];
        }

        this.grid.push(newRow);
        this.generation++;
    }

    draw() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#FFD700';
        
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === 1) {
                    this.ctx.fillRect(
                        x * this.cellSize, 
                        y * this.cellSize, 
                        this.cellSize, 
                        this.cellSize
                    );
                }
            }
        }
    }

    step() {
        this.evolve();
        this.draw();
    }

    play() {
        this.isRunning = true;
        this.animate();
    }

    pause() {
        this.isRunning = false;
    }

    animate() {
        if (!this.isRunning) return;
        
        this.step();
        setTimeout(() => {
            requestAnimationFrame(() => this.animate());
        }, 1100 - this.speed * 100);
    }

    reset() {
        this.pause();
        this.initializeGrid();
        this.draw();
    }

    // Calculate randomness of center column
    calculateRandomness() {
        if (this.grid.length < 10) return 0;
        
        const centerCol = Math.floor(this.width / 2);
        const centerBits = this.grid.slice(0, Math.min(this.grid.length, 50))
            .map(row => row[centerCol]);
        
        // Simple randomness measure: count transitions
        let transitions = 0;
        for (let i = 1; i < centerBits.length; i++) {
            if (centerBits[i] !== centerBits[i-1]) transitions++;
        }
        
        return Math.min(100, Math.round((transitions / centerBits.length) * 200));
    }

    // Get center column for randomness display
    getCenterColumn() {
        const centerCol = Math.floor(this.width / 2);
        return this.grid.map(row => row[centerCol]);
    }
}

// Rule classification system
const RULE_CLASSES = {
    1: { name: "Uniform", description: "Evolution leads to homogeneous state", color: "#666" },
    2: { name: "Periodic", description: "Evolution leads to periodic patterns", color: "#4CAF50" },
    3: { name: "Chaotic", description: "Evolution leads to chaotic patterns", color: "#FF5722" },
    4: { name: "Complex", description: "Evolution leads to complex localized structures", color: "#2196F3" }
};

// Known rule classifications (simplified)
const KNOWN_CLASSIFICATIONS = {
    0: 1, 8: 1, 32: 1, 40: 1, 72: 1, 104: 1, 136: 1, 168: 1, 200: 1, 232: 1,
    1: 2, 5: 2, 19: 2, 23: 2, 51: 2, 85: 2, 95: 2, 119: 2, 187: 2, 221: 2,
    18: 3, 22: 3, 26: 3, 30: 3, 45: 3, 60: 3, 90: 3, 105: 3, 122: 3, 126: 3, 129: 3, 146: 3, 150: 3, 182: 3,
    54: 4, 110: 4, 124: 4, 137: 4, 193: 4
};

function classifyRule(rule) {
    return KNOWN_CLASSIFICATIONS[rule] || 3; // Default to chaotic if unknown
}

// Demo 1: Rule 30 Interactive Explorer
class Rule30Demo {
    constructor() {
        this.canvas = document.getElementById('rule30-canvas');
        this.ca = new CellularAutomaton(this.canvas, 30);
        this.playBtn = document.getElementById('rule30-play');
        this.stepBtn = document.getElementById('rule30-step');
        this.resetBtn = document.getElementById('rule30-reset');
        this.speedSlider = document.getElementById('rule30-speed');
        this.speedDisplay = document.getElementById('rule30-speed-display');
        this.generationDisplay = document.getElementById('rule30-generation');
        this.randomnessDisplay = document.getElementById('rule30-randomness');

        this.initializeControls();
        this.updateStats();
    }

    initializeControls() {
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.stepBtn.addEventListener('click', () => this.step());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        this.speedSlider.addEventListener('input', (e) => {
            this.ca.speed = parseInt(e.target.value);
            this.speedDisplay.textContent = e.target.value;
        });
    }

    togglePlay() {
        if (this.ca.isRunning) {
            this.ca.pause();
            this.playBtn.textContent = 'Play';
        } else {
            this.ca.play();
            this.playBtn.textContent = 'Pause';
            this.updateLoop();
        }
    }

    step() {
        this.ca.step();
        this.updateStats();
    }

    reset() {
        this.ca.reset();
        this.playBtn.textContent = 'Play';
        this.updateStats();
    }

    updateStats() {
        this.generationDisplay.textContent = this.ca.generation;
        this.randomnessDisplay.textContent = this.ca.calculateRandomness() + '%';
    }

    updateLoop() {
        if (this.ca.isRunning) {
            this.updateStats();
            setTimeout(() => this.updateLoop(), 100);
        }
    }
}

// Demo 2: Four Behavior Types Classifier
class BehaviorClassifierDemo {
    constructor() {
        this.canvas = document.getElementById('classifier-canvas');
        this.ca = new CellularAutomaton(this.canvas, 30);
        this.ruleSlider = document.getElementById('classifier-rule');
        this.ruleDisplay = document.getElementById('classifier-rule-display');
        this.playBtn = document.getElementById('classifier-play');
        this.resetBtn = document.getElementById('classifier-reset');
        this.ruleVisualization = document.getElementById('rule-visualization');
        this.ruleClassInfo = document.getElementById('current-rule-info');

        this.initializeControls();
        this.updateRuleVisualization();
        this.updateClassification();
    }

    initializeControls() {
        this.ruleSlider.addEventListener('input', (e) => {
            const rule = parseInt(e.target.value);
            this.ca.setRule(rule);
            this.ca.reset();
            this.ruleDisplay.textContent = rule;
            this.updateRuleVisualization();
            this.updateClassification();
        });

        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Famous rule buttons
        document.getElementById('famous-rule-30').addEventListener('click', () => this.setRule(30));
        document.getElementById('famous-rule-90').addEventListener('click', () => this.setRule(90));
        document.getElementById('famous-rule-110').addEventListener('click', () => this.setRule(110));
        document.getElementById('famous-rule-150').addEventListener('click', () => this.setRule(150));
    }

    setRule(rule) {
        this.ruleSlider.value = rule;
        this.ca.setRule(rule);
        this.ca.reset();
        this.ruleDisplay.textContent = rule;
        this.updateRuleVisualization();
        this.updateClassification();
    }

    updateRuleVisualization() {
        const rule = this.ca.rule;
        const binary = rule.toString(2).padStart(8, '0');
        const ruleBits = binary.split('').reverse();

        this.ruleVisualization.innerHTML = '';
        
        for (let i = 7; i >= 0; i--) {
            const cell = document.createElement('div');
            cell.className = 'rule-cell';
            
            const pattern = document.createElement('div');
            pattern.className = 'rule-pattern';
            
            // Create the neighborhood pattern
            const neighborhood = i.toString(2).padStart(3, '0');
            for (let j = 0; j < 3; j++) {
                const bit = document.createElement('div');
                bit.className = `rule-bit ${neighborhood[j] === '1' ? 'on' : ''}`;
                pattern.appendChild(bit);
            }
            
            cell.appendChild(pattern);
            
            // Add the result
            const result = document.createElement('div');
            result.className = `rule-bit ${ruleBits[i] === '1' ? 'on' : ''}`;
            cell.appendChild(result);
            
            this.ruleVisualization.appendChild(cell);
        }
    }

    updateClassification() {
        const rule = this.ca.rule;
        const classNum = classifyRule(rule);
        const classInfo = RULE_CLASSES[classNum];
        
        this.ruleClassInfo.innerHTML = `Rule ${rule} - Class ${classNum} (${classInfo.name})`;
        this.ruleClassInfo.style.color = classInfo.color;
    }

    togglePlay() {
        if (this.ca.isRunning) {
            this.ca.pause();
            this.playBtn.textContent = 'Play';
        } else {
            this.ca.play();
            this.playBtn.textContent = 'Pause';
        }
    }

    reset() {
        this.ca.reset();
        this.playBtn.textContent = 'Play';
    }
}

// Demo 3: Rule 110 Structure Analyzer
class Rule110Demo {
    constructor() {
        this.canvas = document.getElementById('rule110-canvas');
        this.ca = new CellularAutomaton(this.canvas, 110);
        this.playBtn = document.getElementById('rule110-play');
        this.stepBtn = document.getElementById('rule110-step');
        this.resetBtn = document.getElementById('rule110-reset');
        this.highlightBtn = document.getElementById('rule110-highlight');
        this.speedSlider = document.getElementById('rule110-speed');
        this.speedDisplay = document.getElementById('rule110-speed-display');
        this.generationDisplay = document.getElementById('rule110-generation');
        this.structuresDisplay = document.getElementById('rule110-structures');

        this.highlightStructures = false;
        this.structures = [];

        this.initializeControls();
        this.setupInitialPattern();
    }

    setupInitialPattern() {
        // Set up interesting initial pattern for Rule 110
        this.ca.initializeGrid();
        const firstRow = this.ca.grid[0];
        // Create a more interesting initial pattern
        const center = Math.floor(firstRow.length / 2);
        firstRow[center - 5] = 1;
        firstRow[center - 3] = 1;
        firstRow[center - 1] = 1;
        firstRow[center + 1] = 1;
        firstRow[center + 3] = 1;
        this.ca.draw();
    }

    initializeControls() {
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.stepBtn.addEventListener('click', () => this.step());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        this.highlightBtn.addEventListener('click', () => {
            this.highlightStructures = !this.highlightStructures;
            this.highlightBtn.textContent = this.highlightStructures ? 'Hide Structures' : 'Highlight Structures';
            this.highlightBtn.classList.toggle('active');
            this.redraw();
        });
        
        this.speedSlider.addEventListener('input', (e) => {
            this.ca.speed = parseInt(e.target.value);
            this.speedDisplay.textContent = e.target.value;
        });
    }

    togglePlay() {
        if (this.ca.isRunning) {
            this.ca.pause();
            this.playBtn.textContent = 'Play';
        } else {
            this.ca.play();
            this.playBtn.textContent = 'Pause';
            this.updateLoop();
        }
    }

    step() {
        this.ca.step();
        this.analyzeStructures();
        this.updateStats();
        this.redraw();
    }

    reset() {
        this.ca.reset();
        this.setupInitialPattern();
        this.playBtn.textContent = 'Play';
        this.structures = [];
        this.updateStats();
    }

    analyzeStructures() {
        // Simple structure detection - look for moving patterns
        this.structures = [];
        
        if (this.ca.grid.length < 3) return;
        
        const currentRow = this.ca.grid[this.ca.grid.length - 1];
        const prevRow = this.ca.grid[this.ca.grid.length - 2];
        
        // Detect active regions (simplified)
        for (let i = 1; i < currentRow.length - 1; i++) {
            if (currentRow[i] === 1 && (currentRow[i-1] === 1 || currentRow[i+1] === 1)) {
                // Check if this region differs from previous generation
                if (prevRow[i] !== currentRow[i] || 
                    prevRow[i-1] !== currentRow[i-1] || 
                    prevRow[i+1] !== currentRow[i+1]) {
                    this.structures.push({
                        x: i,
                        y: this.ca.grid.length - 1,
                        type: 'active'
                    });
                }
            }
        }
    }

    redraw() {
        this.ca.draw();
        
        if (this.highlightStructures && this.structures.length > 0) {
            // Highlight detected structures
            this.ca.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.structures.forEach(structure => {
                this.ca.ctx.fillRect(
                    structure.x * this.ca.cellSize - 1,
                    structure.y * this.ca.cellSize - 1,
                    this.ca.cellSize + 2,
                    this.ca.cellSize + 2
                );
            });
        }
    }

    updateStats() {
        this.generationDisplay.textContent = this.ca.generation;
        this.structuresDisplay.textContent = this.structures.length;
    }

    updateLoop() {
        if (this.ca.isRunning) {
            this.analyzeStructures();
            this.updateStats();
            this.redraw();
            setTimeout(() => this.updateLoop(), 200);
        }
    }
}

// Demo 4: Simple Rules → Complex Results
class ComplexityDemo {
    constructor() {
        this.canvas = document.getElementById('complexity-canvas');
        this.ca = new CellularAutomaton(this.canvas, 30);
        this.playBtn = document.getElementById('complexity-play');
        this.resetBtn = document.getElementById('complexity-reset');
        this.ruleSlider = document.getElementById('complexity-rule');
        this.ruleDisplay = document.getElementById('complexity-rule-display');
        this.complexityMeter = document.getElementById('complexity-meter');
        this.ruleTableDisplay = document.getElementById('simple-rule-display');

        this.initializeControls();
        this.updateRuleDisplay();
    }

    initializeControls() {
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        this.ruleSlider.addEventListener('input', (e) => {
            const rule = parseInt(e.target.value);
            this.ca.setRule(rule);
            this.ca.reset();
            this.ruleDisplay.textContent = rule;
            this.updateRuleDisplay();
            this.updateComplexity();
        });
    }

    updateRuleDisplay() {
        const rule = this.ca.rule;
        const binary = rule.toString(2).padStart(8, '0');
        const ruleBits = binary.split('').reverse();

        this.ruleTableDisplay.innerHTML = '';
        
        for (let i = 7; i >= 0; i--) {
            const cell = document.createElement('div');
            cell.className = 'rule-cell';
            cell.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            
            const pattern = document.createElement('div');
            pattern.className = 'rule-pattern';
            
            // Create the neighborhood pattern
            const neighborhood = i.toString(2).padStart(3, '0');
            for (let j = 0; j < 3; j++) {
                const bit = document.createElement('div');
                bit.className = `rule-bit ${neighborhood[j] === '1' ? 'on' : ''}`;
                pattern.appendChild(bit);
            }
            
            cell.appendChild(pattern);
            
            // Add arrow
            const arrow = document.createElement('div');
            arrow.textContent = '→';
            arrow.style.color = '#ffd700';
            cell.appendChild(arrow);
            
            // Add the result
            const result = document.createElement('div');
            result.className = `rule-bit ${ruleBits[i] === '1' ? 'on' : ''}`;
            cell.appendChild(result);
            
            this.ruleTableDisplay.appendChild(cell);
        }
    }

    calculateComplexity() {
        if (this.ca.grid.length < 10) return 0;
        
        // Calculate Kolmogorov-like complexity measure
        const pattern = this.ca.grid.map(row => row.join('')).join('');
        const compressed = this.simpleCompress(pattern);
        
        return Math.min(100, Math.round((1 - compressed.length / pattern.length) * 100));
    }

    simpleCompress(str) {
        // Simple run-length encoding
        let compressed = '';
        let count = 1;
        let current = str[0];
        
        for (let i = 1; i < str.length; i++) {
            if (str[i] === current && count < 9) {
                count++;
            } else {
                compressed += count + current;
                current = str[i];
                count = 1;
            }
        }
        compressed += count + current;
        
        return compressed;
    }

    togglePlay() {
        if (this.ca.isRunning) {
            this.ca.pause();
            this.playBtn.textContent = 'Play';
        } else {
            this.ca.play();
            this.playBtn.textContent = 'Pause';
            this.updateLoop();
        }
    }

    reset() {
        this.ca.reset();
        this.playBtn.textContent = 'Play';
        this.updateComplexity();
    }

    updateComplexity() {
        this.complexityMeter.textContent = this.calculateComplexity() + '%';
    }

    updateLoop() {
        if (this.ca.isRunning) {
            this.updateComplexity();
            setTimeout(() => this.updateLoop(), 200);
        }
    }
}

// Demo 5: Historical Context Simulator
class HistoricalDemo {
    constructor() {
        this.handCanvas = document.getElementById('historical-hand-canvas');
        this.earlyCanvas = document.getElementById('historical-early-canvas');
        this.modernCanvas = document.getElementById('historical-modern-canvas');
        
        this.handCA = new CellularAutomaton(this.handCanvas, 30);
        this.earlyCA = new CellularAutomaton(this.earlyCanvas, 30);
        this.modernCA = new CellularAutomaton(this.modernCanvas, 30);

        this.predictionPanel = document.getElementById('prediction-panel');
        this.revealBtn = document.getElementById('reveal-prediction');
        
        this.initializeControls();
        this.setupCanvases();
    }

    setupCanvases() {
        // Adjust cell sizes for different canvas sizes
        this.handCA.cellSize = 3;
        this.earlyCA.cellSize = 2;
        this.modernCA.cellSize = 1;
        
        this.handCA.width = Math.floor(this.handCanvas.width / this.handCA.cellSize);
        this.earlyCA.width = Math.floor(this.earlyCanvas.width / this.earlyCA.cellSize);
        this.modernCA.width = Math.floor(this.modernCanvas.width / this.modernCA.cellSize);
        
        this.handCA.height = Math.floor(this.handCanvas.height / this.handCA.cellSize);
        this.earlyCA.height = Math.floor(this.earlyCanvas.height / this.earlyCA.cellSize);
        this.modernCA.height = Math.floor(this.modernCanvas.height / this.modernCA.cellSize);
        
        this.handCA.initializeGrid();
        this.earlyCA.initializeGrid();
        this.modernCA.initializeGrid();
        
        this.drawAll();
    }

    initializeControls() {
        document.getElementById('historical-hand').addEventListener('click', () => this.runHandCalculation());
        document.getElementById('historical-early').addEventListener('click', () => this.runEarlyComputer());
        document.getElementById('historical-modern').addEventListener('click', () => this.runModernComputer());
        document.getElementById('historical-reset').addEventListener('click', () => this.resetAll());
        document.getElementById('prediction-game').addEventListener('click', () => this.startPredictionGame());
        this.revealBtn.addEventListener('click', () => this.revealPrediction());
    }

    async runHandCalculation() {
        this.handCA.reset();
        for (let i = 0; i < 10; i++) {
            await this.delay(500);
            this.handCA.step();
        }
    }

    async runEarlyComputer() {
        this.earlyCA.reset();
        for (let i = 0; i < 50; i++) {
            await this.delay(50);
            this.earlyCA.step();
        }
    }

    async runModernComputer() {
        this.modernCA.reset();
        this.modernCA.speed = 10;
        this.modernCA.play();
        
        setTimeout(() => {
            this.modernCA.pause();
        }, 5000);
    }

    resetAll() {
        this.handCA.reset();
        this.earlyCA.reset();
        this.modernCA.reset();
        this.predictionPanel.style.display = 'none';
    }

    startPredictionGame() {
        this.handCA.reset();
        // Run a few steps to show a pattern
        for (let i = 0; i < 8; i++) {
            this.handCA.step();
        }
        
        this.predictionPanel.style.display = 'block';
        this.revealBtn.style.display = 'inline-block';
    }

    revealPrediction() {
        this.handCA.step();
        this.revealBtn.textContent = 'Try Another Prediction';
        this.revealBtn.onclick = () => {
            this.startPredictionGame();
            this.revealBtn.textContent = 'Reveal Next Row';
            this.revealBtn.onclick = () => this.revealPrediction();
        };
    }

    drawAll() {
        this.handCA.draw();
        this.earlyCA.draw();
        this.modernCA.draw();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize all demos when page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        new Rule30Demo();
        new BehaviorClassifierDemo();
        new Rule110Demo();
        new ComplexityDemo();
        new HistoricalDemo();
    } catch (error) {
        console.error('Error initializing demos:', error);
    }
});