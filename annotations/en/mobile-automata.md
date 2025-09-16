# Mobile Automata

A mobile automaton is a type of simple program similar to a cellular automaton, but with a key difference: instead of all cells updating in parallel at each step, there is only a single **active cell** that updates and moves.

## How It Works

1.  **A line of cells**: Like a cellular automaton, it consists of a one-dimensional array of cells, each with a color (e.g., black or white).
2.  **One Active Cell**: At any given time, only one cell is designated as "active".
3.  **The Rule**: The rule is applied only to this active cell. It looks at the color of the active cell and its immediate neighbors.
4.  **Update and Move**: Based on what it sees, the rule specifies two things:
    *   The new color for the active cell.
    *   Whether the active cell should move one position to the left or one position to the right.
5.  **Next Step**: In the next step, the cell that was moved to becomes the new active cell, and the process repeats.

## Significance

Mobile automata are important because they break the assumption of parallel updating used in cellular automata. By studying them, Wolfram shows that even when you remove this feature, the same fundamental classes of behavior (including high levels of complexity) can still be produced.

However, the search for complexity becomes much harder. While complex behavior is common in cellular automata, it is extremely rare in mobile automata, often requiring searches through millions or billions of possible rules to find examples. This demonstrates that while the potential for complexity is universal, the *density* of complex rules can vary greatly from one class of systems to another.