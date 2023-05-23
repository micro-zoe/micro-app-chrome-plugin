# micro-app-chrome-plugin

<p align="center">
  <a href="https://micro-zoe.github.io/micro-app/">
    <img src="https://zeroing.jd.com/micro-app/media/logo.png" alt="logo" width="200"/>
  </a>
</p>

# 📖简介
`micro-app-chrome-plugin`是基于京东零售推出的一款为`micro-app`框架而开发的`chrome`插件，旨在方便开发者对微前端进行数据查看以及调试,提升工作效率。

# 如何使用

下载[插件地址](https://github.com/micro-zoe/micro-app-chrome-plugin/raw/master/micro-app-chrome-plugin.zip)，在chrome中输入[chrome://extensions](chrome://extensions)打开扩展程序，将已下载的插件拖入。

![扩展程序](https://img12.360buyimg.com/imagetools/jfs/t1/119438/16/38287/53001/646b50e3F9012f2e8/3bba9844bbb1431b.png)

# 功能
打开控制台，选中`Micro app`

## Environment环境

可查看`Micro app`的`Environment`环境如下

```js
'__MICRO_APP_ENVIRONMENT__': '判断应用是否在微前端环境中'
'__MICRO_APP_VERSION__': '微前端版本号'
'__MICRO_APP_NAME__': '应用名称'
'__MICRO_APP_PUBLIC_PATH__': '子应用的静态资源前缀'
'__MICRO_APP_BASE_ROUTE__': '子应用的基础路由'
'__MICRO_APP_BASE_APPLICATION__': '判断应用是否是基座应用'
'__COOKIES__': '__COOKIES__'
```

![控制台](https://img14.360buyimg.com/imagetools/jfs/t1/217345/15/29583/184968/646b510eF5f040425/35b1cd5c1c6f3d23.png)

## Communicate通讯
可以查看父子应用通讯
数据通信面板

### 功能一、获取父应用数据
点击按钮可以获取当前被嵌入页面基座应用的JSON格式数据

![数据](https://img10.360buyimg.com/imagetools/jfs/t1/134890/5/32341/56354/646b517cFaebd60c3/0b84ff7b8af46b3f.png)


### 功能二、子应用开发环境模拟
点击按钮跳转至功能一中子应用开发环境模拟页面，可以模仿内嵌子应用，使用说明如下所示：

在子应用开发环境模拟页面中输入子页面`URL`等信息

> a、子页面URL：此处输入被基座应用嵌入的子应用链接

> b、父应用数据：此处输入JSON格式的父应用需要传给子应用的数据

> c、子应用嵌入代码：此处显示子应用嵌入的代码


以上即完成微前端的嵌入，效果如下：

![嵌入页面](https://img10.360buyimg.com/imagetools/jfs/t1/34172/26/15026/142590/646b51afF00535320/d9d0fd6c7b1590cb.png)

#### 快捷打开方式
点击右上角图标出现目录,选择"打开子应用开发环境模拟"
![快捷方式](https://img12.360buyimg.com/imagetools/jfs/t1/99019/19/29391/10185/646b51dfF326dcc6c/04273f1a3daf9f9d.png)

## 3、Route路由
尽情期待

## 4、Console子应用控制台
尽情期待

# 🤝 参与共建
如果您对这个项目感兴趣，欢迎提`pull request`参与贡献，也欢迎 `Star` 支持一下 ^_^


