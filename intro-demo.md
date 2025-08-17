# Interactive Demo: Conway's Game of Life

*Before diving into "A New Kind of Science," experience firsthand how simple rules can create infinite complexity.*

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
            <input type="range" id="speed-slider" min="50" max="1000" value="200" class="slider">
            <span id="speed-display">200ms</span>
        </div>
        <div class="control-row">
            <label>Grid Size:</label>
            <button id="grid-small" class="size-btn">20×20</button>
            <button id="grid-medium" class="size-btn active">30×30</button>
            <button id="grid-large" class="size-btn">40×40</button>
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
- [LifeWiki](https://www.conwaylife.com/wiki/Main_Page) - Comprehensive pattern database
- [Golly](http://golly.sourceforge.net/) - Advanced Game of Life simulator
- [Copy.sh Game of Life](https://copy.sh/life/) - Clean, fast online implementation
- [LifeViewer](https://lazyslug.com/lifeviewer/) - Pattern viewer with RLE support

### Related Interactive Simulations
- [Wolfram's Elementary Cellular Automata](https://www.wolfram.com/demonstrations/ElementaryCellularAutomata/) - Rule 30, 90, 110, and more
- [Complexity Explorables](https://www.complexity-explorables.org/) - Interactive complex systems
- [NetLogo Models](https://ccl.northwestern.edu/netlogo/models/) - Agent-based simulations
- [Emergent Mind](https://emergentmind.com/) - Emergence and self-organization demos
- [Fractals and Chaos](https://www.fractalus.com/ifswork/gallery.htm) - Interactive fractal generation
- [Swarm Intelligence](https://rednuht.org/genetic_cars_2/) - Genetic algorithms and evolution
- [Cellular Automata Viewer](https://devinacker.github.io/cellauto/) - Experiment with different CA rules

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