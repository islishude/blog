---
layout: crypto
title: 谷歌和苹果发布的COVID-19密切接触者追踪应用是如何保护用户隐私的？
date: 2020-09-21 22:27:17
tags:
---


最近谷歌和苹果公司作为竞争对手不常见的联合起来，发布了一个COVID-19 Contract Tracing应用，也就是密切接触者追踪应用。其实现原理并不复杂，简单而言就是用户使用蓝牙将个人相关信息传递附近的手机上，如果有人确诊了，可以将这个人的信息上传到服务端，然后再推送给其它相关手机上，这样就能判断一个人是否有感染风险。

<img width="898" alt="截屏2020-04-19 上午10 16 00" src="https://user-images.githubusercontent.com/24730006/79677706-cf821b80-8226-11ea-9460-61f4ad6877b3.png">

为了隐私保护，苹果和谷歌都明确表示不会上传手机用户身份信息，而且还有位置信息，在[相关文档](https://covid19-static.cdn-apple.com/applications/covid19/current/static/contact-tracing/pdf/ContactTracing-CryptographySpecification.pdf)上有说明具体的隐私保护实现细节，本文就简单说明其实现原理。

<img width="896" alt="截屏2020-04-19 上午10 16 29" src="https://user-images.githubusercontent.com/24730006/79677718-dad54700-8226-11ea-87a4-f3e78c798e9e.png">

在Contract Tracing中会生成三个密钥，只有第一个密钥是固定的，作为主密钥（master key），其它两个都是通过前一个密钥用时间为变量进行密钥衍生而不断变化，这样就保证了信息混淆，外部无法简单的根据共享信息推论到个人。

任意一个确诊的密钥所有者只要给出部分时间段的第二个密钥，其它用户就能通过接触时间推断第三个密钥，通过第三个密钥就能得到确诊者与自己的相关性，进而得出自己是否为密切接触者。

<img width="1010" alt="截屏2020-04-19 下午5 12 33" src="https://user-images.githubusercontent.com/24730006/79684057-1db41080-8261-11ea-93ea-6e600e744221.png">

追踪密钥（TracingKey）是一个32字节的密码学安全随机数，并作为唯一身份凭证，而不是每部手机自带的 UDID 强关联用户，32字节密钥空间在 2**256 内，设备间密钥重复的概率极低。当然这个追踪密钥仅保存在本机，不会上传到服务端，也不会传播给其它用户设备。

```
TracingKey = CRNG(size=32)
```

然后通过密钥衍生函数生成一个24小时内固定的每日追踪密钥（DailyTracing Key ），这个密钥也不会广播给其它设备，只有用户确诊时才需要被上传到服务端。

如下所示，保证每天都是一个同一个密钥。Di 是第 i 天的值，并被序列化成小端存储的 32 位数据，生成 16 字节的原因是为了减少用户设备和服务器的存储压力。

```
Di = UnixEpochTime / (60 * 60 * 24)
DTKi = HKDF(key=TracingKey , salt=NULL, info=(UTF8("CT-DTK")||Di),size=16)
```

最终广播给其它设备的是“轮换接触标志符”（Rolling Proximity Identifier，简称 RPI），RPI 每10分钟一个周期(TimeIntervalNumber简称 TIN)通过 HMAC 生成一次，这样一天大概有 6*24 = 144 个值。

那么第 i 天的第 j 次的 RPI 计算公式可以通过如下方式得到，经过 HMAC 后，再取前 16 自己进行广播，是不是有点像 OTP 的生成方式？

```
Seconds =  UnixEpochTime % (60 × 60 × 24)
TIN = Seconds / (60*10)
RPI(i,j) = Truncate(HMAC( key=DKTi, Data=(UTF8("CT-RPI")||TINj)),16)
```

用户会在不间断的广播 RPI，其它用户接收到后存储在本地，按照需要 10k 数量存储来估算，最多用户会存储到 156.25 KB 的数据量，再加上时间更长（比如15天以上）的数据可以清理，其实用户手机存储的负担并不大。

这样三个密钥，TracingKey 唯一标志用户身份，只有所有者知道；DailyTraceKey 每天不断变化，只有用户感染周期内可以被上传到服务器和下发到其它设备；RPI 每 10 分钟变化一次，可以安全在用户设备间共享。

如果用户被感染时，那么可以将近期他人可能被感染的日期的 DailyTraceKey 子集计算出来，文档中称之为 DiagnosisKeys，与相关日期时间 DayNumbers 一并上传到服务端（DiagnosisServer），而健康的用户无需上传这些数据。

DiagnosisKeys 会推送到到其它手机设备，其它手机设备本地通过 DayNumbers 计算得到 RPI，如果本地有缓存的匹配到 RPI，那么证明曾经与确诊者接触过，有被感染的风险。

整个过程服务端仅记录了相关的 DiagnosisKeys 和 DayNumbers，也没有参与用户 RPI 匹配过程，所以这个过程是隐私友好的。

这样子，用户不需要提供位置信息，也不需要进行身份认证，当然这个也是自愿的，如果每个人都安装的话，也能防止病毒进一步的传播，保护自己也保护了他人。