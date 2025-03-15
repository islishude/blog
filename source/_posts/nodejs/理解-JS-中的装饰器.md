---
title: 理解 JS 中的装饰器
categories:
  - Node.js
date: 2018-05-22 07:28:51
tags:
---

**本文为 JS 装饰器旧版，待更新**

---

什么是装饰器？曾经看过一个说明比较好的比喻，秋天的时候穿秋裤可以保暖，一旦变冷了我们再穿上毛裤，穿毛裤不影响我们穿秋裤，这里的毛裤就是装饰器。

在JS中，装饰器可以为对象属性添加添加新的配置，而不会影响原有对象的基本功能，这个其实是语法糖。

举个简单的例子就是

```js
function readonly(target, key, descriptor) {
  descriptor.writable = false
  return descriptor
}
class Animal {
  @readonly
  eat (food) {
    return 'eating ' + food
  }
}
```

这里的装饰器函数接受三个参数，分别是目标对象、属性名以及属性描述对象。

你可能会发现，其实用ES5 的  `Object.defineProperty` 也可以实现这个功能。

```js
Object.defineProperty(Animal.prototype, 'eat', {
  value: function (food) { return return 'eating ' + food },
  enumerable: false,
  configurable: true,
  writable: true
})
```

就这么简单，就只是语法糖而已。

当然也可以装饰器也可以作用在类上，简单理解就是为类对象添加静态属性。

```js
function notMan(target) {
  target.isMan = false;
}
@notMan
class Animal {}
console.log(Animal.isMan); //false
```

就这么简单。更进一步，我们知道在 Angular2+ 中的用到了装饰器，还传递了参数。

```js
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
}
```

这个其实也简单，就是工厂函数而已，用上面的例子

```js
function Man(arg) {
  return function(target) {
    target.isMan = arg;
  };
}

@Man(false)
class Animal {}
console.log(Animal.isMan); //false
```
