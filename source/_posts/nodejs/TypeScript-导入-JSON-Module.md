---
title: "TypeScript 导入 JSON Module"
date: 2018-05-19 21:15:26
tags: 
  - node.js 
  - TypeScript
categories: 
  - Node.js
---

这是我在知乎问题 [Typescript有什么冷门但是很好用的特性?](https://www.zhihu.com/question/276172039/answer/393798011) 的回答。

Node.js 模块是允许直接导入 JSON 文件的，但是 ES Module 现在还不支持，TS 在 2.9 （18年5月17日还未发布）之前也不支持。日常中使用 JSON 最多的场景就是 配置文件了，如果要使用的话需要使用下面一些 trick 来支持。

这里有个 JSON 文件

```json
{
  "//": "student.json",
  "name": "test",
  "age": 23
}
```

如果需要导入的话，需要先定义类型。

```typescript
// student.d.ts
declare module "*student.json" {
  export interface IStudent {
    name: string;
    age: number;
  }
  export const student: IStudent
}
```

这里使用 `*student.json` 是因为导入的时候有路径符号，这里要用 `*` 匹配。

最后在 tsconfig.json 文件中包含这些类型定义文件。

```json
{
  "//": "tsconfig.json",
  "include": ["src/**/*", "./myTypes/*.d.ts"],
  "exclude": ["node_modules"]
}
```

现在我们就可以直接在文件中引入了，TS 会智能的提示类型。

```typescript
import { log } from "console";
// 路径为 `./student.json` 
// 所以上面声明模块时用了通配符 `declare module "*student.json"`
import { student } from "./student.json";

log(student.age);
log(student.name);
```

[TypeScript 2.9](https://github.com/Microsoft/TypeScript/wiki/Roadmap#29-may-2018) 即将发布，到时候就可以直接使用 JsonModule 了。