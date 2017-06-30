module.exports = function( grunt ) {
    "use strict";

    var fs = require( "fs" ),
        path = require("path"),
        rootPath = __dirname + "/../../",
        distPath,
        layout = "demo/views/shared/layout.html";

    var partialBegin = /<partial([^<]+)?[\/]?>/gi,
        partialEnd = /<\/partial([\s\b]+)?>/gi,
        layoutKey = /@\{([^@]+)\}/gi,
        textFormatReg = /\\?\{([^{}]+)\}/gm;

    var layoutText,
        partialIdList;

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

    function prepareLayout(path) {
        if(!fs.existsSync(path)) {
            return null;
        }
        layoutText = fs.readFileSync(path, "utf8");
        if(!layoutText) {
            throw new Error("layout is empty");
        }
        let idArray = layoutText.match(layoutKey);
        for(let i = 0; i < idArray.length; i++) {
            let id = idArray[i];
            id = id.substring(2);
            id = id.substring(0, id.length - 1);
            partialIdList.push(id);
        }
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
        
        buildView(partials, viewPath);
    }

    function buildView(partials, viewPath) {
        let template = layoutText + "";
        for(let i = 0; i < partialIdList.length; i++) {
            let partialId = partialIdList[i];
            template = template.replace(new RegExp("@{" + partialId + "}", "g"), partials[partialId]);
        }

        let dirname = path.dirname(viewPath);
        dirname = dirname.substring(dirname.lastIndexOf("/") + 1);
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
            var templateSrc = path.join(rootPath, this.data.views),
                layoutPath = path.join(rootPath, layout);
            
            distPath = this.data.dist;
            layoutText = "";
            partialIdList = [];

            let layoutFile = grunt.file.expand(layoutPath);
            if(layoutFile.length > 0) {
                layoutFile = layoutFile[0];
            }
            prepareLayout(layoutFile);

            let files = grunt.file.expand(templateSrc);
            for(let i = 0; i < files.length; i++) {
                let filename = files[i];
                if(filename === layoutFile) {
                    continue;
                }
                createPartial(filename);
            }
        }
    );
    
};
