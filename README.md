# SoonUI_III
用于桌面Web浏览器的UI框架，基于jQuery。
> 这是UI库的3.0版本，本次会对各个UI组件进行重构，使其更加模块化，分层更清晰。同时也更容易的从中分离出一部分用于构建现有的项目。
## 组件
> 待续...
## 控件
> 待续...

## 如何编译

### 首先要安装 grunt-cli
> npm install grunt-cli -g

### 在项目中导入 grunt
> npm install grunt

### 开始安装各种插件

1. grunt-contrib-clean: 清除工具
2. grunt-contrib-concat: 文件合并工具
3. grunt-contrib-uglify: js压缩工具
4. grunt-contrib-qunit: js单元测试工具
5. grunt-contrib-jshint: js语法检查和风格检查工具
6. grunt-contrib-watch: 监控文件
7. grunt-contrib-less: css less编译工具

> npm install grunt-contrib-clean --save-dev

### 使用grunt命令

#### create theme less files
> grunt prestyle

#### clean
> grunt grunt clean

#### build
> grunt

