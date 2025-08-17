# Symbolic Systems

Symbolic systems are a type of computational system that operates on symbolic expressions rather than numbers or colored cells. These systems are inspired by the core functionality of computer algebra systems like Mathematica.

## How It Works

A symbolic expression is a nested structure, like `f[g[x]]` or `a[b][c]`. A symbolic system works by repeatedly applying transformation rules to these expressions.

1.  **An Expression**: The system starts with an initial symbolic expression.
2.  **A Rule**: A transformation rule is defined, specifying how to replace a pattern. A simple example is `e[x_][y_] → x[x[y]]`. This rule means: "find any part of the expression that matches the pattern `e[x][y]`, and replace it with `x[x[y]]`."
3.  **Transformation**: The system scans the expression and applies the rule wherever the pattern is found.

## Significance

Symbolic systems represent a very general form of computation. Unlike cellular automata or Turing machines that have a rigid underlying structure (a grid of cells or a tape), symbolic systems operate on flexible, tree-like data structures.

By studying these systems, Wolfram demonstrates that the principle of computational equivalence holds even in this highly abstract and general domain. Simple transformation rules applied to simple initial expressions can lead to behavior of immense complexity. This shows that the phenomenon of complexity is not an artifact of a specific type of system (like a grid) but is a truly fundamental feature of all computation.