---
layout: post
title: "ssh MaxAuthTries"
categories: linux
tags: [Linux, ssh]
---

新建了一个Ubuntu14.04的虚拟机，使用xshell登陆，刚输入用户名后却直接抛出了 `Too many authentication failures for username` 的错误。ssh登陆失败尝试次数和`MaxAuthTries`值相关，直接`man sshd_config`获取该参数说明，得到如下内容：

MaxAuthTries

    Specifies the maximum number of authentication attempts permitted per connection.
    Once the number of failures reaches half this value,  # 失败次数为该值一半时登录失败
    additional failures are logged.  The default is 6.

让我很诧异的是，关键尼玛我还没有输入密码什么的啊，只是输入一个用户名就报错了。于是测试虚拟机本地ssh登陆，登陆正常，其它Linux主机登陆测试也正常，再测试xshell，依然是输入用户名之后报之前同样的错误。ssh本地`debug`模式再看下过程

``` bash
$ ssh -v 127.0.0.1
... ...
debug1: Trying private key: /home/test/.ssh/id_rsa
debug1: Trying private key: /home/test/.ssh/id_dsa
debug1: Trying private key: /home/test/.ssh/id_ecdsa
debug1: Trying private key: /home/test/.ssh/id_ed25519
debug1: Next authentication method: password
test@127.0.0.1's password:
... ...
```

debug模式看到这里，我自己有点明白了，ssh验证过程是先尝试私钥再进行密码，查看Xagent开启了3个私钥agent，所以3次没有匹配到私钥之后就断开报错了。`MaxAuthTries`值默认为6，但是`Once the number of failures reaches half this value`尝试次数达到设定值一半之后就不能再尝试了。

--EOF--
