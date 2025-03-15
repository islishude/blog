---
title: JS将字符串转为驼峰写法
categories:
  - Node.js
date: 2019-01-30 11:23:45
tags:
---

## 就是干

```js
function toCamel(str) {
    if (!str.indexOf('-') || typeof str !== 'string') throw new Error('the param is invalidation')
    var strArr = str.split('-')
    var _str = ''
    strArr.forEach(function (v, k) {
        if(k ===  0){
            _str += v.toLowerCase()
        }else {
            _str += (v[0].toUpperCase()+v.slice(1).toLowerCase())
        }
    })

    return _str
}

var res = toCamel('Eric-is-a-gOoD-maN')
console.log(res)
```

## 使用正则

```js
function toCamel(str) {
  const reg = /(\w)-(\w)/g;
  return str.replace(reg, (match, m1, m2) => {
    console.log(match);
    return m1 + m2.toUpperCase();
  });
}

const str = "is-man-ma";

console.log(toCamel(str));
```
