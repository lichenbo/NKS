# Rule 90

Rule 90 is one of the simplest [Elementary Cellular Automata](https://en.wikipedia.org/wiki/Elementary_cellular_automaton) and is a typical example of "additivity" rules. Although its local rules are extremely simple, it can produce self-similar structures such as the famous Sierpinski triangle, providing a clear sample for understanding the generation of complex patterns from simple principles.

![alt text](../../images/rule-90/image-1.png)

## Rule definition

Rule 90 evolves on a one-dimensional line, and each cell has only two states: black (1) and white (0). The update method is to XOR the left and right neighbors:

- If the left and right neighbors are the same, the cell will be 0 in the next step;
- If the left and right neighbors are different, the cell is 1 in the next step.

Therefore the local lookup table is:
- 111 → 0
- 110 → 1
- 101 → 0
- 100 → 1
- 011 → 1
- 010 → 0
- 001 → 1
- 000 → 0

The binary output sequence `01011010` corresponds to the decimal value 90, hence the name.

## Key Features

- **Additivity**: Evolution can be seen as performing a linear superposition of initial states, so complex patterns are equal to XOR combinations of different initial pieces.
- **Fractal Structure**: Starting from a single black cell will generate a Sierpinski triangle; starting from other periodic initial conditions will also generate self-similar nested patterns.
- **Predictability**: Due to additivity, evolution can be analyzed exactly with linear algebra or binary polynomials.
- **Symmetry**: The pattern is mirror symmetrical in the left and right directions and shows obvious scale levels.

## Research significance

- Provides simple examples for understanding the relationship between linear cellular automata and complex pattern formation.
- In sharp contrast to nonlinear stochastic systems such as [Rule 30](annotation:rule-30), showing how initial conditions directly determine the final structure.
- Used for teaching and demonstration, visualizing mathematical topics such as binary Pascal's triangle, parity of combinatorial numbers, etc.

## Further reading

- [Rule 90 (Wikipedia)](https://en.wikipedia.org/wiki/Rule_90)
- [Elementary Cellular Automaton](https://mathworld.wolfram.com/ElementaryCellularAutomaton.html)
- Discussion of nested structures and additivity rules in "A New Science"