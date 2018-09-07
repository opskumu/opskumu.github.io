---
layout: post
title: Kubernetes 版本升级标注
date: 2018-09-07 16:42 +0800
---

作为从 0.14.x 版本开始追 Kubernetes 的我来说，有时候也不得不感慨，Kubernetes 社区的升级步伐越来越让人赶不上了，版本追的实在有些累了。但是，有些功能特性不升级还不行，某些版本的向下兼容性做的又不太好，导致每次版本变化较大的升级都让人提心吊胆。

本文主要整理 Kubernetes 版本升级要点，从 `1.5.x` 版本开始，之前的版本升级可以参考官方说明。Google 云在 Kubernetes 升级的时候说明，不要跨大版本升级，安全起见，建议一个版本一个版本升级。

> Note: You cannot upgrade your cluster master more than one minor version at a time. For example, you can upgrade a cluster from version 1.6.x to 1.7.x, but not directly from 1.6.x to 1.8.x. For more information, refer to Versioning and Upgrades. [Upgrading a Cluster](https://cloud.google.com/kubernetes-engine/docs/how-to/upgrading-a-cluster)

## 1.5.x --> 1.6.x

之所以从版本 1.5.x 升级到 1.6.x 开始说起，是因为这个大版本更新变动较大，升级注意点较多。因为牵扯一些兼容性的问题，这次升级需要在停服的情况下进行。

* [WARNING: etcd backup strongly recommended](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.6.md#warning-etcd-backup-strongly-recommended）

### etcd 备份和数据迁移

从 1.6.0 版本开始，Kubernetes 默认使用 etcd v3，虽然可以通过选项设置继续使用 etcd v2，但是还是建议使用 etcd v3 版本，未来的 Kubernetes 版本也会废弃对 etcd v2 的支持。

etcd 的版本升级以及数据版本迁移详见以下两篇文档：

* [Upgrade etcd from 2.3 to 3.0](https://github.com/etcd-io/etcd/blob/master/Documentation/upgrades/upgrade_3_0.md#preparation)
* [Migrating applications, clusters, and Kubernetes to etcd v3](https://coreos.com/blog/migrating-applications-etcd-v3.html)

a、关闭服务

```
service etcd stop
```

b、数据备份

```
etcdctl backup \
      --data-dir /var/lib/etcd \
      --backup-dir /tmp/etcd_backup
```

c、数据迁移

```
ETCDCTL_API=3 etcdctl migrate --data-dir=${data_dir}
```

d、启动服务

```
service etcd start
```

当然，如果你需要继续使用 etcd v2，那么可以针对 `apiserver` 添加以下配置：

```
--storage-backend=etcd2 --storage-media-type=application/json
```

> 为什么推荐使用 etcd v3，一个原因是后续版本的兼容问题，另外一个就是性能原因。从 1.6.0 版本，通过 etcd v3，Kubernetes 已支持 5000 个节点。

### Docker 版本支持

从 1.6.0 开始，不再支持 Docker 1.9.x，1.10.3、1.11.2、1.12.6 验证通过。

另外一个需要用户明白的是，1.6.0 Kubelet 默认启用 Docker-CRI 实现，因此老版本 Kubelet 创建的容器和当前的版本是不支持的，官方建议的做法是在升级前，提前通过 `drain` 旧版本的节点，否则默认 Kubelet 会自动重启所有的容器。

> https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.6.md#node-components
> * __Kubelet with the Docker-CRI implementation__
>   * The Docker-CRI implementation is enabled by default.
>   * It is not compatible with containers created by older Kubelets. It is recommended to drain your node before upgrade. If you choose to perform an in-place upgrade, the Kubelet will automatically restart all Kubernetes-managed containers on the node.
>   * It is not compatible with CNI plugins that do not conform to the error handling behavior in the spec. The plugins are being updated to resolve this issue (#43488). You can disable CRI explicitly (--enable-cri=false) as a temporary workaround.  
>       * The standard bridge plugin have been validated to interoperate with the new CRI + CNI code path.
>       * If you are using plugins other than bridge, make sure you have updated custom plugins to the latest version that is compatible.

## 1.6.x --> 1.7.x

1.7 版本是针对安全、有状态服务以及可扩展功能里程碑版本，[1.7.0 Major Themes](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.7.md#major-themes)。

根据文档 [Action Required Before Upgrading](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.7.md#action-required-before-upgrading) 描述，如果你之前使用过 NetwokPolicy，可以参考 [
Network](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.7.md#network) 说明，其它版本选项没有大的变动。

## 1.7.x --> 1.8.x

在升级之前参考 [1.8.0 Before Upgrading](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.8.md#before-upgrading) 官方文档，有以下几个点值得注意：

* 默认 1.8.x 在节点启用 swap 的时候 Kubelet 会启动失败，需要额外添加选项 `--fail-swap-on=false`
* ThirdPartyResource（TPR）API 被移除，需迁移至 [CustomResourceDefinition（CRD）](https://kubernetes.io/docs/tasks/access-kubernetes-api/migrate-third-party-resource/)
* Kubelet 指定 master 节点的选项 `api-servers` 被废弃，需要通过 `--kubeconfig` 替换。

### Docker 版本支持

Docker 1.11.2、1.12.6、1.13.1 以及 17.03.2 验证通过。

## 1.8.x --> 1.9.x

* [1.9.0 Before Upgrading](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.9.md#before-upgrading)
    * `--portal-net`、`--service-node-ports` 选项在 `apiserver` 中被移除
    * `--network-plugin-dir` 选项在 `kubelet` 中被移除

## 1.9.x --> 1.10.x

* [1.10.0 Before Upgrading](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.10.md#before-upgrading)
    * In-place node upgrades to this release from versions 1.7.14, 1.8.9, and 1.9.4 are not supported if using subpath volumes with PVCs. Such pods should be drained from the node first.
        * 从这句话来看，其实跨大版本升级应该是可以的，不过按部就班升级总归是没有错的
    * 最小版本的 Docker 支持版本为 1.11，1.10 不再支持
    * `kubelet` 中 `--require-kubeconfig` 选项已被废弃
    * `apiserver` 中 `--insecure-bind-address`、`--insecure-port` 废弃，并会在未来版本移除，使用 `--secure-port`、`--bind-address` 替换
    * `apiserver` 中使用 `--enable-admission-plugins`、` --disable-admission-plugins` 选项替换 `--admission-control`

以上只是摘取笔者觉得相对重要的点加以说明，并不会覆盖所有的选项。每一次大版本升级还是建议熟读官方说明以及升级前充分做好备份，把风险和影响降到最低。升级有风险，操作需谨慎，敬畏精神不可丢。
