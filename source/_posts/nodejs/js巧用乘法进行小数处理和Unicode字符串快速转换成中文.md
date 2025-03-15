---
title: js巧用乘法进行小数处理和Unicode字符串快速转换成中文
categories:
  - Node.js
date: 2019-01-30 11:20:35
tags:
---

## 小技巧：Unicode字符串快速转换成中文

```js
function conversion(str) {
    var json = `{"v":"${str}"}`
    return JSON.parse(json).v
}

var res = conversion('\u6211\u662f\u0075\u006e\u0069\u0063\u006f\u0064\u0065')

console.log(res)
```

补充内容：

每个字符在JavaScript内部都是以16位（即2个字节）的UTF-16格式储存。也就是说，JavaScript的单位字符长度固定为16位长度，即2个字节。

但是，UTF-16有两种长度：对于U+0000到U+FFFF之间的字符，长度为16位（即2个字节）；对于U+10000到U+10FFFF之间的字符，长度为32位（即4个字节），而且前两个字节在0xD800到0xDBFF之间，后两个字节在0xDC00到0xDFFF之间。举例来说，U+1D306对应的字符为𝌆，它写成UTF-16就是0xD834 0xDF06。浏览器会正确将这四个字节识别为一个字符，但是JavaScript内部的字符长度总是固定为16位，会把这四个字节视为两个字符。

```js
var s = '\uD834\uDF06';

s // "𝌆"
s.length // 2
/^.$/.test(s) // false
s.charAt(0) // ""
s.charAt(1) // ""
s.charCodeAt(0) // 55348
s.charCodeAt(1) // 57094
```

上面代码说明，对于于U+10000到U+10FFFF之间的字符，JavaScript总是视为两个字符（字符的length属性为2），用来匹配单个字符的正则表达式会失败（JavaScript认为这里不止一个字符），charAt方法无法返回单个字符，charCodeAt方法返回每个字节对应的十进制值。

es6增加了对这类字符的处理：http://es6.ruanyifeng.com/#docs/string

## 巧用乘法进行小数处理

题1：
一个商城要对购物车总价进行处理，比如说价格区间为 [1.00, 1.02] 返回 1.00；[1.03, 1.07] 返回 1.05；[1.08, 1.09] 返回  1.10。

方法来自： https://segmentfault.com/q/1010000011578508

```js
function format(price) {
    return return Math.round(elem*20)/20;
}
```

题2：
商城中商品评分用图形星星表示，但是满分为5星（以后可能回更改10分制），可以为半星，不足5分的地方用灰色的星星表示，当评分区间[1,1.4]的时候，直接渲染1个星星；评分为[1.5,1.9]，直接渲染1.5个星星。

方法来自：https://github.com/ustbhuangyi/vue-sell

```js
  const LENGTH = 5;
  const CLS_ON = 'on';
  const CLS_HALF = 'half';
  const CLS_OFF = 'off';
  function(score) {
        let result = [];
        let score = Math.floor(score * 2) / 2;
        let hasDecimal = score % 1 !== 0;
        let integer = Math.floor(score);
        for (let i = 0; i < integer; i++) {
          result.push(CLS_ON);
        }
        if (hasDecimal) {
          result.push(CLS_HALF);
        }
        while (result.length < LENGTH) {
          result.push(CLS_OFF);
        }
        return result;
  }
```
