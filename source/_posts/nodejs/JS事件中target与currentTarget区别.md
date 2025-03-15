---
title: JS事件中target与currentTarget区别
categories:
  - Node.js
date: 2019-01-30 11:33:19
tags:
---

（1）currentTarget

currentTarget属性返回事件当前所在的节点，即正在执行的监听函数所绑定的那个节点。作为比较，target属性返回事件发生的节点。如果监听函数在捕获阶段和冒泡阶段触发，那么这两个属性返回的值是不一样的。
```js
function hide(e){
  console.log(this === e.currentTarget);  // true
  e.currentTarget.style.visibility = "hidden";
}

para.addEventListener('click', hide, false);
```

上面代码中，点击para节点，该节点会不可见。另外，在监听函数中，currentTarget属性实际上等同于this对象。

（2）target

target属性返回触发事件的那个节点，即事件最初发生的节点。如果监听函数不在该节点触发，那么它与currentTarget属性返回的值是不一样的。
```js
function hide(e){
  console.log(this === e.target);  // 有可能不是true
  e.target.style.visibility = "hidden";
}

// HTML代码为
// <p id="para">Hello <em>World</em></p>
para.addEventListener('click', hide, false);
```

上面代码中，如果在para节点的em子节点上面点击，则e.target指向em子节点，导致em子节点（即World部分）会不可见，且输出false。

在IE6—IE8之中，该属性的名字不是target，而是srcElement，因此经常可以看到下面这样的代码。

```js
function hide(e) {
  var target = e.target || e.srcElement;
  target.style.visibility = 'hidden';
}
```

ref: http://javascript.ruanyifeng.com/dom/event.html#toc15