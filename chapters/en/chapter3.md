# Chapter 3: The World of Simple Programs

In the previous chapter, we got a glimpse of the surprisingly complex behavior that a simple [Cellular Automata](annotation:cellular-automata) can produce. But is this a coincidence, or does it reveal a deeper universal law? In order to answer this question, we must go beyond the specific examples in Chapter 1 and systematically examine what other "species" are hidden in the "computational universe" composed of simple rules, just like natural scientists explore biological diversity.

## Re-exploration of cellular automata

### Basic behavior types
We first returned to the world of [Cellular Automata](annotation:cellular-automata) to conduct a more comprehensive census. By examining all 256 most basic (two colors, neighborhood 1) rules one by one, we found that although the details vary widely, the behavior patterns can still be clearly classified into four categories (see [Four Classes Of Behavior](annotation:four-classes-of-behavior)):
- Repeating structures that stabilize quickly, such as rule 0;
- Form fixed-size, movable partial structures;
- Generate nested or fractal patterns with infinite detail but high regularity, such as Rule 90;
- Present seemingly completely random and disordered patterns, such as [Rule 30](annotation:rule-30).

These categories not only help us quickly locate typical performance, but also form a frame of reference for subsequent cross-system comparisons.

![Examples of four types of simple program behaviors](../../images/chapter3/p52.png)

### Basic Rules Panorama
To quantify the difference across 256 rules, we encode each local neighborhood's "truth table" into an 8-bit binary sequence, resulting in a compact view of the rule space. A collage of images contrasts the common rules of the cover and presents a panorama of all combinations, thumbnails that make the diversity of the "computational universe" clear at a glance.

![Basic rules coding overview](../../images/chapter3/p53.png)
![Thumbnails of evolution of all 256 basic rules](../../images/chapter3/p53_2.png)

In addition to macro classification, the evolution of individual rules also reveals more subtle differences: some quickly fall into unity, some release moving local structures, and some continue to rearrange as they spread.

<div class="content-layer detailed">

![Simple repeated behavior of rules 0, 7, 255](../../images/chapter3/p54.jpg)
![Combination of local structure and moving pattern](../../images/chapter3/p55.jpg)
![Example of evolution where diffusion and drift coexist](../../images/chapter3/p56.jpg)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">Expand details</span>
  <span class="toggle-icon">▼</span>
</button>

### Fractal and Random Examples
Although many rules tend to have repetitive or finite structures, there are still a number of rules that generate nested fractals or nearly random complex textures. For example, rules 22, 159, and 225 present different fractal dimensions, while rules 30, 45, 106, etc. maintain a random background with no obvious period over a long period of time.

<div class="content-layer detailed">

![Representative example of nested/fractal pattern](../../images/chapter3/p58.png)
![Basic cellular automaton with approximately random evolution](../../images/chapter3/p59.png)

Mixed behaviors can be observed by extending the evolution time: regular backgrounds intertwined with irregular conflicts, slow growth or decay of local structures, and simplifying trends that only appear on extremely long time scales.

![Rule 110-style hybrid structure interaction](../../images/chapter3/p66.png)
![Continuous evolution of complex patterns after 3000 steps](../../images/chapter3/p68.png)
![Comparison of random bursts and overall convergence](../../images/chapter3/p69.png)
![alt text](../../images/chapter3/image.png)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">Expand details</span>
  <span class="toggle-icon">▼</span>
</button>


### Sum rules and multi-color extensions
To test whether rule complexity fundamentally changes behavior, we expanded the cellular colors from two (black/white) to three (black/white/grey) and tried the "extreme" or [totalistic-cellular-automata] rule (annotation:totalistic-cellular-automata) (new colors only depend on the sum of neighbor colors). This setting pushes the number of rules from 256 to 2187 or even higher, but its core behavior still follows the three themes of repetition, nesting, and randomness.

<div class="content-layer detailed">

![Neighborhood mapping of three-color extreme rules](../../images/chapter3/p60.png)
![Representative evolution of the three-color extreme rule](../../images/chapter3/p61.png)
![Examples of finite period and repeating segments](../../images/chapter3/p62.png)
![Continuous expansion of repeated structures](../../images/chapter3/p63_1.png)
![Nested fractals under three-color extreme rules](../../images/chapter3/p63_2.png)
![Random texture in three-color extreme rule](../../images/chapter3/p64.png)

Even if we continue to examine higher color numbers or larger neighborhoods, the image still shows that the key elements required for complexity are already satisfied at a very low threshold of rule complexity.

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">Expand details</span>
  <span class="toggle-icon">▼</span>
</button>


## Expeditions across different systems

To confirm that these phenomena are not limited to cellular automata, we generalized the same exploratory approach to multiple computational models and recorded their representative evolution in images.

### [Mobile automata](annotation:mobile-automata)
Moving automata change updates from global synchronization to local updates and movements of individual "active cells". Of the 65,536 simplest rules, most cases produce only limited or periodic behavior, but nested structures and approximately random color patches can still be observed. Complex evolution becomes more likely to emerge when multiple active cells or richer states are allowed.

<div class="content-layer detailed">

![Partial rules representation of mobile automata](../../images/chapter3/p71.png)
![Evolutionary scan of typical moving automata rules](../../images/chapter3/p72_1.png)
![Moving automaton trajectory under compressed display](../../images/chapter3/p72_2.png)

As the complexity of the rules increases and even allows active cell division, the mobile automata will also exhibit diverse textures of nesting and randomness.

![Nested structured moving automaton](../../images/chapter3/p73.png)
![Moving automata with approximately random textures](../../images/chapter3/p74.png)
![Example of active cell random walk](../../images/chapter3/p75.png)
![Rule settings for generalized moving automata](../../images/chapter3/p76.png)
![Increased complexity brought by multiple active cells](../../images/chapter3/p77.png)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">Expand details</span>
  <span class="toggle-icon">▼</span>
</button>


### [Turing machine](annotation:turing-machines)
Turing machines are similar to moving automata in that they also move active cells (heads) on a one-dimensional tape, but the heads can have multiple states. The simplest combination of two states and two colors will only produce repeated or nested behaviors. When the head states are expanded to four, random textures appear, once again confirming the existence of a "complexity threshold."

<div class="content-layer detailed">

![Basic configuration of Turing machine](../../images/chapter3/p78.png)
Typical behavior of a two-state Turing machine
![Typical behavior of a two-state Turing machine](../../images/chapter3/p79.png)
Behavior comparison of multi-state Turing machines
![Behavior comparison of multi-state Turing machines](../../images/chapter3/p80.png)
Stochastic evolution of four-state Turing machines
![Stochastic evolution of four-state Turing machine](../../images/chapter3/p81.png)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">Expand details</span>
  <span class="toggle-icon">▼</span>
</button>


### [Substitution System](annotation:substitution-systems)
The substitution system allows the number of elements to increase or decrease as the rules change. If the rules only rely on the color of the element itself, a highly regular nested fractal will be generated; when the rules rely on neighbors and allow elements to be created or destroyed, the behavior will be closer to random diffusion, which is indistinguishable from the performance of a cellular automaton.

<div class="content-layer detailed">

![Evolution example of partial replacement system](../../images/chapter3/p82.png)
![Nested mode of partitioned replacement system](../../images/chapter3/p83.png)
![More structural samples of replacement systems](../../images/chapter3/p84.png)
Replace system with tree visualization
![Replacement system with tree visualization](../../images/chapter3/p84_2.png)
![Neighbor-dependent replacement rules](../../images/chapter3/p85.png)
Replacement system including creation and destruction
![Replacement system including creation and destruction](../../images/chapter3/p86.png)
![Typical behavior of multi-color replacement systems](../../images/chapter3/p87.png)
![Complex interactions of multi-color replacement systems](../../images/chapter3/p87_2.png)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">Expand details</span>
  <span class="toggle-icon">▼</span>
</button>

### [Sequential-substitution-systems](annotation:sequential-substitution-systems)
Change the replacement system to "find the first match from left to right and replace", and you get a model similar to the "find-replace" of a text editor. A small number of rules will only produce duplication or nesting, but when the set of rules expands, unpredictable sequences comparable to cellular automata can also occur.

<div class="content-layer detailed">

![Basic rules for ordered substitution systems](../../images/chapter3/p89.png)
![Alternating evolution of two alternative rules](../../images/chapter3/p90.png)
![Behavior comparison of multi-rule ordered substitution](../../images/chapter3/p91.png)
![Ordered substitution system for generating approximately random strings](../../images/chapter3/p92.png)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">Expand details</span>
  <span class="toggle-icon">▼</span>
</button>

### [Identification system](annotation:tag-systems)
The marking system removes a fixed number of symbols from the front of the sequence at each step, and then appends specific blocks of symbols to the end according to the pattern of removal. When one symbol is removed, it acts as a neighbor-independent substitution system; when two symbols are removed or a round-robin rule is used, complex interactions and random fluctuations emerge.
<div class="content-layer detailed">

![Basic evolution of the logo system](../../images/chapter3/p93.png)
![Identification system that removes two symbols at a time](../../images/chapter3/p94.png)
</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">Expand details</span>
  <span class="toggle-icon">▼</span>
</button>

### Cycle identification system

<div class="content-layer detailed">

![Operation diagram of cycle identification system](../../images/chapter3/p95.png)
![Comparison of behavior of loop identification systems](../../images/chapter3/p96_1.png)
Growth fluctuations in cycle identification systems
![Growth fluctuations in cyclic identification systems](../../images/chapter3/p96_2.png)
</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">Expand details</span>
  <span class="toggle-icon">▼</span>
</button>

### [Register machine](annotation:register-machines)
The register machine abstracts the way the underlying CPU operates registers through increment and decrement-jump instructions. Programs within four instructions eventually return to repetitive behavior, and when the number of instructions reaches eight, approximately random complex sequences appear, indicating that the complexity threshold is still very low.
<div class="content-layer detailed">

![alt text](../../images/chapter3/image-1.png)
![alt text](../../images/chapter3/image-2.png)
![The complex evolution of the eight-instruction register machine](../../images/chapter3/p100.png)
</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">Expand details</span>
  <span class="toggle-icon">▼</span>
</button>

### [Symbol system](annotation:symbolic-systems)
Similar experiments can also be performed in type rewriting systems: we simulate symbolic derivation with concise bracket expressions and substitution rules (such as `/.` matching substitution in Mathematica). Although the rules are highly non-local, these systems also exhibit repetitive, nested, and even random behaviors under simple settings.
<div class="content-layer detailed">

![Single-step evolution process of type system](../../images/chapter3/p102.png)
![Visualization of the overall behavior of the bracket structure](../../images/chapter3/p103.png)
![Type system exhibiting complex fluctuations](../../images/chapter3/p104.png)
</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">Expand details</span>
  <span class="toggle-icon">▼</span>
</button>

> Extended reading: [Combinators: A Centennial View](https://writings.stephenwolfram.com/2020/12/combinators-a-centennial-view/)

## Conclusion and reflection on methodology

This journey across many computational models finally led us to a solid and profound conclusion: extremely simple rules can emerge extremely complex behaviors. This is neither an accident nor a special case, but a universal computing phenomenon. Regardless of whether the underlying structure is a parallel cell array, a moving head, or a dynamic string, as long as the rules allow sufficient information processing power (the threshold is very low), they will exhibit the four common behavioral patterns.

![alt text](../../images/chapter3/image-3.png)

The discovery itself relies on a new scientific method - [computer experiment](annotation:scientific-methodology). Instead of setting a goal and then constructing a system that can achieve it like traditional mathematics, we do it in the most direct way: running the simplest programs systematically and without bias, and observing their behavior in detail. It is this method that allows us to get rid of the constraints of intuition and capture phenomena that are difficult to deduce by pure theory. It also reminds us that the best way to discover new phenomena is often to conduct the simplest and most direct experiments, and to look at the vast amounts of raw data generated by the experiments with an open mind - many times, an image reveals far more information than any statistical summary.