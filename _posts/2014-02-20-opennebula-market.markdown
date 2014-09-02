---
layout: post
title: "opennebula 3.8 market兼容问题"
date: 2014-02-20 16:12
comments: true
categories: 虚拟化
keywords: market,opennebula 3.8
---

今天下午发现公司所有的OpenNebula Sunstone访问出错，而且错误界面关闭不了，严重影响操作

<center><img src="/images/OpenNebula/OpenNebula_market_err.png" /></center>

Firebug获知锁定错误为market插件

<center><img src="/images/OpenNebula/OpenNebula_market_err2.png" /></center>

Google获知原因所在，具体问题可以参见[opennebula-3-8-and-market-compatiable-problem](http://www.marshut.com/iqmmzn/opennebula-3-8-and-market-compatiable-problem.html) ，解决方法是关闭sunstone的Market plugins，修改`etc/sunstone-plugins.yaml`配置文件，修改下行从`True`变为`false`，如下：
``` ruby
- plugins/marketplace-tab.js:
    :ALL: false
    :user:
:group:
```

完成之后刷新页面即可恢复正常

--EOF--
