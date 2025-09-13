# 生成规则（Generative Rules）

“规则”指的是一套极简单的、可重复执行的本地更新方式，更像“算法”而非传统的物理方程。

## 简述

- 想象一排只有黑白两色的方格（元胞自动机）
- 下一步每个格子的颜色，只由它自己和左右邻居的当前颜色、按一条固定规则决定
- 例子：只要左右邻居颜色不同，我就变黑；否则变白

这类简单的“生成规则”反复作用，从极简单的初始状态就能生成惊人复杂的结构。这正是 NKS 的核心思想：复杂性与智能可由简单规则自然产生，而不必依赖复杂设计。

## NKS 语境补充

- 规则空间与编号：一维二值元胞自动机可用 Wolfram 编号系统表示，支持对规则空间进行系统、可穷举的探索。
- 通用计算与内在普适性：极简单的规则（如 Rule 110）已证明图灵完备；不同简单程序彼此可模拟，支持“内在普适性”的观点。
- 更新方案与邻域：同步/异步更新、邻域半径与边界条件的选择，会显著改变可观察到的宏观行为谱系。
- 跨模型映射：替换系统、标签系统、图灵机、移动自动机等可相互模拟，体现“简单程序的统一观”。
- 相关演示：[256 规则演化](demos/wolfram-rules-256/wolfram-256-rules-demo.html)、[规则浏览器](demos/wolfram-rules-explorer/wolfram-rules-explorer.html)、[图灵机演示](demos/turing-machine-demo.html)、[标签系统演示](demos/tag-system-demo.html)、[顺序替换系统演示](demos/sequential-substitution-demo.html)、[寄存器机演示](demos/register-machine-demo.html)、[移动自动机演示](demos/mobile-automata-demo.html)。
