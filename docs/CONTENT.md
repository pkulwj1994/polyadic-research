# 内容维护指南

## 基本规则

JSON 使用英文双引号，最后一项后面不留逗号。`id` 使用唯一的小写英文、数字和短横线，例如 `langdit-2026`。改显示名称时通常保留原 ID。

双语字段使用 `{ "en": "English", "zh": "中文" }`。暂缺中文可省略 `zh`，页面自动回退到英文；普通字符串在两种语言下显示相同内容。修改后运行 `npm run check`，错误会指出具体文件和字段。

`published: false` / `visible: false` 不进入生成的页面，但源码仓库仍可包含这些记录，它们不是私密存储。

## 论文：一篇一个文件

运行 `npm run add:paper -- my-paper` 创建 `content/papers/my-paper.json`，填写内容后将 `published` 改为 `true`。文件名必须与 ID 对应。完整的例子：

```json
{
  "id": "my-paper",
  "published": false,
  "date": "2026-10-24",
  "title": "Your Paper Title",
  "authors": ["First Author", "Second Author"],
  "status": { "en": "PREPRINT", "zh": "预印本" },
  "summary": { "en": "A short explanation of the contribution.", "zh": "用两三句话说明研究问题与主要贡献。" },
  "links": [
    { "label": { "en": "Read paper", "zh": "阅读论文" }, "url": "https://example.org/paper" },
    { "label": "PDF", "url": "https://example.org/paper.pdf" },
    { "label": "Code", "url": "https://github.com/YOUR_ORG/YOUR_REPO" }
  ],
  "bibtex": "@misc{my2026paper,\n  title={Your Paper Title},\n  year={2026}\n}",
  "cover": { "kind": "text", "title": "Short Name", "eyebrow": "CONTINUOUS LANGUAGE MODELS", "captionLines": ["A concise description."] }
}
```

例子里的地址需要替换成真实链接。发表的论文至少需要一个作者和一个链接；标题使用 `links` 中的第一个地址。论文按日期倒序排列，同日期按 ID 排序。`status` 可填会议或期刊名，例如 `ICLR 2027`。

`bibtex`、`cover`、`results` 都可省略，不会出现空按钮或空表格。每篇 BibTeX 独立展开。

### 论文封面

把图片放到 `assets/papers/`，将 `cover` 换成：

```json
{ "kind": "image", "image": "assets/papers/my-paper.png", "alt": "Overview of the proposed method" }
```

支持 **GIF、动态 WebP**，以及静态 PNG、JPG、WebP、SVG。图片在构建时原样内嵌 HTML，动画帧不会被转成静态图；建议单张压缩到 1 MB 以下。

### 使用论文动图

1. 把动图放到 `assets/papers/my-paper.gif`（也可以是 `.webp`）。
2. 准备一张同尺寸的静态封面 `assets/papers/my-paper-poster.png`。
3. 编辑 `content/papers/my-paper.json` 的 `cover`：

```json
"cover": {
  "kind": "image",
  "image": "assets/papers/my-paper.gif",
  "poster": "assets/papers/my-paper-poster.png",
  "alt": "Animation illustrating the proposed method"
}
```

默认自动播放，循环次数由 GIF / WebP 文件自身决定。填入 `poster` 后，卡片显示独立的播放／暂停按钮；暂停时切回静态封面，再播放时从头开始。访客启用系统“减少动态效果”时默认显示静态封面，可手动播放。禁用 JavaScript 时仍能显示静态封面。

`poster` 可省略，届时直接显示原始动图，没有播放／暂停按钮。`poster` 应是真正的静态 PNG、JPG、WebP 或 SVG，建议与动图使用相同比例，避免切换时抖动。

当前 LangDiT 已使用 `assets/papers/langdit-preview.gif` 和 `langdit-poster.png`。这是依据原封面制作的概念性结构示意动画，不是模型生成结果。可复制 `examples/animated-cover.json` 的内容作为 `cover`，替换文件路径和 `alt`。

LangDiT 的动图生成源文件是 `scripts/create-langdit-animation.py`。只有重新绘制该示意动画时才需要 Python、Pillow 和 DejaVu 字体；正常开发和 GitHub Pages 构建直接使用已附带的图片，不增加 npm 依赖。

`kind: "text"` 保留文字封面，`kind: "architecture"` 仍支持原来的静态结构示意图。

如需本地 PDF，把文件放到 `assets/papers/`，链接 `url` 写 `assets/papers/my-paper.pdf`。相对路径适用于 GitHub Pages 项目子目录；分发 HTML 时也应带上该 PDF。

### 可选结果表格

在论文对象中增加 `results`，每行单元格数必须与 `columns` 一致：

```json
{
  "summary": { "en": "Results & evaluation context", "zh": "结果与评测条件" },
  "caption": { "en": "Benchmark and metric", "zh": "评测集与指标" },
  "columns": ["Method", "Score"],
  "rows": [["Method A", "12.3"], ["Method B", "10.8"]],
  "note": { "en": "Explain the evaluation settings.", "zh": "注明评测设置、预算与比较条件。" }
}
```

## 人员

编辑 `content/people.json`，数组顺序就是展示顺序。运行 `npm run add:person -- first-last` 可追加一条隐藏的待填写记录。示例：

```json
{
  "id": "new-researcher",
  "name": "New Researcher",
  "initials": "NR",
  "role": { "en": "Contributor", "zh": "贡献者" },
  "bio": { "en": "PhD student, Example University.", "zh": "某大学博士生。" },
  "website": "https://example.org/",
  "showProfileLink": false,
  "visible": true
}
```

移动对象即可排序；删除对象即可移除成员；`visible: false` 暂时隐藏。`role: null` 不显示职务。

填写 `website` 后名字自动成为链接，留空则显示普通文字。`showProfileLink: true` 额外显示“Personal website / 个人主页”。`initials` 可省略，自动使用姓名缩写。

可选头像：加入 `"photo": "assets/people/new-researcher.jpg"` 并放入对应图片；未填头像则保留缩写方块。

## 新闻

编辑 `content/news.json`，按日期倒序展示，`url` 可省略：

```json
{
  "id": "paper-release",
  "date": "2026-10-24",
  "text": { "en": "Our new paper is available.", "zh": "我们的新论文已发布。" },
  "url": "https://example.org/paper",
  "visible": true
}
```

## 首页文案与网站设置

`content/home.json` 的主要字段：

| 字段 | 内容 |
| --- | --- |
| `heroBullets` | 首页介绍列表；`showContacts: true` 在该条末尾显示联系按钮 |
| `topics` | 研究主题，可增删 |
| `openSourceGoals` | 开源模型库目标，可增删 |
| `joinPaths` | 合作、贡献、加入和支持说明 |
| `copy` | 导航文字、各部分标题、简介及其他固定文案 |

富文本字段带 `"html": true`，允许 `<br>`、`<em>`、`<strong>` 和关键词花色字：

```html
<span class='color-word'>non-profit</span>
<span class='color-word color-word--teal'>parallel intelligence</span>
<span class='color-word color-word--warm'>donations</span>
```

其他标签会被构建检查拒绝。论文和人员字段按普通文字处理。

`content/site.json` 管理标题、描述、品牌文字、年份、Logo 和联系方式。将 `logo` 改为 `assets/H3-triad-hex-gradient.svg` 可切换渐变版，页头与浏览器图标同步更新。联系方式在 `contact` 中改一次即可更新所有位置。

## 代码结构

| 文件 | 职责 |
| --- | --- |
| `src/template.html` | 页面骨架 |
| `src/render.mjs` | 论文、人员、动态等重复区块的渲染 |
| `src/content.mjs` | 数据读取、校验、双语与素材处理 |
| `src/styles.css` | 响应式样式 |
| `src/client.js` | 语言切换、菜单、BibTeX、联系按钮、示意动画 |
| `scripts/build.mjs` | 生成 `dist/` |
| `scripts/dev.mjs` | 本地预览、自动构建与刷新 |
| `.github/workflows/pages.yml` | GitHub 自动检查、构建及 Pages 部署 |

新增完整区块或改变布局时再修改 `src/`。日常发论文、换成员、更新介绍主要维护 `content/`。
