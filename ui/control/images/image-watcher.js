//图片局部放大查看器
ui.define("ui.ctrls.ImageWatcher", {
    _defineOption: function () {
        return {
            position: "right",
            zoomWidth: null,
            zoomHeight: null
        };
    },
    _create: function () {
        this.borderWidth = 1;
        this.viewMargin = 10;
        
        this.option.position = this.option.position.toLowerCase();
        this.zoomWidth = this.option.zoomWidth;
        this.zoomHeight = this.option.zoomHeight;

        this.element.addClass("image-watch-panel");
        this.focusView = $("<div class='focus-view border-highlight' />");
        this.zoomView = $("<div class='zoom-view border-highlight' />");
        this.zoomImage = $("<img alt='' />");
        
        this.zoomView.append(this.zoomImage);
        this.element.append(this.focusView).append(this.zoomView);
    },
    _render: function() {
        this._initImage();
        this._initZoomer();
    },
    _initImage: function() {
        this.image = $(this.element.children("img")[0]);
        if(this.image.length == 0) {
            throw new Error("元素中没有图片，无法使用图片局部查看器");
        }
        this.imageOffsetWidth = this.image.width();
        this.imageOffsetHeight = this.image.height();
        this.image.css({
            "width": "auto",
            "height": "auto"
        });
        this.imageWidth = this.image.width();
        this.imageHeight = this.image.height();
        this.image.css({
            "width": this.imageOffsetWidth + "px",
            "height": this.imageOffsetHeight + "px"
        });
        
        this.zoomImage.prop("src", this.image.prop("src"));
    },
    _initZoomer: function() {
        var that = this;
        if(ui.core.isNumber(this.option.zoomHeight)) {
            this.zoomHeight = this.element.height();
        }
        if(ui.core.isNumber(this.option.zoomWidth)) {
            this.zoomWidth = this.zoomHeight;
        }
        this.zoomView.css({
            "width": this.zoomWidth - this.borderWidth * 2 + "px",
            "height": this.zoomHeight - this.borderWidth * 2 + "px"
        });
        
        this.element
            .mouseenter(function(e) {
                that.start = true;
                that._setFocusView(e);
                that._setZoomView();
            })
            .mousemove(function(e) {
                if(!that.start) {
                    return;
                }
                that._setFocusView(e);
                that._setZoomView();
            })
            .mouseleave(function(e) {
                that.start = false;
                that.focusView.css("display", "none");
                that.zoomView.css("display", "none");
            });
    },
    _setFocusView: function(e) {
        var offset = this.image.offset(),
            offsetX = e.clientX - offset.left,
            offsetY = e.clientY - offset.top;
        var ratio = this.imageOffsetWidth / this.imageWidth,
            width = this.zoomWidth * ratio,
            height = this.zoomHeight * ratio;
        var top, left,
            parentOffset = this.element.offset(),
            marginTop = offset.top - parentOffset.top,
            marginLeft = offset.left - parentOffset.left;
        if(offsetX < 0 || offsetX > this.imageOffsetWidth || offsetY < 0 || offsetY > this.imageOffsetHeight) {
            this.focusView.css("display", "none");
            return;
        }
        left = offsetX + marginLeft - width / 2;
        if(left < marginLeft) {
            left = marginLeft;
        } else if(left + width > this.imageOffsetWidth + marginLeft) {
            left = this.imageOffsetWidth + marginLeft - width;
        }
        top = offsetY + marginTop - height / 2;
        if(top < marginTop) {
            top = marginTop;
        } else if(top + height > this.imageOffsetHeight + marginTop) {
            top = this.imageOffsetHeight + marginTop - height;
        }
        this.focusView.css({
            "display": "block",
            "width": width - this.borderWidth * 2 + "px",
            "height": height - this.borderWidth * 2 + "px",
            "top": top + "px",
            "left": left + "px"
        });
        
        this.topRatio = (top - marginTop) / this.imageOffsetHeight;
        this.leftRatio = (left - marginLeft) / this.imageOffsetWidth;
    },
    _setZoomView: function() {
        if(this.focusView.css("display") === "none") {
            this.zoomView.css("display", "none");
            return;
        }
        var top, left;
        if(this.option.position === "top") {
            left = 0;
            top = -(this.zoomHeight + this.viewMargin);
        } else if(this.option.position === "bottom") {
            left = 0;
            top = (this.element.outerHeight() + this.viewMargin);
        } else if(this.option.position === "left") {
            left = -(this.zoomWidth + this.viewMargin);
            top = 0;
        } else {
            left = (this.element.outerWidth() + this.viewMargin);
            top = 0;
        }
        
        this.zoomView.css({
            "display": "block",
            "top": top + "px",
            "left": left + "px"
        });
        this.zoomImage.css({
            "top": -(this.imageHeight * this.topRatio) + "px",
            "left": -(this.imageWidth * this.leftRatio) + "px"
        });
    }
});

$.fn.imageWatcher = function(option) {
    if(this.length == 0) {
        return;
    }
    return ui.ctrls.ImageWatcher(option, this);
};
