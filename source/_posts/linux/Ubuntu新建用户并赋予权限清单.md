---
title: Ubuntu新建用户并赋予权限清单
categories:
  - Linux
date: 2018-05-19 22:43:02
tags:
  - ubuntu
---

通常新建用户会遇到很多问题，比如 shell 不支持 tab 提示，下述流程解决了常见新建用户出现的问题。

## 新建用户

首先在建立一个用户家目录，一般建立在 `/home` 下，目录名一般直接使用用户名。接着使用 `useradd` 命令继续，命令结构如下。

`useradd -d HOME-DIR -s /bin/bash -c COMMET -G GOURP-NAME USER-NAME`

`-d` 指示用户家目录，使用刚才新建的目录即可。`-c` 指定注释。

`-s` 指定 shell，默认是不指定的，一定要加上，要不然就会出现上述说的问题。

 `-G` 指定用户组，之后也可以使用 `usermod -aG GROUP-NAME USER-NAME` 进行添加。

最后再加上用户名称即可。

值得注意的是 `-p` 可以指定登录密码，但是我尝试过没有成功。还有一个方式指定密码，使用 `passwd USER-NAME` 即可。

详细的参数在文后有说明。然后给用户家目录赋权

```
sudo chown -R user:group /home/user
sudo chmod -R 770 /home/user
```

最后复制shell模板到家目录

`sudo /etc/skel/.bashrc /home/user`

## root 权限

编辑 `/etc/sudoers` 

```conf
# User privilege specification
root	ALL=(ALL:ALL) ALL
user  ALL=(ALL:ALL) ALL
```

之前提及过 usermod 可以把用户添加到用户组，在 `/etc/sudoers` 后有说明将用户添加 `sudo` 组就可以使用 `sudo` 命令获取管理权限，在 CentOS上通常是 wheel 组而不是 sudo 组。

```conf
# Allow members of group sudo to execute any command
%sudo	ALL=(ALL:ALL) ALL
```
第一个“ALL”表示该规则适用于所有主机，第二个表示root用户可以像所有用户一样运行命令，第三个表示root用户可以像所有组一样运行命令，最后一个“ALL”表示这些规则适用于所有命令。详情可参考[这里](https://www.digitalocean.com/community/tutorials/how-to-edit-the-sudoers-file-on-ubuntu-and-centos)。

如果已经在命令中设置将新用户加入 root sudo 用户组的，以上的规则设定也可以不用。

最后退出当前用户，重新使用新用户登录试一试吧！

## 更新

更简单的命令，直接会创建用户家目录以及将 .bashrc 等文件移动到用户家目录。

```
useradd --create-home username 
```

## useradd 命令清单

<img width="649" alt="2018-03-17 5 10 34" src="https://user-images.githubusercontent.com/24730006/37553587-2ea56f52-2a06-11e8-82d7-d638abbfe5c9.png">
