# Genetic Algorithm

Genetic Algorithm (GA) is a type of randomized search and optimization technology inspired by biological evolution. It iteratively finds optimal solutions in the solution space by simulating the process of "selection-crossover-mutation".

## Basic process
1. **Encoding Individuals**: Represent candidate solutions as chromosomes (usually strings or vectors).
2. **Fitness Assessment**: Evaluate individual strengths and weaknesses based on the objective function.
3. **Selection**: Select the parent generation based on fitness (such as roulette, tournament).
4. **Crossover and Mutation**: Generate new individuals by combining parents and random perturbations.
5. **Iteration**: Repeat the above steps until the termination condition is met.

## Features
- **Group Search**: Explore multiple candidate solutions in parallel to avoid falling into local optima.
- **Randomness**: Mutation and crossover introduce randomness and improve diversity.
- **Domain agnostic**: only the fitness function is needed and can be applied to a wide range of problems.

## NKS association
- Echoes the "random program screening" in natural evolution: a large number of simple programs can be randomly explored and filtered out complex behaviors.
- Emphasis on computational irreducibility in the face of complex behavior: evolutionary processes often have to be simulated step by step to understand the results.
- Demonstrate that highly complex, adaptive structures can emerge from iteration of simple rules.

## Further reading
- [Genetic algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Genetic_algorithm)
- [Evolutionary computation (Wikipedia)](https://en.wikipedia.org/wiki/Evolutionary_computation)