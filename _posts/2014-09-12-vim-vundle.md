---
layout: post
title: "vim插件管理工具vundle"
description: "vim plugin manager"
category: UNIX/Linux
tags: [vim, cmd]
---
{% include JB/setup %}

## 简介

如果你使用 vim 开发，那么不可避免的会安装一些 vim 插件，Vundle 会很方便的管理安装插件，方便开发环境的迁移改动。

github 主页: [Vundle.vim](https://github.com/gmarik/Vundle.vim)

## 安装配置

其实关于 Vundle 的安装配置在 README 中讲解的非常详细了，如下：

### 安装

``` bash
git clone https://github.com/gmarik/Vundle.vim.git ~/.vim/bundle/Vundle.vim
```

### 配置

加入以下内容到`~/.vimrc`中最顶端，配置如下：

``` bash
set nocompatible              " be iMproved, required
filetype off                  " required

" set the runtime path to include Vundle and initialize
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
" alternatively, pass a path where Vundle should install plugins
" call vundle#begin('~/some/path/here')

" let Vundle manage Vundle, required
Plugin 'gmarik/Vundle.vim'

" 安装插件,如安装go相关的插件
Plugin 'cespare/vim-golang'
Plugin 'dgryski/vim-godef'
Plugin 'Blackrush/vim-gocode'

" All of your Plugins must be added before the following line
call vundle#end()            " required
filetype plugin indent on    " required
" To ignore plugin indent changes, instead use:
" filetype plugin on
"
" Brief help
" :PluginList       - lists configured plugins # 列出当前配置的插件
" :PluginInstall    - installs plugins; append `!` to update or just :PluginUpdate # 安装和更新插件
" :PluginSearch foo - searches for foo; append `!` to refresh local cache # 搜索github可用插件
" :PluginClean      - confirms removal of unused plugins; append `!` to auto-approve removal # 清理插件，追加!表示自动确认清除
"
" see :h vundle for more details or wiki for FAQ
" Put your non-Plugin stuff after this line
```

### 运行

加入相应的插件配置之后，运行 vim，末行模式下使用以上提到到安装、更新、移除命令即可，也可以终端执行`vim +PluginInstall +qall`安装插件。

## 参考

* [Vundle](https://github.com/gmarik/Vundle.vim)
