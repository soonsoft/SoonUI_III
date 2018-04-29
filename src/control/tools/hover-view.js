/* 悬停视图 */
var guid = 1;
// 鼠标移动处理事件
function onDocumentMousemove (e) {
    var x = e.clientX,
        y = e.clientY;
    if (this.animating) {
        return;
    }
    var p = this.target.offset();
    var tl = {
        top: Math.floor(p.top),
        left: Math.floor(p.left)
    };
    tl.bottom = tl.top + this.targetHeight;
    tl.right = tl.left + this.targetWidth;

    p = this.viewPanel.offset();
    var pl = {
        top: Math.floor(p.top),
        left: Math.floor(p.left)
    };
    pl.bottom = pl.top + this.height;
    pl.right = pl.left + this.width;

    //差值
    var xdv = -1,
        ydv = -1,
        l, r,
        t = tl.top < pl.top ? tl.top : pl.top,
        b = tl.bottom > pl.bottom ? tl.bottom : pl.bottom;
    //判断view在左边还是右边
    if (tl.left < pl.left) {
        l = tl.left;
        r = pl.right;
    } else {
        l = pl.left;
        r = tl.right;
    }

    //判断鼠标是否在view和target之外
    if (x < l) {
        xdv = l - x;
    } else if (x > r) {
        xdv = x - r;
    }
    if (y < t) {
        ydv = t - y;
    } else if (y > b) {
        ydv = y - b;
    }

    if (xdv == -1 && ydv == -1) {
        xdv = 0;
        if (x >= tl.left && x <= tl.right) {
            if (y <= tl.top - this.buffer || y >= tl.bottom + this.buffer) {
                ydv = this.buffer;
            }
        } else if (x >= pl.left && x <= pl.right) {
            if (y < pl.top) {
                ydv = pl.top - y;
            } else if (y > pl.bottom) {
                ydv = y - pl.bottom;
            }
        }
        if (ydv == -1) {
            this.viewPanel.css({
                "opacity": 1,
                "filter": "Alpha(opacity=100)"
            });
            return;
        }
    }

    if (xdv > this.buffer || ydv > this.buffer) {
        this.hide();
        return;
    }

    var opacity = 1.0 - ((xdv > ydv ? xdv : ydv) / this.buffer);
    if (opacity < 0.2) {
        this.hide();
        return;
    }
    this.viewPanel.css({
        "opacity": opacity,
        "filter": "Alpha(opacity=" + opacity * 100 + ")"
    });
}


ui.define("ui.ctrls.HoverView", {
    buffer: 30,
    _defineOption: function () {
        return {
            width: 160,
            height: 160
        };
    },
    _defineEvents: function () {
        return ["showing", "showed", "hiding", "hided"];
    },
    _create: function () {
        this.viewPanel = $("<div class='hover-view-panel border-highlight' />");
        this.viewPanel.css({
            "width": this.option.width + "px",
            "max-height": this.option.height + "px"
        });
        $(document.body).append(this.viewPanel);

        this.width = this.viewPanel.outerWidth();
        this.height = this.viewPanel.outerHeight();

        this.target = null;
        this.targetWidth = null;
        this.targetHeight = null;

        this.hasDocMousemoveEvent = false;

        this.animating = false;
        this.isShow = false;

        if (!ui.core.isNumber(this.option.width) || this.option.width <= 0) {
            this.option.width = 160;
        }
        if (!ui.core.isNumber(this.option.height) || this.option.height <= 0) {
            this.option.height = 160;
        }

        this.onDocumentMousemoveHander = onDocumentMousemove.bind(this);
        this.onDocumentMousemoveHander.guid = "hoverView" + (guid++);
    },
    empty: function () {
        this.viewPanel.empty();
        return this;
    },
    append: function (elem) {
        this.viewPanel.append(elem);
        return this;
    },
    addDocMousemove: function () {
        if (this.hasDocMousemoveEvent) {
            return;
        }
        this.hasDocMousemoveEvent = true;
        $(document).on("mousemove", this.onDocumentMousemoveHander);
    },
    removeDocMousemove: function () {
        if (!this.hasDocMousemoveEvent) {
            return;
        }
        this.hasDocMousemoveEvent = false;
        $(document).off("mousemove", this.onDocumentMousemoveHander);
    },
    setLocation: function () {
        ui.setLeft(this.target, this.viewPanel);
    },
    getLocation: function () {
        var location = ui.getLeftLocation(this.target, this.width, this.height);
        return location;
    },
    show: function (target) {
        var view = this;
        this.target = target;

        this.animating = true;

        var result = this.fire("showing");
        if (result === false) return;

        //update size
        this.targetWidth = this.target.outerWidth();
        this.targetHeight = this.target.outerHeight();
        this.height = this.viewPanel.outerHeight();

        this.viewPanel.stop();
        var loc = this.getLocation(),
            opacity,
            css;
        if (this.isShow) {
            css = {
                left: loc.left + "px",
                top: loc.top + "px"
            };
            opacity = parseFloat(this.viewPanel.css("opacity"));
            if (opacity < 1) {
                css["opacity"] = 1;
                css["filter"] = "Alpha(opacity=100)";
            }
        } else {
            this.viewPanel.css({
                "top": loc.top + "px",
                "left": loc.left + "px",
                "opacity": 0,
                "filter": "Alpha(opacity=0)"
            });
            css = {
                "opacity": 1,
                "filter": "Alpha(opacity=100)"
            };
        }
        this.isShow = true;
        this.viewPanel.css("display", "block");
        var func = function () {
            view.animating = false;
            view.addDocMousemove();
            view.fire("showed");
        };
        this.viewPanel.animate(css, 240, func);
    },
    hide: function (complete) {
        var view = this;

        var result = this.fire("hiding");
        if (result === false) return;

        this.viewPanel.stop();
        this.removeDocMousemove();
        var func = function () {
            view.isShow = false;
            view.viewPanel.css("display", "none");
            view.fire("hided");
        };
        var css = {
            "opacity": 0,
            "filter": "Alpha(opacity=0)"
        };
        this.viewPanel.animate(css, 200, func);
    }
});
ui.createHoverView = function (option) {
    return ui.ctrls.HoverView(option);
};
$.fn.addHoverView = function (view) {
    if (this.length === 0) {
        return null;
    }
    var that = this;
    if (view instanceof ui.ctrls.HoverView) {
        this.mouseover(function(e) {
            view.show(that);
        });
    }
};
