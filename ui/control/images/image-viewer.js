//图片轮播视图
ui.define("ui.ctrls.ImageViewer", {
    _defineOption: function () {
        return {
            //是否显示切换
            hasSwitchButtom: false,
            //是否自动切换
            interval: 2000,
            //vertical | horizontal
            direction: "horizontal",
            //图片路径
            images: []
        };
    },
    _defineEvents: function () {
        return ["changed", "ready"];
    },
    _create: function () {
        if(!Array.isArray(this.option.images)) {
            this.option.images = [];
        }
        if(ui.core.isNumber(this.option.interval) || this.option.interval <= 0) {
            this.isAutoView = false;
        } else {
            this.isAutoView = true;
        }
        this.stopAutoView = false;
        this.currentIndex = -1;
        this.images = [];
        
        this.isHorizontal = this.option.direction === "horizontal";
        this.animationCssItem = this.isHorizontal ? "left" : "top";
    },
    _render: function () {
        var that = this;
        this.element.addClass("image-view-panel");
        this.currentView = null;
        this.nextView = null;

        this._initAnimator();
        this._loadImages(this.option.images);
        
        if(this.isAutoView) {
            this.element.mouseenter(function(e) {
                that.stopAutoView = true;
                if(that._autoViewHandler) {
                    clearTimeout(that._autoViewHandler);
                }
            });
            this.element.mouseleave(function(e) {
                that.stopAutoView = false;
                that._autoViewHandler = setTimeout(function() {
                    that.next();
                }, that.option.interval);
            });
        }
    },
    _initAnimator: function() {
        var that = this;
        this.viewAnimator = ui.animator({
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css(that.animationCssItem, val + "px");
            }
        }).addTarget({
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css(that.animationCssItem, val + "px");
            }
        });
        this.viewAnimator.onEnd = function() {
            that.currentView.css("display", "none");
            that.currentView = that.nextView;
            that.nextView = null;
            
            if(that.isAutoView && !that.stopAutoView) {
                that._autoViewHandler = setTimeout(function() {
                    that.next();
                }, that.option.interval);
            }
            that.fire("changed", that.currentIndex, that.images[that.currentIndex]);
        };
        this.viewAnimator.duration = 500;
    },
    setImages: function() {
        if(arguments.length === 0) {
            return;
        }
        this.empty();
        var images = [],
            i = 0,
            len = arguments.length,
            img = null;
        for(; i < len; i++) {
            img = arguments[i];
            if(Array.isArray(img)) {
                images = images.concat(img);
            } else if(ui.core.type(img) === "string") {
                images.push(img);
            }
        }
        this._loadImages(images);
    },
    _loadImages: function(images) {
        if(images.length === 0) {
            return;
        }
        
        if(this.option.hasSwitchButtom === true) {
            this.prevBtn = $("<a href='javascript:void(0)' class='image-switch-button switch-button-prev font-highlight-hover'><i class='fa fa-angle-left'></i></a>");
            this.nextBtn = $("<a href='javascript:void(0)' class='image-switch-button switch-button-next font-highlight-hover'><i class='fa fa-angle-right'></i></a>");
            this.prevBtn.click((function(e) {
                this.prev();
            }).bind(this));
            this.nextBtn.click((function(e) {
                this.next();
            }).bind(this));
            this.element
                .append(this.prevBtn)
                .append(this.nextBtn);
        }
        
        var promises = [],
            i = 0,
            that = this;
        for(; i < images.length; i++) {
            promises.push(this._loadImage(images[i]));
        }
        Promise.all(promises).done(function(result) {
            var i = 0,
                len = result.length,
                image;
            for(; i < len; i++) {
                image = result[i];
                if(image) {
                    image.view = $("<div class='image-view' />");
                    image.view.append("<img src='" + image.src + "' alt='' />");
                    that.element.append(image.view);
                    that.images.push(image);
                }
            }
            if(that.images.length > 0) {
                that.showImage(0);
            }
            
            that.fire("ready", that.images);
        });
    },
    _loadImage: function(src) {
        if(ui.core.type(src) !== "string" || src.length === 0) {
            return;
        }
        var promise = new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function () {
                img.onload = null;
                resolve({
                    src: src,
                    width: img.width,
                    height: img.height
                });
            };
            img.onerror = function () {
                resolve(null);
            };
            img.src = src;
        });
        return promise;
    },
    _startView: function(isNext) {
        this.viewAnimator.stop();

        var width = this.element.width(),
            height = this.element.height(),
            cssValue = this.isHorizontal ? width : height,
            option;
        
        option = this.viewAnimator[0];
        option.target = this.currentView;
        option.begin = parseFloat(option.target.css(this.animationCssItem));
        if(isNext) {
            option.end = -cssValue;
        } else {
            option.end = cssValue;
        }
        option = this.viewAnimator[1];
        option.target = this.nextView;
        option.begin = parseFloat(option.target.css(this.animationCssItem));
        option.end = 0;
        
        this.viewAnimator.start();
    },
    _setImage: function(index, view) {
        var image = this.images[index];
        var displayWidth = this.element.width(),
            displayHeight = this.element.height();
        var img = null,
            width, height;
        view = view || this.currentView;
        img = view.children("img");
        
        if (displayWidth > displayHeight) {
            height = displayHeight;
            width = Math.floor(image.width * (height / image.height));
            if (width > displayWidth) {
                width = displayWidth;
                height = Math.floor(image.height * (width / image.width));
                img.css("top", Math.floor((displayHeight - height) / 2) + "px");
            } else {
                img.css("left", Math.floor((displayWidth - width) / 2) + "px");
            }
        } else {
            width = displayWidth;
            height = Math.floor(image.height * (width / image.width));
            if (height > displayHeight) {
                height = displayHeight;
                width = Math.floor(image.width * (height / image.height));
                img.css("left", Math.floor((displayWidth - width) / 2) + "px");
            } else {
                img.css("top", Math.floor((displayHeight - height) / 2) + "px");
            }
        }
        img.css({
            "width": width + "px",
            "height": height + "px"
        });
    },
    showImage: function(index) {
        if(this.images.length === 0) {
            return;
        }
        if(this._autoViewHandler) {
            clearTimeout(this._autoViewHandler);
        }
        
        var width = this.element.width(),
            height = this.element.height(),
            that = this,
            css = {
                "display": "block"
            },
            cssValue = this.isHorizontal ? width : height,
            flag;
        this.element.css("overflow", "hidden");
        if(this.currentIndex < 0) {
            this.currentIndex = index;
            this.currentView = this.images[this.currentIndex].view;
            this._setImage(index);
            this.currentView.css("display", "block");
            if(this.isAutoView) {
                this._autoViewHandler = setTimeout(function() {
                    that.next();
                }, this.option.interval);
            }
            return;
        }
        
        if(this.nextView) {
            this.currentView
                .css("display", "none")
                .css(this.animationCssItem, -cssValue + "px");
            this.currentView = this.nextView;
            this.currentView.css(this.animationCssItem, "0px");
        }
        if(index > this.currentIndex) {
            if(index >= this.images.length) {
                index = 0;
            }
            css[this.animationCssItem] = cssValue + "px";
            flag = true;
        } else {
            if(index < 0) {
                index = this.images.length - 1;
            }
            css[this.animationCssItem] = -cssValue + "px";
            flag = false;
        }
        this.nextView = this.images[index].view;
        this.nextView.css(css);
        this._setImage(index, this.nextView);
        this.currentIndex = index;
        this._startView(flag);
    },
    prev: function() {
        if(this.currentIndex >= 0) {
            this.showImage(this.currentIndex - 1);
        } else {
            this.showImage(0);
        }
    },
    next: function() {
        if(this.currentIndex >= 0) {
            this.showImage(this.currentIndex + 1);
        } else {
            this.showImage(0);
        }
    },
    empty: function() {
        this.images = [];
        this.currentIndex = -1;
        this.viewAnimator.stop();
        clearTimeout(this._autoViewHandler);
        
        this.element.empty();
        this.prevBtn = null;
        this.nextBtn = null;
        this.currentView = null;
        this.nextView = null;
    }
});

$.fn.imageViewer = function(option) {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.ImageViewer(option, this);
};
