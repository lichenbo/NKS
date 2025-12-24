# 《一种新科学》（A New Kind of Science, NKS）互动笔记与注释（中文）

English version: `README.en.md`

如果你在 Google 搜索 **“一种新科学 中文版”**、**“A New Kind of Science 中文版”** 或 **“NKS 中文”**，这个仓库提供的是：围绕 Stephen Wolfram 著作《A New Kind of Science》（中文常译《一种新科学》）的 **中文/多语言互动阅读笔记与注释站点**（非官方、非原书全文）。

## 在线体验（Live Demo）

**https://lichenbo.github.io/NKS/**

**https://nks.binarythink.net/**

## 这是什么

一个纯前端（HTML/CSS/JavaScript）的静态站点，用三栏布局呈现：

- 左侧：章节/导航大纲
- 中间：章节正文（以 Markdown 存储与渲染）
- 右侧：术语注释与延伸说明（可点击展开，含打字机效果）

目标是把《一种新科学 / A New Kind of Science》的关键概念（元胞自动机、计算等价性、涌现、普适性等）用更可交互的方式组织起来，方便学习、回看与索引。

## 主要特性

- **三栏布局**：章节大纲 / 主内容 / 注释并列
- **可交互注释**：点击高亮词条查看详细解释（带打字机效果）
- **元胞自动机背景**：实时实现 Wolfram Rule 30 生成动态背景
- **响应式设计**：桌面、平板、手机自适应
- **玻璃拟态 UI**：细腻动画与悬浮交互
- **Markdown 内容源**：章节与注释以独立 `.md` 文件维护，方便增量编辑

## 项目结构

```
/
├── index.html              # 页面骨架与三栏布局
├── script.js               # 核心交互逻辑
├── styles.css              # 样式与布局
├── js/                     # 多语言/工具脚本（如 translations）
├── chapters/               # 章节笔记（Markdown，按语言分目录）
│   ├── en/
│   ├── zh/
│   └── ja/
├── annotations/            # 注释与扩展说明（Markdown，按语言分目录）
│   ├── en/
│   ├── zh/
│   └── ja/
├── demos/                  # 章节引用的交互演示
├── images/                 # 图片资源
└── interactive/            # 额外交互页面
```

## 本地运行

这是静态项目，用任意静态文件服务器即可：

```bash
python -m http.server 8000
```

然后打开 `http://localhost:8000`。

## 内容维护

### 添加新章节
1. 在 `chapters/` 新建 `chapter[N].md`
2. 在 `index.html` 中补充章节入口
3. 如有新术语注释，在 `annotations/` 中新增对应 `.md`

### 注释链接语法

在 Markdown 中用 `annotation:` 链接到注释条目：

```markdown
关于[计算等价性](annotation:computational-equivalence)的讨论指出……
```

## 常见问题（FAQ）

### 这是不是《一种新科学》中文版全文？

不是。本项目是个人笔记/注释与交互式导读页面，用于学习与索引；原书版权归 Stephen Wolfram 所有。


## 版权与声明

- 本项目仅用于学习与个人研究用途。
- 《A New Kind of Science》（《一种新科学》）版权归 Stephen Wolfram 所有。

## 相关链接

- https://www.stephenwolfram.com/
- https://www.wolframscience.com/
- https://www.wolframscience.com/nks/
