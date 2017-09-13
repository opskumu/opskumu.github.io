---
layout: post
title: Docker 使用 Ceph RBD Volume
description: "Docker RBD Volume Plugin"
---

## 一、环境说明

* OS: CentOS 7.1
    * Ubuntu 14.04 下测试也是可行的
* ceph-common version: 0.94
    * 因为 rbd-docker-plugin 通过 `nbd map` 命令返回值获取 map 设备名，而 `0.80` 不支持，所以如果你是旧版本的 ceph-common 推荐升级至 `0.94`，或者修改 plugin 源码通过 `nbd showmapped` 过滤获取 map 设备名也是同样可行的
* Docker version: 1.8.2
    * 原则上 `1.8` 版本都支持，`1.9` 没有测试可行性
* rbd plugin: [rbd-docker-plugin](https://github.com/yp-engineering/rbd-docker-plugin)

## 二、环境构建

rbd-docker-plugin 需要手动编译，Go 的开发环境构建这里不再说明。

```
go get github.com/yp-engineering/rbd-docker-plugin
```

完成之后编译的二进制路径为 `$GOPATH/bin/rbd-docker-plugin`，拷贝到相应测试主机即可。


安装必要的组件：

```
yum install librados2-devel librbd1-devel ceph-common xfsprogs -y
```

如果你有现成的 ceph 环境直接测试即可，这里我使用 docker 创建本地 ceph 测试环境：

```
docker run -d --net=host -e MON_IP=当前主机IP -e CEPH_NETWORK=当前主机所在网段 -v /etc/ceph:/etc/ceph -v /var/lib/ceph/:/var/lib/ceph ceph/demo
```

> 关于 ceph/demo 镜像的更多说明可以参考 [ceph/ceph-docker/demo](https://github.com/ceph/ceph-docker/tree/master/demo)

## 三、运行 rbd docker plugin

```
# ceph osd pool create docker 128
pool 'docker' created
# ceph auth get-or-create client.docker mon 'allow r' osd 'allow class-read object_prefix rbd_children, allow rwx pool=docker' -o /etc/ceph/ceph.client.docker.keyring
# RBD_DOCKER_PLUGIN_DEBUG=1 rbd-docker-plugin --create --user=docker --pool=docker
rbd-volume-plugin: 2016/02/17 10:58:00 main.go:70: INFO: Setting up Ceph Driver for PluginID=rbd, cluster=, user=docker, pool=docker, mount=/var/lib/docker-volumes, config=
rbd-volume-plugin: 2016/02/17 10:58:00 driver.go:83: INFO: newCephRBDVolumeDriver: setting base mount dir=/var/lib/docker-volumes/rbd
rbd-volume-plugin: 2016/02/17 10:58:00 driver.go:496: INFO: connecting to Ceph and default pool context
rbd-volume-plugin: 2016/02/17 10:58:00 main.go:82: INFO: Creating Docker VolumeDriver Handler
rbd-volume-plugin: 2016/02/17 10:58:00 main.go:86: INFO: Opening Socket for Docker to connect: /run/docker/plugins/rbd.sock
... ...
```

> 也可不创建 docker pool，默认使用 rbd pool，不创建 docker pool 则只需运行如下命令即可

```
# RBD_DOCKER_PLUGIN_DEBUG=1 rbd-docker-plugin --create
```

## 四、docker 挂载 rbd volume 测试

```
# docker run --volume-driver=rbd --volume foo:/mnt/foo -it busybox sh
/ # df -Th | grep -w '/mnt/foo' # 显示设备 rbd0 挂载在 /mnt/foo 命令下，挂载成功
/dev/rbd0            xfs            20.0G     32.6M     20.0G   0% /mnt/foo
```

rbd docker plugin driver 会做如下操作(前提是当前镜像不存在):

* 1、创建一个 20GB 的镜像
* 2、map image 并格式化为 XFS 文件系统
* 3、挂载到对应容器

如果容器启动没有添加 `--rm` 选择则容器退出后，镜像依然可以被其它容器复用(除非 docker run 的时候添加了 `--rm` 选项并且 rbd-docker-plugin 添加了 `--remove` 选项才会执行删除操作，否则如果只是添加了 `--rm` 的选项，plugin driver 也只是 rename image 而并不是直接 rm)。

> 实际测试过程中如果使用的不是默认的 pool rbd，rename 的过程出现错误，应该是 plugin 的 bug，修改代码执行 `rbd rename` 时添加 `--dest-pool` 选项即可。

## 五、参考文档

* [Getting Started With the Docker RBD Volume Plugin](http://www.sebastien-han.fr/blog/2015/08/17/getting-started-with-the-docker-rbd-volume-plugin/)
* [Ceph Rados Block Device Docker VolumeDriver Plugin](https://github.com/yp-engineering/rbd-docker-plugin)

--EOF--
