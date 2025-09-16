# Sequential Substitution Systems

A sequential substitution system is a variation of a [substitution system](annotation:substitution-systems) that operates more like the "Find and Replace" function in a typical text editor.

## How It Works

Instead of replacing all elements simultaneously, a sequential substitution system scans the sequence from left to right and performs a replacement only on the **first match** it finds.

1.  **Define a set of replacement rules**: For example, `{ AB → BA, B → A }`.
2.  **Scan from the left**: Start at the beginning of the sequence.
3.  **Find the first match**: Look for the first occurrence of the left-hand side of any rule.
4.  **Perform one replacement**: Replace that single matched sequence.
5.  **Repeat**: Start the scan again from the beginning of the newly formed sequence.

If there are multiple rules, the system might try them in a specific order, or it might repeatedly scan for one rule and only move to the next if no matches are found.

## Significance

This type of system is significant because it closely models a common computational process that we use every day. The remarkable conclusion from studying these systems is that even the simple operations available in a basic text editor are capable of producing behavior of great complexity (Class 3 and 4).

This finding reinforces the book's central theme: that complex computation is not a high-level, sophisticated phenomenon but is instead intrinsic to even the simplest of rule-based processes.