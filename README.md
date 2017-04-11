# SoonUI_III
用于桌面Web浏览器的UI框架，基于jQuery。
> 用于桌面Web浏览器的UI框架，基于jQuery。这是UI库的3.0版本，本次的版本升级会对整个库进行一次重构，使其更加模块化，分层更清晰。分散的构建形式也使得大家可以很容易的从中分离出一部分用于构建现有的项目，甚至项目中正好需要某一个控件，而不用为了这一个控件引入整个SoonUI，保持前端的整洁和轻巧。<br />另外原来的2.x的版本中有很多代码和控件都来自于实际的项目，有很多实现带有很浓郁的项目风格，无论从API设计还是实现细节上都没有经过很好的考虑。虽然我在把这些代码从项目中整理封装到UI库的时候已经适当的重构过了，但依然不够好。所以这次也趁着这个机会正好将原来的一些不好的功能剥离出来，让所有控件的抽象程度和易用性更上一个台阶。
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

* npm install grunt-contrib-clean --save-dev
* npm install grunt-contrib-concat --save-dev
* npm install grunt-contrib-uglify --save-dev
* npm install grunt-contrib-qunit --save-dev
* npm install grunt-contrib-jshint --save-dev
* npm install grunt-contrib-watch --save-dev
* npm install grunt-contrib-less --save-dev

### 使用grunt命令

#### create theme less files
> grunt prestyle

#### clean
> grunt clean

#### build
> grunt

