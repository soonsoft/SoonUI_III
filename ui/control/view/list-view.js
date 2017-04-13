//列表

function defaultItemFormatter() {

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
        this.onListItemClickHandler = $.proxy(this.onListItemClick);

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
        for(i = 0, len = data.length; i < len; i++) {
            item = data[i];
            if(item === null || item === undefined) {
                continue;
            }
            this._createItem(builder, item, i);
        }
        this.listPanel.html(itemBuilder.join(""));
    },
    _createItem: function(builder, item, index) {
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

    /// API
    setData: function(data) {
        if(Array.isArray(data)) {
            this._fill(data);
        }
    }

});
