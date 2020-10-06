// Slidebar

function prepareMove(arg) {
    var option = arg.option,
        lengthValue;
    if(this.isHorizontal()) {
        lengthValue = this.track.width();
    } else {
        lengthValue = this.track.height();
    }
    option.lengthValue = lengthValue;
}
function moving(arg) {
    var option = arg.option,
        extend;

    extend = this.thumb.width() / 2;
    if(this.isHorizontal()) {
        moveHorizontal.call(this, arg.x, extend, option.lengthValue);
    } else {
        moveVertical.call(this, arg.y, extend, option.lengthValue);
    }
}
function moveHorizontal(changeVal, extend, lengthValue) {
    var percent,
        location;

    location = parseFloat(this.thumb.css("left")) || 0;
    location += changeVal;
    percent = calculatePercent.call(this, location + extend, 0, lengthValue);
    
    if(this.percent !== percent) {
        this.percent = percent;
        this.valuebar.css("width", this.percent + "%");
        this.thumb.css("left", (lengthValue * (this.percent / 100) - extend) + "px");

        this.fire("changed", percent);
    }
}
function moveVertical(changeVal, extend, lengthValue) {
    var percent,
        location;

    location = parseFloat(this.thumb.css("top")) || 0;
    location += changeVal;
    percent = calculatePercent.call(this, location + extend, 0, lengthValue);

    if(this.percent !== percent) {
        this.percent = 100 - percent;
        this.valuebar.css({
            "top": percent + "%",
            "height": this.percent + "%"
        });
        this.thumb.css("top", (lengthValue * (percent / 100) - extend) + "px");

        this.fire("changed", percent);
    }
}
function onMouseup(e) {
    var offset,
        lengthValue,
        arg;

    if(this.mouseDragger._isDragStart) {
        return;
    }
    arg = {};
    offset = this.track.offset();
    if(this.isHorizontal()) {
        lengthValue = this.track.width();
        arg.x = e.pageX - offset.left;
        arg.x -= parseFloat(this.thumb.css("left")) || 0;
    } else {
        lengthValue = this.track.height();
        arg.y = e.pageY - offset.top;
        arg.y -= parseFloat(this.thumb.css("top")) || 0;
    }
    arg.option = {
        lengthValue: lengthValue
    };
    moving.call(this, arg);
}
function onMouseWheel(e) {
    var lengthValue,
        arg,
        stepValue,
        delta;

    e.stopPropagation();
    if(this.mouseDragger._isDragStart) {
        return;
    }
    arg = {};
    delta = Math.trunc(e.deltaY || -(e.wheelDelta));
    stepValue = delta * 5;

    if(this.isHorizontal()) {
        lengthValue = this.track.width();
        arg.x = stepValue;
    } else {
        lengthValue = this.track.height();
        arg.y = stepValue;
    }
    
    arg.option = {
        lengthValue: lengthValue
    };
    moving.call(this, arg);
}
function calculatePercent(location, min, max) {
    var percent;
    if(location > max) {
        percent = 100;
    } else if(location < min) {
        percent = 0;
    } else {
        percent = ui.fixedNumber((location / max) * 100, 2);
    }
    return percent;
}

ui.ctrls.define("ui.ctrls.Slidebar", {
    _defineOption: function() {
        return {
            // 方向 横向 horizontal | 纵向 vertical
            direction: "horizontal",
            // 界面中是否需要屏蔽iframe
            iframeShield: false,
            // 滑动条的粗细
            thickness: 8,
            // 是否是只读的 默认false
            readonly: false,
            // 是否是禁用的 默认false
            disabled: false
        };
    },
    _defineEvents: function() {
        return ["changed"];
    },
    _create: function() {
        var position;
        this.percent = 0;
        
        position = this.element.css("position");
        if(position !== "absolute" && position !== "relative" && position !== "fixed") {
            this.element.css("position", "relative");
        }
        this.element.addClass("ui-slidebar");
        
        this.defineProperty("readonly", this.getReadonly, this.setReadonly);
        this.defineProperty("disabled", this.getDisabled, this.setDisabled);
        this.defineProperty("percentValue", this.getPercent, this.setPercent);

        this.onMouseupHandler = onMouseup.bind(this);
        this.onMouseWheelHandler = onMouseWheel.bind(this);
    },
    _render: function() {
        this.track = $("<div class='ui-slidebar-track' />");
        this.valuebar = $("<div class='ui-slidebar-value' />");
        this.thumb = $("<b class='ui-slidebar-thumb' />");

        this.track.append(this.valuebar);
        this.element.append(this.track).append(this.thumb);

        this._initScale();
        this._initMouseDragger();
        this.track.on("mouseup", this.onMouseupHandler);
        this.element.on("wheel", this.onMouseWheelHandler);

        this.readonly = this.option.readonly;
        this.disabled = this.option.disabled;
    },
    _initScale: function() {
        var thickness = this.option.thickness,
            size = thickness * 2;

        this.thumb.css({
            "width": size + "px",
            "height": size + "px"
        });

        if(this.isHorizontal()) {
            this.track.css({
                "width": "100%",
                "height": thickness + "px",
                "top": (size - thickness) / 2 + "px"
            });
            this.valuebar.css("width", "0");
            this.thumb.css("left", -(size / 2) + "px");
            this.element.css("height", size + "px");
        } else {
            this.track.css({
                "width": thickness + "px",
                "height": "100%",
                "left": (size - thickness) / 2 + "px"
            });
            this.valuebar.css({
                "top": "100%",
                "height": "0"
            });
            this.thumb.css("top", this.track.height() - (size / 2) + "px");
            this.element.css("width", size + "px");
        }
    },
    _initMouseDragger: function() {
        var option = {
            target: this.thumb,
            handle: this.thumb,
            context: this,
            onBeginDrag: function(arg) {
                var option = arg.option,
                    context = option.context;
                prepareMove.call(context, arg);
            },
            onMoving: function(arg) {
                var option = arg.option,
                    context = option.context;
                moving.call(context, arg); 
            }
        };
        this.mouseDragger = new ui.MouseDragger(option);
    },

    // API
    isHorizontal: function() {
        return this.option.direction === "horizontal";
    },
    getReadonly: function() {
        return this.option.readonly;
    },
    setReadonly: function(value) {
        this.option.readonly = !!value;
        if(this.option.readonly) {
            this.mouseDragger.off();
            this.valuebar.removeClass("background-highlight");
            this.thumb.removeClass("background-highlight");
        } else {
            this.mouseDragger.on();
            this.valuebar.addClass("background-highlight");
            this.thumb.addClass("background-highlight");
        }
    },
    /** 获取禁用状态 */
    getDisabled: function() {
        return this.option.disabled;
    },
    /** 设置禁用状态 */
    setDisabled: function(value) {
        this.option.disabled = !!value;
        if(this.option.disabled) {
            this.mouseDragger.off();
            this.valuebar.removeClass("background-highlight");
            this.thumb.removeClass("background-highlight");
        } else {
            this.mouseDragger.on();
            this.valuebar.addClass("background-highlight");
            this.thumb.addClass("background-highlight");
        }
    },
    /** 获取值 */
    getPercent: function() {
        return this.percent;
    },
    /** 设置值 */
    setPercent: function(value) {
        var percent,
            arg = {
                option: {}
            };
        percent = value;
        if(ui.core.isNumber(percent)) {
            if(percent < 0) {
                percent = 0;
            } else if(percent > 100) {
                percent = 100;
            }
            if(this.isHorizontal()) {
                arg.option.lengthValue = this.track.width();
                arg.x = arg.option.lengthValue * percent / 100;
            } else {
                arg.option.lengthValue = this.track.height();
                arg.y = arg.option.lengthValue * (0 - percent) / 100;
            }
            moving.call(this, arg);
        }
    }
});

$.fn.slidebar = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Slidebar(option, this);
};
