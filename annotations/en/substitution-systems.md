# Replacement system

Substitution Systems are a class of simple programs that operate on sequences of elements, such as colors or letters. Their defining feature is that at each step, each element of the sequence is replaced by a new block of elements according to a fixed set of rules.

![Evolution example of partial replacement system](../../images/chapter3/p82.png)

## Working principle

1. **Start from a sequence**: Start from an initial sequence of elements, for example, a single black element `B`.
2. **Define Rules**: Create a rule for each type of element. For a black and white system, the rules might be:
    * `W` → `WB` (replaces each white element with a white-black block)
    * `B` → `W` (replace each black element with a white block)
3. **Parallel application rules**: At each step, replace each element in the current sequence with its corresponding block simultaneously.

### Evolution example

Starting with `B` and the above rules:
- Step 0: `B`
- Step 1: `W` (replace `B` with `W`)
- Step 2: `WB` (replace `W` with `WB`)
- Step 3: `WBW` (replace `W` with `WB`, `B` with `W`)
- Step 4: `WBWWB` (replace `W` with `WB`, `B` with `W`)

## Behavior and Meaning

The simplest substitution systems, in which elements' substitution rules do not depend on their neighbors, typically produce highly regular, nested (category 2) patterns. The structure of these patterns is often directly related to the rule-defined segmentation process.

However, by introducing slightly more complex rules (e.g., making the substitution of an element dependent on its right-hand neighbor), substitution systems can produce a full range of behavior, including randomness (Category 3) and complex local structures (Category 4). This suggests that a fixed spatial grid is not necessary for complexity to arise.