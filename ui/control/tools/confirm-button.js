/* 确认按钮 */
ui.define("ui.ctrls.ConfirmButton", {
    _defineOption: function () {
        return {
            disabled: false,
            readonly: false,
            backTime: 5000,
            checkHandler: false,
            handler: false,
            color: null,
            backgroundColor: null
        };
    },
    _create: function() {
        var text,
            textState,
            confirmState;

        this.state = 0;
        this.animating = false;
        if(ui.core.type(this.option.backTime) !== "number" || this.option.backTime <= 0) {
            this.option.backTime = 5000;
        }

        if(!$.isFunction(this.option.handler)) {
            return;
        }
        text = ui.str.trim(this.element.text());
        textState = $("<span class='text-state' />");
        confirmState = $("<i class='confirm-state' />");
        
        textState.text(text);
        if(!this.option.backgroundColor) {
            this.option.backgroundColor = this.element.css("color");
        }
        confirmState
            .text("确定")
            .css("background-color", this.option.backgroundColor);
        if(this.option.color) {
            confirmState.css("color", this.option.color);
        }
        this.element.addClass("confirm-button");
        this.element.css("width", this.element.width() + "px");
        this.element
            .empty()
            .append(textState)
            .append(confirmState);
        
        this.changeAnimator = ui.animator({
            target: textState,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("margin-left", val + "%");
            }
        }).addTarget({
            target: confirmState,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("left", val + "%");
            }
        });
        this.changeAnimator.duration = 200;
        this.element.click($.proxy(this.doClick, this));
        
        this.readonly(this.option.readonly);
        this.disabled(this.option.disabled);
    },
    doClick: function(e) {
        clearTimeout(this.backTimeHandler);
        if($.isFunction(this.option.checkHandler)) {
            if(this.option.checkHandler.call(this) === false) {
                return;
            }
        }
        var that = this;
        if(this.state == 0) {
            this.next();
            this.backTimeHandler = setTimeout(function() {
                that.back();
            }, this.option.backTime);
        } else if(this.state == 1) {
            this.next();
            this.option.handler.call(this);
        }
    },
    back: function() {
        if(this.animating) {
            return;
        }
        var that = this,
            option;
        this.state = 0;
        option = this.changeAnimator[0];
        option.target.css("margin-left", "-200%");
        option.begin = -200;
        option.end = 0;
        option = this.changeAnimator[1];
        option.target.css("left", "0%");
        option.begin = 0;
        option.end = 100;
        
        this.animating = true;
        this.changeAnimator.start().done(function() {
            that.animating = false;
        });
    },
    next: function(state) {
        if(this.animating) {
            return;
        }
        var that = this,
            option;
        if(this.state == 0) {
            option = this.changeAnimator[0];
            option.target.css("margin-left", "0%");
            option.begin = 0;
            option.end = -200;
            option = this.changeAnimator[1];
            option.target.css("left", "100%");
            option.begin = 100;
            option.end = 0;
            
            this.state = 1;
        } else {
            option = this.changeAnimator[0];
            option.target.css("margin-left", "100%");
            option.begin = 100;
            option.end = 0;
            option = this.changeAnimator[1];
            option.target.css("left", "0%");
            option.begin = 0;
            option.end = -100;
            
            this.state = 0;
        }
        this.animating = true;
        this.changeAnimator.start().done(function() {
            that.animating = false;
        });
    },
    disabled: function() {
        if(arguments.length == 0) {
            return this.option.disabled;
        } else {
            this.option.disabled = !!arguments[0];
            if(this.option.disabled) {
                this.element.attr("disabled", "disabled");
            } else {
                this.element.removeAttr("disabled")
            }
        }
    },
    readonly: function() {
        if(arguments.length == 0) {
            return this.option.readonly;
        } else {
            this.option.readonly = !!arguments[0];
            if(this.option.readonly) {
                this.element.attr("readonly", "readonly");
            } else {
                this.element.removeAttr("readonly");
            }
        }
    },
    text: function() {
        var span = this.element.children(".text-state");
        if(arguments.length == 0) {
            return span.text();
        } else {
            return span.text(ui.str.trim(arguments[0] + ""));
        }
    }
});
$.fn.confirmClick = function(option) {
    if (!this || this.length == 0) {
        return null;
    }
    if($.isFunction(option)) {
        if($.isFunction(arguments[1])) {
            option = {
                checkHandler: option,
                handler: arguments[1]
            };
        } else {
            option = {
                handler: option
            };
        }
    }
    return ui.ctrls.ConfirmButton(option, this);
};
