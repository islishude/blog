---
title: Markdown 实现代码 diff 效果
categories:
  - tool
date: 2019-01-30 11:41:01
tags:
---

如下图所示，github 提供了代码提交记录的 diff 效果，其实在 markdown里面也可以轻松实现。
 
![image](https://user-images.githubusercontent.com/24730006/33866277-9392cea8-df30-11e7-8a8c-6909a99cbb00.png)

```patch
-if(v > 100)
+if(v > 120)
```

代码块的语法类型为`patch`，在删除行加上 `-`，在新增行加上 `+`。

更新：

看到 [web3.js](https://raw.githubusercontent.com/ethereum/web3.js/develop/README.md) 上用的语法类型是 `diff` ，和上面的 `patch` 差不多。

```diff
-var web3 = require('web3');
+var Web3 = require('web3');
+var web3 = new Web3();
```
