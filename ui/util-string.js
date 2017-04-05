// text

var textEmpty = "";
// text format
var textFormatReg = /\\?\{([^{}]+)\}/gm;
var textFormatReplaceFn = function (match, name) {
    if (match.charAt(0) == '\\')
        return match.slice(1);
    var index = Number(name);
    if (index >= 0)
        return array[index];
    if (params && params[name])
        return params[name];
    return '';
};
// dateFormat
var defaultWeekFormatFn = function() {
    var name = "日一二三四五六";
    return "周" + name.charAt(week);
};
// base64
var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var _utf8_encode = function (string) {
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
};
var _utf8_decode = function (utftext) {
    var string = textEmpty;
    var i = 0;
    var c = 0, 
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
};

ui.str = {
    /** 空字符串 */
    empty: textEmpty,
    /** 去空格 */
    trim: function (str) {
        if (!ui.core.isString(str)) {
            return str;
        }
        var c = arguments[1];
        if (!c) {
            c = "\\s";
        }
        var r = new RegExp("(^" + c + "*)|(" + c + "*$)", "g");
        return str.replace(r, this.empty);
    },
    /** 去掉左边空格 */
    lTrim: function (str) {
        if (!ui.core.isString(str)) {
            return str;
        }
        var c = arguments[1];
        if (!c) {
            c = "\\s";
        }
        var r = new RegExp("(^" + c + "*)", "g");
        return str.replace(r, this.empty);
    },
    /** 去掉右边空格 */
    rTrim: function (str) {
        if (!ui.core.isString(str)) {
            return str;
        }
        var c = arguments[1];
        if (!c) {
            c = "\\s";
        }
        var r = new RegExp("(" + c + "*$)", "g");
        return str.replace(r, this.empty);
    },
    /** 判断是否为空 null, undefined, empty return true */
    isEmpty: function (str) {
        return str === undefined 
            || str === null
            || (ui.core.isString(str) && str.length === 0);
    },
    /** 判断是否全是空白 null, undefined, empty, blank return true */
    isBlank: function(str) {
        var i;
        if(str === undefined || str === null) {
            return true;
        }
        if(ui.core.isString(str)) {
            for(i = 0; i < str.length; i++) {
                if(str.charCodeAt(i) != 32) {
                    return false;
                }
            }
            return true;
        }
    },
    //格式化字符串，Format("He{0}{1}o", "l", "l") 返回 Hello
    textFormat: function (str, params) {
        var Arr_slice = Array.prototype.slice;
        var array = Arr_slice.call(arguments, 1);
        return str.replace(textFormatReg, textFormatReplaceFn);
    },
    //格式化日期: y|Y 年; M 月; d|D 日; H|h 小时; m 分; S|s 秒; ms|MS 毫秒; wk|WK 星期;
    dateFormat: function (date, format, weekFormat) {
        if (!date) {
            return ui.str.empty;
        } else if (typeof date === "string") {
            format = date;
            date = new Date();
        }
        if (!$.isFunction(weekFormat))
            weekFormat = defaultWeekFormatFn;

        var zero = "0";
        format = format.replace(/y+/i, function ($1) {
            var year = date.getFullYear() + "";
            return year.substring(year.length - $1.length);
        });
        var tempVal = null;
        var formatFunc = function ($1) {
            return ($1.length > 1 && tempVal < 10) ? zero + tempVal : tempVal;
        };
        tempVal = date.getMonth() + 1;
        format = format.replace(/M+/, formatFunc);
        tempVal = date.getDate();
        format = format.replace(/d+/i, formatFunc);
        tempVal = date.getHours();
        format = format.replace(/H+/, formatFunc);
        format = format.replace(/h+/, function ($1) {
            var ampmHour = tempVal % 12 || 12;
            return ((tempVal > 12) ? "PM" : "AM") + (($1.length > 1 && ampmHour < 10) ? zero + ampmHour : ampmHour);
        });
        tempVal = date.getMinutes();
        format = format.replace(/m+/, formatFunc);
        tempVal = date.getSeconds();
        format = format.replace(/S+/i, formatFunc);
        format = format.replace(/ms/i, date.getMilliseconds());
        format = format.replace(/wk/i, weekFormat(date.getDay()));
        return format;
    },
    convertDate: function (dateStr, format) {
        var year = 1970,
            month = 0,
            day = 1,
            hour = 0,
            minute = 0,
            second = 0,
            ms = 0;
        var result = /y+/i.exec(format);
        if (result !== null) {
            year = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
        }
        result = /M+/.exec(format);
        if (result !== null) {
            month = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10) - 1;
        }
        result = /d+/i.exec(format);
        if (result !== null) {
            day = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
        }
        result = /H+/.exec(format);
        if (result !== null) {
            hour = parseInt(dateStr.substring(result.index, result.index + result.index + result[0].length), 10);
        }
        result = /h+/.exec(format);
        if (result !== null) {
            hour = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
            if (dateStr.substring(result.index - 2, 2) === "PM")
                hour += 12;
        }
        result = /m+/.exec(format);
        if (result !== null) {
            minute = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
        }
        result = /S+/i.exec(format);
        if (result !== null) {
            second = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
        }
        result = /ms/i.exec(format);
        if (result !== null) {
            ms = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
        }
        return new Date(year, month, day, hour, minute, second, ms);
    },
    jsonnetToDate: function (jsonDate) {
        if (!jsonDate) {
            return null;
        }
        var val = /Date\(([^)]+)\)/.exec(jsonDate)[1];
        return new Date(Number(val));
    },
    jsonToDate: function (jsonDate) {
        var date = new Date(jsonDate);
        var val = null;
        if (isNaN(date)) {
            val = /Date\(([^)]+)\)/.exec(jsonDate);
            if (val != null) {
                date = new Date(Number(val[1]));
            } else {
                date = this.convertDate(jsonDate, "yyyy-MM-ddTHH:mm:ss");
            }
        }
        return date;
    },
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
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
    },
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
    htmlEncode: function(str) {
        if (this.isNullOrEmpty(str)) {
            return this.empty;
        }
        return $("<span />").append(document.createTextNode(str)).html();
    },
    htmlDecode: function(str) {
        if (this.isNullOrEmpty(str)) {
            return this.empty;
        }
        return $("<span />").html(str).text();
    },
    numberFormatScale: function (num, zeroCount) {
        if (isNaN(num))
            return null;
        if (isNaN(zeroCount))
            zeroCount = 2;
        num = ui.fixedNumber(num, zeroCount);
        var integerText = num + ui.str.empty;
        var scaleText;
        var index = integerText.indexOf(".");
        if (index < 0) {
            scaleText = ui.str.empty;
        } else {
            scaleText = integerText.substring(index + 1);
            integerText = integerText.substring(0, index);
        }
        var len = zeroCount - scaleText.length;
        var i;
        for (i = 0; i < len; i++) {
            scaleText += "0";
        }
        return integerText + "." + scaleText;
    },
    integerFormat: function (num, count) {
        num = parseInt(num, 10);
        if (isNaN(num))
            return NaN;
        if (isNaN(count))
            count = 8;
        var numText = num + ui.str.empty;
        var len = count - numText.length;
        var i;
        for (i = 0; i < len; i++) {
            numText = "0" + numText;
        }
        return numText;
    },
    formatMoney: function (value, symbol) {
        if (!symbol) {
            symbol = "￥";
        }
        var content = ui.str.numberFormatScale(value, 2);
        if (!content) {
            return content;
        }
        var arr = content.split(".");
        content = arr[0];
        var index = 0;
        var result = [];
        for (var i = content.length - 1; i >= 0; i--) {
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
        return result.join(ui.str.empty);
    }
};
