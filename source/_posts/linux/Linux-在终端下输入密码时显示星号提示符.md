---
title: '[Linux]在终端下输入密码时显示星号提示符'
categories:
  - Linux
date: 2019-01-30 11:40:23
tags:
---

在使用 sudo 命令的时候会要求我们输入密码，但是这个密码并没有任何反馈，比如下面这个例子。

>~$ sudo apt update
[sudo] password for root:

下面简单修改 `sudo` 的配置文件就可以类似在浏览器表单中输入密码一样显示 `****` 的字样。

```bash
# backup 
sudo cp /etc/sudoers /etc/sudoers.bak
# edit 
sudo visudo
# find ` Default env_reset` 
Default env_reset,pwfeedback
# save
:wq
```

大功告成！