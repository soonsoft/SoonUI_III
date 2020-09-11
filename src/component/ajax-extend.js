// ajax 扩展，加入身份验证和权限验证的相关处理逻辑
var responsedJson = "X-Responded-JSON";
var _rhtml = /<(\S*?)[^>]*>.*?<\/\1>|<.*? \/>/i;

function unauthorized(ajaxRequest, context) {
    var json = null;
    if(ajaxRequest.status == 401) {
        return unauthorizedHandler(context);
    } else if(ajaxRequest.status == 403) {
        return forbiddenHandler(context);
    } else if(ajaxRequest.status == 200) {
        json = ajaxRequest.getResponseHeader(responsedJson);
        if(!ui.str.isEmpty(json)) {
            try {
                json = JSON.parse(json);
            } catch(e) {
                json = null;
            }
            if(json) {
                if(json.status == 401)
                    return unauthorizedHandler(context);
                else if (json.status == 403)
                    return forbiddenHandler(context);
            }
        }
    }
    return true;
}
function unauthorizedHandler(context) {
    var url = location.href,
        index;
    alert("由于您长时间未操作，需要重新登录");
    index = url.indexOf("#");
    if(index > 0) {
        url = url.substring(0, index);
        location.href = url;
    } else {
        location.replace();
    }
    return false;
}
function forbiddenHandler(context) {
    var error = {
        message: "您没有权限执行此操作，请更换用户重新登录或联系系统管理员。"
    };
    if(context && context.errorFn) {
        context.errorFn(error);
    }
    return false;
}
function successHandler(context, data, textStatus, ajaxRequest) {
    var result = unauthorized(ajaxRequest, context);
    if(result === false) {
        return;
    }
    context.successFn(data);
}
function errorHandler(context, ajaxRequest, textStatus, errorThrown) {
    var result = unauthorized(ajaxRequest, context);
    if(result === false) {
        return;
    }
    if(textStatus === "parsererror") {
        context.error.message = "没能获取预期的数据类型，转换json发生错误";
        context.error.responseText = ajaxRequest.responseText;
    } else {
        try {
            result = JSON.parse(ajaxRequest.responseText);
            context.error.message = result.message || result.Message || "Unknown Error";
        } catch(e) {
            context.error.message = ajaxRequest.responseText;
        }
    }
    context.errorFn(context.error);
}
function ajaxCall(method, url, args, successFn, errorFn, option) {
    var ajaxOption,
        context = {
            error: {}
        };
    if (ui.core.isFunction(args)) {
        errorFn = successFn;
        successFn = args;
        args = null;
    }

    if(ui.core.isPlainObject(errorFn)) {
        option = errorFn;
        errorFn = null;
    }

    ajaxOption = {
        type: method.toUpperCase() === "GET" ? "GET" : "POST",
        dataType: "json",
        url: url,
        async: true,
        // 如果是生产环境，则需要设置一个超时时间
        timeout: 0,
        data: args
    };
    if (option) {
        ajaxOption = ui.extend(ajaxOption, option);
    }
    if(ajaxOption.type === "POST" && !ajaxOption.contentType) {
        ajaxOption.contentType = "application/json; charset=utf-8";
    }

    if (ui.core.isFunction(successFn)) {
        context.successFn = successFn;
        ajaxOption.success = function(ajaxResult) {
            successHandler(context, ajaxResult.data, ajaxResult.statusText, ajaxResult.ajaxRequest);
        };
    }
    if (ui.core.isFunction(errorFn)) {
        context.errorFn = errorFn;
        ajaxOption.error = function(ajaxError) {
            if(ajaxError instanceof Error) {
                context.errorFn(ajaxError);
            } else {
                errorHandler(context, ajaxError.ajaxRequest, ajaxError.statusText, ajaxError.error);
            }
        };
    }
    return ui.ajax(ajaxOption);
}

/**
 * HttpRequest Method方式共有15种
 * Get URL传参
 * Head 没有ResponseBody，用于获取ResponseHead
 * Post ReqeustBody提交数据
 * Put 将客户端的数据发送到服务器上取代文档内容
 * Delete 删除服务器上的文件
 * Connect
 * Options
 * Trace
 * Patch
 * Move
 * Copy
 * Link
 * Unlink
 * Wrapped
 * Extension-method
 */
if(!ui.ajax) {
    // 如果没有ajax模块则使用jquery的ajax模块
    ui.ajax = function(option) {
        //准备参数
        var type, data,
            success,
            error;
        if(ajaxOption.contentType.indexOf("application/json") > -1) {
            data = option.data;
            type = ui.core.type(data);
            if (type !== "string") {
                if (type === "array" || dataType === "object") {
                    data = JSON.stringify(data);
                } else if(data === null || data === undefined || isNaN(data)) {
                    data = "";
                } else {
                    data = data + "";
                }
                option.data = data;
            }
        }
        if(option.success) {
            success = option.success;
            options.success = function(data, statusText, jqXHR) {
                success({
                    data: data, 
                    statusText: statusText, 
                    ajaxRequest: jqXHR
                });
            };
        }
        if(option.error) {
            error = option.error;
            option.error = function(jqXHR, statusText, errorThrown) {
                error({
                    ajaxRequest: jqXHR, 
                    statusText: statusText, 
                    error: errorThrown
                });
            };
        }
        $.ajax(option);
    };
}
/** get方式 */
ui.ajax.get = function (url, params, success, failure, option) {
    if(!option) option = {};
    option.contentType = "application/x-www-form-urlencoded; charset=UTF-8";
    return ajaxCall("GET", url, params, success, failure, option);
};
/** post方式 */
ui.ajax.post = function (url, params, success, failure, option) {
    if(!option) option = {};
    option.contentType = "application/x-www-form-urlencoded; charset=UTF-8";
    return ajaxCall("POST", url, params, success, failure, option);
};
/** post方式，提交数据为为Json格式 */
ui.ajax.postJson = function(url, params, success, failure, option) {
    return ajaxCall("POST", url, params, success, failure, option);
};
/** post方式，提交数据为Json格式，在请求期间会禁用按钮，避免多次提交 */
ui.ajax.postOnce = function (btn, url, params, success, failure, option) {
    var text,
        textFormat,
        fn;
    btn = ui.getJQueryElement(btn);
    if(!btn) {
        throw new TypeError("没有正确设置要禁用的按钮");
    }

    if(ui.core.isPlainObject(failure)) {
        option = failure;
        failure = null;
    }

    if(!option) {
        option = {};
    }

    textFormat = "正在{0}...";
    if(option.textFormat) {
        textFormat = option.textFormat;
        delete option.textFormat;
    }
    btn.attr("disabled", "disabled");
    fn = function() {
        btn.removeAttr("disabled");
    };
    if(btn.isNodeName("input")) {
        text = btn.val();
        if(text.length > 0) {
            btn.val(ui.str.format(textFormat, text));
        } else {
            btn.val(ui.str.format(textFormat, "处理"));
        }
        fn = function() {
            btn.val(text);
            btn.removeAttr("disabled");
        };
    } else {
        text = btn.html();
        if(!_rhtml.test(text)) {
            btn.text(ui.str.format(textFormat, text));
            fn = function() {
                btn.text(text);
                btn.removeAttr("disabled");
            };
        }
    }
    
    option.complete = fn;
    return ajaxCall("POST", url, params, success, failure, option);
};
/** 将多组ajax请求一起发送，待全部完成后才会执行后续的操作 */
ui.ajax.all = function () {
    var promises,
        promise;
    if (arguments.length == 1) {
        if(Array.isArray(arguments[0])) {
            promises = arguments[0];
        } else {
            promises = [arguments[0]];
        }
    } else if (arguments.length > 1) {
        promises = [].slice.call(arguments, 0);
    } else {
        return;
    }
    promise = Promise.all(promises);
    promise._then_old = promise.then;

    promise.then = function (resolve, reject) {
        var context;
        if (ui.core.isFunction(reject)) {
            context = {
                error: {},
                errorFn: reject
            };
            reject = function(xhr) {
                errorHandler(context, xhr);
            };
        }
        return this._then_old.call(this, resolve, reject);
    };
    return promise;
};