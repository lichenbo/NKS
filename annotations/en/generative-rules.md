# Generative Rules

"Rules" refer to a set of extremely simple, repeatable local update methods, more like "algorithms" than traditional physical equations.

## Brief description

-Imagine a row of squares with only black and white colors (cellular automaton)
- The color of each grid in the next step is determined only by the current colors of itself and its left and right neighbors, and according to a fixed rule.
- Example: As long as the left and right neighbors have different colors, I will make it black; otherwise, I will make it white.

Such simple "generation rules" act repeatedly to generate surprisingly complex structures from extremely simple initial states. This is the core idea of ​​NKS: [Complexity](annotation:complexity) and intelligence can arise naturally from simple [Determinism](annotation:determinism) rules without having to rely on complex design.

## NKS context supplement

- Rule space and numbering: One-dimensional binary cellular automata can be represented by the Wolfram numbering system, which supports systematic and exhaustive exploration of the rule space.
- General computing and intrinsic universality: Extremely simple rules (such as Rule 110) have been proven to be Turing complete; different simple programs can simulate each other, supporting the view of "intrinsic universality".
- Update scheme and neighborhood: The choice of synchronous/asynchronous update, neighborhood radius and boundary conditions will significantly change the observable macroscopic behavioral spectrum.
- Cross-model mapping: replacement systems, label systems, Turing machines, moving automata, etc. can simulate each other, reflecting the "unified view of simple programs".

## Systematic exploration of rule space

### Wolfram Numbering System
- **Total Number of Rules**: Binary CA of radius-1 neighborhood has a total of 2^8 = 256 possible rules
- **Numbering Logic**: Rules are numbered by the binary interpretation of their lookup table (000→0, 001→1, 010→2, 011→3, 100→4, 101→5, 110→6, 111→7)
- **Systematic**: Unlike traditional mathematics, which describes systems through equations, NKS advocates the discovery of new phenomena through the exhaustive enumeration of simple program spaces.

### Compare traditional methods
| Methods | Traditional Science | NKS Methods |
|------|----------|----------|
| Starting point | Observe phenomena and construct equations | Enumerate simple rules and observe behaviors |
| Exploration method | Analytical solution, parameter adjustment | System traversal rule space |
| Pathways to discovery | Theoretical predictions | Computational experiments |
| Typical tools | Differential equations, statistical models | Cellular automata, Turing machines |

## Various examples of generality

### Prove Turing complete simple system
- **Rule 110**: The most famous universal cellular automaton, which can simulate any Turing machine calculation
- **Rule 184**: Although seemingly simple (traffic flow model), it also has computational versatility under specific configurations
- **Game of Life in 2D**: Conway's Game of Life constructs logic gates, memories, and computers

### Cross-system versatility
- **Tag system**: `{0 → 00, 1 → 1101}` Such a simple replacement rule has been proven to be Turing complete
- **Register Machine**: Minimal instruction set requiring only addition, subtraction and conditional jumps
- **Turing Machine**: Classic 2-state 3-symbolic universal Turing machine

### Principle of intrinsic universality
**Core idea**: Complex behavior is ubiquitous in simple programs and does not require special design
- Most "randomly" chosen rules can produce complex calculations
- General computing power is the "typical" feature in the space of rules, not the exception
- This explains why nature generally exhibits complexity and "intelligent" behavior

- Related demos: [256 Rule Evolution](demos/wolfram-rules-256/wolfram-256-rules-demo.html), [Rule Explorer](demos/wolfram-rules-explorer/wolfram-rules-explorer.html), [Turing Machine Demonstration](demos/chapter3/turing-machine-demo.html), [Tag System Demonstration](demos/cha pter3/tag-system-demo.html), [Sequential substitution system demo](demos/chapter3/sequential-substitution-demo.html), [Register machine demo](demos/chapter3/register-machine-demo.html), [Mobile automata demo](demos/chapter3/mobile-automata-demo.html).