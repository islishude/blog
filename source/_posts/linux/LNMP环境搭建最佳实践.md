---
title: LNMP环境搭建最佳实践
categories:
  - Linux
date: 2019-01-30 10:53:30
tags:
---

# laravel+LNMP配置最佳实践
## 更新软件源  
`sudo apt-get update`

## 解决语言问题冲突  
```shell
sudo apt-get install -y language-pack-en-base
locale-gen en_US.UTF-8  
export LANG=en_US.UTF-8 
export LC_ALL=en_US.UTF-8 
```
## 安装所有依赖
`sudo apt install git vim php7.1-mysql php7.1-fpm php7.1-curl php7.1-xml php7.1-mcrypt php7.1-json php7.1-gd php7.1-mbstring php7.1-curl php7.1-zip php mysql-server nginx -y`

安装PHP7.1需要PPA第三方源支持，具体参考[这篇文章](https://github.com/isLishude/blog/blob/master/PHP/install-php7.1.md)
## 安装Git和Vim  
`sudo apt-get install git vim -y`

## 安装 php7  
`sudo apt-get install php -y`  

**查看php版本：**`php -v`

## 安装 php7-lib  
`sudo apt-get install php7.1-mysql php7.1-fpm php7.1-curl php7.1-xml php7.1-mcrypt php7.1-json php7.1-gd php7.1-mbstring php7.1-curl php7.1-zip -y`

**注意：** php-zip 包，composer特别需要！

## 安装 mysql  
`sudo apt-get install mysql-server -y`  
**查看mysql版本：**`mysql --verison`

## 新建数据库  
`create database dbname default charset utf8mb4 collate utf8mb4_unicode_ci`

## 更新数据库
```shell
sudo mysql_upgrade -u root -p
service mysql restart
```

## 安装 Nginx  
`sudo apt-get install nginx -y  `  
**查看nginx版本：**`nginx -v`

## 配置 PHP  
**php-fpm配置**  

打开并编辑：` /etc/php/7.1/fpm/pool.d/www.conf`
```conf
listen.own = <nginx.user>
listen.group = <nginx.group>
listen = /var/run/php/php7.1-fpm.sock`
```

**URL安全配置**  

打开并编辑： ` /etc/php/7.1/fpm/php.ini`   

```conf
/cgi.fix_pathinfo = 0
```  

## 配置 Nginx

打开并编辑：` /etc/nginx/sites-available/default`  

```conf
server {
        listen 80 default_server;
        listen [::]:80 default_server ipv6only=on;

        root YOUR-PROJECT-DIR/public;
        index index.html index.php index.htm;

        server_name YOUR DOMAIN OR IP;

        location / {
                try_files $uri $uri/ /index.php?$query_string;
       }

       location ~ \.php$ {
                try_files $uri /index.php =404;
                fastcgi_split_path_info ^(.+\.php)(/.+)$;
                fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
                fastcgi_index index.php;
                fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
                include fastcgi_params;
       }
}
``` 

## 配置gzip  

打开并编辑：`/etc/nginx/nginx.conf`   

```
gzip on;
gzip_disable "msie6";
gzip_vary on;
gzip_proxied any;
gzip_comp_level 5;
gzip_min_length 256;
gzip_buffers 16 8k;
gzip_http_version 1.1;
gzip_types text/plain text/css application/json application/x-javascript
text/xml application/xml application/xml+rss text/javascript;
```

同样的，在此文件最上面编辑 user

```
user user group
```

建议就使用当前用户
## 重启服务

```shell
sudo service nginx restart
sudo service php7.1-fpm restart
```

## Composer

### 安装

```shell
sudo wget https://dl.laravel-china.org/composer.phar -O /usr/local/bin/composer
sudo chmod a+x /usr/local/bin/composer
```

**注意**：因为Composer不推荐使用root用户进行安装依赖（安全问题），所以最好把网站目录放在当前用户目录之下。

### 国内Composer镜像
```shell
composer config -g repo.packagist composer https://packagist.laravel-china.org
```

## 为文件目录赋权

为访问网站用户赋权，如果nginx设置的就是当前用户就不需要这一步。  

`sudo chown -R <nginx-user:nginx-group>  YOUR-PROJECT-DIR `


为storage赋予写权限，但这一步，我建议在开发环境就设置并提交到git中

 `sudo chmod -R 775 YOUR-PROJECT/storage ` 

所以这两步骤都可以省略！最好都省略掉，如果不省略掉就会很麻烦的 git pull 之后还得更新文件权限和所属关系。

更多内容可以参见我的 nginx 分类中文章。