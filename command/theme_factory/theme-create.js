module.exports = function( grunt ) {
    "use strict";

    var fs = require( "fs" ),
        path = require("path"),
        rootPath = __dirname + "/../../";
    var textFormatReg = /\\?\{([^{}]+)\}/gm;

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

    function loadTemplate (path) {
        if(!fs.existsSync(path)) {
            return null;
        }
        return fs.readFileSync(path, "utf8");
    }

    function buildColorParameters (item, description) {
        if(!item) {
            return;
        }
        var params = [];
        let color = item["background-color"] || item["highlight-color"];
        params.push("/*\r\n");
        params.push("\tColor: ", color);
        if(description) {
            params.push("\r\n\tName: ", description);
        }
        params.push("\r\n*/\r\n\r\n");
        for(let key in item) {
            if(key === "name" || key === "description") {
                continue;
            }
            if(item.hasOwnProperty(key)) {
                params.push("@",  key, ": ", item[key], ";\r\n");
            }
        }
        return params.join("");
    }

    function ensureDirectory(filename) {
        let direcory = path.dirname(filename);
        direcory = path.join(direcory, "");
        if(!fs.existsSync(direcory)) {
            mkdirsSync(direcory);
        }
    }

    function mkdirsSync(dirpath, mode) { 
        if (!fs.existsSync(dirpath)) {
            var pathtmp;
            dirpath.split(path.sep).forEach(function(dirname) {
                if (pathtmp) {
                    pathtmp = path.join(pathtmp, dirname);
                }
                else {
                    pathtmp = dirname;
                }
                console.log(pathtmp);
                if (!fs.existsSync(pathtmp)) {
                    if (!fs.mkdirSync(pathtmp, mode)) {
                        return false;
                    }
                }
            });
        }
        return true; 
    }

    function createTheme (params, template, filename) {
        let text = params + template;

        if(fs.existsSync(filename)) {
            fs.unlinkSync(filename);
        }

        fs.writeFileSync(filename, text, "utf8");
    }

    grunt.registerMultiTask(
        "theme-create",
        "创建主题样式文件",
        function() {
            var templateSrc = rootPath + this.data.template,
                colors = this.data.colors,
                distPath = this.data.dist,
                files = grunt.file.expand(templateSrc),
                templateText;

            if(!distPath) {
                distPath = templateSrc.substring(0, templateSrc.lastIndexOf("/") + 1);
            } else {
                distPath = rootPath + distPath;
            }

            if(!Array.isArray(colors) || colors.length == 0) {
                return;
            }


            for(let i = 0; i < files.length; i++) {
                let filename = files[i];
                let dirname = path.dirname(filename);
                let name = path.basename(filename, path.extname(filename));
                templateText = loadTemplate(filename);
                if(!templateText) {
                    throw new Error("模板文件不存在！");
                }

                for(let j = 0; j < colors.length; j++) {
                    let item = colors[j];
                    let themeName = item.name;
                    let description = item.description;

                    if(themeName) {
                        themeName = themeName.toLowerCase();
                    }
                    if(description) {
                        description = description.toLowerCase();
                    }

                    let params = buildColorParameters(item, description);
                    let savePath = format(distPath, themeName, name);
                    ensureDirectory(savePath);
                    createTheme(params, templateText, savePath);
                }
            }
        }
    );

};
