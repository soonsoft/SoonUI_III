// column style 默认提供的GridView和ReportView的格式化器
function addZero (val) {
    return val < 10 ? "0" + val : "" + val;
}
function getMoney (symbol, content) {
    if (!symbol) {
        symbol = "";
    }
    if (!ui.core.isNumber(content))
        return null;
    return "<span>" + ui.str.formatMoney(content, symbol) + "</span>";
}

var columnFormatter,
    cellFormatter,
    cellParameterFormatter;

// 列头格式化器
columnFormatter = {
    columnCheckboxAll: function (col) {
        var checkbox = $("<i class='fa fa-square grid-checkbox-all' />");
        //checkbox.on("change", $.proxy(this.onAllSelected, this));
        /*
        this.columnStateFunctions.checkboxAllCancel = function () {
            checkbox.prop("checked", false);
            this._checkedCount = 0;
        };
        */
        return checkbox;
    },
    columnText: function (col) {
        var span = $("<span class='table-cell-text' />"),
            value = col.text;
        if (value === undefined || value === null) {
            return null;
        }
        span.text(value);
        return span;
    },
    empty: function (col) {
        return null;
    }
};

// 单元格格式化器
cellFormatter = {
    defaultText: function (val, col) {
        var span;
        if (val === undefined || val === null || isNaN(val)) {
            return null;
        }
        span = $("<span class='table-cell-text' />");
        span.text(t + "");
        return span;
    },
    empty: function (val, col) {
        return null;
    },
    rowNumber: function (val, col, idx) {
        var span;
        if(val === "no-count") {
            return null;
        }
        span = $("<span />");
        span.text((this.pageIndex - 1) * this.pageSize + (idx + 1));
        return span;
    },
    paragraph: function (val, col) {
        var p;
        if(val === undefined || val === null || isNaN(val)) {
            return null;
        }
        p = $("<p class='table-cell-block' />")
        p.text(val + "");
        return p;
    }
};

// 带参数的单元格格式化器
cellParameterFormatter = {};

ui.ColumnStyle = {
    cnfn: columnFormatter,
    cfn: cellFormatter,
    cfnp: cellParameterFormatter
};