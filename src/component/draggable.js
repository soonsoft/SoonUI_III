
var doc = $(document),
    body = $(document.body),
    defaultOption = {
        // 上下文
        context: null,
        // 拖动的目标
        target: null,
        // 把手，拖拽事件附加的元素
        handle: null,
        // 范围元素，默认是$(body)
        parent: body,
        // 是否需要做Iframe屏蔽
        hasIframe: false,
        // 开始拖拽处理函数
        onBeginDrag: null,
        // 移动处理函数 
        onMoving: null,
        // 结束拖拽处理函数
        onEndDrag: null
    };

// 鼠标按下处理事件
function mouseDown(e) {
    var eventArg,
        result;
    if (e.which !== 1) return;

    eventArg = {
        target: e.target,
        option: this.option
    };
    eventArg.currentX = this.currentX = e.pageX;
    eventArg.currentY = this.currentY = e.pageY;

    if(ui.core.isFunction(this.option.onBeginDrag)) {
        result = this.option.onBeginDrag.call(this, eventArg);
        if(result === false) {
            return;
        }
    }
    doc.on("mousemove", this.onMouseMoveHandler)
        .on("mouseup", this.onMouseUpHandler)
        .on("mouseleave", this.onMouseUpHandler);
    document.onselectstart = function() { return false; };
    /*
        .cancel-user-select {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;    
        }    
    */
    this.option.target.addClass("cancel-user-select");
    this._isDragStart = true;

    if(this.shield) {
        body.append(this.shield);
    }
}
// 鼠标移动事件
function mouseMove(e) {
    var eventArg = {
        target: e.target,
        option: this.option
    };
    if(!this._isDragStart) return;
    
    eventArg.x = e.clientX - this.currentX;
    eventArg.y = e.clientY - this.currentY;
    eventArg.currentX = this.currentX = e.clientX;
    eventArg.currentY = this.currentY = e.clientY;

    if(ui.core.isFunction(this.option.onMoving)) {
        this.option.onMoving.call(this, eventArg);
    }
}
// 鼠标抬起
function mouseUp(e) {
    var eventArg = {
        target: e.target,
        option: this.option
    };
    if (e.which !== 1) return;
    if(!this._isDragStart) return;

    this._isDragStart = false;
    this.currentX = this.currentY = null;

    doc.off("mousemove", this.onMouseMoveHandler)
        .off("mouseup", this.onMouseUpHandler)
        .off("mouseleave", this.onMouseUpHandler);
    document.onselectstart = null;
    this.option.target.removeClass("cancel-user-select");

    if(ui.core.isFunction(this.option.onEndDrag)) {
        this.option.onEndDrag.call(this, eventArg);
    }

    if(this.shield) {
        this.shield.remove();
    }
}

function MouseDragger(option) {
    if(this instanceof MouseDragger) {
        this.initialize(option);
    } else {
        return new MouseDragger(option);
    }
}
MouseDragger.prototype = {
    constructor: MouseDragger,
    initialize: function(option) {
        this.doc = null;
        this.shield = null;
        this.isTurnOn = false;

        this.option = $.extend({}, defaultOption, option);
        this.doc = this.option.doc;
        if(this.option.hasIframe === true) {
            this.shield = $("<div class='drag-shield'>");
            this.shield.css({
                "position": "fixed",
                "top": "0px",
                "left": "0px",
                "width": "100%",
                "height": "100%",
                "z-index": "999999",
                "background-color": "#fff",
                "opacity": ".01"    
            });
        }

        this.onMouseDownHandler = mouseDown.bind(this);
        this.onMouseMoveHandler = mouseMove.bind(this);
        this.onMouseUpHandler = mouseUp.bind(this);
    },
    on: function() {
        var target = this.option.target,
            handle = this.option.handle,
            parent = this.option.parent,
            position;
        
        if(this.isTurnOn) {
            return;
        }

        this.isTurnOn = true;
        if(!parent.isNodeName("body")) {
            position = parent.css("position");
            this.originParentPosition = position;
            if (position !== "absolute" && position !== "relative" && position !== "fixed") {
                parent.css("position", "relative");
            }
        }
        this.originTargetPosition = target.css("position");
        if (this.originTargetPosition !== "absolute") {
            target.css("position", "absolute");
        }

        handle.on("mousedown", this.onMouseDownHandler);
        if(this.option.target)
            this.option.target.data("mouse-dragger", this);
    },
    off: function() {
        var handle = this.option.handle;
        if(!this.isTurnOn) {
            return;
        }

        this.isTurnOn = false;
        handle
            .off("mousedown", this.onMouseDownHandler)
            .css("position", this.originTargetPosition);
        if(this._isDragStart) {
            this.onMouseUpHandler({
                target: document,
                which: 1
            });
        }
        this.option.parent.css("position", this.originParentPosition);
    }
};

ui.MouseDragger = MouseDragger;

/** 拖动效果 */
$.fn.draggable = function(option) {
    var dragger,
        oldBeginDrag,
        oldMoving;
    if (!option || !option.target || !option.parent) {
        return;
    }
    if (!ui.core.isDomObject(this[0]) || this.nodeName() === "BODY") {
        return;
    }

    option.handle = this;
    option.getParentCssNum = function(prop) {
        return parseFloat(option.parent.css(prop)) || 0;
    };
    if(ui.core.isFunction(option.onBeginDrag)) {
        oldBeginDrag = option.onBeginDrag;
    }
    option.onBeginDrag = function(arg) {
        var option = this.option,
            p = option.parent.offset(),
            targetRect,
            parentRect;
        if(!p) p = { top: 0, left: 0 };

        if(oldBeginDrag) {
            oldBeginDrag.call(null, arg);
        }

        parentRect = option.parent.getBoundingClientRect();
        targetRect = option.target.getBoundingClientRect();

        option.topLimit = p.top + option.getParentCssNum("border-top") + option.getParentCssNum("padding-top");
        option.leftLimit = p.left + option.getParentCssNum("border-left") + option.getParentCssNum("padding-left");
        option.rightLimit = p.left + parentRect.width;
        option.bottomLimit = p.top + parentRect.height;
        
        option.targetWidth = targetRect.width;
        option.targetHeight = targetRect.height;

        option.parentTop = p.top;
        option.parentLeft = p.left;
    };

    if(ui.core.isFunction(option.onMoving)) {
        oldMoving = option.onMoving;
    }
    option.onMoving = function(arg) {
        var option = this.option,
            p = option.target.position();

        if(oldMoving) {
            oldMoving.call(null, arg);
        }

        p.top = p.top + option.parentTop;
        p.left = p.left + option.parentLeft;

        p.top += arg.y;
        p.left += arg.x;

        if (p.top < option.topLimit) {
            p.top = option.topLimit;
        } else if (p.top + option.targetHeight > option.bottomLimit) {
            p.top = option.bottomLimit - option.targetHeight;
        }
        if (p.left < option.leftLimit) {
            p.left = option.leftLimit;
        } else if (p.left + option.targetWidth > option.rightLimit) {
            p.left = option.rightLimit - option.targetWidth;
        }

        p.top = p.top - option.parentTop;
        p.left = p.left - option.parentLeft;

        option.target.css({
            "top": p.top + "px",
            "left": p.left + "px"
        });
    };

    dragger = ui.MouseDragger(option);
    dragger.on();

    return this;
};
$.fn.undraggable = function() {
    var dragger;
    if(this.length === 0)
        return;
    dragger = this.data("mouse-dragger");
    if(dragger && dragger instanceof MouseDragger) {
        dragger.off();
    }
};
