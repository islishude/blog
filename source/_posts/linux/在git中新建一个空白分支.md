---
title: 在git中新建一个空白分支
categories:
  - Linux
date: 2018-05-19 22:55:35
tags:
  - git
---

当我们有一个有一个完全重构的新版本要开始的时候，比如第一版本用的 Angular，第二版选择 React，我们需要在我们的项目工程新建一个完全空白的分支，也就是说新分支完全没有任何 commit 记录，但是会保留所有文件。

以我的一个 gulp-stater 项目为例，现在只有一个 master 分支，也有很多提交，现在我们需要新建一个空白分支。

![image](https://user-images.githubusercontent.com/24730006/28444190-f3c74c22-6ded-11e7-9b5c-8f1967e74373.png)

现在我们只要运行`git checkout --orphan new-branch-name`就可以了。

![image](https://user-images.githubusercontent.com/24730006/28444218-31a69606-6dee-11e7-9c82-ee7df84388a3.png)

我们可以按照提示使用  `git rm --cached <file>`  把不需要的文件删除，这里的 `file` 可以用 `*` 代替全部文件。当然我们也可以使用 `git rm -rf .`代替。

注意：这里的所有文件都是 `.gitignore` 未忽略的，也就是有过提交记录的，只不过现在在缓存区。
