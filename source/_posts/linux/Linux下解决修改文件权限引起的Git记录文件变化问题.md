---
title: Linux下解决修改文件权限引起的Git记录文件变化问题
categories:
  - Linux
date: 2019-01-30 11:05:48
tags:
---

git默认会跟踪web文件夹的权限修改，当我们使用`chmod`指令的时候，git也会把被修改权限的文件添加到被修改的状态。

因为 laravel 部署在生产环境中的时候，需要对 storage 目录进行赋权，不过正是因为如此，当我们运行 `git status` 的时候会莫名的把 storage 目录所有的 .gitignore 文件添加到 git 缓存区。

![image](https://user-images.githubusercontent.com/24730006/28301596-7023ae0e-6bba-11e7-89b5-1e8c4149a3d8.png)


首先在项目下 `cat .git/config` 查看是否已经设置忽略文件权限，`filemode=true` 的时候即跟踪修改权限的文件 。

![image](https://user-images.githubusercontent.com/24730006/28301559-2bbdb82c-6bba-11e7-8bad-03ce3aea2652.png)

这时候我们只要简单的运行`git config core.filemode false`就可以了，然后我们运行`git status`那些被修改权限的文件已经不存在了。
