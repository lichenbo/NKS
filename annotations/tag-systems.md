# Tag Systems

A tag system is another example of a simple program that operates on a sequence of elements (e.g., black and white cells). It is defined by a single parameter: the number of elements to remove from the beginning at each step.

## How It Works

1.  **The Sequence**: The system maintains a sequence of elements, like `BBWBW`.
2.  **The Rule**: At each step, a fixed number of elements (say, 2) are removed from the **beginning** of the sequence.
3.  **Append a Block**: Based on the colors of the elements that were just removed, a new block of elements is **tagged on to the end** of the sequence.

### Example

- **System**: A tag system that removes 2 elements at each step.
- **Rule**: If the removed elements are `BB`, append `W`. If they are `BW`, append `WB`.
- **Sequence**: `BBW`
- **Step 1**: Remove `BB`. The sequence becomes `W`. According to the rule, append `W`. The new sequence is `WW`.
- **Step 2**: Remove `WW`. Let's say the rule for `WW` is to append `B`. The new sequence is `B`.
- **Step 3**: The sequence is now too short to remove 2 elements, so the system halts.

## Significance

Tag systems are a powerful demonstration of how simple the underlying structure of a system can be while still being capable of complex behavior. When only one element is removed at each step, the behavior is always simple (repetitive or nested). However, as soon as two elements are removed at each step, the system becomes capable of producing highly complex and seemingly random patterns. This sharp transition from simple to complex behavior based on a single parameter is a key finding, illustrating the concept of a threshold for complexity.