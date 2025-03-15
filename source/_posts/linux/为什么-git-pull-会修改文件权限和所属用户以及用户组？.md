---
title: 为什么 git pull 会修改文件权限和所属用户以及用户组？
categories:
  - Node.js
date: 2018-05-19 22:27:15
tags:
  - git
---

## 问题过程

首先 git clone 之后进行改变用户组

![image](https://user-images.githubusercontent.com/24730006/33516807-dae0910c-d7b3-11e7-8282-d314db8eddc6.png)

然后使用 git pull 更新本地仓库，这里明显发现已经发生了变化。

注意：git pull = git fetch + git merge 下面会更多用 git merge 说明。

![image](https://user-images.githubusercontent.com/24730006/33516827-2fa1bd56-d7b4-11e7-98cc-d18faf0e39ca.png)

当然如果修改了权限，git pull 之后也会变成默认权限（根据 umask 值确定）

注意：当 `git config core.filemode true` 的时候，git 只记录文件是否可执行权限。比如说下方的 3.js 用户和用户组可读可写，但都没有执行权限，一旦设置执行权限就会触发 git 修改追踪，不设置则不需要追踪修改记录。一般我会把 `core.filemode` 设置为 false，这样就不会存在设置权限后还要 commit 的问题。

```bash
-rw-rw-r-- 1 x x 0 Dec 12 21:15 3.js
```

当然也不建议这么做，可以看看后面的最佳实践。

## 为什么会更改

新建一个文件那么用户和用户组就是当前的用户以及所在的用户组。但是如果另一个用户修改文件内容是不会修改文件用户所属的。

那么这里我就猜测 git merge 的时候可能就是新建而不是修改。

这里只要修改内容后再更改用户组，再使用 git merge 的时候如果文件新建的时间变成了最新的时间就是说明是新建而不是修改。

ubuntu 有一个 `sudo debugfs -R filename mountdev` 的命令可以查看文件新建时间，但是我用了不可以。。不过我用 mac 的时候发现 mac 内的文件是可以查看文件新建时间的。

```
➜  test git init
Initialized empty Git repository in /Users/lishude/Downloads/test/.git/
➜  test git:(master) touch test.txt
➜  test git:(master) ✗ git add .
➜  test git:(master) ✗ git commit -m"1"
[master (root-commit) c5fa95c] 1
 1 file changed, 1 insertion(+)
 create mode 100644 test.txt
➜  test git:(master) stat test.txt
16777220 1894632 -rw-r--r-- 1 lishude staff 0 2 "Dec 17 18:07:10 2017" "Dec 17 18:06:55 2017" "Dec 17 18:06:55 2017" "Dec 17 18:06:44 2017" 4194304 8 0 test.txt
```

这里我新建一个git仓库并且commit了一条。

注意，mac 的 `stat file` 和 ubuntu 下的还不同，这里是有创建时间的，就是最后一个时间，不过格式就比 ubuntu 差了许多。

然后我们再次 commit 然后修改用户组，最后 reset 查看文件信息。

```
➜  test git:(master) git commit -am"2"
[master 773907e] 2
 1 file changed, 1 insertion(+)
➜  test git:(master) stat test.txt
16777220 1894632 -rw-r--r-- 1 lishude staff 0 4 "Dec 17 18:07:48 2017" "Dec 17 18:07:38 2017" "Dec 17 18:07:38 2017" "Dec 17 18:06:44 2017" 4194304 8 0 test.txt
➜  test git:(master) sudo chown root test.txt
➜  test git:(master) ll
total 8
-rw-r--r--  1 root  staff     4B 12 17 18:07 test.txt
➜  test git:(master) git reset --hard HEAD~1
HEAD is now at c5fa95c 1
➜  test git:(master) stat test.txt
16777220 1894740 -rw-r--r-- 1 lishude staff 0 2 "Dec 17 18:09:18 2017" "Dec 17 18:09:15 2017" "Dec 17 18:09:15 2017" "Dec 17 18:09:15 2017" 4194304 8 0 test.txt
```

通过实验确实是这样的，文件新建时间已经变成最新的了。

## 解决方案

### 使用特定用户执行

比如说使用文件需要保留 www-data 权限就需要用这个

`sudo -u www-data git pull origin master`

但是需要注意的这个会修改所有需要更改的所有与当前版本库不同内容的文件的用户和用户组，并且同时也会会更改 `.git` 文件夹。

### git hook

下面在 post 或者 merge 之后会触发钩子命令，也就是自动执行一些操作，这里我们就可以直接为文件更改权限或者修改用户和用户组。

```bash
#!/bin/sh
#
# .git/hooks/post-merge

sudo chmod -R 775 target
sudo chown -R user:group target
```

这里说阻止其实没有办法阻止，总结一句话就是，git 不记录用户关系和除了执行权限的权限，所有的操作取决于执行git操作的用户。

### 最佳实践

一般在生产环境最好不要更改文件的用户组或者权限。

比如说 nginx 还有 php-fpm 等就直接使用当前用户（当然一般都是所属 root 和 sudos 用户组的），修改这些设置就不需要再更改用户。在 #1 有 nginx 和 php-fpm 的实践。

那么设置文件权限呢？也是一样，不要直接在生产环境设置，而是再本地设置好（当 `git config core.filemode true` 时候 git 会跟踪文件权限）再上传到生产环境。

## 补充 git 指令

git 位于 `usr/bin/git` ，文件所属 root 以及 root 组，权限为755，所以所有的用户都可以执行。

使用 git 进行 git pull 或者 git merge 的时候会以当前用户更改 `.git` 文件夹的用户和用户组，谨慎使用不同用户，最好按照最佳实践来做。

在 #5 有用户与用户组的详细说明。 
