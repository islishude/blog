---
title: 使用 Docker 安装 gitlab
categories:
  - Linux
date: 2018-05-21 07:48:53
tags:
  - Docker
---

以前在 #8 中留了一个坑，用 Docker 来安装 gitlab-ce，今天正好想起来。

用 Docker 安装因为国内镜像的原因会更快，而且就一条命令就解决了，在官方文档上详细说明了如何使用 docker 安装 gitlab。

首先查看 GitlabCE [Dockerfile](https://hub.docker.com/r/gitlab/gitlab-ce/~/dockerfile/) 里面有端口和数据卷的说明，如下所示。

```Dockerfile
# Expose web & ssh
EXPOSE 443 80 22

# Define data volumes
VOLUME ["/etc/gitlab", "/var/opt/gitlab", "/var/log/gitlab"]
```

另外需要对 gitlab 继续配置，比如说必须要配置的 email 服务。

```conf
external_url '188'
prometheus_monitoring['enable'] = false 
gitlab_rails['smtp_enable'] = true
gitlab_rails['smtp_address'] = "smtp.exmail.qq.com"
gitlab_rails['smtp_port'] = 465 
gitlab_rails['smtp_user_name'] = ""
gitlab_rails['smtp_password'] = ""
gitlab_rails['smtp_authentication'] = "login"
gitlab_rails['smtp_enable_starttls_auto'] = true
gitlab_rails['smtp_tls'] = true
gitlab_rails['gitlab_email_from'] = 'com'
gitlab_rails['smtp_domain'] = "exmail.qq.com"
```
保存为 gitlab.rb 即可。下面就是运行命令。这里需要注意的是我是自建三个 Volume 再运行的，也可以使用主机的空间。

```bash
docker run -d \
    -p 443:443 -p 8080:80 -p 22:22 \
    --name gitlab \
    --restart always \
    -v gitlab-config:/etc/gitlab \
    -v gitlab-logs:/var/log/gitlab \
    -v gitlab-data:/var/opt/gitlab \
    -v $PWD/gitlab.rb:/etc/gitlab/gitlab.rb
    gitlab/gitlab-ce
```

或者使用docker-compose 

```yml
version: "3" 

services:
    gitlab:
        image: gitlab/gitlab-ce
        ports:
            - 80:80
        volumes:
            - gitlab-config:/etc/gitlab
            - gitlab-logs:/var/log/gitlab
            - gitlab-data:/var/opt/gitlab
            - $PWD/gitlab.rb:/etc/gitlab/gitlab.rb
volumes:
    gitlab-config:
    gitlab-logs:
    gitlab-data:
```
有一个坑是，运行之后打开 localhost:8080 并没有显示，而是提示无法访问，这是因为 gitlab 内部正在运行，需要等一会。

我们可以通过 `docker logs gitlab | tail` 查看。

之后就可以啦！打开首页要求输入 admin 的密码，之后登录需要注意默认的邮箱是 `admin@example.com`.

![image](https://user-images.githubusercontent.com/24730006/33828817-8b77684c-dea8-11e7-81fd-8977f4d0025f.png)

## TODO
 - [x] ssh 问题

添加这行到 gitlab.rb ，定义 git ssh 端口，同时在服务器开启这个端口的访问权限。

```
# git ssh config
gitlab_rails['gitlab_shell_ssh_port'] = 2222
```