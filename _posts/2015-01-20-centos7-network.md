---
layout: post
title: "CentOS 7/RHEL 7 网卡启动错误"
description: "CentOS 7 网卡启动错误"
categories: Linux
tags: [Linux]
---

在 CentOS 7/RHEL 7 下关闭 NetworkManager 服务导致网卡启动失败，在 [Disabling NetworkManager on RHEL 7](http://superuser.com/questions/782083/disabling-networkmanager-on-rhel-7) 找到相同问题并解决。

## 一、关闭并移除开机启动 NetworkManager

``` bash
systemctl stop NetworkManager
systemctl disable NetworkManager
```

## 二、启动 network 错误输出如下:

``` bash
# systemctl restart network
Job for network.service failed. See 'systemctl status network.service' and 'journalctl -xn' for details.
# systemctl status network
network.service - LSB: Bring up/down networking
   Loaded: loaded (/etc/rc.d/init.d/network)
   Active: failed (Result: exit-code) since Tue 2015-01-20 20:23:34 CST; 15s ago
  Process: 1659 ExecStop=/etc/rc.d/init.d/network stop (code=exited, status=0/SUCCESS)
  Process: 2588 ExecStart=/etc/rc.d/init.d/network start (code=exited, status=1/FAILURE)

Jan 20 20:23:34 docker1 network[2588]: RTNETLINK answers: File exists
Jan 20 20:23:34 docker1 network[2588]: RTNETLINK answers: File exists
Jan 20 20:23:34 docker1 network[2588]: RTNETLINK answers: File exists
Jan 20 20:23:34 docker1 network[2588]: RTNETLINK answers: File exists
Jan 20 20:23:34 docker1 network[2588]: RTNETLINK answers: File exists
Jan 20 20:23:34 docker1 network[2588]: RTNETLINK answers: File exists
Jan 20 20:23:34 docker1 network[2588]: RTNETLINK answers: File exists
Jan 20 20:23:34 docker1 systemd[1]: network.service: control process exited, code=exited status=1
Jan 20 20:23:34 docker1 systemd[1]: Failed to start LSB: Bring up/down networking.
Jan 20 20:23:34 docker1 systemd[1]: Unit network.service entered failed state.
```

### 三、解决方法

对应网卡配置文件添加 MAC 地址行，即：

``` bash
# /etc/sysconfig/network-scripts/ifcfg-eth0 
... ...
HWADDR=00:xx:xx:xx:xx:xx
... ...
```

--EOF--
