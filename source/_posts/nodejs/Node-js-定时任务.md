---
title: "Node.js 定时任务"
date: 2020-12-22 08:39:53
slug: "nodejs/Node-js-定时任务"
categories: ["Node.js"]
tags: ["Web"]
---

有这样的一个需求，每 1 秒进行一项任务，那么就可以写成下面的方式：

```js
const job = async () => {
  console.log(`${new Date().toISOString()}: job running`);
  await new Promise((res) => setTimeout(res, 5000));
  console.log(`${new Date().toISOString()}: job done`);
};

const t = setInterval(job, 1000);
```

根据打印日志，可以看到就算任务没有完成，那么也会自动调用 job

```
2020-12-22T08:00:59.868Z: job running
2020-12-22T08:01:00.869Z: job running
2020-12-22T08:01:01.870Z: job running
2020-12-22T08:01:02.872Z: job running
2020-12-22T08:01:03.875Z: job running
2020-12-22T08:01:04.880Z: job running
2020-12-22T08:01:04.881Z: job done
2020-12-22T08:01:05.872Z: job done
2020-12-22T08:01:05.882Z: job running
2020-12-22T08:01:06.875Z: job done
2020-12-22T08:01:06.883Z: job running
2020-12-22T08:01:07.873Z: job done
2020-12-22T08:01:07.884Z: job running
2020-12-22T08:01:08.877Z: job done
2020-12-22T08:01:09.885Z: job done
2020-12-22T08:01:10.885Z: job done
2020-12-22T08:01:11.887Z: job done
2020-12-22T08:01:12.888Z: job done
```

为此需要加一个"锁"，如果已经加锁，那么不再需要运行 job

```js
let lock = false;

const job = async () => {
  const sleep = 5 * 1000;
  console.log(`${new Date().toISOString()}: running`);
  await new Promise((res) => setTimeout(res, sleep));
  console.log(`${new Date().toISOString()}: done`);
};

const t = setInterval(() => {
  if (lock) {
    return;
  }
  lock = true;
  job().finally(() => {
    lock = false;
  });
}, 1000);
```

如下面日志所示，那么现在任务就顺序执行了

```
2020-12-22T08:07:42.772Z: running
2020-12-22T08:07:47.790Z: done
2020-12-22T08:07:47.790Z: running
2020-12-22T08:07:52.791Z: done
```

不过这也有个问题，假设需要任务之前间隔是固定的，比如上面的1秒，那么这个解决方式就是不行的，因为 Interval 可能触发了，但是并不是上次任务结束后一定是有足够的时间间隔。

比如把上面的 sleep 时间改成 2500，那么如下面所示，第二个运行的时间只差第一个不到 1 秒。

```
2020-12-22T08:18:58.752Z: running
2020-12-22T08:19:01.272Z: done
2020-12-22T08:19:01.757Z: running
2020-12-22T08:19:04.260Z: done
2020-12-22T08:19:04.765Z: running
2020-12-22T08:19:07.267Z: done
```

我们可以用 setTimeout 实现，当任务结束之后，那么在重新生成新的定时器。

```js
const job = async () => {
  console.log(`${new Date().toISOString()}: running`);
  await new Promise((res) => setTimeout(res, 2500));
  console.log(`${new Date().toISOString()}: done`);
};

const runner = () => {
  job().finally(() => {
    setTimeout(runner, 1000);
  });
};

setTimeout(runner, 1000);
```

如下面日志显示，这正好符合需求

```
2020-12-22T08:30:03.716Z: running
2020-12-22T08:30:06.227Z: done
2020-12-22T08:30:07.232Z: running
2020-12-22T08:30:09.734Z: done
2020-12-22T08:30:10.739Z: running
2020-12-22T08:30:13.243Z: done
2020-12-22T08:30:14.249Z: running
```

不过这也不断生成了新的定时器对象。

在 node.js 10.2.0 中 Timeout 对象加入了一个 refresh 方法，可以重置定时器。

```js
const job = async () => {
  console.log(`${new Date().toISOString()}: running`);
  await new Promise((res) => setTimeout(res, 2500));
  console.log(`${new Date().toISOString()}: done`);
};

const t = setTimeout(() => {
  job().finally(() => t.refresh());
}, 1000);
```

这样就不需要额外的对象生成了，但还是有个问题， refresh 并不能重新设置时间间隔。

比如说一般而言程序开始时，需要先运行 job，而不是等待定时器时间到了再运行，如果 refresh 能支持设置时间我们就可以写成这样：

```js
// ！！注意：目前并不支持下面的方式 ！！
const job = async () => {}

const t = setTimeout(() => {
  job().finally(() => t.refresh(1000)); // 这里在重新设置时间间隔
}); // 这里不设置间隔(实际上会自动设置为1)，让程序尽可能快的运行
```

不过在 go 中就可以实现

```go
	timer := time.NewTimer(0)
	for {
		select {
		case <-basectx.Done():
			return
		case <-timer.C:
			job()
			timer.Reset(interval)
		}
	}
```

相比较 nodejs 异步事件而言，我更喜欢 go 直接的定时器逻辑。

---

原文：[GitHub Issue #246](https://github.com/islishude/blog/issues/246)
