---
title: 理解 JS 作用域和 this
categories:
  - Node.js
date: 2019-01-30 11:14:56
tags:
---

```js
(function(){
    var a = b =1;
})()
console.log(b)
```

答案：1。定义变量如果不使用 `var` 则变量为为全局作用域。当然严格模式是禁止这样做的。

>当查找变量的时候，会先从当前上下文的变量对象中查找，如果没有找到，就会从父级(词法层面上的父级)执行上下文的变量对象中查找，一直找到全局上下文的变量对象，也就是全局对象。

```JS
function test() {
  // 这里就是 a =1
  console.log(a);
  // 然后再赋值
  var a = 1;
}

test();
```
这里的变量a进行了提升，先定义（！把定义提升！）后（！在其赋值位置！）赋值，如果不存在 var 就不会提升，接着就是未定义报错。而函数表达式（`function t(){}` ）会提升最高，如果用 `var t = function (){} ` 的形式则根据变量原则提升。而在 ES6 中使用 let 和 const 不存在提升。
```js
function test() {
  console.log(1);
}

test();

var test = function() {
  console.log(2);
};

test();
```

这里就会输出 1 和 2。
```js
var a =20;
function t1(){
    console.log(a)
}
(function t2() {
    var a = 10;
    t1()
})()
```
```js
var scope = "global scope";
function checkscope(){
    var scope = "local scope";
    function f(){
        return scope;
    }
    return f();
}
checkscope();
```

```js
var scope = "global scope";
function checkscope(){
    var scope = "local scope";
    function f(){
        return scope;
    }
    return f;
}
checkscope()();
```

答案：20, "local scope" , "local scope"。JS 遵循词法作用域原则，函数的作用域在函数定义的时候就决定了，执行函数时先从函数内部查找是否有局部变量，如果没有就在定义的位置查找上面一层作用域，其中后两题来源于《JavaScript权威指南》。

```js
var a = 20;

var obj = {
    a: 40,
    test() {
        var a = 10;
        console.log(this.a)
    }
}
// Q1
obj.test();
// Q2
var t = obj.test;
t();
// Q3
(obj.test)();
// Q4
(obj.test, obj.test)()
```

答案：40，20，40，20。非箭头函数下的 this 指向运行时所在作用域。Q4 中逗号操作符会从左到右计算它的操作数，返回最后一个操作数的值。

必须说一下最后一个，Q3 为什么 this 指向的 obj，而 Q4 中 this 指向的是 window(非严格模式)？ 这里有一个技巧就是如果对象属性参与了计算，在 es 规范中就是 [GetValue] 就会失去对原对象的 this ，Q3 中圆括号没有参与计算，而 Q4 参与了计算。

类如

```js
(foo.bar = foo.bar)()
(false || foo.bar)()
(foo.bar, foo.bar)()
```

这里的 this 都会指向 undefined（非严格模式指向全局对象）

再比如说，这里的 this 也会指向 undefined

```js
var obj = {
  name: "obj",
  getName: function() {
    console.log(this === global);
  }
};

function test(fn) {
  fn();
}
// 这里是在node环境
test(obj.getName);
```

接着看看绑定函数

```js
var o1 = {
  name: "o1"
};

var o2 = {
  name: "o2"
};

function getName() {
  console.log(this.name);
}

getName.bind(o1).call(o2);
```

bind 绑定后，不在进行this再绑定，所以答案为 "o1"

再看看箭头函数，不要被定义时this这个知识欺骗了。

```js
var o2 = {
  name: "o2",
  getName: () => console.log(this === window),
  doItRight: function() {
    () => console.log(this === o2);
  }
};
o2.getName(); // true
```

你不应该这样简写，而是应该使用对象方法属性方式简写

```js
var o2 = {
  name: "o2",
  getName() {
     console.log(this === o2)
  }
};
```
