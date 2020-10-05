// toolbar
function Toolbar(option) {
    if(this instanceof Toolbar) {
        this.initialize(option);
    } else {
        return new Toolbar(option);
    }
}
Toolbar.prototype = {
    constructor: Toolbar,
    initialize: function(option) {
        if(!option) {
            option = {};
        }
        this.toolbarPanel = ui.getJQueryElement(option.toolbarId);
        if(!this.toolbarPanel) {
            return;
        }
        this.height = this.toolbarPanel.height();
        this.tools = this.toolbarPanel.children(".tools");
        this.extendPanel = this.toolbarPanel.children(".toolbar-extend");
        if(this.extendPanel.length > 0) {
            this.defaultExtendShow = !!option.defaultExtendShow;
            this._initExtendPanel();
        }
        var i = 0,
            len = this.tools.length,
            buttons;
        for(; i < len; i++) {
            buttons = $(this.tools[i]).children(".action-buttons");
            if(buttons.length > 0) {
                buttons.children(".tool-action-button").addClass("font-highlight-hover");
            }
        }
    },
    _initExtendPanel: function() {
        this.extendHeight = parseFloat(this.extendPanel.css("height"));
        this._wrapExtendPanel();
        this._createExtendAnimator();
        this._initExtendButton();
        this._initPinButton();
        if(this.defaultExtendShow) {
            this.showExtend(false);
            this.pinExtend();
        }
    },
    _wrapExtendPanel: function() {
        var position = this.toolbarPanel.css("position");
        if (position !== "absolute" && position !== "relative" && position !== "fixed") {
            this.toolbarPanel.css("position", "relative");
        }
        this.extendWrapPanel = $("<div style='position:absolute;height:0px;width:100%;display:none;overflow:hidden;'/>");
        this.extendWrapPanel.css("top", this.height + "px");
        this.extendPanel.css("top", (-this.extendHeight) + "px");
        this.extendPanel.addClass("clear");
        this.extendWrapPanel.append(this.extendPanel);
        this.toolbarPanel.append(this.extendWrapPanel);
    },
    _createExtendAnimator: function() {
        this.extendAnimator = ui.animator({
            target: this.extendPanel,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("top", val + "px");
            }
        }).add({
            target: this.extendWrapPanel,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("height", val + "px");
            }
        });
        this.extendAnimator.duration = 300;
    },
    _initExtendButton: function() {
        this.extendButton = this.toolbarPanel.find(".tool-extend-button");
        var moreTool,
            moreActions;
        if(this.extendButton.length === 0) {
            moreTool = $("<ul class='tools' style='float:right;margin-left:0px;'></ul>");
            moreActions = $("<li class='tool-item action-buttons'></li>");
            moreTool.append(moreActions);
            if(this.tools.length === 0) {
                this.extendPanel.parent().before(moreTool);
            } else {
                $(this.tools[0]).before(moreTool);
            }
            this.tools = this.toolbarPanel.children(".tools");
            this.extendButton = $("<a class='tool-action-button tool-extend-button' href='javascript:void(0)' title='更多'><i class='fa fa-ellipsis-h'></i></a>");
            moreActions.append(this.extendButton);
        }
        
        var that = this;
        this.extendButton.on("click", function(e) {
            if(that.isExtendShow()) {
                that.hideExtend();
            } else {
                that.showExtend();
            }
        });
    },
    _initPinButton: function() {
        this.pinButton = $("<a class='tool-extend-pin-button font-highlight-hover' href='javascript:void(0)' title='固定扩展区域'><i class='fa fa-thumb-tack'></i></a>");
        this.extendWrapPanel.append(this.pinButton);
        var that = this;
        this.pinButton.on("click", function(e) {
            if(that.isExtendPin()) {
                that.unpinExtend();
            } else {
                that.pinExtend();
            }
        });
    },
    isExtendShow: function() {
        return this.extendButton.hasClass("extend-show");
    },
    showExtend: function(animation) {
        var option;
        if(this.extendAnimator.isStarted) {
            return;
        }
        this.extendButton
            .addClass("extend-show")
            .removeClass("font-highlight-hover")
            .addClass("background-highlight");
        this._cssOverflow = this.toolbarPanel.css("overflow");
        this.toolbarPanel.css("overflow", "visible");

        if(animation === false) {
            this.extendWrapPanel.css({
                "height": this.extendHeight + "px",
                "display": "block"
            });
            this.extendPanel.css("top", "0px");
        } else {
            option = this.extendAnimator[0];
            option.begin = -this.extendHeight;
            option.end = 0;
            
            option = this.extendAnimator[1];
            option.begin = 0;
            option.end = this.extendHeight;

            option.target.css({
                "height": "0px",
                "display": "block"
            });
            this.extendAnimator.start();
        }
    },
    hideExtend: function(animation) {
        var option, that;
        if(this.extendAnimator.isStarted) {
            return;
        }
        this.extendButton
            .removeClass("extend-show")
            .addClass("font-highlight-hover")
            .removeClass("background-highlight");

        if(animation === false) {
            this.extendWrapPanel.css({
                "height": "0px",
                "display": "none"
            });
            this.extendPanel.css("top", -this.extendHeight + "px");
            this.toolbarPanel.css("overflow", this._cssOverflow);
        } else {
            that = this;

            option = this.extendAnimator[0];
            option.begin = 0;
            option.end = -this.extendHeight;
            
            option = this.extendAnimator[1];
            option.begin = this.extendHeight;
            option.end = 0;
            
            this.extendAnimator.start().then(function() {
                that.toolbarPanel.css("overflow", that._cssOverflow);
                option.target.css("display", "none");
            });
        }
    },
    _fireResize: function() {
        ui.page.fire("resize");
    },
    isExtendPin: function() {
        return this.pinButton.hasClass("extend-pin");  
    },
    pinExtend: function() {
        this.pinButton.addClass("extend-pin");
        this.pinButton.children("i")
            .removeClass("fa-thumb-tack")
            .addClass("fa-angle-up");
        this.extendButton.css("display", "none");
        
        this.height = this.height + this.extendHeight;
        this.toolbarPanel.css("height", this.height + "px");
        this._fireResize();
    },
    unpinExtend: function() {
        this.pinButton.removeClass("extend-pin");
        this.pinButton.children("i")
            .removeClass("fa-angle-up")
            .addClass("fa-thumb-tack");
        this.extendButton.css("display", "inline-block");
            
        this.height = this.height - this.extendHeight;
        this.toolbarPanel.css("height", this.height + "px");
        this._fireResize();
        this.hideExtend();
    }
};

ui.Toolbar = Toolbar;
