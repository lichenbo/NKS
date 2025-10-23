# Rule 28

Rule 28 is a member of Wolfram's basic cellular automata and is generally classified taxonomically into Category 2 (Periodic/Nested). Its evolving pattern displays a distinct triangular nested structure and local periodicity, and is a classic example of how simple rules can generate predictable yet fractal-flavored patterns. The following details are based on MathWorld's page description.

![alt text](../../images/rule-28/image.png)

## Rule definition

Rule 28 operates on one-dimensional binary cellular automata. The local update depends on the status of the cell itself and its two neighbors on the left and right. The update table is as follows:

- 111 → 0
- 110 → 0
- 101 → 0
- 100 → 1
- 011 → 1
- 010 → 1
- 001 → 0
- 000 → 0

The output is read as the binary sequence `00011100`, which is decimal 28, hence the name "Rule 28".

## Behavioral characteristics

- **Triangle Nested Structure**: When starting from a single black cell, the pattern expands to the right into a stacked structure similar to Sierpinski triangles, but maintains a static background on the left.
- **Local Periodicity**: Under random initial conditions, the system tends to quickly converge to a combined structure of periodic stripes and nested triangles, typical of Category 2.
- **Symmetry**: Compared to the symmetrical nesting pattern produced by Rule 90, the nesting of Rule 28 tends to be skewed to one side, reflecting the asymmetry in the treatment of left and right neighbors in the update table.
- **Limited scale of attractor**: The evolved pattern eventually enters a finite period cycle or static block structure, and the range of information dissemination is limited.

## Mathematical Properties and Observations

- **Mirror correlation**: Its mirror, complement and mirror complement rules correspond to rules 70, 199 and 157 respectively; for the initial state of a single black cell, it is equivalent to rule 156, because the binary truth tables of both belong to the `x0011100₂` form (`x` can be 0 or 1, corresponding to the highest bit difference between rules 28 and 156).
- **Symmetry operation**: Rule 156 still reflects itself under mirror and complement operations (mirror complement rule is still 156), showing the symmetry decomposition of this type of rule.
- **Jacobsthal sequence connection**: Starting from a single black cell, the binary pattern of the nth generation can be obtained by writing the Jacobsthal sequence (1, 3, 5, 11, 21, …; OEIS A001045) in binary and removing the leading zeros to obtain (1, 11, 101, 1011, …; OEIS A070909). The evolution under this initial condition is therefore "reducible": the corresponding Jacobsthal number can be calculated directly and its binary expansion taken.
- **Non-additivity**: Rule 28 is not a simple XOR or linear rule that predicts the global pattern from initial fragment superposition.
- **Associated Category**: In Wolfram's four-category framework, it belongs to the "cyclical/nested" behavior group along with rules 4 and 12, and can be used as an object of comparative study.

## Further reading

- [Rule 28 — Wolfram MathWorld](https://mathworld.wolfram.com/Rule28.html)
- Wolfram's discussion of Category 2 behavior in A New Science (see pp. 55, 90)
- [Elementary Cellular Automaton](https://mathworld.wolfram.com/ElementaryCellularAutomaton.html)