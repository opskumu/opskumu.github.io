---
layout: post
title: "OpenNebula Windows Server镜像制作"
date: 2013-09-22 11:01
comments: true
categories: 虚拟化
keywords: OpenNebula, Windows
---

Windows镜像制作的方法和Linux其实类似，主要注意的是，Windows需要安装virtio设备驱动。以下主要介绍驱动的安装方法，其它类似镜像导入和模板制作都和Linux方法一样。

### 创建虚拟机镜像文件
``` bash
# qemu-img create -f qcow2 win_2008.qcow2 50G
```


### 安装虚拟机
网卡推荐使用e1000，磁盘类型使用virtio。使用virtio需要安装virtio设备驱动，否则默认是不能识别virtio设备的。

#### 下载fedora项目组最新的virtio驱动iso

* [virtio官网地址](http://alt.fedoraproject.org/pub/alt/virtio-win/latest/images/bin/) 目前的提供virtio最新驱动iso为 [virtio-win-0.1-65.iso](http://alt.fedoraproject.org/pub/alt/virtio-win/latest/images/bin/virtio-win-0.1-65.iso) ，下载之后使用如下方式安装

``` bash
# kvm -m 2048 -cdrom cn_windows_server_2008_r2.iso \
-drive file=/data/virtio-win-0.1-65.iso,media=cdrom \
-drive file=win_2008.qcow2,if=virtio \
-net nic,model=e1000 -net tap,ifname=tap0,script=no \
-boot d -nographic -vnc :0
```

客户端通过VNC连接，启动之后virtio的硬盘是不能被识别的，如下图

<center><img src="/images/OpenNebula/OpenNebula_win1.jpg" width="500" /></center>

<p></p>
此时，需要安装virtio驱动，点击加载驱动程序，Windows Server 2008对应win7版本

<center><img src="/images/OpenNebula/OpenNebula_win2.jpg" width="500" /></center>
<p></p>

选择之后，按提示操作安装，安装完之后就会识别之前建立的磁盘

<center><img src="/images/OpenNebula/OpenNebula_win3.jpg" width="500" /></center>
<p></p>

磁盘识别之后就可以之后的完整系统安装，关于Windows Server 2008的安装步骤这里不再赘述。

--EOF--
