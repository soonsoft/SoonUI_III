function getLargeImageSrc(img) {
    var src = img.attr("data-large-src");
    if(!src) {
        src = img.prop("src");
    }
    return src;
}

function loadImageSize(src) {
    var promise = new Promise(function(resolve, reject) {
        var reimg = new Image(),
            size = {
                src: src,
                width: -1,
                height: -1
            };

        reimg.onload = function () {
            reimg.onload = null;
            size.width = reimg.width;
            size.height = reimg.height;
            resolve(size);
        };
        reimg.onerror = function () {
            reject(size);
        };
        reimg.src = src;
    });
    return promise;
}

//图片放大器
ui.define("ui.ctrls.ImageZoomer", {
    _defineOption: function () {
        return {
            parentContent: $(document.body),
            getNext: null,
            getPrev: null,
            hasNext: null,
            hasPrev: null,
            getLargeImageSrc: null
        };
    },
    _defineEvents: function () {
        return ["hided"];
    },
    _create: function () {
        var that;

        this.parentContent = this.option.parentContent;
        this.closeButton = null;
        this.mask = null;
        this.width = null;
        this.height = null;

        this.target = null;
        this.targetTop = null;
        this.targetLeft = null;

        if($.isFunction(this.option.getLargeImageSrc)) {
            this._getLargeImageSrc = this.option.getLargeImageSrc;
        } else {
            this._getLargeImageSrc = getLargeImageSrc;
        }

        that = this;
        ["getNext", "getPrev", "hasNext", "hasPrev"].forEach(function(key) {
            var fn = that.option[key];
            if(ui.core.isFunction(fn)) {
                that.option[key] = fn.bind(that);
            } else {
                that.option[key] = null;
            }
        });
    },
    _render: function () {
        var that = this;
        
        this.imagePanel = $("<div class='show-image-panel' />");
        this.currentView = $("<div class='image-view-panel' style='display:none;' />");
        this.nextView = $("<div class='image-view-panel' style='display:none;' />");
        this.currentView.append("<img class='image-view-img' />");
        this.nextView.append("<img class='image-view-img' />");
        this.closeButton = $("<a class='close-button font-highlight-hover' href='javascript:void(0)'>×</a>");
        
        this.closeButton.click(function () {
            that.hide();
        });
        
        this.imagePanel
            .append(this.currentView)
            .append(this.nextView)
            .append(this.closeButton);
        if(this.option.getNext) {
            this.nextButton = $("<a class='next-button font-highlight-hover disabled-button' style='right:10px;' href='javascript:void(0)'><i class='fa fa-angle-right'></i></a>");
            this.nextButton.click(function(e) {
                that._doNextView();
            });
            this.imagePanel.append(this.nextButton);
        }
        if(this.option.getPrev) {
            this.prevButton = $("<a class='prev-button font-highlight-hover disabled-button' style='left:10px;' href='javascript:void(0)'><i class='fa fa-angle-left'></i></a>");
            this.prevButton.click(function(e) {
                that._doPrevView();
            });
            this.imagePanel.append(this.prevButton);
        }
        $(document.body).append(this.imagePanel);
        
        ui.page.resize(function(e) {
            that.resizeZoomImage();
        }, ui.eventPriority.ctrlResize);
        
        if(this.prevButton || this.nextButton) {
            this.changeViewAnimator = ui.animator({
                ease: ui.AnimationStyle.easeFromTo,
                onChange: function(val) {
                    this.target.css("left", val + "px");
                }
            }).addTarget({
                ease: ui.AnimationStyle.easeFromTo,
                onChange: function(val) {
                    this.target.css("left", val + "px");
                }
            });
        }
    },
    _showOptionButtons: function() {
        if(this.prevButton) {
            this.prevButton.removeClass("disabled-button");
        }
        if(this.nextButton) {
            this.nextButton.removeClass("disabled-button");
        }
    },
    _hideOptionButtons: function() {
        if(this.prevButton) {
            this.prevButton.addClass("disabled-button");
        }
        if(this.nextButton) {
            this.nextButton.addClass("disabled-button");
        }
    },
    _updateButtonState: function() {
        if(this.option.hasNext) {
            if(this.option.hasNext()) {
                this.nextButton.removeClass("disabled-button");
            } else {
                this.nextButton.addClass("disabled-button");
            }
        }
        if(this.option.hasPrev) {
            if(this.option.hasPrev()) {
                this.prevButton.removeClass("disabled-button");
            } else {
                this.prevButton.addClass("disabled-button");
            }
        }
    },
    show: function (target) {
        var img,
            that,
            left, top;

        this.target = target;
        var content = this._setImageSize();
        if (!content) {
            return;
        }
        
        img = this.currentView.children("img");
        img.prop("src", this.target.prop("src"));
        img.css({
            "width": this.target.width() + "px",
            "height": this.target.height() + "px",
            "left": this.targetLeft + "px",
            "top": this.targetTop + "px"
        });
        this.imagePanel.css({
            "display": "block",
            "width": content.parentW + "px",
            "height": content.parentH + "px",
            "left": content.parentLoc.left + "px",
            "top": content.parentLoc.top + "px"
        });
        this.currentView.css("display", "block");
        left = (content.parentW - this.width) / 2;
        top = (content.parentH - this.height) / 2;
        
        that = this;
        ui.mask.open({
            opacity: 0.8
        });
        img.animate({
            "left": left + "px",
            "top": top + "px",
            "width": this.width + "px",
            "height": this.height + "px"
        }, 240, function() {
            that._updateButtonState();
        });
    },
    hide: function () {
        var that = this,
            img = this.currentView.children("img");
        ui.mask.close();
        img.animate({
            "top": this.targetTop + "px",
            "left": this.targetLeft + "px",
            "width": this.target.width() + "px",
            "height": this.target.height() + "px"
        }, 240, function() {
            that._hideOptionButtons();
            that.imagePanel.css("display", "none");
            that.currentView.css("display", "none");
            that.fire("hided", that.target);
        });
    },
    _doNextView: function() {
        var nextImg;
        if(this.changeViewAnimator.isStarted) {
            return;
        }
        nextImg = this.option.getNext();
        if(!nextImg) {
            return;
        }
        this._doChangeView(nextImg, function() {
            this.target = nextImg;
            this._updateButtonState();
            this._changeView(-this.parentContent.width());
        });
    },
    _doPrevView: function() {
        var prevImg;
        if(this.changeViewAnimator.isStarted) {
            return;
        }
        prevImg = this.option.getPrev();
        if(!prevImg) {
            return;
        }
        this._doChangeView(prevImg, function() {
            this.target = prevImg;
            this._updateButtonState();
            this._changeView(this.parentContent.width());
        });
    },
    _doChangeView: function(changeImg, action) {
        var largeSize = changeImg.data("LargeSize"),
            that = this;
        if(largeSize) {
            action.call(this);
        } else {
            loadImageSize(this._getLargeImageSrc(changeImg))
                .then(
                    //success
                    function(size) {
                        changeImg.data("LargeSize", size);
                        action.call(that);
                    },
                    //failed
                    function (size) {
                        action.call(that);
                    }
                );
        }
    },
    _changeView: function(changeValue) {
        var temp,
            largeSrc,
            content,
            img,
            option,
            that;

        temp = this.currentView;
        this.currentView = this.nextView;
        this.nextView = temp;
        
        largeSrc = this._getLargeImageSrc(this.target);
        content = this._setImageSize();
        if (!content) {
            return;
        }
        img = this.currentView.children("img");
        img.prop("src", largeSrc);
        img.css({
            "left": (content.parentW - this.width) / 2 + "px",
            "top": (content.parentH - this.height) / 2 + "px",
            "width": this.width + "px",
            "height": this.height + "px"
        });
        this.currentView.css("display", "block");
        this.currentView.css("left", (-changeValue) + "px");
        
        option = this.changeViewAnimator[0];
        option.target = this.nextView;
        option.begin = 0;
        option.end = changeValue;
        
        option = this.changeViewAnimator[1];
        option.target = this.currentView;
        option.begin = -changeValue;
        option.end = 0;
        
        that = this;
        this.changeViewAnimator.start().then(function() {
            that.nextView.css("display", "none");
        });
        
    },
    resizeZoomImage: function () {
        var content,
            left,
            top,
            img;

        content = this._setImageSize();
        if (!content) {
            return;
        }
        left = (content.parentW - this.width) / 2;
        top = (content.parentH - this.height) / 2;
        
        this.imagePanel.css({
            "width": content.parentW + "px",
            "height": content.parentH + "px",
        });

        img = this.currentView.children("img");
        img.css({
            "left": left + "px",
            "top": top + "px",
            "width": this.width + "px",
            "height": this.height + "px"
        });
    },
    _getActualSize: function (img) {
        var largeSize = img.data("LargeSize"),
            mem, w, h;
        if(!largeSize) {
            //保存原来的尺寸  
            mem = { w: img.width(), h: img.height() };
            //重写
            img.css({
                "width": "auto",
                "height": "auto"
            });
            //取得现在的尺寸 
            w = img.width();
            h = img.height();
            //还原
            img.css({
                "width": mem.w + "px",
                "height": mem.h + "px"
            });
            largeSize = { width: w, height: h };
        }
        
        return largeSize;
    },
    _setImageSize: function () {
        var img,
            size,
            parentW, parentH,
            imageW, imageH,
            location, parentLocation;

        if (!this.currentView) {
            return;
        }
        if (!this.target) {
            return;
        }
        
        img = this.currentView.children("img");
        img.stop();
        
        size = this._getActualSize(this.target);

        parentH = this.parentContent.height();
        parentW = this.parentContent.width();
        imageW = size.width;
        imageH = size.height;
        if (imageW / parentW < imageH / parentH) {
            if(imageH >= parentH) {
                this.height = parentH;
            } else {
                this.height = imageH;
            }
            this.width = Math.floor(imageW * (this.height / imageH));
        } else {
            if(imageW >= parentW) {
                this.width = parentW;
            } else {
                this.width = imageH;
            }
            this.height = Math.floor(imageH * (this.width / imageW));
        }
        location = this.target.offset();
        parentLocation = this.parentContent.offset();
        this.targetTop = location.top - parentLocation.top;
        this.targetLeft = location.left - parentLocation.left;

        return {
            parentW: parentW,
            parentH: parentH,
            parentLoc: parentLocation
        };
    }
});

$.fn.addImageZoomer = function (image) {
    if (this.length === 0) {
        return;
    }
    if (image instanceof ui.ctrls.ImageZoomer) {
        this.click(function(e) {
            var target = $(e.target);
            var largeSize = target.data("LargeSize");
            if(largeSize) {
                image.show(target);
            } else {
                loadImageSize(image._getLargeImageSrc(target))
                    .then(
                        //success
                        function(size) {
                            target.data("LargeSize", size);
                            image.show(target);
                        },
                        //failed
                        function(size) {
                            image.show(target);
                        }
                    );
            }
        });
    }
};
