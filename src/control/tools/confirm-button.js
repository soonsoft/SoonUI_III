/* 确认按钮 */

function noop() {}
// 事件
function onButtonClick(e) {
    var checkHandler = this.option.checkHandler,
        that = this;

    if(this.disabled) {
        return;
    }

    clearTimeout(this.backTimeHandler);
    if(ui.core.isFunction(checkHandler)) {
        if(checkHandler.call(this) === false) {
            return;
        }
    }
    if(this.state === 0) {
        this._next();
        this.backTimeHandler = setTimeout(function() {
            that._back();
        }, this.option.backTime);
    } else if(this.state === 1) {
        this._next();
        this.option.handler.call(this);
    }
}

ui.ctrls.define("ui.ctrls.ConfirmButton", {
    _defineOption: function () {
        return {
            disabled: false,
            backTime: 3000,
            checkHandler: false,
            handler: false,
            /** 确认按钮文字颜色 */
            color: "#fff",
            /** 确认按钮背景颜色 */
            backgroundColor: "#990000"
        };
    },
    _create: function() {
        this.state = 0;
        if(ui.core.type(this.option.backTime) !== "number" || this.option.backTime <= 0) {
            this.option.backTime = 5000;
        }

        if(!ui.core.isFunction(this.option.handler)) {
            this.option.handler = noop;
        }

        this.option.disabled = !!this.option.disabled;

        // 事件处理函数
        this.onButtonClickHandler = $.proxy(onButtonClick, this);

        this.defineProperty("disabled", this.getDisabled, this.setDisabled);
        this.defineProperty("text", this.getText, this.setText);
    },
    _render: function() {
        var text,
            textState,
            confirmState;

        text = this.element.text().trim();
        textState = $("<span class='text-state' />");
        confirmState = $("<i class='confirm-state' />");
        
        textState.text(text);
        confirmState.text("确定");
        if(this.option.backgroundColor) {
            confirmState.css("background-color", this.option.backgroundColor);
        }
        if(this.option.color) {
            confirmState.css("color", this.option.color);
        }
        this.element.addClass("confirm-button");
        this.element.css("width", this.element.width() + "px");
        this.element
            .empty()
            .append(textState)
            .append(confirmState);
        this.element.click(this.onButtonClickHandler);
        
        this._initAnimation(textState, confirmState);
        
        this.disabled = this.option.disabled;
    },
    _initAnimation: function(textState, confirmState) {
        this.changeAnimator = ui.animator({
            target: textState,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("margin-left", val + "%");
            }
        }).add({
            target: confirmState,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("left", val + "%");
            }
        });
        this.changeAnimator.duration = 200;
    },
    _back: function() {
        var that,
            option;

        if(this.changeAnimator.isStarted) {
            return;
        }
        this.state = 0;

        option = this.changeAnimator[0];
        option.target.css("margin-left", "-200%");
        option.begin = -200;
        option.end = 0;
        option = this.changeAnimator[1];
        option.target.css("left", "0%");
        option.begin = 0;
        option.end = 100;
        
        this.changeAnimator.start();
    },
    _next: function(state) {
        var that,
            option;

        if(this.changeAnimator.isStarted) {
            return;
        }
        if(this.state === 0) {
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
        
        this.changeAnimator.start();
    },
    getDisabled: function() {
        return this.option.disabled;
    },
    setDisabled: function(value) {
        this.option.disabled = !!value;
        if(this.option.disabled) {
            this.element.attr("disabled", "disabled");
        } else {
            this.element.removeAttr("disabled");
        }
    },
    getText: function() {
        var span = this.element.children(".text-state");
        return span.text();
    },
    setText: function(value) {
        var span = this.element.children(".text-state");
        span.text(ui.str.trim(value + ""));
    }
});
$.fn.confirmClick = function(option) {
    if (!this || this.length === 0) {
        return null;
    }
    if(ui.core.isFunction(option)) {
        if(ui.core.isFunction(arguments[1])) {
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
