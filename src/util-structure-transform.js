// 数据结构转换

var flagFieldKey = "_from-list";

function getFieldMethod(field, fieldName) {
    if (!ui.core.isFunction(field)) {
        if (ui.core.isString(field)) {
            return function () {
                return this[field];
            };
        } else {
            throw new TypeError(ui.str.format("the {0} is not String or Function.", fieldName));
        }
    }
    return field;
}

ui.trans = {
    /** Array结构转Tree结构 */
    listToTree: function (list, parentField, valueField, childrenField) {
        var tempList = {}, 
            temp, root,
            item, i, len, id, pid,
            flagField = flagFieldKey,
            key;

        if (!Array.isArray(list) || list.length === 0) {
            return null;
        }

        parentField = getFieldMethod(parentField, "parentField");
        valueField = getFieldMethod(valueField, "valueField");
        childrenField = ui.core.isString(childrenField) ? childrenField : "children";

        for (i = 0, len = list.length; i < len; i++) {
            item = list[i];
            if(item === null || item === undefined) {
                continue;
            }
            pid = parentField.call(item) + "" || "__";
            if (tempList.hasOwnProperty(pid)) {
                temp = tempList[pid];
                temp[childrenField].push(item);
            } else {
                temp = {};
                temp[childrenField] = [];
                temp[childrenField].push(item);
                tempList[pid] = temp;
            }
            id = valueField.call(item) + "";
            if (tempList.hasOwnProperty(id)) {
                temp = tempList[id];
                item[childrenField] = temp[childrenField];
                tempList[id] = item;
                item[flagField] = true;
            } else {
                item[childrenField] = [];
                item[flagField] = true;
                tempList[id] = item;
            }
        }
        for (key in tempList) {
            if(tempList.hasOwnProperty(key)) {
                temp = tempList[key];
                if (!temp.hasOwnProperty(flagField)) {
                    root = temp;
                    break;
                }
            }
        }
        return root[childrenField];
    },
    /** Array结构转分组结构(两级树结构) */
    listToGroup: function(list, groupField, createGroupItemFn, itemsField) {
        var temp = {},
            i, len, key, 
            groupKey, item, result;

        if (!Array.isArray(list) || list.length === 0) {
            return null;
        }
        
        groupKey = ui.core.isString(groupField) ? groupField : "text";
        groupField = getFieldMethod(groupField, "groupField");
        itemsField = ui.core.isString(itemsField) ? itemsField : "children";
        
        for (i = 0, len = list.length; i < len; i++) {
            item = list[i];
            if(item === null || item === undefined) {
                continue;
            }
            key = groupField.call(item) + "" || "__";
            if(!temp.hasOwnProperty(key)) {
                temp[key] = {};
                temp[key][groupKey] = key;
                temp[key][itemsField] = [];
                if(ui.core.isFunction(createGroupItemFn)) {
                    createGroupItemFn.call(this, temp[key], item, key);
                }
            }
            temp[key][itemsField].push(item);
        }

        result = [];
        for(key in temp) {
            if(temp.hasOwnProperty(key)) {
                result.push(temp[key]);
            }
        }
        return result;
    },
    /** 遍历树结构 */
    treeEach: function(list, childrenField, fn) {
        var i, len,
            node,
            isNodeFn;

        if(!Array.isArray(list)) {
            return;
        }
        if(!ui.core.isFunction(fn)) {
            return;
        }
        childrenField = ui.core.isString(childrenField) ? childrenField : "children";
        isNodeFn = function() {
            return Array.isArray(this[childrenField]) && this[childrenField].length > 0;
        };
        
        for(i = 0, len = list.length; i < len; i++) {
            node = list[i];
            node.isNode = isNodeFn;
            fn.call(null, node);
            delete node.isNode;
            if(isNodeFn.call(node)) {
                ui.trans.treeEach(node[childrenField], childrenField, fn);
            }
        }
    }
};
