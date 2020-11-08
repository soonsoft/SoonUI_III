// CardView

var selectedClass = "ui-card-view-selection",
    itemTitleHeight = 30,
    marginValueLimit = 4,
    frameBorderWidth = 4;

function noop() {}
function encode(input) {
    return input ? ui.str.htmlEncode(input) : input;
}
function prepareGroup(option) {
    var type;
    type = ui.core.type(option);
    if(type === "string") {
        this.option.group = {
            groupField: option,
            itemsField: "_items",
            groupListHandler: defaultGroupListHandler,
            headFormatter: defaultGroupHeadFormatter,
            headRearrangeHandler: defaultHeadRearrangeHandler
        };
    } else if(type === "object") {
        if(!ui.core.isFunction(option.groupListHandler)) {
            option.groupListHandler = defaultGroupListHandler;
        }
        if(!option.groupField) {
            throw new TypeError("the groupField can not be null or empty.");
        }
        if(!option.itemsField) {
            option.itemsField = "_items";
        }
        if(!ui.core.isFunction(option.headFormatter)) {
            option.headFormatter = defaultGroupHeadFormatter;
        }
        if(!ui.core.isFunction(option.headRearrangeHandler)) {
            option.headRearrangeHandler = noop;
        }
    } else {
        this.option.group = false;
    }
}

function defaultGroupListHandler(viewData, groupField, itemsField) {
    var groupList = ui.trans.listToGroup(viewData, groupField, null, itemsField);
    return groupList;
}

function defaultGroupHeadFormatter(groupItem, margin) {
    return ui.str.format(
        "<span style='margin-left:{0}px;margin-right:{0}px' class='item-head-title font-highlight'>{1}</span>", 
        margin, 
        encode(groupItem[this.option.group.groupField]));
}

function defaultHeadRearrangeHandler(itemHead, groupIndex, groupItem, margin) {
    var span = itemHead.children(".item-head-title");
    span.css({
        "margin-left": margin + "px",
        "margin-right": margin + "px"
    });
    if(groupIndex === 0) {
        itemHead.css("margin-top", margin + "px");
    }
}

function preparePager(option) {
    if(option.showPageInfo) {
        if(!option.pageInfoFormatter) {
            option.pageInfoFormatter = {
                currentRowNum: function(val) {
                    return "<span>本页" + val + "项</span>";
                },
                rowCount: function(val) {
                    return "<span class='font-highlight'>共" + val + "项</span>";
                },
                pageCount: function(val) {
                    return "<span>" + val + "页</span>";
                }
            };
        }
    }

    this.pager = ui.ctrls.Pager(option);
    this.pageIndex = this.pager.pageIndex;
    this.pageSize = this.pager.pageSize;
}

// 事件处理函数
// 选择事件
function onBodyClick(e) {
    var elem = $(e.target);
    while(!elem.hasClass("view-item")) {
        if(elem.hasClass("ui-card-view-body")) {
            return;
        }
        elem = elem.parent();
    }

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    this._selectItem(elem);
}

ui.ctrls.define("ui.ctrls.CardView", {
    _defineOption: function() {
        return {
            // 视图数据
            viewData: null,
            // 没有数据时显示的提示信息
            promptText: "没有数据",
            // 分组信息 
            /*
                string: 数据按该字段名分组,
                object: { 
                    groupField: string, 
                    itemsField: string, 
                    groupListHandler: function, 
                    headFormatter: function, 
                    headRearrangeHandler: function 
                }
            */
            group: false,
            // 高度
            width: false,
            // 宽度
            height: false,
            // 卡片项宽度
            itemWidth: 200,
            // 卡片项高度
            itemHeight: 200,
            // 卡片格式化器
            renderItemFormatter: null,
            // 分页信息
            pager: {
                // 当前页码，默认从第1页开始
                pageIndex: 1,
                // 记录数，默认30条
                pageSize: 30,
                // 显示按钮数量，默认显示10个按钮
                pageButtonCount: 10,
                // 是否显示分页统计信息，true|false，默认不显示
                showPageInfo: false,
                // 格式化器，包含currentRowNum, rowCount, pageCount的显示
                pageInfoFormatter: null
            },
            // 选择逻辑单选或多选
            selection: {
                multiple: false
            }
        };
    },
    _defineEvents: function() {
        var events = ["selecting", "selected", "deselected", "rebind", "cancel"];
        if(this.option.pager) {
            events.push("pagechanging");
        }
        return events;
    },
    _create: function() {
        this._itemBodyList = [];
        this._selectList = [];
        this._hasPrompt = !!this.option.promptText;
        this._currentMarginInfo = null;

        this.viewBody = null;
        this.pagerHeight = 30;

        if(this.option.group) {
            prepareGroup.call(this, this.option.group);
        }

        if(this.option.pager) {
            preparePager.call(this, this.option.pager);
        }

        if(!ui.core.isNumber(this.option.width) || this.option.width <= 0) {
            this.option.width = false;
        }
        if(!ui.core.isNumber(this.option.height) || this.option.height <= 0) {
            this.option.height = false;
        }

        /// 事件处理程序
        // 项目选中处理程序
        this.onBodyClickHandler = onBodyClick.bind(this);
    },
    _render: function() {
        if(!this.element.hasClass("ui-card-view")) {
            this.element.addClass("ui-card-view");
        }

        this._initBorderWidth();

        this.viewBody = $("<div class='ui-card-view-body' />");
        this._initDataPrompt();
        this.element.append(this.viewBody);
        if(this.option.selection) {
            this.viewBody.on("click", this.onBodyClickHandler);
        }
        this._initPagerPanel();

        this.setSize(this.option.width, this.option.height);
        // 修正selection设置项
        if(!this.option.selection) {
            this.option.selection = false;
        } else {
            if(this.option.selection.type === "disabled") {
                this.option.selection = false;
            }
        }

        if(Array.isArray(this.option.viewData)) {
            this.fill(this.option.viewData, this.option.viewData.length);
        }
    },
    _initBorderWidth: function() {
        var getBorderWidth = function(key) {
            return parseInt(this.element.css(key), 10) || 0;
        };
        this.borderWidth = 0;
        this.borderHeight = 0;

        this.borderWidth += getBorderWidth.call(this, "border-left-width");
        this.borderWidth += getBorderWidth.call(this, "border-right-width");

        this.borderHeight += getBorderWidth.call(this, "border-top-width");
        this.borderHeight += getBorderWidth.call(this, "border-bottom-width");
    },
    _initDataPrompt: function() {
        var text;
        if(this._hasPrompt) {
            this._dataPrompt = $("<div class='data-prompt' />");
            text = this.option.promptText;
            if (ui.core.isString(text) && text.length > 0) {
                this._dataPrompt.html("<span class='font-highlight'>" + encode(text) + "</span>");
            } else if (ui.core.isFunction(text)) {
                text = text();
                this._dataPrompt.append(text);
            }
            this.viewBody.append(this._dataPrompt);
        }
    },
    _initPagerPanel: function() {
        if(this.pager) {
            this.gridFoot = $("<div class='ui-card-view-foot clear' />");
            this.element.append(this.gridFoot);
            
            this.pager.pageNumPanel = $("<div class='page-panel' />");
            if (this.option.pager.showPageInfo) {
                this.pager.pageInfoPanel = $("<div class='data-info' />");
                this.gridFoot.append(this.pager.pageInfoPanel);
            } else {
                this.pager.pageNumPanel.css("width", "100%");
            }

            this.gridFoot.append(this.pager.pageNumPanel);
            this.pager.pageChanged(function(pageIndex, pageSize) {
                this.pageIndex = pageIndex;
                this.pageSize = pageSize;
                this.fire("pagechanging", pageIndex, pageSize);
            }, this);
        }
    },
    _rasterizeItems: function(isCreate, fn) {
        var marginInfo,
            arr,
            isGroup,
            groupOption,
            that,
            head, body,
            elements,
            isFunction;

        arr = this.getViewData();
        if(arr.length === 0) {
            return;
        }
        isGroup = this.isGroup();
        if(isGroup) {
            if(!this._groupData) {
                groupOption = this.option.group;
                this._groupData = groupOption.groupListHandler.call(this, arr, groupOption.groupField, groupOption.itemsField);
            }
            arr = this._groupData;
        }
        marginInfo = this._getMargin(arr);
        this._currentMarginInfo = marginInfo;
        if(marginInfo.count === 0) return;
        
        isFunction = ui.core.isFunction(fn);
        elements = [];
        that = this;

        this._viewDataIndex = -1;
        if(isGroup) {
            arr.forEach(function(item, groupIndex) {
                body = that._getItemBody(groupIndex, isGroup, elements, marginInfo.margin);
                that._fillItemBody(item[that.option.group.itemsField], groupIndex, body, marginInfo, isFunction, fn);
            });
        } else {
            body = this._getItemBody(0, isGroup, elements, marginInfo.margin);
            this._fillItemBody(arr, 0, body, marginInfo, isFunction, fn);
        }
        delete this._viewDataIndex;

        if(elements.length > 0) {
            that.viewBody.append(elements);
        }
    },
    _getItemBody: function(groupIndex, isGroup, elements, margin) {
        var itemBody,
            itemHead;
        itemBody = this._itemBodyList[groupIndex];
        if(!itemBody) {
            if(isGroup) {
                itemHead = $("<div class='item-head' />");
                itemHead.append(this.option.group.headFormatter.call(this, this._groupData[groupIndex], margin));
                if(elements.length === 0) {
                    itemHead.css("margin-top", margin + "px");
                }
                elements.push(itemHead);
            }
            itemBody = $("<div class='item-body' />");
            elements.push(itemBody);
            this._itemBodyList.push(itemBody);
        } else {
            if(isGroup) {
                itemHead = itemBody.prev();
                this.option.group.headRearrangeHandler.call(this, itemHead, groupIndex, this._groupData[groupIndex], margin);
            }
        }
        return itemBody;
    },
    _fillItemBody: function(arr, groupIndex, itemBody, marginInfo, isFunction, fn) {
        var rows, 
            i, j,
            index,
            top, left,
            item;

        rows = Math.floor((arr.length + marginInfo.count - 1) / marginInfo.count);
        itemBody.css("height", (rows * (this.option.itemHeight + marginInfo.margin) + marginInfo.margin) + "px");
        for(i = 0; i < rows; i++) {
            for(j = 0; j < marginInfo.count; j++) {
                index = (i * marginInfo.count) + j;
                if(index >= arr.length) {
                    return;
                }
                this._viewDataIndex++;
                top = (i + 1) * marginInfo.margin + (i * this.option.itemHeight);
                left = (j + 1) * marginInfo.margin + (j * this.option.itemWidth);
                item = arr[index];
                item._group = {
                    index: groupIndex,
                    itemIndex: index
                };
                if(isFunction) {
                    fn.call(this, itemBody, item, this._viewDataIndex, top, left);
                }
            }
        }
    },
    _getMargin: function(groupList, scrollHeight) {
        var currentWidth,
            currentHeight,
            result,
            restWidth,
            flag,
            isGroup,
            checkOverflow;

        currentWidth = this.viewBody.width();
        currentHeight = this.viewBody.height();
        isGroup = this.isGroup();
        checkOverflow = function(list, res) {
            // scroll height 避免同名
            var sh, 
                i, 
                len;
            if(res.count === 0) {
                return res;
            }

            if(isGroup) {
                sh = res.margin;
                for(i = 0, len = list.length; i < len; i++) {
                    sh += itemTitleHeight;
                    sh += Math.floor((list[i][this.option.group.itemsField].length + res.count - 1) / res.count) * (res.margin + this.option.itemHeight) + res.margin;
                }
            } else {
                sh = Math.floor((list.length + res.count - 1) / res.count) * (res.margin + this.option.itemHeight) + res.margin;
            }

            if(sh > currentHeight) {
                return this._getMargin(len, sh);
            } else {
                return res;
            }
        };

        if(scrollHeight) {
            flag = true;
            if(scrollHeight > currentHeight) {
                currentWidth -= ui.scrollbarWidth;
            }
        }
        result = {
            count: Math.floor(currentWidth / this.option.itemWidth),
            margin: 0
        };
        restWidth = currentWidth - result.count * this.option.itemWidth;
        result.margin = Math.floor(restWidth / (result.count + 1));
        if(result.margin >= marginValueLimit) {
            return flag ? result : checkOverflow.call(this, groupList, result);
        }
        result.margin = marginValueLimit;

        result.count = Math.floor((currentWidth - ((result.count + 1) * result.margin)) / this.option.itemWidth);
        restWidth = currentWidth - result.count * this.option.itemWidth;
        result.margin = Math.floor(restWidth / (result.count + 1));

        return flag ? result : checkOverflow.call(this, groupList, result);
    },
    _createItem: function(itemData, index) {
        var div = $("<div class='view-item' />");
        div.css({
            "width": this.option.itemWidth + "px",
            "height": this.option.itemHeight + "px"
        });
        div.attr("data-index", index);
        return div;
    },
    _renderItem: function(itemElement, itemData, index) {
        var elem, frame, formatter;

        formatter = this.option.renderItemFormatter;
        if(ui.core.isFunction(formatter)) {
            elem = formatter.call(this, itemData, index);
            if(elem) {
                itemElement.append(elem);
            }
        }
        frame = $("<div class='frame-panel border-highlight'/>");
        frame.css({
            "width": this.option.itemWidth - (frameBorderWidth * 2) + "px",
            "height": this.option.itemHeight - (frameBorderWidth * 2) + "px"
        });
        itemElement.append(frame);
        itemElement.append("<i class='check-marker border-highlight'></i>");
        itemElement.append("<i class='check-icon far fa-check'></i>");
    },
    _renderPageList: function(rowCount) {
        if (!this.pager) {
            return;
        }
        this.pager.data = this.option.viewData;
        this.pager.pageIndex = this.pageIndex;
        this.pager.pageSize = this.pageSize;
        this.pager.renderPageList(rowCount);
    },
    _rearrangeItems: function() {
        var i, len,
            childrenList;
        if(this._itemBodyList.length === 0)
            return;
        
        childrenList = [];
        for(i = 0, len = this._itemBodyList.length; i < len; i++) {
            childrenList.push(this._itemBodyList[i].children());
        }
        this._rasterizeItems(false, function(itemBody, item, index, top, left) {
            var elem,
                group;

            group = item._group;
            elem = childrenList[group.index][group.itemIndex];
            $(elem).css({
                "top": top + "px",
                "left": left + "px"
            });
        });
    },
    _getSelectionData: function(elem) {
        var groupIndex,
            itemIndex,
            index,
            data,
            viewData;

        index = parseInt(elem.attr("data-index"), 10);
        viewData = this.getViewData();
        data = {
            itemIndex: index,
            itemData: viewData[index]
        };
        if(this.isGroup()) {
            data.group = {
                index: data.itemData._group.index,
                itemIndex: data.itemData._group.itemIndex
            };
        }
        return data;
    },
    _selectItem: function(elem) {
        var eventData,
            result,
            i, len;

        eventData = this._getSelectionData(elem);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        result = this.fire("selecting", eventData);
        if(result === false) {
            return;
        }

        if(this.isMultiple()) {
            if(elem.hasClass(selectedClass)) {
                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if(this._selectList[i] === elem[0]) {
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
                elem.removeClass(selectedClass);
                this.fire("deselected", eventData);
            } else {
                this._selectList.push(elem[0]);
                elem.addClass(selectedClass);
                this.fire("selected", eventData);
            }
        } else {
            if(this._current) {
                this._current.removeClass(selectedClass);
                if(this_current[0] === elem[0]) {
                    this._current = null;
                    this.fire("deselected", eventData);
                    return;
                }
                this._current = elem;
                elem.addClass(selectedClass);
                this.fire("selected", eventData);
            }
        }
    },
    _getItemElement: function(index) {
        var group,
            viewData,
            itemBody,
            items,
            item;

        viewData = this.getViewData();
        if(viewData.length === 0) {
            return null;
        }
        item = viewData[index];
        group = item._group;

        itemBody = this._itemBodyList[group.index];
        if(!itemBody) {
            return null;
        }

        items = itemBody.children();
        item = items[group.itemIndex];
        if(item) {
            return $(item);
        }
        return null;
    },
    _updateIndexes: function(groupIndex, itemIndex, viewDataStartIndex) {
        var itemBody,
            viewData,
            children,
            item,
            i, j;
        viewData = this.getViewData();
        for(i = groupIndex; i < this._itemBodyList.length; i++) {
            itemBody = this._itemBodyList[i];
            children = itemBody.children();
            for(j = itemIndex; j < children.length; j++) {
                $(children[j]).attr("data-index", viewDataStartIndex);
                item = viewData[viewDataStartIndex];
                item._group = {
                    index: i,
                    itemIndex: j
                };
                viewDataStartIndex++;
            }
            itemIndex = 0;
        }
    },
    _removeGroup: function(itemBody) {
        var itemHead;
        itemHead = itemBody.prev();
        if(itemHead.length > 0 && itemHead.hasClass("item-head")) {
            itemHead.remove();
        }
        itemBody.remove();
    },
    _promptIsShow: function() {
        return this._hasPrompt && this._dataPrompt.css("display") === "block";
    },
    _setPromptLocation: function() {
        var height = this._dataPrompt.height();
        this._dataPrompt.css("margin-top", -(height / 2) + "px");
    },
    _showDataPrompt: function() {
        if(!this._hasPrompt) return;
        this._dataPrompt.css("display", "block");
        this._setPromptLocation();
    },
    _hideDataPrompt: function() {
        if(!this._hasPrompt) return;
        this._dataPrompt.css("display", "none");
    },

    /// API
    /** 数据填充 */
    fill: function(viewData, rowCount) {
        var isRebind;

        isRebind = false;
        if(this._itemBodyList.length > 0) {
            isRebind = true;
            this.viewBody.scrollTop(0);
            this.clear(false);
        }

        if(!Array.isArray(viewData)) {
            viewData = [];
        }
        this.option.viewData = viewData;

        if(viewData.length === 0) {
            this._showDataPrompt();
        } else {
            this._hideDataPrompt();

            this._rasterizeItems(true, function(itemBody, itemData, index, top, left) {
                var elem = this._createItem(itemData, index);
                elem.css({
                    "top": top + "px",
                    "left": left + "px"
                });
                this._renderItem(elem, itemData, index);
                itemBody.append(elem);
            });
        }

        //update page numbers
        if ($.isNumeric(rowCount)) {
            this._renderPageList(rowCount);
        }

        if (isRebind) {
            this.fire("rebind");
        }
    },
    /** 获取选中的数据，单选返回单个对象，多选返回数组 */
    getSelection: function() {
        var result,
            i, len;
        if(!this.isSelectable()) {
            return null;
        }

        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                result.push(this._getSelectionData($(this._selectList[i])));
            }
        } else {
            result = null;
            if(this._current) {
                result = this._getSelectionData(this._current);
            }
        }
        return result;
    },
    /** 取消选中项 */
    cancelSelection: function() {
        var i, len, elem;
        if(!this.isSelectable()) {
            return;
        }

        if(this.isMultiple()) {
            if(this._selectList.length === 0) {
                return;
            }
            for(i = 0, len = this._selectList.length; i < len; i++) {
                elem = $(this._selectList[i]);
                fn.call(this, elem);
            }
            this._selectList = [];
        } else {
            if(!this._current) {
                return;
            }
            fn.call(this, this._current);
            this._current = null;    
        }
        this.fire("cancel");
    },
    /** 根据索引移除项目 */
    removeAt: function() {
        var elem,
            viewData,
            index,
            indexes,
            i, len, j,
            group;

        viewData = this.getViewData();
        if(viewData.length === 0) {
            return;
        }
        len = arguments.length;
        if(len === 0) {
            return;
        }
        indexes = [];
        for(i = 0; i < len; i++) {
            index = arguments[i];
            if(ui.core.isNumber(index) && index >= 0 && index < viewData.length) {
                indexes.push(index);
            }
        }
        len = indexes.length;
        if(len > 0) {
            indexes.sort(function(a, b) {
                return b - a;
            });
            for(i = 0; i < len; i++) {
                index = indexes[i];
                elem = this._getItemElement(index);
                if(!elem) {
                    continue;
                }
                group = viewData[index]._group;
                this.option.viewData.splice(index, 1);
                if(this.isGroup()) {
                    if(this._groupData[group.index][this.option.group.itemsField].length === 1) {
                        this._groupData.splice(group.index, 1);
                        this._itemBodyList.splice(group.index, 1);
                        this._removeGroup(elem.parent());
                    } else {
                        this._groupData[group.index][this.option.group.itemsField].splice(group.index, 1);
                        elem.remove();
                    }
                } else {
                    elem.remove();
                }

                if(this.isSelectable()) {
                    if(this.isMultiple()) {
                        for(j = 0; j < this._selectList.length; j++) {
                            if(this._selectList[j] === elem[0]) {
                                this._selectList.splice(j, 1);
                                break;
                            }
                        }
                    } else {
                        if(this._current && this._current[0] === elem[0]) {
                            this._current = null;
                        }
                    }
                }
            }
            this._updateIndexes(group.index, group.itemIndex, index);
            this._rearrangeItems();
        }
    },
    /** 根据索引更新项目 */
    updateItem: function(index, itemData) {
        var elem;

        if(!ui.core.isNumber(index) || index < 0 || index >= this.count()) {
            return;
        }

        elem = this._getItemElement(index);
        if(elem) {
            elem.empty();
            this.option.viewData[index] = itemData;
            this._renderItem(elem, itemData, index);
        }
    },
    /** 添加项目 */
    addItem: function(itemData) {
        var viewData,
            elem,
            groupIndex,
            groupKey,
            itemBody,
            newGroupItem,
            newGroup,
            newGroupElements,
            i, len;

        if(!itemData) {
            return;
        }

        viewData = this.option.viewData;
        if(!Array.isArray(viewData) || viewData.length === 0) {
            if (this.bodyPanel) {
                this.bodyPanel.remove();
                this.bodyPanel = null;
            }
            this.fill([itemData]);
            return;
        }

        newGroup = {};
        if(this.isGroup()) {
            groupKey = itemData[this.option.group.groupField] + "";
            groupIndex = -1;
            for(i = 0, len = this._groupData.length; i < len; i++) {
                if(this._groupData[i][this.option.group.groupField] === groupKey) {
                    groupIndex = i;
                    break;
                }
            }

            if(groupIndex === -1) {
                // 新分组
                newGroup.index = this._groupData.length;
                newGroup.itemIndex = 0;
    
                newGroupItem = {};
                newGroupItem[this.option.group.groupField] = groupKey;
                newGroupItem[this.option.group.itemsField] = [itemData];
                this._groupData.push(newGroupItem);
    
                newGroupElements = [];
                itemBody = this._getItemBody(newGroup.index, true, newGroupElements, this._currentMarginInfo.margin);
                this.viewBody.append(newGroupElements);
            } else {
                // 老分组追加
                itemBody = this._itemBodyList[groupIndex];
                newGroup.index = groupIndex;
                newGroup.itemIndex = this._groupData[groupIndex][this.option.group.itemsField].length;
                this._groupData[groupIndex][this.option.group.itemsField].push(itemData);
            }
        } else {
            newGroup.index = 0;
            newGroup.itemIndex = viewData.length;
            itemBody = this._itemBodyList[newGroup.index];
        }

        itemData._group = newGroup;
        elem = this._createItem(itemData, viewData.length);
        this._renderItem(elem, itemData, viewData.length);

        viewData.push(itemData);
        itemBody.append(elem);

        this._rearrangeItems();
    },
    /** 插入项目 */
    insertItem: function(index, itemData) {
        var elem,
            newGroup,
            oldItem,
            viewData;
        if(!itemData) {
            return;
        }
        viewData = this.option.viewData;
        if (!Array.isArray(viewData) || viewData.length === 0) {
            this.addItem(itemData);
            return;
        }
        if (index < 0) {
            index = 0;
        }
        if(index >= 0 && index < viewData.length) {
            newGroup = {};
            if(this.isGroup()) {
                oldItem = viewData[index];
                if(oldItem[this.option.group.groupField] !== itemData[this.option.group.groupField]) {
                    throw new Error("the data not belong to the destination group.");
                }
                newGroup.index = oldItem._group.index;
                newGroup.itemIndex = oldItem._group.itemIndex;
                this._groupData[newGroup.index][this.option.group.itemsField].splice(newGroup.itemIndex, 0, itemData);
            } else {
                newGroup.index = 0;
                newGroup.itemIndex = index;
            }

            itemData._group = newGroup;
            elem = this._createItem(itemData, index);
            this._renderItem(elem, itemData, index);

            this._getItemElement(index).before(elem);
            viewData.splice(index, 0, itemData);
            
            this._updateIndexes(newGroup.index, newGroup.itemIndex, index);
            this._rearrangeItems();
        } else {
            this.addItem(itemData);
        }
    },
    /** 获取视图数据 */
    getViewData: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData : [];
    },
    /** 获取当前尺寸下一行能显示多少个元素 */
    getColumnCount: function() {
        return this._currentMarginInfo ? this._currentMarginInfo.count : 0;
    },
    /** 获取当前尺寸下每个元素的边距 */
    getItemMargin: function() {
        return this._currentMarginInfo ? this._currentMarginInfo.margin : 0;
    },
    /** 获取项目数 */
    count: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData.length : 0;
    },
    /** 是否可以选择 */
    isSelectable: function() {
        return !!this.option.selection;
    },
    /** 是否支持多选 */
    isMultiple: function() {
        return this.option.selection.multiple === true;
    },
    /** 是否是分组形式 */
    isGroup: function() {
        return !!this.option.group;
    },
    /** 清空表格数据 */
    clear: function() {
        var that;
        if (this._itemBodyList.length > 0) {
            that = this;
            this._itemBodyList.forEach(function(item) {
                that._removeGroup(item);
            });
            if(this.isGroup()) {
                this._groupData = null;
            }
            this._itemBodyList = [];
            this.option.viewData = [];
            this._selectList = [];
            this._current = null;
        }
        if (this.pager) {
            this.pager.empty();
        }
        if (arguments[0] !== false) {
            this._showDataPrompt();
        }
    },
    /** 设置表格的尺寸, width: 宽度, height: 高度 */
    setSize: function(width, height) {
        var needRecompose = false;
        if(arguments.length === 1) {
            height = width;
            width = null;
        }
        if(ui.core.isNumber(height)) {
            height -= this.borderHeight;
            if(this.pager) {
                height -= this.pagerHeight;
            }
            this.viewBody.css("height", height + "px");
            needRecompose = true;
        }
        if(ui.core.isNumber(width)) {
            width -= this.borderWidth;
            this.element.css("width", width + "px");
            needRecompose = true;
        }
        if(needRecompose) {
            this._rearrangeItems();
        }
        if(this._promptIsShow()) {
            this._setPromptLocation();
        }
    }
});

$.fn.cardView = function(option) {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.CardView(option, this);
};
