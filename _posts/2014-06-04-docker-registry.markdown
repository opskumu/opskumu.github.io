---
layout: post
title: "构建docker私有库"
date: 2014-06-04 17:08
comments: true
categories: 虚拟化
---

为方便管理，我们需要对官方的镜像做一些定制，我们可以构建私有的`docker registry`


### 快速构建
 
The fastest way to get running:
 
* install docker：`apt-get install docker.io`
* run the registry: `docker run -p 5000:5000 registry`
 
That will use the official image from the Docker index.[因为国内被墙的原因，速度比较慢，推荐第二种方式]
 
### 传统构建方式
 
``` bash
$ sudo apt-get install build-essential python-dev libevent-dev python-pip liblzma-dev
$ git clone https://github.com/dotcloud/docker-registry.git
$ cd docker-registry/
$ cp config/config_sample.yml config/config.yml
$ mkdir /data/registry -p
$ pip install .
```
 
#### 启动
 
``` bash
$ sudo gunicorn --access-logfile - --debug -k gevent -b 0.0.0.0:5000 \
-w 1 docker_registry.wsgi:application
```

生产环境可以通过如supervisord创建8个workers，或者通过nginx和apache来管理，具体可以参考[docker-registry readme](https://github.com/dotcloud/docker-registry)。

``` bash
$ sudo gunicorn -k gevent --max-requests 100 --graceful-timeout 3600 \
-t 3600 -b localhost:5000 -w 8 docker_registry.wsgi:application
```
 
#### 提交指定容器到私有库
 
``` bash
$ docker tag 74fe38d11401 192.168.0.219:5000/ubuntu:12.04
$ docker push 192.168.0.219:5000/ubuntu
```

### 参考

* [docker-registry readme](https://github.com/dotcloud/docker-registry)
* [How to use your own Registry](http://blog.docker.io/2013/07/how-to-use-your-own-registry/)

--EOF--
