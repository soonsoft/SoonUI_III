const textFormatReg = /\\?\{([^{}]+)\}/gm;
const fs = require( "fs" );

function stringFormat (str, params) {
    let Arr_slice = Array.prototype.slice;
    let array = Arr_slice.call(arguments, 1);
    if(!str) {
        return textEmpty;
    }
    return str.replace(textFormatReg, function (match, name) {
        let index;
        if (match.charAt(0) == '\\') {
            return match.slice(1);
        }
        index = Number(name);
        if (index >= 0) {
            return array[index];
        }
        if (params && params[name]) {
            return params[name];
        }
        return "";
    });
}

module.exports = {
    loadLanguages: function(directory) {
        let files = this.file.expand(directory + "/**/*.js");
        let builder = [];
        for(let i = 0; i < files.length; i++) {
            let filename = files[i];
            let source = fs.readFileSync(filename, "utf8");
            if(source && source.length > 0) {
                builder.push(source);
            }
        }

        return builder.length === 0 ? "" : builder.join("\r\n");
    }
};
