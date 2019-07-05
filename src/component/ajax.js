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

    HttpRequest,
    httpRequestMethods,
    httpRequestProcessor,
    
    ensureOption,
    ajaxConverter,

    eventDispatcher,
    events = ["start", "success", "error", "complete", "stop"],
    
    acceptsAll,
    accepts,
    rquery = /\?/,
    rjsonp = /(=)\?(?=&|$)|\?\?/,
    rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg,
    rnoContent = /^(?:GET|HEAD)$/,
    rnewLine = /\n/g,
    rcarriageReturn = /\r/g,
    requestIDSeed = parseInt((Math.random() + "").substring(2), 10),
    jsonpCallbackSeed = parseInt((Math.random() + "").substring(2), 10);

function noop() {}

head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
// 检测IE的版本
if(global.VBArray) {
    msie = document.documentMode || (global.XMLHttpRequest ? 7 : 6);
}
// 是否使用新的XMLHttpRequest onload事件
useOnload = msie === 0 || msie > 8;
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
                HttpRequest = new Function("return new " + type);
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

function isJsonContent(contentType) {
    return contentType.startsWith("application/json") ||
        contentType.startsWith("text/javascript") ||
        contentType.startsWith("text/json") ||
        contentType.startsWith("application/javascript");
}

httpRequestProcessor = {
    ajax: {
        // ajax数据预处理
        prepareData: function() {
            var option = this.option,
                dataType = ui.core.type(option.data),
                appendChar;
            if(dataType === "string") {
                this.querystring = option.data;
            } else {
                if(dataType === "null" || dataType === "undefined") {
                    this.querystring = "";
                } else if(dataType === "array" || dataType === "object") {
                    if(isJsonContent(option.contentType)) {
                        this.querystring = JSON.stringify(option.data);
                    } else {
                        this.querystring = ui.param(option.data);
                    }
                } else {
                    this.querystring = option.data + "";
                }
            }

            // HTTP Method GET和HEAD没有RequestBody
            this.hasRequestBody = !rnoContent.test(option.type);
            if(!this.hasRequestBody) {
                // 请求没有requestBody，把参数放到url上
                appendChar = rquery.test(option.url) ? "&" : "?";
                if(this.querystring) {
                    option.url += appendChar + this.querystring;
                    this.querystring = null;
                }
                if(option.cache === false) {
                    option.url += appendChar + "_time=" + (new Date() - 0);
                }
            }
        },
        // 发起请求
        request: function() {
            var that, i;

            that = this;
            this.xhr = new HttpRequest();
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

            // 判断是否采用原生的超时方法
            if(this._timeoutID && this.xhr.timeout === 0) {
                clearTimeout(this._timeoutID);
                delete this._timeoutID;
                this.xhr.timeout = this.option.timeout;
                this.xhr.ontimeout = function() {
                    that.dispatch(0, "timeout");
                };
            }

            //必须要支持 FormData 和 file.fileList 的浏览器 才能用 xhr 发送
            //标准规定的 multipart/form-data 发送必须用 utf-8 格式， 记得 ie 会受到 document.charset 的影响
            this.xhr.send(this.hasRequestBody && (this.formdata || this.querystring) || null);
            
            //在同步模式中,IE6,7可能会直接从缓存中读取数据而不会发出请求,因此我们需要手动调用响应处理函数
            if(!this.option.async || this.xhr.readyState === 4) {
                this.respond();
            } else {
                if(useOnload) {
                    this.xhr.onload = this.xhr.onerror = function(e) {
                        //that.xhr.readyState = 4;
                        //that.xhr.status = e.type === "load" ? 200 : 500;
                        that.respond();
                    };
                } else {
                    this.xhr.onreadystatechange = function() {
                        if(that.xhr.readyState === 4) {
                            that.respond();
                        }
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
                completed = this.xhr.readyState === 4;
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
                            ui.core.isString(this.xhr.responseText) ? this.xhr.responseText : "";
                        // 设置responseXML
                        try {
                            this.responseXML = this.xhr.responseXML.documentElement;
                        } catch(e) {}
                        // 设置response
                        if(this.useResponseType) {
                            this.response = this.xhr.response;
                        }
                        // 设置responseHeadersString
                        this.responseHeadersString = this.xhr.getAllResponseHeaders();

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
                this.option.url = this.option.url + 
                    (rquery.test(this.option.url) ? "&" : "?") + 
                    this.option.jsonp + "=" + callbackName;
            }

            // 把jsonp的结果处理成为全局变量
            names = callbackName.split(".");
            callback = global;
            for(i = 0, len = names.length - 1; i < len; i++) {
                name = names[i];
                if(!callback[name]) {
                    callback[name] = {};
                }
                callback = callback[name];
            }

            name = names[len];
            callback[name] = function(data) {
                callback[name] = data;
            };
            this.getJsonpCallBack = function() {
                return callback[name];
            };

            this.finally((function() {
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
            // 上传文件使用的是RFC1867
            // contentType = multipart/form-data会自动设置
            // 会自动设置，不要手动设置，因为还需要设置boundary，这个是浏览器自动生成的
            this.option.contentType = "";
        },
        prepareData: function() {
            var files = this.option.files,
                formData,
                data;
            
            data = this.option.data;
            if(data instanceof FormData) {
                formData = this.data;
            } else {
                formData = new FormData();
            }
            
            if(files) {
                if(!Array.isArray(files)) {
                    files = [files];
                }
                files.forEach(function(blob, index) {
                    var i;
                    if(ui.core.isDomObject(blob) && blob.nodeName === "INPUT" && blob.type === "file") {
                        if(blob.files) {
                            if(blob.files.length > 1) {
                                for(i = 0; i < blob.files.length; i++) {
                                    formData.append(blob.name + "[" + i + "]", blob.files[i]);
                                }
                            } else {
                                formData.append(blob.name, blob.files[0]);
                            }
                        }
                    } else if(blob instanceof Blob) {
                        formData.append("file_" + index, blob);
                    }
                });
            }

            // 添加其它文本数据
            if(ui.core.isString(data)) {
                formData.append("fileinfo", data); 
            } else if(ui.core.isPlainObject(data)) {
                Object.keys(data).forEach(function(key) {
                    formData.append(encodeURIComponent(key), encodeURIComponent(data[key]));
                });
            }

            this.formdata = formData;
            this.hasRequestBody = true;
        }
    }
};

// 设置jsonp和script的数据处理函数
httpRequestProcessor.jsonp.prepareData = httpRequestProcessor.ajax.prepareData;
httpRequestProcessor.script.prepareData = httpRequestProcessor.ajax.prepareData;
// 完善jsonp的接口
httpRequestProcessor.jsonp.request = httpRequestProcessor.script.request;
httpRequestProcessor.jsonp.respond = httpRequestProcessor.script.respond;
// 完善upload的接口 upload有自己的数据处理函数
httpRequestProcessor.upload.request = httpRequestProcessor.ajax.request;
httpRequestProcessor.upload.respond = httpRequestProcessor.ajax.respond;

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
        // TODO 还没有完成HTML Parser
        return ui.parseHTML(text);
    },
    json: function(text) {
        if(!text) {
            return text;
        }
        text = text.replace(rnewLine, "\\\\n").replace(rcarriageReturn, "\\\\r");
        return JSON.parse(text);
    },
    script: function(text) {
        ui.globalEval(text);
        return text;
    },
    jsonp: function() {
        var jsonpData;
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
 * ajax.onreadystatechange = function() {
 *     if (ajax.readyState === 4 && ajax.status === 200) {
 *         alert(ajax.responseText)
 *     }
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
            // 移除超时回调
            clearTimeout(this._timeoutID);
            delete this._timeoutID;
        }

        that = this;
        if(isSuccess) {
            this._resolve({
                data: this.response, 
                statusText: statusText, 
                ajaxRequest: this
            });
            ui.setTask(function() {
                ui.ajax.global.fire("success", that, that.option, statusText);
            });
        } else {
            this._reject({
                ajaxRequest: this, 
                statusText: statusText, 
                error: this.error
            });
            ui.setTask(function() {
                ui.ajax.global.fire("error", that, that.option, statusText);
            });
        }
        delete this.xhr;
        ui.ajax.global.activeIndex--;
        ui.setTask(function() {
            ui.ajax.global.fire("complete", that, that.option);
        });

        if(ui.ajax.global.activeIndex === 0) {
            // 最后一个ajax执行完毕
            ui.setTask(function() {
                if(ui.ajax.global.activeIndex === 0) {
                    ui.ajax.global.fire("stop");
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
        timeout: 0,
        jsonp: "callback"
    };
    
    var rprotocol = /^\/\//,
        rhash = /#.*$/,
        rnoContent = /^(?:GET|HEAD)$/;

    var originAnchor = document.createElement("a");
    originAnchor.href = location.href;

    return function(option, ajaxRequest) {
        var urlAnchor;

        option = ui.extend({}, defaultOption, option);

        option.type = option.type.toUpperCase();
        option.contentType = option.contentType.trim();
        option.url = option.url.replace(rhash, "").replace(rprotocol, location.protocol + "//");

        if(!ui.core.isNumeric(option.timeout)|| option.timeout < 0) {
            option.timeout = 0;
        }

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

        return option;
    };
})();

function ajax(option) {
    var ajaxRequest,
        promise, _resolve, _reject,
        dataType;

    if(!option || !option.url) {
        throw new TypeError("参数必须为Object并且拥有url属性");
    }

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
        _reject = reject;
    });
    promise._resolve = _resolve;
    promise._reject = _reject;

    ajaxRequest = ui.extend(promise, ajaxRequest, httpRequestMethods);
    option = ensureOption(option, ajaxRequest);
    ajaxRequest.option = option;
    ajaxRequest.async = !(option.async === false);

    if((option.crossDomain && !supportCORS || rjsonp.test(option.url)) && 
        option.dataType === "json" && option.type === "GET") {
        option.dataType = "jsonp";
    }
    dataType = option.dataType;
    ui.extend(ajaxRequest, 
        (httpRequestProcessor[option.files ? "upload" : dataType] || 
            httpRequestProcessor.ajax));

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
        Object.keys(option.headers).forEach(function(key) {
            ajaxRequest.setRequestHeader(key, option.headers[key]);
        });
    }
    // 4. timeout
    if(option.async && option.timeout > 0) {
        ajaxRequest._timeoutID = setTimeout(function() {
            var statusText = "timeout";
            // 如果是ajax请求，abort方法会自动调用dispatch方法
            ajaxRequest.abort(statusText);
            // 如果不是ajax请求，而是script之类的，那么手动调用dispatch方法
            ajaxRequest.dispatch(0, statusText);
        }, option.timeout);
    }
    // 5. 准备发送数据
    if(ajaxRequest.prepareData) {
        ajaxRequest.prepareData();
    }

    // 设置处理方法
    ajaxRequest
        .then(option.success)
        .catch(option.error)
        .finally(option.complete);

    if(ui.ajax.global.activeIndex === 0) {
        // 第一个活动的ajax
        ui.ajax.global.fire("start");
    }
    ui.ajax.global.fire("send", ajaxRequest, option);
    ui.ajax.global.activeIndex++;

    ajaxRequest.request();
    return ajaxRequest;
}

function getScript(url, callback) {
    return ui.get(url, null, callback, "script");
}

function getJSON(url, data, callback) {
    return ui.get(url, data, callback, "json");
}

function upload(url, files, data, successFn, errorFn, dataType) {
    if (ui.core.isFunction(data)) {
        dataType = errorFn;
        errorFn = successFn;
        successFn = data;
        data = null;
    }
    return ui.ajax({
        url: url,
        type: "post",
        dataType: dataType,
        files: files,
        data: data,
        success: successFn,
        error: errorFn
    });
}

ui.ajax = ajax;
ui.ajax.global = {
    activeIndex: 0
};
eventDispatcher = new ui.CustomEvent(ui.ajax.global);
eventDispatcher.initEvents(events);

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

// TODO 扩展Ajax模式
function extendHttpProcessor() {

}