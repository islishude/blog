---
title: 使用certbot免费升级到https
categories:
  - Linux
date: 2019-01-30 11:03:11
tags:
---

# 使用certbot免费升级到https 
环境为 Ubuntu Server 16.04 和 Nginx，具体可参考[官网](https://certbot.eff.org/)，letsencrypt是certbot以前的名称，github的地址也重定向到certbot了。  

>Certbot, previously the Let's Encrypt Client, is EFF's tool to obtain certs from Let's Encrypt, and (optionally) auto-enable HTTPS on your server. It can also act as a client for any other CA that uses the ACME protocol.

## 安装依赖
1. sudo apt-get update 
2. sudo apt-get install python2.7 git -y
3. sudo apt-get install software-properties-common


## 下载certbot
---
1. git clone https://github.com/certbot/certbot.git
2. cd certbot  
---
新方式：
>$ sudo add-apt-repository ppa:certbot/certbot
$ sudo apt-get update
$ sudo apt-get install python-certbot-nginx 





## 不重启获取证书
`./certbot-auto certonly --webroot -w /var/www/your-project-dir -d your-domain.com -d another-domain.com`  

---
新方式：
>$ sudo certbot --nginx
自动配置Nginx和更新证书。

## 配置nginx
```
server{
      listen 80;
      # 如果访问http自动跳转到https
      return 302 https://your-domain.com/
}
server {
       listen 443;
       # 需要多个域名配置的话下面只需要保留一个
       listen [::]:443 ssl ipv6only=on;
       # server name
       server_name your-project-name.com;

       root your-project-dir;
       index index.html index.htm index.php;

       ssl on;
       # 注意下面的地址要正确
       ssl_certificate /etc/letsencrypt/live/your-domain/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/your-domain/privkey.pem;
       ssl_session_timeout 5m;
       ssl_protocols SSLv3 TLSv1 TLSv1.1 TLSv1.2;
       ssl_ciphers "HIGH:!aNULL:!MD5 or HIGH:!aNULL:!MD5:!3DES";
       ssl_prefer_server_ciphers on;
        }
}
```
## 重启 nginx 服务   
`sudo service nginx restart`

## 到期自动更新  
`certbot renew --dry-run`

如果正常工作（1.5版本有bug会报错），可以使用

`certbot renew`

## 待解决问题

```
WARNING: unable to check for updates.
Creating virtual environment...
Traceback (most recent call last):
  File "/usr/lib/python3/dist-packages/virtualenv.py", line 2363, in <module>
    main()
  File "/usr/lib/python3/dist-packages/virtualenv.py", line 719, in main
    symlink=options.symlink)
  File "/usr/lib/python3/dist-packages/virtualenv.py", line 988, in create_environment
    download=download,
  File "/usr/lib/python3/dist-packages/virtualenv.py", line 918, in install_wheel
    call_subprocess(cmd, show_stdout=False, extra_env=env, stdin=SCRIPT)
  File "/usr/lib/python3/dist-packages/virtualenv.py", line 812, in call_subprocess
    % (cmd_desc, proc.returncode))
OSError: Command /root/.local/share/letsencrypt/bin/python2.7 - setuptools pkg_resources pip wheel failed with error code 2
```
有说是pip版本的问题，现在升级到最新版本也无用，正在解决。  (2017年4月6日23:23:36)
临时解决的方式，可以apt安装letscrypt，然后使用`letscrypt certonly -w /your-project-dir -d your-domain.com`安装证书，然后配置证书。
