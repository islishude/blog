---
title: "在单页应用中 index.html 该使用什么 cache-control ？"
date: 2023-09-12 05:52:20
slug: "nodejs/在单页应用中-index-html-该使用什么-cache-control"
categories: ["Node.js"]
tags: ["Web"]
---

`index.html` 是 SPA 单页应用的入口， js/css 等静态文件路径都在这里被定义。

所以一般而言，`index.html` 的缓存控制指令会被设置为 `private, max-age=0`。

这样设置后， CDN 和浏览器都不会缓存 `index.html`，当代码更新时也不会导致用户侧出现没有更新的状态。

但是这样导致的结果是，CDN 始终回源浪费了一些流量，同时也牺牲了页面加载速度。

所以一般而言，也有把缓存控制改为 `max-age=60` 这样。

设置缓存生效时间是一个很难权衡的事情，一分钟大概是一个最好的选择。

不过还有一个更近一步的改进。

增加 stale-while-revalidate 指令，这个指令的作用是，当页面过期时继续使用当前的缓存，并且在后台进行缓存协商，如果需要更改，那么下一次用户刷新页面就会使用最新的缓存。

所以最佳实践的配置是 `public,max-age=60,stale-while-revalidate=2592000`，保证旧缓存可以持续使用一个月。

这样做之后对于页面的加载速度是一个巨大提升，尤其是客户群是分布在全世界。

不过使用 `stale-while-revalidate` 的前提是 cdn 需要支持，目前 cloudfront 和 cloudflare 都是支持的，其它 CDN 需要查看其具体文档。

我最常使用的 s3 和 cloudfront，所以这样使用时没有问题的。

如果你也使用 aws 这样的架构，可以使用我写的 [spa-deploy-action](https://github.com/islishude/spa-deploy-action
) 来部署你的应用。

除了内置缓存控制策略，这个 spa-deploy-action 还保证了 index.html 始终在静态文件上传成功后进行更新，这样用户就不会因为刷新到最新的页面而静态文件获取不到导致出现的问题。

---

原文：[GitHub Issue #258](https://github.com/islishude/blog/issues/258)
