var defaultWidth = 640,
    defaultHeight = 480,
    showStyles,
    hideStyles,
    ctrlHandlers;

showStyles = {
    up: function () {
        var parentSize,
            option,
            that;

        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = parentSize.height;
        option.end = (parentSize.height - this.offsetHeight) / 2;
        option.onChange = function (top) {
            that.box.css("top", top + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": option.begin + "px",
            "left": (parentSize.width - this.offsetWidth) / 2 + "px",
            "display": "block"
        });
    },
    down: function () {
        var parentSize,
            option,
            that;

        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = -this.offsetHeight;
        option.end = (parentSize.height - this.offsetHeight) / 2;
        option.onChange = function (top) {
            that.box.css("top", top + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": option.begin + "px",
            "left": (parentSize.width - this.offsetWidth) / 2 + "px",
            "display": "block"
        });
    },
    left: function () {
        var parentSize,
            option,
            that;

        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = -this.offsetWidth;
        option.end = (parentSize.width - this.offsetWidth) / 2;
        option.onChange = function (left) {
            that.box.css("left", left + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": (parent.height - this.offsetHeight) / 2 + "px",
            "left": option.begin + "px",
            "display": "block"
        });
    },
    right: function () {
        var parentSize,
            option,
            that;

        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = parentSize.width;
        option.end = (parentSize.width - this.offsetWidth) / 2;
        option.onChange = function (left) {
            that.box.css("left", left + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": (parentSize.height - this.offsetHeight) / 2 + "px",
            "left": option.begin + "px",
            "display": "block"
        });
    },
    fadein: function () {
        var parentSize,
            option,
            that;

        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = 0;
        option.end = 100;
        option.onChange = function (opacity) {
            that.box.css("opacity", opacity / 100);
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": (parentSize.height - this.offsetHeight) / 2 + "px",
            "left": (parentSize.width - this.offsetWidth) / 2 + "px",
            "opacity": 0,
            "display": "block"
        });
    }
};
hideStyles = {
    up: function () {
        var option,
            that;
        
        that = this;
        option = this.animator[0];
        option.begin = parseFloat(this.box.css("top"));
        option.end = -this.offsetHeight;
        option.onChange = function (top) {
            that.box.css("top", top + "px");
        };

        this.closeMask();
        this.animator.onEnd = function () {
            that.onHidden();
        };
    },
    down: function () {
        var parentSize,
            option,
            that;
        
        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = parseFloat(this.box.css("top"), 10);
        option.end = parentSize.height;
        option.onChange = function (top) {
            that.box.css("top", top + "px");
        };

        this.closeMask();
        this.animator.onEnd = function () {
            that.onHidden();
        };
    },
    left: function () {
        var option,
            that;
        
        that = this;
        option = this.animator[0];
        option.begin = parseFloat(this.box.css("left"), 10);
        option.end = -this.offsetWidth;
        option.onChange = function (left) {
            that.box.css("left", left + "px");
        };

        this.closeMask();
        this.animator.onEnd = function () {
            that.onHidden();
        };
    },
    right: function () {
        var parentSize,
            option,
            that;
        
        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = parseFloat(this.box.css("left"), 10);
        option.end = parentSize.width;
        option.onChange = function (left) {
            that.box.css("left", left + "px");
        };

        this.closeMask();
        this.animator.onEnd = function () {
            that.onHidden();
        };
    },
    fadeout: function () {
        var option,
            that;
        
        that = this;
        option = this.animator[0];
        option.begin = 100;
        option.end = 0;
        option.onChange = function (opacity) {
            that.box.css("opacity", opacity / 100);
        };
        this.closeMask();
        this.animator.onEnd = function () {
            that.onHidden();
        };

        this.box.css({
            "opacity": 1,
            "display": "block"
        });
    }
};

ctrlHandlers = {
    "closable": function (option) {
        var closeBtn,
            that = this;

        closeBtn = $("<a href='javascript:void(0)'>×</a>");
        closeBtn.attr("class", option.className || "closable-button font-highlight-hover");

        closeBtn.click(function() {
            that.hide();
        });

        return closeBtn;
    },
    "maximizable": function(option) {
        var maximizableButton,
            that = this;

        maximizableButton = $("<a href='javascript:void(0)'><i class='fa fa-window-maximize'></i></a>");
        maximizableButton.attr("class", option.className || "maximizable-button font-highlight-hover");

        maximizableButton.click(function() {
            that._maximize(!that.isMaximizeState, maximizableButton);
        });

        return maximizableButton;
    }
};

ui.ctrls.define("ui.ctrls.DialogBox", {
    _defineOption: function() {
        return {
            // 标题 { text: String 标题文字, hasHr: false 是否显示分隔符, style: 标题样式 }
            title: "",
            // 标题栏的高度
            titleHeight: 48,
            // box显示方式
            show: "up",
            // box隐藏方式
            hide: "down",
            // box操作完成的方式
            done: "up",
            // box内容是否是一个url，可以支持iframe外链
            src: null,
            // TODO 父级容器，默认是Body
            parent: null,
            // 内容是否包含iframe
            hasIframe: false,
            // box的宽度
            width: defaultWidth,
            // box的高度
            height: defaultHeight,
            // 是否需要显示遮罩层
            maskable: true,
            // 操作按钮
            buttons: [],
            // 操作栏的高度
            operatePanelHeight: 48,
            // 是否自适应
            suitable: true,
            // 是否可以调整box大小
            resizeable: false,
            // 是否可以拖动box的位置
            draggable: true,
            // 窗体样式
            style: null,
            // 窗体要显示的控制按钮，"closable" or "maximizable"，默认显示关闭按钮；[{type: "closable", className: "closable-button font-highlight-hover", css: null}]
            boxCtrls: ["closable"]
        };
    },
    _defineEvents: function() {
        return ["showing", "shown", "hiding", "hidden", "resize"];
    },
    _create: function() {
        var that;
        this.box = null;
        this.mask = null;
        this.buttons = [];
        this.isMaximizeState = false;
        
        this.animator = ui.animator();
        this.animator.duration = 500;

        if(!ui.core.isNumber(this.option.width)) {
            this.option.width = defaultWidth;
        }
        if(!ui.core.isNumber(this.option.height)) {
            this.option.height = defaultHeight;
        }
        this.option.titleHeight = parseInt(this.option.titleHeight, 10) || 48;
        
        this.offsetWidth = this.width = this.option.width;
        this.offsetHeight = this.height = this.option.height;
        this.contentWidth = this.width;
        this.contentHeight = 0;

        that = this;
        ui.core.each("show, hide, done", function(name) {
            that[name + "Async"] = function(callback) {
                this._asyncCall(name, callback);
            };
        });
    },
    _render: function() {
        var body;

        this.box = $("<div class='ui-dialog-box border-highlight' />");
        this.titlePanel = $("<section class='ui-dialog-box-title' />");
        this.contentPanel = $("<section class='ui-dialog-box-content' />");
        this.operatePanel = null;

        this.box
            .append(this.titlePanel)
            .append(this.contentPanel);

        this._initTitle();
        this._iniBoxCtrlsButton();
        this._initContent();
        this._initOperateButtons();

        this.animator.add({
            target: this.box,
            ease: ui.AnimationStyle.easeFromTo
        });

        this.parent = ui.getJQueryElement(this.option.parent);
        if(this.parent) {
            this.getParentSize = function() {
                return {
                    width: this.parent.width(),
                    height: this.parent.height()  
                };
            };
        } else {
            this.parent = $(document.body);
            this.getParentSize = function() {
                return {
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight
                };
            };
        }

        if(this.maskable()) {
            this.mask = $("<div class='ui-dialog-box-mask' />");
            this.parent.append(this.mask);
            this.animator.add({
                target: this.mask,
                ease: ui.AnimationStyle.easeFrom
            });
        }
        this.parent.append(this.box);

        if(this.draggable()) {
            this._initDraggable();
        }
        if(this.resizeable()) {
            this._initResizeable();
        }
        this._initSuitable();

        if(ui.core.isPlainObject(this.option.style)) {
            this.box.css(this.option.style);
        }
        this.titlePanel.css("height", this.option.titleHeight + "px");
        this.contentPanel.css({
            "height": this.contentHeight + "px",
            "top": this.option.titleHeight + "px"
        });
    },
    _initTitle: function() {
        var title = this.option.title;
        if (ui.core.isPlainObject(title)) {
            this.setTitle(title.text, title.hasHr, title.style);
        } else if (title) {
            this.setTitle(title);
        }
    },
    _iniBoxCtrlsButton: function() {
        var ctrlButtons,
            that = this;

        ctrlButtons = this.option.boxCtrls;
        if(!Array.isArray(ctrlButtons) || ctrlButtons.length === 0) {
            return;
        }
        
        this.boxCtrls = $("<div class='ui-dialog-box-ctrls' />");
        ctrlButtons.forEach(function(option) {
            var handler,
                btn,
                option;
            if(ui.core.isString(option)) {
                option = {
                    type: option
                };
            } else if(ui.core.isFunction(option)) {
                btn = option.call(that);
                if(btn) {
                    that.boxCtrls.append(btn);
                }
                return;  
            }

            handler = ctrlHandlers[option.type];
            if(!handler) {
                return;
            }
            btn = handler.call(that, option);
            if(ui.core.isPlainObject(option.css)) {
                btn.css(option.css);
            }
            that.boxCtrls.append(btn);
        });

        this.box.append(this.boxCtrls);
    },
    _initContent: function() {
        if(this.option.src) {
            this.option.hasIframe = true;
            this.element = $("<iframe class='content-frame' frameborder='0' scrolling='auto' />");
            this.element.prop("src", this.option.src);
        }
        this.contentPanel.append(this.element);
    },
    _initOperateButtons: function() {
        var i, len;
        if(!Array.isArray(this.option.buttons)) {
            if(ui.core.isString(this.option.buttons)) {
                this.option.buttons = [this.option.buttons];
            } else {
                this.option.buttons = [];
            }
        }
        for(i = 0, len = this.option.buttons.length; i < len; i++) {
            this.addButton(this.option.buttons[i]);
        }
    },
    _initDraggable: function() {
        var option = {
            target: this.box,
            parent: $(document.body),
            hasIframe: this.hasIframe()
        };
        this.titlePanel
            .addClass("draggable-handle")
            .draggable(option);
    },
    _initResizeable: function() {
        var option;
        this.resizeHandle = $("<u class='resize-handle' />");
        this.box.append(this.resizeHandle);

        option = {
            context: this,
            target: this.box,
            handle: this.resizeHandle,
            parent: $(document.body),
            hasIframe: this.hasIframe(),
            minWidth: 320,
            minHeight: 240,
            onMoving: function(arg) {
                var op = this.option,
                    that,
                    width, 
                    height;
                that = op.context;
                width = that.offsetWidth + arg.x;
                height = that.offsetHeight + arg.y;
                if (width < option.minWidth) {
                    width = option.minWidth;
                }
                if (height < option.minHeight) {
                    height = option.minHeight;
                }
                that._setSize(width, height);
            }
        };
        this.resizer = ui.MouseDragger(option);
        this.resizer.on();
    },
    _initSuitable: function() {
        var resizeFn,
            that = this;
        if(this.suitable()) {
            resizeFn = function(e, clientWidth, clientHeight) {
                that._calculateSize(clientWidth, clientHeight);
            };
            resizeFn();
            ui.page.resize(resizeFn, ui.eventPriority.ctrlResize);
        } else {
            this._setSize(this.width, this.height, false);
        }
    },
    _maximize: function(state, maximizableButton) {
        var parentSize = this.getParentSize(),
            option;

        if(state === this.isMaximize) {
            return;
        }
        if(!this.maximizeAnimator) {
            this.maximizeAnimator = ui.animator({
                target: this.box,
                onChange: function(val) {
                    this.target.css("top", val + "px");
                }
            }).add({
                target: this.box,
                onChange: function(val) {
                    this.target.css("left", val + "px");
                }
            }).add({
                target: this.box,
                onChange: function(val) {
                    this.target.css("width", val + "px");
                }
            }).add({
                target: this.box,
                onChange: function(val) {
                    this.target.css("height", val + "px");
                }
            });
            this.maximizeAnimator.onBegin = (function() {
                this.contentPanel.css("display", "none");
                if(this.operatePanel) {
                    this.operatePanel.css("display", "none");
                }
            }).bind(this);
            this.maximizeAnimator.onEnd = (function() {
                this.contentPanel.css("display", "block");
                if(this.operatePanel) {
                    this.operatePanel.css("display", "block");
                }
                this._setSize(
                    this.maximizeAnimator[2].end, 
                    this.maximizeAnimator[3].end);
            }).bind(this);
            this.maximizeAnimator.duration = 500;
        }

        if(this.maximizeAnimator.isStarted) {
            return;
        }

        if(state) {
            this.isMaximizeState = true;
            maximizableButton.html("<i class='fa fa-window-restore'></i>");
            
            if(this.resizeHandle) {
                this.resizeHandle.css("display", "none");
            }

            option = this.maximizeAnimator[0];
            option.begin = parseFloat(this.box.css("top")) || 0;
            option.end = 0;

            option = this.maximizeAnimator[1];
            option.begin = parseFloat(this.box.css("left")) || 0;
            option.end = 0;

            option = this.maximizeAnimator[2];
            option.begin = this.offsetWidth;
            option.end = parentSize.width;

            option = this.maximizeAnimator[3];
            option.begin = this.offsetHeight;
            option.end = parentSize.height;

            this.maximizeAnimator.start();
        } else {
            this.isMaximizeState = false;
            maximizableButton.html("<i class='fa fa-window-maximize'></i>");

            if(this.resizeHandle) {
                this.resizeHandle.css("display", "block");
            }

            this.maximizeAnimator.back();
        }
    },
    _calculateSize: function(parentWidth, parentHeight) {
        var newWidth,
            newHeight,
            parentSize;
        
        parentSize = this.getParentSize();
        if(!ui.core.isNumber(parentWidth)) {
            parentWidth = parentSize.width;
        }
        if(!ui.core.isNumber(parentHeight)) {
            parentHeight = parentSize.height;
        }
        newWidth = this.option.width;
        newHeight = parentHeight * 0.85;
        if(this.height > newHeight) {
            if (this.height > parentHeight) {
                newHeight = parentHeight;
            } else {
                newHeight = this.height;
            }
        }
        if (newWidth > parentWidth) {
            newWidth = parentWidth;
        }
        this.setSize(newWidth, newHeight, parentWidth, parentHeight);
    },
    _setSize: function(newWidth, newHeight, isFire) {
        var borderTop = Math.floor(parseFloat(this.box.css("border-top-width"))) || 0,
            borderBottom = Math.floor(parseFloat(this.box.css("border-bottom-width"))) || 0,
            borderLeft = Math.floor(parseFloat(this.box.css("border-left-width"))) || 0,
            borderRight = Math.floor(parseFloat(this.box.css("border-right-width"))) || 0;

        if (ui.core.isNumber(newWidth) && newWidth > 0) {
            this.offsetWidth = newWidth;
            this.width = this.offsetWidth - borderLeft - borderRight;
            this.box.css("width", this.width + "px");
            this.contentWidth = this.width;
        }
        if (ui.core.isNumber(newHeight) && newHeight > 0) {
            this.offsetHeight = newHeight;
            this.height = this.offsetHeight - borderTop - borderBottom;
            this.box.css("height", this.height + "px");
            this._updateContentPanelHeight();
        }
        if (isFire !== false)
            this.fire("resize");
    },
    _updateContentPanelHeight: function() {
        this.contentHeight = this.height - this.option.titleHeight - (this.operatePanel ? this.option.operatePanelHeight : 0);
        this.contentPanel.css("height", this.contentHeight + "px");
    },
    _asyncCall: function(method, callback) {
        var promise = null;
        if(ui.core.isFunction(this[method])) {
            promise = this[method].call(this);
            if (promise && ui.core.isFunction(callback)) {
                promise.then(callback);
            }
        }
    },

    // API
    /** 是否有遮罩层 */
    maskable: function() {
        return !!this.option.maskable;
    },
    /** 是否自适应显示 */
    suitable: function() {
        return !!this.option.suitable; 
    },
    /** 是否可以调整大小 */
    resizeable: function() {
        return !!this.option.resizeable;
    },
    /** 是否可以拖动 */
    draggable: function() {
        return !!this.option.draggable;
    },
    /** 内容是否包含iframe标签 */
    hasIframe: function() {
        return !!this.option.hasIframe;
    },
    /** 设置标题 */
    setTitle: function(title, hasHr, style) {
        var titleContent,
            titleInner;
        if(ui.core.isString(title)) {
            titleContent = $("<span class='title-text font-highlight' />").text(title);
        } else if (ui.core.isDomObject(title)) {
            titleContent = $(title);
        } else if (ui.core.isJQueryObject(title)) {
            titleContent = title;
        }

        this.titlePanel.empty();
        titleInner = $("<div class='title-inner-panel' />");
        titleInner.append(titleContent);
        
        if (hasHr !== false) {
            hasHr = true;
        }
        if(hasHr) {
            titleInner.append("<hr class='ui-dialog-box-spline background-highlight' />");
        }
        this.titlePanel.append(titleInner);

        if(Array.isArray(style)) {
            style.forEach((function(item) {
                this.titlePanel.addClass(item);
            }).bind(this));
        } else if(ui.core.isPlainObject(style)) {
            this.titlePanel.css(style);
        }
    },
    /** 添加操作按钮 */
    addButton: function(button) {
        button = ui.getJQueryElement(button);
        if(!button) {
            return;
        }
        if(!this.operatePanel) {
            this.operatePanel = $("<section class='ui-dialog-box-operate' />");
            this.box.append(this.operatePanel);
            this._updateContentPanelHeight();
            this.fire("resize");
        }
        this.operatePanel.append(button);
        return this;
    },
    /** 显示状态 */
    isShow: function() {
        return this.box.css("display") === "block";
    },
    /** 显示 */
    show: function(showFn) {
        if(this.animator.isStarted || this.isShow()) {
            return ui.PromiseEmpty;
        }

        if(this.fire("showing") === false) {
            return ui.PromiseEmpty;
        }
        if(!ui.core.isFunction(showFn)) {
            showFn = showStyles[this.option.show];
            if(!ui.core.isFunction(showFn)) {
                return ui.PromiseEmpty;
            }
        }
        showFn.call(this);
        return this.animator.start();
    },
    /** 取消并隐藏 */
    hide: function(hideFn) {
        if(this.animator.isStarted || !this.isShow()) {
            return ui.PromiseEmpty;
        }

        if(this.fire("hiding") === false) {
            return ui.PromiseEmpty;
        }
        if(!ui.core.isFunction(hideFn)) {
            hideFn = hideStyles[this.option.hide];
            if(!ui.core.isFunction(hideFn)) {
                return ui.PromiseEmpty;
            }
        }
        hideFn.call(this);
        return this.animator.start();
    },
    /** 完成并隐藏 */
    done: function(doneFn) {
        if(!ui.core.isFunction(doneFn)) {
            doneFn = hideStyles[this.option.done];
            if(!ui.core.isFunction(doneFn)) {
                return ui.PromiseEmpty;
            }
        }
        return this.hide(doneFn);
    },
    /** 显示结束后处理函数，显示动画用 */
    onShown: function() {
        this.fire("shown");
    },
    /** 隐藏结束后处理函数，隐藏动画用 */
    onHidden: function() {
        this.box.css("display", "none");
        if (this.maskable()) {
            this.parent.css("overflow", this._oldBodyOverflow);
            this.mask.css("display", "none");
        }
        this.fire("hidden");
    },
    /** 显示遮罩层，显示动画用 */
    openMask: function() {
        var option,
            parentSize = this.getParentSize();
        if (this.maskable()) {
            this._oldBodyOverflow = this.parent.css("overflow");
            this.parent.css("overflow", "hide");
            this.mask.css({
                "display": "block",
                "opacity": 0,
                "height": parentSize.height + "px"
            });

            option = this.animator[1];
            option.begin = 0;
            option.end = 70;
            option.onChange = function (op) {
                this.target.css("opacity", op / 100);
            };
        }
    },
    /** 隐藏遮罩层，隐藏动画用 */
    closeMask: function() {
        var option;
        if (this.maskable()) {
            option = this.animator[1];
            option.begin = 70;
            option.end = 0;
            option.onChange = function (op) {
                this.target.css("opacity", op / 100);
            };
        }
    },
    /** 设置大小并居中显示 */
    setSize: function(newWidth, newHeight, parentWidth, parentHeight) {
        var parentSize = this.getParentSize();
        if(!ui.core.isNumber(parentWidth)) {
            parentWidth = parentSize.width;
        }
        if(!ui.core.isNumber(parentHeight)) {
            parentHeight = parentSize.height;
        }
        this._setSize(newWidth, newHeight);
        this.box.css({
            "top": (parentHeight - this.offsetHeight) / 2 + "px",
            "left": (parentWidth - this.offsetWidth) / 2 + "px"
        });
        if (this.maskable()) {
            this.mask.css("height", parentHeight + "px");
        }
    }
});

$.fn.dialogBox = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.DialogBox(option, this);
};

/** 添加显示动画样式 */
ui.ctrls.DialogBox.setShowStyle = function(name, fn) {
    if(ui.core.isString(name) && name.length > 0) {
        if(ui.core.isFunction(fn)) {
            showStyles[name] = fn;
        }
    }
};
/** 添加隐藏动画样式 */
ui.ctrls.DialogBox.setHideStyle = function(name, fn) {
    if(ui.core.isString(name) && name.length > 0) {
        if(ui.core.isFunction(fn)) {
            hideStyles[name] = fn;
        }
    }
};
