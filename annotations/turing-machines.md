# Turing Machines

A Turing machine is a theoretical model of computation, first described by Alan Turing in 1936. It serves as a simple, abstract model of a general-purpose computer.

![Turing Machine Structure](images/turing-machines/turing-machine-diagram-1.png)

## How It Works

A Turing machine consists of:

1.  **A Tape**: An infinitely long strip divided into cells. Each cell can hold a single symbol (e.g., `0` or `1`, or black or white).
2.  **A Head**: A device that can read the symbol on the current cell, write a new symbol, and move the tape one cell to the left or right.
3.  **A State Register**: The machine's internal memory, which stores its current "state". There is a finite number of possible states.
4.  **A Rule Table**: A set of instructions. For any given state and symbol under the head, the rules specify what the machine should do:
    *   Write a new symbol on the tape.
    *   Change to a new state.
    *   Move the head one step to the left or right.

In the context of NKS, Turing machines are very similar to [mobile automata](annotation:mobile-automata), but with the added feature of the head having internal states.

## Significance

Turing machines are fundamental to computer science. The **Church-Turing thesis** states that any real-world computation can be translated into an equivalent computation involving a Turing machine. This means that if a problem can be solved by an algorithm, there is a Turing machine that can solve it.

In "A New Kind of Science", Wolfram explores the behavior of very simple Turing machines, starting from a blank tape. He finds that, like other simple programs, they exhibit the full range of the four classes of behavior. Complexity and apparent randomness emerge from machines with just a few states and colors (e.g., 4 states and 2 colors), demonstrating that the universal principles of computation apply even to these foundational models.