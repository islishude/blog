---
title: express 路由模块化
categories:
  - Node.js
date: 2019-01-30 11:39:06
tags:
---

使用 express.Router 类来创建可安装的模块化路由处理程序。Router 实例是完整的中间件和路由系统；因此，常常将其称为“微型应用程序”。

以下示例将路由器创建为模块，在其中装入中间件，定义一些路由，然后安装在主应用程序的路径中。

在应用程序目录中创建名为 birds.js 的路由器文件，其中包含以下内容：

```js
var express = require('express');
var router = express.Router();

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});
// define the home page route
router.get('/', function(req, res) {
  res.send('Birds home page');
});
// define the about route
router.get('/about', function(req, res) {
  res.send('About birds');
});

module.exports = router;
```

接着，在应用程序中装入路由器模块：

```js
var birds = require('./birds');
...
app.use('/birds', birds);
````

此应用程序现在可处理针对 /birds 和 /birds/about 的请求，调用特定于此路由的 timeLog 中间件函数。