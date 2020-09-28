// CalendarView
var controlName = "ui.ctrls.CalendarView",
    timeTitleWidth = 80,
    hourHeight = 25,
    currentTimeLineHeight = 17,
    viewTypes,
    language = ui.i18n("control", controlName);

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
function defaultFormatDateHeadText(date) {
    return [
        "<span", this.calendar.isWeekend(date.getDay()) ? " class='ui-calendar-weekend'" : "", ">",
        (date.getMonth() + 1), " / ", date.getDate(), 
        "（" + language.sundayFirstWeek[date.getDay()],  "）", 
        "</span>"
    ].join("");
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

    if(elem[0] !== e.target) {
        elem.context = e.target;
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

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    this._selectItem(elem);
}
// 周视图标题点击事件
function onWeekHeadItemClick(e) {
    var th = $(e.target),
        eventData,
        nodeName;
    while ((nodeName = th.nodeName()) !== "TH") {
        if(nodeName === "TABLE") {
            return;
        }
        th = th.parent();
    }
    eventData = {
        view: this,
        index: th[0].cellIndex
    };
    this.calendar.fire("weekTitleClick", eventData);
}
// 日视图标题点击事件
function onDayHeadItemClick(e) {
    var eventData = {
        view: this,
        index: 0
    };
    this.calendar.fire("weekTitleClick", eventData);
}

// 年视图
function YearView(calendar) {
    if(this instanceof YearView) {
        this.initialize(calendar);
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

        this.width = null;
        this.height = null;

        this.viewPanel = $("<div class='calendar-view-panel' />");
        this.calendar.element.append(this.viewPanel);
    },
    render: function() {
        if (this.initialled) {
            return;
        }

        // 日期项点击事件
        this.onYearItemClickHandler = onYearItemClick.bind(this);

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
                    .append("<span class='font-highlight'>" + (i + 1) + language.monthUnit + "</span>"));
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

        if(!width || !height) {
            return;
        }
        if(this.width === width && this.height === height) {
            return;
        }

        this.width = width;
        this.height = height;

        count = this.getMonthCount(width);
        if (count % 2) {
            oddFn = this._oddStyle;
        } else {
            oddFn = this._evenStyle;
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
            cell.css({
                width: unitWidth + "px",
                height: unitHeight + "px"
            });
            cell.children(".year-month-content")
                .css("height", unitHeight - 40 + "px");
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
            row.append(flag + "<span>" + week[i] + "</span></th>");
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
                row.append(cell);
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
        indexer = this.calendar.getTableIndexOf(date);
        dayCell = $(month.children()[0].tBodies[0].rows[indexer.rowIndex].cells[indexer.cellIndex]);
        return dayCell;
    },
    _selectItem: function(elem) {
        var eventData,
            selectedClass = "selected",
            i, len;
        if (!this._isDateCell(elem)) {
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
                if(this._current[0] === elem[0]) {
                    this.calendar.fire("deselected", eventData);
                    return;
                }
                this._current = null;
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

        if(!Array.isArray(data)) {
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
    removeSchedules: function(data, dateField, action) {
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
                result.push(this._getDateByCell($(this._selectList[i])));
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
                    ui.str.format(
                        "the date({0}) does not belong to {1}", 
                        ui.date.format(date, "yyyy-MM-dd"),
                        this.year));
            }
            cell = this._getCellByDate(months, date);
            this._selectItem(cell);
        }
    },
    /** 取消选中项 */
    cancelSelection: function() {
        var selectedClass,
            elem,
            i, len;

        selectedClass = "selected";
        if(this.isMultiple()) {
            for(i = 0, len = this._selectList.length; i < len; i++) {
                elem = $(this._selectList[i]);
                elem.removeClass(selectedClass);
            }
            this._selectList = [];
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
        return this.year + language.yearUnit;
    },
    /** 重写toString */
    toString: function() {
        return "ui.ctrls.CalendarView.YearView";
    }
};
// 月视图
function MonthView(calendar) {
    if(this instanceof MonthView) {
        this.initialize(calendar);
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

        this.width = null;
        this.height = null;

        this.viewPanel = $("<div class='calendar-view-panel' />");
        this.calendar.element.append(this.viewPanel);
    },
    render: function() {
        if (this.initialled) {
            return;
        }

        // 事件
        this.onMonthItemClickHandler = onMouseItemClick.bind(this);

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
        var weekNames,
            colgroup, thead, tr, th,
            i, len;

        this.weekTable = $("<table class='month-week-table unselectable' cellspacing='0' cellpadding='0' />");
        thead = $("<thead />");
        colgroup = $("<colgroup />");
        this.weekTable
            .append(colgroup)
            .append(thead);
        tr = $("<tr />");
        weekNames = this.calendar.getWeekNames();
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
            i, j, index;

        if (!this.daysTable) {
            this.daysTable = $("<table class='month-days-table unselectable' cellspacing='0' cellpadding='0' />");
            this.daysTable.click(this.onMonthItemClickHandler);
        } else {
            this.daysTable.html("");
        }

        tbody = $("<tbody />");
        colgroup = $("<colgroup />");
        for (i = 0; i < 7; i++) {
            colgroup.append("<col />");
        }
        this.daysTable.append(colgroup).append(tbody);

        day = this.calendar.currentDate;
        first = new Date(day.getFullYear(), day.getMonth(), 1);
        startIndex = this.calendar.getWeekIndexOf(first);
        last = (new Date(first.getFullYear(), first.getMonth() + 1, 0)).getDate();
        first = 1;

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
                tr.append(td);
                if (i === 0 && j < startIndex) {
                    continue;
                } else if (index > last) {
                    continue;
                }

                td.append("<div class='day-container' />");
                if(this.calendar.isWeekend(j)) {
                    td.addClass("month-days-cell-weekend");
                }
                if(j === 6) {
                    td.addClass("month-days-cell-last");
                }

                td.children().html("<span class='month-date'>" + index + "</span>");
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
    },
    _setCellSize: function (width, height) {
        var unitWidth,
            rows, cells,
            unitHeight,
            lastHeight,
            prefix, weekNames,
            i, len;

        if(!width || !height) {
            return;
        }
        if(this.width === width && this.height === height) {
            return;
        }

        this.width = width;
        this.height = height;
        // 减去head的高度
        height -= 26;
        this.daysPanel.css("height", height + "px");

        unitWidth = this._setCellWidth(width);
        rows = this.daysTable[0].rows;
        len = rows.length;
        // 减去边框
        height -= len;
        unitHeight = Math.floor(height / len);
        lastHeight = height - unitHeight * (len - 1);

        for(i = 0; i < len; i++) {
            if(i < len - 1) {
                $(rows[i]).children().css("height", unitHeight + "px");
            } else {
                $(rows[i]).children().css("height", lastHeight + "px");
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
        wcols = this.weekTable.children("colgroup").children();
        dcols = this.daysTable.children("colgroup").children("col");

        wcols.splice(6, 1);
        dcols.splice(6, 1);
        wcols.css("width", unitWidth + "px");
        dcols.css("width", unitWidth + "px");

        return unitWidth;
    },
    _changeMonth: function(monthDate) {
        this.calendar.currentDate = monthDate;

        this._setCurrent();
        this._createDays();
        this._setCellSize(this.viewPanel.width(), this.viewPanel.height());

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
        indexer = this.calendar.getTableIndexOf(date);
        dayCell = $(rows[indexer.rowIndex].cells[indexer.cellIndex]);
        return dayCell;
    },
    _selectItem: YearView.prototype._selectItem,
    _updateSchedules: function(data, dateField, action) {
        var getDateFn, date, dayCell,
            i, len, item, 
            isFunctionValue;

        if(!Array.isArray(data)) {
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
        this.width = null;
        this.height = null;
        this._changeMonth(new Date(day.setMonth(day.getMonth() - 1)));
    },
    /** 向后切换 */
    next: function() {
        var day = this.calendar.currentDate;
        this.width = null;
        this.height = null;
        this._changeMonth(new Date(day.setMonth(day.getMonth() + 1)));
    },
    /** 切换到当前 */
    today: function(day) {
        if (!day || !(day instanceof Date)) {
            day = new Date();
        }
        this.width = null;
        this.height = null;
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
        } else {
            option = {
                textField: "text"
            };
        }
        if(ui.core.isFunction(option.textField)) {
            getValueFn = option.textField;
        } else {
            getValueFn = function() {
                return this[option.textField] || null;
            };
        }
        if(!ui.core.isFunction(action)) {
            action = function(item) {
                var scheduleList,
                    items,
                    container,
                    builder,
                    itemStyle,
                    borderStyle;
                
                container = this.children(".day-container");
                scheduleList = container.children(".schedule-list");
                
                if(scheduleList.length === 0) {
                    scheduleList = $("<ul class='schedule-list' />");
                    scheduleList.data("schedule-items", []);
                    container.append(scheduleList);
                }

                items = scheduleList.data("schedule-items");
                items.push(item);

                if(item.backgroundColor) {
                    itemStyle = " style='background-color:" + item.backgroundColor + "'";
                }
                if(item.borderColor) {
                    borderStyle = " style='background-color:" + item.borderColor + "'";
                }

                builder = [];
                builder.push("<li class='schedule-item'", itemStyle, ">");
                builder.push("<b class='schedule-border'", borderStyle, "></b>");
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
        } else {
            option = {
                idField: function() {
                    return this;
                }
            };
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
                
                container = this.children(".day-container");
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
        
        len = (new Date(this.year, this.month + 1, 0)).getDate();
        if(!ui.core.isFunction(removeAction)) {
            removeAction = function() {
                var container,
                    scheduleList;
                container = this.children(".day-container");
                scheduleList = container.children(".schedule-list");
                scheduleList.removeData("schedule-items");
                scheduleList.remove();
            };
        }
        for (i = 1; i <= len; i++) {
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
                    ui.str.format(
                        "the date({0}) does not belong to {1}-{2}", 
                        ui.date.format(date, "yyyy-MM-dd"),
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
        this.initialize(calendar);
    } else {
        return new WeekView(calendar);
    }
}
WeekView.prototype = {
    constructor: WeekView,
    initialize: function(calendar) {
        this.calendar = calendar;
        this.startDate = null;
        this.endDate = null;
        this.year = null;
        this.month = null;

        this.todayIndex = -1;
        this.weekDays = null;
        this.weekHours = [];
        this.initialled = false;

        this.width = null;
        this.height = null;

        this.singleSelect = !!this.calendar.option.weekSingleSelect;

        this.viewPanel = $("<div class='calendar-view-panel' />");
        this.calendar.element.append(this.viewPanel);
    },
    render: function() {
        if (this.initialled) {
            return;
        }

        this._formatDayText = this.calendar.option.formatWeekDayHead; 
        if(!ui.core.isFunction(this._formatDayText)) {
            this._formatDayText = defaultFormatDateHeadText;
        }
        // 事件
        this.onWeekHeadItemClickHandler = onWeekHeadItemClick.bind(this);

        this.weekDays = this.calendar.getWeek(this.calendar.currentDate);
        this._setCurrent();

        this.weekDayPanel = $("<div class='ui-calendar-week-view' />");
        this._createWeek();

        this.hourPanel = $("<div class='ui-calendar-hour-panel' />");
        this._createHourName();
        this._createHour();

        this._setTodayStyle();
        this.viewPanel
            .append(this.weekDayPanel)
            .append(this.hourPanel);

        this.selector = Selector(this, this.hourPanel, this.hourTable);
        this.selector.getDateByIndex = function(index) {
            return this.view.weekDays[index];
        };

        this.hourAnimator = ui.animator(this.hourPanel, {
            ease: ui.AnimationStyle.easeTo,
            onChange: function (val, elem) {
                elem.scrollTop(val);
            }
        });
        this.hourAnimator.duration = 800;
        this.initialled = true;
    },
    _setCurrent: function() {
        var day = this.weekDays[0];
        this.startDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
        day = this.weekDays[6];
        this.endDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

        this.year = day.getFullYear();
        this.month = day.getMonth();
    },
    _createWeek: function() {
        var thead, 
            colgroup,
            tr, th, date, 
            i, day;

        this.weekTable = $("<table class='ui-calendar-weekday unselectable' cellspacing='0' cellpadding='0' />");
        thead = $("<thead />");
        colgroup = $("<colgroup />");
        tr = $("<tr />");
        for(i = 0; i < 7; i++) {
            day = this.weekDays[i];
            colgroup.append("<col />");

            th = $("<th class='weekday-cell' />");
            th.html(this._formatDayText(day));
            tr.append(th);
        }

        thead.append(tr);
        this.weekTable.append(colgroup).append(thead);
        this.weekDayPanel.append(this.weekTable);

        this.weekTable.click(this.onWeekHeadItemClickHandler);
    },
    _createHourName: function() {
        var table, colgroup, tbody, 
            tr, td,
            i, j, unitCount;

        this.hourNames = $("<div class='hour-name-panel' />");
        table = $("<table class='hour-name-table unselectable' cellspacing='0' cellpadding='0' />");
        colgroup = $("<colgroup />");
        // 特殊的结构，保持表格高度一致，包括边框的高度
        colgroup
            .append("<col style='width:0px;' />")
            .append("<col />");
        table.append(colgroup);
        tbody = $("<tbody />");

        unitCount = this.calendar._getTimeCellCount();
        for (i = 0; i < 24; i++) {
            for(j = 0; j < unitCount; j++) {
                tr = $("<tr />");
                td = $("<td class='hour-name-cell' />");
                if((j + 1) % unitCount) {
                    td.addClass("hour-name-cell-odd");
                }
                tr.append(td);
                if(j === 0) {
                    td = $("<td class='hour-name-cell' rowspan='" + unitCount + "' />");
                    td.append("<h3 class='hour-name-text'>" + i + "</h3>");
                    tr.append(td);
                }
                tbody.append(tr);
            }
        }
        table.append(tbody);
        this.hourNames.append(table);
        this.hourPanel.append(this.hourNames);
    },
    _createHour: function() {
        var tbody, colgroup, tr, td,
            i, len, j, unitCount;

        this.weekHour = $("<div class='week-hour-panel' />");
        this.hourTable = $("<table class='week-hour-table unselectable' cellspacing='0' cellpadding='0' />");
        tbody = $("<tbody />");
        colgroup = $("<colgroup />");
        for (i = 0; i < 7; i++) {
            colgroup.append("<col />");
        }

        unitCount = this.calendar._getTimeCellCount();
        len = 24 * unitCount;
        for (i = 0; i < len; i++) {
            tr = $("<tr />");
            for (j = 0; j < 7; j++) {
                td = $("<td class='week-hour-cell' />");
                if (this.calendar.isWeekend(j)) {
                    td.addClass("week-hour-cell-weekend");
                }
                if ((i + 1) % unitCount) {
                    td.addClass("week-hour-cell-odd");
                }
                tr.append(td);
            }
            tbody.append(tr);
        }
        this.hourTable.append(colgroup).append(tbody);
        this.weekHour.append(this.hourTable);
        this.hourPanel.append(this.weekHour);
    },
    _setTodayStyle: function() {
        var today, date,
            table, row,
            i, len;

        today = new Date();
        this.todayIndex = -1;
        for (i = 0; i < 7; i++) {
            date = this.weekDays[i];
            if (date.getFullYear() == today.getFullYear() && date.getMonth() == today.getMonth() && date.getDate() == today.getDate()) {
                this.todayIndex = i;
                break;
            }
        }
        if (this.todayIndex < 0) {
            return;
        }

        table = this.hourTable[0];
        for (i = 0, len = table.rows.length; i < len; i++) {
            row = table.rows[i];
            $(row.cells[this.todayIndex]).addClass("week-hour-cell-today");
        }
    },
    _clearTodayStyle: function() {
        var rows, cell,
            todayIndex,
            i, len;
        rows = this.hourTable[0].tBodies[0].rows;
        todayIndex = -1;
        for(i = 0, len = rows[0].cells.length; i < len; i++) {
            cell = $(rows[0].cells[i]);
            if(cell.hasClass("week-hour-cell-today")) {
                todayIndex = i;
                break;
            }
        }
        if(todayIndex < 0) {
            return;
        }
        for(i = 0, len = rows.length; i < len; i++) {
            cell = $(rows[i].cells[todayIndex]);
            cell.removeClass("week-hour-cell-today");
        }
    },
    _setCellSize: function (width, height) {
        var scrollWidth = 0,
            realWidth, unitWidth,
            wcols, hcols;

        if(!width || !height) {
            return;
        }
        if(this.width === width && this.height === height) {
            return;
        }

        this.width = width;
        this.height = height;
        
        if (height < this.hourPanel[0].scrollHeight) {
            scrollWidth = ui.scrollbarWidth;
        }
        realWidth = width - timeTitleWidth - scrollWidth;
        unitWidth = Math.floor(realWidth / 7);
        if (unitWidth < 95) {
            unitWidth = 95;
        }

        wcols = this.weekTable.find("col");
        hcols = this.hourTable.find("col");
        this.weekTable.css("width", unitWidth * 7 + "px");
        this.hourTable.css("width", unitWidth * 7 + "px");
        wcols.css("width", unitWidth + "px");
        hcols.css("width", unitWidth + "px");

        if (this.selector.cellWidth > 1) {
            this._restoreSchedules(unitWidth - this.selector.cellWidth);
        }

        this.selector.cellWidth = unitWidth;
        this.selector.cancelSelection();
    },
    _updateWeek: function() {
        var tr, th, day, i;
        tr = this.weekTable[0].tHead.rows[0];
        for (i = 0; i < 7; i++) {
            day = this.weekDays[i];
            th = $(tr.cells[i]);
            th.text(this._formatDayText(day));
            // 将样式恢复成初始值
            th.attr("class", "weekday-cell");
        }
    },
    _addScheduleItem: function(beginCell, endCell, formatAction, scheduleInfo, titleText) {
        var scheduleItem,
            title,
            container,
            bp, ep;
        
        scheduleItem = $("<div class='schedule-item-panel' />");
        title = $("<div class='time-title' />");
        title.html("<span class='time-title-text'>" + titleText + "</span>");
        container = $("<div class='schedule-container' />");
        scheduleItem.append(title).append(container);

        bp = this._getPositionAndSize(beginCell);
        ep = this._getPositionAndSize(endCell);
        scheduleItem.css({
            "top": bp.top + "px",
            "left": bp.left + "px",
            "width": bp.width + "px",
            "height": ep.height + ep.top - bp.top + "px"
        });
        $(this.hourPanel).append(scheduleItem);

        scheduleInfo.itemPanel = scheduleItem;
        this._setScheduleInfo(scheduleInfo.columnIndex, scheduleInfo);
        if (ui.core.isFunction(formatAction)) {
            formatAction.call(this, scheduleInfo, container);
        }
    },
    _findSchedules: function(beginDateArray, action) {
        var i, j, date,
            weekIndex, beginRowIndex, dayItems,
            actionIsFunction;

        actionIsFunction = ui.core.isFunction(action);
        for (i = 0; i < beginDateArray.length; i++) {
            date = beginDateArray[i];
            if (date instanceof Date) {
                weekIndex = this.calendar.getWeekIndexOf(date);
                beginRowIndex = this.calendar.timeToIndex(formatTime(date));
                dayItems = this._getScheduleInfo(weekIndex);
                if (dayItems) {
                    for (j = dayItems.length - 1; j >= 0 ; j--) {
                        if (beginRowIndex === dayItems[j].beginRowIndex) {
                            if(actionIsFunction) {
                                action.call(this, dayItems[j], j, dayItems);
                            }
                        }
                    }
                }
            }
        }
    },
    _restoreSchedules: function(value) {
        var column, left, width,
            i, j, weekDay, panel;

        for (i = 0; i < this.weekHours.length; i++) {
            weekDay = this.weekHours[i];
            if (weekDay) {
                for (j = 0; j < weekDay.length; j++) {
                    panel = weekDay[j].itemPanel;
                    column = weekDay[j].weekIndex;
                    left = parseFloat(panel.css("left"));
                    width = parseFloat(panel.css("width"));
                    panel.css({
                        "left": (left + column * val) + "px",
                        "width": (width + val) + "px"
                    });
                }
            }
        }
    },
    _setScheduleInfo: function(weekIndex, info) {
        var weekDay = this.weekHours[weekIndex];
        if (!weekDay) {
            weekDay = [];
            this.weekHours[weekIndex] = weekDay;
        }
        info.weekIndex = weekIndex;
        weekDay.push(info);
    },
    _getScheduleInfo: function (weekIndex) {
        var weekDay = this.weekHours[weekIndex];
        if (!weekDay) {
            return null;
        }
        return weekDay;
    },
    _changeWeek: function () {
        this.calendar.currentDate = this.weekDays[0];
        this._setCurrent();
        this.clearSchedules();
        this.selector.cancelSelection();
        this._updateWeek();
        
        // 重新标出今天
        this._clearTodayStyle();
        this._setTodayStyle();
    },
    _getUnitHourNameHeight: function() {
        var table;
        if(!this.hourNames) {
            return hourHeight;
        }
        table = this.hourNames.children("table")[0];
        return $(table.tBodies[0].rows[0].cells[1]).outerHeight() / this.calendar._getTimeCellCount();
    },
    _getPositionAndSize: function(td) {
        var position = td.position();
        position.left = position.left + timeTitleWidth;
        position.top = position.top;
        return {
            top: position.top,
            left: position.left,
            width: td.outerWidth() - 1,
            height: td.outerHeight() - 1
        };
    },
    // API
    /** 检查是否需要更新 */
    checkChange: function () {
        var day = this.calendar.currentDate;
        this.calendar.showTimeLine(this.hourPanel, this._getUnitHourNameHeight());
        if (day >= this.startDate && day <= this.endDate) {
            return false;
        }
        this.weekDays = this.calendar.getWeek(day);
        this._changeWeek();
        return true;
    },
    /** 激活 */
    active: function() {
        this.selector.active();
    },
    /** 休眠 */
    dormant: function() {
        this.selector.dormant();
    },
    /** 向前切换 */
    previous: function() {
        var day = this.calendar.currentDate;
        this.weekDays = this.calendar.getWeek(
            new Date(day.getFullYear(), day.getMonth(), day.getDate() - 7));
        this._changeWeek();
    },
    /** 向后切换 */
    next: function() {
        var day = this.calendar.currentDate;
        this.weekDays = this.calendar.getWeek(
            new Date(day.getFullYear(), day.getMonth(), day.getDate() + 7));
        this._changeWeek();
    },
    /** 切换到当前 */
    today: function(day) {
        if (!day || !(day instanceof Date)) {
            day = new Date();
        }
        this.weekDays = this.calendar.getWeek(day);
        this._changeWeek();
    },
    /** 设置显示的时间 */
    setBeginTime: function (beginTime) {
        var height, scrollHeight,
            index, count,
            maxTop, scrollTop,
            option;

        height = this.hourPanel.height();
        scrollHeight = this.hourPanel[0].scrollHeight;
        if (height >= scrollHeight) {
            return;
        }
        this.hourAnimator.stop();
        index = this.calendar.timeToIndex(beginTime);
        count = this.calendar._getTimeCellCount();
        if (index > count) {
            index -= count;
        }
        maxTop = scrollHeight - height;
        scrollTop = index * hourHeight;
        if (scrollTop > maxTop) {
            scrollTop = maxTop;
        }
        option = this.hourAnimator[0];
        option.begin = this.hourPanel.scrollTop();
        option.end = scrollTop;
        this.hourAnimator.start();
    },
    /** 添加日程信息 */
    addSchedules: function(data, beginDateTimeField, endDateTimeField, formatAction, getColumnFn) {
        var getBeginDateTimeFn,
            getEndDateTimeFn,
            scheduleInfo, beginTime, endTime,
            i, len, item;
        if(!Array.isArray(data)) {
            return;
        }

        if(ui.core.isFunction(beginDateTimeField)) {
            getBeginDateTimeFn = beginDateTimeField;
        } else {
            getBeginDateTimeFn = function() {
                return this[beginDateTimeField + ""] || null;
            };
        }
        if(ui.core.isFunction(endDateTimeField)) {
            getEndDateTimeFn = endDateTimeField;
        } else {
            getEndDateTimeFn = function() {
                return this[endDateTimeField + ""] || null;
            };
        }

        if(!ui.core.isFunction(getColumnFn)) {
            getColumnFn = function(date) {
                return this.calendar.getWeekIndexOf(date);
            };
        }

        for(i = 0, len = data.length; i < len; i++) {
            item = data[i];
            scheduleInfo = {
                data: item
            };
            scheduleInfo.beginDate = getBeginDateTimeFn.call(item);
            scheduleInfo.endDate = getEndDateTimeFn.call(item);
            if(!(scheduleInfo.beginDate instanceof Date) || !(scheduleInfo.endDate instanceof Date)) {
                continue;
            }
            scheduleInfo.columnIndex = getColumnFn.call(this, scheduleInfo.beginDate);
            beginTime = formatTime(scheduleInfo.beginDate);
            endTime = formatTime(scheduleInfo.endDate, scheduleInfo.beginDate);
            scheduleInfo.beginRowIndex = this.calendar.timeToIndex(beginTime);
            scheduleInfo.endRowIndex = this.calendar.timeToIndex(endTime) - 1;

            this._addScheduleItem(
                    $(this.hourTable[0].rows[scheduleInfo.beginRowIndex].cells[scheduleInfo.columnIndex]),
                    $(this.hourTable[0].rows[scheduleInfo.endRowIndex].cells[scheduleInfo.columnIndex]),
                    formatAction, scheduleInfo,
                    beginTime.substring(0, 5) + " - " + endTime.substring(0, 5));
        }
    },
    /** 移除日程信息 */
    removeSchedules: function(beginDateArray) {
        this._findSchedules(beginDateArray, function (scheduleInfo, index, itemArray) {
            scheduleInfo.itemPanel.remove();
            itemArray.splice(index, 1);
        });
    },
    /** 查找日程信息并做相应的处理 */
    findSchedules: function(beginDateArray, callback, caller) {
        var action;
        if (beginDateArray instanceof Date) {
            beginDateArray = [beginDateArray];
        }
        if (!Array.isArray(beginDateArray)) {
            return;
        }
        if (!caller) {
            caller = this;
        }
        if (ui.core.isFunction(callback)) {
            action = function() {
                callback.apply(caller, arguments);
            };
        } else {
            action = null;
        }
        this._findSchedules(beginDateArray, action);
    },
    /** 清空日程信息 */
    clearSchedules: function() {
        var i, j,
            weekDay;
        for (i = 0; i < this.weekHours.length; i++) {
            weekDay = this.weekHours[i];
            if (weekDay) {
                for (j = 0; j < weekDay.length; j++) {
                    weekDay[j].itemPanel.remove();
                }
            }
        }
        this.weekHours = [];
    },
    /** 判断是否已经有日程信息 */
    hasSchedule: function(weekIndex) {
        var weekDay = this.weekHours[weekIndex];
        if (!weekDay) {
            return false;
        }
        return weekDay.length > 0;
    },
    /** 设置选中的元素 返回数组 */
    getSelection: function() {
        var hours, date, time,
            i, len,
            result;

        result = [];
        hours = this.selector.getSelection();
        if(!hours) {
            return result;
        }

        date = this.weekDays[hours.weekIndex];
        for(i = 0, len = hours.timeArray.length; i < len; i++) {
            time = hours.timeArray[i];
            result.push(new Date(
                date.getFullYear(), 
                date.getMonth(), 
                date.getDate(), 
                time.hours, 
                time.minutes, 
                time.seconds));
        }
        return result;
    },
    /** 设置选中状态 */
    setSelection: function(start, end) {
        var weekIndex,
            startTime, endTime,
            i, len, date;
        if(!(start instanceof Date) || !(end instanceof Date)) {
            return;
        }
        weekIndex = -1;
        for (i = 0, len = this.weekDays.length; i < len; i++) {
            date = this.weekDays[i];
            if (date.getFullYear() == start.getFullYear() && date.getMonth() == start.getMonth() && date.getDate() == start.getDate()) {
                weekIndex = i;
                break;
            }
        }
        if(weekIndex < 0) {
            return;
        }

        startTime = ui.date.format(start, "hh:mm:ss");
        endTime = ui.date.format(end, "hh:mm:ss");
        this.selector.setSelectionByTime(weekIndex, startTime, endTime);
    },
    /** 取消选中状态 */
    cancelSelection: function() {
        this.selector.cancelSelection();
    },
    /** 这是周视图尺寸 */
    setSize: function (width, height) {
        this.hourPanel.css("height", height - hourHeight + "px");
        this._setCellSize(width, height);
    },
    /** 获取周视图标题 */
    getTitle: function () {
        return ui.str.format(
            "{0}年{1}月{2}日 ~ {3}年{4}月{5}日",
            this.startDate.getFullYear(), 
            this.startDate.getMonth() + 1, 
            this.startDate.getDate(),
            this.endDate.getFullYear(), 
            this.endDate.getMonth() + 1, 
            this.endDate.getDate());
    },
    /** 重写toString方法 */
    toString: function () {
        return "ui.ctrls.CalendarView.WeekView";
    }
};
// 日视图
function DayView(calendar) {
    if(this instanceof DayView) {
        this.initialize(calendar);
    } else {
        return new DayView(calendar);
    }
}
DayView.prototype = {
    constructor: DayView,
    initialize: function(calendar) {
        this.calendar = calendar;
        this.year = null;
        this.month = null;
        this.day = null;
        this.dayHours = [];
        this.initialled = false;

        this.width = null;
        this.height = null;

        this.singleSelect = !!this.calendar.option.daySingleSelect;

        this.viewPanel = $("<div class='calendar-view-panel' />");
        this.calendar.element.append(this.viewPanel);
    },
    render: function() {
        if (this.initialled) {
            return;
        }

        this._formatDayText = this.calendar.option.formatDayHead; 
        if(!ui.core.isFunction(this._formatDayText)) {
            this._formatDayText = defaultFormatDateHeadText;
        }

        // 事件
        this.onDayHeadItemClickHandler = onDayHeadItemClick.bind(this);

        this._setCurrent();

        this.dayPanel = $("<div class='ui-calendar-day-view' />");
        this._createDay();

        this.hourPanel = $("<div class='ui-calendar-hour-panel' />");
        this._createHourName();
        this._createHour();

        this.viewPanel
            .append(this.dayPanel)
            .append(this.hourPanel);

        this.selector = Selector(this, this.hourPanel, this.hourTable);
        this.selector.getDateByIndex = function(index) {
            return new Date(this.view.year, this.view.month, this.view.day);
        };
        
        this.hourAnimator = ui.animator(this.hourPanel, {
            ease: ui.AnimationStyle.easeTo,
            onChange: function (val, elem) {
                elem.scrollTop(val);
            }
        });
        this.hourAnimator.duration = 800;
        this.initialled = true;
    },
    _setCurrent: function () {
        var day = this.calendar.currentDate;
        this.year = day.getFullYear();
        this.month = day.getMonth();
        this.day = day.getDate();
    },
    _createDay: function () {
        this.dayTitle = $("<div class='ui-calendar-day-title' />");
        this.dayTitle.html("<span class='ui-calendar-day-title-text'>" + 
                this._formatDayText(this.calendar.currentDate) + "</span>");
        this.dayPanel.append(this.dayTitle);

        this.dayTitle.click(this.onDayHeadItemClickHandler);
    },
    _createHourName: WeekView.prototype._createHourName,
    _createHour: function() {
        var tbody, tr, td, 
            count, i, len;

        this.weekHour = $("<div class='week-hour-panel' />");
        this.hourTable = $("<table class='week-hour-table unselectable' cellspacing='0' cellpadding='0' />");
        tbody = $("<tbody />");
        count = this.calendar._getTimeCellCount();
        
        for (i = 0, len = 24 * count; i < len; i++) {
            tr = $("<tr />");
            td = $("<td class='week-hour-cell' style='width:100%' />");
            if ((i + 1) % count) {
                td.addClass("week-hour-cell-odd");
            }
            tr.append(td);
            tbody.append(tr);
        }
        this.hourTable.append(tbody);
        this.weekHour.append(this.hourTable);
        this.hourPanel.append(this.weekHour);
    },
    _setCellSize: function (width, height) {
        var scrollWidth = 0,
            realWidth;

        if(!width || !height) {
            return;
        }
        if(this.width === width && this.height === height) {
            return;
        }

        this.width = width;
        this.height = height;

        if (height < this.hourPanel[0].scrollHeight) {
            scrollWidth = ui.scrollbarWidth;
        }
        realWidth = width - timeTitleWidth - scrollWidth - 2;
        this.dayTitle.css("width", realWidth + "px");
        this.hourTable.css("width", realWidth + "px");

        if (this.selector.cellWidth > 1) {
            this._restoreSchedules(realWidth - this.selector.cellWidth);
        }

        this.selector.cellWidth = realWidth;
        this.selector.cancelSelection();
    },
    _addScheduleItem: WeekView.prototype._addScheduleItem,
    _restoreSchedules: function(value) {
        var column, left, width,
            i, panel;
        for (i = 0; i < this.dayHours.length; i++) {
            panel = this.dayHours[i].itemPanel;
            column = this.dayHours[i].weekIndex;
            left = parseFloat(panel.css("left"));
            width = parseFloat(panel.css("width"));
            panel.css({
                "left": (left + column * val) + "px",
                "width": (width + val) + "px"
            });
        }
    },
    _setScheduleInfo: function(weekIndex, info) {
        this.dayHours.push(info);
    },
    _getScheduleInfo: function (weekIndex) {
        return this.dayHours;
    },
    _changeDay: function() {
        this._setCurrent();
        this.clearSchedules();
        this.selector.cancelSelection();
        this.dayTitle.html("<span class='ui-calendar-day-title-text'>" 
                + this._formatDayText(this.calendar.currentDate) 
                + "</span>");
    },
    _getUnitHourNameHeight: WeekView.prototype._getUnitHourNameHeight,
    _getPositionAndSize: WeekView.prototype._getPositionAndSize,

    // API
    /** 检查是否需要更新 */
    checkChange: function () {
        var day = this.calendar.currentDate;
        this.calendar.showTimeLine(this.hourPanel, this._getUnitHourNameHeight());
        if (this.year == day.getFullYear() && this.month == day.getMonth() && this.day == day.getDate()) {
            return false;
        }
        this._changeDay();
        return true;
    },
    /** 激活 */
    active: function() {
        this.selector.active();
    },
    /** 休眠 */
    dormant: function() {
        this.selector.dormant();
    },
    /** 向前切换 */
    previous: function() {
        var day = this.calendar.currentDate;
        this.calendar.currentDate = new Date(day.setDate(day.getDate() - 1));
        this._changeDay();
    },
    /** 向后切换 */
    next: function() {
        var day = this.calendar.currentDate;
        this.calendar.currentDate = new Date(day.setDate(day.getDate() + 1));
        this._changeDay();
    },
    /** 切换到当前 */
    today: function(day) {
        if (!day || !(day instanceof Date)) {
            day = new Date();
        }
        this.calendar.currentDate = new Date(day.getTime());
        this._changeDay();
    },
    setBeginTime: WeekView.prototype.setBeginTime,
    /** 添加日程信息 */
    addSchedules: function(data, beginDateTimeField, endDateTimeField, formatAction, getColumnFn) {
        WeekView.prototype.addSchedules.call(this,
            data, 
            beginDateTimeField, 
            endDateTimeField, 
            formatAction,
            function () {
                return 0;
            }
        );
    },
    /** 清空日程信息 */
    clearSchedules: function() {
        var i = 0;
        for (; i < this.dayHours.length; i++) {
            this.dayHours[i].itemPanel.remove();
        }
        this.dayHours = [];
    },
    /** 判断是否已经有日程信息 */
    hasSchedule: function () {
        return this.dayHours.length > 0;
    },
    /** 设置选中的元素 返回数组 */
    getSelection: function() {
        var hours, date, time,
            i, len,
            result;

        result = [];
        hours = this.selector.getSelection();
        if(!hours) {
            return result;
        }

        date = new Date(this.year, this.month, this.day);
        for(i = 0, len = hours.timeArray.length; i < len; i++) {
            time = hours.timeArray[i];
            result.push(new Date(
                date.getFullYear(), 
                date.getMonth(), 
                date.getDate(), 
                time.hours, 
                time.minutes, 
                time.seconds));
        }
        return result;
    },
    /** 设置选中状态 */
    setSelection: function(start, end) {
        var startTime, 
            endTime;
        if(!(start instanceof Date) || !(end instanceof Date)) {
            return;
        }

        startTime = ui.date.format(start, "hh:mm:ss");
        endTime = ui.date.format(end, "hh:mm:ss");
        this.selector.setSelectionByTime(0, startTime, endTime);
    },
    /** 取消选中状态 */
    cancelSelection: function() {
        this.selector.cancelSelection();
    },
    /** 设置日视图尺寸 */
    setSize: function (width, height) {
        this.hourPanel.css("height", height - hourHeight + "px");
        this._setCellSize(width, height);
    },
    /** 获取日视图标题 */
    getTitle: function () {
        return ui.str.format("{0}年{1}月{2}日",
            this.year, this.month + 1, this.day);
    },
    /** 重写toString方法 */
    toString: function () {
        return "ui.ctrls.CalendarView.DayView";
    }
};
// 选择器
function Selector(view, panel, table) {
    if(this instanceof Selector) {
        this.initialize(view, panel, table);
    } else {
        return new Selector(view, panel, table);
    }
}
Selector.prototype = {
    constructor: Selector,
    initialize: function(view, panel, table) {
        this.view = view;
        this.panel = panel;
        this.grid = table;

        this.cellWidth = 1;
        this.cellHeight = 25;

        this.grid[0].onselectstart = function () { 
            return false; 
        };

        this.selectionBox = $("<div class='ui-calendar-selector unselectable click-enabled border-highlight' />");
        this.selectionBox.boxTextSpan = $("<span class='ui-calendar-selector-time click-enabled' />");
        this.selectionBox.append(this.selectionBox.boxTextSpan);
        this.panel.append(this.selectionBox);

        this._initEvents();
        this._initAnimator();
    },
    _initEvents: function() {
        this.mouseLeftButtonDownHandler = (function (e) {
            if (e.which !== 1) {
                return;
            }
            $(document).on("mousemove", this.mouseMoveHandler);
            $(document).on("mouseup", this.mouseLeftButtonUpHandler);
            if(this.onMouseDown($(e.target), e.clientX, e.clientY)) {
                this._isBeginSelect = true;
            }
        }).bind(this);
        this.mouseMoveHandler = (function (e) {
            if (!this._isBeginSelect) {
                return;
            }
            this.onMouseMove(e);
        }).bind(this);
        this.mouseLeftButtonUpHandler = (function (e) {
            if (e.which !== 1 || !this._isBeginSelect) {
                return;
            }
            this._isBeginSelect = false;
            $(document).off("mousemove", this.mouseMoveHandler);
            $(document).off("mouseup", this.mouseLeftButtonUpHandler);
            this.onMouseUp(e);
        }).bind(this);
    },
    _initAnimator: function() {
        var that = this;
        this.selectAnimator = ui.animator(this.selectionBox, {
            ease: ui.AnimationStyle.swing,
            onChange: function (val, elem) {
                if (that._selectDirection === "up") {
                    return;
                }
                elem.css("top", val + "px");
            }
        }).add(this.selectionBox, {
            ease: ui.AnimationStyle.swing,
            onChange: function (val, elem) {
                elem.css("left", val + "px");
            }
        }).add(this.selectionBox, {
            ease: ui.AnimationStyle.swing,
            onChange: function (val, elem) {
                elem.css("width", val + "px");
            }
        }).add(this.selectionBox, {
            ease: ui.AnimationStyle.swing,
            onChange: function (val, elem) {
                if (that._selectDirection) {
                    return;
                }
                elem.css("height", val + "px");
            }
        });
        this.selectAnimator.onEnd = function () {
            if(that._isNotCompletedYet) {
                that._isNotCompletedYet = false;
                that.onSelectCompleted();
            }
        };
        this.selectAnimator.duration = 200;
        this.selectAnimator.fps = 60;
    },
    _getSelectedCells: function() {
        var cells = [],
            box = this.selectionBox,
            text, beginIndex, endIndex,
            boxBorderTopWidth, top, left,
            first, count,
            table, row, cell, i;

        if (box.css("display") === "none") {
            return cells;
        }
        text = box.text().split("-");
        beginIndex = ui.str.trim(text[0] || "");
        endIndex = ui.str.trim(text[1] || "");
        if (!beginIndex || !endIndex) {
            return cells;
        }
        beginIndex = this.view.calendar.timeToIndex(beginIndex);
        endIndex = this.view.calendar.timeToIndex(endIndex) - 1;

        boxBorderTopWidth = parseFloat(box.css("border-top-width"));
        top = beginIndex * this.cellHeight + 1;
        left = parseFloat(box.css("left")) + boxBorderTopWidth + 1;
        first = this._getCellByPoint(left, top);
        cells.push(first);

        count = endIndex - beginIndex + 1;
        table = this.grid[0];
        for (i = 1; i < count; i++) {
            row = table.rows[i + first.hourIndex];
            cell = $(row.cells[first.weekIndex]);
            cell.hourIndex = i + first.hourIndex;
            cell.weekIndex = first.weekIndex;
            cells.push(cell);
        }
        return cells;
    },
    _getCellByPoint: function(x, y) {
        var columnIndex, rowIndex, count,
            table, tableRow, tableCell;
        
        columnIndex = Math.ceil(x / this.cellWidth);
        rowIndex = Math.ceil(y / this.cellHeight);
        count = this.view.calendar._getTimeCellCount() * 24;

        if (columnIndex < 1) {
            columnIndex = 1;
        }
        if (columnIndex > 7) {
            columnIndex = 7;
        }
        if (rowIndex < 1) {
            rowIndex = 1;
        }
        if (rowIndex > count) {
            rowIndex = count;
        }

        rowIndex--;
        columnIndex--;

        table = this.grid[0];
        tableRow = table.rows[rowIndex];

        tableCell = $(tableRow.cells[columnIndex]);
        tableCell.hourIndex = rowIndex;
        tableCell.weekIndex = columnIndex;
        return tableCell;
    },
    _selectCell: function(td) {
        var box, 
            cellPosition, endCellPosition,
            beginIndex, endIndex,
            option; 

        box = this.selectionBox;
        cellPosition = this._getPositionAndSize(td);
        beginIndex = td.hourIndex;
        endIndex = td.hourIndex + 1;
        if (arguments.length > 1 && arguments[1]) {
            endIndex = arguments[1].hourIndex + 1;
            endCellPosition = this._getPositionAndSize(arguments[1]);
            cellPosition.height = endCellPosition.top + endCellPosition.height - cellPosition.top;
        }

        this._selectDirection = null;

        //设置选择时间
        this._beginTime = this.view.calendar.indexToTime(beginIndex);
        this._endTime = this.view.calendar.indexToTime(endIndex);
        box.boxTextSpan.text(this._beginTime + " - " + this._endTime);

        this.selectAnimator.stop();
        option = this.selectAnimator[0];
        option.begin = parseFloat(option.target.css("top"));
        option.end = cellPosition.top;

        option = this.selectAnimator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = cellPosition.left;

        option = this.selectAnimator[2];
        option.begin = parseFloat(option.target.css("width"));
        option.end = cellPosition.width;

        option = this.selectAnimator[3];
        option.begin = parseFloat(option.target.css("height"));
        option.end = cellPosition.height;

        box.css("display", "block");
        this._isNotCompletedYet = false;
        return this.selectAnimator.start();
    },
    _autoScrollY: function (value, direction) {
        var currentScrollY,
            bottom;
        
        currentScrollY = this.panel.scrollTop();
        if (direction === "up") {
            if (value < currentScrollY) {
                this.panel.scrollTop(currentScrollY < this.cellHeight ? 0 : currentScrollY - this.cellHeight);
            }
        } else if (direction === "down") {
            bottom = currentScrollY + this.panel.height();
            if (value > bottom) {
                this.panel.scrollTop(currentScrollY + this.cellHeight);
            }
        }
    },
    _isClickInGrid: function(x, y) {
        var position,
            left,
            top,
            right,
            bottom,
            width,
            height;
        
        position = this.panel.offset();
        left = position.left + timeTitleWidth;
        top = position.top;

        width = this.grid.width();
        height = this.panel.height();
        right = left + width - 1;
        bottom = top + height;
        if (height < this.panel[0].scrollHeight) {
            right -= ui.scrollbarWidth;
        }

        return x >= left && x <= right && y >= top && y <= bottom;
    },
    _changeToGridPoint: function(x, y) {
        var position = this.panel.offset();
        position.left = position.left + timeTitleWidth;
        return {
            gridX: x - position.left + this.panel[0].scrollLeft,
            gridY: y - position.top + this.panel[0].scrollTop
        };
    },
    _getPositionAndSize: function(td) {
        var position = td.position();
        position.left = position.left + timeTitleWidth;
        return {
            top: position.top - 2,
            left: position.left - 2,
            width: td.outerWidth() - 1,
            height: td.outerHeight() - 1
        };
    },

    // 事件处理
    /** 鼠标按下，开始选择 */
    onMouseDown: function(elem, x, y) {
        var td, 
            nodeName, 
            point,
            eventData;
        
        if (!this._isClickInGrid(x, y)) {
            this._clickInGrid = false;
            return;
        }
        this._clickInGrid = true;

        point = this._changeToGridPoint(x, y);
        if(elem.nodeName() != "TD") {
            if(!elem.hasClass("click-enabled")) {
                return;
            }
            td = this._getCellByPoint(point.gridX, point.gridY);
        } else {
            td = elem;
            td.weekIndex = td[0].cellIndex;
            td.hourIndex = td.parent()[0].rowIndex;
        }

        eventData = {
            view: this.view,
            element: this.selectionBox,
            weekIndex: td.weekIndex,
            hourIndex: td.hourIndex,
            originElement: null
        };
        if(this.view.calendar.fire("selecting", eventData) === false) {
            return;
        }

        this._startCell = td;
        this._selectCell(td);

        //确定可选区间
        this.checkSelectable(td);

        this.focusX = point.gridX;
        this.focusY = point.gridY;
        return true;
    },
    /** 鼠标移动 */
    onMouseMove: function (e) {
        var point,
            td, 
            p, p2,
            box,
            begin, end;
        
        point = this._changeToGridPoint(e.clientX, e.clientY);
        td = this._getCellByPoint(this.focusX, point.gridY);

        p = this._getPositionAndSize(td);
        p2 = this._getPositionAndSize(this._startCell);

        if (td.hourIndex < this.selectableMin || td.hourIndex > this.selectableMax) {
            return;
        }

        box = this.selectionBox;
        if (point.gridY > this.focusY) {
            begin = this._startCell;
            end = td;
            box.css({
                "height": (p.top + p.height - p2.top) + "px"
            });
            this._selectDirection = "down";
            this._autoScrollY(p.top + p.height, this._selectDirection);
        } else {
            begin = td;
            end = this._startCell;
            box.css({
                "top": p.top + "px",
                "height": p2.top + p2.height - p.top + "px"
            });
            this._selectDirection = "up";
            this._autoScrollY(p.top, this._selectDirection);
        }

        this._beginTime = this.view.calendar.indexToTime(begin.hourIndex),
        this._endTime = this.view.calendar.indexToTime(end.hourIndex + 1);
        box.boxTextSpan.text(this._beginTime + " - " + this._endTime);
    },
    /** 鼠标释放 */
    onMouseUp: function(e) {
        var that = this;
        if (!this._clickInGrid) {
            return;
        }
        if (this.selectAnimator.isStarted) {
            this._isNotCompletedYet = true;
        } else {
            this.onSelectCompleted();
        }
    },
    /** 选择完成处理 */
    onSelectCompleted: function() {
        var box,
            date, arr,
            beginHour, beginMinute,
            endHour, endMinute,
            that;
        if (arguments.length > 0 && arguments[0]) {
            box = arguments[0];
        } else {
            box = this.selectionBox;
        }

        date = this.getDateByIndex(this._startCell.weekIndex);
        arr = this._beginTime.split(":");
        beginHour = parseInt(arr[0], 10);
        beginMinute = parseInt(arr[1], 10);
        arr = this._endTime.split(":");
        endHour = parseInt(arr[0], 10);
        endMinute = parseInt(arr[1], 10);

        this._startCell = null;
        this._beginTime = null;
        this._endTime = null;

        that = this;
        //保证动画流畅
        setTimeout(function () {
            var selectorInfo, 
                eventData = {
                    view: that.view,
                    beginTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), beginHour, beginMinute, 0),
                    endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute, 0),
                    originElement: null
                };
            selectorInfo = that.getSelectorInfo();
            eventData.element = selectorInfo.element;
            eventData.top = selectorInfo.top;
            eventData.left = selectorInfo.left;
            eventData.parentWidth = selectorInfo.parentWidth;
            eventData.parentWidth = selectorInfo.parentWidth;
            that.view.calendar.fire("selected", eventData);
        }, 50);
    },
    /** 确定可选择区域 */
    checkSelectable: function(td) {
        var count,
            hours,
            min, max,
            hour, i;

        count = this.view.calendar._getTimeCellCount();
        this.selectableMin = 0;
        this.selectableMax = 24 * count - 1;
        
        if(this.view.singleSelect) {
            hours = this.view._getScheduleInfo(td.weekIndex);
            min = -1;
            max = 24 * count;

            if (hours) {
                for (i = 0; i < hours.length; i++) {
                    hour = hours[i];
                    if (hour.beginRowIndex < td.hourIndex) {
                        if (hour.beginRowIndex > min)
                            min = hour.beginRowIndex;
                    } else {
                        if (hour.beginRowIndex < max)
                            max = hour.beginRowIndex;
                    }
                    if (hour.endRowIndex < td.hourIndex) {
                        if (hour.endRowIndex > min)
                            min = hour.endRowIndex;
                    } else {
                        if (hour.endRowIndex < max)
                            max = hour.endRowIndex;
                    }
                }
            }
            this.selectableMin = min + 1;
            this.selectableMax = max - 1;
        }
    },
    getSelectorInfo: function() {
        var box = this.selectionBox;
        return {
            element: box,
            top: parseFloat(box.css("top")),
            left: parseFloat(box.css("left")),
            parentWidth: this.view.viewPanel.width() - timeTitleWidth,
            parentHeight: this.view.hourTable.outerHeight()
        };
    },
    /** 获取选则的内容 */
    getSelection: function() {
        var result,
            cells,
            unitCount,
            getDateFn,
            i, len;
        
        cells = this._getSelectedCells();
        if(cells.length === 0) {
            return null;
        }

        result = {
            weekIndex: null,
            timeArray: []
        };

        unitCount = this.view.calendar._getTimeCellCount();
        getDateFn = function(hourIndex) {
            var h, m;
            h = Math.floor(hourIndex / unitCount);
            m = (hourIndex / unitCount - h) * 60;
            return {
                hours: h,
                minutes: m,
                seconds: 0
            };
        };

        result.weekIndex = cells[0].weekIndex;
        result.timeArray.push(getDateFn(cells[0].hourIndex));
        for(i = 0, len = cells.length; i < len; i++) {
            result.timeArray.push(getDateFn(cells[i].hourIndex + 1));
        }
        return result;
    },
    /** 根据时间设置选则的区域 */
    setSelectionByTime: function (weekDay, beginTime, endTime) {
        var pointX,
            beginPointY, endPointY,
            begin, end;

        pointX = (weekDay + 1) * this.cellWidth - 1;
        beginPointY = (this.view.calendar.timeToIndex(beginTime) + 1) * this.cellHeight - 1;
        endPointY = this.view.calendar.timeToIndex(endTime) * this.cellHeight - 1;
        begin = this._getCellByPoint(pointX, beginPointY);
        end = this._getCellByPoint(pointX, endPointY);

        this.focusX = pointX;
        this.focusY = beginPointY;

        this.view.setBeginTime(beginTime);

        this._startCell = begin;
        return this._selectCell(begin, end);
    },
    /** 取消选择 */
    cancelSelection: function () {
        var box = this.selectionBox;
        box.css("display", "none");

        this._startCell = null;
        this.focusX = 0;
        this.focusY = 0;

        this.view.calendar.fire("deselected", {
            view: this.view, 
            element: box
        });
    },
    /** 激活选择器 */
    active: function (justEvent) {
        if (!justEvent) {
            this.selectionBox.css("display", "none");
        }
        $(document).on("mousedown", this.mouseLeftButtonDownHandler);
    },
    /** 休眠选择器 */
    dormant: function (justEvent) {
        if (!justEvent) {
            this.cancelSelection();
        }
        $(document).off("mousedown", this.mouseLeftButtonDownHandler);
    }
};

viewTypes = {
    "YEARVIEW": YearView,
    "MONTHVIEW": MonthView,
    "WEEKVIEW": WeekView,
    "DAYVIEW": DayView
};
ui.ctrls.define(controlName, {
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
            // 年视图是否可以多选
            yearMultipleSelect: false,
            // 月视图是否可以多选
            monthMultipleSelect: false,
            // 周视图已经添加日程的时间段后不能再次选择
            weekSingleSelect: false,
            // 日视图已经添加日程的时间段后不能再次选择
            daySingleSelect: false,
            // 周视图标题格式化器
            formatWeekDayHead: null,
            // 日视图标题格式化器
            formatDayHead: null
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
        this.viewChangeAnimator.add({
            ease: ui.AnimationStyle.easeFrom,
            onChange: function (val, elem) {
                elem.css("opacity", val / 100);
            }
        });
        this.viewChangeAnimator.duration = 500;
    },
    _render: function() {
        var i, len,
            viewName,
            that;

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
        that = this;
        // 延迟显示默认视图，给绑定事件留时间
        setTimeout(function() {
            that.changeView(that.option.defaultView, false);
        });
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
            startIndex = this.getWeekIndexOf(first);
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
            return language.sundayFirstWeek;
        } else {
            return language.mondayFirstWeek;
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
    timeToPosition: function(time, unitHeight) {
        if(!time) {
            time = "00:00";
        }
        return this._timeToCellNumber(time) * unitHeight;
    },
    /** 显示周视图和日视图的当前时间指示器 */
    showTimeLine: function(parent, unitHourHeight) {
        var updateInterval,
            updateTimeFn,
            that;
        if(!this.currentTimeElement) {
            this.currentTimeElement = $("<div class='ui-current-time border-highlight font-highlight' />");
            this.currentTimeElement.css("width", timeTitleWidth + "px");
            this.element.append(this.currentTimeElement);
        } else {
            this.currentTimeElement.css("display", "block");
        }
        if(this._timeoutHandler) {
            clearTimeout(this._timeoutHandler);
            this._timeoutHandler = null;
        }
        parent.append(this.currentTimeElement);
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
            if(index <= 1) {
                elem.addClass("ui-current-time-top").css("top", top + "px");
            } else {
                elem.removeClass("ui-current-time-top").css("top", top - currentTimeLineHeight + "px");
            }
            that._timeoutHandler = setTimeout(updateTimeFn, updateInterval);
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
        return this.views.hasOwnProperty((viewName + "").toUpperCase());
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
        
        view = this.views[(viewName + "").toUpperCase()];
        if(!view) {
            throw new Error(ui.str.format("没有注册名为{0}的视图", viewName));
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
            this.currentView = null;
        }

        this.currentView = view;
        width = this.element.width();
        this.currentView.viewPanel.css({
            "display": "block",
            "left": (width / 3) + "px"
        });

        isInitialled = false;
        if(!view.initialled) {
            view.render();
            isInitialled = true;
        }

        isChanged = view.checkChange();
        view.setSize(this.element.width(), this.element.height());

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
        if(this.currentView) {
            this.currentView.setSize(width, height);
        }
    },
    /** 获取当前视图的标题文字信息 */
    getTitle: function() {
        if(this.currentView) {
            return this.currentView.getTitle();
        } else {
            return "";
        }
    }
});

$.fn.calendarView = function(option) {
    if(this.length === 0) {
        return null;
    }
    if(!isCalendarViewThemeInitialized) {
        initCalendarViewTheme();
    }
    return ui.ctrls.CalendarView(option, this);
};

var themeStyle,
    isCalendarViewThemeInitialized = false;
function initCalendarViewTheme(colorInfo) {
    var baseColor,
        highlightColor,
        color,
        styleHelper;

    isCalendarViewThemeInitialized = true;
    if(!themeStyle) {
        themeStyle = $("#GlobalThemeChangeStyle");
        if (themeStyle.length === 0) {
            styleHelper = ui.StyleSheet.createStyleSheet("GlobalThemeChangeStyle");
            themeStyle = styleHelper.styleSheet;
        } else {
            styleHelper = ui.StyleSheet(themeStyle);
        }
    } else {
        styleHelper = ui.StyleSheet(themeStyle);
    }
    if(!colorInfo) {
        colorInfo = ui.theme.currentHighlight || { color: "#3E5A99" };
    }

    baseColor = ui.theme.backgroundColor || "#FFFFFF";
    highlightColor = colorInfo.Color || colorInfo.color;

    color = ui.color.overlay(highlightColor, baseColor, .4);
    color = ui.color.rgb2hex(color.red, color.green, color.blue);
    styleHelper.setRule(".ui-calendar-selector", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-hour-panel .schedule-item-panel", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-hour-panel .schedule-item-panel:hover", {
        "background-color": highlightColor
    });
    styleHelper.setRule(".ui-calendar-month-day-view .month-days-table .selected", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-year-view .year-month-table .selected", {
        "background-color": color
    });

    color = ui.color.overlay(highlightColor, baseColor, .85);
    color = ui.color.rgb2hex(color.red, color.green, color.blue);
    styleHelper.setRule(".ui-calendar-hour-panel .week-hour-cell-today", {
        "background-color": color
    });

    color = ui.color.overlay(highlightColor, baseColor, .7);
    color = ui.color.rgb2hex(color.red, color.green, color.blue);
    styleHelper.setRule(".ui-calendar-month-day-view .month-days-cell .schedule-item", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-month-day-view .month-days-cell .schedule-border", {
        "background-color": highlightColor
    });
}
ui.page.hlchanged(function(e, colorInfo) {
    initCalendarViewTheme(colorInfo);
});
