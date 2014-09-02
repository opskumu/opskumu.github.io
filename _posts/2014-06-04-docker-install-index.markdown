---
layout: post
title: "开始docker"
date: 2014-06-04 17:03
comments: true
categories: 虚拟化
---

Dokcer的基本原理这里不作介绍，网上已经说的很清楚了，这里就不废话了，可以参考以下几篇文章的介绍。

* [Docker Getting Start: Related Knowledge ](http://tiewei.github.io/cloud/Docker-Getting-Start/)
* [谁是容器中的“战斗机”？Docker与Chef、LXC等容器对比](http://code.csdn.net/news/2819773)
* [Docker：利用Linux容器实现可移植的应用部署](http://www.infoq.com/cn/articles/docker-containers)

 
## Docker install
 
Docker的安装非常简单，这里只介绍Ubuntu 14.04的安装，其他发行版本的安装可以参考官网手册。
 
``` bash
$ sudo apt-get update
$ sudo apt-get install docker.io
$ sudo ln -sf /usr/bin/docker.io /usr/local/bin/docker
```
 
获取当前docker版本
 
``` bash
$ sudo docker version
Client version: 0.9.1
Go version (client): go1.2.1
Git commit (client): 3600720
Server version: 0.9.1
Git commit (server): 3600720
Go version (server): go1.2.1
Last stable version: 0.11.1, please update docker
```
 
* [Docker install on ubuntu](http://docs.docker.io/installation/ubuntulinux/)
 
## Docker images
 
* [Docker index](https://index.docker.io/) Docker镜像首页，包括官方镜像和其它公开镜像
 
### Search index images
 
``` bash
$ sudo docker search ubuntu
```
 
### Pull images
 
``` bash
$ sudo docker pull ubuntu # remote index 获取ubuntu官方镜像
$ sudo docker images # 查看当前镜像列表
REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
ubuntu              13.10               5e019ab7bf6d        3 weeks ago         180 MB
ubuntu              saucy               5e019ab7bf6d        3 weeks ago         180 MB
ubuntu              12.04               74fe38d11401        3 weeks ago         209.6 MB
... ...
```
 
Docker index被墙？[FUCK GFW!!! %&$#&...]，可绑定host解决，亲测可用，不过可能还是比较慢。
 
``` bash
# 加入以下内容到/etc/hosts下就可以了
54.234.135.251  get.docker.io
54.234.135.251  cdn-registry-1.docker.io
```
 
### Running an interactive shell
 
``` bash
$ sudo docker run -i -t ubuntu:14.04 /bin/bash
```
 
* ubuntu会有多个版本，通过指定tag来启动特定的版本[image]:[tag]
 
``` bash
$ sudo docker ps # 查看当前运行的容器, ps -a列出当前系统所有的容器
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
6c9129e9df10        ubuntu:14.04        /bin/bash           6 minutes ago       Up 6 minutes                            cranky_babbage
```
 
* 退出：`Ctrl-D` or `exit`
* detach：`Ctrl-p + Ctrl-q`
* attach: `docker attach CONTAINER ID`

--EOF--
