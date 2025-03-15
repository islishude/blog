---
title: VSCode代码风格自动校验和格式化清单
categories:
  - tool
date: 2018-05-19 22:44:40
tags:
---

vscode 提供了很多优秀的插件，对于代码风格校验和代码格式化，我最常用的是 eslint 和 prettier，eslint 自不必说，第二个是代码格式化插件，不仅可以对 js html css 格式化，还可以对 sass 以及 json 等进行格式化。

当然格式化的标准编辑器不太同意，比如函数表达式中函数名后面带空格与否，prettier 默认的是不带空格，不过团队中常用的是 JS Standard 是有空格的，更别提字符串用双引号还是单引号，表达式后面跟不跟分号这样的风格差异的问题了。

不过还好的是 eslint 和 prettier 二者可以结合自动对代码进行格式化。

首先，在 vscode 市场安装 eslint 和 prettier 两个插件。

然后我们需要在项目中再安装 eslint 的包。

```cmd
yarn add eslint --dev
npm i -D eslint
```

eslint 提示的是也可以全局安装，~~但是我全局安装之后并没有作用~~，必须使用 npm 而不是 yarn 安装才可以。我觉得为了团队其他人的更简单使用，建议还是在 package.json 中安装 eslint。

打开 vscode 的设置，mac下是 code -> 首选项 -> 设置，windows下是 文件 -> 首选项 -> 设置，在搜索设置中更改下列配置。

```json
{  
  "eslint.validate": [
    "javascript",
    "javascriptreact"
  ],
  "editor.formatOnSave": true,
  "prettier.eslintIntegration": true,
  "eslint.autoFixOnSave": true,
}
```

对 JS 进行检查，我们需要对添加 eslint 设置，首先添加 `.eslintrc.js` ，这里添加 `standard` 风格，更多可以在 eslint 网站查看。这里我们使用命令行自动生成，运行`eslint --init`，然后选择 `Use a popular style guide` 按照提示操作，如下可做参考。

```text
? How would you like to configure ESLint? Use a popular style guide
? Which style guide do you want to follow? Standard
? What format do you want your config file to be in? JavaScript
Checking peerDependencies of eslint-config-standard@latest
Installing eslint-config-standard@latest, eslint-plugin-import@>=2.2.0, eslint-plugin-node@>=4.2.2, eslint-plugin-promise@>=3.5.0, eslint-plugin-standard@>=3.0.0
npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN eslint-config-standard@10.2.1 requires a peer of eslint@>=3.19.0 but none is installed. You must install peer dependencies yourself.
npm WARN eslint-plugin-standard@3.0.1 requires a peer of eslint@>=3.19.0 but none is installed. You must install peer dependencies yourself.
npm WARN eslint-plugin-node@5.2.1 requires a peer of eslint@>=3.1.0 but none is installed. You must install peer dependencies yourself.
npm WARN eslint-plugin-import@2.8.0 requires a peer of eslint@2.x - 4.x but none is installed. You must install peer dependencies yourself.

+ eslint-config-standard@10.2.1
+ eslint-plugin-standard@3.0.1
+ eslint-plugin-promise@3.6.0
+ eslint-plugin-node@5.2.1
+ eslint-plugin-import@2.8.0
added 53 packages in 9.873s
Successfully created .eslintrc.js file in C:\Users\Lishude\Desktop\project\express
```

这样我们在项目中只要 `Ctrl+s` 就可以自动格式了。
