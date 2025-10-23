# fluid flow

Fluid flow covers the movement of liquid or gas in space. The core consists of velocity field, pressure field and their evolution over time. The research objects cover various phenomena such as laminar flow, turbulent flow, vortex, and shock wave.

![alt text](../../images/fluid-flow/image.png)

## Laminar flow and turbulent flow
- **Laminar Flow**: The streamlines are parallel and the shear is small, usually occurring under low Reynolds number conditions.
- **Turbulence**: Velocity and pressure fluctuate with time and space height, accompanied by vortex injection and energy cascade, which is one of the classic problems.

## Calculation model
- **Lattice Gas/Lattice Boltzmann**: Simulate the macroscopic behavior of fluids with simple collision and propagation rules on a discrete grid.
- **Cellular Automata**: Use discrete particle rules to generate structures such as vortex streets and turbulent wakes, emphasizing "intrinsic randomness".
- **Partial Differential Equations**: The Navier-Stokes equation describes the conservation of momentum and mass in continuous media and is the basis of traditional theory.

## NKS perspective
- Simple programs (such as lattice gas cellular automata) can reproduce the transition from laminar to turbulent flow, revealing that randomness can be generated endogenously by deterministic rules.
- Echoing the discussion of "continuity phenomenon": a macroscopic smooth flow field can be averaged by microscopic discrete particles.

## Related concepts
- Reynolds Number
- Vortex and Carmen Vortex Street
- Calculation irreducibility (predicting turbulence requires step-by-step simulation)

## Further reading
- [Fluid dynamics (Wikipedia)](https://en.wikipedia.org/wiki/Fluid_dynamics)
- [Turbulence (Wikipedia)](https://en.wikipedia.org/wiki/Turbulence)
- [Lattice Boltzmann method (Wikipedia)](https://en.wikipedia.org/wiki/Lattice_Boltzmann_methods)