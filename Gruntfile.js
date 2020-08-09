module.exports = function(grunt) {

    "use strict";
    const rsrcHolder = /\/\/\$\|\$/;
    const tempPrefix = "_temp_";

    // 语言
    const langPath = __dirname + "/src/i18n";
    const lang = "chs";
    const i18n = require("./i18n-loader");
    // 主题色
    const themeColor = [
        {
            // 主题名
            name: "light",
            // 描述
            description: "光明"
        },
        {
            // 主题名
            name: "dark",
            // 描述
            description: "暗夜"
        },
        {
            // 主题名
            name: "galaxy",
            // 描述
            description: "银河"
        }
    ];
    const colors = require("./theme-colors");
    const images = require("./theme-inner-images");
    const highlights = require("./theme-highlights");

    // layer indexes
    const layerIndexes = {
        // 布局覆盖层
        "layout-layer": 999,
        // 布局覆盖层按钮
        "layout-action-layer": 1000,
        // 内容边栏
        "container-aside": 9000,
        // 遮罩层
        "mask-layer": 9999,
        // 弹出面板层
        "box-layer": 9999,
        // 弹出控件层
        "ctrl-layer": 10000,
        // 最高层
        "highest-layer": 10001
    };
    const themeFiles = [];
    // 主题色
    themeColor.forEach(function(item) {
        let name = item.name;
        let color = colors[name];
        // 合并参数
        for(let key in color) {
            if(color.hasOwnProperty(key)) {
                item[key] = color[key];
            }
        }
        let image = images[name];
        for(let key in image) {
            if(image.hasOwnProperty(key)) {
                item[key] = "url(\"" + image[key] + "\")";
            }
        }
        for(let key in layerIndexes) {
            if(layerIndexes.hasOwnProperty(key)) {
                item[key] = layerIndexes[key];
            }
        }
        // 构建输出文件
        item = {};
        item["dist/theme/" + name + "/site-" + name + ".css"] = "theme/site." + name + ".less";
        themeFiles.push(item);

        item = {};
        item["dist/theme/" + name + "/metro-" + name + ".all.css"] = "theme/metro/" + name + "/**/*.less";
        themeFiles.push(item);
    });

    // 控件主题色
    themeFiles.push({ "dist/theme/viewpage/viewpage.all.css": "theme/viewpage/**/*.less" });

    // 高亮色
    for(let i = 0; i < highlights.length; i++) {
        let item = highlights[i];
        let key = "dist/theme/color/ui.metro." + item.name + ".css";
        let value = "theme/color/ui.metro." + item.name + ".less";
        item = {};
        item[key] = value;
        themeFiles.push(item);
    }

    // 源码过滤器
    const filters = {
        "src/i18n.js": function(src) {
            let i18nSource = i18n.loadLanguages.call(grunt, langPath + "/" + lang);
            return src + "\r\n" + i18nSource;
        }
    };

    // UI库主框架文件
    let coreFiles = [
        "src/core.js",
        "src/i18n.js",

        // "src/ES5-Array-shims.js",
        // "src/ES6-Array-shims.js",
        // "src/ES5-String-shims.js",
        // "src/ES6-String-shims.js",
        // "src/ES5-Function-shims.js",
        // "src/ES5-JSON-shims.js",
        // "src/ES6-Number-shims.js",
        // "src/ES5-Object-shims.js",
        // "src/ES6-Promise.shims.js",
        // "src/ES6-Map.shims.js",

        "src/array-like.js",
        "src/keyarray.js",
        "src/linked-list.js",
        
        "src/util.js",
        "src/util-string.js",
        "src/util-date.js",
        "src/util-object.js",
        "src/util-url.js",
        "src/util-structure-transform.js",
        "src/util-random.js",

        "src/parser.js",
        "src/task.js",
        "src/jquery-extend.js",
        "src/cookie.js",
        "src/style-sheet.js"
    ];
    // 单独的ui.core.js
    let coreDestFile = "dist/ui-core.<%= pkg.version %>.js";
    // 用于生产SOON.UI.all.js的部分，临时文件
    let coreTempFile = "dist/ui-core" + tempPrefix + ".js";

    // 组件文件
    let componentFiles = [
        "src/component/introsort.js",
        "src/component/animation.js",
        "src/component/selector-set.js",
        "src/component/event-delegate.js",
        "src/component/custom-event.js",
        "src/component/ajax.js",
        //"src/component/ajax-extend.js",
        "src/component/color.js",
        "src/component/browser.js",
        "src/component/image-loader.js",
        "src/component/view-model.js",
        "src/component/define.js",
        "src/component/draggable.js",
        "src/component/theme.js",
        "src/component/page.js",
        //"src/component/router.js"
    ];
    let componentDestFile = "dist/ui-components.<%= pkg.version %>.js";

    // 控件文件
    let controlFiles = [
        "src/control/base/**/*.js",
        "src/control/common/**/*.js",
        "src/control/box/**/*.js",
        "src/control/select/**/*.js",
        "src/control/view/**/*.js",
        "src/control/tools/**/*.js",
        "src/control/images/**/*.js"
    ];
    let controlDestFile = "dist/ui-controls.<%= pkg.version %>.js";

    // 特效文件
    let effectFiles = [
        "src/effect/**/*.js"
    ];
    let effectDestFile = "dist/ui-effects.<%= pkg.version %>.js";

    // 视图文件
    let viewFiles = [
        "src/viewpage/**/*.js"
    ];
    let viewDestFile = "dist/ui-viewpages.<%= pkg.version %>.js";
    
    // 内容合并
    let wrapper = grunt.file.read("src/wrapper.js").split(rsrcHolder);
    let wrapFn = function(src, filepath) {
        let filter = filters[filepath];
        if(typeof filter === "function") {
            src = filter(src);
        }
        return [
            "// Source: ", filepath, "\r\n",
            wrapper[0], 
            src, "\r\n", 
            wrapper[1], "\r\n"
        ].join("");
    };

    let tempFiles = [];
    let removeTempFn = function(src, filepath) {
        if(filepath.indexOf(tempPrefix) > -1) {
            tempFiles.push(filepath);
        }
        return src;
    };

    let shell = grunt.file.read("src/soon-ui.js").split(rsrcHolder);
    shell[0] = shell[0] + "ui.version = '<%= pkg.version %>';\r\n\r\n";

    grunt.initConfig({
        // 从package.json 文件读入项目配置信息
        pkg: grunt.file.readJSON("package.json"),
        // 合并工具
        concat: {
            options: {
                // 定义一个用于插入合并输出文件之间的字符
                separator: "\r\n"
            },
            core: {
                options: {
                    // 只执行一次
                    banner: shell[0],
                    process: wrapFn,
                    // 只执行一次
                    footer: shell[1]
                },
                src: coreFiles,
                dest: coreDestFile
            },
            coreSource: {
                options: {
                    process: wrapFn
                },
                src: coreFiles,
                dest: coreTempFile
            },
            components: {
                options: {
                    process: wrapFn
                },
                src: componentFiles,
                dest: componentDestFile
            },
            controls: {
                options: {
                    process: wrapFn
                },
                src: controlFiles,
                dest: controlDestFile
            },
            effects: {
                options: {
                    process: wrapFn
                },
                src: effectFiles,
                dest: effectDestFile
            },
            viewpages: {
                options: {
                    process: wrapFn
                },
                src: viewFiles,
                dest: viewDestFile
            },
            dist: {
                options: {
                    // 只执行一次
                    banner: shell[0],
                    process: removeTempFn,
                    // 只执行一次
                    footer: shell[1]
                },
                // 将要被合并的文件
                src: [
                    coreTempFile,
                    componentDestFile,
                    controlDestFile,
                    // effectDestFile, // 特效不打入all.js
                    viewDestFile
                ],
                // 合并后的JS文件的存放位置
                dest: "dist/<%= pkg.title %>.<%= pkg.version %>.all.js"
            }
        },
        // 压缩工具
        uglify: {
            options: {
                // 此处定义的banner注释将插入到输出文件的顶部
                banner: "/*! <%= pkg.name %> <%= grunt.template.today('yyyy-mm-dd') %> */\n"
            },
            dist: {
                files: {
                    // ui-core.min.js
                    "dist/ui-core.<%= pkg.version %>.min.js": ["<%= concat.core.dest %>"],
                    // ui-components.min.js
                    "dist/ui-components.<%= pkg.version %>.min.js": ["<%= concat.components.dest %>"],
                    // ui-controls.min.js
                    "dist/ui-controls.<%= pkg.version %>.min.js": ["<%= concat.controls.dest %>"],
                    // ui-effects.min.js
                    "dist/ui-effects.<%= pkg.version %>.min.js": ["<%= concat.effects.dest %>"],
                    // ui-viewpages.min.js
                    "dist/ui-viewpages.<%= pkg.version %>.min.js": ["<%= concat.viewpages.dest %>"],
                    // SOON.UI.all.min.js
                    "dist/<%= pkg.title %>.<%= pkg.version %>.all.min.js": ["<%= concat.dist.dest %>"]
                }
            }
        },
        // 清除工具
        clean: {
            src: ["dist"]
        },
        // css less编译工具
        less: {
            devlopment: {
                option: {
                    path: ["theme"]
                },
                files: themeFiles
            },
            production: {
                option: {
                    compress: true,
                    path: ["theme"]
                },
                files: themeFiles
            }
        },
        // 单元测试
        qunit: {
            files: ["test/**/*.html"]
        },
        // javaScript语法和风格的检查工具
        jshint: {
            // define the files to lint
            files: ["gruntfile.js", "src/**/*.js"],
            // configure JSHint (documented at http://www.jshint.com/docs/)
            options: {
                // more options here if you want to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true
                }
            }
        },
        watch: {
            files: ["<%= jshint.files %>"],
            tasks: ["jshint", "qunit"]
        },
        "temp-remove": {
            files: tempFiles
        },
        "theme-create": {
            theme: {
                colors: themeColor,
                template: "template/site.template.less",
                dist: "theme/site.{0}.less"
            },
            highlight: {
                colors: highlights,
                template: "template/highlight.template.less",
                dist: "theme/color/ui.metro.{0}.less"
            },
            ctrls: {
                colors: themeColor,
                template: "template/metro/**/*.less",
                dist: "theme/metro/{0}/{1}.less"
            }
        },
        "html-build": {
            demo: {
                views: "demo/views/**/*.html",
                dist: "demo/pages/{0}/{1}.html",
                layoutDirectory: "demo/views/shared",
                defaultLayout: "demo/views/shared/layout.html",
                excludes: [
                    "demo/views/shared/**/*.html"
                ]
            }
        }
    });

    //临时文件删除器
    grunt.loadTasks("command/temp_remove");
    //加载自定义命令，用于创建主题样式文件
    grunt.loadTasks("command/theme_factory");
    //加载html合并命令
    grunt.loadTasks("command/html_builder");
    //注册其它命令
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-less");

    // 创建主题样式文件
    grunt.registerTask("prestyle", ["theme-create"]);
    // 创建主题样式文件
    grunt.registerTask("demo", ["html-build"]);
    // 在命令行上输入"grunt check"，执行语法检查。
    grunt.registerTask("check", ["jshint"]);
    // 在命令行上输入"grunt test"，test task就会被执行。
    grunt.registerTask("test", ["jshint", "qunit"]);
    // 在命令行上输入"grunt"，就会执行default task
    grunt.registerTask("default", ["clean", "prestyle", "less:production", "concat", "temp-remove"]);
    // 在命令行上输入"grunt release，就会执行"
    grunt.registerTask("release", ["clean", "prestyle", "less:devlopment", "concat", "temp-remove", "uglify"]);
};
