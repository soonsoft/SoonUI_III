module.exports = function( grunt ) {
    "use strict";

    var fs = require( "fs" ),
        path = require("path"),
        rootPath = __dirname + "/../../",
        distPath;

    var partialBegin = /<partial([^<]+)?[\/]?>/gi,
        partialEnd = /<\/partial([\s\b]+)?>/gi,
        layoutKey = /@\{([^@\{\}]+)\}/gi,
        textFormatReg = /\\?\{([^{}]+)\}/gm;

    var layoutDirectory = "demo/views/shared",
        layout = "demo/views/shared/layout.html",
        layoutMap = new Map();

    function format (str, params) {
        var Arr_slice = Array.prototype.slice;
        var array = Arr_slice.call(arguments, 1);
        return str.replace(textFormatReg, function (match, name) {
            if (match.charAt(0) == '\\')
                return match.slice(1);
            var index = Number(name);
            if (index >= 0)
                return array[index];
            if (params && params[name])
                return params[name];
            return '';
        });
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

    function createLayout(layoutFilename) {
        if(layoutMap.has(layoutFilename)) {
            return;
        }
        if(!fs.existsSync(layoutFilename)) {
            return;
        }
        let layoutInfo = {
            layoutText: null,
            partialIdList: []
        };
        let layoutText = fs.readFileSync(layoutFilename, "utf8");
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
        var partials = {};
        if(!fs.existsSync(viewPath)) {
            return null;
        }
        let html = fs.readFileSync(viewPath, "utf8");
        let begin;
        let attr;
        let end;

        let layoutInfo = layoutMap.get(layout);
        let array = html.match(layoutKey);
        if(Array.isArray(array)) {
            for(let i = 0; i < array.length; i++) {
                let text = array[i];
                text = text.substring(2);
                text = text.substring(0, text.length - 1);
                let arr = text.split(":");
                if(arr[0].toLowerCase() === "layout") {
                    let key = (arr[1] + "").toLowerCase();
                    key = path.join(rootPath, key);
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
        var pathtmp;
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

    grunt.registerMultiTask(
        "html-build",
        "构建页面",
        function() {
            distPath = this.data.dist;

            let templateSrc = path.join(rootPath, this.data.views);
            let layoutFile = grunt.file.expand(path.join(rootPath, layout));
            if(layoutFile.length > 0) {
                layout = path.join(layoutFile[0]);
            }
            let layoutDir = grunt.file.expand(path.join(rootPath, layoutDirectory));
            if(layoutDir.length > 0) {
                layoutDir = layoutDir[0];
            }
            prepareLayout(layoutDir);

            let files = grunt.file.expand(templateSrc);
            for(let i = 0; i < files.length; i++) {
                let filename = path.join(files[i]);
                if(layoutMap.has(filename)) {
                    continue;
                }
                createPartial(filename);
            }
        }
    );
};
