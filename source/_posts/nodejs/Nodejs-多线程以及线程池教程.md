---
title: Nodejs 多线程以及线程池教程
categories:
  - Node.js
date: 2019-06-29 09:42:05
tags:
---

Nodejs v11.7.0 发布后，woker_threads API 就进入基本稳定状态，不需要在运行时候加上 `--experimental-worker` 标识了。

worker 对于执行 CPU 密集型操作非常有用，但对 I/O 密集型操作没有多大帮助，使用内置异步 I/O 操作效率更高。

## API 简介

创建一个 worker 线程很简单：

```js
// index.js
const { Worker } = require("worker_threads");
const worker = new Worker(`${__dirname}/worker.js`);
```

这里是在相同的目录创建一个文件 worker.js，通过加载这个文件来创建线程，这个和前端 worker 基本一致，不过 node.js 也提供了一个同文件创建线程的方式：

```js
const { Worker, isMainThread } = require("worker_threads");

if (isMainThread) {
  // 主线程处理逻辑
  const worker = new Worker(__filename);
} else {
  // worker 线程处理逻辑
}
```

如果要向 worker 线程传递数据的话，可以通过事件通知的方式来传递数据：

```js
worker.postMessage(value);
```

value 可以是合法地 JS 数据，不过这里会拷贝数据，并且拷贝数据的逻辑要遵循 HTML 结构化克隆算法。

> 结构化克隆算法是由 HTML5 规范定义的用于复制复杂 JavaScript 对象的算法。通过来自 Workers 的 postMessage() 或使用 IndexedDB 存储对象时在内部使用。它通过递归输入对象来构建克隆，同时保持先前访问过的引用的映射，以避免无限遍历循环。结构化克隆所不能做到的: Error 以及 Function 对象是不能被结构化克隆算法复制的；如果你尝试这样子去做，这会导致抛出 DATA_CLONE_ERR 的异常。2、企图去克隆 DOM 节点同样会抛出 DATA_CLONE_ERROR 异常。3、对象的某些特定参数也不会被保留，RegExp 对象的 lastIndex 字段不会被保留；属性描述符，setters 以及 getters（以及其他类似元数据的功能）同样不会被复制。例如，如果一个对象用属性描述符标记为 read-only，它将会被复制为 read-write，因为这是默认的情况下；原形链上的属性也不会被追踪以及复制。https://developer.mozilla.org/zh-CN/docs/Web/Guide/API/DOM/The_structured_clone_algorithm

相应的主线程接收数据则可以通过 `worker.on("message", ...)` 接收数据：

```js
worker.on("message", resp => {
  // ...
});
```

相应的 Worker 线程收发数据和主线程基本一致，不过这里的事件对象换成了 parentPort，而这个对象可以直接从 worker 包获取

那么 worker 线程可以使用 `parentPort.on("message", ...)` 接收数据：

```js
const { parentPort } = require("worker_threads");

// receive from main thread
parentPort.on("message", buf => {
    // post to main thread
    parentPort.postMessage(buf);
  });
});
```

主线程除了可以直接 postMessage 传递数据，另外也可以创建 worker 的时候传递。

```js
const worker = new Worker(__filename, {
  workerData: "data"
});
```

相应的 worker 线程接受则换成了 `workerData`

```js
const { workerData } = require("worker_threads");
```

最基本的 API 介绍完毕后就可以写一个简单的 demo ，从 worker 线程中获取随机数据。

index.js 暴露随机数据接口

```js
const { Worker } = require("worker_threads");

const random = (size /** number */) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(`${__dirname}/worker.js`);

    // copy
    worker.postMessage(size);

    worker.on("message", (resp /** { error: Error; data: Buffer } */) => {
      const { data, error } = resp;
      if (error) {
        reject(err);
      } else {
        resolve(data);
      }
      // exit thread
      worker.terminate();
    });

    // The 'error' event is emitted if the worker thread throws an uncaught exception.
    // In that case, the worker will be terminated.
    worker.on("error", (err /* Error*/) => {
      reject(err);
      // exit thread
      worker.terminate();
    });
  });
};

module.exports = random;
```

worker.js worker 线程逻辑

```js
const { parentPort } = require("worker_threads");
const { randomBytes } = require("crypto");
parentPort.on("message", size => {
  const response = {
    error: null,
    data: null
  };

  randomBytes(size, (err, buf) => {
    if (err) {
      response.err = err;
    } else {
      response.data = buf;
    }

    parentPort.postMessage(response);
  });
});
```

test.js 测试调用

```js
const random = require("./thread");
(async () => {
  console.time("Worker mode");
  const result = await random(32);
  result.toString("hex");
  console.timeEnd("Worker mode");
})().catch(console.error);
```

结果数据：`Worker mode: 63.023ms`

使用正常的模式看看耗时

```js
const { randomBytes } = require("crypto");
console.time("Normal mode");
randomBytes(32, (err, buf) => {
  if (err) {
    console.error(err);
  } else {
    buf.toString("hex");
  }
  console.timeEnd("Normal mode");
});
```

结果数据：`Normal mode: 0.383ms`

耗时挺严重的，这是上面我们的例子中每次调用都会创建销毁一个线程，这个耗时最大了，而且线程间拷贝传递数据也会耗时。

所以官方推荐使用线程池模式以及使用 `SharedArrayBuffer` 传递数据避免拷贝。

## 线程池 Demo

这里提供一个我写的一个线程池 demo 并不是很完善。

```js
const EventEmitter = require("events");
const { Worker } = require("worker_threads");

// 线程状态
const WorkerStates = {
  TODO: 0,
  READY: 1,
  DOING: 2,
  OFF: 3
};

// 线程池状态
const WorkerPoolStates = {
  TODO: 0,
  READY: 1,
  OFF: 2
};

class SHA256 {
  constructor() {
    this.size = 10;
    this.workers = [];
    this.state = WorkerPoolStates.TODO;
  }

  // 每次使用线程池都必须运行
  // `await init()` 初始化
  init() {
    return new Promise((resolve, reject) => {
      if (this.state == WorkerPoolStates.READY) {
        resolve();
        return;
      }

      let successCount = 0;
      let failedCount = 0;

      const event = new EventEmitter();
      event.on("spawning", (isSuccess, ErrorReason) => {
        if (isSuccess) {
          ++successCount;
        } else {
          ++failedCount;
        }

        // 如果所有线程都创建失败，那么直接抛出
        if (failedCount == this.size) {
          this.state = WorkerPoolStates.OFF;
          reject(new Error(ErrorReason));
        }
        // 至少一个线程创建成功即可
        else if (successCount != 0 && successCount + failedCount == this.size) {
          this.state = WorkerPoolStates.READY;
          resolve();
        }
      });

      for (let i = 0; i < this.size; ++i) {
        const worker = new Worker(`${__dirname}/worker.js`);
        this.workers.push({
          state: WorkerStates.TODO,
          instance: worker
        });

        // 当线程执行代码后悔触发 online 事件
        worker.on(
          "online",
          (index => () => {
            // 线程执行完代码后再更改线程状态
            this.workers[index].state = WorkerStates.READY;
            this.workers[index].instance.removeAllListeners();
            event.emit("spawning", true);
          })(i)
        );

        worker.on(
          "error",
          (index => ErrorReason => {
            this.workers[index].state = WorkerStates.OFF;
            this.workers[index].instance.removeAllListeners();
            event.emit("spawning", false, ErrorReason);
          })(i)
        );
      }
    });
  }

  digest(data = "") {
    return new Promise((resolve, reject) => {
      if (this.state != WorkerPoolStates.READY) {
        reject(new Error("Create threads failed or not ready yet"));
      }

      let curAvaWorker = null;
      let curAvaWorkerIndex = 0;

      // 这里有 bug
      // 如果所有线程都是空闲的返回结果了
      // 处理方式应该使用 promise 进行回调
      for (let i = 0; i < this.size; ++i) {
        const curWorker = this.workers[i];
        if (curWorker.state == WorkerStates.OFF) {
          recreate(i);
        }
        if (curAvaWorker == null && curWorker.state == WorkerStates.READY) {
          curWorker.state = WorkerStates.DOING;
          curAvaWorker = curWorker.instance;
          curAvaWorkerIndex = i;
        }
      }

      if (curAvaWorker == null) {
        return;
      }

      curAvaWorker.on("message", msg => {
        this.free(curAvaWorkerIndex, false);
        if (!msg.error) {
          resolve(msg.data);
          return;
        }
        reject(msg.error);
      });

      curAvaWorker.once("error", error => {
        this.free(curAvaWorkerIndex, true);
        reject(error);
      });

      curAvaWorker.postMessage(data);
    });
  }

  // 重新恢复线程
  recreate(i) {
    const worker = new Worker(`${__dirname}/worker.js`);
    const deadWorker = this.workers[i];
    deadWorker.state = WorkerStates.TODO;
    deadWorker.instance = worker;

    worker.once("online", () =>
      process.nextTick(() => {
        deadWorker.state = WorkerStates.READY;
        worker.removeAllListeners();
      })
    );

    worker.once("error", error => {
      console.error(error);
      deadWorker.state = WorkerStates.OFF;
      worker.removeAllListeners();
    });
  }

  // 切换线程状态
  free(i, hasError) {
    this.workers[i].status = hasError ? WorkerStates.READY : WorkerStates.OFF;
    this.workers[i].instance.removeAllListeners();
  }

  // 停止所有线程
  terminate() {
    this.state = WorkerPoolStates.OFF;
    return new Promise((resolve, reject) => {
      for (let i = 0; i < this.size; ++i) {
        this.workers[i].instance.terminate(err => {
          if (!err && i == this.size) {
            resolve();
          } else {
            reject(err);
          }
        });
      }
    });
  }
}

module.exports = new SHA256();
```
