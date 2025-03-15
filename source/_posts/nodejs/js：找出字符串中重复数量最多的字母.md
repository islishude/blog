---
title: js：找出字符串中重复数量最多的字母
categories:
  - Node.js
date: 2019-01-30 11:22:25
tags:
---

## 1
```js
var str = 'cbdefdfpoweqwlkjsaaaaz'
function findMostLetter(str) {
    // 去除空格并排序
    let match = str
        .replace(" ", "")
        .split("")
        .sort()
        .join("")
        .match(/(\w)\1*/g);
    let res = "";
    let len = 0;
    match.forEach((val, key) => {
        if (val.length > len) {
            res = val[0];
            len = val.length;
        }
    });
    return res;
}

findMostLetter(str)
```

## 2

```js
function test(str) {
  return str
    .replace(" ", "")
    .split("")
    .sort()
    .join("")
    .match(/(\w)\1*/g)
    .sort((x, y) => x.length - y.length)
    .pop()[0];
}

const res = test("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa   dddddddfdf");
console.log(res);
```
