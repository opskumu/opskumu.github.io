---
layout: post
title: "基于 CentOS7 的 Kubernetes 集群"
description: "Kubernetes"
categories: virtualization
tags: [docker,Kubernetes,etcd]
---

## 一、环境

相关主机

* master
    * 192.168.12.197
* minion
    * 192.168.12.198~232
* etcd
    * 192.168.12.233~236

相关软件

* OS
    * CentOS 7
* 软件版本：
    * kubernetes-0.19.3
    * etcd-2.0.9-2.el7.x86_64
    * docker-1.6.0-11.0.1.el7.centos.x86_64
    * flannel-0.2.0-7.el7.x86_64

## 二、部署和配置

### 2.1 Prerequisites

```
systemctl stop firewalld
systemctl disable firewalld
```

```
yum -y install ntp
systemctl start ntpd
systemctl enable ntpd
```

### 2.2 etcd Cluster

`etcd` 官方文档 [Clustering Guide](https://github.com/coreos/etcd/blob/master/Documentation/clustering.md) 定义集群有三种方式，本示例采用 `Static` 方法。

```
yum install etcd -y
```

* test-etcd1
    * 192.168.12.233
* test-etcd2
    * 192.168.12.234
* test-etcd3
    * 192.168.12.235

> etcd 集群主机数遵循 `2n + 1` 规则

这里以 `192.168.12.234` 为例，配置文件修改如下：

```
# grep -vE '^$|^#' /etc/etcd/etcd.conf
ETCD_NAME=test-etcd2                                    # 不同的 etcd 主机定义不同的 NAME
ETCD_DATA_DIR="/var/lib/etcd/test-etcd2.etcd"           # 定义 etcd 存储的数据目录
ETCD_LISTEN_PEER_URLS="http://0.0.0.0:2380"             # 定义 peer 绑定端口，即内部集群通信端口
ETCD_LISTEN_CLIENT_URLS="http://0.0.0.0:4001"           # 定义 client 绑定端口，即 client 访问通信端口
ETCD_INITIAL_ADVERTISE_PEER_URLS="http://192.168.12.234:2380" # 定义 etcd peer 初始化广播端口
ETCD_INITIAL_CLUSTER="test-etcd1=http://192.168.12.233:2380,test-etcd2=http://192.168.12.234:2380,test-etcd3=http://192.168.12.235:2380"
# ETCD_INITIAL_CLUSTER 定义集群成员
ETCD_INITIAL_CLUSTER_STATE="new"                        # 初始化状态使用 new，建立之后改此值为 existing
ETCD_INITIAL_CLUSTER_TOKEN="dev-etcd-cluster"           # etcd 集群名
ETCD_ADVERTISE_CLIENT_URLS="http://192.168.12.234:4001"
# 定义 client 广播端口，此处必须填写相应主机的 IP，不能填写 0.0.0.0，否则 etcd client 获取不了 etcd cluster 中的主机
```

配置完成之后，启动各主机 `etcd`

```
systemctl enable etcd
systemctl start etcd
```

查看当前集群成员

```
# etcdctl member list
a340818d006c60f: name=test-etcd1 peerURLs=http://192.168.12.233:2380 clientURLs=http://0.0.0.0:4001
75b057b0086f534b: name=test-etcd2 peerURLs=http://192.168.12.234:2380 clientURLs=http://0.0.0.0:4001
84562a66304940a1: name=test-etcd3 peerURLs=http://192.168.12.235:2380 clientURLs=http://0.0.0.0:4001
```

配置 `flannel` 通信网段

```
# etcdctl mk /coreos.com/network/config '{"Network":"172.17.0.0/16"}'
# etcdctl get /coreos.com/network/config
{"Network":"172.17.0.0/16"}
```

### 2.3 K8s Master 安装配置

```
yum -y install kubernetes
```

__注：__ CentOS7 源中最新版本是 0.15，如果需要使用最新的，替换 `/usr/bin` 下 K8s 的二进制文件即可。

Master 配置文件修改

```
$ grep -vE '^$|^#' /etc/kubernetes/apiserver
KUBE_API_ADDRESS="--address=0.0.0.0"
KUBE_API_PORT="--port=8080"
KUBELET_PORT="--kubelet_port=10250"
KUBE_ETCD_SERVERS="--etcd_servers=http://192.168.12.233:4001,http://192.168.12.234:4001,http://192.168.12.235:4001"
KUBE_SERVICE_ADDRESSES="--service-cluster-ip-range=10.254.0.0/16"
KUBE_ADMISSION_CONTROL="--admission_control=NamespaceAutoProvision,LimitRanger,ResourceQuota"
KUBE_API_ARGS=""
```

启动相关服务

```
for SERVICES in kube-apiserver kube-controller-manager kube-scheduler; do
    systemctl restart $SERVICES
    systemctl enable $SERVICES
    systemctl status $SERVICES
done
```

### 2.4 K8s Minions 安装配置

```
yum -y install kubernetes docker flannel bridge-utils
```

Minion 配置文件修改

```
# grep -vE '^$|^#' /etc/kubernetes/config
KUBE_LOGTOSTDERR="--logtostderr=true"
KUBE_LOG_LEVEL="--v=0"
KUBE_ALLOW_PRIV="--allow_privileged=false"
KUBE_MASTER="--master=http://192.168.12.197:8080"               # 指定 master 主机 IP
```

```
# grep -vE '^$|^#' /etc/kubernetes/kubelet
KUBELET_ADDRESS="--address=0.0.0.0"
KUBELET_PORT="--port=10250"
KUBELET_HOSTNAME="--hostname_override=192.168.12.198"           # 根据实际的 minion 对于 hostname 或者 IP 修改
KUBELET_API_SERVER="--api_servers=http://192.168.12.197:8080"   # 指定 master 主机 IP
KUBELET_ARGS="--pod-infra-container-image=<your_regestry_url:5000/google_containers/pause:0.8.0>"    # 指定私有 registry pull pause image
```

__注：__ pause:0.8.0 因为 Google 被 GFW 屏蔽，所以该镜像需要翻墙下载，下载不了的可以联系我 ^_^

```
# grep "FLANNEL_ETCD=" /etc/sysconfig/flanneld
FLANNEL_ETCD="http://192.168.12.233:4001,http://192.168.12.234:4001,http://192.168.12.235:4001,http://192.168.12.236:4001"
```

```
# cat /usr/lib/systemd/system/kubelet.service
... ...
[Service]
WorkingDirectory=/var/lib/kubelet
EnvironmentFile=-/etc/kubernetes/config
EnvironmentFile=-/etc/kubernetes/kubelet
ExecStart=/usr/bin/kubelet \
            $KUBE_LOGTOSTDERR \
            $KUBE_LOG_LEVEL \
            $KUBELET_API_SERVER \
            $KUBELET_ADDRESS \
            $KUBELET_PORT \
            $KUBELET_HOSTNAME \
            $KUBE_ALLOW_PRIV \
            $KUBELET_ARGS
LimitNOFILE=65535       # 设置 limit 限制
LimitNPROC=10240
Restart=on-failure
... ...
```

__注：__ docker、kube-proxy 这些默认已经设置好相应的 limit，无需再次修改

启动相关服务

```
systemctl daemon-reload
for SERVICES in kube-proxy kubelet flanneld docker; do
    systemctl restart $SERVICES
    systemctl enable $SERVICES
    systemctl status $SERVICES
done
```

如果出现 docker0 和 flannel 设置的 IP 地址不同，则可以采取如下方式修改：

```
systemctl stop docker
ifconfig docker0 down
brctl delbr docker0
systemctl start docker
```

## 三、集群状态

### 3.1 K8s Master

设置对于 nodes 的 label [目前环境有 dev 和 fat 两种]

```
kubectl label nodes 192.168.12.198 usetype=dev
```

关于 nodes label 具体可参考 [Node selection example](https://github.com/GoogleCloudPlatform/kubernetes/tree/master/examples/node-selection)

```
# kubectl get nodes
NAME             LABELS                                                 STATUS
192.168.12.198   kubernetes.io/hostname=192.168.12.198,usetype=dev      Ready
192.168.12.199   kubernetes.io/hostname=192.168.12.199,usetype=dev      Ready
192.168.12.200   kubernetes.io/hostname=192.168.12.200,usetype=dev      Ready
192.168.12.201   kubernetes.io/hostname=192.168.12.201,usetype=fat      Ready
192.168.12.202   kubernetes.io/hostname=192.168.12.202,usetype=fat      Ready
192.168.12.203   kubernetes.io/hostname=192.168.12.203,usetype=fat      Ready
... ...
```

### 3.2 etcd 集群

```
# etcdctl --peers 192.168.12.235:4001 member list
a340818d006c60f: name=test-etcd1 peerURLs=http://192.168.12.233:2380 clientURLs=http://0.0.0.0:4001
75b057b0086f534b: name=test-etcd2 peerURLs=http://192.168.12.234:2380 clientURLs=http://0.0.0.0:4001
84562a66304940a1: name=test-etcd3 peerURLs=http://192.168.12.235:2380 clientURLs=http://0.0.0.0:4001
```

### 3.3 Other

其它可以测试 pods、rc、service，这里不作介绍了，官方 github 上有相应的对应实例，0.19.3 直接使用 V1 的接口即可。

## 四、参考

* [flannel](https://github.com/coreos/flannel#flannel)
* [etcd Clustering Guide](https://github.com/coreos/etcd)
* [Node selection example](https://github.com/GoogleCloudPlatform/kubernetes/blob/master/examples/node-selection/README.md)
* [Getting started on CentOS](https://github.com/GoogleCloudPlatform/kubernetes/blob/master/docs/getting-started-guides/centos/centos_manual_config.md)
* [Creating a Kubernetes Cluster to Run Docker Formatted Container Images](https://access.redhat.com/articles/1353773)
* [Installing Kubernetes Cluster with 3 minions on CentOS 7 to manage pods and services](http://www.severalnines.com/blog/installing-kubernetes-cluster-minions-centos7-manage-pods-services)

--EOF--
