// tag

var size = {
        mini: 16,
        small: 20,
        normal: 24,
        big: 28
    },
    colorMap = {
        green: "#00AE6E",
        red: "#DE2B18",
        yellow: "#CCA700",
        purple: "#6064C5",
        blue: "#026AD8"
    },
    tagStyle = null,
    initEvent;

function initColor() {
    tagStyle = ui.StyleSheet.createStyleSheet("uiTagStyle");
    Object.keys(colorMap).forEach(function(key) {
        var color = colorMap[key];
        createColor(key, color);
    });
}

function createColor(name, color) {
    var baseColor = ui.theme.backgroundColor || "#FFFFFF",
        bgColor;
    bgColor = ui.color.overlay(baseColor, color, .2);
    bgColor = ui.color.rgb2hex(bgColor.red, bgColor.green, bgColor.blue);
    tagStyle.setRule(ui.str.format(".ui-tag-{0}", name), {
        "background-color": bgColor,
        "border-color": color,
        "color": color
    });
    tagStyle.setRule(ui.str.format(".ui-tag-{0} .ui-tag-close:hover", name), {
        "background-color": color,
        "color": bgColor
    });
}

initEvent = function() {
    console.log("initEvent");
    ui.on("click", ".ui-tag", function(e) {
        var elem = $(e.target),
            fullName = "ui.ctrls.Tag";
        if(elem.hasClass("ui-tag-close")) {
            elem.parent().data(fullName).remove();
        } else {
            while(!elem.hasClass("ui-tag")) {
                if(elem.nodeName() === "BODY") {
                    return;
                }
                elem = elem.parent();
            }
            // click
            elem.data(fullName).fire("click");
        }
    });
    initEvent = function() {};
};

ui.ctrls.define("ui.ctrls.Tag", {
    _defineOption: function() {
        return {
            // tag颜色 type: string (green: 绿色, red: 红色, yellow: 黄色, purple: 紫色, theme: 主题色, highlight: 高亮色) type: plainObject { "background-color": "", "border-color": "", "color": "" }
            color: "highlight",
            // 尺寸 big, normal, small, mini 
            size: "normal",
            // 是否有关闭按钮
            closable: false,
            // 不显示边框
            noBorder: false,
            // 文本
            text: "Tag",
            // 是否需要右间距
            marginRight: false
        };
    },
    _defineEvents: function() {
        return ["click", "close"];
    },
    _create: function() {
        if(ui.core.isNumber(this.option.size)) {
            this.height = this.option.size;
        } else {
            this.height = size[this.option.size || "normal"] || size.normal;
        }
        this.contentMargin = this.height / 2;
        if(this.option.noBorder) {
            this.borderWidth = 0;
        } else {
            this.borderWidth = 1;
        }

        this.defineProperty("text", this.getText, this.setText);

        if(!tagStyle) {
            initColor();
        }

        initEvent();
    },
    _render: function() {
        var lineHeight = this.height - this.borderWidth * 2;
        this.label = $("<label class='ui-tag' />");
        this.label.css({
            "height": this.height + "px",
            "line-height": lineHeight + "px",
            "border-radius": this.height / 2 + "px"
        });
        if(this.option.marginRight) {
            this.label.css("margin-right", this.contentMargin + "px");
        }
        if(ui.core.isString(this.option.color)) {
            this.label.addClass(ui.str.format("ui-tag-{0}", this.option.color));
        } else {
            this.label.addClass("ui-tag-highlight");
        }

        this.label.append(this._createContent());
        if(this.option.closable) {
            this.label.append(this._createCloseButton());
        }

        if(this.option.noBorder) {
            this.label.addClass("ui-tag-noborder");
        }

        this.label.data(this.fullName, this);

        if(this.element) {
            this.element.append(this.label);
        }
    },
    _createContent: function() {
        var content = $("<span />");
        content.css("margin-left", this.contentMargin + "px");
        if(!this.option.closable) {
            content.css("margin-right", this.contentMargin + "px");
        }
        this.content = content;
        this.setText(this.option.text);
        return content;
    },
    _createCloseButton: function() {
        var button, 
            contentHeight,
            width, height,
            top, right;

        contentHeight = this.height - this.borderWidth * 2;
        width = height = contentHeight - 6;
        top = right = 3;
        if(height < 14) {
            width = height = 14;
            top = right = (contentHeight - height) / 2;
        }
        
        button = $("<i href='javascript:void(0)'>×</i>");
        button.addClass("ui-tag-close");
        if(this.height <= 20) {
            button.css("font-size", "14px");
        }
        button.css({
            "width": width + "px",
            "height": height + "px",
            "line-height": height - 2 + "px",
            "margin-top": top + "px",
            "margin-left": right + "px",
            "margin-right": right + "px"
        });
        this.closeButton = button;
        return button;
    },

    // API
    addTo: function(parent) {
        var parent = ui.getJQueryElement(parent);
        if(parent) {
            parent.append(this.label);
        }
    },
    remove: function() {
        this.fire("close");
        this.label.removeData(this.fullName);
        this.label.remove();
    },
    setText: function(text) {
        this.option.text = text || "Tag";
        if(ui.core.isFunction(text)) {
            this.content.append(text.call(null));
        } else {
            this.content.text(text);
        }
    },
    getText: function() {
        return this.option.text;
    }
});

ui.ctrls.Tag.addColor = function(name, color) {
    if(colorMap[name]) {
        throw new TypeError("the name " + name + " is exists.");
    }
    if(!ui.core.isString(color) || !color) {
        return;
    }

    colorMap[name] = color;
    createColor(name, color);
};
