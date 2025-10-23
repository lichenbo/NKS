# Constraint-Based Systems

Constraint-based methods do not specify “how to evolve” but rather specify local conditions (templates) that the final (or allowed) pattern must satisfy, such as “each cell must have exactly k black neighbors” or “a certain 3 × 3 subpattern is prohibited”. The goal of the system is to find configurations that satisfy all constraints.

## NKS Perspective Points
- Contrast with evolution rules: cellular automata, etc. give explicit updates; the constraint system is changed to "satisfy a set of local conditions".
- One-dimensional conclusion: simple local constraints are almost always satisfied by simple periodic patterns, and it is difficult to force complex patterns.
- Two-dimensional possibility: There are carefully constructed local templates that can force non-repeating nested structures and even approximate a near-random appearance under certain extensions; but this is very rare and requires large-scale searches.
- Meaning: Complexity can arise as a global by-product of many simple local conditions being satisfied simultaneously, even without explicit time evolution.

## Methods and Observation Suggestions
- Constraint scanning: Systematically enumerate local templates (neighborhood size, allowed/disallowed patterns) and detect satisfiability and solution space structure.
- Result classification: Record whether only periodic tiling is produced, whether nested levels or large-scale approximately random textures occur.
- Cost and undecidability: Constraint growth can easily lead to search explosion; some problems are similar to tiling/covering problems, and the decidability and complexity may be very high.

## External reference (concept)
- Constraint satisfaction problems (CSP)