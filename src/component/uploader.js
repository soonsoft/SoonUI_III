// uploader
/**
 * HTML上传工具，提供ajax和iframe两种机制，自动根据当前浏览器特性进行切换
 * 这个工具需要配合后台接口完成，可以接入自定义的后台
 */

// 用于生成Id
var counter = 0;

// ajax上传
function ajaxUpload() {
    var upload,
        completed,
        that = this;

    completed = function (xhr, context) {
        var errorMsg = null,
            fileInfo;
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                fileInfo = JSON.parse(xhr.responseText);
                if (context.isEnd) {
                    that.percent = 100.0;
                    that.fire("progressing", that.percent);
                    that.fire("uploaded", getEventData.call(that, fileInfo));
                } else {
                    upload(context.fileName, context.end, context.file, context.total, fileInfo.FileId);
                }
            } else {
                try {
                    errorMsg = $.parseJSON(xhr.responseText);
                    errorMsg = errorMsg.ErrorMessage || errorMsg.errorMessage || errorMsg.message;
                    if(!errorMsg) 
                        errorMsg = "服务器没有返回错误信息。";
                } catch(e) {
                    errorMsg = "服务器返回的错误信息不是JSON格式，无法解析。";
                }
                if (xhr.status == 404) {
                    errorMsg = "请求地址不存在，" + errorMsg;
                } else if (xhr.status == 401) {
                    errorMsg = "没有登录，" + errorMsg;
                } else if (xhr.status == 403) {
                    errorMsg = "没有上传权限，" + errorMsg;
                } else {
                    errorMsg = "上传错误，" + errorMsg;
                }
                that.fire(error, errorMsg);
            }
        }
    };

    upload = function (fileName, index, file, total, fileId) {
        var isEnd, end, chunk,
            xhr, context;

        that.percent = Math.floor(index / total * 1000) / 10;
        that.fire(progressing, that.percent);

        isEnd = false;
        end = index + that.chunkSize;
        chunk = null;
        if (end >= total) {
            end = total;
            isEnd = true;
        }

        if ("mozSlice" in file) {
            chunk = file.mozSlice(index, end);
        } else if ("webkitSlice" in file) {
            chunk = file.webkitSlice(index, end);
        } else {
            chunk = file.slice(index, end);
        }

        xhr = new XMLHttpRequest();
        context = {
            isEnd: isEnd,
            fileName: fileName,
            index: index,
            end: end,
            file: file,
            total: total
        };
        xhr.onload = function() {
            completed.call(that, xhr, context);
        };
        xhr.open("POST", that.option.url, true);
        xhr.setRequestHeader("X-Request-With", "XMLHttpRequest");
        xhr.setRequestHeader("X-File-Index", index);
        xhr.setRequestHeader("X-File-End", end);
        xhr.setRequestHeader("X-File-Total", total);
        xhr.setRequestHeader("X-File-IsEnd", isEnd + ui.str.empty);
        xhr.setRequestHeader("X-File-Name", encodeURIComponent(fileName));
        if (fileId) {
            xhr.setRequestHeader("X-File-Id", fileId);
        }
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.send(chunk);
    };

    this.doUpload = function () {
        var files = this.inputFile[0].files,
            file = files[0];
        if (!files || files.length === 0) {
            return;
        }
        var fileName = file.fileName || file.name,
            index = 0,
            total = file.size;
        upload(fileName, index, file, total);
    };
}
// 表单无刷新上传
function fromUpload() {
    var div = $("<div class='ui-uploader-panel' />"),
        iframeId = "uploadFrameId_" + this._uploaderId;
    this._iframe = $("<iframe class='form-upload-iframe' />");

    this._form = $("<form />");
    this._form.attr("method", "post");
    this._form.attr("action", this.option.url);
    this._form.attr("enctype", "multipart/form-data");
    this._form.attr("target", iframeId);

    this._iframe.prop("id", iframeId);
    this._iframe.prop("name", iframeId);

    this._inputText = $("<input type='text' value='' style='position:absolute;left:-9999px;top:-9999px' />");
    (document.body || document.documentElement).insertBefore(this.inputText[0], null);

    div.append(this._iframe);
    div.append(this._form);
    $(document.body).append(div);

    this._iframe.load((function () {
        var contentWindow,
            fileInfo,
            errorMsg;

        this.percent = 100.0;
        this.fire("progressing", this.percent);

        contentWindow = this._iframe[0].contentWindow;
        fileInfo = contentWindow.fileInfo;
        errorMsg = contentWindow.error;
        if (!fileInfo && !errorMsg) {
            return;
        }
        if (errorMsg) {
            errorMsg = error.errorMessage || "上传发生错误";
            this.fire(error, errorMsg);
            return;
        } else {
            this.fire("uploaded", getEventData.call(this, fileInfo));
        }
    }).bind(this));
    this.doUpload = function () {
        this._form.append(this._inputFile);

        // 为了让视觉效果好一点，直接从20%起跳
        this.percent = 20.0;
        this.fire("progressing", this.percent);

        this._form.submit();
        this._uploadPanel.append(this._inputFile);
        this._inputText.focus();
    };
}

function getEventData(fileInfo) {
    if(!fileInfo) {
        fileInfo = {};
    }
    fileInfo.extension = this.extension;
    fileInfo.fileName = this.fileName;

    return fileInfo;
}

function onInputFileChange(e) {
    var path;
    
    this._reset();
    path = this._inputFile.val();
    if (path.length === 0) {
        return false;
    }
    if (!this.checkFile(path)) {
        showMessage("文件格式不符合要求，请重新选择");
        this._inputFile.val("");
        return false;
    }
    
    if(this.fire(uploading, path) === false) {
        return;
    }

    this.doUpload();
    this._inputFile.val("");
}

function showMessage(msg) {
    if(ui.core.isFunction(ui.messageShow)) {
        ui.messageShow(msg);
        return;
    }
    if(ui.core.isFunction(ui.msgshow)) {
        ui.msgshow(msg);
        return;
    }
    alert(msg);
}

ui.define("ui.ctrls.Uploader", {
    _defineOption: function() {
        return {
            // 上传文件服务的路径
            url: null,
            // 文件过滤器，默认可以上传所有文件。例：*.txt|*.docx|*.xlsx|*.pptx
            filter: "*.*"
        };
    },
    _defineEvents: function() {
        return ["uploading", "upload", "progressing", "error"];
    },
    _create: function() {
        this._uploaderId = ++id;
        this._form = null;
        this._inputFile = null;

        // 初始化事件处理函数
        this.onInputFileChangeHandler = onInputFileChange.bind(this);

        this._reset();
    },
    _render: function() {
        this._prepareUploadMode();
        this._initUploadButton();
        this._initUpload();
    },
    _prepareUploadMode: function() {
        var xhr = null;
        try {
            xhr = new XMLHttpRequest();
            this._initUpload = ajaxUpload;
            xhr = null;
            //upload file size
            this.chunkSize = 512 * 1024;
        } catch (e) {
            this._initUpload = formUpload;
        }
    },
    _initUploadButton: function() {
        var wrapperCss = {},
            upBtn = this.element,
            wrapper;

        this._inputFile = $("<input type='file' class='ui-uploader-input-file' value='' />");
        this._inputFile.prop("id", "inputFile_" + this._uploaderId);
        this._inputFile
            .attr("name", this._uploaderId)
            .attr("title", "选择上传文件");
        this._inputFile.change(this.onInputFileChangeHandler);
        // 如果不支持文件二进制读取
        if (!this.inputFile[0].files) {
            this._initUpload = formUpload;
        }

        ui.core.each("", function(rule) {
            wrapperCss[rule] = upBtn.css(rule);
        });
        if(wrapperCss.position !== "absolute" && 
            wrapperCss.position !== "relative" && 
            wrapperCss.position !== "fixed") {
            
            wrapperCss.position = "relative";
        }
        wrapperCss["overflow"] = "hidden";
        wrapperCss["width"] = upBtn.outerWidth() + "px";
        wrapperCss["height"] = upBtn.outerHeight() + "px";

        wrapper = $("<div />").css(wrapperCss);
        wrapper = upBtn.css({
            "margin": "0",
            "top": "0",
            "left": "0",
            "right": "auto",
            "bottom": "auto"
        }).wrap(wrapper).parent();

        this._uploadPanel = $("<div class='ui-uploader-file' />");
        this._uploadPanel.append(this._inputFile);
        wrapper.append(this._uploadPanel);
    },
    _reset: function() {
        this.filePath = null;
        this.extension = null;
        this.fileName = null;
        this.percent = 0.0;
    },

    /// API
    // 检查文件类型是否符合
    checkFile: function(path) {
        var index = path.lastIndexOf(".");
        if (index === -1) {
            return false;
        }
        this.fileName = path.substring(path.lastIndexOf("\\") + 1, index);
        this.extension = path.substring(index).toLowerCase().trim();

        if (this.option.filter === "*.*") {
            return true;
        }
        
        return this.option.filter.indexOf(this.extension) !== -1;
    }
});

$.fn.uploader = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Uploader(option, this);
};
