---
title: 修改Ubuntu的时区
categories:
  - Linux
date: 2019-01-30 10:52:48
tags:
---

安装了Ubuntu Server之后，默认的英文环境下时区是国外的，所以使用Git等操作的时候，记录的时间会有些错乱，我们可以简单的使用命令行来修改时区。

` sudo dpkg-reconfigure tzdata`

![image](https://cloud.githubusercontent.com/assets/24730006/24046989/5d3ff290-0b5f-11e7-8a7d-7d292f887a81.png)

然后我们依次选择 Asia-China-Beijing就可以了！
