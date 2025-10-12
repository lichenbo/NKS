# 第 3 章: 簡単なプログラムの世界

前の章では、セルオートマトンという単純なアノテーションが生成できる驚くほど複雑な動作を垣間見ました。しかし、これは偶然なのでしょうか、それともより深い普遍的な法則を明らかにしているのでしょうか？この問いに答えるためには、第1章の具体例を超えて、自然科学者が生物の多様性を探求するのと同じように、単純なルールで構成される「計算宇宙」の中に、他にどのような「種」が隠されているのかを体系的に検討する必要がある。

## セルオートマトンの再探索

### 基本的な動作タイプ
私たちはまず [注釈: セルオートマトン] の世界に戻り、より包括的な国勢調査を実施しました。 256 個の最も基本的な (2 色、近傍 1) ルールをすべて 1 つずつ検証することにより、詳細は大きく異なりますが、行動パターンは依然として 4 つのカテゴリに明確に分類できることがわかりました ([注釈:行動の 4 つのクラス] を参照)。
- ルール 0 など、すぐに安定する繰り返し構造。
- 固定サイズの可動部分構造を形成します。
- ルール 90 など、無限の詳細を持ちながら規則性の高いネストされたパターンまたはフラクタル パターンを生成します。
- [ルール 30](注釈:ルール-30) のような、一見完全にランダムで無秩序なパターンを表示します。

これらのカテゴリは、典型的なパフォーマンスを迅速に特定するのに役立つだけでなく、その後のシステム間比較のための参照フレームを形成するのにも役立ちます。

![4種類の簡単なプログラム動作例](../../images/chapter3/p52.png)

### 基本ルール パノラマ
256 個のルール間の差異を定量化するために、各ローカル近傍の「真理値表」を 8 ビットのバイナリ シーケンスにエンコードし、ルール空間のコンパクトなビューが得られます。画像のコラージュは、表紙の一般的なルールを対比し、すべての組み合わせのパノラマ、つまり「計算の世界」の多様性を一目で明らかにするサムネイルを表示します。

![基本ルールのコーディングの概要](../../images/chapter3/p53.png)
![全 256 の基本ルールの進化のサムネイル](../../images/chapter3/p53_2.png)

マクロな分類に加えて、個々のルールの進化により、より微妙な違いも明らかになります。あるものはすぐに統一に陥り、あるものは移動する局所構造を解放し、あるものは広がりながら再配置を続けます。

<div class="content-layer detailed">

![ルール 0、7、255 の単純な繰り返し動作](../../images/chapter3/p54.jpg)
![局所構造と移動パターンの組み合わせ](../../images/chapter3/p55.jpg)
![拡散とドリフトが共存する進化の例](../../images/chapter3/p56.jpg)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">詳細を展開</span>
  <span class="toggle-icon">▼</span>
</button>

### フラクタルとランダムの例
多くのルールは繰り返し構造または有限構造を持つ傾向がありますが、入れ子になったフラクタルやほぼランダムな複雑なテクスチャを生成するルールもまだ数多くあります。たとえば、ルール 22、159、および 225 は異なるフラクタル次元を示しますが、ルール 30、45、106 などは、長期間にわたって明らかな周期のないランダムな背景を維持します。

<div class="content-layer detailed">

![入れ子・フラクタルパターンの代表例](../../images/chapter3/p58.png)
![ほぼランダムに進化する基本的なセルオートマトン](../../images/chapter3/p59.png)

進化時間を延長することで混合行動を観察することができます。規則的な背景と不規則な紛争の絡み合い、局所構造のゆっくりとした成長や衰退、非常に長い時間スケールでのみ現れる傾向の単純化などです。

![ルール 110 スタイルのハイブリッド構造相互作用](../../images/chapter3/p66.png)
![3000 ステップを経て複雑なパターンが継続的に進化](../../images/chapter3/p68.png)
![ランダムバーストと全体的なコンバージェンスの比較](../../images/chapter3/p69.png)
![代替テキスト](../../images/chapter3/image.png)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">詳細を展開</span>
  <span class="toggle-icon">▼</span>
</button>


### 合計ルールとマルチカラー拡張機能
ルールの複雑さが根本的に動作を変えるかどうかをテストするために、セルの色を 2 (黒/白) から 3 (黒/白/灰色) に拡張し、「極端」または [totalistic-cellular-automata] ルール (注釈:totalistic-cellular-automata) を試しました (新しい色は隣接する色の合計にのみ依存します)。この設定により、ルールの数は 256 から 2187、またはそれ以上に増加しますが、その中心となる動作は依然として、繰り返し、ネスト、ランダム性の 3 つのテーマに従います。

<div class="content-layer detailed">

![3 色の極値ルールの近傍マッピング](../../images/chapter3/p60.png)
![三色極則の代表的な進化](../../images/chapter3/p61.png)
![有限期間と繰り返しセグメントの例](../../images/chapter3/p62.png)
![繰り返し構造の連続展開](../../images/chapter3/p63_1.png)
![3 色の極端な規則の下で入れ子になったフラクタル](../../images/chapter3/p63_2.png)
![3色極則のランダムテクスチャ](../../images/chapter3/p64.png)

より高い色数またはより大きな近傍を調べ続けたとしても、画像は、複雑さに必要な主要な要素がルールの複雑さの非常に低いしきい値ですでに満たされていることを示しています。

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">詳細を展開</span>
  <span class="toggle-icon">▼</span>
</button>


## 異なる星系にわたる遠征

これらの現象がセル オートマトンに限定されないことを確認するために、同じ探索的アプローチを複数の計算モデルに一般化し、それらの代表的な進化を画像に記録しました。

### [モバイル オートマトン](注釈:モバイル オートマトン)
オートマトンを移動すると、グローバル同期からローカル更新および個々の「アクティブ セル」の移動に更新が変更されます。 65,536 の最も単純なルールのうち、ほとんどのケースでは限定的または周期的な動作のみが生成されますが、入れ子構造やほぼランダムなカラー パッチは依然として観察されます。複数のアクティブなセルまたはより豊富な状態が許可されると、複雑な進化が出現する可能性が高くなります。

<div class="content-layer detailed">

![モバイルオートマトンの部分ルール表現](../../images/chapter3/p71.png)
![典型的な移動オートマトン ルールの進化的スキャン](../../images/chapter3/p72_1.png)
![圧縮表示時のオートマトンの移動軌跡](../../images/chapter3/p72_2.png)

ルールの複雑さが増し、活発な細胞分裂が可能になるにつれて、モバイルオートマトンもネストとランダム性の多様なテクスチャーを示すようになります。

![入れ子構造の移動オートマトン](../../images/chapter3/p73.png)
![ほぼランダムなテクスチャを持つ動くオートマトン](../../images/chapter3/p74.png)
![アクティブセルのランダムウォークの例](../../images/chapter3/p75.png)
![汎用移動オートマトンのルール設定](../../images/chapter3/p76.png)
![複数のアクティブセルによる複雑さの増加](../../images/chapter3/p77.png)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">詳細を展開</span>
  <span class="toggle-icon">▼</span>
</button>


### [チューリングマシン](注釈:チューリングマシン)
チューリング マシンは、一次元テープ上のアクティブ セル (ヘッド) も移動させるという点で、移動オートマトンに似ていますが、ヘッドは複数の状態を持つことができます。 2 つの状態と 2 つの色の最も単純な組み合わせでは、繰り返しまたはネストされた動作のみが生成されます。ヘッド状態が 4 つに拡張されると、ランダムなテクスチャが表示され、「複雑さのしきい値」の存在が再度確認されます。

<div class="content-layer detailed">

![チューリングマシンの基本構成](../../images/chapter3/p78.png)
2 状態チューリング マシンの典型的な動作
![2 状態チューリング マシンの典型的な動作](../../images/chapter3/p79.png)
マルチステートチューリングマシンの動作比較
![多状態チューリングマシンの動作比較](../../images/chapter3/p80.png)
4状態チューリングマシンの確率的進化
![4 状態チューリング マシンの確率的進化](../../images/chapter3/p81.png)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">詳細を展開</span>
  <span class="toggle-icon">▼</span>
</button>


### [置換システム](注釈:置換システム)
置換システムにより、ルールの変更に応じて要素の数を増減できます。ルールが要素自体の色のみに依存する場合、非常に規則的なネストされたフラクタルが生成されます。ルールが隣接要素に依存し、要素の作成または破棄を許可する場合、その動作はランダム拡散に近くなり、セル オートマトンのパフォーマンスと区別がつきません。

<div class="content-layer detailed">

!【部分置換システムの進化例】(../../images/chapter3/p82.png)
![パーティション置換システムのネストモード](../../images/chapter3/p83.png)
![代替システムの構造サンプルをさらに見る](../../images/chapter3/p84.png)
システムをツリー視覚化に置き換える
![ツリー視覚化による置換システム](../../images/chapter3/p84_2.png)
![隣接依存置換ルール](../../images/chapter3/p85.png)
作成と破壊を含む置換システム
![創造と破壊を含む置換システム](../../images/chapter3/p86.png)
![多色置換システムの一般的な動作](../../images/chapter3/p87.png)
![多色置換システムの複雑な相互作用](../../images/chapter3/p87_2.png)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">詳細を展開</span>
  <span class="toggle-icon">▼</span>
</button>

### [逐次置換システム](注釈:逐次置換システム)
置換システムを「左から右に最初に一致するものを見つけて置換する」ように変更すると、テキスト エディタの「検索と置換」に似たモデルが得られます。少数のルールでは重複または入れ子が生成されるだけですが、ルールのセットが拡大すると、セル オートマトンに匹敵する予測不可能なシーケンスも発生する可能性があります。

<div class="content-layer detailed">

![順序付け置換システムの基本ルール](../../images/chapter3/p89.png)
![2 つの代替ルールの交互の進化](../../images/chapter3/p90.png)
![複数ルールの順序付けされた置換の動作比較](../../images/chapter3/p91.png)
![ほぼランダムな文字列を生成するための順序付け置換システム](../../images/chapter3/p92.png)

</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">詳細を展開</span>
  <span class="toggle-icon">▼</span>
</button>

### [識別システム](注釈:タグシステム)
マーキング システムは、各ステップでシーケンスの先頭から固定数のシンボルを削除し、削除のパターンに従って特定のシンボル ブロックを末尾に追加します。 1 つのシンボルが削除されると、そのシンボルは近隣に依存しない置換システムとして機能します。 2 つのシンボルが削除されるか、ラウンドロビン ルールが使用されると、複雑な相互作用とランダムな変動が現れます。
<div class="content-layer detailed">

![ロゴシステムの基本的な進化](../../images/chapter3/p93.png)
![一度に2つのシンボルを削除する識別システム](../../images/chapter3/p94.png)
</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">詳細を展開</span>
  <span class="toggle-icon">▼</span>
</button>

### 周期識別システム

<div class="content-layer detailed">

!【サイクル識別システムの動作図】(../../images/chapter3/p95.png)
![ループ識別システムの動作比較](../../images/chapter3/p96_1.png)
サイクル識別システムの成長変動
![周期的識別システムの成長変動](../../images/chapter3/p96_2.png)
</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">詳細を展開</span>
  <span class="toggle-icon">▼</span>
</button>

### [マシンの登録](注釈:マシンの登録)
レジスタ マシンは、基礎となる CPU がインクリメントおよびデクリメント ジャンプ命令を通じてレジスタを操作する方法を抽象化します。 4 命令以内のプログラムは最終的に反復動作に戻り、命令数が 8 に達すると、ほぼランダムな複雑なシーケンスが表示され、複雑さのしきい値がまだ非常に低いことがわかります。
<div class="content-layer detailed">

![代替テキスト](../../images/chapter3/image-1.png)
![代替テキスト](../../images/chapter3/image-2.png)
![8 命令レジスタ マシンの複雑な進化](../../images/chapter3/p100.png)
</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">詳細を展開</span>
  <span class="toggle-icon">▼</span>
</button>

### [シンボル システム](注釈:symbolic-systems)
同様の実験は型書き換えシステムでも実行できます。簡潔な括弧式と置換ルール(Mathematica の `/.` 一致置換など)を使用して記号導出をシミュレートします。ルールは非常に非局所的ですが、これらのシステムは、単純な設定の下で反復的、ネストされた、さらにはランダムな動作も示します。
<div class="content-layer detailed">

![型システムの一段階進化プロセス](../../images/chapter3/p102.png)
![ブラケット構造の全体的な動作の視覚化](../../images/chapter3/p103.png)
![複雑な変動を示す文字体系](../../images/chapter3/p104.png)
</div>
<button class="expand-toggle" data-target="simplified" data-expanded="false">
  <span class="toggle-text">詳細を展開</span>
  <span class="toggle-icon">▼</span>
</button>

> 詳細資料: [コンビネーター: 100 周年の展望](https://writings.stephenwolfram.com/2020/12/combinators-a-centennial-view/)

## 方法論に関する結論と考察

多くの計算モデルにわたるこの旅は、最終的に、非常に単純なルールが非常に複雑な動作を生み出す可能性があるという、確かで奥深い結論に導きました。これは偶然でも特別なケースでもなく、普遍的なコンピューティング現象です。基礎となる構造が並列セル アレイ、可動ヘッド、または動的ストリングであるかどうかに関係なく、ルールが十分な情報処理能力を許可する (しきい値が非常に低い) 限り、ルールは 4 つの共通の動作パターンを示します。

![代替テキスト](../../images/chapter3/image-3.png)

発見自体は新しい科学的手法、[コンピューター実験](注釈: 科学的方法論) に依存しています。従来の数学のように目標を設定してそれを達成できるシステムを構築するのではなく、最も直接的な方法でそれを行います。つまり、最も単純なプログラムを系統的にバイアスなく実行し、その動作を詳細に観察するということです。この方法により、直感の制約を取り除き、純粋な理論では演繹するのが難しい現象を捉えることができます。また、新しい現象を発見する最善の方法は、多くの場合、最も単純かつ直接的な実験を実施し、実験によって生成された膨大な量の生データを広い心で見ることであることも思い出させてくれます。多くの場合、画像は統計的な要約よりもはるかに多くの情報を明らかにします。