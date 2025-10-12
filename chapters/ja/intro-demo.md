# インタラクティブなデモンストレーション: [Conway Game of Life](注釈:conways-game-of-life)

*新しい科学に入る前に、単純なルールがいかに無限の複雑さを生み出すかを直接確認してください。 *

**💡 使用方法:**

- **グリッドを左クリック**して、細胞の生死ステータスを切り替えます (金色は生細胞、黒は死細胞)
- **「再生」ボタンをクリック**してシミュレーションを開始し、パターンがどのように変化するかを観察します
- **「ランダム」ボタン**を試してみると、即座に混乱が生じます - そして何が現れるか見てみましょう!
- **以下のプリセット モードを使用して有名な構成を探索してください**

<div id="ゲームオブライフコンテナ" class="ゲームオブライフコンテナ">
    <div class="ゲームコントロール">
        <div class="コントロール行">
            <button id="play-pause-btn" class="control-btn priority">▶ 播放</button>
            <button id="step-btn" class="control-btn">单步</button>
            <button id="clear-btn" class="control-btn">清空</button>
            <button id="random-btn" class="control-btn">随机</button>
        </div>
        <div class="コントロール行">
            <label for="speed-slider">速度：</label>
            <input type="range" id="speed-slider" min="1" max="10" value="5" class="slider">
            <span id="speed-display">1x</span>
        </div>
        <div class="コントロール行">
            <label>网格大小：</label>
            <button id="grid-smallest" class="size-btn active">20×20</button>
            <button id="grid-small" class="size-btn">40×40</button>
            <button id="grid-medium" class="size-btn">100×100</button>
            <button id="grid-large" class="size-btn">300×300</button>
        </div>
    </div>

<canvas id="game-canvas" class="game-canvas"></canvas>

<div class="パターンライブラリ">
    <h3>🎨 次のモードを試してください:</h3>
    <div class="パターンボタン">
        <button class="pattern-btn" data-pattern="glider">✈️ グライダー</button>
        <button class="pattern-btn" data-pattern="blinker">💫 ウインカー</button>
        <button class="pattern-btn" data-pattern="toad">🐸 ヒキガエル</button>
        <button class="pattern-btn" data-pattern="beacon">🔆 ビーコン</button>
        <button class="pattern-btn" data-pattern="pulsar">🌟 パルサー</button>
        <button class="pattern-btn" data-pattern="lightweight-spaceship">🚀 軽量宇宙船</button>
        <button class="pattern-btn" data-pattern="gosper-gun">🔫 ゴスパーマシンガン</button>
        <button class="pattern-btn" data-pattern="pentadecathlon">⚡ 15 グリッド オシレーター</button>
        <button class="pattern-btn" data-pattern="acorn">🌰 どんぐり</button>
        <button class="pattern-btn" data-pattern="diehard">💀 粘り強く生き延びましょう</button>
        <button class="pattern-btn" data-pattern="r-pentomino">🔥 R 型ペントミノ</button>
        <button class="pattern-btn" data-pattern="infinite-growth">📈 無限の成長</button>
    </div>
</div>

## 🧬 ゲームルール

コンウェイのライフ ゲームは、**4 つの簡単なルール** のみに従います。

1. **誕生**: 死んだセルは、周囲に生きている隣接セルがちょうど 3 つある場合に生きたセルになります。
2. **生存**: 生きているセルは、2 つまたは 3 つの生きている隣接セルがある場合、生き続けます。
3. **孤独死**: 生きているセルは、隣接するセルが 2 つ未満の場合に死にます。
4. **過密死**: 生きているセルは、隣接するセルが 3 つを超えると死にます。

*それでおしまい！これら 4 つのルールからは無限の複雑さが生まれます。 *

人生ゲームに興味がある場合は、[Golly](https://golly.sourceforge.io/) を使用して深く探索することをお勧めします。

## 🎯 あなたが経験していること

- **緊急事態**: 単純なルールから複雑なパターンが生まれる
- **自己組織化**: 中央制御はありませんが、組織化された行動が発生します。
- **普遍性**: 同じ原理が多くの自然現象を支配しています
- **予測不可能性**: ルールを知っていても、結果は依然として驚くべきものになる可能性があります

## 🌐 さらにインタラクティブなデモを探索する

### コンウェイ ライフ ゲーム
- [Golly](https://golly.sourceforge.io/) - 高度な人生ゲーム シミュレーター (クロスプラットフォーム)
- [Copy.sh ライフゲーム](https://copy.sh/life/) - シンプルかつ迅速なオンライン実装
- [LifeViewer](https://lazyslug.com/lifeviewer/) - RLE形式をサポートするスキーマビューア

### 関連インタラクションシミュレーション
- [Complexity Exploration](https://www.complexity-explorables.org/) - インタラクティブな複雑システム
- [NetLogo Model](https://ccl.northwestern.edu/netlogo/models/) - エージェントベースのシミュレーション
- [Emergent Mind](https://emergentmind.com/) - AI研究発見プラットフォーム
- [Genetic Cars Evolution](https://rednuht.org/genetic_cars_2/) - 遺伝的アルゴリズムと進化
- [Wolfram デモンストレーション](https://demonstrations.wolfram.com/) - 数学と科学のデモンストレーション

## 🧠 なぜこれが重要なのか

あなたが今経験したことは、Wolfram の研究の中心的なテーマです。**単純なルールは無限の複雑さを生み出す可能性があります**。この原則はどこにでもあります。

- 🌿 **生物学**: 細胞がどのようにして複雑な生物に組織化されるか
- 🌊 **物理学**: 粒子がどのように創発現象を生み出すか
- 💻 **計算**: 単純なプログラムが複雑な問題をどのように解決できるか
- 🧬 **進化**: シンプルな選択ルールがどのように多様性を生み出すか
- 🏙️ **社会**: 個人の行動が集団行動をどのように生み出すか

## 🎬 さらに探索する準備はできましたか?

創発現象を直接体験したので、この原理が科学、自然、コンピューティングに対する私たちの理解にどのような革命をもたらす可能性があるかを探る準備が整いました。

***第 1 章** をクリックして、「新しい科学」への旅を始めましょう。 *