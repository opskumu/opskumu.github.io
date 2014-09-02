---
layout: post
title: "LogAnalyzer网页日志分析之安装篇"
date: 2013-04-23 14:50
comments: true
categories: "监控调优"
---
## LogAnalyzer简介 ##
LogAnalyzer 是一个syslog和其他网络事件数据的Web前端工具，提供简单易用的日志浏览、搜索和基本分析以及图表显示，PHP语言开发。[官方地址](http://loganalyzer.adiscon.com/)


## LogAnalyzer在RHEL6上的安装 ##
RHEL系列从RHEL6开始日志服务器，缺省的由原来RHEL5的syslog改为rsyslog。关于rsyslog和syslog的优缺点可以查看[链接](http://www.rsyslog.com/doc/rsyslog_ng_comparison.html)，ryslog有很多优势，因此本文以rsyslog为例。rsyslog支持TCP/UDP协议，并且可以将日志直接写入到数据库中，如Mongodb、MySQL，本文将以MySQL为例。

ryslog优势：

* 支持Multi-threading功能，处理效率比传统的syslog服务器更高
* 提供SSL加密功能，提高syslog传输安全性
* 提供数据库输出功能<MySQL、Mongodb ... ...>
* 提供过滤功能，可自定义相关的过滤条件

### 中心日志服务器配置 ###
#### Log Server端配置 ####

安装`rsyslog`、`rsyslog-mysql`
``` bash
yum install rsyslog rsyslog-mysql -y
```

安装`MySQL`和`Apache`
``` bash
yum install mysql-server
yum install httpd php php-mysyql php-gd
```


导入rsyslog写入数据需要的MySQL库文件，默认安装好之后会在目录/usr/share/doc/rsyslog-mysql-x.x.x/createDB.sql有该文件，rsyslog-mysql的版本不同，具体的位置也相应的不同
``` mysql
mysql -u root -p < /usr/share/doc/rsyslog-mysql-5.8.10/createDB.sql 
```

如果导入正常的话，MySQL会生成Syslog库
``` mysql
mysql> use Syslog
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
+------------------------+
| Tables_in_Syslog       |
+------------------------+
| SystemEvents           |
| SystemEventsProperties |
| charts                 |
| config                 |
| dbmappings             |
| fields                 |
| groupmembers           |
| groups                 |
| savedreports           |
| searches               |
| sources                |
| users                  |
| views                  |
+------------------------+
13 rows in set (0.00 sec)

mysql> 
```

赋权，这里新增用户给insert权限即可，可参考[rsyslog_mysql](http://www.rsyslog.com/doc/rsyslog_mysql.html)
``` mysql
mysql> grant insert on Syslog.* to 'sysloguser'@'localhost' identified by '123321';
Query OK, 0 rows affected (0.34 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.08 sec)

mysql> 
```

修改rsyslog配置文件`/etc/rsyslog.conf`,添加mysql支持
``` bash
$ModLoad ommysql.so 
*.*       :ommysql:localhost,Syslog,sysloguser,123321
#*.*       :ommysql:database-server,database-name,database-userid,database-password
``` 

修改rsyslog配置文件`/etc/rsyslog.conf`,配置udp和tcp接受监听
``` bash
$ModLoad imudp
$UDPServerRun 514
$ModLoad imtcp
$InputTCPServerRun 514
$AllowedSender UDP, 127.0.0.1, 10.2.0.0/16  #10.2.0.0为接受某个网段发来的IP
$AllowedSender TCP, 127.0.0.1, 10.2.0.0/16
```

完成以上步骤之后重新启动rsyslog即可
``` bash
/etc/init.d/rsyslog restart
```

这时登陆MySQL执行`mysql> select * from Syslog.SystemEvents;`就可以看到rsyslog日志内容了

#### Log Client端配置 ####

安装`rsyslog`
``` bash
yum install rsyslog -y
```

修改rsyslog配置文件`/etc/rsyslog.conf`,添加如下内容
``` bash
*.* @@Server_ip #Server_ip为Log Server端的ip
```

完成以上步骤之后重新启动rsyslog即可
``` bash
/etc/init.d/rsyslog restart
```

### 安装LogAnalyzer###

下载解压
``` bash
wget http://download.adiscon.com/loganalyzer/loganalyzer-3.6.3.tar.gz
tar xf loganalyzer-3.6.3.tar.gz
cd loganalyzer-3.6.3
mkdir /var/www/html/rsyslog
cp -r contrib/* src/* /var/www/html/rsyslog #拷贝到web家目录下
chown apache:apache -R /var/www/html/rsyslog
bash /var/www/html/rsyslog/configure.sh
```

浏览器打开http://web_url/rsyslog

Next1，点击here执行安装
<center><img src="/images/loganlyzer1.png" alt="loganlyzer" title="loganlyzer" width="500" /></center>

Next2
<center><img src="/images/loganlyzer2.png" alt="loganlyzer" title="loganlyzer" width="500" /></center>

Next3

在Server端创建一个用户管理库和一个用户,然后输入到web中，开启使用数据库管理用户选项
``` mysql
mysql> create database loganalyzer;
Query OK, 1 row affected (0.02 sec)

mysql> grant all on loganalyzer.* to 'loganalyzer'@'localhost' identified by '123321';
Query OK, 0 rows affected (0.00 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)

mysql> 
```
<center><img src="/images/loganlyzer4.png" alt="loganlyzer" title="loganlyzer" width="500" /></center>

Next4
<center><img src="/images/loganlyzer5.png" alt="loganlyzer" title="loganlyzer" width="500" /></center>

Next5
<center><img src="/images/loganlyzer6.png" alt="loganlyzer" title="loganlyzer" width="500" /></center>

Next6

添加登陆用户
<center><img src="/images/loganlyzer7.png" alt="loganlyzer" title="loganlyzer" width="500" /></center>

Next7

选择数据库类型，并且添加相关数据库用户，修改用户权限如下：
``` mysql
mysql> grant all on Syslog.* to 'sysloguser'@'localhost' identified by '123321';
mysql> flush privileges;
```
如果只是日志写入到数据库中，那么只需要insert权限即可。如果使用loganlyzer，那么安装过程需要额外的权限，可以新增用户，也可先给sysloguser所有的权限，安装完成之后，再次恢复权限如下：
``` mysql
mysql> grant insert,select on Syslog.* to 'sysloguser'@'localhost' identified by '123321'; #loganlyzer安装完成后需要使用select权限查询输出到页面，因此这里赋予select权限
mysql> flush privileges; 
```
<center><img src="/images/loganlyzer8.png" alt="loganlyzer" title="loganlyzer" width="500" /></center>

Next8安装成功
<center><img src="/images/loganlyzer9.png" alt="loganlyzer" title="loganlyzer" width="500" /></center>

登陆，输入之前的用户名和密码即可：
<center><img src="/images/loganlyzer10.png" alt="loganlyzer" title="loganlyzer" width="500" /></center>

登陆之后页面如下：
<center><img src="/images/loganlyzer11.png" alt="loganlyzer" title="loganlyzer" width="500" /></center>

--EOF--
