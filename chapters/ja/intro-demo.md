# インタラクティブデモ：[コンウェイのライフゲーム](annotation:conways-game-of-life)

*「新しい科学」に入る前に、シンプルなルールがいかに無限の複雑さを生み出すかを体験してください。*

**💡 使い方：**

- **セルを左クリック**してグリッド上でオン（金色）またはオフ（黒）を切り替える
- **「プレイ」をクリック**してシミュレーションを開始し、パターンの進化を観察する
- **「ランダム」を試して**瞬間的なカオスを作り出し、何が[出現](annotation:emergence)するかを見る！
- **下のプリセットパターンを使って**有名な構成を探索する

<div id="game-of-life-container" class="game-of-life-container">
    <div class="game-controls">
        <div class="control-row">
            <button id="play-pause-btn" class="control-btn primary">▶ プレイ</button>
            <button id="step-btn" class="control-btn">ステップ</button>
            <button id="clear-btn" class="control-btn">クリア</button>
            <button id="random-btn" class="control-btn">ランダム</button>
        </div>
        <div class="control-row">
            <label for="speed-slider">速度：</label>
            <input type="range" id="speed-slider" min="1" max="10" value="5" class="slider">
            <span id="speed-display">1x</span>
        </div>
        <div class="control-row">
            <label>グリッドサイズ：</label>
            <button id="grid-smallest" class="size-btn active">20×20</button>
            <button id="grid-small" class="size-btn">40×40</button>
            <button id="grid-medium" class="size-btn">100×100</button>
            <button id="grid-large" class="size-btn">300×300</button>
        </div>
    </div>

<canvas id="game-canvas" class="game-canvas"></canvas>

<div class="pattern-library">
    <h3>🎨 これらのパターンを試してください：</h3>
    <div class="pattern-buttons">
        <button class="pattern-btn" data-pattern="glider">✈️ グライダー</button>
        <button class="pattern-btn" data-pattern="blinker">💫 ブリンカー</button>
        <button class="pattern-btn" data-pattern="toad">🐸 トード</button>
        <button class="pattern-btn" data-pattern="beacon">🔆 ビーコン</button>
        <button class="pattern-btn" data-pattern="pulsar">🌟 パルサー</button>
        <button class="pattern-btn" data-pattern="lightweight-spaceship">🚀 軽量宇宙船</button>
        <button class="pattern-btn" data-pattern="gosper-gun">🔫 ゴスパー銃</button>
        <button class="pattern-btn" data-pattern="pentadecathlon">⚡ ペンタデカスロン</button>
        <button class="pattern-btn" data-pattern="acorn">🌰 どんぐり</button>
        <button class="pattern-btn" data-pattern="diehard">💀 ダイハード</button>
        <button class="pattern-btn" data-pattern="r-pentomino">🔥 Rペントミノ</button>
        <button class="pattern-btn" data-pattern="infinite-growth">📈 無限成長</button>
    </div>
</div>

## 🧬 ルール

コンウェイのライフゲームは**4つのシンプルなルール**に従います：

1. **誕生**：正確に3つの生きた隣接セルを持つ死んだセルが生きる
2. **生存**：2つまたは3つの生きた隣接セルを持つ生きたセルは生き続ける
3. **孤立による死**：2つ未満の隣接セルを持つ生きたセルは死ぬ
4. **過密による死**：3つより多い隣接セルを持つ生きたセルは死ぬ

*それだけです！これら4つのルールから無限の複雑さが出現します。*

## 🎯 あなたが体験していること

- **出現**：シンプルなルールから生じる複雑なパターン
- **自己組織化**：中央制御がないのに、組織化された行動が現れる
- **普遍性**：同じ原理が多くの自然現象を支配する
- **予測不可能性**：ルールを知っていても、結果が驚かせることがある

## 🌐 他のインタラクティブデモを探索

### コンウェイのライフゲーム
- [Golly](https://golly.sourceforge.io/) - 高度なライフゲームシミュレーター（クロスプラットフォーム）
- [Copy.sh Game of Life](https://copy.sh/life/) - シンプルで高速なオンライン実装
- [LifeViewer](https://lazyslug.com/lifeviewer/) - RLEサポート付きパターンビューア

### 関連するインタラクティブシミュレーション
- [Complexity Explorables](https://www.complexity-explorables.org/) - インタラクティブな複雑系
- [NetLogo Models](https://ccl.northwestern.edu/netlogo/models/) - エージェントベースシミュレーション
- [Emergent Mind](https://emergentmind.com/) - AI研究発見プラットフォーム
- [Genetic Cars Evolution](https://rednuht.org/genetic_cars_2/) - 遺伝的アルゴリズムと進化
- [Wolfram Demonstrations](https://demonstrations.wolfram.com/) - 数学的・科学的デモンストレーション

## 🧠 なぜこれが重要なのか

あなたが今体験したのは、ウルフラムの研究の中心テーマです：**シンプルなルールが無限の複雑さを生み出すことができる**。この原理はあらゆる場所に現れます：

- 🌿 **生物学**：細胞がいかに複雑な生物に組織化されるか
- 🌊 **物理学**：粒子がいかに創発現象を生み出すか
- 💻 **計算**：シンプルなプログラムがいかに複雑な問題を解決するか
- 🧬 **進化**：シンプルな選択ルールがいかに多様性を生み出すか
- 🏙️ **社会**：個人の行動がいかに集合的行動を生み出すか

## 🎬 より深く探求する準備はできましたか？

創発を直接体験した今、この原理が科学、自然、計算の理解をいかに革命化するかを探索する準備ができています。

*「新しい科学」への旅を始めるために**第1章**をクリックしてください。*