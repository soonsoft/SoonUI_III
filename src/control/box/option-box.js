// OptionBox
var contentTop = 40,
    buttonTop = 0,
    operatePanelHeight = 0;
ui.define("ui.ctrls.OptionBox", ui.ctrls.SidebarBase, {
    _defineOption: function() {
        return {
            title: "",
            buttons: null
        };
    },
    _create: function() {
        this._super();
        this.contentPanel = null;
        this.contentHeight = 0;
        this.contentTop = 40;
        this.buttonTop = 0;
        this.operatePanelHeight = 0;
        this.buttons = [];

        this.opacityOption = {
            target: this.panel,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val, elem) {
                elem.css("opacity", val / 100);
            }
        };
    },
    _render: function() {
        this._super();

        this._panel.addClass("ui-option-box-panel");
        this.titlePanel = $("<section class='ui-option-box-title' />");
        this.contentPanel = $("<section class='ui-option-box-content' />");

        this.contentPanel.append(this.element);
        this.contentHeight = this.element.height();

        this._panel
            .append(this.titlePanel)
            .append(this.contentPanel);
        this._initOperateButtons();
        this.setTitle(this.option.title);
    },
    _initOperateButtons: function() {
        var i, len;
        if(!Array.isArray(this.option.buttons)) {
            if(ui.core.isString(this.option.buttons)) {
                this.option.buttons = [this.option.buttons];
            } else {
                this.option.buttons = [];
            }
        }
        for(i = 0, len = this.option.buttons.length; i < len; i++) {
            this.addButton(this.option.buttons[i]);
        }
    },
    addButton: function(button) {
        var buttonContainer;
        button = ui.getJQueryElement(button);
        if(!button) {
            return;
        }
        this.buttons.push(button);
        if(!this.operatePanel) {
            this.operatePanel = $("<section class='ui-option-box-buttons' />");
            buttonContainer = $("<div class='ui-form' />");
            this.operatePanel.append(buttonContainer);
            this._panel.append(this.operatePanel);
            this.buttonTop = 24;
            this.operatePanelHeight = 24;
        } else {
            buttonContainer = this.operatePanel.children(".ui-form");
        }
        buttonContainer.append(button);
        return this;
    },
    setTitle: function(title) {
        this.titlePanel.empty();
        if(title) {
            if(ui.core.isString(title)) {
                title = "<span class='option-box-title-text font-highlight'>" + title + "<span>";
            }
            this.titlePanel.append(title);
        }
    },
    setWidth: function(width) {
        var contentMaxheight;

        this._super(width);
        // 调整内容的对齐方式
        contentMaxheight = this.height - this.contentTop - this.buttonTop - this.operatePanelHeight - this.buttonTop;
        this.contentPanel.css({
            "max-height": contentMaxheight + "px"
        });
        if (this.operatePanel) {
            if (contentMaxheight < this.contentHeight) {
                this.operatePanel.css("width", this.width - ui.scrollbarWidth + "px");
            } else {
                this.operatePanel.css("width", "100%");
            }
        }
    },
    show: function() {
        this.showTimeValue = 240;
        this.opacityOption.begin = 0;
        this.opacityOption.end = 100;
        this._super(this.opacityOption);
    },
    hide: function() {
        this.hideTimeValue = 240;
        this.opacityOption.begin = 100;
        this.opacityOption.end = 0;
        this._super(this.opacityOption);
    }
});
