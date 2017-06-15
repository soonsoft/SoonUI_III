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
        location,
        extend,
        result;

    extend = this.thumb.width() / 2;
    if(this.isHorizontal()) {
        moveHorizontal.call(this, arg.x, extend, option.lengthValue);
    } else {
        moveVertical.call(this, arg.y, extend, option.lengthValue);
    }
}
function moveHorizontal(changeVal, extend, lengthValue) {
    var percent;
    location = parseFloat(this.thumb.css("left"));
    location += changeVal;
    percent = calculatePercent.call(this, location + extend, 0, lengthValue);
    if(this.percent !== percent) {
        this.percent = percent;
        this.valuebar.css("width", this.percent + "%");
        this.thumb.css("left", location + "px");

        this.fire("changed", percent);
    }
}
function moveVertical(changeVal, extend, lengthValue) {
    var percent;
    location = parseFloat(this.thumb.css("top"));
    location += changeVal;
    percent = calculatePercent.call(this, location + extend, 0, lengthValue);
    if(this.percent !== percent) {
        this.percent = percent;
        this.valuebar.css({
            "top": 100 - this.percent + "%",
            "height": this.percent + "%"
        });
        this.thumb.css("top", location + "px");

        this.fire("changed", percent);
    }
}
function calculatePercent(location, min, max) {
    var percent;
    if(location > max) {
        this.percent = 100;
    } else if(location < min) {
        this.percent = 0;
    } else {
        percent = ui.fixedNumber(location / max, 2);
    }
    return percent;
}

ui.define("ui.ctrls.Slidebar", {
    _defineOption: function() {
        return {
            // 方向 横向 horizontal | 纵向 vertical
            direction: "horizontal",
            // 界面中是否需要屏蔽iframe
            iframeShield: false,
            // 滑动条的粗细
            thickness: 8
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
        
    },
    _render: function() {
        this.track = $("<div class='ui-slidebar-track' />");
        this.valuebar = $("<div class='ui-slidebar-value background-highlight' />");
        this.thumb = $("<b class='ui-slidebar-thumb' />");

        this.track
                .append(this.valuebar)
                .append(this.thumb);
        this.element.append(this.track);

        this._initScale();
        this._initMouseDragger();
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
            this.thumb.css("top", this.track().height() - (size / 2) + "px");
            this.element.css("width", size + "px");
        }
    },
    _initMouseDragger: function() {
        var option = {
            target: this.thumb,
            handle: this.thumb,
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
        this.mouseDragger.on();
    },

    // API
    isHorizontal: function() {
        return this.option.direction === "horizontal";
    },
    /** 启用禁用 */
    disabled: function() {
        // 还没有实现
    },
    /** 设置值 */
    setPercent: function(percent) {
        var value,
            extend,
            arg = {
                option: {}
            };
        extend = this.thumb.width() / 2;
        if(ui.core.isNumber(percent)) {
            if(percent < 0) {
                percent = 0;
            } else if(percent > 100) {
                percent = 100;
            }
            if(this.isHorizontal()) {
                arg.option.lengthValue = this.track.width();
                arg.x = arg.option.lengthValue * percent / 100 - extend;
            } else {
                arg.option.lengthValue = this.track.height();
                arg.y = arg.option.lengthValue * (100 - percent) / 100 - extend;
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
