---
title: 安装使用Gitlab进行内部代码管理
categories:
  - tool
date: 2019-01-30 10:34:31
tags:
---

在[这里](https://about.gitlab.com/downloads/)选择你的系统，按照提示安装。  

下面以Ubuntu 16.04 LTS版本为例，以后会补充使用docker来管理 gitlab。

## 安装依赖包
`sudo apt-get install curl openssh-server ca-certificates postfix`

## 添加gitlab源
curl -sS https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.deb.sh | sudo bash

**网络不好的选项**  

在 [这里](https://packages.gitlab.com/gitlab/gitlab-ce) 找到你的版本号并替换下面 url  
`sudo curl -LJO <url>`  
`sudo dpkg -i gitlab-ce-XXX.deb`

## 更新源以及安装
`sudo apt-get update && sudo apt-get install gitlab-ce -y`

## 配置 /etc/gitlab/gitlab.rb
`sudo vim /etc/gitlab/gitlab.rb`

## 配置访问接口
external_url = 'http://git.example.com'

## 配置邮件服务

```
gitlab_rails['smtp_enable'] = true  
gitlab_rails['smtp_address'] = ""   
gitlab_rails['smtp_port'] = 25  
gitlab_rails['smtp_user_name'] = ""  
gitlab_rails['smtp_password'] = ""  
gitlab_rails['smtp_domain'] = ""  
gitlab_rails['smtp_authentication'] = "login"  
gitlab_rails['smtp_enable_starttls_auto'] = false  
gitlab_rails['smtp_tls'] = false  
```

**注意：**  

```
smtp_address和smtp_domain的设置，以阿里云企业邮箱为例  
gitlab_rails['smtp_address'] = "smtp.mxhichina.com"   
gitlab_rails['smtp_domain'] = "mxhichina.com"  
```

## 关闭 prometheus
个人经验：如果不关闭的话，会一直报错。
prometheus_monitoring['enable'] = false

## 重启GitLab
`sudo gitlab-ctl reconfigure && sudo gitlab-ctl restart `

## 一些推荐设置  
首次进入设置管理员密码，设置 `your-domain/admin/application_settings`

1. 建议关闭 Gravatar 头像功能  
在 Account and Limit Settings 关闭 Gravatar enabled，国内访问不友好。

2. 关闭注册功能  
在 Sign-in Restrictions 关闭 Sign-in enabled，如果是内部使用建议关闭，然后管理员工分配注册。

## 升级Gitlab
在管理后台位置 overview 界面如果红色提示需要升级，那么尽快升级到最新版本。
1. 关闭 gitlab  
`sudo gitlab-ctl stop`
2. 升级 gitlab  
`sudo apt-get install gitlab -y`

## 修改为国内镜像

详情： https://mirror.tuna.tsinghua.edu.cn/help/gitlab-ce/

```bash
vim /etc/apt/sources.list.d/gitlab_gitlab-ce.list
## 添加
deb https://mirrors.tuna.tsinghua.edu.cn/gitlab-ce/ubuntu xenial main
deb-src https://mirrors.tuna.tsinghua.edu.cn/gitlab-ce/ubuntu xenial main
```


## 使用 Docker

配置 docker-compose

```yml
version: "3" 

services:
    gitlab:
        image: gitlab/gitlab-ce
        ports:
            - "80:80"
            - "443:443"
            - "2222:2222"
        volumes:
            - gitlab-config:/etc/gitlab
            - gitlab-logs:/var/log/gitlab
            - gitlab-data:/var/opt/gitlab
            - $PWD/gitlab.rb:/etc/gitlab/gitlab.rb
            - $PWD/ssh_config:/etc/ssh/ssh_config
            - $PWD/sshd_config:/assets/sshd_config
            - $PWD/ssl:/etc/gitlab/ssl
volumes:
    gitlab-config:
    gitlab-logs:
    gitlab-data:
```

这里我们使用了 HTTPS，需要配置一下：

创建 ssl 目录，并导入证书和私钥。这里以 example.crt 和 example.key 为例

```rb
# 设置 ssh 端口为 2222
gitlab_rails['gitlab_shell_ssh_port'] = 2222

# nginx config
nginx['redirect_http_to_https'] = true
nginx['ssl_certificate'] = "/etc/gitlab/ssl/example.crt"
nginx['ssl_certificate_key'] = "/etc/gitlab/ssl/example.key"
```

增加 ssh_config 文件

```
Host *
# 设置 ssh 端口为 2222
Port 2222
SendEnv LANG LC_*
HashKnownHosts yes
GSSAPIAuthentication yes
GSSAPIDelegateCredentials no
```

增加 sshd 文件

```
# 设置 ssh 端口为 2222
Port 2222
ChallengeResponseAuthentication no
HostKey /etc/gitlab/ssh_host_rsa_key
HostKey /etc/gitlab/ssh_host_ecdsa_key
HostKey /etc/gitlab/ssh_host_ed25519_key
Protocol 2
PermitRootLogin no
PasswordAuthentication no
MaxStartups 100:30:200
AllowUsers git
PrintMotd no
PrintLastLog no
PubkeyAuthentication yes
AuthorizedKeysFile %h/.ssh/authorized_keys /gitlab-data/ssh/authorized_keys

UsePAM yes
UseDNS no
```
