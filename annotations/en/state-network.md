# state network

"State networks" are a common visualization tool when studying discrete dynamical systems such as cellular automata. It helps us understand long-term behavior and attractor structures by representing all possible states of the system as nodes and using directed edges to connect those states that transform into each other through an evolutionary step.

## Composition method

- **Node**: Each node corresponds to the complete state of the system at a certain time (such as the configuration of the entire row of cells).
- **Directed edge**: If state A will evolve to state B after rule update, draw an edge from A to B.
- **Attractors**: Parts that form a closed loop represent states where the system will eventually cycle or stabilize.
- **Frontier Tree**: The branches leading to the attractor record how different initial conditions flow into the same long-term behavior.

## Analyze value

- Able to distinguish between fast-converging systems such as **Category 1/2** (simple network, small attractors) and complex systems such as **Category 3/4** (large network, intricate structure).
- Helps to count global properties such as the number of attractors, cycle length, and basin size.
- As a visualization means, it provides intuitive support for understanding computational irreducibility and information dissemination.

This network structure is also often called **state transition diagram** or **phase space diagram** and is widely used in complex systems, control theory, and computing theory.