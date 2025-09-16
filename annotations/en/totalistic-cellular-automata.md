# Totalistic Cellular Automata

A totalistic cellular automaton is a special type of cellular automaton where the rule for determining a cell's next color depends only on the *sum* (or average) of the colors of its neighboring cells, not on their individual values or positions.

## How It Works

In a standard elementary cellular automaton, the rule looks at the specific pattern of the three cells (the cell itself and its left and right neighbors). For example, `110` is a different case from `011`.

In a totalistic automaton, the rule only cares about the total value. For black=1 and white=0, the rule would treat `110` (sum=2) and `011` (sum=2) as the same case. This significantly reduces the number of possible cases the rule needs to define.

### Example

For a two-color (black/white) nearest-neighbor totalistic cellular automaton, there are only four possible sums for the three cells:
- 0 (0+0+0)
- 1 (e.g., 0+1+0)
- 2 (e.g., 1+1+0)
- 3 (1+1+1)

The rule only needs to specify the outcome for these four sums, making the rule space much smaller and easier to explore systematically.

## Significance

The study of totalistic cellular automata is important because it demonstrates that the complexity observed in these systems is not dependent on the intricate details of the rules. Even when the rules are simplified to only consider the total value of neighbors, the same four fundamental classes of behavior (repetitive, nested, random, complex) still emerge. This provides strong evidence for the universality of these behaviors.