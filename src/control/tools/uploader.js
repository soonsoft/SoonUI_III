// uploader
/**
 * HTML上传工具，提供ajax和iframe两种机制，自动根据当前浏览器特性进行切换
 * 这个工具需要配合后台接口完成，可以接入自定义的后台
 */

// 用于生成Id
var counter = 0,
    global = ui.core.global(),
    fouceText,
    getChunk,
    initUploader;

function noop() {}

function getErrorMessage(status) {
    if(status === 400) {
        return "上传文件请求格式错误";
    } else if(status === 401) {
        return "需要登录以后才能上传文件";
    } else if(status === 403) {
        return "您没有上传文件的权限，请联系管理员";
    } else if(status === 404) {
        return "上传地址不存在，请联系管理员";
    } else {
        return "上传文件发生错误";
    }
}

if(global.FormData) {
    initUploader = function() {
        var that = this;

        function doUpload(fileName, index, file, total, fileId) {
            var isEnd, end, chunk,
                xhr, context;
    
            that.percent = Math.floor(index / total * 1000) / 10;
            that.fire("progressing", that.percent);
    
            isEnd = false;
    
            if(getChunk === noop) {
                isEnd = true;
                end = total;
                chunk = file;
            } else {
                end = index + that.chunkSize;
                chunk = null;
                if (end >= total) {
                    end = total;
                    isEnd = true;
                }
                chunk = getChunk.call(file, index, end);
            }
            context = {
                fileInfo: {
                    isEnd: isEnd,
                    isAbort: that.isAbort,
                    fileName: fileName,
                    index: index,
                    end: end,
                    total: total,
                    fileId: fileId || ""
                },
                file: file
            };
    
            ui.upload(
                that.option.url,
                chunk,
                context.fileInfo,
                function(ajaxResult) {
                    successHandler(ajaxResult.data, ajaxResult.ajaxRequest, context);
                },
                function(ajaxError) {
                    var status,
                        errorMessage;
                    status = ajaxError.ajaxRequest.status;
                    errorMessage = getErrorMessage(status);
                    that.fire();
                },
                "json"
            );
        }

        function successHandler(data, ajaxRequest, context) {
            var errorMessage,
                fileInfo,
                json = ajaxRequest.getResponseHeader("X-Responded-JSON");
            if(!ui.str.isEmpty(json)) {
                try {
                    json = JSON.parse(json);
                    errorMessage = getErrorMessage(json.status);
                } catch(e) {
                    json = null;
                    errorMessage = getErrorMessage();
                }
                return;
            }

            if (context.isEnd) {
                that.percent = 100.0;
                that.fire("progressing", that.percent);
                that.fire("uploaded", data);
            } else {
                fileInfo = context.fileInfo;
                if(fileInfo.isAbort) {
                    this.fire("uploaded", fileInfo);
                } else {
                    fileInfo.fileId = data.fileId;
                    doUpload(fileInfo.fileName, fileInfo.end, fileInfo.file, fileInfo.total, fileInfo.fileId);
                }
            }
        }

        this._upload = function() {
            var files, file,
                fileName, index, total,
                i, key, sliceNames;
        
            files = this._inputFile[0].files;
            file = files[0];
            if (!files || files.length === 0) {
                return;
            }

            fileName = file.fileName || file.name;
            index = 0;
            total = file.size;

            if(!getChunk) {
                sliceNames = ["slice", "webkitSlice", "mozSlice"];
                for(i = 0; i < sliceNames.length; i++) {
                    key = sliceNames[i];
                    if(key in file) {
                        getChunk = function(index, end) {
                            return this[key](index, end);
                        };
                        break;
                    }
                }
                if(!getChunk) {
                    getChunk = noop;
                }
            }

            doUpload(fileName, index, file, total);
        };
    };
} else {
    // 浏览器不支持FormData，用iFrame实现无刷新上传
    initUploader = function() {
        var div = $("<div class='ui-uploader-panel' />"),
            iframeId = "uploadFrameId_" + this._uploaderId;

        this._iframe = $("<iframe class='form-upload-iframe' />");
        this._iframe.prop("id", iframeId);
        this._iframe.prop("name", iframeId);

        this._form = $("<form />");
        this._form.attr("method", "post");
        this._form.attr("action", this.option.url);
        this._form.attr("enctype", "multipart/form-data");
        this._form.attr("target", iframeId);

        this._form.append(this._inputFile);

        div.append(this._iframe);
        div.append(this._form);
        $(document.body).append(div);

        this._iframe[0].onload = (function () {
            var contentWindow,
                fileInfo,
                errorMsg;

            this.percent = 100.0;
            this.fire("progressing", this.percent);
    
            contentWindow = this._iframe[0].contentWindow;
            fileInfo = contentWindow.fileInfo;
            errorMsg = contentWindow.error;
            if (!fileInfo && !errorMsg) {
                this.fire("error", getErrorMessage());
                return;
            }
            if (errorMsg) {
                errorMsg = error.errorMessage || getErrorMessage();
                this.fire("error", errorMsg);
            } else {
                this.fire("uploaded", fileInfo);
            }
        }).bind(this);

        if(!fouceText) {
            fouceText = $("<input type='text' value='' style='position:absolute;left:-99px;top:-1px;width:0;height:0;' />");
            (document.body || document.documentElement).insertBefore(fouceText[0], null);
        }
        this._upload = function() {
            // 为了让视觉效果好一点，直接从20%起跳
            this.percent = 20.0;
            this.fire("progressing", this.percent);
            
            this._form.submit();
            fouceText.focus();
        };
    };
}

function onInputFileChange(e) {
    this._reset();
    this.fire("selected", this._inputFile[0]);
    if(this.option.autoUpload) {
        this.upload();
    }
}

ui.ctrls.define("ui.ctrls.Uploader", {
    _defineOption: function() {
        return {
            // 上传文件服务的路径
            url: null,
            // 用户选择文件后是否自动上传
            autoUpload: true,
            // 上传文件分块大小，默认为512k，降级时无效
            chunkSize: 512,
            // 文件过滤器，默认可以上传所有文件。例：*.txt|*.docx|*.xlsx|*.pptx
            filter: "*.*"
        };
    },
    _defineEvents: function() {
        return ["selected", "uploading", "uploaded", "progressing", "error"];
    },
    _create: function() {
        this._uploaderId = ++counter;
        this._form = null;
        this._inputFile = null;

        // upload file size
        this.chunkSize = this.option.chunkSize * 1024 || 512 * 1024;

        // 初始化事件处理函数
        this.onInputFileChangeHandler = onInputFileChange.bind(this);

        this._reset();
    },
    _render: function() {
        this._initUploadButton();
        initUploader.call(this);
    },
    _initUploadButton: function() {
        var inputFileId = "inputFile_" + this._uploaderId;

        if(!this.element) {
            this.element = $("<label />");
        }
        if(this.element.nodeName() !== "LABEL") {
            throw TypeError("the element must be label element");
        }

        this.element.addClass("ui-uploader-button");
        this.element.prop("for", inputFileId);

        this._inputFile = $("<input type='file' class='ui-uploader-input-file' value='' />");
        this._inputFile.prop("id", inputFileId);
        this._inputFile.prop("name", this._uploaderId);
        this._inputFile.change(this.onInputFileChangeHandler);

        this.element.append(this._inputFile);
    },
    _reset: function() {
        this.filePath = null;
        this.extension = null;
        this.fileName = null;
        this.percent = 0.0;
        // 是否取消
        this.isAbort = false;
    },

    /// API
    /**
     * @public
     * 检查文件类型是否符合要求
     * @param path{String} 选择文件的路径
     */
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
    },
    /**
     * @public
     * 开始上传
     */
    upload: function() {
        var path = this._inputFile.val();
        if (path.length === 0) {
            this.fire("error", "没有选择要上传的文件");
            return;
        }
        if (!this.checkFile(path)) {
            this.fire("error", "不支持上传当前选择的文件格式");
            return;
        }

        if(!this.option.url) {
            throw new TypeError("the upload url is null.");
        }

        if(this.fire("uploading", path) === false) {
            return;
        }
        this._upload();
        
        this._inputFile.val("");
    },
    /**
     * @public
     * 取消上传
     */
    abort: function() {
        this.isAbort = true;
    }
});

$.fn.uploader = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Uploader(option, this);
};
