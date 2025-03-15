---
title: node.js 中的 process.env 遇到的坑
categories:
  - Node.js
date: 2018-07-31 17:59:28
tags:
---

有这么一段代码，是否会有打印输出 “hello,world” ?

```js
process.env.dev = false;

if(process.env.dev){
    console.log("hello,world");
}
```

答案是会。

因为 process.env 给任何属性赋值都会先转化为字符串，而字符串在强制转化成布尔值是 true，所以回打印输出。

![image](https://user-images.githubusercontent.com/24730006/42135726-d464110e-7d81-11e8-9afb-53f3c8f0c2a1.png)

来自官方文档，值得注意的是，以后不可以再给process.env的属性赋值为非字符串类型，否则会再将来的版本中报错。

> Assigning a property on process.env will implicitly convert the value to a string. This behavior is deprecated. **Future versions of Node.js may throw an error when the value is not a string, number, or boolean.**

有空还得多看官方文档啊。