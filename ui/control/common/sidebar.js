//侧滑面板基类
ui.define("ui.ctrls.SidebarBase", {
    showTimeValue: 300,
    hideTimeValue: 300,
    _getOption: function() {
        return {
            parent: null,
            width: 240
        };
    },
    _getEvents: function () {
        return ["showing", "showed", "hiding", "hided", "resize"];
    },
    _create: function() {
        this.parent = ui.getJQueryElement(this.option.parent);

        this._showClass = "sidebar-show";
        this.height = 0;
        this.width = this.option.width || 240;
        this.borderWidth = 0;
    },
    _render: function() {
        var that = this;

        this._panel = $("<aside class='sidebar-panel border-highlight' />");
        this._panel.css("width", this.width + "px");
        
        this._closeButton = $("<button class='icon-button' />");
        this._closeButton.append("<i class='fa fa-arrow-right'></i>");
        this._closeButton.css({
            "position": "absolute",
            "top": "6px",
            "right": "10px",
            "z-index": 999
        });
        this._closeButton.click(function(e) {
            that.hide();
        });

        if(this.element) {
            this._panel.append(this.element);
        }
        this._panel.append(this._closeButton);
        this.parent.append(this._panel);
        
        this.borderWidth += parseInt(this._panel.css("border-left-width"), 10) || 0;
        this.borderWidth += parseInt(this._panel.css("border-right-width"), 10) || 0;
        
        //进入异步调用，给resize事件绑定的时间
        setTimeout(function() {
            that.setSizeLocation();
        });
        ui.page.resize(function() {
            that.setSizeLocation();
        }, ui.eventPriority.ctrlResize);
        
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
    setSizeLocation: function(width, resizeFire) {
        var parentWidth = this.parent.width(),
            parentHeight = this.parent.height();
        
        this.height = parentHeight;
        var sizeCss = {
            height: this.height + "px"
        };
        var right = this.width;
        if ($.isNumeric(width)) {
            this.width = width;
            sizeCss["width"] = this.width + "px";
            right = width;
        }
        this.hideLeft = parentWidth;
        this.left = parentWidth - this.width - this.borderWidth;
        this._panel.css(sizeCss);
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
            this.animator.stop();
            this.animator.splice(1, this.length - 1);
            this.animator.duration = this.showTimeValue;
            
            op = this.animator[0];
            op.target.css("display", "block");
            op.target.addClass(this._showClass);
            op.begin = parseFloat(op.target.css("left"), 10) || this.hideLeft;
            op.end = this.left;

            for(i = 0, len = arguments.length; i < len; i++) {
                if(arguments[i]) {
                    this.animator.addTarget(arguments[i]);
                }
            }

            this.animator.onBegin = function() {
                that.fire("showing");
            };
            this.animator.onEnd = function() {
                this.splice(1, this.length - 1);
                that.fire("showed");
            };
            return this.animator.start();
        }
        return null;
    },
    hide: function() {
        var op,
            that = this,
            i, len;
        if(this.isShow()) {
            this.animator.stop();
            this.animator.splice(1, this.length - 1);
            this.animator.duration = this.hideTimeValue;
            
            op = this.animator[0];
            op.target.removeClass(this._showClass);
            op.begin = parseFloat(op.target.css("left"), 10) || this.left;
            op.end = this.hideLeft;
            
            for(i = 0, len = arguments.length; i < len; i++) {
                if(arguments[i]) {
                    this.animator.addTarget(arguments[i]);
                }
            }

            this.animator.onBegin = function() {
                that.fire("hiding");
            };
            this.animator.onEnd = function() {
                this.splice(1, this.length - 1);
                op.target.css("display", "none");
                that.fire("hided");
            };
            return this.animator.start();
        }
        return null;
    }
});
