# 交互演示：康威的生命游戏

*在深入了解《一种新的科学》之前，亲身体验简单规则如何创造出无限复杂性。*

**💡 使用方法：**

- **左键点击格子**切换细胞的生死状态（金色为活细胞，黑色为死细胞）
- **点击"播放"**开始模拟，观察模式如何演化
- **试试"随机"按钮**获得瞬间混沌 - 然后看看会涌现出什么！
- **使用下方预设模式**探索著名的配置

<div id="game-of-life-container" class="game-of-life-container">
    <div class="game-controls">
        <div class="control-row">
            <button id="play-pause-btn" class="control-btn primary">▶ 播放</button>
            <button id="step-btn" class="control-btn">单步</button>
            <button id="clear-btn" class="control-btn">清空</button>
            <button id="random-btn" class="control-btn">随机</button>
        </div>
        <div class="control-row">
            <label for="speed-slider">速度：</label>
            <input type="range" id="speed-slider" min="1" max="10" value="5" class="slider">
            <span id="speed-display">1x</span>
        </div>
        <div class="control-row">
            <label>网格大小：</label>
            <button id="grid-small" class="size-btn active">40×40</button>
            <button id="grid-medium" class="size-btn">100×100</button>
            <button id="grid-large" class="size-btn">300×300</button>
        </div>
    </div>

<canvas id="game-canvas" class="game-canvas"></canvas>

<div class="pattern-library">
    <h3>🎨 试试这些模式：</h3>
    <div class="pattern-buttons">
        <button class="pattern-btn" data-pattern="glider">✈️ 滑翔机</button>
        <button class="pattern-btn" data-pattern="blinker">💫 闪烁子</button>
        <button class="pattern-btn" data-pattern="toad">🐸 蟾蜍</button>
        <button class="pattern-btn" data-pattern="beacon">🔆 信标</button>
        <button class="pattern-btn" data-pattern="gosper-gun">🔫 高斯帕机枪</button>
        <button class="pattern-btn" data-pattern="pentadecathlon">⚡ 十五格振荡子</button>
    </div>
</div>

## 🧬 游戏规则

康威的生命游戏只遵循**四个简单规则**：

1. **诞生**：死细胞周围正好有3个活邻居时变成活细胞
2. **生存**：活细胞有2个或3个活邻居时保持存活
3. **孤独死亡**：活细胞邻居少于2个时死亡
4. **过度拥挤死亡**：活细胞邻居超过3个时死亡

*就是这样！从这四个规则中涌现出无限复杂性。*

## 🎯 你正在体验的现象

- **涌现性**：复杂模式从简单规则中产生
- **自组织**：没有中央控制，却出现有组织的行为
- **普遍性**：同样的原理支配着许多自然现象
- **不可预测性**：即使知道规则，结果仍可能令人惊讶

## 🌐 探索更多交互演示

### 康威的生命游戏
- [LifeWiki](https://www.conwaylife.com/wiki/Main_Page) - 综合模式数据库
- [Golly](http://golly.sourceforge.net/) - 高级生命游戏模拟器
- [Copy.sh 生命游戏](https://copy.sh/life/) - 简洁快速的在线实现
- [LifeViewer](https://lazyslug.com/lifeviewer/) - 支持RLE格式的模式查看器

### 相关交互模拟
- [沃尔夫勒姆的基本元胞自动机](https://www.wolfram.com/demonstrations/ElementaryCellularAutomata/) - 规则30、90、110等
- [复杂性探索](https://www.complexity-explorables.org/) - 交互式复杂系统
- [NetLogo模型](https://ccl.northwestern.edu/netlogo/models/) - 基于智能体的模拟
- [涌现思维](https://emergentmind.com/) - 涌现和自组织演示
- [分形与混沌](https://www.fractalus.com/ifswork/gallery.htm) - 交互式分形生成
- [群体智能](https://rednuht.org/genetic_cars_2/) - 遗传算法和进化
- [元胞自动机查看器](https://devinacker.github.io/cellauto/) - 实验不同的CA规则

## 🧠 为什么这很重要

你刚刚体验的正是沃尔夫勒姆工作的核心主题：**简单规则可以产生无限复杂性**。这个原理无处不在：

- 🌿 **生物学**：细胞如何组织成复杂的有机体
- 🌊 **物理学**：粒子如何创造涌现现象
- 💻 **计算**：简单程序如何解决复杂问题
- 🧬 **进化**：简单的选择规则如何创造多样性
- 🏙️ **社会**：个体行为如何创造集体行为

## 🎬 准备深入探索？

现在你已经亲身体验了涌现现象，你已经准备好探索这个原理如何革命性地改变我们对科学、自然和计算的理解。

*点击**第一章**开始你的《一种新的科学》之旅。*