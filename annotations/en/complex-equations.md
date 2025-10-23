# Complex Equations

In traditional science, in order to describe complex natural phenomena, people often construct complex equations containing a large number of variables, differential terms or statistical terms, hoping to predict system behavior from analytical or numerical solutions.

Typical examples include:

- **Navier–Stokes equations for fluid mechanics**:
  `ρ(∂u/∂t + u·∇u) = −∇p + μ∇²u + f` is used to describe the velocity field of viscous fluids, but it is difficult to give an intuitive explanation for phenomena such as turbulence.
- **Lorentz equation for nonlinear dynamical systems**:
  `dx/dt = σ(y − x), dy/dt = x(ρ − z) − y, dz/dt = xy − βz`, exhibits chaotic behavior but still relies on continuous approximation.
- **Reactions in Chemical Reactions – Diffusion Equation**:
  `∂u/∂t = D∇²u + R(u)`, coupling diffusion and reaction rates through differential equations.

These equations often require numerical solutions and have many model parameters, making it difficult to understand "why" a particular pattern occurs.

## NKS context

- Wolfram believes that although complex equations can fit specific phenomena, they are difficult to reveal the generation mechanism and often rely on artificial assumptions and continuous approximations.
- "A New Science" emphasizes replacing complex equations with computable simple programs and directly observing evolution through discrete models such as cellular automata.
- Iteration of simple rules can also produce high-complexity behavior, demonstrating that complexity does not have to come from the complexity of the equations themselves.

## Further reading

- Chapter suggestions: Chapter 1 "Exploration of Simple Programs" and Chapter 4 "Complexity in Systems of Numbers" discuss ideas for replacing complex equations.
- Related concepts: [Generative Rules](annotation:generative-rules), [Computational Irreducibility](annotation:computational-irreducibility).