---
title: "容器资源可见性问题与 GOMAXPROCS 配置"
date: 2019-12-10 09:59:10
slug: "golang/容器资源可见性问题与-GOMAXPROCS-配置"
categories: ["Golang"]
tags: ["Docker", "Go"]
---

Go 程序启动时候会根据 CPU 数量设置 GOMAXPROCS，比如下面的程序中在 8 核处理下输出为 8。

```go
package main

import (
	"runtime"
)

func main() {
	println(runtime.NumCPU())
}
```

当我们使用 Docker 的时候也是如此，不过当我们使用 docker run 的时候同时限制了 CPU 数量，那么程序中会正常显示吗？

不会，比如 `docker run --cpus=2 IMAGE`，输出还是宿主机的数量。

这样就带来一个问题，如果宿主机是一个配置特别大的机器，同时限制了运行容器的 CPU ，那么就会造成 GOMAXPROCS 过大，程序运行中也会过多生成线程。

线程越多，但是 CPU 很少，这就造成线程调度负担，从而导致程序运行变慢。

所以需要去提前设置 GOMAXPROCS 为准确的值，uber 开源了 uber-go/automaxprocs 库，就很好的解决了这个问题，使用很简单。

```go
package main

import (
	_ "go.uber.org/automaxprocs"
)

func main() {
}
```

重新构造 Docker 镜像，再运行，可以看到这里适配了准确的 CPU 数量后自动打印了数据。

```console
$ docker build -t test .
$ docker run --cpus=2 --rm test
2019/12/10 09:46:31 maxprocs: Updating GOMAXPROCS=2: determined from CPU quota
```

这样就很OK了，另外还有一个可选项 LXCFS。

什么是 LXCFS ？docker 资源控制的原理的是使用了 cgroup，可以参考耗子叔的[文章](https://coolshell.cn/articles/17049.html)具体了解。

程序不能获取 cpu 限制，问题出在 docker 直接挂载 cgroup 信息到容器的 `/sys/fs/cgroup` 目录下，而 lxcfs 所做的就是让这些信息重新挂载到 `/proc` 目录下。

接下来介绍如何使用 lxcfs，首先在机器上安装 lxcfs

```sh
yum install -y fuse fuse-lib fuse-devel libtool
git clone --branch=lxcfs-4.0.6 --depth=1 https://github.com/lxc/lxcfs
cd lxcfs
./bootstrap.sh
./configure
make
make install
```

然后可以根据 `which lxcfs` 获取到已经安转到 `/usr/local/bin/lxcfs`，接着配置 systemd 守护进程

第一步，创建lxcfs mount 目录 `mkdir -p /var/lib/lxcfs`，接着配置 systemd 

```
cat > /usr/lib/systemd/system/lxcfs.service <<EOF
[Unit]
Description=FUSE filesystem for LXC
ConditionVirtualization=!container
Before=lxc.service
Documentation=man:lxcfs(1)

[Service]
ExecStart=/usr/local/bin/lxcfs --enable-cfs /var/lib/lxcfs
KillMode=process
Restart=on-failure
ExecStopPost=-/usr/bin/fusermount -u /var/lib/lxcfs
Delegate=yes
ExecReload=/bin/kill -USR1 $MAINPID

[Install]
WantedBy=multi-user.target
EOF
```

然后就可以启动lxcfs进程，并设置开机启动

```console
$ systemctl daemon-reload
$ systemctl start lxcfs
$ system enable lxcfs
```

最后验证查看启动状态

```console
$ systemctl status lxcfs
● lxcfs.service - FUSE filesystem for LXC
   Loaded: loaded (/usr/lib/systemd/system/lxcfs.service; disabled; vendor preset: disabled)
   Active: active (running) since Sun 2020-11-15 11:02:58 CST; 7s ago
     Docs: man:lxcfs(1)
 Main PID: 25418 (lxcfs)
    Tasks: 3
   Memory: 336.0K
   CGroup: /system.slice/lxcfs.service
           └─25418 /usr/local/bin/lxcfs /var/lib/lxcfs

Nov 15 11:02:58 vm82100 lxcfs[25418]: - proc_diskstats
Nov 15 11:02:58 vm82100 lxcfs[25418]: - proc_loadavg
Nov 15 11:02:58 vm82100 lxcfs[25418]: - proc_meminfo
Nov 15 11:02:58 vm82100 lxcfs[25418]: - proc_stat
Nov 15 11:02:58 vm82100 lxcfs[25418]: - proc_swaps
Nov 15 11:02:58 vm82100 lxcfs[25418]: - proc_uptime
Nov 15 11:02:58 vm82100 lxcfs[25418]: - shared_pidns
Nov 15 11:02:58 vm82100 lxcfs[25418]: - cpuview_daemon
Nov 15 11:02:58 vm82100 lxcfs[25418]: - loadavg_daemon
Nov 15 11:02:58 vm82100 lxcfs[25418]: - pidfds
```

如果你遇到  `Process: 25502 ExecStopPost=/usr/bin/fusermount -u /var/lib/lxcfs (code=exited, status=1/FAILURE)` 的错误，[目前看这是正常的](https://github.com/lxc/lxcfs/issues/146)。

这样我们就可以验证结果了，输出的 cpu 数量就是 2。

```console
$ docker run -it --rm -m 256m --cpus=2 \
      -v /var/lib/lxcfs/proc/cpuinfo:/proc/cpuinfo:rw \
      -v /var/lib/lxcfs/proc/diskstats:/proc/diskstats:rw \
      -v /var/lib/lxcfs/proc/meminfo:/proc/meminfo:rw \
      -v /var/lib/lxcfs/proc/stat:/proc/stat:rw \
      -v /var/lib/lxcfs/proc/swaps:/proc/swaps:rw \
      -v /var/lib/lxcfs/proc/uptime:/proc/uptime:rw \
      ubuntu:18.04 /bin/bash
$ cat /proc/cpuinfo | grep processor | wc -l
2
```

用上面的 go 程序不能验证结果，这是因为 docker 具体而言使用了 [CFS公平调度算法](https://en.wikipedia.org/wiki/Completely_Fair_Scheduler) 限制容器的 CPU 使用，虽然 lxcfs 成功挂载了必要信息到 `/proc/cpuinfo` 里，但是 golang 运行时通过 [sched_getaffinity](https://golang.google.cn/src/runtime/os_linux.go#L72)系统调用来获取 cpu 数量，所以 lxcfs 还是不能彻底解决问题。

这个问题目前没有解决，可以订阅这个 [golang: runtime: make GOMAXPROCS cfs-aware on GOOS=linux](https://github.com/golang/go/issues/33803) 问题进行跟踪。上面介绍的 uber 开源的 automaxprocs 库解决这个问题的思路是读取 cgroup 信息，然后在启动的时候就设置 GOMAXPROCS。

另外你用 [lscpu不能验证结果](https://github.com/lxc/lxcfs/issues/181)，也是同样的道理，都是系统调用，lxcfs 并不能拦截系统调用。

更新：go 1.25 增加对容器资源限制的识别

根据文档，GOMAXPROCS 会被设置为 cpu limit 而不是 cpu requests ，如果实际的 cpu 数量小于 cgroup 配置，那么会使用更小的实际值。另外目前 1.25 rc 版本最小值是 2，编译器团队说这是为了 GC 而保留的，未来可能有所变更。

---

原文：[GitHub Issue #216](https://github.com/islishude/blog/issues/216)
