// 数据结构转换

ui.trans = {
    // Array结构转Tree结构
    listToTree: function (list, parentField, valueField, childrenField) {
        if (!$.isArray(list) || list.length === 0)
            return null;
        var tempList = {}, temp, root,
            item, i, id, pid,
            flagField = "fromList";
        var pField, vField;
        if (!$.isFunction(parentField)) {
            if (ui.core.type(parentField) === "string") {
                pField = parentField;
                parentField = function () {
                    return this[pField];
                };
            } else {
                throw new TypeError("parentField isn't String or Function");
            }
        }
        if (!$.isFunction(valueField)) {
            if (ui.core.type(valueField) === "string") {
                vField = valueField;
                valueField = function () {
                    return this[vField];
                };
            } else {
                throw new TypeError("valueField isn't String or Function");
            }
        }
        if (ui.core.type(childrenField) !== "string") {
            childrenField = "children";
        }

        for (i = 0; i < list.length; i++) {
            item = list[i];
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
        for (var key in tempList) {
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
    // Array结构转分组结构(两级树结构)
    listToGroup: function() {

    }
};