// string util

var textEmpty = "";
// text format
var textFormatReg = /\\?\{([^{}]+)\}/gm;
var htmlEncodeSpan;
// base64
var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function _utf8_encode(string) {
    var utftext = textEmpty,
        c;
    string = string.replace(/\r\n/g, "\n");
    for (var n = 0; n < string.length; n++) {
        c = string.charCodeAt(n);
        if (c < 128) {
            utftext += String.fromCharCode(c);
        }
        else if ((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
        }
    }
    return utftext;
}
function _utf8_decode (utftext) {
    var string = textEmpty;
    var i = 0,
        c = 0, 
        c3 = 0, 
        c2 = 0;
    while (i < utftext.length) {
        c = utftext.charCodeAt(i);
        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        }
        else if ((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i + 1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = utftext.charCodeAt(i + 1);
            c3 = utftext.charCodeAt(i + 2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }
    }
    return string;
}

ui.str = {
    /** 空字符串 */
    empty: textEmpty,
    /** 字符串遍历，通过[ ]和[,]分割 */
    each: ui.core.each,
    /** 修剪字符串，支持自定义修剪的字符，默认是空格，性能并不是最优，所以如果只是想trim的话推荐使用String.prototype.trim */
    trim: function (str, trimChar) {
        if (typeof str !== "string") {
            return str;
        }
        if (!trimChar) {
            trimChar = "\\s";
        }
        return str.replace(
            new RegExp("(^" + trimChar + "*)|(" + trimChar + "*$)", "g"), textEmpty);
    },
    /** 修剪字符串左边的字符 */
    trimLeft: function (str, trimChar) {
        if (typeof str !== "string") {
            return str;
        }
        if (!trimChar) {
            trimChar = "\\s";
        }
        return str.replace(
            new RegExp("(^" + trimChar + "*)", "g"), textEmpty);
    },
    /** 修剪字符串右边的字符 */
    trimRight: function (str, trimChar) {
        if (typeof str !== "string") {
            return str;
        }
        if (!trimChar) {
            trimChar = "\\s";
        }
        return str.replace(
            new RegExp("(" + trimChar + "*$)", "g"), textEmpty);
    },
    /** 判断是否为空 null, undefined, empty return true */
    isEmpty: function (str) {
        return str === undefined || str === null || 
                (typeof str === "string" && str.length === 0);
    },
    /** 判断是否全是空白 null, undefined, empty, blank return true */
    isBlank: function(str) {
        var i, len;
        if(str === undefined || str === null) {
            return true;
        }
        if(ui.core.isString(str)) {
            for(i = 0, len = str.length; i < len; i++) {
                if(str.charCodeAt(i) != 32) {
                    return false;
                }
            }
            return true;
        }
    },
    /** 格式化字符串，Format("He{0}{1}o", "l", "l") 返回 Hello */
    format: function (str, params) {
        var Arr_slice = Array.prototype.slice;
        var array = Arr_slice.call(arguments, 1);
        if(!str) {
            return textEmpty;
        }
        return str.replace(textFormatReg, function (match, name) {
            var index;
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
            return '';
        });
    },
    /** base64编码 */
    base64Encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = _utf8_encode(input);

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
                _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
                _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
        }
        return output;
    },
    /** base64解码 */
    base64Decode: function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {
            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = _utf8_decode(output);
        return output;
    },
    /** html编码 */
    htmlEncode: function(str) {
        if (this.isEmpty(str)) {
            return textEmpty;
        }
        if(!htmlEncodeSpan) {
            htmlEncodeSpan = $("<span />");
        } else {
            htmlEncodeSpan.html("");
        }
        return htmlEncodeSpan.append(document.createTextNode(str)).html();
    },
    /** html解码 */
    htmlDecode: function(str) {
        if (this.isEmpty(str)) {
            return textEmpty;
        }
        if(!htmlEncodeSpan) {
            htmlEncodeSpan = $("<span />");
        } else {
            htmlEncodeSpan.html("");
        }
        return htmlEncodeSpan.html(str).text();
    },
    /** 格式化小数位数 */
    numberScaleFormat: function (num, zeroCount) {
        var integerText,
            scaleText,
            index,
            i, len;
        if (isNaN(num))
            return null;
        if (isNaN(zeroCount))
            zeroCount = 2;
        num = ui.fixedNumber(num, zeroCount);
        integerText = num + textEmpty;
        index = integerText.indexOf(".");
        if (index < 0) {
            scaleText = textEmpty;
        } else {
            scaleText = integerText.substring(index + 1);
            integerText = integerText.substring(0, index);
        }

        for (i = 0, len = zeroCount - scaleText.length; i < len; i++) {
            scaleText += "0";
        }
        return integerText + "." + scaleText;
    },
    /** 格式化整数位数 */
    integerFormat: function (num, count) {
        var numText, i, len;
        num = parseInt(num, 10);
        if (isNaN(num)) {
            return NaN;
        }
        if (isNaN(count)) {
            count = 8;
        }
        numText = num + textEmpty;
        for (i = 0, len = count - numText.length; i < len; i++) {
            numText = "0" + numText;
        }
        return numText;
    },
    /** 货币格式化，每千位插入一个逗号 */
    moneyFormat: function (value, symbol) {
        var content,
            arr,
            index,
            result,
            i;
        if (!symbol) {
            symbol = "￥";
        }
        content = ui.str.numberScaleFormat(value, 2);
        if (!content) {
            return content;
        }
        arr = content.split(".");
        content = arr[0];
        index = 0;
        result = [];
        for (i = content.length - 1; i >= 0; i--) {
            if (index == 3) {
                index = 0;
                result.push(",");
            }
            index++;
            result.push(content.charAt(i));
        }
        result.push(symbol);
        result.reverse();
        result.push(".", arr[1]);
        return result.join(textEmpty);
    }
};
