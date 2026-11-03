# Polyadic Research Group

可维护的双语学术主页项目。现采用 Apple 官网风格的白灰配色、系统无衬线字体、居中大标题、轻透吸顶导航和圆角研究卡片。包含 14 篇论文、1 篇研究解读、16 位成员、交互式并行生成示意和原定稿 Logo；论文、文章入口、人员与文案由独立 JSON 文件管理。

**快速预览：解压后直接打开 `dist/index.html`。** 主页已内嵌全部样式、脚本和论文封面；研究解读正文位于 `dist/posts/`，本地 PDF 位于 `dist/assets/papers/`，请保留整个 `dist/` 文件夹。

## 本次视觉更新

- 首页先展示研究主张与共同迭代动画，再依次进入研究主题、研究成果、团队成员、开源代码和加入与支持。
- 研究摘录依次分为 Blogs、Continuous Diffusion Language Model、Masked Diffusion Language Model、Traditional GPT 和 Others，提供分类跳转入口；组内支持 `order` 自定义排序与日期排序。论文每篇独占一行，摘要、结果表和 BibTeX 可独立展开。
- 论文示意图默认使用 GIF，进入可见区域时自动播放；静态海报仅用于暂停、离屏或系统减少动态效果设置。手动暂停会保留。
- 完整保留原有论文内容、成员顺序、外链、中英文切换及 GitHub Pages 工作流。
- 未添加第三方运行时依赖、外部字体、分析脚本或后端。

## 本地运行

安装 Node.js 22 或以上（建议 24）。没有第三方 npm 依赖，不需要 `npm install`、API Key 或后端。

```bash
cd polyadic-research
npm run dev
```

打开终端显示的地址，默认 http://localhost:4173。修改 `content/`、`src/`、`assets/` 或 `others/` 后自动构建并刷新浏览器。修改开发服务器脚本本身后重启命令。Ctrl+C 停止运行。

只想看成品，可以直接双击压缩包中的 `dist/index.html`。

## 日常维护改哪里

| 内容 | 文件 |
| --- | --- |
| 新增、修改论文 | `content/papers/*.json`，一篇一个文件 |
| 研究分类名称与顺序 | `content/home.json` 的 `researchCategories` |
| 研究解读入口、分类与组内顺序 | `content/posts.json` |
| 研究解读正文、样式与交互 | `others/CDLM_Post_1_HTML/index.html` 和同目录 `assets/` |
| 研究解读中文版 | `others/CDLM_Post_1_HTML/zh.html`，与英文版共享素材 |
| 人员、顺序、职务、简介、主页、头像 | `content/people.json` |
| 新闻与发布动态 | `content/news.json` |
| 首页介绍、研究主题、开源计划、中英文文案 | `content/home.json` |
| 网站标题、描述、联系方式、Logo、年份 | `content/site.json` |
| 布局、样式、交互 | `src/template.html`、`src/styles.css`、`src/client.js` |

**日常改内容不用编辑 HTML。** `dist/` 是自动生成结果，直接修改会被下次构建覆盖。

首屏标题、简介和按钮文案在 `content/home.json` 的 `copy` 中维护。`heroBullets` 的前两条展示在使命区，第三条展示在团队下方，其余条目展示在加入与支持区；内容仍保留原有富文本和联系方式按钮能力。页面顺序与结构在 `src/template.html`，论文卡片结构在 `src/render.mjs`，设计变量在 `src/styles.css` 顶部。

## 新增论文和成员

```bash
npm run add:paper -- my-new-paper
npm run add:person -- first-last
```

第一条创建 `content/papers/my-new-paper.json`，填好后设置 `published: true`。论文可配置 `order` 非负整数，在所属分类中数字越小越靠前；未填写的排在组内后面，按日期从新到旧排列。例如设置为 `0`、`1`、`2` 等，直接改数字即可调整顺序。可配置 PDF / Code / Demo 链接、BibTeX、封面和结果表格。封面支持 GIF / 动态 WebP；提供静态 `poster` 后可播放／暂停，并适配系统“减少动态效果”设置。

第二条在 `content/people.json` 追加一条记录，填好后设置 `visible: true`。人员按数组顺序展示，移动对象即可排序。`role: null` 不显示职务；`visible: false` 暂时隐藏。

LangDiT 已附带循环动图；新论文的动图配置可参考 `examples/animated-cover.json`。

完整字段、图片用法和可复制的例子见 [内容维护指南](docs/CONTENT.md)。

## 检查与构建

```bash
npm run check
npm test
npm run build
```

检查会指出格式、ID、日期、链接和本地素材错误。测试覆盖新增内容、草稿隐藏、排序、多篇 BibTeX、Logo 切换等流程。

成品在 `dist/`。`dist/index.html` 内嵌样式、脚本、Logo 及使用的封面/头像，可直接打开。分发完整网站时保留 `dist/assets/` 和 `dist/posts/`，让本地 PDF 与研究解读链接正常访问。文章由 `content/posts.json` 配置，构建时将其 `others/<folder>/index.html` 与配套素材复制到 `dist/posts/<id>/`，并调整返回主页的相对链接。

## GitHub Pages 自动部署

1. 将源码提交到 GitHub 仓库的 `main` 分支，包含 `.github/workflows/pages.yml`。不用提交 `dist/`。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 打开 **Actions → Build and deploy Polyadic website → Run workflow** 运行一次。
4. 以后推送 `main` 会自动检查、构建和发布；Pull Request 只检查与构建，不发布。

日常更新：

```bash
git add content assets
git commit -m "Update papers and team"
git push
```

也可以直接在 GitHub 网页编辑 JSON 并提交，部署流程相同。

通过 GitHub CLI 首次创建一个**新的公开仓库**，先 `gh auth login`，然后运行：

```bash
bash deploy-github.sh YOUR_ACCOUNT polyadic-research-group
```

脚本拒绝覆盖已有仓库。如果初始工作流早于 Pages 配置而失败，配置完成后在 Actions 重跑。实际部署成功与网址以仓库 Actions / Pages 页面为准。

从旧单页仓库迁移时：先保留备份，将本项目源码放到仓库根目录，移除旧的根目录 `index.html`，再将 Pages 来源从分支发布改成 GitHub Actions。维护的是源码而非 `dist/`。

部署配置参考：[GitHub 官方 Pages 工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## Logo 与联系方式

默认蓝色 Logo 为 `assets/H3-triad-hex.svg`，渐变版为 `assets/H3-triad-hex-gradient.svg`，对应透明 PNG 均已包含。在 `content/site.json` 修改 `logo` 路径，页头与浏览器图标同步变化。

Email / WeChat 只需在 `site.json` 的 `contact` 改一次。仍默认点击后显示，源码中可以看到内容。浏览器仅保存语言偏好，没有分析跟踪或外部脚本。

现有内容来源见 [PROVENANCE.md](docs/PROVENANCE.md)。
