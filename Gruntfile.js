module.exports = function(grunt) {

    "use strict";

    var i, len, item, key, value;

    // 主题色
    var themeColor = [
        {
            // 主题名
            name: "Light",
            // 描述
            description: "光明",
            // 背景色
            "background-color": "#ffffff",
            // 字体颜色
            "font-color": "#333333",
            // 边框颜色
            "border-color": "#dcdcdc",
            // 面板颜色
            "panel-color": "#f1f1f1",
            // 面板悬停色
            "panel-hover-color": "#dcdcdc",
            // 面板激活色
            "panel-active-color": "#aaaaaa",
            // 交互元素色
            "tool-color": "#666666",
            // 只读色
            "readonly-color": "#666666",
            // 禁用色
            "disabled-color": "#aaaaaa",
            // 悬停色
            "hover-color": "#434343",
            // 激活色
            "active-color": "#434343",
            // 阴影色
            "shadow-color": "#434343"
        },
        {
            // 主题名
            name: "Dark",
            // 描述
            description: "暗夜",
            // 背景色
            "background-color": "#1d1f21",
            // 字体颜色
            "font-color": "#aaaaaa",
            // 边框颜色
            "border-color": "#5d5f60",
            // 面板颜色
            "panel-color": "#3c3f41",
            // 面板悬停色
            "panel-hover-color": "#5d5f60",
            // 面板激活色
            "panel-active-color": "#1d1f21",
            // 交互元素色
            "tool-color": "#888888",
            // 只读色
            "readonly-color": "#888888",
            // 禁用色
            "disabled-color": "#5d5f60",
            // 悬停色
            "hover-color": "#999999",
            // 激活色
            "active-color": "#999999",
            // 阴影色
            "shadow-color": "#999999"
        }
    ];
    // layer indexes
    var layerIndexes = {
        // 遮罩层
        "mask-layer": 9999,
        // 弹出面板层
        "box-layer": 9999,
        // 弹出控件层
        "ctrl-layer": 10000,
        // 最高层
        "highest-layer": 10001
    };
    var themeFiles = [];
    // 主题色
    for(i = 0, len = themeColor.length; i < len; i++) {
        item = themeColor[i];
        // 合并参数
        for(key in layerIndexes) {
            item[key] = layerIndexes[key];
        }
        // 构建输出文件
        key = "dist/theme/" + item.name.toLowerCase() + "/site." + item.name + ".css";
        value = "theme/site." + item.name + ".less";
        item = {};
        item[key] = value;
        themeFiles.push(item);
    }

    // 控件主题色
    themeFiles.push({ "dist/theme/light/metro-light.all.css": "theme/light/**/*.less" });
    themeFiles.push({ "dist/theme/dark/metro-dark.all.css": "theme/dark/**/*.less" });

    // 高亮色
    var highlights = [
        {
            name: "Default",
            description: "藏蓝",
            "highlight-color": "#3E5A99",
            "highlight-second-color": "#5B73A8"
        },
        {
            name: "Amber",
            description: "琥珀",
            "highlight-color": "#F29D00",
            "highlight-second-color": "#F4AC26"
        },
        {
            name: "Blue",
            description: "蓝色",
            "highlight-color": "#2078EF",
            "highlight-second-color": "#428CF1"
        },
        {
            name: "BlueGray",
            description: "蓝灰",
            "highlight-color": "#4B8BAE",
            "highlight-second-color": "#669DBA"
        },
        {
            name: "Brown",
            description: "褐色",
            "highlight-color": "#752918",
            "highlight-second-color": "#8F5144"
        },
        {
            name: "Carmine",
            description: "洋红",
            "highlight-color": "#FF2968",
            "highlight-second-color": "#FF497F"
        },
        {
            name: "Cyan",
            description: "青色",
            "highlight-color": "#00CCCC",
            "highlight-second-color": "#26D4D4"
        },
        {
            name: "DarkRed",
            description: "暗红",
            "highlight-color": "#990000",
            "highlight-second-color": "#AC3030"
        },
        {
            name: "Golden",
            description: "金色",
            "highlight-color": "#BDB76B",
            "highlight-second-color": "#C7C281"
        },
        {
            name: "GrassGreen",
            description: "草绿",
            "highlight-color": "#99DA0D",
            "highlight-second-color": "#ACE13B"
        },
        {
            name: "Gray",
            description: "灰色",
            "highlight-color": "#A1A1A1",
            "highlight-second-color": "#909090"
        },
        {
            name: "Green",
            description: "绿色",
            "highlight-color": "#008A00",
            "highlight-second-color": "#30A030"
        },
        {
            name: "GreenLight",
            description: "亮绿",
            "highlight-color": "#66FF99",
            "highlight-second-color": "#32FF77"
        },
        {
            name: "Indigo",
            description: "靛蓝",
            "highlight-color": "#5122B5",
            "highlight-second-color": "#724CC3"
        },
        {
            name: "Jade",
            description: "翡翠",
            "highlight-color": "#1ABC9C",
            "highlight-second-color": "#3DC6AB"
        },
        {
            name: "Light",
            description: "光色",
            "highlight-color": "#FFCC00",
            "highlight-second-color": "#FFDC52"
        },
        {
            name: "Lip",
            description: "唇色",
            "highlight-color": "#D783A7",
            "highlight-second-color": "#DD96B4"
        },
        {
            name: "Olive",
            description: "橄榄",
            "highlight-color": "#8AAD92",
            "highlight-second-color": "#9CB9A2"
        },
        {
            name: "Orange",
            description: "橙色",
            "highlight-color": "#FF8627",
            "highlight-second-color": "#FF9848"
        },
        {
            name: "Pink",
            description: "粉红",
            "highlight-color": "#F567C5",
            "highlight-second-color": "#F77ECE"
        },
        {
            name: "PinkPurple",
            description: "粉紫",
            "highlight-color": "#A988DF",
            "highlight-second-color": "#B69AE4"
        },
        {
            name: "Purple",
            description: "紫色",
            "highlight-color": "#9F4AC9",
            "highlight-second-color": "#AD65D1"
        },
        {
            name: "Red",
            description: "红色",
            "highlight-color": "#E53935",
            "highlight-second-color": "#E95753"
        },
        {
            name: "Rose",
            description: "玫瑰红",
            "highlight-color": "#BF1E4B",
            "highlight-second-color": "#C94066"
        },
        {
            name: "SeaBlue",
            description: "海蓝",
            "highlight-color": "#0F80C1",
            "highlight-second-color": "#3393CA"
        },
        {
            name: "SkyBlue",
            description: "天蓝",
            "highlight-color": "#5DB2FF",
            "highlight-second-color": "#75BEFF"
        },
        {
            name: "SkyLine",
            description: "天际蓝",
            "highlight-color": "#00C8F8",
            "highlight-second-color": "#52DAFA"
        },
        {
            name: "SpaceGray",
            description: "深空灰",
            "highlight-color": "#616161",
            "highlight-second-color": "#797979"
        }
    ];
    // 高亮色
    for(i = 0, len = highlights.length; i < len; i++) {
        item = highlights[i];
        key = "dist/theme/color/ui.metro." + item.name + ".css";
        value = "theme/color/ui.metro." + item.name + ".less";
        item = {};
        item[key] = value;
        themeFiles.push(item);
    }

    // UI库主框架文件
    var frameFiles = [
        "ui/soon-ui.js",
        "ui/core.js",

        "ui/ecmascript-extends.js",
        "ui/promise.js",
        "ui/array-faker.js",
        "ui/keyarray.js",
        "ui/introsort.js",
        
        "ui/util.js",
        "ui/util-string.js",
        "ui/util-object.js",
        "ui/util-url.js",
        "ui/util-structure-transform.js",
        "ui/util-random.js",

        "ui/animation.js",
        "ui/custom-event.js",
        "ui/json.js",
        "ui/ajax.js",
        "ui/cookie.js",
        "ui/browser.js",
        "ui/image-loader.js",

        "ui/jquery-extends.js",
        "ui/define.js",
        "ui/draggable.js",
        "ui/style-sheet.js",
        "ui/theme.js",
        "ui/page.js"
    ];
    var frameDestFile = "dist/ui-core.<%= pkg.version %>.js";

    // 组件文件
    var componentFiles = [
        "ui/component/**/*.js"
    ];
    var componentDestFile = "dist/ui-components.<%= pkg.version %>.js";

    // 控件文件
    var controlFiles = [
        "ui/control/base/**/*.js",
        "ui/control/common/**/*.js",
        "ui/control/box/**/*.js",
        "ui/control/select/**/*.js",
        "ui/control/view/**/*.js",
        "ui/control/tools/**/*.js",
        "ui/control/images/**/*.js"
    ];
    var controlDestFile = "dist/ui-controls.<%= pkg.version %>.js";

    // 特效文件
    var effectFiles = [
        "ui/effect/**/*.js"
    ];
    var effectDestFile = "dist/ui-effects.<%= pkg.version %>.js";

    // 视图文件
    var viewFiles = [
        "ui/viewpage/**/*.js"
    ];
    var viewDestFile = "dist/ui-viewpages.<%= pkg.version %>.js";
    
    var wrapper = grunt.file.read("ui/wrapper.js").split(/\/\/\$\|\$/),
        option = function(src, filepath) {
            if(filepath === frameFiles[0]) {
                return src;
            }
            return [
                "// Source: ", filepath, "\n",
                wrapper[0], 
                src, "\n", 
                wrapper[1], "\n"
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
            control: {
                options: {
                    process: option
                },
                src: controlFiles,
                dest: controlDestFile
            },
            effect: {
                options: {
                    process: option
                },
                src: effectFiles,
                dest: effectDestFile
            },
            view: {
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
                banner: "/*! <%= pkg.name %> <%= grunt.template.today('yyyy-dd-mm') %> */\n"
            },
            dist: {
                files: {
                    // ui.core.min.js 文件压缩
                    "dist/ui.core.<%= pkg.version %>.min.js": ["<%= concat.frame.dest %>"]
                    // ui.ctrls.min.js 文件压缩
                    //"dist/<%= pkg.name %>.<%= pkg.version %>.min.js": ["<%= concat.dist.dest %>"]
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
            files: ["gruntfile.js", "ui/**/*.js", "test/**/*.js"],
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
                dist: "theme/{0}/{1}.less"
            }
        }
    });

    //加载自定义命令，用于创建主题样式文件
    grunt.loadTasks( "command/theme_factory" );
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
    // 在命令行上输入"grunt check"，执行语法检查。
    grunt.registerTask("check", ["jshint"]);
    // 在命令行上输入"grunt test"，test task就会被执行。
    grunt.registerTask("test", ["jshint", "qunit"]);
    // 在命令行上输入"grunt"，就会执行default task
    grunt.registerTask("default", ["clean", "less:production", "concat"]);
    // 在命令行上输入"grunt release，就会执行"
    grunt.registerTask("release", ["clean", "less:devlopment", "concat", "uglify"]);
};
