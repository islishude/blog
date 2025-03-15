---
title: 初始化 Ubuntu Server 清单
categories:
  - Linux
date: 2019-01-30 10:54:11
tags:
---

# 说明  
学习Linux最好的方式就是使用发行版的操作系统，Ubuntu是我第一个接触的系统，当然也是广泛被推荐给新手学习的第一个操作系统。  

# 下载安装
百度搜索下载即可，windows下我们需要先安装虚拟机，我用的VMware 12，这个挺好用的，中文界面，功能强大，不过不好的地方就是需要花钱。不过有些事情你懂的。Ubuntu一般都是下载图形界面的桌面版本，其实我感觉学习Linux要有feel的话，当然还是要用全字符界面的Server服务器版本咯。下载安装比较简单，不提。   

我们安装好了虚拟机，其实在虚拟机中操作不太好，我们最好在桌面上下载一个可以ssh软件来连接虚拟机。另外我推荐大家使用一个xshell软件。  

# 新建环境  
这个也不难，打开vmware，新建一个虚拟机，选择Ubuntu Server的镜像，一步一步的来。基本上我们不用管，需要留意的是，因为vmware简易安装使用的美国的软件源，安装过程中会很慢，这个我们稍等一下就好。  

# 进入系统
## 更新软件源
`sudo apt-get update`  
一般会很慢，因为是用的美国的软件源。等一会，然后我们安装vim文本编辑器来修改软件源。

## 安装vim  
是的，vmware**简易安装模式**没有文本编辑器，所以我们要手动下载一个文本编辑器。这里推荐安装vim。  

`sudo apt-get install vim`  

同样会很慢，我们稍等一会就好了。  

## 修改源  
```
cd /etc/apt/
sudo vim source.list  
```
我们把所有的us换成cn就好了。  

如果不用vim修改源的话，可以使用sed命令。

`sudo sed -i 's/us/cn/g' /etc/apt/sources.list`

## 安装ssh服务
这里是个大坑，因为我学linux的时候死活在宿主机上用xshell连接不上虚拟机。原因现在看来很简单，就是server没有安装ssh服务，所以我们用xshell连接虚拟机的22端口的时候是被拒绝。

**安装ssh server**
`sudo apt-get install openssh-server `
**启动ssh server**
`sudo /etc/init.d/ssh start`
**确定ssh服务启动**
`ps -e | grep ssh`
**设定服务端口**
`sudo vim /etc/ssh/sshd_config`
`sudo /etc/init.d/ssh restart`

一般情况下不需要检查ssh服务是否启动成功。  

## 用xshell连接虚拟机
在虚拟机中输入 `ifconfig` 找到 `inet ip`，然后再 xshell 连接这个 ip地址 就可以了。
