---
layout: post
title: "Octopress Windows环境搭建"
date: 2013-04-06 17:09
comments: true
categories: Octopress
tags: Octopress
---

关于Octopress+GitHub+Markdown环境的搭建其实已经有很多写的很好的教程了，这里算是作一个总结吧，把遇到的一些问题说明注解一下。

**优点**：
	1. 用文件方式储存数据，无需数据库
	2. 以静态方式发布，直接托管github
	3. 用markdown格式写博客，可轻松配置和发布


## 安装
本文主要讲解在Windows上的安装方法,Linux可参考[官方文档](http://octopress.org/docs/)
### 准备软件
* git 		
	* 下载地址： [Git-1.8.1.2](https://code.google.com/p/msysgit/downloads/detail?name=Git-1.8.1.2-preview20130201.exe&can=2&q=) 	
* ruby		
	* 下载地址：[ruby-1.9.2](http://rubyforge.org/frs/download.php/75127/rubyinstaller-1.9.2-p290.exe) **推荐使用ruby-1.9.2** ,最新2.0版结合Octopress会有些问题
* gem
	* 下载地址：[DevKit-tdm-32-4.5.2](https://github.com/downloads/oneclick/rubyinstaller/DevKit-tdm-32-4.5.2-20111229-1559-sfx.exe) ,64位下载相关软件，本文中使用32位环境，[官网](http://rubyinstaller.org/downloads/)
* python
	* 下载地址：[Activepython-2.7.2.5](http://www.activestate.com/activepython/downloads/thank-you?dl=http://downloads.activestate.com/ActivePython/releases/2.7.2.5/ActivePython-2.7.2.5-win32-x86.msi) ,博客代码加亮模块需要python环境支持


### 安装软件
#### 注：
----------------------------------------------
ruby安装选项时选择`Add Ruby exectutables to your path`，如果安装时没有选择，则可以使用 `我的电脑` -- `属性` -- `高级系统设置` -- `环境变量`，添加**ruby命令路径**到系统环境变量即可，另外也要加入**git的命令路径**。

对于Gem下载完成后，将其解压，如 D:\DevKit，然后在cmd窗口中执行如下命令安装：
``` cpp
D:
cd DevKit
ruby dk.rb init
ruby dk.rb install
```

python安装完后执行如下安装
``` cpp
easy_install pygments
```

#### Octopress和相关插件安装
``` cpp
git clone git://github.com/imathis/octopress.git 
cd octopress    
ruby --version  #确保ruby安装版本为1.9.2
gem install bundler rdoc
bundle install
rake install
```

执行rake install时可能出现如下错误
	You have already activated rake 0.9.2.2, 
	but your Gemfile requires rake 0.9.2. 
	Using bundle exec may solve this.

可以在`rake install`命令前添加`bundle exec`或者直接修改octopress目录文件`Gemfile`,修改rake版本为当前版本

### Github创建库(省略)
    注册 <USERNAME> 的账号
    创建 <USERNAME>.github.com 的仓库

### 相关操作
``` cpp
rake setup_github_pages # 配置 octopress 与 github 的连接
rake generate 			# 生成静态文件
rake preview 			# 在本机4000端口生成访问内容
rake deploy 			# 发布文件到 github
```

执行rake generate可能产生如下错误
``` cpp
Liquid Exception: invalid byte sequence in GBK in page
```

**解决方法**： CMD命令窗口执行如下操作
``` cpp
set LANG=zh_CN.UTF-8 
set LC_ALL=zh_CN.UTF-8
```

### 参考
* [sinosmond.github.io](http://sinosmond.github.io/blog/2012/03/12/install-and-deploy-octopress-to-github-on-windows7-from-scratch/)
* [ruanyifeng.com](http://www.ruanyifeng.com/blog/2012/08/blogging_with_jekyll.html)
* [zjun.github.io](http://zjun.github.io/2012/09/23/blog-in-octopress-on-github/)

--EOF--
