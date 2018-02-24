//url

var url_rquery = /\?/,
    r20 = /%20/g;

ui.url = {
    /** 获取url的各种信息 */
    urlInfo: function (url) {
        var a = document.createElement('a');
        a.href = url;
        return {
            source: url,
            protocol: a.protocol.replace(':', ''),
            host: a.hostname,
            port: a.port,
            search: a.search,
            params: (function () {
                var ret = {},
                    seg = a.search.replace(/^\?/, '').split('&'),
                    len = seg.length, i = 0, s;
                for (; i < len; i++) {
                    if (!seg[i]) { continue; }
                    s = seg[i].split('=');
                    ret[s[0]] = s[1];
                }
                return ret;
            })(),
            file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
            hash: a.hash.replace('#', ''),
            path: a.pathname.replace(/^([^\/])/, '/$1'),
            relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
            segments: a.pathname.replace(/^\//, '').split('/')
        };
    },
    /** 取得URL的参数，以对象形式返回 */
    getParams: function (url) {
        var result = {};
        var param = /([^?=&]+)=([^&]+)/ig;
        var match;
        while ((match = param.exec(url)) !== null) {
            result[match[1]] = match[2];
        }
        return result;
    },
    /** 修改url的参数 */
    setParams: function(url, params) {
        var currentParam,
            key,
            index,
            arr;
        if(!params) {
            return;
        }
        currentParam = this.getParams(url);
        for(key in params) {
            if(params.hasOwnProperty(key)) {
                currentParam[key] = params[key] + "";
            }
        }
        index = url.indexOf("?");
        if(index >= 0) {
            url = url(0, index);
        }
        arr = [];
        for(key in currentParam) {
            if(currentParam.hasOwnProperty(key)) {
                arr.push(key + "=" + currentParam[key]);
            }
        }
        return url + "?" + arr.join("&");
    },
    /** 为url添加参数 */
    appendParams: function (url, data) {
        var s = [],
            add = function (key, value) {
                value = ui.core.isFunction(value) 
                            ? value() 
                            : (value === null ? "" : value);
                s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
            },
            i, t, key;
        if ($.isArray(data)) {
            for (i = 0; i < data.length; i++) {
                t = data[i];
                if (t.hasOwnProperty("name")) {
                    add(t.name, t.value);
                }
            }
        } else if ($.isPlainObject(data)) {
            for (key in data) {
                add(key, data[key]);
            }
        }

        if (s.length > 0) {
            return url + (url_rquery.test(url) ? "&" : "?") + s.join("&").replace(r20, "+");
        } else {
            return url;
        }
    },
    /** 获取地址栏参数值 */
    getLocationParam: function (name) {
        var sUrl = window.location.search.substr(1);
        var r = sUrl.match(new RegExp("(^|&)" + name + "=([^&]*)(&|$)"));
        return (r === null ? null : unescape(r[2]));
    }
};