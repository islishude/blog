---
title: 在 Ubuntu 上安装 Docker
categories:
  - Linux
date: 2018-05-20 07:27:01
tags:
  - Docker
---

建议把Docker安装在linux系统上学习使用，如果使用 Windows 可以使用虚拟机安装 Ubuntu 进行学习。

补充一点，如果在windows上安装，官方推荐使用 windows 10 专业版，因为这个版本才包含Hyper-V的虚拟化服务，能让docker具有像linux一样的底层兼容性，如果没有使用这个版本，官方建议下载docker tool进行安装。当然还是建议Windows用户装linux虚拟机进行学习。

# Docker 版本说明
Docker在apt源仓库里面注册了很多名称，比如docker.io，比如docker-engine，这些都不是我们需要的旧版本，新版的Docker就只有两个，一个是社区版本的docker-ce，一个是收费的企业版docker-ee。  

不过，目前（2017年4月7日 17:01:37），ubuntu官方源还没有新版的docker，所以我们可以按照[官方的说明](https://store.docker.com/editions/community/docker-ce-server-ubuntu)，一步一步来安装docker。

# 使用官方脚本+中国镜像安装

下方命令适用于 Ubuntu 并且软件包源是阿里云的。

```bash
curl -fsSL https://get.docker.com | sudo sh -s -- --mirror Aliyun
```

# 设置当前用户到docker组

如果当前用户不是 docker 组，那么是无法直接运行docker命令的，所以在安装完成之后，建议设置当前用户到docker组中。

`sudo usermod -aG docker $USER`

这样做之后，直接可以运行`docker images`等命令再也不需要root权限了。

# 配置国内镜像加速

使用阿里云 Docker 镜像源

```
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://t9ab0rkd.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

成功之后，运行`docker pull ubuntu`可以试一试速度。

# docker-compose

```
## install
sudo curl -L https://github.com/docker/compose/releases/download/1.23.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

## update
docker-compose migrate-to-labels
## uninstall
sudo rm /usr/local/bin/docker-compose
```

注意：上述命令行安装 1.23.2 版本的，最新版本需要查看 

```
curl -H 'Accept: application/json' -L https://github.com/docker/compose/releases/latest | jq .
```

找到 tag_name 字段

```json
{
  "id": 14244264,
  "tag_name": "1.23.2",
  "update_url": "/docker/compose/releases/tag/1.23.2",
  "update_authenticity_token": "ruuFEJbQZIdnDBjFGghteL2H6UG6BmliYI18SDLOgnO5hlJlRZB2dDs+qOjkHMamP9bp2ymKrr9Ytao0DtEEiQ==",
  "delete_url": "/docker/compose/releases/tag/1.23.2",
  "delete_authenticity_token": "C3JVkok9yjBOrFiNId+amBceStAPLfxm0P1IlXvNLOsdE2gxaZLhR12WsZYYpfMNiZsmHrNmVpf/Z0B2ddUKVw==",
  "edit_url": "/docker/compose/releases/edit/1.23.2"
}
```

# Docker tips

## 权限不足错误

### zsh 错误 

修复方式： 

`sudo chown -R [username]:staff "$ZSH_CACHE_DIR"`

详细：https://github.com/robbyrussell/oh-my-zsh/issues/3700

## unix socket 错误

默认情况下，docker 命令会使用 Unix socket 与 Docker 引擎通讯。而只有 root 用户和 docker 组的用户才可以访问 Docker 引擎的 Unix socket。出于安全考虑，一般 Linux 系统上不会直接使用 root 用户。因此，更好地做法是将需要使用 docker 的用户加入 docker 用户组。

建立 docker 组：

`$ sudo groupadd docker`

将当前用户加入 docker 组：

`$ sudo usermod -aG docker $USER`

退出当前终端并重新登录，进行如下测试。

## 国内使用 apt 速度很慢

通常在 Dockerfile 内会使用 apt 进行安装软件，但是 `apt update` 会因为网络原因很慢很慢，这个时候可以加上镜像源。 

解决方式：

```
RUN sed -i 's/http:\/\/archive\.ubuntu\.com\/ubuntu\//http:\/\/mirrors\.163\.com\/ubuntu\//g' /etc/apt/sources.list
```

## 使用前台命令运行容器

例如在 nginx 的官方版本中有设置 

```Dockerfile
CMD ["nginx", "-g", "daemon off;", ]
```

所以不要在 Dockerfile 中使用 `service xx start` 或者 `systemctl start xx.service`.

对于JS而言，npm run 就是使用的后台命令。比如说在 `npm start` 的命令是 `node index.js` 的话，而 `index.js` 是一个服务器应用，那么在 Docker 中不会成功运行，而且运行之后会自动退出容器。
