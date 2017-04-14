//列表

// 默认的格式化器
function defaultItemFormatter(item, index) {
    return "<span class='ui-list-view-item-text'>" + item + "</span>";
}

// 点击事件处理函数
function onListItemClick(e) {
    var elem,
        isCloseButton,
        index,
        data;

    elem = $(e.target);
    isCloseButton = elem.hasClass("close-button");
    while(!elem.isNodeName("li")) {
        if(elem.hasClass("ui-list-view-ul")) {
            return;
        }
        elem = elem.parent();
    }

    index = parseInt(elem.attr("data-index"), 10);
    data = this.listData[index];
    if(this.option.hasRemoveButton && isCloseButton) {
        this._removeItem(elem, data, index);
    } else {
        this._selectItem(elem, data, index);
    }
}

ui.define("ui.ctrls.ListView", {
    _defineOption: function() {
        return {
            multiple: false,
            data: null,
            itemFormatter: false,
            hasRemoveButton: false
        };
    },
    _defineEvents: function() {
        return ["selecting", "selected", "deselected", "cancel", "removing", "removed"];
    },
    _create: function() {
        this.listData = [];
        this.selectList = [];

        if(!ui.core.isFunction(this.option.itemFormatter)) {
            this.option.itemFormatter = defaultItemFormatter;
        }

        this.option.hasRemoveButton = !!this.option.hasRemoveButton;
        this.onListItemClickHandler = $.proxy(onListItemClick, this);

        this._init();
    },
    _init: function() {
        this.element.addClass("ui-list-view");

        this.listPanel = $("<ul class='ui-list-view-ul' />");
        this.listPanel.click(this.onListItemClickHandler);
        this.element.append(this.listPanel);

        this._initAnimator();
        this.setData(this.option.data);
    },
    _initAnimator: function() {
        // TODO Something
    },
    _fill: function(data) {
        var i, len,
            itemBuilder = [],
            item;

        this.listPanel.empty();
        this.listData = [];
        for(i = 0, len = data.length; i < len; i++) {
            item = data[i];
            if(item === null || item === undefined) {
                continue;
            }
            this._createItemHtml(builder, item, i);
            this.listData.push(item);
        }
        this.listPanel.html(itemBuilder.join(""));
    },
    _createItemHtml: function(builder, item, index) {
        var content,
            index,
            temp;
        builder.push("<li class='ui-list-view-item'>");
        content = this.option.itemFormatter.call(this, item, index);
        if(ui.core.isString(content)) {
            builder.push(content);
        } else if(ui.core.isPlainObject(content)) {
            temp = builder[builder.length - 1];
            index = temp.lastIndexOf("'");
            builder[builder.length - 1] = temp.substring(0, index);
            // 添加class
            if(ui.core.isString(content.class)) {
                builder.push(" ", content.class);
            } else if(Array.isArray(content.class)) {
                builder.push(" ", content.class.join(" "));
            }
            builder.push("'");

            // 添加style
            if(content.style && !ui.core.isEmptyObject(content.style)) {
                builder.push(" style='");
                for(temp in content.style) {
                    if(content.style.hasOwnProperty(temp)) {
                        builder.push(temp, ":", content.style[temp], ";");
                    }
                }
                builder.push("'");
            }
            builder.push(">");

            // 放入html
            if(ui.core.isString(content.html)) {
                builder.push(content.html);
            }
        }
        builder.push("</li>");
    },
    _createItem: function(item, index) {
        var li = $("<li class='ui-list-view-item'>"),
            content = this.option.itemFormatter.call(this, item, index);
        
        // 添加class
        if(ui.core.isString(content.class)) {
            li.addClass(content.class);
        } else if(Array.isArray(content.class)) {
            li.addClass(content.class.join(" "));
        }
        // 添加style
        if(content.style && !ui.core.isEmptyObject(content.style)) {
            li.css(content.style);
        }
        // 添加内容
        li.html(content.html);

        return li;
    },

    /// API
    /** 重新设置数据 */
    setData: function(data) {
        if(Array.isArray(data)) {
            this._fill(data);
        }
    },
    /** 添加 */
    add: function(item) {
        var li;
        if(!item) {
            return;
        }

        li = this._createItem(item, this.listData.length);
        this.listPanel.append(li);
        this.listData.push(item);
    }
});
