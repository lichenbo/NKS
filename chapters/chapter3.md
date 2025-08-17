# Chapter 3: The World of Simple Programs

Chapter 3 expands the exploration started in the previous chapters, moving from specific examples to a broad survey of [the world of simple programs](annotation:the-world-of-simple-programs). The central goal is to determine if the complex and diverse behaviors seen in elementary cellular automata are rare exceptions or a universal feature of computation. By acting like a naturalist, Wolfram systematically explores a vast computational universe, discovering that the same fundamental patterns of behavior appear again and again across a wide variety of systems.

## The Four Classes of Behavior

A key discovery presented is that the behavior of these simple programs, regardless of their underlying structure, consistently falls into one of [four basic classes](annotation:four-classes-of-behavior):

- **Class 1: Repetitive** - The system quickly settles into a stable, uniform state (e.g., all cells black or all white).
- **Class 2: Nested** - The system produces regular, nested patterns, often creating fractal-like structures. The overall structure is orderly and predictable.
- **Class 3: Random** - The system produces behavior that appears chaotic and random, with no discernible regularities.
- **Class 4: Complex** - The system generates a mixture of order and randomness, featuring localized structures that move and interact in complex ways. These structures can be seen as primitive forms of information processing.

This classification scheme is a cornerstone of the book, providing a framework for understanding and categorizing the behavior of any computational system.

## Exploring Different Kinds of Programs

To prove the universality of these four classes, the chapter investigates several different types of simple programs, each with different underlying rules and structures.

### More Cellular Automata
- **[Totalistic Cellular Automata](annotation:totalistic-cellular-automata):** The investigation begins with a variation of cellular automata where the rule for a cell's new color depends only on the sum of the colors of its neighbors, not their individual arrangement. Despite this simplification, these systems exhibit the same four classes of behavior, demonstrating that the complexity is not tied to the specific details of the rules.

### Systems with Different Structures
- **[Mobile Automata](annotation:mobile-automata):** These systems feature a single "active cell" that moves left or right at each step. This is a departure from the parallel updating of cellular automata. While complex behavior is rarer, it still appears, often requiring a search through millions of possible rules to find.
- **[Turing Machines](annotation:turing-machines):** Famous in theoretical computer science, these are similar to mobile automata but the active cell (or "head") can have different internal states. Again, the four classes of behavior are found, with complexity emerging once a certain threshold (e.g., four states) is reached.
- **[Substitution Systems](annotation:substitution-systems):** These systems work by replacing elements in a sequence with blocks of new elements, allowing the total number of elements to grow. They naturally produce nested patterns (Class 2), but variations that depend on neighboring elements can produce randomness and complexity (Class 3 and 4).
- **[Sequential Substitution Systems](annotation:sequential-substitution-systems):** These operate like the search-and-replace function in a text editor, scanning a string and replacing the first match found. Remarkably, even this simple, familiar process is shown to be capable of generating immense complexity.
- **[Tag Systems](annotation:tag-systems):** These are even simpler systems that remove a fixed number of elements from the beginning of a sequence and add a new block to the end. They too are found to be capable of complex behavior.
- **[Register Machines](annotation:register-machines):** These are simple idealizations of practical computers, with a small number of registers and a program consisting of simple instructions like "increment" or "decrement-and-jump". With just a handful of instructions, they can produce behavior that is computationally irreducible and seemingly random.
- **[Symbolic Systems](annotation:symbolic-systems):** Inspired by the workings of Mathematica, these systems transform symbolic expressions. They also exhibit the full range of behaviors, from simple repetition to profound complexity.

## Conclusions: The Universality of Complexity

The journey through this diverse "zoo" of simple programs leads to a profound conclusion: **the phenomenon of complexity is universal and robust**. It does not depend on the specific details of a system's construction. Whether the system updates in parallel or sequentially, has a fixed or growing number of elements, or is based on numbers or symbols, the same fundamental types of behavior emerge.

This universality is what makes a "new kind of science" possible. It implies that we can discover general principles governing the behavior of complex systems without needing to know the intricate details of each specific system. The complexity we see in nature—from snowflakes to biological organisms to fluid turbulence—is likely generated by the same universal processes that are so clearly visible in the world of simple programs.