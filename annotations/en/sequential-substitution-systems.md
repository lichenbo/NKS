# Sequential replacement system

The Sequential Substitution System is a variation of [Substitution Systems](annotation:substitution-systems) that operates more like the "find and replace" functionality in a typical text editor.

![Basic rules for ordered substitution systems](../../images/chapter3/p89.png)


## Working principle

Rather than replacing all elements simultaneously, a sequential replacement system scans the sequence from left to right and performs a replacement on only the first match it finds.

1. **Define a set of replacement rules**: for example, `{ AB → BA, B → A }`.
2. **Scan from left**: Start from the beginning of the sequence.
3. **Find First Match**: Looks for the first occurrence of the left side of any rule.
4. **Perform a replacement**: Replace that single matching sequence.
5. **Repeat**: Restart scanning from the beginning of the newly formed sequence.

If multiple rules are present, the system may try them in a specific order, or it may scan a rule repeatedly, only moving to the next rule if no match is found.

## Meaning

This type of system is important because it closely simulates common computing processes we use every day. A remarkable conclusion from studying these systems is that even simple operations available in a basic text editor are capable of producing behavior of enormous complexity (categories 3 and 4).

This discovery reinforces the book's central theme: complex computation is not a high-level, complex phenomenon but is inherent in even the simplest rule-based processes.