---
title: js生成随机字符串以及任意范围的数字
categories:
  - Node.js
date: 2019-01-30 11:21:38
tags:
---

## 代码细节

```js
function radom_num(min, max) {
    // 如果非数字则报错
    if (typeof min !== 'number' || typeof max !== 'number')
        throw new Error('param invalidate,should be a number')
    // 如果顺序有问题则互换位置
    if (min > max) {
        [min, max] = [max, min]
    }
    // 如果二者相等则返回一个
    if (min === max) {
        return min
    }
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function ramdom_str(length = 6) {
    var str = 'abcdefghijklmnopqrstuvwxyz'
    str += str.toUpperCase();
    str += '0123456789'
    var _str = ''
    for (let i = 0; i < length; i++) {
        var rand = Math.floor(Math.random() * str.length)
        _str += str[rand];
    }

    return _str
}
```


## 库

另外，我是用 TypeScript 写了兼容浏览器端和服务器端的随机数获取库，直接使用`npm i -S random.ts` 安装即可，如下是使用方法。

```js
// ES6
import { getNum, getStr, getSafer } from 'random.ts'
import * as Random from 'random.ts'
// Node
var Random = require('random.ts')

// get random number of given range
// this is equal with getNum(100, 2)
Random.getNum(2, 100)

// if param is not number type always return 0
Random.getNum("string", "string")

// if param out of safe range always return 0
Random.getNum(0, 2 ** 53)

// get random string,default length is 6
Random.getStr(6)

// get safer random string, default length is 16
// v1.3.0 only supports node.js
// after v1.3.0 supports ES6 browser(using ArrayBuffer and window.crypto)
// for better compatibility in favor of getStr()
Random.getSafer()
```
