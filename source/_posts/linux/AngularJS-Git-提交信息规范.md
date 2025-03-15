---
title: AngularJS Git 提交信息规范
categories:
  - Linux
date: 2018-06-01 09:13:02
tags:
---

# 目标
- 允许通过脚本自动生成变更日志
- 允许通过命令过滤某些提交信息（例如不重要的格式变动信息）
- 提供更多的历史记录信息

## 快速生成变更日志
我们在变更日志中使用这三个部分：新特性、问题修复（bug fix）、不兼容变更（breaking change）。  

这些列表可以在发布更新的时候通过脚本生成，并链接到相关的提交记录。  

当然你可以在发布之前编辑变更日志，不过这种方式能帮助我们生成整体架构。

**列出所有从上一次发布的提交信息的第一行**：  
`>> git log <last tag> HEAD --pretty=format:%s`

**列出本次发布的新功能**：  
`>> git log <last release> HEAD --grep feature`

## 过滤不重要的提交信息

这些不重要的信息指的是格式上改变（增加或删除多余的行以及缩进），缺少分号、注释。所以当你在找一些变更的时候可以忽略这些。

你可以使用这个命令：  
`>> git bisect skip $(git rev-list --grep irrelevant <good place> HEAD)`

## 提供更多的历史信息

看看这些提交信息，一部分来自最近 Angular 的提交，这样的提交信息会增加一种环境信息。

- Fix small typo in docs widget (tutorial instructions)
- Fix test for scenario.Application - should remove old iframe
- docs - various doc fixes
- docs - stripping extra new lines
- Replaced double line break with single when text is fetched from Google
- Added support for properties in documentation

下面这些信息试图详细描述哪里发生了变化，但没有任何规则...

- fix comment stripping
- fixing broken links
- Bit of refactoring
- Check whether links do exist and throw exception
- Fix sitemap include (to work on case sensitive linux)

看到这些你能猜出这里面到底有些变化吗？它们都缺少了“特定位置规范”（place specification）...所以使用下面这些词语：docs,docs-parser,compiler,scenario-runner,...

我知道你能通过查看哪些文件变更来找寻这些信息，但是效率不高。通过使用这些规范来查看 git 的历史提交信息能看到我们所有描述的改动地方。

# 格式化提交信息

```
    <type>(<scope>): <subject>
    <空一行>
    <body>
    <空一行>
    <footer>
```

## Revert
如果你使用`revert`命令，信息头必须以`revert:`开始，接着在主体信息（body）中必须声明：`This reverts commit <hash>.`,这里的hash是被 revert 的 commit hash。

## Header
信息头（Message Header）是一行简洁的变更描述，包括 `<type>`， 可选 `<scope>` 以及一个 `<subject>`

### type

可以使用下面的类型：

- feat​ (新功能)
- fix​ (问题修复)
- docs​ (文档)
- style​ (格式)
- refactor（重构）
- test​ (增加测试)
- chore​ (一些变动)

### scope

Scope 可以是任何一个具体的变更信息的位置，比如说 $location​,$browser​, $compile​, $rootScope​, ngHref​, ngClick​, ngView​,等等。

你可以使用 * 来描述不太合适的 scope.

### subject

这里只要很简洁的描述就可以，不要超过50字。

- 使用第一人称现在时
- 第一个字母小写
- 结尾不加句号

## Body

- 使用第一人称现在时
- 包括变动的原因和与之前的对比

1. http://365git.tumblr.com/post/3308646748/writing-git-commit-messages
2. http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html

## Footer

### 不兼容改动

所有不兼容变更需要放在 footer 上，并且以 `BREAKING CHANGE`开始，后面是对变更的描述以及理由和迁移方法。

```
BREAKING CHANGE: isolate scope bindings definition has changed and
    the inject option for the directive controller injection was removed.
    To migrate the code follow the example below:

    Before:

    scope: {
        myAttr: 'attribute',
        myBind: 'bind',
        myExpression: 'expression',
        myEval: 'evaluate',
        myAccessor: 'accessor'
    }

    After:

    scope: {
        myAttr: '@',
        myBind: '@',
        myExpression: '&',
        // myEval - usually not useful, but in cases where the expression is assignable, you can
        use '='
        myAccessor: '=' // in directive's template change myAccessor() to myAccessor
    }

    The removed `inject` wasn't generaly useful for directives so there should be no code
    using it.
```

### 关联issues
关闭 issues 必须在 footer 区域的分开的一行，以“Closes”关键词开头：

```
Close #234
```

当然也可以关闭多个：

```
Close #123, #245, #992
```


# 示例

---

feat($browser): onUrlChange event (popstate/hashchange/polling)
Added new event to $browser:
- forward popstate event if available
- forward hashchange event if popstate not available
- do polling when neither popstate nor hashchange available
Breaks $browser.onHashChange, which was removed (use onUrlChange instead)

---

fix($compile): couple of unit tests for IE9

Older IEs serialize html uppercased, but IE9 does not...
Would be better to expect case insensitive, unfortunately jasmine does
not allow to user regexps for throw expectations.

Closes #392
Breaks foo.bar api, foo.baz should be used instead

---
feat(directive): ng:disabled, ng:checked, ng:multiple, ng:readonly, ng:selected

New directives for proper binding these attributes in older browsers (IE).
Added coresponding description, live examples and e2e tests.

Closes #351

---

docs(guide): updated fixed docs from Google Docs

Couple of typos fixed:
- indentation
- batchLogbatchLog -> batchLog
- start periodic checking
- missing brace

---

feat($compile): simplify isolate scope bindings

Changed the isolate scope binding options to:
- @attr - attribute binding (including interpolation)
- =model - by-directional model binding
- &expr - expression execution binding

This change simplifies the terminology as well as
number of choices available to the developer. It
also supports local name aliasing from the parent.

BREAKING CHANGE:​ isolate scope bindings definition has changed and
the inject option for the directive controller injection was removed.
To migrate the code follow the example below:
Before:

scope: {
    myAttr: 'attribute',
    myBind: 'bind',
    myExpression: 'expression',
    myEval: 'evaluate',
    myAccessor: 'accessor'
}

After:

scope: {
    myAttr: '@',
    myBind: '@',
    myExpression: '&',
    // myEval - usually not useful, but in cases where the expression is assignable, you can use '='
    myAccessor: '=' // in directive's template change myAccessor() to myAccessor
}

The removed `inject` wasn't generaly useful for directives so there should be no code using it.

Refs:
- [阮一峰：Commit message 和 Change log 编写指南](http://www.ruanyifeng.com/blog/2016/01/commit_message_change_log.html)
- [AngularJS Git Message Conventions](https://docs.google.com/document/export?format=pdf&id=1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y&token=AC4w5VgLbPxZqQd4dFdhThmCmj6QNRkjrw%3A1498265895216)
