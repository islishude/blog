---
title: 说说 XSRF 防范
categories:
  - Node.js
date: 2018-05-23 07:47:17
tags:
---

[![](https://badge.juejin.im/entry/59be6c0ff265da065c5e76df/likes.svg?style=flat-square)](https://juejin.im/post/59be6be16fb9a00a53275365)

这是我在知乎的一个回答。原提问是如何在单页应用下进行 XSRF 防护。

XSRF(CSRF) 攻击的原理是什么？就是攻击者能猜测出所有的需要提交的内容以及类型，所以所有的解决方案共同出发点就是加一个攻击者也不知道随机值发送给后端验证就可以防范。

有很多解决方案，cookie-session，很不友好的所有表单都得填写验证码，还有一种很少人知道 JSON Web Token。

验证码（图形或者手机）这种就不说了吧，这个在互联网场景中因为用户体验原因几乎没有应用的。

首先要知道直接让后端验证 cookie 是否存在正确是不可取的，因为所有请求都会自动附带请求所在域的 cookie，当然只验证 http referrer 也是不靠谱的。

正确的方式是当用户进行登录请求的时候，这时候后端应该把包含 xsrf 字段的 cookie 保存在 session 中并且返还给前端，前端需要获取到 cookie 中的值并且能放入 ajax 请求体或请求头中，后端把这个值与 session 中的相应值进行判断就可以了，根据跨域不可访问不同域的 cookie ，攻击者也很难猜测出 xsrf 的值，那么这样就防范了 xsrf 攻击。

所以这里对 xsrf cookie 不能设置 httpOnly（当然就会有 XSS 问题，后面会提），同时提一句所以的 Token 必须得让后端设置 expire 过期时间。

这个 axios 就提供了这个功能，只要设置约定好 xsrf  cookie字段名就可以了，axios 获取到值后默认是放入 request header 中，这也是业界最流行的方式。

如果不是单页应用都是后端在表单中加入一个隐藏的表单域。

```html
<input type="hidden" name="_token" value="lAfHB..">
```

当然还有JWT，这个主要应用场景是 app，因为 app 通常没有 Cookie，当然也有应用到 Web 中的，要讲这个就有点多了，和上述也差不多。

简单说，JWT 就是服务端和客户端约定好一个Token格式，最后用密钥进行签名 base64 编码后放入请求头即可，客户端存放这个签名的内容通常会放在 localstorage 中，也有放在 cookie 中的。JWT应用了哈希签名的密码学技术，相比 cookie-session 的方式就是服务端可以不用（在内存或者缓存）存放 session，能节省存储资源，不过同时服务器需要通过计算来验证也浪费了计算资源。

以下内容参考：[讲真，别再使用JWT了！](https://www.jianshu.com/p/af8360b83a9f)

JWT通常由三部分组成: 头信息（header）, 消息体（payload）和签名（signature）。

头信息指定了该JWT使用的签名算法:

```
header = '{"alg":"HS256","typ":"JWT"}'
```

HS256 表示使用了 HMAC-SHA256 来生成签名。

消息体包含了JWT的意图：

```
payload = '{"loggedInAs":"admin","iat":1422779638}'//iat表示令牌生成的时间
```

未签名的令牌由base64url编码的头信息和消息体拼接而成（使用"."分隔），签名则通过私有的key计算而成：

```
key = 'secretkey'  
unsignedToken = encodeBase64(header) + '.' + encodeBase64(payload)  
signature = HMAC-SHA256(key, unsignedToken) 
```

最后在未签名的令牌尾部拼接上base64url编码的签名（同样使用"."分隔）就是JWT了：

```
token = encodeBase64(header) + '.' + encodeBase64(payload) + '.' + encodeBase64(signature) 
```

token 看起来像这样: 
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dnZWRJbkFzIjoiYWRtaW4iLCJpYXQiOjE0MjI3Nzk2Mzh9.gzSraSYS8EXBxLN_oWnFSRgCzcmJmMjLiuyu5CSpyHI `
JWT常常被用作保护服务端的资源（resource），客户端通常将JWT通过HTTP的Authorization header发送给服务端，服务端使用自己保存的key计算、验证签名以判断该JWT是否可信：`Authorization: Bearer eyJhbGci*...<snip>...*yu5CSpyHI`

现有的产品为了更安全还需要考虑 XSS 攻击，这个就是有些恶意脚本或者插件不存在跨域问题，所以能获取到 cookie 和 localstorage 的值。

很安全的方式就是把 XSRF Token 加入到 JWT 中，并且把 JWT 存放在设置 httpOnly 的 cookie 中，然后单独把 XSRF Token 设置在 httpOnly=false 的 cookie 中，前端请求时，需要获取 XSRF Token 并放入请求头（RequestHeader）。服务器端可以直接验证 JWT 中 XSRF 的值和 X-XSRF-Header 的值即可。因为用了哈希密钥签名的技术，这样就可以防止篡改内容。

简单来说 payload 就是这样：

```json
{
    "isu": "appName",
    "usr": "userId",
    "xsrf": "randomString",
    "exp": "expireDatetime"
}
```

这样的安全防护就能抵御所有的 XSRF 攻击了。

## 更新1

Cookie 作为 Token 不能防范 XSRF 的原因就是，如果在 other-site 使用表单进行发送信息，这里发送**没有跨域限制**，所以 Cookie 会随着表单发送到服务端。

最新的浏览器支持 Cookie 的 same-origin 设置，但是兼容不佳，所以最佳的策略还是使用 JWT。