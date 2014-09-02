---
layout: post
title: "docker相关命令"
date: 2014-07-19 16:13
comments: true
categories: 虚拟化
---

## docker help

容器日常的操作过程中，熟练使用docker的相关命令还是非常重要的，推荐把docker的命令熟读并实践，这样对docker相关功能的理解会很有帮助的。


``` bash
$ sudo docker   # docker命令帮助
Usage: docker [OPTIONS] COMMAND [arg...]
 -H=[unix:///var/run/docker.sock]: tcp://host:port to bind/connect to or unix://path/to/socket to use

A self-sufficient runtime for linux containers.

Commands:
    attach    Attach to a running container                 # 当前shell下attach连接指定运行镜像
    build     Build an image from a Dockerfile              # 通过Dockerfile定制镜像
    commit    Create a new image from a container's changes # 提交当前容器为新的镜像
    cp        Copy files/folders from the containers filesystem to the host path
              # 从容器中拷贝指定文件或者目录到宿主机中
    diff      Inspect changes on a container's filesystem   # 查看docker容器变化
    events    Get real time events from the server          # 从docker服务获取容器实时事件
    export    Stream the contents of a container as a tar archive   
              # 导出容器的内容流作为一个tar归档文件[对应import]
    history   Show the history of an image  # 展示一个镜像形成历史
    images    List images                   # 列出系统当前镜像
    import    Create a new filesystem image from the contents of a tarball 
              # 从tar包中的内容创建一个新的文件系统映像[对应export]
    info      Display system-wide information               # 显示系统相关信息
    inspect   Return low-level information on a container   # 查看容器详细信息
    kill      Kill a running container                      # kill指定docker容器
    load      Load an image from a tar archive              # 从一个tar包中加载一个镜像[对应save]
    login     Register or Login to the docker registry server   
              # 注册或者登陆一个docker源服务器
    logs      Fetch the logs of a container             # 输出当前容器日志信息
    port      Lookup the public-facing port which is NAT-ed to PRIVATE_PORT
              # 查看映射端口对应的容器内部源端口
    pause     Pause all processes within a container    # 暂停容器
    ps        List containers                           # 列出容器列表
    pull      Pull an image or a repository from the docker registry server
              # 从docker镜像源服务器拉取指定镜像或者库镜像
    push      Push an image or a repository to the docker registry server
              # 推送指定镜像或者库镜像至docker源服务器
    restart   Restart a running container               # 重启运行的容器
    rm        Remove one or more containers             # 移除一个或者多个容器
    rmi       Remove one or more images                 
              # 移除一个或多个镜像[无容器使用该镜像才可删除，否则需删除相关容器才可继续或-f强制删除]
    run       Run a command in a new container
              # 在一个新的容器中运行一个命令
    save      Save an image to a tar archive            # 保存一个镜像为一个tar包[对应load]
    search    Search for an image in the docker index   # 在docker index中搜索镜像
    start     Start a stopped containers    # 启动容器
    stop      Stop a running containers     # 停止容器
    tag       Tag an image into a repository        # 给源中镜像打标签
    top       Lookup the running processes of a container # 查看容器中运行的进程信息
    unpause   Unpause a paused container            # 取消暂停容器
    version   Show the docker version information   # 查看docker版本号
    wait      Block until a container stops, then print its exit code   
              # 截取容器停止时的退出状态值
```


docker选项帮助

``` bash
$ sudo docker --help
Usage of docker:
  --api-enable-cors=false                Enable CORS headers in the remote API                  # 远程API中开启CORS头
  -b, --bridge=""                        Attach containers to a pre-existing network bridge     # 桥接网络
                                           use 'none' to disable container networking
  --bip=""                               Use this CIDR notation address for the network bridge's IP, not compatible with -b
                                         # 和-b选项不兼容，具体没有测试过
  -d, --daemon=false                     Enable daemon mode     # daemon模式
  -D, --debug=false                      Enable debug mode      # debug模式
  --dns=[]                               Force docker to use specific DNS servers           # 强制docker使用指定dns服务器
  --dns-search=[]                        Force Docker to use specific DNS search domains    # 强制docker使用指定dns搜索域
  -e, --exec-driver="native"             Force the docker runtime to use a specific exec driver  # 强制docker运行时使用指定执行驱动器
  -G, --group="docker"                   Group to assign the unix socket specified by -H when running in daemon mode
                                           use '' (the empty string) to disable setting of a group
  -g, --graph="/var/lib/docker"          Path to use as the root of the docker runtime      # 容器运行的根目录路径
  -H, --host=[]                          The socket(s) to bind to in daemon mode            # daemon模式下docker指定绑定方式[tcp or 本地socket]
                                           specified using one or more tcp://host:port, unix:///path/to/socket, fd://* or fd://socketfd.
  --icc=true                             Enable inter-container communication                       # 跨容器通信
  --ip="0.0.0.0"                         Default IP address to use when binding container ports     # 指定监听地址，默认所有ip
  --ip-forward=true                      Enable net.ipv4.ip_forward                                 # 开启转发
  --iptables=true                        Enable Docker's addition of iptables rules                 # 添加对应iptables规则
  --mtu=0                                Set the containers network MTU                             # 设置网络mtu
                                           if no value is provided: default to the default route MTU or 1500 if no default route is available
  -p, --pidfile="/var/run/docker.pid"    Path to use for daemon PID file                            # 指定pid文件位置
  -r, --restart=true                     Restart previously running containers                      # 重新启动以前运行的容器                     
  -s, --storage-driver=""                Force the docker runtime to use a specific storage driver  # 强制docker运行时使用指定存储驱动
  --selinux-enabled=false                Enable selinux support                                     # 开启selinux支持
  --storage-opt=[]                       Set storage driver options                                 # 设置存储驱动选项
  --tls=false                            Use TLS; implied by tls-verify flags                       # 开启tls
  --tlscacert="/root/.docker/ca.pem"     Trust only remotes providing a certificate signed by the CA given here
  --tlscert="/root/.docker/cert.pem"     Path to TLS certificate file                               # tls证书文件位置
  --tlskey="/root/.docker/key.pem"       Path to TLS key file                                       # tls key文件位置
  --tlsverify=false                      Use TLS and verify the remote (daemon: verify client, client: verify daemon) # 使用tls并确认远程控制主机
  -v, --version=false                    Print version information and quit                         # 输出docker版本信息
```

### docker search

官方镜像源地址：[registry.hub.docker.com](https://registry.hub.docker.com/)

``` bash
$ sudo docker search

Usage: docker search TERM

Search the docker index for images      # 从docker镜像主页搜索镜像

  --automated=false    Only show automated builds
  --no-trunc=false     Don't truncate output
  -s, --stars=0        Only displays with at least xxx stars
```

示例：

``` bash
$ sudo docker search -s 100 ubuntu      
# 查找star数至少为100的镜像，找出只有官方镜像start数超过100，默认不加s选项找出所有相关ubuntu镜像
NAME      DESCRIPTION                  STARS     OFFICIAL   AUTOMATED
ubuntu    Official Ubuntu base image   425       [OK]       
```

### docker info

``` bash
$ sudo docker info
Containers: 7           # 容器个数
Images: 102             # 镜像个数
Storage Driver: aufs    # 存储驱动，默认aufs
 Root Dir: /var/lib/docker/aufs     # 根目录
 Dirs: 116
Execution Driver: native-0.2        # 执行驱动
Kernel Version: 3.13.0-24-generic
WARNING: No swap limit support
```

### docker pull && docker push

``` bash
$ sudo docker pull                  # pull拉取镜像

Usage: docker pull NAME[:TAG]

Pull an image or a repository from the registry

$ sudo docker push                  # push推送指定镜像

Usage: docker push NAME[:TAG]

Push an image or a repository to the registry
```

示例：

``` bash
$ sudo docker pull ubuntu           # 下载官方ubuntu docker镜像，默认下载所有ubuntu官方库镜像
$ sudo docker pull ubuntu:14.04     # 下载指定版本ubuntu官方镜像
```

``` bash
$ sudo docker push 192.168.0.100:5000/ubuntu
# 推送镜像库到私有源[可注册docker官方账户，推送到官方自有账户]
$ sudo docker push 192.168.0.100:5000/ubuntu:14.04 
# 推送指定镜像到私有源
```

### docker images

列出当前系统镜像

``` bash
$ sudo docker images -h

Usage: docker images [OPTIONS] [NAME]

List images

  -a, --all=false      Show all images (by default filter out the intermediate image layers)
  # -a显示当前系统的所有镜像，包括过渡层镜像，默认docker images显示最终镜像，不包括过渡层镜像
  -f, --filter=[]      Provide filter values (i.e. 'dangling=true')
  --no-trunc=false     Don't truncate output
  -q, --quiet=false    Only show numeric IDs
```

示例：

``` bash
$ sudo docker images            # 显示当前系统镜像，不包括过渡层镜像
$ sudo docker images -a         # 显示当前系统所有镜像，包括过渡层镜像
$ sudo docker images ubuntu     # 显示当前系统docker ubuntu库中的所有镜像
REPOSITORY                 TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
ubuntu                     12.04               ebe4be4dd427        4 weeks ago         210.6 MB
ubuntu                     14.04               e54ca5efa2e9        4 weeks ago         276.5 MB
ubuntu                     14.04-ssh           6334d3ac099a        7 weeks ago         383.2 MB
```

### docker rmi

删除一个或者多个镜像

``` bash
$ sudo docker rmi

Usage: docker rmi IMAGE [IMAGE...]

Remove one or more images

  -f, --force=false    Force removal of the image       # 强制移除镜像不管是否有容器使用该镜像
  --no-prune=false     Do not delete untagged parents   # 不要删除未标记的父镜像
``` 

### docker run

``` bash
$ sudo docker run 

Usage: docker run [OPTIONS] IMAGE [COMMAND] [ARG...]

Run a command in a new container

  -a, --attach=[]            Attach to stdin, stdout or stderr.
  -c, --cpu-shares=0         CPU shares (relative weight)                   # 设置cpu使用权重
  --cidfile=""               Write the container ID to the file             # 把容器id写入到指定文件
  --cpuset=""                CPUs in which to allow execution (0-3, 0,1)    # cpu绑定
  -d, --detach=false         Detached mode: Run container in the background, print new container id # 后台运行容器
  --dns=[]                   Set custom dns servers             # 设置dns
  --dns-search=[]            Set custom dns search domains      # 设置dns域搜索
  -e, --env=[]               Set environment variables          # 定义环境变量
  --entrypoint=""            Overwrite the default entrypoint of the image      # ？
  --env-file=[]              Read in a line delimited file of ENV variables     # 从指定文件读取变量值
  --expose=[]                Expose a port from the container without publishing it to your host    # 指定对外提供服务端口
  -h, --hostname=""          Container host name    # 设置容器主机名
  -i, --interactive=false    Keep stdin open even if not attached           # 保持标准输出开启即使没有attached
  --link=[]                  Add link to another container (name:alias)     # 添加链接到另外一个容器[这个会专门章节讲解]
  --lxc-conf=[]              (lxc exec-driver only) Add custom lxc options --lxc-conf="lxc.cgroup.cpuset.cpus = 0,1"
  -m, --memory=""            Memory limit (format: <number><optional unit>, where unit = b, k, m or g) # 内存限制
  --name=""                  Assign a name to the container     # 设置容器名
  --net="bridge"             Set the Network mode for the container     # 设置容器网络模式
                               'bridge': creates a new network stack for the container on the docker bridge
                               'none': no networking for this container
                               'container:<name|id>': reuses another container network stack
                               'host': use the host network stack inside the container.  Note: the host mode gives the container full access to local system services such as D-bus and is therefore considered insecure.
  -P, --publish-all=false    Publish all exposed ports to the host interfaces   # 自动映射容器对外提供服务的端口
  -p, --publish=[]           Publish a container's port to the host             # 指定端口映射
                               format: ip:hostPort:containerPort | ip::containerPort | hostPort:containerPort
                               (use 'docker port' to see the actual mapping)
  --privileged=false         Give extended privileges to this container         # 提供更多的权限给容器
  --rm=false                 Automatically remove the container when it exits (incompatible with -d) # 如果容器退出自动移除和-d选项冲突
  --sig-proxy=true           Proxify received signals to the process (even in non-tty mode). SIGCHLD is not proxied. # ？
  -t, --tty=false            Allocate a pseudo-tty                              # 分配伪终端
  -u, --user=""              Username or UID                                    # 指定运行容器的用户uid或者用户名
  -v, --volume=[]            Bind mount a volume (e.g., from the host: -v /host:/container, from docker: -v /container)     # 挂载卷[这个会专门章节讲解]
  --volumes-from=[]          Mount volumes from the specified container(s)      # 从指定容器挂载卷
  -w, --workdir=""           Working directory inside the container             # 指定容器工作目录
```

示例：

``` bash
$ sudo docker images ubuntu
REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
ubuntu              14.04               e54ca5efa2e9        4 weeks ago         276.5 MB
... ...
$ sudo docker run -t -i -c 100 -m 512MB -h test1 -d --name="docker_test1" ubuntu /bin/bash 
# 创建一个cpu优先级为100，内存限制512MB，主机名为test1，名为docker_test1后台运行bash的容器
a424ca613c9f2247cd3ede95adfbaf8d28400cbcb1d5f9b69a7b56f97b2b52e5
$ sudo docker ps
CONTAINER ID        IMAGE           COMMAND         CREATED             STATUS              PORTS       NAMES
a424ca613c9f        ubuntu:14.04    /bin/bash       6 seconds ago       Up 5 seconds                    docker_test1
$ sudo docker attach docker_test1
root@test1:/# pwd
/
root@test1:/# exit
exit
```

__关于cpu优先级:__

> By default all groups have 1024 shares. A group with 100 shares will get a ~10% portion of the CPU time:

### docker start|stop|kill|restart|pause|unpause|rm|commit|inspect

* docker start CONTAINER [CONTAINER...] # 运行一个或多个停止的容器
* docker stop CONTAINER [CONTAINER...]  # 停掉一个或多个运行的容器 `-t`选项可指定超时时间 
* docker kill [OPTIONS] CONTAINER [CONTAINER...] # 默认kill发送SIGKILL信号 `-s`可以指定发送kill信号类型
* docker restart [OPTIONS] CONTAINER [CONTAINER...] # 重启一个或多个运行的容器 `-t`选项可指定超时时间
* docker pause CONTAINER                # 暂停一个容器，方便commit
* docker unpause CONTAINER              # 继续暂停的容器
* docker rm [OPTIONS] CONTAINER [CONTAINER...] # 移除一个或多个容器
    * -f, --force=false      Force removal of running container
    * -l, --link=false       Remove the specified link and not the underlying container 
    * -v, --volumes=false    Remove the volumes associated with the container
* docker commit [OPTIONS] CONTAINER [REPOSITORY[:TAG]] # 提交指定容器为镜像
    * -a, --author=""     Author (e.g., "John Hannibal Smith <hannibal@a-team.com>")
    * -m, --message=""    Commit message
    * -p, --pause=true    Pause container during commit # 默认commit是暂停状态
* docker inspect CONTAINER|IMAGE [CONTAINER|IMAGE...]   # 查看容器或者镜像的详细信息
* docker logs CONTAINER                                 # 输出指定容器日志信息
    * -f, --follow=false        Follow log output       # 类似tail -f
    * -t, --timestamps=false    Show timestamps
    * --tail="all"              Output the specified number of lines at the end of logs (defaults to all logs)

## 参考文档

* [Docker Run Reference](https://docs.docker.com/reference/run/)

--EOF--
