# 图灵机

图灵机（Turing Machine）是艾伦·图灵提出的抽象计算模型，包含无限长纸带、读写头与状态转换规则，用于刻画可算法计算的极限。它是在理论计算机科学中定义可计算性与复杂性的标准模型。

## 结构
- **纸带**：双向无限、分格存储符号。
- **读写头**：每步读取当前格、按规则写入新符号并左/右移动。
- **状态表**：根据当前状态与读入符号决定写入、移动、下一状态。

## 角色
- **可计算性**：与现代计算机同等的计算能力（丘奇-图灵论题）。
- **普适性**：存在单一规则（普适图灵机）可模拟所有其他图灵机。
- **复杂性研究**：通过运行时间、空间度量描述问题难度。

## NKS 视角
- 图灵机与元胞自动机、替换系统等相互模拟，体现“计算等价性”。
- 在“移动自动机”“网络系统”等模型中扮演参照物。

## 延伸阅读
- A. Turing, "On Computable Numbers, with an Application to the Entscheidungsproblem" (1936)
- S. Wolfram, *A New Kind of Science*, Chapter 11
- [Turing machine（维基百科）](https://en.wikipedia.org/wiki/Turing_machine)
