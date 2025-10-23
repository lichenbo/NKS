# tag system

Tag System is another example of a simple program that operates on sequences of elements (for example, black and white cells). It is defined by a single parameter: the number of elements to remove from the beginning at each step.

![Basic evolution of the logo system](../../images/chapter3/p93.png)


## Working principle

1. **Sequence**: The system maintains a sequence of elements, such as `BBWBW`.
2. **Rule**: At each step, remove a fixed number of elements (such as 2) from the **beginning** of the sequence.
3. Append a block: A new block of elements is appended to the end of the sequence based on the color of the element that was just removed.

### Example

- **System**: A tag system that removes 2 elements per step.
- **Rule**: If the removed element is `BB`, append `W`. If they are `BW`, `WB` is appended.
- **Sequence**: `BBW`
- **Step 1**: Remove `BB`. The sequence becomes `W`. According to the rules, `W` is appended. The new sequence is `WW`.
- **Step 2**: Remove `WW`. Assume the rule for `WW` is to append `B`. The new sequence is `B`.
- **Step 3**: The sequence is now too short to remove 2 elements, so the system stops.

## Meaning

The tag system is a powerful example of how simple the underlying structure of a system can be and yet still produce complex behavior. When only one element is removed at each step, the behavior is always simple (repeated or nested). However, once two elements are removed at each step, the system is capable of producing highly complex and seemingly random patterns. This sharp transition from simple to complex behavior based on a single parameter is a key finding that illustrates the concept of complexity threshold.