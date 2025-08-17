# Substitution Systems

Substitution systems are a class of simple programs that operate on sequences of elements (like colors or letters). Their defining feature is that at each step, every element in the sequence is replaced by a new block of elements according to a fixed set of rules.

## How It Works

1.  **Start with a sequence**: Begin with an initial sequence of elements, for example, a single black element `B`.
2.  **Define rules**: Create a rule for each type of element. For a black and white system, the rules might be:
    *   `W` → `WB` (Replace every White element with a White-Black block)
    *   `B` → `W`   (Replace every Black element with a White block)
3.  **Apply rules in parallel**: At each step, simultaneously replace every element in the current sequence with its corresponding block.

### Example Evolution

Starting with `B` and the rules above:
- Step 0: `B`
- Step 1: `W` (replace `B` with `W`)
- Step 2: `WB` (replace `W` with `WB`)
- Step 3: `WBW` (replace `W` with `WB`, and `B` with `W`)
- Step 4: `WBWWB` (replace `W`s with `WB`, and `B` with `W`)

## Behavior and Significance

The simplest substitution systems, where the replacement rule for an element doesn't depend on its neighbors, typically produce highly regular, nested (Class 2) patterns. The structure of these patterns is often directly related to the subdivision process defined by the rules.

However, by introducing slightly more complex rules (e.g., making the replacement for an element depend on its right-hand neighbor), substitution systems can be made to produce the full range of behaviors, including randomness (Class 3) and complex localized structures (Class 4). This demonstrates that a fixed spatial grid is not necessary for complexity to arise.