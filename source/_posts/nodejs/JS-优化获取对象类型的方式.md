---
title: JS 优化获取对象类型的方式
categories:
  - Node.js
date: 2019-01-30 11:24:20
tags:
---

我们都知道可以通过 `Object.prototype.toString.call(obj)` 的方式来获取类型真实的类型。

不过我发现一个更简单而且更快的写法。利用大括号 `{}` 代替 `Object.prototype`， 在 #135 中我简单说明了， `{}` 等价于 `Object.create(Object.prototype)`，所以这里就可以简写，没想到还变快了！ 

```js
console.time("1");
Object.prototype.toString
  .call(new Date())
  .match(/\s(\w)/)[1]
  .toLowerCase();
console.timeEnd("1");
console.time("2");
({}.toString
  .call(new Date())
  .match(/\s(\w)/)[1]
  .toLowerCase());
console.timeEnd("2");
```

测试结果（node v8.9.1）

![image](https://user-images.githubusercontent.com/24730006/33228743-40543442-d1fd-11e7-9ce1-a2dc9cdad688.png)

可以看到这种写法不仅简单，而且更快了。

写一个通用的 util 函数就是：

```js
function getType (obj) {
  return {}.toString.call(obj).match(/\s(\w+)/)[1].toLowerCase()
}
```
