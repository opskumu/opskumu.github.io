---
layout: post
title: "rsyslog 远程传输"
categories: linux
tags: [Linux, rsyslog]
---

## 一、基本介绍

Rsyslog是一个syslogd的多线程增强版，[rsyslog vs. syslog-ng](www.rsyslog.com/doc/rsyslog_ng_comparison.html) 链接是rsyslog官方和syslog特性和性能上的一些对比，目前大部分Linux发行版本默认也是使用rsyslog记录日志。这里介绍rsyslog远程传输的几种方式，对远程日志传输可以有一个了解。


rsyslog提供三个远程日志传输方式：

* UDP: 数据包传输可信度不高
* TCP: 数据包传输可信度比较高
* RELP: 数据包传输可信度最高，避免数据丢失，比较新的协议，目前应用较少

以下为man手册对RELP协议的一个介绍：

> RELP can be used instead of UDP or plain TCP syslog to  provide  reliable  delivery  of syslog  messages.  Please  note that plain TCP syslog does NOT provide truly reliable delivery, with it messages may be  lost when there is a connection problem or the server shuts down. RELP prevents message loss in hose cases. 

关于RELP的更进一步了解可以参考 [Using TLS with RELP](http://www.rsyslog.com/tag/relp/) [RELP Input Module](http://www.rsyslog.com/doc/imrelp.html)  [RELP Output Module (omrelp)](http://www.rsyslog.com/doc/omrelp.html)

## 二、相关配置

> To forward messages to another host via UDP, prepend the hostname with the at sign ("@").  To forward it via plain tcp, prepend two at signs ("@@"). To forward via RELP, prepend the string ":omrelp:" in front of the hostname.

### 2.1 UDP传输

#### Server端配置

``` bash 
# /etc/rsyslog.conf
# Provides UDP syslog reception
$ModLoad imudp
$UDPServerRun 514
$AllowedSender UDP, 192.168.80.0/24

# This one is the template to generate the log filename dynamically, depending on the client's IP address. 
# 根据客户端的IP单独存放主机日志在不同目录，syslog需要手动创建             
$template Remote,"/var/log/syslog/%fromhost-ip%/%fromhost-ip%_%$YEAR%-%$MONTH%-%$DAY%.log"

# Log all messages to the dynamically formed file.
:fromhost-ip, !isequal, "127.0.0.1" ?Remote     
# 排除本地主机IP日志记录，只记录远程主机日志
# 注意此规则需要在其它规则之前，否则配置没有意义，远程主机的日志也会记录到Server的日志文件中
& ~ # 忽略之前所有的日志，远程主机日志记录完之后不再继续往下记录
```

或者把以上配置单独存放在`/etc/rsyslog.d/`中的xxx.conf配置文件中，尽量避免修改主配置文件，当然如果要独立文件主配置文件中必须含有以下配置

``` bash
# grep 'rsyslog.d' /etc/rsyslog.conf 
# Include all config files in /etc/rsyslog.d/
$IncludeConfig /etc/rsyslog.d/*.conf
```

#### Client端配置

``` bash 
# /etc/rsyslog.conf
*.*                     @192.168.80.130
```

以上配置完成之后`/etc/init.d/rsyslog restart`

### 2.2 TCP传输

TCP配置和UDP类似，如下

#### Server端配置

``` bash 
# /etc/rsyslog.conf
# Provides TCP syslog reception
$ModLoad imtcp
$InputTCPServerRun 514
$AllowedSender TCP, 192.168.80.0/24

# This one is the template to generate the log filename dynamically, depending on the client's IP address.          
$template Remote,"/var/log/syslog/%fromhost-ip%/%fromhost-ip%_%$YEAR%-%$MONTH%-%$DAY%.log"

# Log all messages to the dynamically formed file.
:fromhost-ip, !isequal, "127.0.0.1" ?Remote
& ~
```

#### Client端配置

``` bash
# /etc/rsyslog.conf
*.*                     @@192.168.80.130
```

客户端和服务端重启相关服务即可

关于TCP和UDP的传输方式，rsyslog官方推荐使用TCP传输方式

> In general, we suggest to use TCP syslog. It is way more reliable than UDP syslog and still pretty fast. The main reason is, that UDP might suffer of message loss. This happens when the syslog server must receive large bursts of messages. If the system buffer for UDP is full, all other messages will be dropped. With TCP, this will not happen. But sometimes it might be good to have a UDP server configured as well. That is, because some devices (like routers) are not able to send TCP syslog by design. In that case, you would need both syslog server types to have everything covered. If you need both syslog server types configured, please make sure they run on proper ports. By default UDP syslog is received on port 514. TCP syslog needs a different port because often the RPC service is using this port as well.

### 2.3 RELP传输

RELP需要安装`rsyslog-relp`相应模块

``` bash
# yum install rsyslog-relp -y
```

#### Server端配置

``` bash 
# /etc/rsyslog.conf
$ModLoad imrelp # 加载相应模块
$InputRELPServerRun 20514 # 监听端口

# This one is the template to generate the log filename dynamically, depending on the client's IP address.          
$template Remote,"/var/log/syslog/%fromhost-ip%/%fromhost-ip%_%$YEAR%-%$MONTH%-%$DAY%.log"

# Log all messages to the dynamically formed file.
:fromhost-ip, !isequal, "127.0.0.1" ?Remote
```

#### Client端配置

``` bash 
# /etc/rsyslog.conf
$ActionQueueType LinkedList     # use asynchronous processing
$ActionQueueFileName srvrfwd    # set file name, also enables disk mode
$ActionResumeRetryCount -1      # infinite retries on insert failure
$ActionQueueSaveOnShutdown on   # save in-memory data if rsyslog shuts down
*.* :omrelp:192.168.80.130:20514
```

客户端和服务端重启相关服务即可

## 三、参考和拓展资料

* [UDP Rsyslog](http://www.rsyslog.com/tag/udp/)
* [TCP Rsyslog](http://www.rsyslog.com/tag/tcp/)
* [Using TLS with RELP](http://www.rsyslog.com/tag/relp/) 
* [RELP Input Module](http://www.rsyslog.com/doc/imrelp.html)  
* [RELP Output Module (omrelp)](http://www.rsyslog.com/doc/omrelp.html)
* [Rsyslog remote logging using RELP](http://gertverdemme.nl/sysadm/security/rsyslog_relp_remote_logging)

--EOF--
