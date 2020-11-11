//侧滑面板基类
ui.ctrls.define("ui.ctrls.SidebarBase", {
    showTimeValue: 300,
    hideTimeValue: 300,
    _defineOption: function() {
        return {
            parent: null,
            width: 240,
            hasCloseButton: true
        };
    },
    _defineEvents: function () {
        return ["showing", "shown", "hiding", "hidden", "resize"];
    },
    _create: function() {
        this.parent = ui.getJQueryElement(this.option.parent);
        if(!this.parent) {
            this.parent = $(document.body);
        }

        this._showClass = "ui-sidebar-show";
        this.height = 0;
        this.width = this.option.width || 240;
        this.borderWidth = 0;
    },
    _render: function() {
        var that = this;

        this._panel = $("<aside class='ui-sidebar-panel border-highlight' />");
        this._panel.css("width", this.width + "px");
        
        if(this.option.hasCloseButton) {
            this._closeButton = $("<button class='ui-side-close-button font-highlight-hover' />");
            this._closeButton.append("<i class='far fa-angle-right'></i>");
            this._closeButton.on("click", function(e) {
                that.hide();
            });
        }

        if(this.element) {
            this._panel.append(this.element);
        }
        this._panel.append(this._closeButton);
        this.parent.append(this._panel);
        
        this.borderWidth += parseInt(this._panel.css("border-left-width"), 10) || 0;
        this.borderWidth += parseInt(this._panel.css("border-right-width"), 10) || 0;
        
        //进入异步调用，给resize事件绑定的时间
        setTimeout((function() {
            // 初始化位置
            var width = this.width;
            this.width = 0;
            that.setSize(width, this.parent.height());
        }).bind(this));
        ui.page.resize((function() {
            that.setSize(this.width, this.parent.height());
        }).bind(this), ui.eventPriority.ctrlResize);
        
        this.animator = ui.animator({
            target: this._panel,
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css("left", val + "px");
            }
        });
    },
    set: function (elem) {
        if(this.element) {
            this.element.remove();
        }
        if(ui.core.isDomObject(elem)) {
            elem = $(elem);
        } else if(!ui.core.isJQueryObject(elem)) {
            return;
        }
        this.element = elem;
        this._closeButton.before(elem);
    },
    append: function(elem) {
        if(ui.core.isDomObject(elem)) {
            elem = $(elem);
        } else if(!ui.core.isJQueryObject(elem)) {
            return;
        }
        this._panel.append(elem);
        if(!this.element) {
            this.element = elem;
        }
    },
    setSize: function(width, height, resizeFire) {
        var parentWidth,
            oldWidth = this.width, 
            oldHeight = this.height,
            sizeCss = {};

        if(ui.core.isNumber(width) && width > 0 && width !== oldWidth) {
            this.width = width;
            sizeCss.width = width + "px";
        }

        if(ui.core.isNumber(height) && height > 0 && height !== oldHeight) {
            this.height = height;
            sizeCss.height = height + "px";
        }

        if(!sizeCss.width && !sizeCss.height) {
            return;
        }

        this._panel.css(sizeCss);

        if(sizeCss.width) {
            parentWidth = this.parent.width();
            this.hideLeft = parentWidth;
            this.left = parentWidth - this.width - this.borderWidth;
            if (this.isShow()) {
                this._panel.css({
                    "left": this.left + "px",
                    "display": "block"
                });
            } else {
                this._panel.css({
                    "left": this.hideLeft + "px",
                    "display": "none"
                });
            }
        }
        
        if(resizeFire !== false) {
            this.fire("resize", this.width, this.height);
        }
    },
    isShow: function() {
        return this._panel.hasClass(this._showClass);
    },
    show: function() {
        var op, 
            that = this,
            i, len;
        if(!this.isShow()) {
            if(this.fire("showing") === false) {
                return ui.PromiseEmpty;
            }

            this.animator.stop();
            this.animator.splice(1, this.length - 1);
            this.animator.duration = this.showTimeValue;
            
            op = this.animator[0];
            op.target.css("display", "block");
            op.target.addClass(this._showClass);
            op.begin = parseFloat(op.target.css("left")) || this.hideLeft;
            op.end = this.left;

            for(i = 0, len = arguments.length; i < len; i++) {
                if(arguments[i]) {
                    this.animator.add(arguments[i]);
                }
            }

            this.animator.onEnd = function() {
                this.splice(1, this.length - 1);
                that.fire("shown");
            };
            return this.animator.start();
        }
        return ui.PromiseEmpty;
    },
    hide: function() {
        var op,
            that = this,
            i, len;
        if(this.isShow()) {
            if(this.fire("hiding") === false) {
                return ui.PromiseEmpty;
            }

            this.animator.stop();
            this.animator.splice(1, this.length - 1);
            this.animator.duration = this.hideTimeValue;
            
            op = this.animator[0];
            op.target.removeClass(this._showClass);
            op.begin = parseFloat(op.target.css("left")) || this.left;
            op.end = this.hideLeft;
            
            for(i = 0, len = arguments.length; i < len; i++) {
                if(arguments[i]) {
                    this.animator.add(arguments[i]);
                }
            }

            this.animator.onEnd = function() {
                this.splice(1, this.length - 1);
                op.target.css("display", "none");
                that.fire("hidden");
            };
            return this.animator.start();
        }
        return ui.PromiseEmpty;
    }
});
