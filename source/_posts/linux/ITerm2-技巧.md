---
title: ITerm2 技巧
categories:
  - Linux
date: 2018-07-31 17:49:06
tags:
  - iterm
---

## ITerm2 设置 option 键为 Alt 键

![image](https://user-images.githubusercontent.com/24730006/42486337-35fc69ea-842e-11e8-8039-ffb614fd6678.png)

## 保持 SSH 连接不自动断开

使用 ITerm2 经常遇到 SSH 服务自动休眠断开，提示下面的信息。

```
packet_write_wait: Connection to x.x.x.x port 22: Broken pipe
```

修改自动断开可以修改配置配置即可。

![image](https://user-images.githubusercontent.com/24730006/42429023-75787494-8369-11e8-914a-65ac0a2a2c2c.png)

这里的发送一个 ASCII 码，可以使用 127，也就是发送一个 del 删除键，这样不会影响当前命令行。
