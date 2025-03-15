---
title: 证书中CommonName和SubjectAlternativeName
categories:
  - Linux
date: 2020-09-21 22:13:09
tags:
---

这是 github.com 的 https 证书解码后的数据，通过 Subject 字段可以看到证书所有者的基本信息，其中 CN 是 CommonName 的简写，中文常称作通用名称。

```
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            0a:06:30:42:7f:5b:bc:ed:69:57:39:65:93:b6:45:1f
    Signature Algorithm: sha256WithRSAEncryption
        Issuer: C=US, O=DigiCert Inc, OU=www.digicert.com, CN=DigiCert SHA2 Extended Validation Server CA
        Validity
            Not Before: May  8 00:00:00 2018 GMT
            Not After : Jun  3 12:00:00 2020 GMT
        Subject: businessCategory=Private Organization/jurisdictionC=US/jurisdictionST=Delaware/serialNumber=5157550, C=US, ST=California, L=San Francisco, O=GitHub, Inc., CN=github.com
        X509v3 extensions:
            X509v3 Authority Key Identifier:
                keyid:3D:D3:50:A5:D6:A0:AD:EE:F3:4A:60:0A:65:D3:21:D4:F8:F8:D6:0F

            X509v3 Subject Key Identifier:
                C9:C2:53:61:66:9D:5F:AB:25:F4:26:CD:0F:38:9A:A8:49:EA:48:A9
            X509v3 Subject Alternative Name:
                DNS:github.com, DNS:www.github.com
```

当浏览器进行 TLS 握手时是不是通过 CommonName 来判断证书是属于当前域名 github.com 的呢？

答案是否定的，而是通过 SubjectAlternativeName 主题替换名称来确定的。 我们看到 X509 SubjectAlternativeName 中包括了 `github.com` 和 `www.github.com` 两个域名，那么就可以用来于这两个域名的 https 证书。

其实有过使用通用名称作为证书验证的，但是通用名称只是一个字段，并不能给多个域名颁发证书。

除了给域名颁发证书之外，还可以给 ip 颁发证书，可以访问 https://1.1.1.1 看到这个浏览器是正常的，并没有报错，下面去掉大部分信息后，可以看到证书给 ipv4 和 ipv6 都有颁发证书。

```
Certificate:
        Issuer: C=US, O=DigiCert Inc, CN=DigiCert ECC Secure Server CA
        Validity
            Not Before: Jan 28 00:00:00 2019 GMT
            Not After : Feb  1 12:00:00 2021 GMT
        Subject: C=US, ST=California, L=San Francisco, O=Cloudflare, Inc., CN=cloudflare-dns.com

            X509v3 Subject Key Identifier:
                70:95:DC:5C:A3:8E:66:07:DB:CB:81:10:C6:AB:E7:C3:A8:45:7F:A0
            X509v3 Subject Alternative Name:
                DNS:cloudflare-dns.com, DNS:*.cloudflare-dns.com, DNS:one.one.one.one, IP Address:1.1.1.1, IP Address:1.0.0.1, IP Address:162.159.132.53, IP Address:2606:4700:4700:0:0:0:0:1111, IP Address:2606:4700:4700:0:0:0:0:1001, IP Address:2606:4700:4700:0:0:0:0:64, IP Address:2606:4700:4700:0:0:0:0:6400, IP Address:162.159.36.1, IP Address:162.159.46.1
```

除此之外，我们 [golang/x509](https://golang.org/pkg/crypto/x509/#Certificate) 包可以看到，还可以给 email 和 url 进行颁发证书：

```
    // Subject Alternate Name values. (Note that these values may not be valid
    // if invalid values were contained within a parsed certificate. For
    // example, an element of DNSNames may not be a valid DNS domain name.)
    DNSNames       []string
    EmailAddresses []string
    IPAddresses    []net.IP // Go 1.1
    URIs           []*url.URL // Go 1.10
```

如果使用 CommonName 而没有 SAN ，HTTPS 是无法成功握手的。另外 common name 也可以填写其它任意的字符串，通用名称本质上已经成了一个名称，并没有特殊的作用了。