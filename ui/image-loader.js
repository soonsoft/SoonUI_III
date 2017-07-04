// image loader

function ImageLoader() {
    if(this instanceof ImageLoader) {
        this.initialize();
    } else {
        return new ImageLoader();
    }
}
ImageLoader.fitCenter = function() {
    this.displayWidth = this.originalWidth;
    this.displayHeight = this.originalHeight;
    this.marginTop = 0;
    this.marginLeft = 0;
    // 显示区域是横着的
    if (this.width > this.height) {
        if(this.originalHeight > this.height) {
            this.displayHeight = this.height;
        }
        this.displayWidth = Math.floor(this.originalWidth * (this.displayHeight / this.originalHeight));
        if (this.displayWidth > this.width) {
            this.displayWidth = this.width;
            this.displayHeight = Math.floor(this.originalHeight * (this.displayWidth / this.originalWidth));
            this.marginTop = Math.floor((this.height - this.displayHeight) / 2);
        } else {
            // 图片比显示区域小，显示到中心
            this.marginLeft = Math.floor((this.width - this.displayWidth) / 2);
            this.marginTop = Math.floor((this.height - this.displayHeight) / 2);
        }
    } else {
        // 显示区域是竖着的
        if(this.displayWidth > this.width) {
            this.displayWidth = this.width;
        }
        this.displayHeight = Math.floor(this.originalHeight * (this.displayWidth / this.originalWidth));
        if (this.displayHeight > this.height) {
            this.displayHeight = this.height;
            this.displayWidth = Math.floor(this.originalWidth * (this.displayHeight / this.originalHeight));
            this.marginLeft = Math.floor((this.width - this.displayWidth) / 2);
        } else {
            // 图片比显示区域小，显示到中心
            this.marginLeft = Math.floor((this.width - this.displayWidth) / 2);
            this.marginTop = Math.floor((this.height - this.displayHeight) / 2);
        }
    }
};
ImageLoader.centerCrop = function() {
    this.displayWidth = this.originalWidth;
    this.displayHeight = this.originalHeight;
    this.marginTop = 0;
    this.marginLeft = 0;
    // 显示区域是横着的
    if (this.width > this.height) {
        this.displayHeight = this.height;
        this.displayWidth = Math.floor(this.originalWidth * (this.displayHeight / this.originalHeight));
        if(this.displayWidth > this.width) {
            this.marginLeft = -(Math.floor((this.displayWidth - this.width) / 2));
        } else if(this.displayWidth < this.width) {
            this.displayWidth = this.width;
            this.displayHeight = Math.floor(this.originalHeight * (this.displayWidth / this.originalWidth));
            this.marginTop = -(Math.floor((this.displayHeight - this.height) / 2));
        }
    } else {
        //显示区域是竖着的
        this.displayWidth = this.width;
        this.displayHeight = Math.floor(this.originalHeight * (this.displayWidth / this.originalWidth));
        if(this.displayHeight > this.height) {
            this.marginTop = -(Math.floor((this.displayHeight - this.height) / 2));
        } else if(this.displayHeight < this.height) {
            this.displayHeight = this.height;
            this.displayWidth = Math.floor(this.originalWidth * (this.displayHeight / this.originalHeight));
            this.marginLeft = -(Math.floor((this.displayWidth - this.width) / 2));
        }
    }
};
ImageLoader.prototype = {
    constructor: ImageLoader,
    initialize: function() {
        //图片路径
        this.src = null;
        //图片显示区域宽
        this.width = 0;
        //图片显示区域高
        this.height = 0;
        //图片显示宽
        this.displayWidth = 0;
        //图片显示高
        this.displayHeight = 0;
        //图片原始宽
        this.originalWidth = 0;
        //图片原始高
        this.originalHeight = 0;
    },
    load: function(src, width, height, fillMode) {
        if (!ui.core.isString(src) || src.length === 0) {
            throw new TypeError("图片src不正确");
        }
        this.src = src;
        this.width = width;
        this.height = height;
        var that = this;
        if(!ui.core.isFunction(fillMode)) {
            fillMode = ImageLoader.fitCenter;
        }
        var promise = new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function () {
                img.onload = null;
                that.originalWidth = img.width;
                that.originalHeight = img.height;
                fillMode.call(that);
                resolve(that);
            };
            img.onerror = function () {
                reject(img);
            };
            img.src = src;
        });
        return promise;
    }
};

ui.ImageLoader = ImageLoader;
