---
layout: post
title: "MySQL 大字段溢出导致数据回写失败"
description: " mysql blob"
category: mysql
tags: [MySQL]
---
{% include JB/setup %}

# MySQL 大字段溢出导致数据回写失败

## 一、问题描述

2015-01-12 18:10  左右公司某游戏日志监控报警，查看日志显示如下错误：

```
Row size too large (> 8126). Changing some columns to TEXT or BLOB or using ROW_FORMAT=DYNAMIC or ROW_FORMAT=COMPRESSED may help. In current row format, BLOB prefix of 768 bytes is stored inline.
```

刚开始，只有一个玩家的相关数据回写 DB，后来影响的用户越来越多，日志基本上是这样的错误信息。

## 二、问题解决

因为对 MySQL 行写入到页的原理性不清楚，导致问题的解决花费了一定的时间。Google 对应的错误建议修改 MySQL `innodb_file_format` 值，并修改对应表的 `row_format`。 [Mysql的大字段问题](http://blog.sina.com.cn/s/blog_8e9cceee0101k65j.html) [Change limit for “Mysql Row size too large”](http://stackoverflow.com/questions/15585602/change-limit-for-mysql-row-size-too-large)

查看线上表 `row_format` 类型，如下：

```
mysql> show variables like 'innodb_file_format';    # MySQL 5.6 默认使用 innodb_file_format 为 Antelope
+--------------------+----------+
| Variable_name      | Value    |
+--------------------+----------+
| innodb_file_format | Antelope |
+--------------------+----------+
1 row in set (0.00 sec)
mysql> use db_role_0;
Database changed
mysql> SELECT `table_name`, `row_format` FROM `information_schema`.`tables` WHERE `table_schema`=DATABASE();    # 默认表 row_format 为 Compact
+---------------------+------------+
| table_name          | row_format |
+---------------------+------------+
| t_role_00 | Compact    |
| t_role_10 | Compact    |
| t_role_20 | Compact    |
| t_role_30 | Compact    |
| t_role_40 | Compact    |
| t_role_50 | Compact    |
| t_role_60 | Compact    |
| t_role_70 | Compact    |
| t_role_80 | Compact    |
| t_role_90 | Compact    |
+---------------------+------------+
10 rows in set (0.00 sec)

mysql> 
```

开发那边删减了一些不必要的数据并更新游戏服务器，但是依然没有解决 DB 回写的问题。因为目前数据量不是很大，并且支持在线修改生效 innodb `innodb_file_format` 和 表 `row_format`，也不会影响 DB，所以先测试修改一个表的  `row_format` 值，查看对应日志输出，发现问题解决，同事批量修改线上表 `row_format` 值，修改完之后，对应的问题解决，主要修改值如下：

```
msyql> SET GLOBAL innodb_file_format=BARRACUDA;
mysql> show variables like 'innodb_file_format';
+--------------------+-----------+
| Variable_name      | Value     |
+--------------------+-----------+
| innodb_file_format | Barracuda |
+--------------------+-----------+
1 row in set (0.00 sec)

mysql> use db_role_0;
Database changed
mysql> ALTER TABLE `t_role_90`  ROW_FORMAT=DYNAMIC;
mysql> show table status like 't_role_90'\G;
*************************** 1. row ***************************
           Name: t_role_90
         Engine: InnoDB
        Version: 10
     Row_format: Dynamic
           Rows: 403
 Avg_row_length: 3943
    Data_length: 1589248
Max_data_length: 0
   Index_length: 16384
      Data_free: 4194304
 Auto_increment: NULL
    Create_time: 2015-01-12 20:50:30
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options: row_format=DYNAMIC
        Comment: 
1 row in set (0.00 sec)

ERROR: 
No query specified

mysql> 
```

加入 `innodb_file_format=BARRACUDA` 到 MySQL 配置文件 my.cnf 中，防止下次 DB 重启造成 `innodb_file_format` 恢复默认。

### 2.1 修复 Slave

因为主修改了环境变量和表的 `row_format`，修复了 Master 的数据回写问题，但是 Slave 这边没有更改，导致 Slave 同步出错，卡在了插入语句的地方，导致主从同步失败，修复如下：

* 1、msyql> stop slave;
* 2、修改 slave  `innodb_file_format=BARRACUDA` 「并添加该值到 my.cnf」和 表 `row_format=dynamic`
* 3、mysql> SET GLOBAL SQL_SLAVE_SKIP_COUNTER = 1; # 1 表示跳过 1 个 events
* 4、mysql> start slave;

至此，Slave 数据恢复同步，还好不需要重新重做 Slave。

## 三、问题分析

问题虽然解决了，但是有时候需要追根溯源，特别对于数据安全性相关的，原理性的东西弄明白就会好解释一些问题了。13 号继续跟踪这个问题，在网上找到了这篇文章 [innodb使用大字段text，blob的一些优化建议](http://hidba.org/?p=551)，看了一遍，没怎么看懂，发给了同事看。吃完饭之后，同事给我讲解了下造成之前的问题原因所在，然后我也弄明白了，继续查看了相应的资料之后彻底弄明白了。

### 3.1 Antelope 和 Barracuda 文件格式

![Antelope && Barracuda](images/mysql-innodb-file-format.png)

#### Antelope

InnoDB 存储引擎和大多数数据库一样（如 Oracle 和 Microsoft SQL Server 数据库），记录是以行的形式存储的。这意味着页中保存着表中一行行的数据。在InnoDB 1.0.x版本之前，InnoDB 存储引擎提供了 Compact 和 Redundant 两种格式来存放行记录数据，这也是目前使用最多的一种格式。Redundant格式是为兼容之前版本而保留的。在 MySQL 5.6 版本中，默认设置为 Compact 行格式。用户可以通过命令 `SHOW TABLE STATUS LIKE'table_name'` 来查看当前表使用的行格式，其中 `row_format` 属性表示当前所使用的行记录结构类型。

Compact 行记录是在 MySQL 5.0 中引入的，其设计目标是高效地存储数据。简单来说，一个页中存放的行数据越多，其性能就越高。Compact 行记录的存储方式如下：

![Compact](images/Compact.png)

Compact 行记录格式的首部是一个非 NULL 变长字段长度列表，并且其是按照列的顺序逆序放置的，其长度为：

* 若列的长度小于 255 字节，用 1 字节表示；
* 若大于 255 个字节，用 2 字节表示。

变长字段的长度最大不可以超过 2 字节，这是因在 MySQL 数据库中 VARCHAR 类型的最大长度限制为 65535。变长字段之后的第二个部分是 NULL 标志位，该位指示了该行数据中是否有 NULL 值，有则用 1 表示。该部分所占的字节应该为 1 字节。接下来的部分是记录头信息（record header），固定占用 5 字节（40 位）,每位的含义见表:

![Compact-record](images/Compact-record.png)

对于 blob，text，varchar(8099 这样的大字段，innodb 只会存放前 768 字节在数据页中，而剩余的数据则会存储在溢出段中（发生溢出情况的时候适用），对于行溢出数据，其存放采用下图中所示方法；

![Compact-blob](images/Compact-blob.png)

innoDB 存储引擎表是索引组织的，即 B+Tree 的结构，这样每个页中至少应该有两条行记录（否则失去了B+Tree的意义，变成链表了）。因此，如果页中只能存放下一条记录，那么 InnoDB 存储引擎会自动将行数据存放到溢出页中，所以默认页 16KB，那么一行数据列和如果超过 8kB 则会出现之前溢出的错误。

按照这种算法，查询之前某个出问题的用户 Blob 字段占用为 7602 「表中有 48 个 blob 字段」，加上其它的占用超过 8kB 就导致 了 `Row size too large (> 8126). Changing some ... ...`。

问题表结构如下:

```
mysql> desc t_role_90;
+------------------+----------------------+------+-----+-------------------+-----------------------------+
| Field            | Type                 | Null | Key | Default           | Extra                       |
+------------------+----------------------+------+-----+-------------------+-----------------------------+
| id               | int(10) unsigned     | NO   | PRI | NULL              |                             |
| name             | varchar(32)          | YES  |     | NULL              |                             |
| career           | int(11)              | YES  |     | 0                 |                             |
| sid              | int(10) unsigned     | YES  | MUL | 0                 |                             |
| uid              | int(10) unsigned     | YES  |     | 0                 |                             |
| exp              | bigint(20)           | YES  |     | 0                 |                             |
| lev              | int(11)              | YES  |     | 1                 |                             |
| coin             | bigint(20)           | YES  |     | 0                 |                             |
| gold             | bigint(20)           | YES  |     | 0                 |                             |
| vip_exp          | int(11)              | YES  |     | 0                 |                             |
| vip_lev          | int(11)              | YES  |     | 0                 |                             |
| rand             | smallint(5) unsigned | YES  |     | 0                 |                             |
| update_timestamp | timestamp            | YES  |     | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |
| rds0             | blob                 | YES  |     | NULL              |                             |
| rds1             | blob                 | YES  |     | NULL              |                             |
| rds2             | blob                 | YES  |     | NULL              |                             |
| rds3             | blob                 | YES  |     | NULL              |                             |
| rds4             | blob                 | YES  |     | NULL              |                             |
| rds5             | blob                 | YES  |     | NULL              |                             |
| rds6             | blob                 | YES  |     | NULL              |                             |
| rds7             | blob                 | YES  |     | NULL              |                             |
| rds8             | blob                 | YES  |     | NULL              |                             |
| rds9             | blob                 | YES  |     | NULL              |                             |
| rds10            | blob                 | YES  |     | NULL              |                             |
| rds11            | blob                 | YES  |     | NULL              |                             |
| rds12            | blob                 | YES  |     | NULL              |                             |
| rds13            | blob                 | YES  |     | NULL              |                             |
| rds14            | blob                 | YES  |     | NULL              |                             |
| rds15            | blob                 | YES  |     | NULL              |                             |
| rds16            | blob                 | YES  |     | NULL              |                             |
| rds17            | blob                 | YES  |     | NULL              |                             |
| rds18            | blob                 | YES  |     | NULL              |                             |
| rds19            | blob                 | YES  |     | NULL              |                             |
| rds20            | blob                 | YES  |     | NULL              |                             |
| rds21            | blob                 | YES  |     | NULL              |                             |
| rds22            | blob                 | YES  |     | NULL              |                             |
| rds23            | blob                 | YES  |     | NULL              |                             |
| rds24            | blob                 | YES  |     | NULL              |                             |
| rds25            | blob                 | YES  |     | NULL              |                             |
| rds26            | blob                 | YES  |     | NULL              |                             |
| rds27            | blob                 | YES  |     | NULL              |                             |
| rds28            | blob                 | YES  |     | NULL              |                             |
| rds29            | blob                 | YES  |     | NULL              |                             |
| rds30            | blob                 | YES  |     | NULL              |                             |
| rds31            | blob                 | YES  |     | NULL              |                             |
| gds0             | blob                 | YES  |     | NULL              |                             |
| gds1             | blob                 | YES  |     | NULL              |                             |
| gds2             | blob                 | YES  |     | NULL              |                             |
| gds3             | blob                 | YES  |     | NULL              |                             |
| gds4             | blob                 | YES  |     | NULL              |                             |
| gds5             | blob                 | YES  |     | NULL              |                             |
| gds6             | blob                 | YES  |     | NULL              |                             |
| gds7             | blob                 | YES  |     | NULL              |                             |
| gds8             | blob                 | YES  |     | NULL              |                             |
| gds9             | blob                 | YES  |     | NULL              |                             |
| gds10            | blob                 | YES  |     | NULL              |                             |
| gds11            | blob                 | YES  |     | NULL              |                             |
| gds12            | blob                 | YES  |     | NULL              |                             |
| gds13            | blob                 | YES  |     | NULL              |                             |
| gds14            | blob                 | YES  |     | NULL              |                             |
| gds15            | blob                 | YES  |     | NULL              |                             |
+------------------+----------------------+------+-----+-------------------+-----------------------------+
61 rows in set (0.00 sec)

mysql> 
```

确实需要在 InnoDB 表中存储 BLOB、TEXT、长 VARCHAR 列时，有下面几点建议「摘自[优化 InnoDB 表 BLOB 列的存储效率](http://imysql.com/2014/09/28/mysql-optimization-case-blob-stored-in-innodb-optimization.shtml)」：

* 1、尽可能将所有数据序列化、压缩之后，存储在同一个列里，避免发生多次 off-page；
* 2、实际最大存储长度低于 255 的列，转成 VARCHAR 或者 CHAR 类型（如果是变长数据二者没区别，如果是定长数据，则使用 CHAR 类型）；
* 3、如果无法将所有列整合到一个列，可以退而求其次，根据每个列最大长度进行排列组合后拆分成多个子表，尽量是的每个子表的总行长度小于 8KB，减少发生 off-page 的频率；
* 4、上述建议是在 data page 为默认的 16KB 前提下，如果修改成 8KB 或者其他大小，请自行根据上述理论进行测试，找到最合适的值；
* 5、字符型列长度小于 255 时，无论采用 CHAR 还是 VARCHAR 来存储，或者把 VARCHAR 列长度定义为 255，都不会导致实际表空间增大；
* 6、一般在游戏领域会用到比较多的 BLOB 列类型，游戏界同行可以关注下。

#### Barracuda

InnoDB 1. 0.x 版本开始引入了新的文件格式（file format，用户可以理解为新的页格式），以前支持的 Compact 和 Redundant 格式称为 Antelope 文件格式，新的文件格式称为 Barracuda 文件格式。Barracuda 文件格式下拥有两种新的行记录格式：Compressed 和 Dynamic。 

新的两种记录格式对于存放在 BLOB 中的数据采用了完全的行溢出的方式，如图所示，在数据页中只存放 20 个字节的指针，实际的数据都存放在 Off Page 中，而之前的 Compact 和 Redundant 两种格式会存放 768 个前缀字节。

![Compressed-blob](images/Compressed-blob.png)

Compressed 行记录格式的另一个功能就是，存储在其中的行数据会以 zlib 的算法进行压缩，因此对于 BLOB、TEXT、VARCHAR 这类大长度类型的数据能够进行非常有效的存储。

可以查看改用 Dynamic 之后的表信息：

```
mysql> show table status like 't_role_90'\G
*************************** 1. row ***************************
           Name: t_role_90
         Engine: InnoDB
        Version: 10
     Row_format: Dynamic
           Rows: 403
 Avg_row_length: 3943           # 平均每行包含的字节数
    Data_length: 1589248
Max_data_length: 0
   Index_length: 16384
      Data_free: 4194304
 Auto_increment: NULL
    Create_time: 2015-01-12 20:50:30
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options: row_format=DYNAMIC
        Comment: 
1 row in set (0.00 sec)

mysql> 
```

## 四、参考延伸

* [《MySQL 技术内幕: InnoDB 存储引擎》](http://book.douban.com/subject/24708143/) 第4章 表
* [InnoDB plugin row format performance](http://venublog.com/2008/04/25/innodb-plugin-row-format-performance/)
* [InnoDB Plugin文件格式(概述)](http://www.orczhou.com/index.php/2010/03/innodb-plugin-file-format/)
* [优化 InnoDB 表 BLOB 列的存储效率](http://imysql.com/2014/09/28/mysql-optimization-case-blob-stored-in-innodb-optimization.shtml)
* [innodb 使用大字段 text，blob 的一些优化建议](http://hidba.org/?p=551)

关于 InnoDB 表 BLOB 字段的优化推荐阅读  [优化 InnoDB 表 BLOB 列的存储效率](http://imysql.com/2014/09/28/mysql-optimization-case-blob-stored-in-innodb-optimization.shtml) 和 [innodb 使用大字段 text，blob 的一些优化建议](http://hidba.org/?p=551) 这两篇文章，避免类似问题的产生。
