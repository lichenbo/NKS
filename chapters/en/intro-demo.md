# Interactive demonstration: [Conway Game of Life](annotation:conways-game-of-life)

*See firsthand how simple rules can create infinite complexity before diving into A New Science. *

**💡 How to use:**

- **Left click on the grid** to switch the life and death status of cells (gold is live cells, black is dead cells)
- **Click the "Play" button** to start the simulation and watch how the pattern evolves
- **Try the "Random" button** for instant chaos - and see what emerges!
- **Explore famous configurations using preset modes below**

<div id="game-of-life-container" class="game-of-life-container">
    <div class="game-controls">
        <div class="control-row">
            <button id="play-pause-btn" class="control-btn primary">▶ 播放</button>
            <button id="step-btn" class="control-btn">单步</button>
            <button id="clear-btn" class="control-btn">清空</button>
            <button id="random-btn" class="control-btn">随机</button>
        </div>
        <div class="control-row">
            <label for="speed-slider">速度：</label>
            <input type="range" id="speed-slider" min="1" max="10" value="5" class="slider">
            <span id="speed-display">1x</span>
        </div>
        <div class="control-row">
            <label>网格大小：</label>
            <button id="grid-smallest" class="size-btn active">20×20</button>
            <button id="grid-small" class="size-btn">40×40</button>
            <button id="grid-medium" class="size-btn">100×100</button>
            <button id="grid-large" class="size-btn">300×300</button>
        </div>
    </div>

<canvas id="game-canvas" class="game-canvas"></canvas>

<div class="pattern-library">
    <h3>🎨 Try these modes:</h3>
    <div class="pattern-buttons">
        <button class="pattern-btn" data-pattern="glider">✈️ Glider</button>
        <button class="pattern-btn" data-pattern="blinker">💫 blinker</button>
        <button class="pattern-btn" data-pattern="toad">🐸 Toad</button>
        <button class="pattern-btn" data-pattern="beacon">🔆 beacon</button>
        <button class="pattern-btn" data-pattern="pulsar">🌟 Pulsar</button>
        <button class="pattern-btn" data-pattern="lightweight-spaceship">🚀 Lightweight spaceship</button>
        <button class="pattern-btn" data-pattern="gosper-gun">🔫 Gosper Machine Gun</button>
        <button class="pattern-btn" data-pattern="pentadecathlon">⚡ Fifteen grid oscillator</button>
        <button class="pattern-btn" data-pattern="acorn">🌰 acorn</button>
        <button class="pattern-btn" data-pattern="diehard">💀 Survive tenaciously</button>
        <button class="pattern-btn" data-pattern="r-pentomino">🔥 R-shaped pentomino</button>
        <button class="pattern-btn" data-pattern="infinite-growth">📈 infinite growth</button>
    </div>
</div>

## 🧬 Game Rules

Conway's Game of Life follows only **Four Simple Rules**:

1. **Birth**: A dead cell becomes a living cell when there are exactly 3 living neighbors around it.
2. **Survival**: A living cell remains alive when it has 2 or 3 live neighbors.
3. **Lonely death**: A living cell dies when it has less than 2 neighbors.
4. **Overcrowding death**: A living cell dies when it has more than 3 neighbors.

*That's it! From these four rules emerge infinite complexity. *

If you are interested in the game of life, it is recommended to use [Golly](https://golly.sourceforge.io/) for in-depth exploration

## 🎯 What you are experiencing

- **Emergency**: complex patterns emerge from simple rules
- **Self-organization**: There is no central control, but organized behavior occurs
- **Universality**: The same principles govern many natural phenomena
- **Unpredictability**: Even if you know the rules, the results can still be surprising

## 🌐 Explore more interactive demos

### Conway Game of Life
- [Golly](https://golly.sourceforge.io/) - Advanced game of life simulator (cross-platform)
- [Copy.sh Game of Life](https://copy.sh/life/) - Simple and fast online implementation
- [LifeViewer](https://lazyslug.com/lifeviewer/) - Schema viewer that supports RLE format

### Related interaction simulation
- [Complexity Exploration](https://www.complexity-explorables.org/) - Interactive complex systems
- [NetLogo Model](https://ccl.northwestern.edu/netlogo/models/) - Agent-based simulation
- [Emergent Mind](https://emergentmind.com/) - AI research discovery platform
- [Genetic Cars Evolution](https://rednuht.org/genetic_cars_2/) - Genetic Algorithms and Evolution
- [Wolfram Demonstrations](https://demonstrations.wolfram.com/) - Math and Science Demonstrations

## 🧠 Why this matters

What you have just experienced is a central theme of Wolfram's work: **Simple rules can generate infinite complexity**. This principle is everywhere:

- 🌿 **Biology**: How cells are organized into complex organisms
- 🌊 **Physics**: How particles create emergent phenomena
- 💻 **Calculation**: How simple programs can solve complex problems
- 🧬 **Evolution**: How simple selection rules create diversity
- 🏙️ **Society**: How individual behavior creates collective behavior

## 🎬 Ready to explore further?

Now that you've experienced the phenomenon of emergence firsthand, you're ready to explore how this principle could revolutionize our understanding of science, nature, and computing.

*Click **Chapter 1** to start your journey with "A New Science". *