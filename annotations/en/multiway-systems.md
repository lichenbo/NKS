# Multiway Systems

A multi-way system allows all feasible replacements/updates to be performed simultaneously at each step, thus generating a cluster of parallel successor states (branches). The causal relationship between these states can be viewed as a network: different historical paths may reconverge into the same state at subsequent steps.

![alt text](../../images/multiway-systems/image.png)

## Key points from NKS perspective
- Branching rather than unique evolution: compared with cellular automata/replacement systems of single-path evolution to reveal the structure of "possible histories".
- Causal network representation: treat each unique state as a node and use directed edges to connect the "production" relationship to obtain a well-visualized causal geometry.
- The four categories of behavior still apply: the size and structure of the state set can exhibit regular growth and repetition, as well as nested levels or nearly random complex patterns.
- Path convergence and macro-uniqueness: If different paths eventually converge frequently, there may be an "approximately unique history" on a large scale.

## Relationship to substitution/sequential systems
- Sequential substitution system: only one substitution is made in each step; multi-channel system: all possible substitutions are made in each step and duplicates are eliminated.
- Both can present a full spectrum of behaviors from simple to complex under a small rule set, and the multi-path perspective emphasizes the overall structure of the "choice space".

## Methods and observation suggestions
- Rule scan: Count the growth of the number of states at each step (linear, quadratic, exponential) and whether there are long periods or converging clusters.
- Network metrics: Track the clique count, diameter, clustering, and hierarchy of causal networks to identify the coexistence of nested and random regions.

## External reference (concept)
- Multiway systems (Wolfram related information)