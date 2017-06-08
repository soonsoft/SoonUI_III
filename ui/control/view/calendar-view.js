// CalendarView
var timeTitleWidth = 80,
    hourHeight = 25,
    sundayFirstWeek = ["日", "一", "二", "三", "四", "五", "六"],
    mondayFirstWeek = ["一", "二", "三", "四", "五", "六", "日"],
    viewTypes;

function noop() {}
function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}
function formatTime (date, beginDate) {
    var h = date.getHours(),
        m = date.getMinutes(),
        s = date.getSeconds();
    var tempDate, value;
    if (beginDate) {
        tempDate = new Date(beginDate.getFullYear(), beginDate.getMonth(), beginDate.getDate(), 0, 0, 0);
        value = date - tempDate;
        value = value / 1000 / 60 / 60;
        if (value >= 24) {
            h = 24;
        }
    }
    return [
        twoNumberFormatter(h),
        ":",
        twoNumberFormatter(m),
        ":",
        twoNumberFormatter(s)].join("");
}

// 事件处理
// 年视图日期点击事件
function onYearItemClick(e) {
    var elem = $(e.target),
        nodeName;
    while ((nodeName = elem.nodeName()) !== "TD") {
        if (nodeName === "TABLE") {
            return;
        }
        elem = elem.parent();
    }

    this._selectItem(elem);
}
// 月视图日期点击事件
function onMouseItemClick(e) {
    var elem = $(e.target),
        nodeName;
    while ((nodeName = elem.nodeName()) !== "TD") {
        if (nodeName === "TABLE") {
            return;
        }
        elem = elem.parent();
    }

    this._selectItem(elem);
}

// 年视图
function YearView(calendar) {
    if(this instanceof YearView) {
        this.initialize();
    } else {
        return new YearView(calendar);
    }
}
YearView.prototype = {
    constructor: YearView,
    initialize: function(calendar) {
        this.calendar = calendar;
        this.initialled = false;
        this.year = null;

        this._selectList = [];
        this._current = null;

        this.viewPanel = $("<div class='calendar-view-panel' />");
        this.calendar.element.append(this.viewPanel);
    },
    render: function() {
        if (this.initialled) {
            return;
        }

        this.year = this.calendar.currentDate.getFullYear();

        // 日期项点击事件
        this.onYearItemClickHandler = $.proxy(onYearItemClick, this);

        this.yearPanel = $("<div class='ui-calendar-year-view' />");
        this._initYear();
        this.viewPanel.append(this.yearPanel);

        this.initialled = true;
    },
    _initYear: function() {
        var div, i;
        for (i = 0; i < 12; i++) {
            div = $("<div class='year-month-panel' />");
            div.append(
                $("<div class='year-month-title' />")
                    .append("<span class='font-highlight'>" + (i + 1) + "月" + "</span>"));
            div.append("<div class='year-month-content' />");
            this.yearPanel.append(div);
        }
        this.yearPanel.append("<br clear='all' />");
    },
    _oddStyle: function (monthPanel, count, i) {
        if (i % 2) {
            monthPanel.addClass("year-month-odd");
        }
    },
    _evenStyle: function (monthPanel, count, i) {
        if (Math.floor(i / count) % 2) {
            if (i % 2) {
                monthPanel.addClass("year-month-odd");
            }
        } else {
            if (i % 2 === 0) {
                monthPanel.addClass("year-month-odd");
            }
        }
    },
    _setCellSize: function (width, height) {
        var count,
            oddFn,
            cells, cell, 
            unitWidth, unitHeight,
            i;

        count = this.getMonthCount(width);
        if (count % 2) {
            oddFn = this.oddStyle;
        } else {
            oddFn = this.evenStyle;
        }

        cells = this.yearPanel.children();
        cells.removeClass("year-month-odd");

        unitWidth = Math.floor(width / count);
        unitHeight = Math.floor(unitWidth / 4 * 3);
        if (unitHeight * (12 / count) > height || this.yearPanel[0].scrollHeight > height) {
            width -= ui.scrollbarWidth;
            unitWidth = Math.floor(width / count);
        }
        if (unitHeight < 248) {
            unitHeight = 248;
        }
        for (i = 0; i < 12; i++) {
            cell = $(cells[i]);
            cell.css("width", unitWidth + "px")
                .css("height", unitHeight + "px");
            cell.children(".year-month-content")
                .css("height", unitHeight - 48 + "px");
            oddFn.call(this, cell, count, i);
        }
    },
    _changeYear: function(yearDate) {
        this.calendar.currentDate = yearDate;
        this.year = this.calendar.currentDate.getFullYear();
        this._setCellSize(
            this.viewPanel.width(), this.viewPanel.height());
        this._updateYear();

        this._current = null;
        this._selectList = [];
    },
    _updateYear: function () {
        var cells = this.yearPanel.children(".year-month-panel"),
            year = this.calendar.currentDate.getFullYear(),
            cell = null,
            today = new Date(), 
            i;
        for (i = 0; i < 12; i++) {
            cell = $(cells[i]);
            this._createMonth($(cell.children()[1]), year, i, today);
        }
    },
    _createMonth: function (content, year, month, today) {
        var table, colgroup, thead, tbody, row, cell,
            week, dayNum, startIndex, last,
            flag, day, dayVal,
            i, j, that;

        table = $("<table class='year-month-table unselectable' cellspacing='0' cellpadding='0' />");
        colgroup = $("<colgroup />");
        thead = $("<thead />");
        tbody = $("<tbody />");
        week = this.calendar.getWeekNames();
        row = $("<tr />");
        for(i = 0; i < week.length; i++) {
            colgroup.append("<col />");
            if(this.calendar.isWeekend(i)) {
                flag = "<th class='year-month-table-head ui-calendar-weekend'>";
            } else {
                flag = "<th class='year-month-table-head'>";
            }
            row.append(flag + week[i] + "</th>");
        }
        thead.append(row);

        dayNum = 1;
        startIndex = this.calendar.getWeekIndexOf(
            new Date(year, month, dayNum));
        last = (new Date(year, month + 1, 0)).getDate();
        flag = false;
        if (year === today.getFullYear() && month === today.getMonth()) {
            flag = true;
            day = today.getDate();
        }

        for (i = 0; i < 6; i++) {
            row = $("<tr />");
            for (j = 0; j < 7; j++) {
                cell = $("<td class='year-month-table-cell' />");
                if (i === 0 && j < startIndex) {
                    cell.addClass("ui-calendar-empty");
                    continue;
                } else if (dayNum <= last) {
                    dayVal = $("<span>" + dayNum + "</span>");
                    if (flag && dayNum === day) {
                        dayVal.addClass("today")
                            .addClass("background-highlight");
                    }
                    cell.append(dayVal);
                    dayNum++;
                }
                row.append(cell);
            }
            tbody.append(row);
        }
        table.append(colgroup).append(thead).append(tbody);
        content.empty().append(table);

        table.data("month", month);
        table.click(this.onYearItemClickHandler);
    },
    _isDateCell: function(td) {
        return !td.hasClass("ui-calendar-empty") && td.children().length > 0;
    },
    _getDateByCell: function(elem) {
        var table,
            month,
            day;
        table = elem.parent().parent().parent();
        month = parseInt(table.data("month"), 10);
        day = parseInt(elem.children().text(), 10);
        return new Date(this.year, month, day);
    },
    _getCellByDate: function(months, date) {
        var month,
            indexer,
            dayCell;

        month = $($(months[date.getMonth()]).children()[1]);
        indexer = this.calendar.getTableIndexOfMonth(date);
        dayCell = $(month.children()[0].tBodies[0].rows[indexer.rowIndex].cells[indexer.cellIndex]);
        return dayCell;
    },
    _selectItem: function(elem) {
        var eventData,
            selectedClass = "selected",
            i, len;
        if (!this._isDateCell(td)) {
            return;
        }

        eventData = {};
        eventData.date = this._getDateByCell(elem);
        eventData.view = this;
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;
        
        if(this.calendar.fire("selecting", eventData) === false) {
            return;
        }

        if(this.isMultiple()) {
            if(elem.hasClass(selectedClass)) {
                elem.removeClass(selectedClass);
                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if (this._selectList[i] === elem[0]) {
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
                this.calendar.fire("deselected", eventData);
            } else {
                elem.addClass(selectedClass);
                this._selectList.push(elem[0]);
                this.calendar.fire("selected", eventData);
            }
        } else {
            if(this._current) {
                this._current.removeClass(selectedClass);
                this._current = null;
                if(this._current[0] === elem[0]) {
                    this.calendar.fire("deselected", eventData);
                    return;
                }
            }
            this._current = elem;
            this._current.addClass(selectedClass);
            this.calendar.fire("selected", eventData);
        }
    },
    _updateSchedules: function(data, dateField, action) {
        var months, getDateFn,
            date, dayCell,
            i, len, item, 
            isFunctionValue;

        if(Array.isArray(data)) {
            return;
        }
        if(!dateField) {
            dateField = "date";
        }
        if(ui.core.isFunction(dateField)) {
            getDateFn = dateField; 
        } else {
            getDateFn = function() {
                return this[dateField];
            };
        }
        isFunctionValue = ui.core.isFunction(action);

        months = this.yearPanel.children(".year-month-panel");
        for(i = 0, len = date.length; i < len; i++) {
            item = data[i];
            if(!(item instanceof Date)) {
                date = getDateFn.call(item);
                if(!(date instanceof Date)) {
                    continue;
                }
            } else {
                date = item;
            }
            dayCell = this._getCellByDate(months, date);
            if(isFunctionValue) {
                action.call(dayCell, item);
            }
        }
    },
    /** 一行放几个月 */
    getMonthCount: function (width) {
        if (width >= 1024) {
            return 4;
        } else if (width >= 768) {
            return 3;
        } else if (width >= 512) {
            return 2;
        } else {
            return 1;
        }
    },
    /** 检查是否需要更新 */
    checkChange: function () {
        this.calendar.hideTimeLine();
        if (this.year === this.calendar.currentDate.getFullYear()) {
            return false;
        }
        this._changeYear(this.calendar.currentDate);
        return true;
    },
    /** 激活 */
    active: noop,
    /** 休眠 */
    dormant: noop,
    /** 向前切换 */
    previous: function() {
        var day = this.calendar.currentDate;
        this._changeYear(new Date(day.setFullYear(day.getFullYear() - 1)));
    },
    /** 向后切换 */
    next: function() {
        var day = this.calendar.currentDate;
        this._changeYear(new Date(day.setFullYear(day.getFullYear() + 1)));
    },
    /** 切换到当前 */
    today: function(day) {
        if (!day || !(day instanceof Date)) {
            day = new Date();
        }
        this._changeYear(new Date(day.getTime()));
    },
    /** 添加日程信息 */
    addSchedules: function(data, dateField, action) {
        var formatterFn;

        if(!ui.core.isFunction(action)) {
            action = null;
        }
        formatterFn = function(item) {
            var marker = this.children(".year-day-marker");
            if(marker.length === 0) {
                this.append("<i class='year-day-marker border-highlight'></i>");
            }
            if(action) {
                action.call(this, item);
            }
        };
        this._updateSchedules(data, dateField, formatterFn);
    },
    /** 移除日程信息 */
    removeSchedules: function() {
        var formatterFn;

        if(!ui.core.isFunction(action)) {
            action = null;
        }
        formatterFn = function(item) {
            var marker = this.children(".year-day-marker");
            if(marker.length > 0) {
                marker.remove();
            }
            if(action) {
                action.call(this, item);
            }
        };
        this._updateSchedules(data, dateField, formatterFn);
    },
    /** 清空日程信息 */
    clearSchedules: function() {
        var months,
            rows, cells, cell, item,
            i, j, k;
        
        months = this.yearPanel.children(".year-month-panel");
        for(i = 0; i < 12; i++) {
            rows = $(months[i])
                        .children(".year-month-content")
                        .children(".year-month-table")[0].tBodies[0].rows;
            for(j = 0; j < rows.length; j++) {
                cells = rows[j].cells;
                for(k = 0; k < cells.length; k++) {
                    cell = $(cells[k]);
                    item = cell.children(".year-day-marker");
                    if(item.length > 0) {
                        item.remove();
                    }
                }
            }
        }
    },
    /** 是否可以多选 */
    isMultiple: function() {
        return !!this.calendar.option.yearMultipleSelect;
    },
    /** 获取选中的数据，单选返回单个对象，多选返回数组 */
    getSelection: function() {
        var result = null,
            i, len;
        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                result.push(this._getDateByCell($(this._selectItem[i])));
            }
        } else {
            if(this._current) {
                result = this._getDateByCell(this._current);
            }
        }
        return result;
    },
    /** 设置选中的元素 */
    setSelection: function(dateArray) {
        var months, date, cell,
            i, len;

        if(!Array.isArray(dateArray)) {
            dateArray = [dateArray];
        }
        months = this.yearPanel.children(".year-month-panel");
        for(i = 0, len = dateArray.length; i < len; i++) {
            date = dateArray[i];
            if(!(date instanceof Date)) {
                continue;
            }
            if (date.getFullYear() !== this.year) {
                throw new Error(
                    ui.str.textFormat(
                        "the date({0}) does not belong to {1}", 
                        ui.str.dateFormat(date, "yyyy-MM-dd"),
                        this.year));
            }
            cell = this._getCellByDate(months, date);
            this._selectItem(cell);
        }
    },
    /** 取消选中项 */
    cancelSelection: function() {
        var selectedClass
            elem,
            i, len;

        selectedClass = "selected";
        if(this.isMultiple()) {
            for(i = 0, len = this._selectList.length; i < len; i++) {
                elem = $(this._selectList[i]);
                elem.removeClass(selectedClass);
            }
            this._selectItem = [];
        } else {
            if(this._current) {
                this._current.removeClass(selectedClass);
                this._current = null;
            }
        }
        this.calendar.fire("cancel", this);
    },
    /** 设置大小 */
    setSize: function(width, height) {
        this._setCellSize(width, height);
    },
    /** 获取标题 */
    getTitle: function() {
        return this.year + "年";
    },
    /** 重写toString */
    toString: function() {
        return "ui.ctrls.CalendarView.YearView";
    }
};
// 月视图
function MonthView(calendar) {
    if(this instanceof MonthView) {
        this.initialize();
    } else {
        return new MonthView(calendar);
    }
}
MonthView.prototype = {
    constructor: MonthView,
    initialize: function(calendar) {
        this.calendar = calendar;
        this.year = null;
        this.month = null;
        this.initialled = false;

        this._selectList = [];
        this._current = null;

        this.viewPanel = $("<div class='calendar-view-panel' />");
        this.calendar.element.append(this.viewPanel);
    },
    render: function() {
        if (this.initialled) {
            return;
        }

        // 事件
        this.onMonthItemClickHandler = $(onMouseItemClick, this);

        this._setCurrent();
        this.weekPanel = $("<div class='ui-calendar-month-week-view' />");
        this._createWeek();

        this.daysPanel = $("<div class='ui-calendar-month-day-view' />");
        this._createDays();

        this.viewPanel
            .append(this.weekPanel)
            .append(this.daysPanel);
        this.initialled = true;
    },
    _setCurrent: function() {
        var date = this.calendar.currentDate;
        this.year = date.getFullYear();
        this.month = date.getMonth();
    },
    _createWeek: function () {
        var weekName,
            colgroup, thead, tr, th,
            i, len;

        this.weekTable = $("<table class='month-week-table unselectable' cellspacing='0' cellpadding='0' />");
        thead = $("<thead />");
        colgroup = $("<colgroup />");
        this.weekTable
            .append(colgroup)
            .append(thead);
        tr = $("<tr />");
        weekNames = this.calendar.getWeekName();
        for(i = 0, len = weekNames.length; i < len; i++) {
            colgroup.append("<col />");
            th = $("<th class='month-week-cell' />");
            if(this.calendar.isWeekend(i)) {
                th.addClass("ui-calendar-weekend");
            }
            th.append("<span class='month-week-text'>星期" + weekNames[i] + "</span>");
            if(i === len - 1) {
                th.addClass("month-week-cell-last");
            }
            tr.append(th);
        }
        thead.append(tr);
        this.weekPanel.append(this.weekTable);
    },
    _createDays: function() {
        var tbody, colgroup, tr, td,
            day, first, last, startIndex,
            today, todayDate, checkTodayFn,
            i, j, index,
            isUpdate = false;

        if (!this.daysTable) {
            this.daysTable = $("<table class='month-days-table unselectable' cellspacing='0' cellpadding='0' />");
        } else {
            this.daysTable.html("");
            isUpdate = true;
        }

        tbody = $("<tbody />");
        colgroup = $("<colgroup />");
        for (i = 0; i < 7; j++) {
            colgroup.append("<col />");
        }
        this.daysTable.append(colgroup).append(tbody);

        day = this.calendar.currentDate;
        first = new Date(day.getFullYear(), day.getMonth(), 1);
        last = (new Date(first.getFullYear(), first.getMonth() + 1, 0)).getDate();
        first = 1;

        startIndex = this.calendar.getWeekIndexOf(first);
        today = new Date();
        todayDate = today.getDate();
        if (today.getFullYear() === day.getFullYear() && today.getMonth() === day.getMonth()) {
            checkTodayFn = function(elem, d) {
                if(d === todayDate) {
                    elem.children().children(".month-date").addClass("font-highlight");
                }
            };
        }

        index = first;
        for(i = 0; i < 6; i++) {
            tr = $("<tr />");
            for (j = 0; j < 7; j++) {
                td = $("<td class='month-days-cell' />");
                td.append("<div class='day-container' />");
                if(this.calendar.isWeekend(j)) {
                    td.addClass("month-days-cell-weekend");
                }
                if(j === 6) {
                    td.addClass("month-days-cell-last");
                }
                tr.append(td);
                if (i === 0 && j < startIndex) {
                    continue;
                } else if (first > last) {
                    continue;
                }

                td.children().html("<span class='month-date'>" + first + "</span>");
                if(checkTodayFn) {
                    checkTodayFn.call(this, td, index);
                }
                index++;
            }
            tbody.append(tr);
            if(index > last) {
                break;
            }
        }
        this.daysPanel.append(this.daysTable);
        if(!isUpdate) {
            this.daysTable.click(this.onMonthItemClickHandler);
        }
    },
    _setCellSize: function (width, height) {
        var unitWidth,
            rows, cells,
            unitHeight,
            lastHeight,
            prefix, weekNames,
            i, len;

        unitWidth = this._setCellWidth(width);
        rows = this.daysTable[0].rows;
        len = rows.length;
        // 减去边框
        height -= len;
        unitHeight = Math.floor(height / len);
        lastHeight = height - unitHeight * (len - 1);

        for(i = 0; i < len; i++) {
            if(i < len - 1) {
                $(rows[i]).children().css("min-height", unitHeight + "px");
            } else {
                $(rows[i]).children().css("min-height", lastHeight + "px");
            }
        }

        cells = this.weekTable[0].tHead.rows[0].cells;
        prefix = "";
        weekNames = this.calendar.getWeekNames();
        if(unitWidth >= 60) {
            prefix = "星期";
        }
        for(i = 0, len = cells.length; i < len; i++) {
            $(cells[i]).children().text(prefix + weekNames[i]);
        }
    },
    _setCellWidth: function (width) {
        var unitWidth,
            wcols,
            dcols;
        
        unitWidth = Math.floor(width / 7);
        wcols = this.weekTable.chldren("colgroup").children("col");
        dcols = this.daysTable.chldren("colgroup").children("col");

        wcols.splice(6, 1);
        dcols.splice(6, 1);
        wcols.css("width", unitWidth + "px");
        dcols.css("width", unitWidth + "px");

        return unitWidth;
    },
    _changeMonth: function(monthDate) {
        this.calendar.currentDate = monthDate;
        this.year = this.calendar.currentDate.getFullYear();
        this.month = this.calendar.currentDate.getMonth();

        this._createDays();
        this._setCellSize(this.viewPanel.width(), this.viewPanel.height() - 26);

        this._current = null;
        this._selectList = [];
    },
    _isDateCell: function(td) {
        return td.children(".day-container").children().length > 0;
    },
    _getDateByCell: function(elem) {
        var container,
            day;

        container = elem.children(".day-container");
        day = container.children(".month-date");
        if(day.length === 0) {
            return null;
        }

        day = parseInt(day.text(), 10);
        return new Date(this.year, this.month, day);
    },
    _getCellByDate: function(date) {
        var rows,
            indexer,
            dayCell;

        rows = this.daysTable[0].tBodies[0].rows;
        indexer = this.calendar.getTableIndexOfMonth(date);
        dayCell = $(rows[indexer.rowIndex].cells[indexer.cellIndex]);
        return dayCell;
    },
    _selectItem: YearView.prototype._selectItem,
    _updateSchedules: function(data, dateField, action) {
        var getDateFn, date, dayCell,
            i, len, item, 
            isFunctionValue;

        if(Array.isArray(data)) {
            return;
        }
        if(!dateField) {
            dateField = "date";
        }
        if(ui.core.isFunction(dateField)) {
            getDateFn = dateField; 
        } else {
            getDateFn = function() {
                return this[dateField];
            };
        }
        isFunctionValue = ui.core.isFunction(action);

        for(i = 0, len = data.length; i < len; i++) {
            item = data[i];
            if(!(item instanceof Date)) {
                date = getDateFn.call(item);
                if(!(date instanceof Date)) {
                    continue;
                }
            } else {
                date = item;
            }
            dayCell = this._getCellByDate(date);
            if(isFunctionValue) {
                action.call(dayCell, item);
            }
        }
    },
    // API
    /** 检查是否需要更新 */
    checkChange: function () {
        var day;
        this.calendar.hideTimeLine();
        day = this.calendar.currentDate;
        if (this.year === day.getFullYear() && this.month === day.getMonth()) {
            return false;
        }
        this._changeMonth(day);
        return true;
    },
    /** 激活 */
    active: noop,
    /** 休眠 */
    dormant: noop,
    /** 向前切换 */
    previous: function() {
        var day = this.calendar.currentDate;
        this._changeMonth(new Date(day.setMonth(day.getMonth() - 1)));
    },
    /** 向后切换 */
    next: function() {
        var day = this.calendar.currentDate;
        this._changeMonth(new Date(day.setMonth(day.getMonth() + 1)));
    },
    /** 切换到当前 */
    today: function(day) {
        if (!day || !(day instanceof Date)) {
            day = new Date();
        }
        this._changeMonth(new Date(day.getTime()));
    },
    /** 添加日程信息 */
    addSchedules: function(data, dateField, action) {
        var option,
            getValueFn;
        if(ui.core.isPlainObject(data)) {
            option = data;
            data = option.data;
            dateField = option.dateField;
            action = option.action;
        }
        if(ui.core.isFunction(option.idField)) {
            getValueFn = option.idField;
        } else {
            getValueFn = function() {
                return this[option.idField] || null;
            };
        }
        if(!ui.core.isFunction(action)) {
            action = function(item) {
                var scheduleList,
                    items,
                    container,
                    builder;
                
                container = this.children("day-container");
                scheduleList = container.children(".schedule-list");
                
                if(scheduleList.length === 0) {
                    scheduleList = $("<ul class='schedule-list' />");
                    scheduleList.data("schedule-items", []);
                    container.append(scheduleList);
                }

                items = scheduleList.data("schedule-items");
                items.push(item);

                builder = [];
                builder.push("<li class='schedule-item'>");
                builder.push("<b class='schedule-border'></b>");
                builder.push("<span class='schedule-text'>", getValueFn.call(item), "</span>");
                builder.push("</li>");
                scheduleList.append(builder.join(""));
            };
        }
        this._updateSchedules(data, dateField, action);
    },
    /** 移除日程信息 */
    removeSchedules: function(data, dateField, action) {
        var option,
            getValueFn;
        if(ui.core.isPlainObject(data)) {
            option = data;
            data = option.data;
            dateField = option.dateField;
            action = option.action;
        }
        if(ui.core.isFunction(option.idField)) {
            getValueFn = option.idField;
        } else {
            getValueFn = function() {
                return this[option.idField] || null;
            };
        }
        if(!ui.core.isFunction(action)) {
            action = function(item) {
                var container,
                    scheduleList,
                    items,
                    children,
                    index,
                    i, len, scheduleItem;
                
                container = this.children("day-container");
                scheduleList = container.children(".schedule-list");
                
                if(scheduleList.length === 0) {
                    return;
                }

                items = scheduleList.data("schedule-items");
                index = -1;
                for(i = 0, len = items.length; i < len; i++) {
                    scheduleItem = items[i];
                    if(getValueFn.call(scheduleItem) === getValueFn.call(item)) {
                        index = i;
                        break;
                    }
                }
                if(index > -1) {
                    $(scheduleList.children()[index]).remove();
                    items.splice(index, 1);
                }
            };
        }
        this._updateSchedules(data, dateField, action);
    },
    /** 清空日程信息 */
    clearSchedules: function(removeAction) {
        var cell,
            scheduleList,
            i, len;
        
        i = 1;
        len = (new Date(this.year, this.month + 1, 0)).getDate();
        if(!ui.core.isFunction(removeAction)) {
            removeAction = function() {
                var container,
                    scheduleList;
                container = this.children("day-container");
                scheduleList = container.children(".schedule-list");
                scheduleList.removeData("schedule-items");
                scheduleList.remove();
            };
        }
        for (; i <= len; i++) {
            cell = this._getCellByDate(new Date(this.year, this.month, i));
            removeAction.call(cell);
        }
    },
    /** 是否可以多选 */
    isMultiple: function() {
        return !!this.calendar.option.monthMultipleSelect;
    },
    /** 获取选中的数据，单选返回单个对象，多选返回数组 */
    getSelection: YearView.prototype.getSelection,
    /** 设置选中的元素 */
    setSelection: function(dateArray) {
        var date, cell,
            i, len;
        if(!Array.isArray(dateArray)) {
            dateArray = [dateArray];
        }
        for(i = 0, len = dateArray.length; i < len; i++) {
            date = dateArray[i];
            if(!(date instanceof Date)) {
                continue;
            }
            if (date.getFullYear() !== this.year || date.getMonth() !== this.month) {
                throw new Error(
                    ui.str.textFormat(
                        "the date({0}) does not belong to {1}-{2}", 
                        ui.str.dateFormat(date, "yyyy-MM-dd"),
                        this.year,
                        this.month));
            }
            cell = this._getCellByDate(date);
            this._selectItem(cell);
        }
    },
    /** 取消选中项 */
    cancelSelection: YearView.prototype.cancelSelection,
    /** 设置视图的尺寸 */
    setSize: function(width, height) {
        // 减去head的高度
        height -= 26;
        this.daysPanel.css("height", height + "px");
        this._setCellSize(width, height);
    },
    /** 获取月视图标题 */
    getTitle: function() {
        return this.year + "年" + (this.month + 1) + "月";
    },
    /** 重写toString方法 */
    toString: function() {
        return "ui.ctrls.CalendarView.MonthView";
    }
};
// 周视图
function WeekView(calendar) {
    if(this instanceof WeekView) {
        this.initialize();
    } else {
        return new WeekView(calendar);
    }
}
WeekView.prototype = {
    constructor: WeekView,
    initialize: function(calendar) {
        this.calendar = calendar;
    },
    render: function() {
        
    }
};
// 日视图
function DayView(calendar) {
    if(this instanceof DayView) {
        this.initialize();
    } else {
        return new DayView(calendar);
    }
}
DayView.prototype = {
    constructor: DayView,
    initialize: function(calendar) {
        this.calendar = calendar;
    },
    render: function() {
        
    }
};
// 选择器
function Selector() {
    if(this instanceof Selector) {
        this.initialize();
    } else {
        return new Selector(calendar);
    }
}
Selector.prototype = {
    constructor: Selector,
    initialize: function() {

    }
}

viewTypes = {
    "YEARVIEW": YearView,
    "MONTHVIEW": MonthView,
    "WEEKVIEW": WeekView,
    "DAYVIEW": DayView
};
ui.define("ui.ctrls.CalendarView", {
    _defineOption: function() {
        return {
            // 要包含的日历视图，YearView: 年视图, MonthView: 月视图, WeekView: 周视图, DayView: 天视图
            views: ["YearView", "MonthView", "WeekView", "DayView"],
            // 默认显示的视图，如果不写则默认为第一个视图
            defaultView: "WeekView",
            // 周视图和天视图的单位时间
            unitTime: 30,
            // 星期天是否为一周的第一天
            sundayFirst: false,
            // 开始日期
            startDate: null,
            // 年是否可以多选
            yearMultipleSelect: false,
            // 月是否可以多选
            monthMultipleSelect: false
        };
    },
    _defineEvents: function() {
        return [
            //日历视图切换前
            "viewChanging", 
            //日历视图切换后
            "viewChanged", 
            //日历内容更新前
            "changing", 
            //日历内容更新后
            "changed", 
            //日历选择前
            "selecting", 
            //日历选择后
            "selected",
            //日历取消选择
            "deselected",
            //周和日视图标题点击
            "weekTitleClick",
            //取消选中
            "cancel"
        ];
    },
    _create: function() {
        var value;
        if (!ui.core.isNumber(this.option.unitTime)) {
            this.option.unitTime = 30;
        } else {
            value = 60 / this.option.unitTime;
            if (value % 2) {
                value -= 1;
                this.option.unitTime = 60 / value;
            }
        }

        this.views = {};

        if(!ui.core.isString(this.option.defaultView) || this.option.defaultView.length === 0) {
            this.option.defaultView = "WeekView";
        }

        if (this.option.startDate instanceof Date) {
            this.currentDate = this.option.startDate;
        } else {
            this.currentDate = new Date();
        }

        this.viewChangeAnimator = ui.animator({
            ease: ui.AnimationStyle.easeTo,
            onChange: function (val, elem) {
                elem.css("left", val + "px");
            }
        });
        this.viewChangeAnimator.addTarget({
            ease: ui.AnimationStyle.easeFrom,
            onChange: function (val, elem) {
                elem.css("opacity", val / 100);
            }
        });
        this.viewChangeAnimator.duration = 500;
    },
    _render: function() {
        var i, len,
            viewName;

        this.element
            .addClass("ui-calendar-view")
            .css("position", "relative");

        for (i = 0, len = this.option.views.length; i < len; i++) {
            viewName = this.option.views[i];
            if(!ui.core.isString(viewName)) {
                continue;
            }
            viewName = viewName.toUpperCase();
            if (viewTypes.hasOwnProperty(viewName)) {
                this.views[viewName] = viewTypes[viewName](this);
            }
        }

        if(!this.hasView(this.option.defaultView)) {
            for(i in this.views) {
                if(this.views.hasOwnProperty(i)) {
                    this.option.defaultView = i;
                    break;
                }
            }
        }
        this.changeView(this.option.defaultView, false);
    },
    _getTimeCellCount: function () {
        return Math.floor(60 / this.option.unitTime) || 1;
    },
    _timeToCellNumber: function(time) {
        var arr,
            count,
            hour,
            minute,
            second;
        arr = time.split(":");
        count = this._getTimeCellCount();
        hour = parseInt(arr[0], 10);
        minute = parseInt(arr[1], 10);
        second = parseInt(arr[2], 10);
        return (hour + minute / 60) * count;
    },
    _doChange: function(actionName) {
        if(this.fire("changing", this.currentView, actionName) === false) {
            return;
        }
        this.currentView[actionName].call(this.currentView);
        this.fire("changed", this.currentView, actionName);
    },

    //API
    /** 一周的开始是否是星期天 */
    isSundayFirst: function() {
        return !!this.option.sundayFirst;
    },
    /** 获取一个日期所在周的所有日期 */
    getWeek: function(date) {
        var days = null,
            week, firstDay,
            i, len;
        if(date instanceof Date) {
            date = new Date(date.getTime());
            days = [];
            len = 7;
            if(this.isSundayFirst()) {
                week = date.getDay();
                date.setDate(date.getDate() - week);
            } else {
                week = date.getDay() || len;
                date.setDate(date.getDate() - week + 1);
            }
            firstDay = new Date(date.getTime());
            days.push(firstDay);
            for(i = 1; i < len; i++) {
                days.push(new Date(date.setDate(date.getDate() + 1)));
            }
        }
        return days;
    },
    /** 获取一个日期所在周的第一天日期和最后一天日期 */
    getWeekStartEnd: function(date) {
        var week,
            result = null;
        if(date instanceof Date) {
            date = new Date(date.getTime());
            result = {
                year: date.getFullYear(),
                month: date.getMonth() + 1
            };
            if(this.isSundayFirst()) {
                week = date.getDay();
                date.setDate(date.getDate() - week);
            } else {
                week = date.getDay() || 7;
                date.setDate(date.getDate() - week + 1);
            }

            result.weekStartDate = new Date(date.getTime());
            result.weekStartDay = result.weekStartDate.getDate();
            result.weekEndDate = new Date(date.setDate(date.getDate() + 6));
            result.weekEndDay = result.weekEndDate.getDate();
        }
    },
    /** 获取日期所在的周的列索引 */
    getWeekIndexOf: function(date) {
        var index = null;
        if(date instanceof Date) {
            index = date.getDay();
            if(!this.isSundayFirst()) {
                if(index === 0) {
                    index = 6;
                } else {
                    index--;
                }
            }
        }
        return index;
    },
    /** 获取周末的索引 */
    getWeekendIndexes: function() {
        var result = {
            saturday: 6,
            sunday: 0
        };
        if (!this.isSundayFirst()) {
            result.saturday = 5;
            result.sunday = 6;
        }
        return result;
    },
    /** 判断是否是周末 */
    isWeekend: function(weekDay) {
        if(this.isSundayFirst()) {
            return weekDay === 6 || weekDay === 0;
        } else {
            return weekDay === 5 || weekDay === 6;
        }
    },
    /** 获取月份的索引rowIndex, cellIndex */
    getTableIndexOf: function(date) {
        var first,
            startIndex,
            day,
            result = null;
        if(date instanceof Date) {
            first = new Date(date.getFullYear(), date.getMonth(), 1);
            startIndex = this.getWeekIndexOfDate(first);
            day = date.getDate() + startIndex - 1;
            result = {
                rowIndex: Math.floor(day / 7),
                cellIndex: 0
            };
            result.cellIndex = day - result.rowIndex * 7;
        }
        return result;
    },
    /** 获取周的名称 */
    getWeekNames: function() {
        if (this.isSundayFirst()) {
            return sundayFirstWeek;
        } else {
            return mondayFirstWeek;
        }
    },
    /** 将周视图和日视图中的索引转换成对应的时间 */
    indexToTime: function(index) {
        var count,
            hour,
            arr,
            text;
        
        count = this._getTimeCellCount();
        hour = twoNumberFormatter(index / count);
        arr = hour.split(".");
        text = arr[0] + ":";
        if(arr.length > 1) {
            text += twoNumberFormatter(parseFloat("0." + arr[1]) * 60);
        } else {
            text += "00";
        }
        return text;
    },
    /** 将时间转换为周视图和日视图的索引 */
    timeToIndex: function(time) {
        if(!time) {
            time = "00:00";
        }
        return Math.ceil(this._timeToCellNumber(time));
    },
    /** 将时间转换为周视图和日视图对应的position */
    timeToPosition: function(time) {
        if(!time) {
            time = "00:00";
        }
        return this._timeToCellNumber(time) * unitHeight;
    },
    /** 显示周视图和日视图的当前时间指示器 */
    showTimeLine: function(parent, unitHourHeight) {
        var updateInterval,
            updateTimeFn,
            that,
        if(!this.currentTimeElement) {
            this.currentTimeElement = $("<div class='ui-current-time border-highlight font-highlight' />");
            this.currentTimeElement.css("width", timeTitleWidth + "px");
            this.element.append(this.currentTimeElement);
        } else {
            this.currentTimeElement.css("display", "block");
        }
        if(this._timeoutHandler) {
            clearTimeout(this._timeoutHandler);
        }

        // 30秒更新一次
        updateInterval = 30 * 1000;
        that = this;
        updateTimeFn = function() {
            var time,
                index,
                top,
                elem;

            time = formatTime(new Date());
            index = that.timeToIndex(time);
            top = that.timeToPosition(time, unitHourHeight);
            elem = that.currentTimeElement;
            
            elem.html("<span class='ui-current-time-text'>" + time.substring(0, 5) + "</span>");
            if(index === 0) {
                elem.addClass("ui-current-time-top").css("top", top + "px");
            } else {
                elem.removeClass("ui-current-time-top").css("top", top - ui.scrollbarWidth + "px");
            }
            that._timeoutHandler = setTimeout(arguments.callee, updateInterval);
        };
        this._timeoutHandler = setTimeout(updateTimeFn);
    },
    /** 隐藏周视图和日视图的当前时间指示器 */
    hideTimeLine: function() {
        if(this._timeoutHandler) {
            clearTimeout(this._timeoutHandler);
        }
        if(this.currentTimeElement) {
            this.currentTimeElement.css("display", "none");
        }
    },
    /** 当前视图向前切换 */
    previous: function() {
        this._doChange("previous");
    },
    /** 当前视图向后切换 */
    next: function() {
        this._doChange("next");
    },
    /** 当前视图切换到今天所在 */
    today: function() {
        this._doChange("today");
    },
    /** 判断是否包含view视图 */
    hasView: function(viewName) {
        return this.views.hasOwnProperty(viewName + "");
    },
    /** 判断视图是否为某个名称的视图 */
    isView: function(view, viewName) {
        if(!view) {
            return false;
        }
        viewName = (viewName + "").toUpperCase();
        return view.toString().toUpperCase().lastIndexOf(viewName) !== -1;
    },
    /** 获取注册的视图 */
    getView: function(viewName) {
        viewName = (viewName + "").toUpperCase();
        if (this.views.hasOwnProperty(viewName)) {
            return this.views[viewName];
        } else {
            return null;
        }
    },
    /** 切换视图 */
    changeView: function(viewName, animation) {
        var view,
            isInitialled,
            isChanged,
            width,
            that,
            option,
            endFn;
        
        view = this.views[(viewName + "").toLowerCase()];
        if(!view) {
            throw new Error(ui.str.textFormat("没有注册名为{0}的视图", viewName));
        }

        if(this.fire("viewChanging", this.currentView, view) === false) {
            return;
        }

        if (this.currentView) {
            this.viewChangeAnimator.stop();
            this.currentView.viewPanel.css({
                "display": "none",
                "opacity": 0
            });
            this.currentView.dormant();
        }
        isInitialled = false;
        if(!view.initialled) {
            view.render();
            isInitialled = true;
        }
        isChanged = view.checkChange();
        view.setSize(this.element.width(), this.element.height());
        this.currentView = view;

        that = this;
        endFn = function() {
            that.currentView.active();
            that.fire("viewChanged", that.currentView);
            if (isInitialled || isChanged) {
                that.fire("changed", that.currentView);
            }
        };

        if(animation === false) {
            this.currentView.viewPanel.css({
                "display": "block",
                "left": "0",
                "opacity": 1
            });
            endFn();
            return;
        }

        width = this.element.width();
        this.currentView.viewPanel.css({
            "display": "block",
            "left": (width / 3) + "px"
        });
        option = this.viewChangeAnimator[0];
        option.target = this.currentView.viewPanel;
        option.begin = width / 3;
        option.end = 0;

        option = this.viewChangeAnimator[1];
        option.target = this.currentView.viewPanel;
        option.begin = 0;
        option.end = 100;

        this.viewChangeAnimator.onEnd = endFn;
        this.viewChangeAnimator.start();
    },
    /** 设置大小 */
    setSize: function(width, height) {
        this.element.css("height", height + "px");
        this.currentView.setSize(width, height);
    },
    /** 获取当前视图的标题文字信息 */
    getTitle: function() {
        return this.currentView.getTitle();
    }
});

$.fn.calendarView = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.CalendarView(option, this);
};
