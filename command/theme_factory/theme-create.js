module.exports = function( grunt ) {
    "use strict";

    var fs = require( "fs" ),
        rootPath = __dirname + "/../../";
    var textFormatReg = /\\?\{([^{}]+)\}/gm;

    var format = function (str, params) {
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
    };

    var loadTemplate = function(path) {
        if(!fs.existsSync(path)) {
            return null;
        }
        return fs.readFileSync(path, "utf8");
    };

    var buildColorParameters = function(item, description) {
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
            if(item.hasOwnProperty(key)) {
                params.push("@",  key, ": ", item[key], ";\r\n");
            }
        }
        return params.join("");
    };

    var createTheme = function(params, template, filename) {
        let text = params + template;

        if(fs.existsSync(filename)) {
            fs.unlinkSync(filename);
        }

        fs.writeFileSync(filename, text, "utf8");
    };

    grunt.registerMultiTask(
        "theme-create",
        "创建主题样式文件",
        function() {
            var templateSrc = rootPath + this.data.template;
            var colors = this.data.colors;
            var distPath = this.data.dist;
            if(!distPath) {
                distPath = templateSrc.substring(0, templateSrc.lastIndexOf("/") + 1);
                distPath = distPath.replace("template", "{0}");
            } else {
                distPath = rootPath + distPath;
            }

            if(!Array.isArray(colors) || colors.length == 0) {
                return;
            }

            var templateText = loadTemplate(templateSrc);
            if(!templateText) {
                throw new Error("模板文件不存在！");
            }
            for(let i = 0; i < colors.length; i++) {
                let item = colors[i];
                let name = item.name;
                let description = item.description;
                delete item.name;
                delete item.description;

                let savePath = format(distPath, name);
                let params = buildColorParameters(item, description);

                createTheme(params, templateText, savePath);
            }
        }
    );

};