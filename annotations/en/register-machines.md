# Register machine

Register Machine (Register Machine) is a simple abstract model of a computer central processing unit (CPU). It is designed to be a clear idealization of how actual computers work at the lowest level.

![alt text](../../images/chapter3/image-1.png)

## Working principle

The register machine consists of the following parts:

1. **Register**: A small number of storage locations, each location can hold a number of any size.
2. **Program**: A fixed list of simple instructions that the machine executes in sequence.

In the book, Wolfram considers a register machine with only two registers and two types of instructions:

- **Increment**: Add one to the number in a specific register.
- **Decrement and Jump**: Decrement the number in a specific register by one. If the number is already zero, no action is performed. Then, if the number is *not* zero, jump to another instruction in the program list; otherwise, just continue with the next instruction.

## Meaning

The feature that makes these machines powerful is the decrement and jump instructions. It allows the machine to make decisions and take different paths in its program based on the values ​​in its registers. This is the basis for all branching and logic in modern computers (for example, the `if/else` statement).

Wolfram's exploration of register machines showed that even with extremely simple programs (e.g., 8 instructions and 2 registers), it is possible to produce behavior that is complex to the point of appearing random and computationally irreducible. This is a profound result because it means that the potential for the highest levels of complexity exists within the most basic computer models we use every day.