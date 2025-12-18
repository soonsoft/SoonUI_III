const { get, file } = require("grunt");

module.exports = function( grunt ) {
    "use strict";

    let fs = require( "fs" ),
        path = require("path"),
        rootPath = __dirname + "/../../",
        distPath;

    let partialBegin = /<partial([^<]+)?[\/]?>/gi,
        partialEnd = /<\/partial([\s\b]+)?>/gi,
        layoutKey = /@\{([^@\{\}]+)\}/gi,
        textFormatReg = /\\?\{([^{}]+)\}/gm;

    let layoutDirectory,
        defaultLayout,
        layoutMap;

    function format (str, params) {
        let Arr_slice = Array.prototype.slice;
        let array = Arr_slice.call(arguments, 1);
        return str.replace(textFormatReg, function (match, name) {
            if (match.charAt(0) == '\\')
                return match.slice(1);
            let index = Number(name);
            if (index >= 0)
                return array[index];
            if (params && params[name])
                return params[name];
            return '';
        });
    }

    function getFilename(filePath) {
        return filePath.substring(filePath.lastIndexOf(path.sep) + 1);
    }

    function prepareLayout(layoutDir) {
        let files = fs.readdirSync(layoutDir);
        for(let i = 0; i < files.length; i++) {
            let file = files[i];
            let filename = path.join(layoutDir, file);
            let fileInfo = fs.statSync(filename);
            if(fileInfo.isFile() && path.extname(filename).toLowerCase() === ".html") {
                createLayout(filename);
            }
        }
    }

    function createLayout(filePath) {
        let layoutFilename = getFilename(filePath);
        if(layoutMap.has(layoutFilename)) {
            return;
        }

        if(!fs.existsSync(filePath)) {
            return;
        }
        let layoutInfo = {
            layoutText: null,
            partialIdList: []
        };
        let layoutText = fs.readFileSync(filePath, "utf8");
        if(!layoutText) {
            throw new Error("layout is empty");
        }
        layoutInfo.layoutText = layoutText;

        let idArray = layoutText.match(layoutKey);
        if(Array.isArray(idArray)) {
            for(let i = 0; i < idArray.length; i++) {
                let id = idArray[i];
                id = id.substring(2);
                id = id.substring(0, id.length - 1);
                layoutInfo.partialIdList.push(id);
            }
        }
        layoutMap.set(layoutFilename, layoutInfo);
    }

    function createPartial(viewPath) {
        let partials = {};
        if(!fs.existsSync(viewPath)) {
            return null;
        }
        let html = fs.readFileSync(viewPath, "utf8");
        let begin;
        let attr;
        let end;

        let layoutInfo = layoutMap.get(getFilename(defaultLayout));
        let array = html.match(layoutKey);
        if(Array.isArray(array)) {
            for(let i = 0; i < array.length; i++) {
                let text = array[i];
                text = text.substring(2);
                text = text.substring(0, text.length - 1);
                let arr = text.split(":");
                if(arr[0].toLowerCase() === "layout") {
                    let key = (arr[1] + "").toLowerCase();
                    if(layoutMap.has(key)) {
                        layoutInfo = layoutMap.get(key);
                    }
                }
                break;
            }
        }
        if(!layoutInfo) {
            return;
        }
        
        partialBegin.lastIndex = 0;
        partialEnd.lastIndex = 0;
        while((begin = partialBegin.exec(html)) !== null) {
            let index = partialBegin.lastIndex;

            attr = begin[1];
            let id = attr.split("=")[1];
            id = id.replace(/[\"\']/g, "");
            if(id.length === 0) {
                throw new Error("id is wrong");
            }

            partialBegin.lastIndex = index;
            end = partialEnd.exec(html);
            if(!end) {
                break;
            }
            let lastIndex = partialEnd.lastIndex - end[0].length;
            let text = html.substring(index, lastIndex);

            partials[id] = text;
        }
        
        buildView(partials, viewPath, layoutInfo);
    }

    function buildView(partials, viewPath, layoutInfo) {
        let template = layoutInfo.layoutText;
        for(let i = 0; i < layoutInfo.partialIdList.length; i++) {
            let partialId = layoutInfo.partialIdList[i];
            template = template.replace(new RegExp("@{" + partialId + "}", "g"), partials[partialId]);
        }

        let dirname = path.dirname(viewPath);
        dirname = dirname.substring(dirname.lastIndexOf(path.sep) + 1);
        let filename = path.basename(viewPath, path.extname(viewPath));

        let distFilename = format(distPath, dirname, filename);
        distFilename = path.join(rootPath, distFilename);
        
        ensureDirectory(distFilename);
        if(fs.existsSync(distFilename)) {
            fs.unlinkSync(distFilename);
        }

        fs.writeFileSync(distFilename, template, "utf8");
    }

    function ensureDirectory(filename) {
        let direcory = path.dirname(filename);
        direcory = path.join(direcory, "");
        if(!fs.existsSync(direcory)) {
            mkdirsSync(direcory);
        }
    }

    function mkdirsSync(dirpath, mode) { 
        let pathtmp;
        if (!fs.existsSync(dirpath)) {
            dirpath.split(path.sep).forEach(function(dirname) {
                if (pathtmp) {
                    pathtmp = path.join(pathtmp, dirname);
                }
                else {
                    pathtmp = dirname;
                }
                if (!fs.existsSync(pathtmp)) {
                    if (!fs.mkdirSync(pathtmp, mode)) {
                        return false;
                    }
                }
            });
        }
        return true; 
    }

    // 支持通过命令行参数或任务 target 指定主题：
    // 用法示例：`grunt html-build --theme=light` 或 `grunt html-build:light`
    grunt.registerMultiTask(
        "html-build",
        "构建页面",
        function() {
            layoutMap = new Map();
            layoutDirectory = "demo/views/shared";
            defaultLayout = "layout.html";
            
            distPath = this.data.dist;
            if(this.data.layoutDirectory) {
                layoutDirectory = this.data.layoutDirectory;
            }
            defaultLayout = path.join(layoutDirectory, defaultLayout);

            let templateSrc = path.join(rootPath, this.data.views);
            let layoutFile = grunt.file.expand(path.join(rootPath, defaultLayout));
            if(layoutFile.length > 0) {
                defaultLayout = path.join(layoutFile[0]);
            }
            let layoutDir = grunt.file.expand(path.join(rootPath, layoutDirectory));
            if(layoutDir.length > 0) {
                layoutDir = layoutDir[0];
            }
            console.log("default layout:", defaultLayout);
            prepareLayout(layoutDir);

            let excludes = this.data.excludes;
            if(Array.isArray(excludes)) {
                let arr = [];
                for(let i = 0; i < excludes.length; i++) {
                    let filename = grunt.file.expand(path.join(rootPath, excludes[i]));
                    if(Array.isArray(filename)) {
                        for(let j = 0; j < filename.length; j++) {
                            arr.push(path.join(filename[j]));
                        }
                    } else {
                        arr.push(path.join(filename));
                    }
                }
                excludes = arr;
            } else {
                excludes = [];
            }

            let files = grunt.file.expand(templateSrc);
            for(let i = 0; i < files.length; i++) {
                let filePath = path.join(files[i]);
                // 排除模板页
                if(layoutMap.has(getFilename(filePath))) {
                    continue;
                }
                // 排除指定的文件
                let isContinue = false;
                for(let j = 0; j < excludes.length; j++) {
                    if(filePath === excludes[j]) {
                        isContinue = true;
                        break;
                    }
                }
                if(isContinue) {
                    continue;
                }
                createPartial(filePath);
            }
        }
    );
};
