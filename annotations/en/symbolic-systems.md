# Symbology

Symbolic Systems are computational systems that operate on symbolic expressions rather than numbers or colored cells. These systems are inspired by the core functionality of computer algebra systems like Mathematica.

![Single-step evolution process of type system](../../images/chapter3/p102.png)

## Working principle

A symbolic expression is a nested structure such as `f[g[x]]` or `a[b][c]`. Symbology operates on these expressions by repeatedly applying transformation rules.

1. **An expression**: The system starts with an initial symbolic expression.
2. **A rule**: Define a conversion rule to specify how to replace a pattern. A simple example is `e[x_][y_] → x[x[y]]`. This rule means: "Find any part of the expression that matches the pattern `e[x][y]` and replace it with `x[x[y]]`."
3. **Transformation**: The system scans the expression and applies the rule wherever a pattern is found.

## Meaning

Symbol systems represent a very general form of computation. Unlike cellular automata or Turing machines, which have a rigid underlying structure (a grid of cells or a paper tape), symbolic systems operate on flexible, tree-like data structures.

By studying these systems, Wolfram demonstrated that the principle of computational equivalence holds even in this highly abstract and general domain. Simple transformation rules applied to simple initial expressions can lead to vastly complex behavior. This shows that the complexity phenomenon is not an artifact of specific types of systems (such as grids), but is a truly fundamental feature of all computing.