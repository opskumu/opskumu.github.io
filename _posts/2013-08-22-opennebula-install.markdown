---
layout: post
title: "OpenNebula在CentOS6.4安装备忘"
date: 2013-08-22 11:10
comments: true
categories: 虚拟化
keywords: OpenNebula4.2, CentOS6.4, 安装
---

### 简介

OpenNebula是一款为云计算而打造的开源工具箱。它允许你和Xen、KVM或VMware ESX一起建立和管理私有云，同时还提供Deltacloud适配器与Amazon EC2相配合来管理混合云。目前版本4.2，可支持XEN、KVM和VMware，以及实时存取EC2和 ElasticHosts，OpenNebula可以构建私有云、混合云、公开云。


### OpenNebula 4.2 相关

* [OpenNebula 4.2 Guides](http://opennebula.org/documentation:rel4.2)
* ruby >= 1.8.7 #　CentOS6.4默认支持版本
* OpenNebula[下载地址](http://downloads.opennebula.org/) 
    * CentOS选择对应版本即可__CentOS-6-opennebula-4.2.0-1.tar.gz__ 

### 更新配置源和update软件

``` bash
# rpm -ivh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
# rpm -ivh http://pkgs.repoforge.org/rpmforge-release/rpmforge-release-0.5.3-1.el6.rf.x86_64.rpm
# yum update
```

### 安装OpenNubula4.2

#### 解压下载的OpenNebula4.2软件包

* opennebula-server: main OpenNebula daemon, scheduler, etc
* opennebula-sunstone: OpenNebula Sunstone, EC2, OCCI
* opennebula-ozones: OpenNebula OZones
* opennebula-ruby: Ruby Bindings
* opennebula-java: Java Bindings
* opennebula-gate: Gate server that enables communication between VMs and OpenNebula
* opennebula-flow: Manages services and elasticity
* opennebula-node-kvm: meta-package that installs the oneadmin user, libvirt and kvm

可以直接配置OpenNebula yum源直接安装，也可以下载tar包安装

``` bash
# tar xf CentOS-6-opennebula-4.2.0-1.tar.gz
# cd opennebula-4.2.0-1
# yum localinstall opennebula-4.2.0-1.x86_64.rpm \
opennebula-common-4.2.0-1.x86_64.rpm opennebula-java-4.2.0-1.x86_64.rpm \
opennebula-gate-4.2.0-1.x86_64.rpm opennebula-flow-4.2.0-1.x86_64.rpm \
opennebula-server-4.2.0-1.x86_64.rpm opennebula-ozones-4.2.0-1.x86_64.rpm \
opennebula-ruby-4.2.0-1.x86_64.rpm opennebula-sunstone-4.2.0-1.x86_64.rpm -y
```

默认使用sqlite，如果使用mysql，则修改配置文件`/etc/one/oned.conf`，找到并修改如下行
``` bash
...
#DB = [ backend = "sqlite" ]
DB = [ backend = "mysql" ]

#Sample configuration for MySQL
DB = [ backend = "mysql",
       server  = "localhost",
       port    = 3306,
       user    = "oneadmin",
       passwd  = "123321",
       db_name = "opennebula" ]
...
```

### 启动相关服务

``` bash
# /etc/init.d/opennebula start
# /etc/init.d/opennebula-sunstone start
```

### 修改sunstone默认监听网址

``` bash
# lsof -i:9869  # 默认监听本地9869端口，如果连接需要修改为和外网通信地址
COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
ruby    22131 oneadmin    6u  IPv4 107999      0t0  TCP localhost:9869 (LISTEN)
# grep ':host' /etc/one/sunstone-server.conf
:host: 127.0.0.1
# sed -i '/:host/s/127.0.0.1/192.168.80.130/g' /etc/one/sunstone-server.conf
# grep ':host' /etc/one/sunstone-server.conf 
:host: 192.168.80.130
# /etc/init.d/opennebula-sunstone restart
```

### 浏览器登录测试

http://192.168.80.130:9869 

<img src="/images/OpenNebula_web.png" width="500" />

用户名和密码在安装的时候已经随机生成，oneadmin 是用户名，后面的一串是密码

``` bash
# cat /var/lib/one/.one/one_auth 
oneadmin:023c0bd7b09d0631074cc16aa61b7d60
```

### 参考文档

* [One install doc](http://opennebula.org/documentation:rel4.2:ignc#centos_platform_notes)
* [在CentOS6.4上安装和配置OpenNebula4.0](http://www.vpsee.com/2013/05/install-opennebula-4-0-on-centos-6-4/)
