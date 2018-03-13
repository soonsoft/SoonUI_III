module.exports = function(grunt) {

    "use strict";

    // 主题色
    let themeColor = [
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
        }
    ];
    let colors = require("./theme-colors");
    let images = require("./theme-inner-images");
    let highlights = require("./theme-highlights");

    // layer indexes
    let layerIndexes = {
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
    let themeFiles = [];
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
        let key = "dist/theme/" + item.name.toLowerCase() + "/site." + item.name + ".css";
        let value = "theme/site." + item.name + ".less";
        item = {};
        item[key] = value;
        themeFiles.push(item);
    });

    // 控件主题色
    themeFiles.push({ "dist/theme/light/metro-light.all.css": "theme/metro/light/**/*.less" });
    themeFiles.push({ "dist/theme/dark/metro-dark.all.css": "theme/metro/dark/**/*.less" });
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

    // UI库主框架文件
    let frameFiles = [
        "src/soon-ui.js",
        "src/core.js",

        "src/ES5-Array-shims.js",
        "src/ES6-Array-shims.js",
        "src/ES5-String-shims.js",
        "src/ES6-String-shims.js",
        "src/ES5-Function-shims.js",
        "src/ES6-Number-shims.js",
        "src/ES5-Object-shims.js",
        "src/ES6-Promise.shims.js",

        "src/array-faker.js",
        "src/keyarray.js",
        
        "src/util.js",
        "src/util-string.js",
        "src/util-date.js",
        "src/util-object.js",
        "src/util-url.js",
        "src/util-structure-transform.js",
        "src/util-random.js",

        "src/jquery-extends.js",
        "src/cookie.js",
        "src/style-sheet.js"
    ];
    let frameDestFile = "dist/ui-core.<%= pkg.version %>.js";

    // 组件文件
    let componentFiles = [
        "src/component/introsort.js",
        "src/component/animation.js",
        "src/component/custom-event.js",
        "src/component/task.js",
        "src/component/json.js",
        "src/component/ajax.js",
        "src/component/color.js",
        "src/component/browser.js",
        "src/component/image-loader.js",
        "src/component/view-model.js",
        "src/component/define.js",
        "src/component/draggable.js",
        "src/component/uploader.js",
        "src/component/theme.js",
        "src/component/page.js"
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
    
    let wrapper = grunt.file.read("src/wrapper.js").split(/\/\/\$\|\$/),
        option = function(src, filepath) {
            if(filepath === frameFiles[0]) {
                return src;
            }
            return [
                "// Source: ", filepath, "\r\n",
                wrapper[0], 
                "\"use strict\";\r\n",
                src, "\r\n", 
                wrapper[1], "\r\n"
            ].join("");
        };

    grunt.initConfig({
        // 从package.json 文件读入项目配置信息
        pkg: grunt.file.readJSON("package.json"),
        // 合并工具
        concat: {
            options: {
                // 定义一个用于插入合并输出文件之间的字符
                separator: "\n"
            },
            frame: {
                options: {
                    process: option
                },
                src: frameFiles,
                dest: frameDestFile
            },
            components: {
                options: {
                    process: option
                },
                src: componentFiles,
                dest: componentDestFile
            },
            controls: {
                options: {
                    process: option
                },
                src: controlFiles,
                dest: controlDestFile
            },
            effects: {
                options: {
                    process: option
                },
                src: effectFiles,
                dest: effectDestFile
            },
            viewpages: {
                options: {
                    process: option
                },
                src: viewFiles,
                dest: viewDestFile
            },
            dist: {
                // 将要被合并的文件
                src: [
                    frameDestFile,
                    controlDestFile,
                    componentDestFile,
                    effectDestFile,
                    viewDestFile
                ],
                // 合并后的JS文件的存放位置
                dest: "dist/<%= pkg.name %>.<%= pkg.version %>.all.js"
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
                    // ui.core.min.js
                    "dist/ui.core.<%= pkg.version %>.min.js": ["<%= concat.frame.dest %>"],
                    // ui.components.min.js
                    "dist/ui.components.<%= pkg.version %>.min.js": ["<%= concat.components.dest %>"],
                    // ui.controls.min.js
                    "dist/ui.controls.<%= pkg.version %>.min.js": ["<%= concat.controls.dest %>"],
                    // ui.effect.min.js
                    "dist/ui.effect.<%= pkg.version %>.min.js": ["<%= concat.effects.dest %>"],
                    // ui.viewpages.min.js
                    "dist/ui.viewpages.<%= pkg.version %>.min.js": ["<%= concat.viewpages.dest %>"],
                    // SOON.UI.all.min.js
                    "dist/<%= pkg.name %>.<%= pkg.version %>.all.min.js": ["<%= concat.dist.dest %>"]
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
            files: ["gruntfile.js", "src/**/*.js", "test/**/*.js"],
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
                dist: "demo/pages/{0}/{1}.html"
            }
        }
    });

    //加载自定义命令，用于创建主题样式文件
    grunt.loadTasks( "command/theme_factory" );
    //加载html合并命令
    grunt.loadTasks( "command/html_builder" );
    //注册其它命令
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-qunit");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-watch");
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
    grunt.registerTask("default", ["clean", "prestyle", "less:production", "concat"]);
    // 在命令行上输入"grunt release，就会执行"
    grunt.registerTask("release", ["clean", "prestyle", "less:devlopment", "concat", "uglify"]);
};
