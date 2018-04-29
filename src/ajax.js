// ajax

var msie = 0,
    useOnload,
    /**
     * Cross-Origin Resource Sharing(CORS)是允许来自浏览器的跨域通信的W3C规范。
     * 通过设置XMLHttpRequest的头部，CORS允许开发者使用类似同域中请求惯用的方法
     * https://www.cnblogs.com/linda586586/p/4351452.html
     * http://www.w3.org/TR/cors/
     */
    supportCORS = false,
    // 是否为本地模式
    isLocal = false,
    global = ui.core.global(),
    head,

    httpRequest,
    httpRequestMethods,
    httpRequestProcessor,
    
    ensureOption,
    ajaxConverter,
    
    acceptsAll,
    accepts,
    rquery = /\?/,
    rjsonp = /(=)\?(?=&|$)|\?\?/,
    rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg,
    requestIDSeed = parseInt((Math.random() + "").substring(2), 10),
    jsonpCallbackSeed = parseInt((Math.random() + "").substring(2), 10);

head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
// 检测IE的版本
if(global.VBArray) {
    msie = document.documentMode || (global.XMLHttpRequest ? 7 : 6);
}
// 是否使用新的XMLHttpRequest onload事件
useOnload = ie === 0 || ie > 8;
// 检查IE是否支持跨域
if(msie >= 9) {
    supportCORS = typeof (new XMLHttpRequest()).withCredentials === "boolean";
}

try {
    // 如果在IE下如果重置了document.domain，直接访问window.location会抛错，但用document.URL就ok了 
    isLocal = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(location.protocol);
} catch(e) {}

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
        i, len, type;
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
// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
acceptsAll = "*/".concat( "*" );
accepts = {
    xml: "application/xml, text/xml",
    html: "text/html",
    text: "text/plain",
    json: "application/json, text/javascript",
    script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
};

httpRequestProcessor = {
    ajax: {
        // 发起请求
        request: function() {
            var that, i;

            this.xhr = new httpRequest();
            this.xhr.open(
                this.option.type,
                this.option.url,
                this.option.async,
                this.option.username,
                this.option.password
            );
            if(this.mimeType && this.xhr.overrideMimeType) {
                this.xhr.overrideMimeType(this.mimeType);
            }
            // IE6不能修改xhr的属性
            if(this.option.crossDomain && supportCORS) {
                this.xhr.withCredentials = true;
            }

            if(!this.option.crossDomain) {
                // 设置ajax请求的标识
                // 在 Chrome、Firefox 3.5+ 和 Safari 4+ 下，在进行跨域请求时设置自定义 header，会触发 preflighted requests，会预先发送 method 为 OPTIONS 的请求。
                // 所以只有不跨域的时候设置
                this.requestHeaders["X-Requested-With"] = "XMLHttpRequest";
            }

            // 设置HTTP Headers
            for(i in this.requestHeaders) {
                if(this.requestHeaders.hasOwnProperty(i)) {
                    this.xhr.setRequestHeader(i, this.requestHeaders[i] + "");
                }
            }

            // 进度事件
            if(ui.core.isFunction(this.option.progress)) {
                if(msie === 0 || msie > 9) {
                    this.xhr.onprogress = this.option.progress;
                }
            }

            if("responseType" in this.xhr && /^(blob|arraybuffer|text)$/.test(this.option.dataType)) {
                this.xhr.responseType = this.option.dataType;
                this.useResponseType = true;
            } else {
                this.useResponseType = false;
            }

            //必须要支持 FormData 和 file.fileList 的浏览器 才能用 xhr 发送
            //标准规定的 multipart/form-data 发送必须用 utf-8 格式， 记得 ie 会受到 document.charset 的影响
            this.xhr.send(this.option.hasRequestBody && (this.formdata || this.querystring) || null);
            
            //在同步模式中,IE6,7可能会直接从缓存中读取数据而不会发出请求,因此我们需要手动发出请求
            if(!this.option.async || this.xhr.readyState === 4) {
                this.respond();
            } else {
                that = this;
                if(useOnload) {
                    this.xhr.onload = this.xhr.onerror = function(e) {
                        this.readyState = 4;
                        this.status = e.type === "load" ? 200 : 500;
                        that.respond();
                    };
                } else {
                    this.xhr.onreadystatechange = function() {
                        that.respond();
                    };
                }
            }
        },
        // 处理相应 用于获取原始的responseXMLresponseText 修正status statusText
        respond: function(event, forceAbort) {
            var completed,
                status,
                statusText;
            if(!this.xhr) {
                return;
            }

            try {
                completed = this.readyState === 4;
                if(completed || forceAbort) {
                    if(!useOnload) {
                        this.xhr.onreadystatechange = noop;
                    } else {
                        this.xhr.onload = this.xhr.onerror = null;
                    }
                    if(forceAbort) {
                        if(!completed && ui.core.isFunction(this.xhr.abort)) {
                            this.xhr.abort();
                        }
                    } else {
                        status = this.xhr.status;
                        this.responseText = 
                            ui.core.isString(this.xhr.responseText)
                                ? this.xhr.responseText
                                : "";
                        // 设置responseXML
                        try {
                            this.responseXML = this.xhr.responseXML.documentElement;
                        } catch(e) {}
                        // 设置response
                        if(this.useResponseType) {
                            this.response = this.xhr.response;
                        }
                        // 设置responseHeadersString
                        this.responseHeadersString = transport.getAllResponseHeaders();

                        try {
                            // 火狐在跨城请求时访问statusText值会抛出异常
                            statusText = this.xhr.statusText;
                        } catch(e) {
                            this.error = e;
                            statusText = "firefoxaccesserror";
                        }

                        // 处理本地请求，只要有数据就算成功
                        if(!status && isLocal && !this.option.crossDomain) {
                            status = this.responseText ? 200 : 404;
                        } else if(status === 1223) {
                            // IE会把204当成1223
                            status = 204;
                        }
                        this.dispatch(status, statusText);
                    }
                }
            } catch(e) {
                if(!forceAbort) {
                    this.dispatch(500, e);
                }
            }
        }
    },
    jsonp: {
        preprocess: function() {
            var callbackName,
                names,
                name, 
                i, len,
                callback;
            
            callbackName = this.option.jsonpCallback || "ui.jsonp_callback_" + (jsonpCallbackSeed--);
            this.jsonpCallbackName = callbackName;
            if(rjsonp.test(this.option.url)) {
                this.option.url = this.option.url.replace(rjsonp, "$1" + callbackName);
            } else {
                this.option.url = this.option.url 
                    + (rquery.test(this.option.url) ? "&" : "?") 
                    + this.option.jsonp + "=" + callbackName;
            }

            // 把jsonp的结果处理成为全局变量
            names = callbackName.split(".");
            callback = global;
            for(i = 0, len = names.length - 1; i < len; i++) {
                callback = callback[name];
                if(!callback) {
                    callback = callback[name] = {};
                }
            }

            name = names[len];
            callback[name] = function(data) {
                callback[name] = data;
            };
            this.getJsonpCallBack = function() {
                return callback[name];
            };

            this.complete((function() {
                // 移除jsonp的全局回调函数
                delete callback[name];
                delete this.jsonpCallbackName;
                delete this.getJsonpCallBack;
            }).bind(this));

            // jsonp 类型替换为script
            return "script";
        }
    },
    script: {
        request: function() {
            var that;

            this.xhr = document.createElement("script");
            if(this.option.charset) {
                this.xhr.charset = this.option.charset;
            }
            that = this;
            this.xhr.onerror = this.xhr[useOnload ? "onload" : "onreadystatechange"] = function() {
                that.respond();
            };
            this.xhr.src = this.option.url;
            head.insertBefore(this.xhr, head.firstChild);
        },
        respond: function(event, forceAbort) {
            var isCompleted,
                parent,
                callback,
                args;
            if(!this.xhr) {
                return;
            }

            isCompleted = /loaded|complete|undefined/i.test(this.xhr.readyState);
            if(forceAbort || isCompleted) {
                this.xhr.onerror = 
                    this.xhr.onload = 
                        this.xhr.onreadystatechange = null;
                
                parent = this.xhr.parentNode;
                if(parent) {
                    parent.removeChild(this.xhr);
                }
                if(!forceAbort) {
                    callback = this.jsonpCallbackName;
                    if(callback) {
                        callback = this.getJsonpCallBack();
                        // 此时回调函数应该已经变成了jsonp的数据，如果还是函数，则说明jsonp调用失败了
                        args = ui.core.isFunction(callback) ? [500, "error"] : [200, "success"];
                    } else {
                        args = [200, "success"];
                    }

                    this.dispatch.apply(this, args);
                }
            }
        }
    },
    upload: {
        preprocess: function() {
            // TODO 处理上传
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
 * ajax数据转换器
 */
ajaxConverter = {
    text: function(text) {
        return text + "";
    },
    xml: function(text, xml) {
        return xml ? xml : ui.parseXML(text);
    },
    html: function(text) {
        return ui.parseHTML(text);
    },
    json: function(text) {
        return JSON.parse(text);
    },
    script: function(text) {
        ui.globalEval(text);
        return text;
    },
    jsonp: function() {
        var jsonpData,
            callback;
        try {
            jsonpData = this.getJsonpCallBack();
        } catch(e) {
            jsonpData = undefined;
            ui.handleError("the jsonp callback is undefined.");
        }

        return jsonpData;
    }
};

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
        if(this._timeoutID) {
            // 移除超时回调
            clearTimeout(this._timeoutID);
            delete this._timeoutID;
        }
        if (this.xhr) {
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
            if(status === 204 || this.option.type === "HEAD") {
                statusText = "nocontent";
            } else if(status === 304) {
                statusText = "notmodified";
            } else {
                if(typeof this.response === "undefined") {
                    dataType = this.option.dataType || this.mimeType;
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
                            this.responseXML);
                    } catch(e) {
                        isSuccess = false;
                        this.error = e;
                        statusText = "parsererror";
                    }
                }
            }
        } else {
            if(!statusText) {
                statusText = "error";
            }
            if(status < 0) {
                status = 0;
            }
        }
        this.status = status;
        this.statusText = statusText + "";
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
                if(ui.ajax.activeIndex === 0) {
                    ui.ajax.globalEvents.onStop();
                }
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

        // HTTP Method GET和HEAD没有RequestBody
        option.hasRequestBody = !rnoContent.test(option.type);
        if(!option.hasRequestBody) {
            // 请求没有requestBody，把参数放到url上
            appendChar = rquery.test(option.url) ? "&" : "?";
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
        i, dataType;

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
        uniqueID: requestIDSeed--,
        status: 0
    };

    promise = new Promise(function(resolve, reject) {
        _resolve = resolve;
        _resolve = reject;
    });
    promise._resolve = _resolve;
    promise._reject = _reject;

    ajaxRequest = ui.extend(promise, ajaxRequest, httpRequestMethods);
    ajaxRequest.option = option;
    ajaxRequest.async = !(option.async === false);

    if((option.crossDomain && !supportCORS || rjsonp.test(option.url))
        && option.dataType === "json"
        && option.type === "GET") {
        // 貌似可以不要这个
        option.dataType = "jsonp";
    }
    dataType = option.dataType;
    ui.extend(
        ajaxRequest, 
        (httpRequestProcessor[option.form ? "upload" : dataType] 
            || httpRequestProcessor.ajax));

    if(ajaxRequest.preprocess) {
        dataType = ajaxRequest.preprocess() || dataType;
    }

    // 1. Content-Type RequestBody的类型
    if(option.contentType) {
        ajaxRequest.setRequestHeader("Content-Type", option.contentType);
    }
    // 2. Accept 客户端希望接受的类型
    ajaxRequest.setRequestHeader(
        "Accept", accepts[dataType] ? accepts[dataType] + ", " + acceptsAll + "; q=0.01" : acceptsAll);
    // 3. 设置参数中的其它headers
    if(option.headers) {
        for(i in option.headers) {
            if(option.headers.hasOwnProperty(i)) {
                ajaxRequest.setRequestHeader(i, option.headers[i]);
            }
        }
    }
    // 4. timeout
    if(option.async && option.timeout > 0) {
        ajaxRequest._timeoutID = setTimeout(function() {
            ajaxRequest.abort("timeout");
            ajaxRequest.dispatch(0, "timeout");
        }, option.timeout);
    }

    // 设置处理方法
    ajaxRequest
        .then(option.success)
        .catch(option.error)
        .complete(option.complete);

    if(ui.ajax.activeIndex === 0) {
        // 第一个活动的ajax
        ui.ajax.globalEvents.onStart();
    }
    ui.ajax.globalEvents.onSend(ajaxRequest, option);
    ui.ajax.activeIndex++;

    ajaxRequest.request();
    return ajaxRequest;
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
            data = null;
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