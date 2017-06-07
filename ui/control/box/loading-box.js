// 加载提示框
var loadingBox,
    loadingClass = "c_dotsPlaying";
function LoadingBox(option) {
    if(this instanceof LoadingBox) {
        this.initialize(option);
    } else {
        return new LoadingBox(option);
    }
}
LoadingBox.prototype = {
    constructor: LoadingBox,
    initialize: function(option) {
        if(!option) {
            option = {};
        }
        this.delay = option.delay;
        if(ui.core.type(this.delay) !== "number" || this.delay < 0) {
            this.delay = 1000;
        }
        this.timeoutHandle = null;
        this.isOpening = false;
        this.box = null;
        this.openCount = 0;
    },
    getBox: function() {
        if(!this.box) {
            this.box = $("#loadingElement");
        }
        return this.box;
    },
    isShow: function() {
        return this.getBox().css("display") === "block";
    },
    show: function() {
        var that;
        if(this.isOpening || this.isShow()) {
            this.openCount++;
            return;
        }
        this.isOpening = true;
        that = this;
        this.timeoutHandle = setTimeout(function() {
            that.timeoutHandle = null;
            that._doShow();
        }, this.delay);
    },
    _doShow: function() {
        this.getBox();
        this.box
            .addClass(loadingClass)
            .css("display", "block");
    },
    hide: function() {
        if(this.openCount > 0) {
            this.openCount--;
            return;
        }
        this.isOpening = false;
        if(this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            return;
        }
        this.getBox();
        this.box
            .removeClass(loadingClass)
            .css("display", "none");
    }
};
loadingBox = LoadingBox();
ui.loadingShow = function() {
    loadingBox.show();
};
ui.loadingHide = function() {
    loadingBox.hide();
};
