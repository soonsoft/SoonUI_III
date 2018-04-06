// ajax

var msie = 0,
    // Cross-Origin Resource Sharing(CORS)是允许来自浏览器的跨域通信的W3C规范。
    // 通过设置XMLHttpRequest的头部，CORS允许开发者使用类似同域中请求惯用的方法
    // https://www.cnblogs.com/linda586586/p/4351452.html
    // http://www.w3.org/TR/cors/
    supportCORS = false,
    global = ui.core.global(),

    httpRequest,
    httpRequestMethods,
    httpRequestProcessor,
    
    ensureOption,
    ajaxConverter,
    
    accepts,
    rjsonp = /(=)\?(?=&|$)|\?\?/,
    rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg;

// 检测IE的版本
if(global.VBArray) {
    msie = document.documentMode || (global.XMLHttpRequest ? 7 : 6);
}
// 检查IE是否支持跨域
if(msie >= 9) {
    supportCross = typeof (new XMLHttpRequest()).withCredentials === "boolean";
}

// 获取HttpRequest对象
(function() {
    var 
        types = [
            "XMLHttpRequest",
            "ActiveXObject('MSXML2.XMLHTTP.6.0')",
            "ActiveXObject('MSXML2.XMLHTTP.3.0')",
            "ActiveXObject('MSXML2.XMLHTTP')",
            "ActiveXObject('Microsoft.XMLHTTP')"
        ],
        isLocal = false,
        i, len, type;

    try {
        // 如果在IE下如果重置了document.domain，直接访问window.location会抛错，但用document.URL就ok了 
        isLocal = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(location.protocol);
    } catch(e) {}

    for(i = 0, len = types.length; i < len; i++) {
        type = types[i];
        try {
            if(eval("new " + type)) {
                httpRequest = new Function("return new " + type);
                break;
            }
        } catch(e) {}
    }
})();

// 定义HTTP Header中Accept的类型
accepts = {
    xml: "application/xml, text/xml",
    html: "text/html",
    text: "text/plain",
    json: "application/json, text/javascript",
    script: "text/javascript, application/javascript"
};

httpRequestProcessor = {
    ajax: {
        request: function() {

        },
        respond: function(event, forceAbort) {

        }
    },
    jsonp: {
        preprocess: function() {

        }
    },
    script: {
        request: function() {

        },
        respond: function(event, forceAbort) {

        }
    },
    upload: {
        preprocess: function() {

        }
    }
};

// 完善jsonp的接口
httpRequestProcessor.jsonp.request = httpRequestProcessor.script.request;
httpRequestProcessor.jsonp.respond = httpRequestProcessor.script.respond;

// 完成upload的接口
httpRequestProcessor.upload.request = httpRequestProcessor.ajax.request;
httpRequestProcessor.upload.respond = httpRequestProcessor.ajax.respond;
if(!global.FormData) {
    // 为upload修复FormData
}

/**
 * ajax对象实例方法
 * 伪XMLHttpRequest类,用于屏蔽浏览器差异性
 * var ajax = new(self.XMLHttpRequest||ActiveXObject)("Microsoft.XMLHTTP")
 * ajax.onreadystatechange = function(){
 *   if (ajax.readyState==4 && ajax.status==200){
 *        alert(ajax.responseText)
 *   }
 * }
 * ajax.open("POST", url, true) 
 * ajax.send("key=val&key1=val2") 
 */
httpRequestMethods = {
    setRequestHeader: function (name, value) {
        this.requestHeaders[name] = value;
        return this;
    },
    getAllResponseHeaders: function () {
        return this.readyState === 4 ? this.responseHeadersString : null;
    },
    getResponseHeader: function (name, match) {
        if (this.readyState === 4) {
            while ((match = rheaders.exec(this.responseHeadersString))) {
                this.responseHeaders[match[1]] = match[2];
            }
            match = this.responseHeaders[name];
        }
        return match === undefined ? null : match;
    },
    overrideMimeType: function (type) {
        this.mimeType = type;
        return this;
    },
    // 中止请求
    abort: function (statusText) {
        statusText = statusText || "abort";
        if (this.transport) {
            this.respond(0, statusText);
        }
        return this;
    },
    /**
     * 用于派发success,error,complete等回调
     * http://www.cnblogs.com/rubylouvre/archive/2011/05/18/2049989.html
     * @param {Number} status 状态码
     * @param {String} statusText 对应的扼要描述
     */
    dispatch: function (status, nativeStatusText) {
        var statusText = nativeStatusText,
            isSuccess,
            dataType,
            that;
        // 防止重复执行
        if (!this.xhr) { // 执行完毕后原生的xhr对象会被删除
            return;
        }

        this.readyState = 4;

        // 200: 成功
        // 201: 创建
        // 202: 已接受
        // 203: 非授权信息，服务器成功执行了请求
        // 204: 空内容，服务器成功执行了请求
        // 205: 重置内容，服务器成功执行了请求，但是但是没有返回内容
        // 206: 部分内容  服务器成功执行了部分请求
        // 304: 来自本地缓存
        isSuccess = status >= 200 && status < 300 || status === 304;
        if(isSuccess) {
            if(status === 204) {
                statusText = "nocontent";
            } else if(status === 304) {
                statusText = "notmodified";
            } else {
                if(typeof this.response === "undefined") {
                    dataType = this.option.dataType || this.option.mimeType;
                    if(!dataType && this.responseText || this.responseXML) {
                        //如果没有指定dataType，则根据mimeType或Content-Type进行揣测
                        dataType = this.getResponseHeader("Content-Type") || "";
                        dataType = dataType.match(/json|xml|script|html/i) || ["text"];
                        dataType = dataType[0].toLowerCase();
                    }
                    try {
                        this.response = ajaxConverter[dataType].call(
                            this, 
                            this.responseText || "",
                            this.responseXML || "");
                    } catch(e) {
                        isSuccess = false;
                        this.error = e;
                        statusText = "parsererror";
                    }
                }
            }
        }
        this.status = status;
        this.statusText = statusText;
        if(this._timeoutID) {
            clearTimeout(this._timeoutID);
            delete this._timeoutID;
        }

        that = this;
        if(isSuccess) {
            this._resolve([this.response, statusText, this]);
            ui.setTask(function() {
                ui.ajax.globalEvents.onSuccess(that, that.option, statusText);
            });
        } else {
            this._reject([this, statusText, this.error]);
            ui.setTask(function() {
                ui.ajax.globalEvents.onError(that, that.option, statusText);
            });
        }
        delete this.xhr;
        ui.ajax.activeIndex--;
        ui.setTask(function() {
            ui.ajax.globalEvents.onComplete(that, that.option);
        });

        if(ui.ajax.activeIndex === 0) {
            // 最后一个ajax执行完毕
            ui.setTask(function() {
                ui.ajax.globalEvents.onStop();
            });
        }
    }
};

ensureOption = (function() {
    var defaultOption = {
        // request method
        type: "GET",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        async: true,
        jsonp: "callback"
    };
    
    var rprotocol = /^\/\//,
        rhash = /#.*$/,
        rnoContent = /^(?:GET|HEAD)$/;

    var originAnchor = document.createElement("a");
    originAnchor.href = location.href;

    function isJsonContent(contentType) {
        return contentType.startsWith("application/json")
                || contentType.startsWith("text/javascript")
                || contentType.startsWith("text/json")
                || contentType.startsWith("application/javascript");
    }
    return function(option) {
        var dataType,
            urlAnchor,
            appendChar;

        option = ui.extend({}, defaultOption, option);
        option.type = option.type.toUpperCase();
        option.contentType = option.contentType.trim();

        dataType = ui.core.type(option.data);
        if(dataType === "string") {
            option.querystring = option.data;
        } else {
            if(dataType === "null" || dataType === "undefined" || isNaN(option.data)) {
                option.querystring = "";
            } else if(type === "array" || type === "object") {
                if(isJsonContent(option.contentType)) {
                    option.querystring = JSON.stringify(option.data);
                } else {
                    option.querystring = ui.param(option.data);
                }
            } else {
                option.querystring = option.data + "";
            }
        }
        
        option.url = option.url.replace(rhash, "").replace(rprotocol, location.protocol + "//");

        if(!ui.core.isBoolean(option.crossDomain)) {
            // 检查请求是否跨域
            urlAnchor = document.createElement("a");
            try {
                urlAnchor.href = option.url;
                // IE7之前的版本中的getAttribute有第二个参数
                // http://technet.microsoft.com/zh-cn/library/aa752280
                // 0 default 不区分大小写, 1 区分大小写, 2 返回BSTR形式的属性值, 4 返回完整的URL路径，只对URL有效
                urlAnchor.href = !"1"[0] ? urlAnchor.getAttribute("href", 4) : urlAnchor.href;
                option.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
            } catch(e) {
                option.crossDomain = true;
            }
        }

        option.hasContent = !rnoContent.test(option.type);
        if(!option.hasContent) {
            // 请求没有requestBody，把参数放到url上
            appendChar = option.url.indexOf("?") > -1 ? "&" : "?";
            if(option.querystring) {
                option.url += appendChar + option.querystring;
            }
            if(option.cache === false) {
                option.url += appendChar + "_time=" + (new Date() - 0);
            }
        }
        return option;
    };
})();

function ajax(option) {
    var ajaxRequest,
        promise, _resolve, _reject,
        i;

    if(!option || !option.url) {
        throw new TypeError("参数必须为Object并且拥有url属性");
    }

    option = ensureOption(option);
    ajaxRequest = {
        responseHeadersString: "",
        responseHeaders: {},
        requestHeaders: {},
        querystring: option.querystring,
        readyState: 0,
        uniqueID: ("" + Math.random()).replace(/0\./, ""),
        status: 0
    };

    promise = new Promise(function(resolve, reject) {
        _resolve = resolve;
        _resolve = reject;
    });
    promise.option = option;
    promise._resolve = _resolve;
    promise._reject = _reject;

    promise.async = !(option.async === false);
    ui.extend(promise, ajaxRequest, httpRequestMethods);

    if((option.crossDomain && !supportCORS || rjsonp.test(option.url))
        && option.dataType === "jsonp"
        && option.type === "GET") {
        // 貌似可以不要这个
        option.dataType = "jsonp";
    }
    ui.extend(promise, (httpRequestProcessor[option.dataType] || httpRequestProcessor.ajax));

    // 1. Content-Type RequestBody的类型
    if(option.contentType) {
        promise.setRequestHeader("Content-Type", option.contentType);
    }
    // 2. Accept 客户端希望接受的类型
    promise.setRequestHeader(
        "Accept", accepts[option.dataType] ? accepts[option.dataType] + ", */*; q=0.01" : "*/*");
    // 3. 设置参数中的其它headers
    if(option.headers) {
        for(i in option.headers) {
            if(option.headers.hasOwnProperty(i)) {
                promise.setRequestHeader(i, option.headers[i]);
            }
        }
    }
    // 4. timeout
    if(option.async && option.timeout > 0) {
        promise._timeoutID = setTimeout(function() {
            promise.abort("timeout");
            promise.dispatch(0, "timeout");
        }, option.timeout);
    }

    // 设置处理方法
    promise
        .then(option.success)
        .catch(option.error)
        .complete(option.complete);

    if(ui.ajax.activeIndex === 0) {
        // 第一个活动的ajax
        ui.ajax.globalEvents.onStart();
    }
    ui.ajax.globalEvents.onSend(promise, option);
    ui.ajax.activeIndex++;

    promise.request();
    return promise;
}

function getScript() {

}

function getJSON() {

}

function upload() {

}

function noop() {}

ui.ajax.activeIndex = 0;
ui.ajax = ajax;
ui.ajax.globalEvents = {
    onStart: noop,
    onSend: noop,
    onSuccess: noop,
    onError: noop,
    onComplete: noop,
    onStop: noop
};

["get", "post"].forEach(function(method) {
    ui[method] = function(url, data, callback, type) {
        if(ui.core.isFunction(data)) {
            type = type || callback;
            callback = data;
            data = void 0;
        }
        return ui.ajax({
            url: url,
            type: method,
            data: data,
            success: callback,
            dataType: type
        });
    };
});

ui.getScript = getScript;
ui.getJSON = getJSON;
ui.upload = upload;