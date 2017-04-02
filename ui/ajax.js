// ajax
var responsedJson = "X-Responded-JSON";
function unauthorized(xhr, context) {
    var json = null;
    if(xhr.status == 401) {
        return unauthorizedHandler(context);
    } else if(xhr.status == 403) {
        return forbiddenHandler(context);
    } else if(xhr.status == 200) {
        json = xhr.getResponseHeader(responsedJson);
        if(!ui.str.isNullOrEmpty(json)) {
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
    var url = location.href;
    var index;
    alert("等待操作超时，您需要重新登录");
    index = url.indexOf("#");
    if(index > 0) {
        url = url.substring(0, index);
    }
    location.replace();
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
function successHandler(context, data, textStatus, xhr) {
    var result = unauthorized(xhr, context);
    if(result === false) {
        return;
    }
    context.successFn(data);
}
function errorHandler(context, xhr, textStatus, errorThrown) {
    var result = unauthorized(xhr, context);
    if(result === false) {
        return;
    }
    if(textStatus === "parsererror") {
        context.error.message = "没能获取预期的数据类型，转换json发生错误";
        context.error.responseText = xhr.responseText;
    } else {
        try {
            result = JSON.parse(xhr.responseText);
            context.error.message = result.Message;
        } catch(e) {
            context.error.message = xhr.responseText;
        }
    }
    context.errorFn(context.error);
}
function buildKeyValueParameters(args) {
    var builder = [],
        add = function(key, valueOrFunction) {
            if(!key) return;
            var value = (ui.core.isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction);
            builder.push(encodeURIComponent(key) + "=" + encodeURIComponent(value === null ? "" : value));
        },
        i;
    if(Array.isArray(args)) {
        for(i = 0; i < args.length; i++) {
            add(args[i].name, args[i].value);
        }
    } else {
        for(i in args) {
            if(args.hasOwnProperty(i)) {
                add(i, args[i]);
            }
        }
    }
    return builder.join("&");
}
function buildJsonParameters(args) {
    return JSON.stringify(args);
}
function ajaxCall(method, url, args, successFn, errorFn, option) {
    var type,
        paramFn,
        ajaxOption,
        context = {
            error: {}
        };
    if ($.isFunction(args)) {
        errorFn = successFn;
        successFn = args;
        args = null;
    }

    ajaxOption = {
        type: method.toUpperCase() === "GET" ? "GET" : "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: url,
        async: true,
        data: args
    };
    if (option) {
        ajaxOption = $.extend(ajaxOption, option);
    }
    
    //准备参数
    type = ui.core.type(args);
    if(ajaxOption.contentType.indexOf("application/json") > -1) {
        paramFn = buildJsonParameters;
    } else {
        paramFn = buildKeyValueParameters;
    }
    if (type !== "string") {
        if (type === "array" || ui.core.isPlainObject(args)) {
            args = paramFn(args);
        } else if(args === null || args === undefined || isNaN(args)) {
            args = "";
        } else {
            args = args + "";
        }
    }

    if ($.isFunction(successFn)) {
        context.successFn = successFn;
        ajaxOption.success = function(d, s, r) {
            successHandler(context, d, s, r);
        };
    }
    if ($.isFunction(errorFn)) {
        context.errorFn = errorFn;
        ajaxOption.error = function(r, s, t) {
            errorHandler(context, r, s, t);
        }
    }
    return $.ajax(ajaxOption);
}

ui.ajax = {
    ajaxGet: function (url, args, success, failure, option) {
        if(!option) option = {};
        option.contentType = "application/x-www-form-urlencoded";
        return ajaxCall("GET", url, args, success, failure, option);
    },
    ajaxPost: function (url, args, success, failure, option) {
        return ajaxCall("POST", url, args, success, failure, option);
    },
    ajaxPostForm: function(url, args, success, failure, option) {
        if(!option) option = {};
        option.contentType = "application/x-www-form-urlencoded";
        return ajaxCall("POST", url, args, success, failure, option);
    },
    ajaxPostOnce: function (btn, url, args, success, failure, option) {
        btn = ui.getJQueryElement(btn);
        if(!btn) {
            throw new Error("没有正确设置要禁用的按钮");
        }
        if(!option) {
            option = {};
        }

        var text = null,
            textFormat = "正在{0}...",
            func;
        if(option.textFormat) {
            textFormat = option.textFormat;
            delete option.textFormat;
        }
        btn.attr("disabled", "disabled");
        func = function() {
            btn.removeAttr("disabled");
        };
        if(btn.isNodeName("input")) {
            text = btn.val();
            if(text.length > 0) {
                btn.val(ui.str.stringFormat(textFormat, text));
            } else {
                btn.val(ui.str.stringFormat(textFormat, "处理"));
            }
            func = function() {
                btn.val(text);
                btn.removeAttr("disabled");
            };
        } else {
            text = btn.html();
            if(!ui._rhtml.test(text)) {
                btn.text(ui.str.stringFormat(textFormat, text));
                func = function() {
                    btn.text(text);
                    btn.removeAttr("disabled");
                };
            }
        }
        
        option.complete = func;
        return ajaxCall("POST", url, args, success, failure, option);
    },
    ajaxAll: function () {
        var promises;
        if (arguments.length == 1) {
            promises = [arguments[0]];
        } else if (arguments.length > 1) {
            promises = [].slice.call(arguments, 0);
        } else {
            return;
        }
        var promise = Promise.all(promises);
        promise._then_old = promise.then;

        promise.then = function () {
            var context;
            if (arguments.length > 1 && $.isFunction(arguments[1])) {
                context = {
                    error: {},
                    errorFn: arguments[1]
                };
                arguments[1] = function(xhr) {
                    errorHandler(context, xhr);
                };
            }
            return this._then_old.apply(this, arguments);
        };
        return promise;
    }
};