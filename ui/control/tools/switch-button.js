/* 开关按钮 */
ui.define("ui.ctrls.SwitchButton", {
    _defineOption: function() {
        return {
            width: 44,
            height: 24,
            thumbColor: null,
            readonly: false,
            style: null
        };
    },
    _defineEvents: function() {
        return ["changed"];
    },
    _create: function() {
        var that;
        
        this.switchBox = $("<label class='ui-switch-button' />");
        this.inner = $("<div class='switch-inner' />");
        this.thumb = $("<div class='switch-thumb' />");
        
        if(this.option.style === "lollipop") {
            this.switchBox.addClass("switch-lollipop");
            this._open = this._lollipopOpen;
            this._close = this._lollipopClose;
            this.thumbSize = 24;
        } else if(this.option.style === "marshmallow") {
            this.switchBox.addClass("switch-marshmallow");
            this._open = this._lollipopOpen;
            this._close = this._lollipopClose;
            this.thumbSize = 20;
        } else {
            this.thumbSize = 18;
        }

        if(this.option.thumbColor) {
            this.thumb.css("background-color", this.option.thumbColor);
        } else {
            this.option.thumbColor = this.thumb.css("background-color");
        }

        this._createAnimator();
        
        this.element.wrap(this.switchBox);
        this.switchBox = this.element.parent();
        this.switchBox
            .append(this.inner)
            .append(this.thumb);
        
        this.width = this.option.width || parseFloat(this.switchBox.css("width"));
        this.height = this.option.height || parseFloat(this.switchBox.css("height"));
        
        that = this;
        this.element.change(function(e) {
            that.onChange();
        });

        this.defineProperty("readonly", this.getReadonly, this.setReadonly);
        this.defineProperty("value", this.getValue, this.setValue);
        this.defineProperty("checked", this.getChecked, this.setChecked);
        
        this.readonly = !!this.option.readonly;
        if(this.checked) {
            this._open();
        }
    },
    _createAnimator: function() {
        this.animator = ui.animator({
            target: this.thumb,
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                var color = color = ui.color.overlay(this.beginColor, this.endColor, val / 100);
                color = ui.color.rgb2hex(color.red, color.green, color.blue);
                this.target.css("background-color", color);
            }
        }).addTarget({
            target: this.thumb,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val, elem) {
                elem.css("left", val + "px");
            }
        });
        this.animator.duration = 200;
    },
    onChange: function() {
        var checked = this.element.prop("checked");
        if(this.readonly) {
            this.element.prop("checked", !checked);
            return;
        }
        if(checked) {
            this._open();
        } else {
            this._close();
        }
        this.fire("changed");
    },
    _open: function() {
        this.animator.stop();
        this.switchBox.addClass("switch-open");
        this.inner
            .addClass("border-highlight")
            .addClass("background-highlight");
        var option = this.animator[0];
        option.beginColor = this.option.thumbColor;
        option.endColor = "#FFFFFF";
        option.begin = 0;
        option.end = 100;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = this.width - this.thumbSize - 3;
        this.animator.start();
    },
    _close: function() {
        var option;

        this.animator.stop();
        this.switchBox.removeClass("switch-open");
        this.inner
            .removeClass("border-highlight")
            .removeClass("background-highlight");
        
        option = this.animator[0];
        option.beginColor = "#FFFFFF";
        option.endColor = this.option.thumbColor;
        option.begin = 0;
        option.end = 100;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = 3;
        
        this.animator.start();     
    },
    _lollipopOpen: function() {
        var option;

        this.animator.stop();
        this.switchBox.addClass("switch-open");
        this.inner.addClass("background-highlight");
        this.thumb
            .addClass("border-highlight")
            .addClass("background-highlight");
        
        option = this.animator[0];
        option.begin = 0;
        option.end = 0;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = this.option.width - this.thumbSize;
        this.animator.start();
    },
    _lollipopClose: function() {
        var option;

        this.animator.stop();
        this.switchBox.removeClass("switch-open");
        this.inner.removeClass("background-highlight");
        this.thumb
            .removeClass("border-highlight")
            .removeClass("background-highlight");
        
        option = this.animator[0];
        option.begin = 0;
        option.end = 0;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = 0;
        
        this.animator.start();
    },
    _isOpen: function() {
        return this.switchBox.hasClass("switch-open");  
    },

    getReadonly: function() {
        return !!this.option.readonly;
    },
    setReadonly: function(value) {
        this.option.readonly = !!value;
        if(this.option.readonly) {
            this.element.attr("readonly", "readonly");
        } else {
            this.element.removeAttr("readonly");
        }
    },
    getValue: function() {
        return this.element.val();
    },
    setValue: function(value) {
        this.element.val(value);
    },
    getChecked: function() {
        return this.element.prop("checked");
    },
    setChecked: function(value) {
        var checked = this.element.prop("checked");
        if((!!arguments[0]) !== checked) {
            this.element.prop("checked", arguments[0]);
            this.onChange();
        } else {
            //修正checkbox和当前样式不一致的状态，可能是手动给checkbox赋值或者是reset导致
            if(checked && !this._isOpen()) {
                this._open();
            } else if(!checked && this._isOpen()) {
                this._close();
            }
        }
    }
});
$.fn.switchButton = function(option) {
    if (this.length === 0) {
        return null;
    }
    if(this.nodeName() !== "INPUT" && this.prop("type") !== "checkbox") {
        throw new TypeError("the element is not checkbox");
    }
    return ui.ctrls.SwitchButton(option, this);
};
