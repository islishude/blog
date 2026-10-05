# Lishude's Web Note

基于 Astro + AstroPaper 的中文技术博客，部署于 <https://blog.islishude.xyz>。

## 本地开发

使用 Node.js 24 和 npm：

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`build` 包含内容校验、Astro 类型检查、静态构建、Pagefind 搜索索引及链接回归检查。搜索需在构建后通过 `preview` 验证；开发服务器不会生成索引。`npm run lint` 可单独检查主题代码。

## 写文章

在 `source/_posts` 下新增 Markdown，可按主题建立子目录：

```yaml
---
title: 我的技术笔记
date: 2026-10-05 12:00:00
slug: golang/my-note
tags:
  - golang
categories:
  - golang
description: 可选摘要；省略时从正文提取。
---
```

日期始终按 UTC 解释，URL 为 `/2026/10/05/golang/my-note/`。`slug` 必须显式填写，可包含分类目录，保持中文及大小写；改标题或移动源文件不会改链接。已发布文章不要修改日期和 slug。重复路径及非法日期会使构建失败。`draft: true` 可隐藏草稿，未来日期文章按 AstroPaper 规则暂不发布。

旧 Hexo 的 `:title` 实际包含源文件的分类目录。125 篇文章的 UTC 构建地址保存在 `tests/legacy-links.json`，迁移以此为基准，直接输出原地址，没有跳转。该清单由迁移前锁文件对应的 Hexo 在 `TZ=UTC` 下导出，请勿为了通过测试而重写它。旧分类、标签、归档及分页地址不在兼容范围内。

## 配置与发布

站名、作者、导航功能等配置位于 `astro-paper.config.ts`。GitHub Actions 在 `main` 更新后执行测试和构建，并将 `dist` 发布到 GitHub Pages。自定义域名保留为 `blog.islishude.xyz`。

## 主题来源

使用 AstroPaper 6.1.0，基于上游提交 [`35cfa7f`](https://github.com/satnaing/astro-paper/tree/35cfa7fbe0b897306d27670d3819e55d5205f3dd)，并针对中文排版、永久链接和内容格式作轻度定制。主题许可证见 `LICENSE-AstroPaper`；依赖通过 `package-lock.json` 锁定。

## 内容及转载

历史内容也可在 [GitHub Issues](https://github.com/islishude/blog/issues) 查看。文章采用[署名—非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/deed.zh-hans)，转载须保留署名且用于非商业用途。
