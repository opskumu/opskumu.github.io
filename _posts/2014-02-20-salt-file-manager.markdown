---
layout: post
title: "[2]salt文件分发"
date: 2014-02-20 22:12
comments: true
categories: 运维利器
keywords: salt, file, ssh
---


__取消配置文件`/etc/salt/master`以下注释__

```
... ...
file_roots:
  base:
    - /srv/salt
... ...
```


__新建相关目录__
```
mkdir /srv/salt
touch /srv/salt/top.sls
```

top.sls文件
`/srv/salt/top.sls`
```
base:
  '*':
    - ssh_key.key
```

```
mkdir /srv/salt/ssh_key
touch /srv/salt/test.sls
```

`/srv/salt/test.sls`
```
/root/.ssh/authorized_keys: 
# 客户端文件存放路径和命名，如果.ssh目录不存在则会自动新建
  file:
    - managed
    - source: salt://ssh_key/test   
    # 默认file根目录为`/srv/salt`，拷贝相应文件至所在目录
    - user: root
    - group: root
    - mode: 600
```

__最终目录结构__
```
# tree /srv/salt/
/srv/salt/
|-- ssh_key
|   |-- test
|   |-- test.sls
`-- top.sl
```

__server端主动推送__
```
salt '*' state.highstate -v     # 按照top.sls执行所有
salt '*' state.sls ssh_key.ms   # 指定sls执行
```

--EOF--
