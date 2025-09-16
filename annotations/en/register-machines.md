# Register Machines

A register machine is a simple, abstract model of a computer's central processing unit (CPU). It is designed to be a clear idealization of how practical computers work at their lowest level.

## How It Works

A register machine consists of:

1.  **Registers**: A small number of storage locations, each of which can hold a number of any size.
2.  **A Program**: A fixed list of simple instructions that the machine executes in sequence.

In the book, Wolfram considers register machines with just two registers and two types of instructions:

- **Increment**: Increase the number in a specific register by one.
- **Decrement-and-Jump**: Decrease the number in a specific register by one. If the number was already zero, do nothing. Then, if the number was *not* zero, jump to a different instruction in the program list; otherwise, just continue to the next instruction.

## Significance

The feature that makes these machines powerful is the **decrement-and-jump** instruction. It allows the machine to make decisions and take different paths through its program based on the values in its registers. This is the foundation of all branching and logic in modern computers (e.g., `if/else` statements).

Wolfram's exploration of register machines shows that even with extremely simple programs (e.g., 8 instructions and 2 registers), it is possible to produce behavior that is so complex it appears random and is computationally irreducible. This is a profound result, as it means that the potential for the highest levels of complexity exists in the most basic models of the computers we use every day.