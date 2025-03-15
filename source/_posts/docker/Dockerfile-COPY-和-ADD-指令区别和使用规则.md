---
title: Dockerfile COPY 和 ADD 指令区别和使用规则
categories:
  - docker
date: 2019-06-29 09:44:02
tags:
---

ADD 和 COPY 指令在 Dockerfile 中具有相同的功能，都是将构建上下文的文件复制到镜像中去，具体语法规则如下所示，可以说在大多数情况下，二者仅仅是语义上的区别。

```
ADD [--chown=<user>:<group>] <src>... <dest>
ADD [--chown=<user>:<group>] ["<src>",... "<dest>"]

COPY [--chown=<user>:<group>] <src>... <dest>
COPY [--chown=<user>:<group>] ["<src>",... "<dest>"]
```

其中 src（下称源路径） 和 dest（下称目标路径） 参数可以是目录或者文件，下面使用具体事例来说明具体的规则。

新建一个文件夹，具体包含内容如下所示

```console
$ tree .
.
├── Dockerfile
├── README.md
├── cmd
│   └── main.go
└── main.go

1 directory, 4 files
```

### 源路径和目标路径都是目录

在 Dockerfile 的规则中，如果目标路径最后跟 "/" 符号，那么就代表目录，否则就是文件。如果目标目录不存在，那么会新建这个目录。下面例子使用 alpine 镜像作为示例，运行此镜像并查看其根目录，如下所示并没有一个 "app" 的目录，那么接下的例子中目标路径名称都用 "app" 来表示。

```console
$ docker run -it --rm alpine ls /
bin    etc    lib    mnt    proc   run    srv    tmp    var
dev    home   media  opt    root   sbin   sys    usr
```

修改 Dockerfile，如下所示，使其复制 `cmd` 文件夹到 `app` 中。

```Dockerfile
FROM alpine:latest
COPY cmd app/
CMD ["sh"]
```

那么这里我们进行构建镜像，然后查看镜像中发生了什么，如下所示，使用 `test` 作为镜像名称并构建成功。

```console
$ docker build -t test .
Sending build context to Docker daemon  3.584kB
Step 1/3 : FROM alpine:latest
latest: Pulling from library/alpine
8e402f1a9c57: Already exists
Digest: sha256:c43263c39b952a419a4f6e2152b6c0afc7f765d9e6660e512a34ee14caccce02
Status: Downloaded newer image for alpine:latest
 ---> 5cb3aa00f899
Step 2/3 : COPY cmd app/
 ---> 8ca0d3bbf0a5
Step 3/3 : CMD ["sh"]
 ---> Running in 600926c6e043
Removing intermediate container 600926c6e043
 ---> a03ff8077b4c
Successfully built a03ff8077b4c
Successfully tagged test:latest
```

现在运行并进入容器，如下所示，根目录下多了 "app" 文件夹，并且 "app" 文件夹内只有源文件夹下的 "main.go" 文件，并不包含其所在的文件夹 "cmd"。

```console
$ docker run --rm -it test sh
$ ls
app    bin    dev    etc    home   lib    media  mnt    opt    proc   root   run    sbin   srv    sys    tmp    usr    var
$ ls -al app
total 12
drwxr-xr-x    2 root     root          4096 Mar 27 01:57 .
drwxr-xr-x    1 root     root          4096 Mar 27 01:57 ..
-rw-r--r--    1 root     root           181 Mar 27 01:57 main.go
```

这里是非常重要的规则，源路径如果是目录，那么只复制其内部的文件而不包含自身，另外文件自身的文件系统元数据也将复制过去，比如说文件权限等。

### 源路径是文件夹而目录路径是文件

修改 Dockerfile 为下面内容，只是把目标路径后的 "/" 去掉了。

```patch
FROM alpine:latest
- COPY cmd app/
+ COPY cmd app
CMD ["sh"]
```

结果竟然成功了，和目标路径是文件夹并没有区别。

```console
$ docker run --rm -it test
$ ls
app    bin    dev    etc    home   lib    media  mnt    opt    proc   root   run    sbin   srv    sys    tmp    usr    var
$ ls -al app
total 16
drwxr-xr-x    2 root     root          4096 Mar 27 02:33 .
drwxr-xr-x    1 root     root          4096 Mar 27 02:33 ..
-rw-r--r--    1 root     root           181 Mar 27 01:57 main.go
```

也就是说如果目标路径不包含 "/" ，那么将会把目标路径视作普通文件，然后会将源路径的所有文件写入目标路径。这里目标路径虽然是文件但也被作为目录构建了。虽然上述可以使用，但是不推荐使用，因为这个语义并不明确，而且在多个源文件的情况下会报错。

如下所示，将本文件夹下的 "main.go" 和 "README.md" 复制到镜像的 "app" 下。

```Dockerfile
FROM alpine:latest
COPY main.go README.md app
CMD ["sh"]
```

这里就报错了，提示目录路径不是目录。

```console
$ docker build -t test .
Sending build context to Docker daemon  10.75kB
Step 1/3 : FROM alpine:latest
 ---> 5cb3aa00f899
Step 2/3 : COPY main.go README.md app
When using COPY with more than one source file, the destination must be a directory and end with a /
```

### 源路径是文件而目标路径是目录

修改 Dockerfile 为下面的内容，将上面出错的例子改一下，将目标路径后加上 "/"，使其变成语义上的目录

```patch
FROM alpine:latest
- COPY main.go README.md app
+ COPY main.go README.md app/
CMD ["sh"]
```

这回就成功了，并没有错误了，如下所示：

```console
$ docker run --rm -it test
$ ls
app    bin    dev    etc    home   lib    media  mnt    opt    proc   root   run    sbin   srv    sys    tmp    usr    var
$ ls -al app
total 16
drwxr-xr-x    2 root     root          4096 Mar 27 02:50 .
drwxr-xr-x    1 root     root          4096 Mar 27 02:57 ..
-rw-r--r--    1 root     root           181 Mar 27 01:57 main.go
```

当然也可以使用通配符进行匹配源文件，下面的例子是复制所有的 `go` 文件到目标路径下。

```Dockerfile
FROM alpine:latest
COPY *.go app/
CMD ["sh"]
```

### 源路径和目标路径都是文件

修改 Dockerfile 为下面的内容，使得复制 "main.go" 文件到 "app"，不过再此之前我们修改下权限属性。

```console
$ cat main.go
package main

import (
        "fmt"
)

func main() {
        fmt.Println("Hello,World")
}
$ ls -al main.go
-rw-r--r--  1 lishude  staff  77 Mar 27 11:16 main.go
$ chmod 666 main.go
$ ls -al main.go
-rw-rw-rw-  1 lishude  staff  77 Mar 27 11:16 main.go
```

然后修改 Dockerfile 为下面的内容

```patch
FROM alpine:latest
- COPY main.go README.md app/
+ COPY main.go app
CMD ["sh"]
```

查看内容，如下所示，重命名为了 "app"，按照文档的所说，只是将源路径的文件内容写入了目标路径文件，仍旧保留了其文件元数据。

```console
$ docker run -it --rm test
$ ls
app    bin    dev    etc    home   lib    media  mnt    opt    proc   root   run    sbin   srv    sys    tmp    usr    var
$ ls -al app
-rw-rw-rw-    1 root     root            77 Mar 27 03:16 app
$ cat app
package main

import (
        "fmt"
)

func main() {
        fmt.Println("Hello,World")
}
```

### ADD 指令源路径是网络地址

ADD 指令除了 COPY 指令的简单复制功能外，还支持从网络地址上下载。如下所示，修改 Dockerfile 文件，这里选择文件大小比较小的 vuejs 最新源码打包文件作为源路径。

```Dockerfile
FROM alpine:latest
ADD https://github.com/vuejs/vue/archive/v2.6.10.tar.gz app/
CMD ["sh"]
```

然后进行镜像构建，可以看到 ADD 命令进行了文件下载，注意：这个是 COPY 命令不支持的。

```console
$ docker build -t test .
Sending build context to Docker daemon   12.8kB
Step 1/3 : FROM alpine:latest
 ---> 5cb3aa00f899
Step 2/3 : ADD https://github.com/vuejs/vue/archive/v2.6.10.tar.gz app/
Downloading [==================================================>]  1.576MB/1.576MB
 ---> 5c8b2c2ba33d
Step 3/3 : CMD ["sh"]
 ---> Running in 984e336dc0d8
Removing intermediate container 984e336dc0d8
 ---> 58a7a28bddeb
Successfully built 58a7a28bddeb
Successfully tagged test:latest
```

查看镜像构建的结果，如下所示，默认情况下，下载的文件的权限为 600，如果这不是想要的权限，那么可以再加一层 RUN 指令进行修改。

```console
$ docker run -ti --rm test
$ ls -al app
total 1548
drwxr-xr-x    2 root     root          4096 Mar 27 03:28 .
drwxr-xr-x    1 root     root          4096 Mar 27 03:28 ..
-rw-------    1 root     root       1576461 Jan  1  1970 v2.6.10.tar.gz
```

接着如果目标路径是文件呢？修改 Dockerfile 并查看其内容，结果如下，仅仅修改了文件名称而已。

```console
$ ls -al app
-rw-------    1 root     root       1576461 Jan  1  1970 app
```

### ADD 源路径是打包压缩文件

使用 wget 命令下载 vue.tar.gz 文件。

```console
$ wget https://github.com/vuejs/vue/archive/v2.6.10.tar.gz
--2019-03-27 11:40:21--  https://github.com/vuejs/vue/archive/v2.6.10.tar.gz
Resolving github.com (github.com)... 13.250.177.223, 13.229.188.59, 52.74.223.119
Connecting to github.com (github.com)|13.250.177.223|:443... connected.
HTTP request sent, awaiting response... 302 Found
Location: https://codeload.github.com/vuejs/vue/tar.gz/v2.6.10 [following]
--2019-03-27 11:40:22--  https://codeload.github.com/vuejs/vue/tar.gz/v2.6.10
Resolving codeload.github.com (codeload.github.com)... 54.251.140.56, 13.250.162.133, 13.229.189.0
Connecting to codeload.github.com (codeload.github.com)|54.251.140.56|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 1576461 (1.5M) [application/x-gzip]
Saving to: ‘v2.6.10.tar.gz’

v2.6.10.tar.gz                          100%[===========================>]   1.50M   313KB/s    in 5.7s

2019-03-27 11:40:29 (271 KB/s) - ‘v2.6.10.tar.gz’ saved [1576461/1576461]
$ ls -al v2.6.10.tar.gz
-rw-r--r--  1 lishude  staff  1576461 Mar 27 11:40 v2.6.10.tar.gz
```

然后修改文件 Dockerfile 为：

```Dockerfile
FROM alpine:latest
ADD v2.6.10.tar.gz app/
CMD ["sh"]
```

构建并查看文件内容，这里 Docker 已经解压了这个文件，而上一个例子中也是下载的打包压缩文件是不支持自动解压的。

```console
$ ls
app    bin    dev    etc    home   lib    media  mnt    opt    proc   root   run    sbin   srv    sys    tmp    usr    var
$ cd app
/app # ls
vue-2.6.10
$ cd vue-2.6.10/
$ ls
BACKERS.md    README.md     dist          flow          packages      src           types
LICENSE       benchmarks    examples      package.json  scripts       test          yarn.lock
```

根据文档所说明，如果源路径为一个压缩格式为 gzip, bzip2 以及 xz 的情况下的文件，ADD 指令将会将这个压缩文件到解压成到目标路径。

### 总结

看起来 `ADD` 指令要比 `COPY` 指令功能更加多，但是根据 Docker 最佳实践的说明，除非需要解压缩功能，否则要尽可能的使用 `COPY` 指令，因为 `COPY` 的语义很明确，就是复制文件而已。
