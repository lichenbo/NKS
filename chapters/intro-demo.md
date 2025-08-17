# Interactive Demo: Conway's Game of Life

*Before diving into "A New Kind of Science," experience firsthand how simple rules can create infinite complexity.*

**💡 How to Use:**

- **Left-click cells** on the grid to toggle them alive (golden) or dead (black)
- **Click "Play"** to start the simulation and watch patterns evolve  
- **Try "Random"** for instant chaos - then see what emerges!
- **Use preset patterns** below to explore famous configurations

<div id="game-of-life-container" class="game-of-life-container">
    <div class="game-controls">
        <div class="control-row">
            <button id="play-pause-btn" class="control-btn primary">▶ Play</button>
            <button id="step-btn" class="control-btn">Step</button>
            <button id="clear-btn" class="control-btn">Clear</button>
            <button id="random-btn" class="control-btn">Random</button>
        </div>
        <div class="control-row">
            <label for="speed-slider">Speed:</label>
            <input type="range" id="speed-slider" min="1" max="10" value="5" class="slider">
            <span id="speed-display">1x</span>
        </div>
        <div class="control-row">
            <label>Grid Size:</label>
            <button id="grid-small" class="size-btn active">40×40</button>
            <button id="grid-medium" class="size-btn">100×100</button>
            <button id="grid-large" class="size-btn">300×300</button>
        </div>
    </div>

<canvas id="game-canvas" class="game-canvas"></canvas>

<div class="pattern-library">
    <h3>🎨 Try These Patterns:</h3>
    <div class="pattern-buttons">
        <button class="pattern-btn" data-pattern="glider">✈️ Glider</button>
        <button class="pattern-btn" data-pattern="blinker">💫 Blinker</button>
        <button class="pattern-btn" data-pattern="toad">🐸 Toad</button>
        <button class="pattern-btn" data-pattern="beacon">🔆 Beacon</button>
        <button class="pattern-btn" data-pattern="gosper-gun">🔫 Gosper Gun</button>
        <button class="pattern-btn" data-pattern="pentadecathlon">⚡ Pentadecathlon</button>
    </div>
</div>

## 🧬 The Rules

Conway's Game of Life follows just **four simple rules**:

1. **Birth**: A dead cell with exactly 3 live neighbors becomes alive
2. **Survival**: A live cell with 2 or 3 live neighbors stays alive  
3. **Death by Isolation**: A live cell with fewer than 2 neighbors dies
4. **Death by Overcrowding**: A live cell with more than 3 neighbors dies

*That's it! From these four rules emerges infinite complexity.*

## 🎯 What You're Experiencing

- **Emergence**: Complex patterns arising from simple rules
- **Self-Organization**: No central control, yet organized behavior appears
- **Universality**: The same principles govern many natural phenomena
- **Unpredictability**: Even knowing the rules, outcomes can surprise us

## 🌐 Explore More Interactive Demos

### Conway's Game of Life
- [Golly](https://golly.sourceforge.io/) - Advanced Game of Life simulator (cross-platform)
- [Copy.sh Game of Life](https://copy.sh/life/) - Clean, fast online implementation
- [LifeViewer](https://lazyslug.com/lifeviewer/) - Pattern viewer with RLE support

### Related Interactive Simulations
- [Complexity Explorables](https://www.complexity-explorables.org/) - Interactive complex systems
- [NetLogo Models](https://ccl.northwestern.edu/netlogo/models/) - Agent-based simulations
- [Emergent Mind](https://emergentmind.com/) - AI research discovery platform
- [Genetic Cars Evolution](https://rednuht.org/genetic_cars_2/) - Genetic algorithms and evolution
- [Wolfram Demonstrations](https://demonstrations.wolfram.com/) - Mathematical and scientific demonstrations

## 🧠 Why This Matters

What you've just experienced is the central theme of Wolfram's work: **simple rules can generate unlimited complexity**. This principle appears everywhere:

- 🌿 **Biology**: How cells organize into complex organisms
- 🌊 **Physics**: How particles create emergent phenomena  
- 💻 **Computation**: How simple programs solve complex problems
- 🧬 **Evolution**: How simple selection rules create diversity
- 🏙️ **Society**: How individual actions create collective behavior

## 🎬 Ready to Dive Deeper?

Now that you've experienced emergence firsthand, you're ready to explore how this principle revolutionizes our understanding of science, nature, and computation.

*Click on **Chapter 1** to begin your journey into "A New Kind of Science."*