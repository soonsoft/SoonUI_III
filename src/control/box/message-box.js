// MessageBox
var MessageType = {
        message: 0,
        warn: 1,
        error: 3,
        success: 4,
        failed: 5
    },
    defaultWaitSeconds = 5,
    messagebox;

function MessageBox() {
    if(this instanceof MessageBox) {
        this.initialize();
    } else {
        return new MessageBox();
    }
}
MessageBox.prototype = {
    constructor: MessageBox,
    initialize: function() {
        this.box = null;
        this.type = MessageType;
        this.isStartHide = false;
        this.boxAnimator = null;
        this.width = 322;
        this.top = 88;
    },
    _initAnimator: function() {
        this.boxAnimator = ui.animator({
            target: this.box,
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css("left", val + "px");
            }
        });
        this.boxAnimator.duration = 200;
    },
    getIcon: function(type) {
        if(type === MessageType.warn) {
            return "mb-warn fa fa-exclamation-triangle";
        } else if(type === MessageType.error) {
            return "mb-error fa fa-times-circle";
        } else if(type === MessageType.success) {
            return "mb-success fa fa-check-circle-o";
        } else if(type === MessageType.failed) {
            return "mb-failed fa fa-times-circle-o";
        } else {
            return "mb-message fa fa-commenting";
        }
    },
    getBox: function () {
        var clientWidth,
            clientHeight;
        if (!this.box) {
            clientWidth = document.documentElement.clientWidth;
            clientHeight = document.documentElement.clientHeight;
            this.box = $("<div class='ui-message-box border-highlight' />");
            this.box.css({
                "top": this.top + "px",
                "left": clientWidth + "px",
                "max-height": clientHeight - (this.top * 2) + "px"
            });
            var close = $("<a href='javascript:void(0)' class='closable-button'>×</a>");
            var that = this;
            close.on("click", function (e) {
                that.hide(true);
            });
            this.box.on("mouseenter", function (e) {
                if (that.isClosing) {
                    return;
                }
                if (that.isStartHide) {
                    that._show();
                } else {
                    clearTimeout(that.hideHandler);
                }
            });
            this.box.on("mouseleave", function (e) {
                that.waitSeconds(defaultWaitSeconds);
            });

            this.box.append(close);
            $(document.body).append(this.box);

            this._initAnimator();
        }
        return this.box;
    },
    isShow: function() {
        return this.getBox().css("display") === "block";
    },
    show: function (text, type) {
        var box,
            messageItem,
            content,
            result;
        
        messageItem = $("<div class='message-item' />");
        messageItem.append($("<i class='message-icon " + this.getIcon(type) + "'></i>"));
        content = $("<div class='message-content' />");
        if(ui.core.isFunction(text)) {
            result = text();
            if(ui.core.isString(result)) {
                content.text(result);
            } else {
                content.append(result);
            }
        } else {
            content.text(text);
        }
        messageItem.append(content);

        box = this.getBox();
        if(this.isShow()) {
            box.append(messageItem);
            return;
        }
        box.children(".message-item").remove();
        box.append(messageItem);
        this._show(function () {
            messagebox.waitSeconds(defaultWaitSeconds);
        });
    },
    _show: function (completedHandler) {
        var box = this.getBox(),
            option,
            clientWidth = document.documentElement.clientWidth;
        this.isStartHide = false;

        this.boxAnimator.stop();
        option = this.boxAnimator[0];
        option.begin = parseFloat(option.target.css("left")) || clientWidth;
        option.end = clientWidth - this.width;
        option.target.css("display", "block");
        this.boxAnimator.start().then(completedHandler);
    },
    hide: function (flag) {
        var box,
            option,
            that = this,
            clientWidth = document.documentElement.clientWidth;
        if (flag) {
            this.isClosing = true;
        }
        box = this.getBox();
        this.isStartHide = true;

        this.boxAnimator.stop();
        option = this.boxAnimator[0];
        option.begin = parseFloat(option.target.css("left")) || clientWidth - this.width;
        option.end = clientWidth;
        this.boxAnimator.start().then(function() {
            box.css("display", "none");
            that.isClosing = false;
            that.isStartHide = false;
        });
    },
    waitSeconds: function (seconds) {
        var that = this;
        if (that.hideHandler)
            window.clearTimeout(that.hideHandler);
        if (isNaN(parseInt(seconds)))
            seconds = defaultWaitSeconds;
        that.hideHandler = window.setTimeout(function () {
            that.hideHandler = null;
            if (that.isStartHide === false) {
                that.hide();
            }
        }, seconds * 1000);
    }
};

// 初始化全局消息提示框
messagebox = MessageBox();
ui.page.resize(function(e) {
    var box = messagebox.getBox(),
        clientWidth = document.documentElement.clientWidth,
        clientHeight = document.documentElement.clientHeight,
        left;
    if(messagebox.isShow()) {
        left = clientWidth - messagebox.width;
    } else {
        left = clientWidth;
    }
    messagebox.waitSeconds(defaultWaitSeconds);
    box.css({
        "left": left + "px",
        "max-height": clientHeight - (messagebox.top * 2) + "px"
    });
});
function msgshow(text, type) {
    if(!type) {
        type = MessageType.message;
    }
    messagebox.show(text, type);
}
ui.messageShow = function(text) {
    msgshow(text, MessageType.message);
};
ui.warnShow = function(text) {
    msgshow(text, MessageType.warn);
};
ui.errorShow = function(text) {
    msgshow(text, MessageType.error);
};
ui.successShow = function(text) {
    msgshow(text, MessageType.success);
};
ui.failedShow = function(text) {
    msgshow(text, MessageType.failed);
};
