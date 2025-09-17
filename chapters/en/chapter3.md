# Chapter 3 · The World of Simple Programs

This chapter continues the investigation begun earlier, venturing into [the world of simple programs](annotation:the-world-of-simple-programs) with the curiosity of a computational naturalist. The guiding question is whether the strikingly rich behavior observed in elementary cellular automata is an outlier or a ubiquitous feature of computation. By running broad computational surveys rather than crafting rules by hand, Wolfram shows that complexity is not a rare accident—it emerges readily once even very modest rule complexity is allowed.

## The Four Canonical Behaviors

Systematic catalogues reveal that simple programs, regardless of their microscopic details, almost always manifest one of [four basic classes of behavior](annotation:four-classes-of-behavior):

- **Class 1 · Repetitive** — evolution collapses to a uniform, absorbing state.
- **Class 2 · Nested** — the system builds orderly, often fractal-like, self-similar patterns (for example, Sierpiński structures in Rule 90).
- **Class 3 · Random** — output appears disordered and statistically irregular, as in the celebrated [Rule 30](annotation:rule-30).
- **Class 4 · Complex** — localized structures coexist with randomness, collide, and transmit information, epitomized by universal Rule 110.

This taxonomy becomes a baseline tool for everything that follows; later systems will be judged by how their behavior slots into the same fourfold scheme.

## Revisiting Cellular Automata

Wolfram first deepens the survey within the realm of cellular automata (CA):

- **Exhausting the 256 elementary rules** — every two-color, radius-1 CA is simulated, confirming that all four behavior classes appear and are widely distributed among the rules.
- **Extending to multi-color and [totalistic cellular automata](annotation:totalistic-cellular-automata)** — even when cells take three colors and update purely from the neighborhood sum, the catalogued behavior still falls neatly into the same four classes. Adding rule complexity broadens the palette but does not introduce qualitatively new categories.

These findings undermine the intuition that intricate rules are prerequisites for intricate behavior, suggesting instead that complexity is a robust, low-threshold phenomenon.

## A Cross-Model Expedition

To test universality, the chapter then traverses a diverse collection of abstract computation models.

### [Mobile Automata](annotation:mobile-automata)
- Evolution updates a single active cell that marches along a line.
- Complex behavior is rarer, but exhaustive searches over millions of rules eventually uncover both nested and random examples.
- Parallelism influences how frequently complexity appears, yet does not forbid it.

### [Turing Machines](annotation:turing-machines)
- Minimal 2-state, 2-symbol machines yield only repetitive or nested outcomes.
- Once the machine gains as few as four head states, randomness and Class 4 complexity emerge—again highlighting a low complexity threshold.

### [Substitution Systems](annotation:substitution-systems)
- Strings grow as symbols are replaced by blocks of symbols.
- Neighbor-aware variants or rules allowing creation and deletion give rise to the full spectrum from nested to random behavior.

### [Sequential Substitution Systems](annotation:sequential-substitution-systems)
- Operate like search-and-replace in a word processor, rewriting only the first match each step.
- Surprisingly, this everyday mechanism can build structures just as intricate as those in cellular automata.

### [Tag Systems](annotation:tag-systems)
- Each step removes a fixed number of symbols from the front and appends a block to the end.
- Even with extreme simplicity, tag systems are capable of unpredictable, richly structured dynamics.

### [Register Machines](annotation:register-machines)
- Idealized computer hardware with a handful of registers plus elementary “increment” and “decrement-and-jump” instructions.
- Once the instruction set crosses a small threshold (roughly eight instructions), the machines display [computational irreducibility](annotation:computational-irreducibility) and apparent randomness.

### [Symbolic Systems](annotation:symbolic-systems)
- Inspired by Mathematica, these systems rewrite symbolic expressions via pattern-matching rules.
- They, too, span the entire four-class taxonomy, underscoring that complexity is indifferent to whether a system manipulates bits, numbers, or algebraic forms.

## Universality of Complexity

Across this “computational zoology,” a consistent message emerges: **complexity is universal and resilient**. Whether a system updates in parallel or sequentially, keeps its size fixed or lets it grow, or acts on colors, symbols, or registers, the same characteristic behaviors resurface. The prevalence of Classes 3 and 4 supports broader themes such as [universality](annotation:universality) and [computational equivalence](annotation:computational-equivalence), hinting that nature’s own complexity may stem from similarly simple rules.

## Methodological Reflections

Equally important is the methodology. Rather than engineering systems to achieve preconceived goals, Wolfram advocates for the naturalist approach of **large-scale computational experiments**: run the simplest programs, watch what they do, and let the data surprise you. Visual inspection of raw behavior often reveals more than summary statistics, and it demonstrates why rich structures pervade both computational models and the natural world. This experimental ethos becomes a cornerstone for the “new kind of science” developed through the rest of the book.
