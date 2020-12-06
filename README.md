[![Badge](https://img.shields.io/badge/link-996.icu-%23FF4D5B.svg?style=flat-square)](https://996.icu/#/zh_CN)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg?style=flat-square)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

# SOON.UI III
用于桌面Web浏览器的UI框架。
> 用于桌面Web浏览器的UI框架。这是SOON.UI库的3.0版本，本次的版本升级会对整个库进行一次重构，使其更加模块化，分层更清晰。分散的构建形式也使得大家可以很容易的从中分离出一部分用于构建现有的项目，甚至项目中正好需要某一个控件，而不用为了这一个控件引入整个SOON.UI，保持前端的整洁和轻巧。<br />另外原来的2.x的版本中有很多代码和控件都来自于实际的项目，有很多实现带有很明显的赶工痕迹，无论从API设计还是实现细节上都没有经过很好的考虑。虽然我在把这些代码从项目中整理封装到UI库的时候已经适当的重构过了，但依然不够好。所以这次也趁着这个机会正好将原来的一些不好的功能剥离出来，让所有控件的抽象程度和易用性更上一个台阶。

<a href="http://www.soonui.com" target="_blank" style="font-size:16px;">演示DEMO</a>

## 目录说明
1. dist 存放合并好的文件和压缩后文件
2. demo 存放demo文件，构建时会和layout下的模板页合并后得到完整的html文件
3. templete less文件，UI控件的样式库
4. theme 主题css文件，目前提供两套主题，light和dark
5. src 源码目录
6. test 单元测试文件存放目录

## 组件
* ajax ajax API
* animation 动画引擎
* browser 浏览器版本和设备
* color 颜色处理
* custom-event 自定义事件处理器
* define JavaScript类型处理
* draggable 拖动效果
* image-loader 异步图片加载，按比例缩放
* introsoft 内归排序
* theme 主题处理
* view-model MVVM视图模型
* uploader 上传组件
* page 页面生命周期管理

## 控件
### 对话框
* DialogBox 对话框
* MessageBox 信息提示框
* OptionBox 选项设置框
### 图片工具
* Zoomer 图片缩放查看器
* Watcher 图片放大镜
* Viewer 轮播图
* Preview 多图查看器
### 选择器
* Chooser 多值选择器
* ColorPicker 颜色选择器
* DateChooser 日期时间选择器
* SelectionList 下拉列表
* SelectionTree 多级下拉列表
### 工具类
* ConfirmButton 确认按钮
* ExtendButton 扩展按钮
* FilterButton 内容过滤按钮
* HoverView 悬停视图
* Progress 进度条
* SliderBar 滑动条
* SwitchButton 开关按钮
* Uploader 上传组件
### 视图
* CalendarView 日历视图
* CardView 卡片视图
* FoldView 折叠视图
* GridView 表格视图
* ReportView 报表视图
* ListView 列表视图
* TabView 选项卡视图
* TreeView 树视图
* TileView Windows 10风格的动态磁贴菜单

## 如何编译

### 首先要安装 grunt-cli
```
npm install grunt-cli -g
```

### 在项目中导入 grunt
```
npm install grunt
```

### 开始安装各种插件

1. grunt-contrib-clean: 清除工具
2. grunt-contrib-concat: 文件合并工具
3. grunt-contrib-uglify: js压缩工具
4. grunt-contrib-less: css less编译工具

```
npm install
```
或者
```
npm install grunt-contrib-clean --save-dev
npm install grunt-contrib-concat --save-dev
npm install grunt-contrib-uglify --save-dev
npm install grunt-contrib-less --save-dev
```

### 使用grunt命令

#### 生成主题样式文件
```
grunt prestyle
```

#### clean
```
grunt clean
```

#### 合并
```
grunt
```

#### 构建和压缩
``` 
grunt release
```

#### 构建demo
```
grunt demo
```
