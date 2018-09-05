---
layout: post
title: Docker OverlayFS 驱动 
date: 2018-09-05 16:30 +0800
---

本文为 [Use the OverlayFS storage driver](https://docs.docker.com/storage/storagedriver/overlayfs-driver/) 译文，一直以来对 OverlayFS 工作机制不太理解，趁着间隙把 Docker 官方的文档看了一遍。虽然不涉及到底层的技术实现，但是基本的工作机制，通过这篇文章差不多可以了解个大概了。

---

OverlayFS 是类似 AUFS 的现代联合文件系统（union filesystem），但是速度更快，实现更简单。针对 OverlayFS 提供了两个存储驱动：原始 overlay，以及更新更稳定的 overlay2。

> Note：如果你使用 OverlayFS，使用 `overlay2` 而不是 `overlay` 驱动，因为 `overlay2` 在 inode 利用率上更高效。要使用新的驱动，你需要系统内核版本 4.0 或者更高版本，除非你是使用 RHEL 或者 CentOS 用户，此时需要内核版本在 3.10.0-514 或更高版本。

## 一、先决条件

除了上述的系统内核版本，使用 OverlayFS 还需要以下条件：

* 因为 inode 以及后续的 Docker 版本兼容问题，不推荐使用 `overlay`，满足条件下优先使用 `overlay2`
* 以下文件系统支持：
    * ext4（只支持 RHEL 7.1）
    * xfs（RHEL 7.2 或更高版本），`d_type=true` 必须开启。使用 `xfs_info` 验证 `ftype` 选项是否为 `1`。
* 修改 Docker 存储驱动会使已存在的容器和镜像不可访问，可以提前使用 `docker save` 保存镜像或推送到 Docker Hub（也可以是内部私有镜像仓库），防止镜像丢失

```
mkfs -t xfs -n ftype=1 /PATH/TO/DEVICE  # 开启 d_type 选项
xfs_info /PATH/TO/DEVICE | grep ftype   # 验证是否已支持
```

## 二、配置 `overlay` 或 `overlay2` 驱动

满足使用 OverlayFS 的条件后，通过 `/etc/docker/daemon.json` 加入 `overlay2` 存储配置项，重启 docker daemon 即可生效。

```
{
  "storage-driver": "overlay2"
}
```

## 三、`overlay2` 驱动是如何工作的

OverlayFS 层（layers） 在单个 Linux 主机上分为两个目录，并且将它们呈现为单个目录。这些目录统称为层（layers），统一过程称为联合挂载（union mount）。OverlayFS 把下层目录称为 `lowerdir`，上层目录称为 `upperdir`，统一视图通过称为 `merged` 自身目录暴露。

`overlay` 驱动仅适用单个 lower OverlayFS 层，因此需要通过硬链接来实现多层镜像，`overlay2` 驱动原生支持 128 个 lower OverlayFS 层。这个功能为与层相关的命令如 `docker build` 和 `docker commit` 提供了更好的性能，并且在后备文件系统上消耗更少的 inode。

### 3.1 磁盘上的镜像和容器层

当通过 `docker pull ubuntu` 下载一个五层镜像后，你可以在 `/var/lib/docker/overlay2` 目录下看到 6 个目录。

```
$ ls -l /var/lib/docker/overlay2

total 24
drwx------ 5 root root 4096 Jun 20 07:36 223c2864175491657d238e2664251df13b63adb8d050924fd1bfcdb278b866f7
drwx------ 3 root root 4096 Jun 20 07:36 3a36935c9df35472229c57f4a27105a136f5e4dbef0f87905b2e506e494e348b
drwx------ 5 root root 4096 Jun 20 07:36 4e9fa83caff3e8f4cc83693fa407a4a9fac9573deaf481506c102d484dd1e6a1
drwx------ 5 root root 4096 Jun 20 07:36 e8876a226237217ec61c4baf238a32992291d059fdac95ed6303bdff3f59cff5
drwx------ 5 root root 4096 Jun 20 07:36 eca1e4e1694283e001f200a667bb3cb40853cf2d1b12c29feda7422fed78afed
drwx------ 2 root root 4096 Jun 20 07:36 l
```

新的 `l`（小写 `L`） 目录包含缩短的层标识符作为软链接，这些标识符用于避免 `mount` 命令参数页面大小限制。

```
$ ls -l /var/lib/docker/overlay2/l

total 20
lrwxrwxrwx 1 root root 72 Jun 20 07:36 6Y5IM2XC7TSNIJZZFLJCS6I4I4 -> ../3a36935c9df35472229c57f4a27105a136f5e4dbef0f87905b2e506e494e348b/diff
lrwxrwxrwx 1 root root 72 Jun 20 07:36 B3WWEFKBG3PLLV737KZFIASSW7 -> ../4e9fa83caff3e8f4cc83693fa407a4a9fac9573deaf481506c102d484dd1e6a1/diff
lrwxrwxrwx 1 root root 72 Jun 20 07:36 JEYMODZYFCZFYSDABYXD5MF6YO -> ../eca1e4e1694283e001f200a667bb3cb40853cf2d1b12c29feda7422fed78afed/diff
lrwxrwxrwx 1 root root 72 Jun 20 07:36 NFYKDW6APBCCUCTOUSYDH4DXAT -> ../223c2864175491657d238e2664251df13b63adb8d050924fd1bfcdb278b866f7/diff
lrwxrwxrwx 1 root root 72 Jun 20 07:36 UL2MW33MSE3Q5VYIKBRN4ZAGQP -> ../e8876a226237217ec61c4baf238a32992291d059fdac95ed6303bdff3f59cff5/diff
```

最底层包含一个名为 `link` 的文件，其中包含缩短标识符的名称，以及一个包含镜像内容的名为 `diff` 的目录。

```
$ ls /var/lib/docker/overlay2/3a36935c9df35472229c57f4a27105a136f5e4dbef0f87905b2e506e494e348b/
diff  link
$ cat /var/lib/docker/overlay2/3a36935c9df35472229c57f4a27105a136f5e4dbef0f87905b2e506e494e348b/link
6Y5IM2XC7TSNIJZZFLJCS6I4I4
$ ls  /var/lib/docker/overlay2/3a36935c9df35472229c57f4a27105a136f5e4dbef0f87905b2e506e494e348b/diff
bin  boot  dev  etc  home  lib  lib64  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var
```

第二下层，以及更高层，包含一个名为 `lower` 的文件，表示其父级，以及包含这层镜像内容的名为 `diff` 的目录。它包含一个 `merged` 目录，包括父层以及自身的统一内容，以及 OverlayFS 自身使用的 `work` 目录。

```
$ ls /var/lib/docker/overlay2/223c2864175491657d238e2664251df13b63adb8d050924fd1bfcdb278b866f7
diff  link  lower  merged  work
$ cat /var/lib/docker/overlay2/223c2864175491657d238e2664251df13b63adb8d050924fd1bfcdb278b866f7/lower
l/6Y5IM2XC7TSNIJZZFLJCS6I4I4
$ ls /var/lib/docker/overlay2/223c2864175491657d238e2664251df13b63adb8d050924fd1bfcdb278b866f7/diff/
etc  sbin  usr  var
```

通过 `mount` 命令查看 Docker 使用 `overlay2` 存储驱动的挂载情况：

```
$ mount | grep overlay
overlay on /var/lib/docker/overlay2/9186877cdf386d0a3b016149cf30c208f326dca307529e646afce5b3f83f5304/merged
type overlay (rw,relatime,
lowerdir=l/DJA75GUWHWG7EWICFYX54FIOVT:l/B3WWEFKBG3PLLV737KZFIASSW7:l/JEYMODZYFCZFYSDABYXD5MF6YO:l/UL2MW33MSE3Q5VYIKBRN4ZAGQP:l/NFYKDW6APBCCUCTOUSYDH4DXAT:l/6Y5IM2XC7TSNIJZZFLJCS6I4I4,
upperdir=9186877cdf386d0a3b016149cf30c208f326dca307529e646afce5b3f83f5304/diff,
workdir=9186877cdf386d0a3b016149cf30c208f326dca307529e646afce5b3f83f5304/work)
```

`rw` 选项显示 `overlay` 是读写方式挂载的。

## 四、`overlay` 驱动是如何工作的

OverlayFS 层（layers） 在单个 Linux 主机上分为两个目录，并且将它们呈现为单个目录。这些目录统称为层（layers），统一过程称为联合挂载（union mount）。OverlayFS 把下层目录称为 `lowerdir`，上层目录称为 `upperdir`，统一视图通过称为 `merged` 自身目录暴露。

下图展示了一个 Docker 镜像和一个 Docker 容器如何分层。镜像层术语 `lowerdir`，容器层术语 `upperdir`。统一视图通过名为 `merged` 的目录暴露。

![](images/overlay_constructs.jpg)

在镜像层和容器层都包含相同文件时，则容器层为主，并且掩盖镜像层同一个文件的存在。

`overlay` 驱动仅适用于两层，这意味着多层镜像不能实现多个 OverlayFS 层。取而代之，每个镜像层都在 `/var/lib/docker/overlay` 下实现自己的目录。通过硬链接引用与底层共享数据的方式来节省空间。从 Docker 1.10 开始，镜像层 IDs 不再对应于 `/var/lib/docker` 中的目录名。

为了创建一个容器，`overlay` 驱动组合顶层的目录以及容器的新目录。镜像的顶层是叠加层中的 `lowerdir`，并且是只读挂载的。容器的新目录是 `upperdir` 并且是可写的。

### 4.1 磁盘上的镜像和容器层

`docker pull` 命令暂时了一个 Docker 主机下载一个包含五层的 Docker 镜像。

```
$ docker pull ubuntu

Using default tag: latest
latest: Pulling from library/ubuntu

5ba4f30e5bea: Pull complete
9d7d19c9dc56: Pull complete
ac6ad7efd0f9: Pull complete
e7491a747824: Pull complete
a3ed95caeb02: Pull complete
Digest: sha256:46fb5d001b88ad904c5c732b086b596b92cfb4a4840a3abd0e35dbb6870585e4
Status: Downloaded newer image for ubuntu:latest
```

#### 镜像层

每个镜像层都在 `/var/lib/docker/overlay/` 目录下有自己的目录。

```
$ ls -l /var/lib/docker/overlay/

total 20
drwx------ 3 root root 4096 Jun 20 16:11 38f3ed2eac129654acef11c32670b534670c3a06e483fce313d72e3e0a15baa8
drwx------ 3 root root 4096 Jun 20 16:11 55f1e14c361b90570df46371b20ce6d480c434981cbda5fd68c6ff61aa0a5358
drwx------ 3 root root 4096 Jun 20 16:11 824c8a961a4f5e8fe4f4243dab57c5be798e7fd195f6d88ab06aea92ba931654
drwx------ 3 root root 4096 Jun 20 16:11 ad0fe55125ebf599da124da175174a4b8c1878afe6907bf7c78570341f308461
drwx------ 3 root root 4096 Jun 20 16:11 edab9b5e5bf73f2997524eebeac1de4cf9c8b904fa8ad3ec43b3504196aa3801
```

镜像层的目录包含该层唯一的文件以及与较低层共享数据的硬链接，以此来高效利用磁盘空间。

```
$ ls -i /var/lib/docker/overlay/38f3ed2eac129654acef11c32670b534670c3a06e483fce313d72e3e0a15baa8/root/bin/ls
19793696 /var/lib/docker/overlay/38f3ed2eac129654acef11c32670b534670c3a06e483fce313d72e3e0a15baa8/root/bin/ls
$ ls -i /var/lib/docker/overlay/55f1e14c361b90570df46371b20ce6d480c434981cbda5fd68c6ff61aa0a5358/root/bin/ls
19793696 /var/lib/docker/overlay/55f1e14c361b90570df46371b20ce6d480c434981cbda5fd68c6ff61aa0a5358/root/bin/ls
```

#### 容器层

容器层也是在 `/var/lib/docker/overlay/` 目录下。如果你使用 `ls -l` 命令列出运行容器的子目录，可以看到三个目录和一个文件存在：

```
$ ls -l /var/lib/docker/overlay/<directory-of-running-container>

total 16
-rw-r--r-- 1 root root   64 Jun 20 16:39 lower-id
drwxr-xr-x 1 root root 4096 Jun 20 16:39 merged
drwxr-xr-x 4 root root 4096 Jun 20 16:39 upper
drwx------ 3 root root 4096 Jun 20 16:39 work
```

`lower-id` 文件包含了容器所基于的镜像的顶层 ID，即 OverlayFS `lowerdir`。

```
$ cat /var/lib/docker/overlay/ec444863a55a9f1ca2df72223d459c5d940a721b2288ff86a3f27be28b53be6c/lower-id
55f1e14c361b90570df46371b20ce6d480c434981cbda5fd68c6ff61aa0a5358
```

`upper` 目录包含容器读写层的内容，对应 OverlayFS 中的 `upperdir`。

`merged` 目录是 `lowerdir` 和 `upperdir` 的联合挂载，包含正在运行的容器文件系统视图。

`work` 目录是 OverlayFS 内部目录。

通过 `mount` 命令查看 Docker 使用 `overlay` 存储驱动的挂载情况：

```
$ mount | grep overlay

overlay on /var/lib/docker/overlay/ec444863a55a.../merged
type overlay (rw,relatime,lowerdir=/var/lib/docker/overlay/55f1e14c361b.../root,
upperdir=/var/lib/docker/overlay/ec444863a55a.../upper,
workdir=/var/lib/docker/overlay/ec444863a55a.../work)
```

`rw` 选项显示 `overlay` 是读写方式挂载的。

## 五、容器是如何通过 `overlay` 或 `overlay2` 读写的

### 5.1 读取文件

考虑三个容器通过 `overlay` 打开文件读取的场景。

* 容器层中不存在该文件：如果容器打开读取一个并不存在容器层（`upperdir`），则从镜像层（`lowerdir`）读取该文件。这会导致很少的性能开销。
* 文件仅存在于容器层：如果容器打开读取一个存在于容器层（`upperdir`）但不存在于镜像层（`lowerdir`）的文件，则直接从容器层中读取该文件。
* 该文件同时存在于容器层和镜像层：如果容器打开读取一个同时存在于容器层（`upperdir`）和镜像层（`lowerdir`）的文件，则容器层（`upperdir`）会覆盖镜像层（`lowerdir`） 相同名字的文件。

### 5.2 修改文件或目录

同样分三个场景来介绍修改。

* 第一次写入文件：容器第一次写入现有文件时，这个文件还不存在于容器层（`upperdir`）。`overlay`/`overlay2` 驱动程序从镜像层（`lowerdir`）执行一个 `copy_up` 操作到容器层（`upperdir`）。然后，容器将更改写入容器层中的文件的新副本。但是，OverlayFS 工作在文件级别而不是块级别，意味着所有 OverlayFS `copy_up` 操作都会复制整个文件，即使文件非常大，并且只修改了其中的一小部分。这就对容器写入性能产生显著的影响。不过，有两件事值得注意：
    * `copy_up` 操作仅在第一次写入文件时发生，对同一文件的后续写入操作只对已复制到容器的文件副本进行操作。
    * OverlayFS 仅适用于两层，意味着它性能应该是优于 AUFS 的，当搜索多个层的镜像文件时，AUFS 会出现明显的延迟。这个优势适用于 `overlay` 和 `overlay2`，`overlayfs2` 在初始读取时的性能略低于 `overlayfs`，因为它会查看更多层级，但是它会缓存结果。
* 删除文件或者目录：在容器中删除文件时，会在容器层（`upperdir`）中创建一个 whiteout 文件。镜像层（`lowerdir`）中文件的版本并不会被删除（因为 `lowerdir` 是只读的）。但是，whiteout 文件会阻止其在容器中可用。当在容器中删除目录时，会在容器层（`upperdir`）中创建一个 opaque 目录。它的工作机制同 whiteout，并且有效地防止目录被访问，即使它仍然存在于镜像层（`lowerdir`）。
* 重命名目录：仅当源路径和目标路径都在顶层时，才允许目录调用 `rename(2)`，否则会返回 `EXDEV` error（"cross-device link not permitted"）。

## 六、OverlayFS 和 Docker 性能

`overlay2` 和 `overlay` 驱动比 `aufs` 和 `devicemapper` 拥有更好的性能。在某些情况下，`overlay2` 的性能表现可能比 `btrfs` 还要好。不过要注意以下几点：

* __Page Caching__： OverlayFS 支持页级别的缓存共享。多个容器访问同样的文件共享此文件的同一个页缓存。这个特性使得 `overlay` 和 `overlay2` 驱动高效利用内存以及高密度使用案例的优先选择如 PaaS。
* __copy_up__： 同 AUFS 一样，容器第一次写入文件时，OverlayFS 会有一个 copy-up 的操作。这会增加写入操作的延迟，特别是大文件操作。不过，一旦文件已经被复制，后续文件的写操作都是发生在上层的，不再会有 copy-up 的操作。OverlayFS 的 `copy_up` 比 AUFS 同样的操作要更快，因为 AUFS 比 OverlayFS 拥有更多的层级，如果在多个 AUFS 层级搜索可能会造成大的延迟。`overlay2` 也支持多层，但通过缓存减轻了性能损失。
* __Inode limits__：使用 `overlay` 存储驱动会导致过多的 inode 损耗。特别是 Docker 主机上存在大量的镜像和容器时尤为明显。格式化文件系统增加可用的 inode 数量是唯一的解决方式。为了避免这个问题，因此建议尽可能的使用 `overlay2`。

### 6.1 性能最佳实践

以下通用性能最佳实践也适用于 OverlayFS。

* 使用更快的存储：使用 SSD
* 针对写频繁工作负载使用 volumes 功能：Volumes 为写入频繁的工作负载提供了最佳和最可预测的性能。这是因为它们绕过存储驱动，并且避免 thin provisioning 和写时复制的任何潜在开销。Volumes 还有其它好处，如允许容器间共享数据以及持久化数据存储等。

## 七、OverlayFS 兼容性限制

* __open(2)__：OverlayFS 只实现了 POSIX 标准的子集。这可能导致某些 OverlayFS 操作破坏了 POSIX 标准。其中一个操作就是 copy-up 操作。假设你的应用调用 `fd1=open("foo", O_RDONLY)` 和 `fd2=open("foo", O_RDWR)`。在这个案例中，你的应用期望 `fd1` 和 `fd2` 引用同一个文件。但是，因为发生了 copy-up 操作导致第二次调用 `open(2)`，文件描述符指向的是不同的文件。`fd1` 继续引用镜像层（`lowerdir`）而 `fd2` 引用的文件在容器层（`upperdir`）。解决方式是 `touch` 这些文件，引发 copy-up 操作发生。所有的后续 `open(2)` 操作无论是读写访问模式都引用容器层(`upperdir`)的文件。
    * `yum` 是已知受影响的，除非 `yum-plugin-ovl` 已经安装了。如果 `yum-plugin-ovl` 包在你的发行版中不可用如 RHEL/CentOS 6.8 或 7.2，你可能需要在运行 `yum install` 前执行 `touch /var/lib/rpm/*`。`yum-plugin-ovl` 软件包实现了针对 `yum` 的 `touch` 变通方案。
* __rename(2)__：OverlayFS 不完全支持 `rename(2)` 系统调用。你的应用需要检测它的失败以及返回 "copy and unlink" 策略。

--EOF--
