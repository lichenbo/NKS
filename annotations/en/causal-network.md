# Causal Network

A causal network records the causal relationship between events in a computational or physical process: each node represents an update event, and directional edges represent "causes produce consequences."

![alt text](../../images/causal-network/image.png)

## Key concepts
- **Event Graph**: Abstract the specific state of the system, retaining only events and their causal sequence.
- **Time Arrow**: The topological order along directed edges gives the passage of time as perceived by the internal observer.
- **Space-time Slice**: Selecting different equivalent "slices" can correspond to different inertial systems or observation perspectives.

## Role in NKS
- **Move/Replace System**: Build global causal networks from asynchronous local updates and understand evolution without a global clock.
- **Causal invariance**: If different update orders generate the same causal network, it corresponds to the universal physical laws in the theory of relativity.
- **Physical Modeling**: Provides a framework for the emergence of phenomena such as continuous space-time geometry and the speed of light limit from discrete rules.

## Further reading
- S. Wolfram, *A New Kind of Science*, Chapter 9
- [Wolfram Physics Project](https://www.wolframphysics.org/)