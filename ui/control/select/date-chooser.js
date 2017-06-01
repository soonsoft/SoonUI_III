
var language,
    selectedClass = "date-selected",
    yearSelectedClass = "year-selected",
    monthSelectedClass = "month-selected";

var formatYear = /y+/i,
    formatMonth = /M+/,
    formatDay = /d+/i,
    formatHour = /h+/i,
    formatMinute = /m+/,
    formatSecond = /s+/i;

language = {};
//简体中文
language["zh-CN"] = {
    dateFormat: "yyyy-mm-dd",
    year: "年份",
    month: "月份",
    weeks: ["日", "一", "二", "三", "四", "五", "六"],
    months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
};
//英文
language["en-US"] = {
    dateFormat: "yyyy-mm-dd",
    year: "Year",
    month: "Month",
    weeks: ["S", "M", "T", "W", "T", "F", "S"],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
};

function Day(year, month, day, dateChooser) {
    if(this instanceof Day) {
        this.initialize(year, month, day, dateChooser);
    } else {
        return new Day();
    }
}
Day.prototype = {
    initialize: function(year, month, day, dateChooser) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.dateChooser = dateChooser;
        this.today = null;
        this._isCurrentMonth = true;
    },
    isCurrentMonth: function(value) {
        if(arguments.length > 0) {
            this._isCurrentMonth = value;
            return this;
        } else {
            return this._isCurrentMonth;
        }
    },
    setToday: function(today) {
        this.today = today;
    },
    isToday: function() {
        if(!this.today) {
            this.today = new Date();
        }
        return this.year === this.today.getFullYear() && 
            this.month === this.today.getMonth() && 
            this.day === this.today.getDate();
    },
    isTheDay: function(year, month, day) {
        return this.year === year && 
            this.month === month && 
            this.day === day;
    },
    isDisabled: function() {
        if(this.dateChooser) {
            return this.dateChooser._isDisabledDay(
                this.year, this.month, this.day);
        }
        return false;
    },
    //小于
    lt: function(year, month, day) {
        var d1 = new Date(this.year, this.month, this.day),
            d2 = new Date(year, month, day);
        return d1.getTime() < d2.getTime();
    },
    //大于
    gt: function(year, month, day) {
        var d1 = new Date(this.year, this.month, this.day),
            d2 = new Date(year, month, day);
        return d1.getTime() > d2.getTime();
    },
    toDate: function() {
        return new Date(this.year, this.month, this.day, 0, 0, 0);
    }
};

// 格式化器
function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}
function formatCalendarTitle(year, month) {
    month += 1;
    return year + "-" + twoNumberFormatter.call(this, number) + "&nbsp;▼";
}
function formatDateItem(r, value, format) {
    var result;
    result = r.exec(format);
    if(result !== null) {
        if(result[0].length > 1) {
            value = twoNumberFormatter(value);
        }
    }
    return format.replace(r, value);
} 
function findDateItem(r, value, format) {
    var result;
    result = r.exec(format);
    if(result) {
        return parseInt(value.substring(result.index, result.index + result[0].length), 10);
    } else {
        return NaN;
    }
}
function createDay(value) {
    var year,
        month,
        day;
    year = findDateItem.call(this, formatYear, value, format);
    month = findDateItem.call(this, formatMonth, value, format);
    day = findDateItem.call(this, formatDay, value, format);

    if(isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
    }
    return Day(year, month, day, this);
}

// 事件处理函数
function onYearChanged(e) {
    var value = e.data.value,
        year;
    if(this._currentYear) {
        year = parseInt(this._currentYear.attr("data-year"), 10);
    } else {
        year = this._selYear;
    }
    this._fillYear(year + value);
}
function onYearSelected(e) {
    var elem;
    
    e.stopPropagation();
    elem = $(e.target);
    if(elem.nodeName() !== "TD") {
        return;
    }
    if(this._currentYear) {
        if(this._currentYear[0] === elem[0]) {
            return;
        }
        this._currentYear
            .removeClass(yearSelectedClass)
            .removeClass("background-highlight");
    }
    this._currentYear = elem;
    this._currentYear
        .addClass(yearSelectedClass)
        .addClass("background-highlight");
}
function onMonthSelected(e) {
    var elem;
    
    e.stopPropagation();
    elem = $(e.target);
    if(elem.nodeName() !== "TD") {
        return;
    }
    if(this._currentMonth) {
        if(this._currentMonth[0] === elem[0]) {
            return;
        }
        this._currentMonth
            .removeClass(monthSelectedClass)
            .removeClass("background-highlight");
    }
    this._currentMonth = elem;
    this._currentMonth
        .addClass(monthSelectedClass)
        .addClass("background-highlight");
}
function onApplyYearMonth(e) {
    e.stopPropagation();
    this._selYear = parseInt(
        this._currentYear.attr("data-year"), 10);
    this._selMonth = parseInt(
        this._currentMonth.attr("data-month"), 10);
    this._updateCalendarTitle();
    this._fillMonth(this._currentDays, this._selYear, this._selMonth);

    this._closeYearMonthPanel();
}
function onCancelYearMonth(e) {
    e.stopPropagation();
    this._closeYearMonthPanel();
}
function onMonthChanged(e) {
    var value = e.data.value,
        date;
    date = new Date(this._selYear, this._selMonth + value, 1);
    this._changeMonth(date, value > 0);
}
function onCalendarTitleClick(e) {
    e.stopPropagation();
    this._fillYear(this._selYear, this._selMonth);
    this._openYearMonthPanel();
}
function onDayItemClick(e) {
    var elem,
        nodeName;
    elem = $(e.target);
    if(this._currentDays.parent().hasClass("click-disabled")) {
        return;
    }
    while((nodeName = elem.nodeName()) !== "TD") {
        if(elem.hasClass("date-chooser-days-panel")) {
            return;
        }
        elem = elem.parent();
    }
    this._selectItem(elem);
}
function onTodayButtonClick(e) {
    var now = new Date(),
        year, month;
    year = now.getFullYear();
    month = now.getMonth();
    if(year === this._selYear && month === this._selMonth) {
        this.setSelection(now);
    } else {
        this._changeMonth(
            now, 
            year * 12 + month > this._selYear * 12 + this._selMonth,
            function() {
                this.setSelection(now);
            });
    }
}
function onTimeMousewheel(e) {
    var elem,
        max,
        val,
        h, m, s;

    elem = $(e.target);
    if(elem.nodeName() !== "INPUT") {
        return;
    }
    if(elem.hasClass("hour")) {
        max = 24;
    } else {
        max = 60;
    }
    val = elem.val();
    val = parseFloat(val);
    val += -e.delta;
    if (val < 0) {
        val = max - 1;
    } else if (val >= max) {
        val = 0;
    }
    elem.val(twoNumberFormatter(val));
    
    h = parseInt(this.hourText.val(), 10);
    m = parseInt(this.minuteText.val(), 10);
    s = parseInt(this.secondText.val(), 10);
    this.selectedDate(
        new Date(this._selYear, this._selMonth, this._selDay, h, m, s));
}
function onTimeTextinput(e) {
    var elem,
        now,
        h, m, s;

    elem = $(e.target);
    if(elem.val().length === 0) {
        return;
    }
    now = new Date();
    h = parseInt(this.hourText.val(), 10);
    if(isNaN(h) || h < 0 || h >= 24) {
        h = now.getHours();
        this.hourText.val(twoNumberFormatter(h));
        return;
    }
    m = parseInt(this.minuteText.val(), 10);
    if(isNaN(m) ||m < 0 || m >= 60) {
        m = now.getMinutes();
        this.minuteText.val(twoNumberFormatter(m));
        return;
    }
    s = parseInt(this.secondText.val(), 10);
    if(isNaN(s) || s < 0 || s >= 60) {
        s = now.getSeconds();
        this.secondText.val(twoNumberFormatter(s));
        return;
    }
    this.selectedDate(
        new Date(this._selYear, this._selMonth, this._selDay, h, m, s));
}

ui.define("ui.ctrls.DateChooser", ui.ctrls.DropDownBase, {
    _defineOption: function() {
        return {
            // 日期格式化样式
            dateFormat: "yyyy-MM-dd",
            // 显示语言 zh-CN: 中文, en-US: 英文
            language: "zh-CN",
            // 放置日历的容器
            calendarPanel: null,
            // 是否要显示时间
            isDateTime: false,
            // 起始日期 不填则表示没有限制
            startDate: null,
            // 结束日期 不填则表示没有限制
            endDate: null
        };
    },
    _defineEvents: function() {
        return ["selecting", "selected", "cancel"];
    },
    _create: function() {
        var defaultFormat,
            now;
        this._super();

        defaultFormat = "yyyy-MM-dd";
        if(this.isDateTime()) {
            defaultFormat = "yyyy-MM-dd hh:mm:ss";
        }
        // 日期格式化
        this.option.defaultFormat = this.option.defaultFormat || defaultFormat;

        // 日期参数
        now = new Date();
        this._selYear = now.getFullYear();
        this._selMonth = now.getMonth();
        this._selDay = now.getDate();

        // 限制
        this.startDay = null;
        if(ui.core.isString(this.option.startDate) && this.option.startDate.length > 0) {
            this.startDay = createDay(this.option.startDate);
        }
        this.endDay = null;
        if(ui.core.isString(this.option.endDate) && this.option.endDate.length > 0) {
            this.endDay = createDay(this.option.endDate);
        }
         
        // 文字显示
        this._language = language[this.option.language];
        if (!this._language) {
            this._language = language["zh-CN"];
        }

        // 事件
        /* 年月选择面板相关事件 */
        // 年切换处理
        this.onYearChangedHandler = $.proxy(onYearChanged, this);
        // 年选中事件
        this.onYearSelectedHandler = $.proxy(onYearSelected, this);
        // 月选中事件
        this.onMonthSelectedHandler = $.proxy(onMonthSelected, this);
        // 选中年月应用事件
        this.onApplyYearMonthHandler = $.proxy(onApplyYearMonth, this);
        // 取消事件
        this.onCancelYearMonthHandler = $.proxy(onCancelYearMonth, this);
        /* 日历面板相关事件 */
        // 月切换处理
        this.onMonthChangedHandler = $.proxy(onMonthChanged, this);
        // 日历标题点击事件
        this.onCalendarTitleClickHandler = $.proxy(onCalendarTitleClick, this);
        // 日期项点击事件
        this.onDayItemClickHandler = $.proxy(onDayItemClick, this);
        // 今日日期点击事件
        this.onTodayButtonClickHandler = $.proxy(onTodayButtonClick, this);
        if(this.isDateTime()) {
            // 时间滚轮选择事件
            this.onTimeMousewheelHandler = $.proxy(onTimeMousewheel, this);
            // 时间输入事件
            this.onTimeTextinputHandler = $.proxy(onTimeTextinput, this);
        }
    },
    _render: function() {
        this._calendarPanel = ui.getJQueryElement(this.option.calendarPanel);
        if(!this._calendarPanel) {
            this._calendarPanel = $("<div />");
        }
        this._calendarPanel
            .addClass("ui-date-chooser-panel")
            .addClass("border-highlight")
            .click(function (e) {
                e.stopPropagation();
            });

        this._showClass = "ui-date-chooser-show";
        this._panel = this._calendarPanel;
        this._selectTextClass = "date-text";
        this._clearClass = "ui-date-chooser-clear";
        this._clear = $.proxy(function () {
            this.cancelSelection();
        }, this);

        // 创建日历内容面板
        this._initCalendarPanel();
        // 创建年月选择面板
        this._initYearMonthPanel();
        
        // 创建动画
        this._initYearMonthPanelAnimator();
        this._initCalendarChangeAnimator();
    },
    _initYearMonthPanelAnimator: function() {
        this.ymAnimator = ui.animator({
            target: this._settingPanel,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("top", val + "px");
            }
        });
        this.ymAnimator.duration = 240;
    },
    _initCalendarChangeAnimator: function() {
        this.mcAnimator = ui.animator({
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("left", val + "px");
            }
        }).addTarget({
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("left", val + "px");
            }
        });
        this.mcAnimator.duration = 240;
    },
    _initYearMonthPanel: function() {
        var yearTitle, monthTitle,
            prev, next,
            html;

        this._settingPanel = $("<div class='year-month-setting-panel' />");
        // 年标题
        yearTitle = $("<div class='set-title font-highlight' style='height:24px;line-height:24px;' />");
        this._settingPanel.append(yearTitle);
        // 后退
        prev = $("<div class='date-chooser-prev'/>");
        prev.click({ value: -10 }, this.onYearChangedHandler);
        yearTitle.append(prev);
        // 标题文字
        yearTitle.append("<div class='date-chooser-title'><span id='yearTitle'>" + this._language.year + "</span></div>");
        // 前进
        next = $("<div class='date-chooser-next'/>");
        next.click({ value: 10 }, this.onYearChangedHandler);
        yearTitle.append(next);
        // 清除浮动
        yearTitle.append($("<br clear='left' />"));
        // 年
        this._settingPanel.append(this._createYearPanel());
        // 月标题
        monthTitle = $("<div class='set-title font-highlight' style='text-align:center;height:27px;line-height:27px;' />");
        html = [];
        html.push("<fieldset class='title-fieldset border-highlight'>");
        html.push("<legend class='title-legend font-highlight'>", this._language.month, "</legend>");
        html.push("</fieldset>");
        monthTitle.html(html.join(""));
        this._settingPanel.append(monthTitle);
        // 月
        this._settingPanel.append(this._createMonthPanel());
        // 确定取消按钮
        this._settingPanel.append(this._createOkCancel());
        this._calendarPanel.append(this._settingPanel);
    },
    _createYearPanel: function() {
        var yearPanel,
            tbody, tr, td, 
            i, j;

        yearPanel = $("<div class='date-chooser-year-panel' />");
        this._yearsTable = $("<table class='date-chooser-table' cellpadding='0' cellspacing='0' />");
        this._yearsTable.click(this.onYearSelectedHandler);
        tbody = $("<tbody />");
        for(i = 0; i < 3; i++) {
            tr = $("<tr />");
            for(j = 0; j < 5; j++) {
                td = $("<td class='date-chooser-year-td' />");
                tr.append(td);
            }
            tbody.append(tr);
        }
        this._yearsTable.append(tbody);
        yearPanel.append(this._yearsTable);

        return yearPanel;
    },
    _createMonthPanel: function() {
        var monthPanel,
            tbody, tr, td,
            i, j, index;

        monthPanel = $("<div class='date-chooser-month-panel' />");
        this._monthsTable = $("<table class='date-chooser-table' cellpadding='0' cellspacing='0' />");
        this._monthsTable.click(this.onMonthSelectedHandler);
        tbody = $("<tbody />");
        index = 0;
        for (i = 0; i < 3; i++) {
            tr = $("<tr />");
            for (j = 0; j < 4; j++) {
                td = $("<td class='date-chooser-month-td' />");
                td.html(this._language.months[index]);
                    td.attr("data-month", index++);
                tr.append(td);
            }
            tbody.append(tr);
        }
        this._monthsTable.append(tbody);
        monthPanel.append(this._monthsTable);

        return monthPanel;
    },
    _createOkCancel: function() {
        var okCancel = $("<div class='date-chooser-operate-panel' />");
        okCancel.append(
            this._createButton(
                this.onApplyYearMonthHandler, 
                "<i class='fa fa-check'></i>", 
                null, 
                { "margin-right": "10px" }));
        okCancel.append(
            this._createButton(
                this.onCancelYearMonthHandler, 
                "<i class='fa fa-remove'></i>"));
        return okCancel;
    },
    _createCalendarPanel: function() {
        //创建日历正面的标题
        this._calendarPanel.append(this._createTitlePanel());
        //创建日期显示面板
        this._calendarPanel.append(this._createDatePanel());
        //创建控制面板
        this._calendarPanel.append(this._createCtrlPanel());
    },
    _createTitlePanel: function() {
        var titlePanel,
            prev, next, 
            dateTitle;

        titlePanel = $("<div class='date-chooser-calendar-title' />");
        // 后退
        prev = $("<div class='date-chooser-prev' />");
        prev.click({ value: -1 }, this.onMonthChangedHandler);
        titlePanel.append(prev);
        // 标题
        dateTitle = $("<div class='date-chooser-title' />");
        this._linkBtn = $("<a href='javascript:void(0)' class='date-chooser-title-text font-highlight' />");
        this._linkBtn.html(formatCalendarTitle.call(this, this._selYear, this._selMonth));
        this._linkBtn.click(this.onCalendarTitleClickHandler);
        titlePanel.append(dateTitle);
        // 前进
        next = $("<div class='date-chooser-next' />");
        next.click({ value: 1 }, this.onMonthChangedHandler);
        titlePanel.append(next);

        return titlePanel;
    },
    _createDatePanel: function() {
        var datePanel = $("<div class='date-chooser-calendar-panel' />");
        datePanel.append(this._createWeekHead());
        datePanel.append(this._createDaysBody());
        return datePanel;
    },
    _createWeekHead: function() {
        var weekPanel,
            weekTable,
            tbody, tr, th,
            i;
        
        weekPanel = $("<div class='date-chooser-week-panel'/>");
        weekTable = $("<table class='date-chooser-table' cellpadding='0' cellspacing='0' />");
        tbody = $("<tbody />");
        tr = $("<tr />");
        for (i = 0; i < 7; i++) {
            th = $("<th class='date-chooser-calendar-th' />");
            th.text(this._language.weeks[i]);
            if (i === 0 || i === 6) {
                th.addClass("date-chooser-weekend");
            }
            tr.append(th);
        }
        tbody.append(tr);
        weekTable.append(tbody);
        weekPanel.append(weekTable);

        return weekPanel;
    },
    _createDaysBody: function() {
        var daysPanel;

        daysPanel = $("<div class='date-chooser-days-panel' />");
        this._currentDays = this._createDaysTable();
        this._nextDays = this._createDaysTable();

        daysPanel.append(this._currentDays);
        daysPanel.append(this._nextDays);

        daysPanel.click(this.onDayItemClickHandler);

        return daysPanel;
    },
    _createDaysTable: function() {
        var table, tbody, 
            tr, td, 
            i, j;

        table = $("<table class='date-chooser-table' cellpadding='0' cellspacing='0' />");
        tbody = $("<tbody />");
        for (i = 0; i < 6; i++) {
            tr = $("<tr />");
            for (j = 0; j < 7; j++) {
                tr.append($("<td class='date-chooser-calendar-td' />"));
            }
            tbody.append(tr);
        }
        table.append(tbody);
        return table;
    },
    _createCtrlPanel: function() {
        var ctrlPanel,
            now,
            temp;
        ctrlPanel = $("<div class='date-chooser-operate-panel' />");
        
        now = new Date();
        if(this.isDateTime()) {
            temp = twoNumberFormatter(now.getHours());
            this.hourText = $("<input type='text' class='hour date-chooser-time-input font-highlight-hover' />");
            this.hourText.val(temp);
            this.hourText.textinput(this.onTimeTextinputHandler);
            ctrlPanel.append(this.hourText);
            
            ctrlPanel.append("<span style='margin-left:2px;margin-right:2px;'>:</span>");
            
            temp = twoNumberFormatter(now.getMinutes());
            this.minuteText = $("<input type='text' class='minute date-chooser-time-input font-highlight-hover' />");
            this.minuteText.val(temp);
            this.minuteText.textinput(this.onTimeTextinputHandler);
            ctrlPanel.append(this.minuteText);

            ctrlPanel.append("<span style='margin-left:2px;margin-right:2px;'>:</span>");
            
            temp = twoNumberFormatter(now.getSeconds());
            this.secondText = $("<input type='text' class='second date-chooser-time-input font-highlight-hover' />");
            this.secondText.val(temp);
            this.secondText.textinput(this.onTimeTextinputHandler);
            ctrlPanel.append(this.secondText);

            ctrlPanel.mousewheel(this.onTimeMousewheelHandler);
        } else {
            temp = this._createButton(
                this.onTodayButtonClickHandler,
                now.getDate()
            );
            temp.attr("title", this._formatDateValue(now));
            this._todayButton = temp;
            ctrlPanel.append(temp);
        }
        return ctrlPanel;
    },

    _createButton: function(eventFn, innerHtml, className, css) {
        var btn = $("<button class='icon-button date-chooser-button' />");
        if(innerHtml) {
            btn.html(innerHtml);
        }
        if(className) {
            btn.addClass(className);
        }
        if(ui.core.isObject(css)) {
            btn.css(css);
        }
        btn.click(eventFn);
        return btn;
    },
    _setCurrentDate: function(value) {
        var format = this.option.dateFormat,
            now = new Date();

        this._selYear = findDateItem.call(this, formatYear, value, format);
        this._selMonth = findDateItem.call(this, formatMonth, value, format);
        this._selDay = findDateItem.call(this, formatDay, value, format);
        
        if (isNaN(this._selYear) || this._selYear <= 1970 || this._selYear > 9999) {
            this._selYear = now.getFullYear();
        }
        this._selMonth--;
        if (isNaN(this._selMonth) || this._selMonth < 0 || this._selMonth > 11) {
            this._selMonth = now.getMonth();
        }
        if (isNaN(this._selDay) || this._selDay <= 0 || this._selDay > 31) {
            this._selDay = now.getDate();
        }
    },
    _setCurrentTime: function(value) {
        var h, m, s,
            format,
            now;
        if(!this.isDateTime()) {
            return;
        }

        format = this.option.dateFormat;
        now = new Date();
        h = findDateItem.call(this, formatHour, value, format);
        m = findDateItem.call(this, formatMinute, value, format);
        s = findDateItem.call(this, formatSecond, value, format);
        if(isNaN(h) || h < 0 || h >= 24) {
            h = now.getHours();
        }
        if(isNaN(m) || m < 0 || m >= 60) {
            m = now.getMinutes();
        }
        if(isNaN(s) || s < 0 || s >= 60) {
            s = now.getSeconds();
        }
        this.hourText.val(twoNumberFormatter(h));
        this.minuteText.val(twoNumberFormatter(m));
        this.secondText.val(twoNumberFormatter(s));
    },
    _updateCalendarTitle: function() {
        this._linkBtn.html(
            formatCalendarTitle.call(this._selYear, this._selMonth));
    },
    _fillMonth: function(daysTable, currentYear, currentMonth) {
        var days,
            prevMonthDate,
            currentMonthDate,
            nextMonthDate,
            firstWeekDay,
            y, m, d, i, j, index,
            rows, td, today,
            lastDay;

        days = [];
        // 当前月的第一天
        currentMonthDate = new Date(currentMonth, currentMonth, 1);
        // 当前月的第一天是星期几
        firstWeekDay = currentMonthDate.getDay();

        if(firstWeekDay > 0) {
            // 填充上个月的日期
            // 上一个月的最后一天
            prevMonthDate = new Date(currentMonth, currentMonth, 0);
            // 需要显示上个月的日期
            y = prevMonthDate.getFullYear();
            m = prevMonthDate.getMonth();
            d = prevMonthDate.getDate();
            for(i = d - (firstWeekDay - 1); i <= d; i++) {
                days.push(Day(y, m, d, this).isCurrentMonth(false));
            }
        }

        // 填充当前月的日期
        lastDay = new Date(currentMonth, currentMonth + 1, 0).getDate();
        for(i = 1; i <= lastDay; i++) {
            days.push(Day(y, m, d, this));
        }

        // 填充下个月的日期
        // 下一个月的第一天
        nextMonthDate = new Date(currentMonth, currentMonth + 1, 1);
        y = nextMonthDate.getFullYear();
        m = nextMonthDate.getMonth();
        lastDay = 6 * 7 - days.length;
        for(i = 1; i < lastDay; i++) {
            days.push(Day(y, m, i, this).isCurrentMonth(false));
        }

        today = new Date();
        daysTable.data("days", days);
        rows = daysTable[0].rows;
        for(i = 0; i < 6; i++) {
            for(j = 0; j < 7; j++) {
                index = (i * 7) + j;
                d = days[index];
                d.setToday(today);
                td = $(rows[i].cells[j]);
                if(d.isDisabled()) {
                    td.addClass("disabled-day");
                } else {
                    td.html("<span>" + d.day + "</span>");
                }
                td.attr("data-index", index);

                // 判断是否是选中的日期
                if(d.isTheDay(this._selYear, this._selMonth, this._selDay)) {
                    this._currentDate = td;
                    td.addClass(selectedClass)
                        .addClass("background-highlight");
                }
                // 高亮显示今日
                if(d.isToday()) {
                    td.addClass("font-highlight");
                }
                // 不是当前月的日期
                if(!d.isCurrentMonth()) {
                    td.addClass("other-month-day");
                }
            }
        }
    },
    _fillYear: function(year, month) {
        var startYear, yearCount,
            rows, td, value,
            i, j;

        yearCount = 15;
        startYear = Math.floor(year / 15) * 15;
        $("#yearTitle").text(
            startYear + "年 ~ " + (startYear + yearCount - 1) + "年");
        
        rows = this._yearsTable[0].rows;
        for(i = 0; i < 3; i++) {
            for(j = 0; j < 5; j++) {
                td = $(rows[i].cells[j]);
                value = startYear + (i * 5 + j);
                td.html(value);
                td.attr("data-year", value);
                if(value === year) {
                    td.addClass(yearSelectedClass)
                        .addClass("background-highlight");
                    this._currentYear = td;
                }
            }
        }

        if(month) {
            rows = this._monthsTable[0].rows;
            for(i = 0; i < 3; i++) {
                for(j = 0; j < 4; j++) {
                    td = $(rows[i].cells[j]);
                    value = parseInt(td.attr("data-month"), 10);
                    if(value === month) {
                        this._currentMonth = td;
                        td.addClass(monthSelectedClass)
                            .addClass("background-highlight");
                    }
                }
            }
        }
    },
    _isDisabledDay: function(year, month, day) {
        if(this.startDay && this.startDay.gt(year, month, day)) {
            // 日期小于起始日期
            return true;
        }
        if(this.endDay && this.endDay.lt(year, month, day)) {
            // 日期大于结束日期
            return true;
        }
        return false;
    },
    _getSelectionData: function(elem) {
        var h = 0, m = 0, s = 0,
            index, days, day,
            data;
        data = {};
        if(this.isDateTime()) {
            h = parseInt(this.hourText.val(), 10) || 0;
            m = parseInt(this.minuteText.val(), 10) || 0;
            s = parseInt(this.secondText.val(), 10) || 0;
        }

        index = parseInt(elem.attr("data-index"), 10);
        days = elem.parent().parent().parent();
        days = days.data("days");
        day = days[index];
        
        data.date = new Date(day.year, day.month, day.day, h, m, s);
        data.value = this._formatDateValue(data.date);
        return data;
    },
    _selectItem: function(elem) {
        var eventData;
        
        eventData = this._getSelectionData(elem);
        elem.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        if(this.fire("selecting", eventData) === false) {
            return;
        }

        this._selYear = eventData.date.getFullYear();
        this._selMonth = eventData.date.getMonth();
        this._selDay = eventData.date.getDate();

        if(this._currentDate) {
            this._currentDate
                .removeClass(selectedClass)
                .removeClass("background-highlight");
        }
        this._currentDate = elem;
        this._currentDate
            .addClass(selectedClass)
            .addClass("background-highlight");
        this.fire("selected", eventData);
    },
    _openYearMonthPanel: function() {
        var option;
        option = this.ymAnimator[0];
        option.target.css("display", "block");
        option.begin = parseFloat(option.target.css("top"));
        option.end = 0;
        this.ymAnimator.start();
    },
    _closeYearMonthPanel: function() {
        var option;
        option = this.ymAnimator[0];
        option.begin = parseFloat(option.target.css("top"));
        option.end = -option.target.height();
        this.ymAnimator.start().done(function() {
            option.target.css("display", "none");
        });

        this._currentYear
            .removeClass(yearSelectedClass)
            .removeClass("background-highlight");
        this._currentMonth
            .removeClass(monthSelectedClass)
            .removeClass("background-highlight");
        this._currentYear = null;
        this._currentMonth = null;
    },
    _changeMonth: function(date, isNext, callback) {
        var option,
            daysPanel,
            currentLeft,
            width,
            that;

        if(this.mcAnimator.isStarted) {
            return;
        }

        this.mcAnimator.stop();

        daysPanel = this._currentDays.parent();
        width = daysPanel.width();
        currentLeft = parseFloat(this._currentDays.css("left")) || 0;
        
        option = this.mcAnimator[0];
        option.target = this._currentDays;
        option.begin = currentLeft;
        option.end = isNext ? -width : width;

        option = this.mcAnimator[1];
        option.target = this._nextDays;
        option.target.css("display", "block");
        if(isNext) {
            option.begin = width - currentLeft;
            option.target.css("left", option.begin + "px");
        } else {
            option.begin = currentLeft - width;
            option.target.css("left", option.begin + "px");
        }
        option.end = 0;

        this._selYear = date.getFullYear();
        this._selMonth = date.getMonth();
        this._updateCalendarTitle();
        this._fillMonth(this._nextDays, this._selYear, this._selMonth);
        
        daysPanel.addClass("click-disabled");
        that = this;
        this.mcAnimator.start().done(function() {
            var temp = that._currentDays;
            that._currentDays = _nextDays;
            that._currentDays = temp;
            that._nextDays.css("display", "none");
            daysPanel.removeClass("click-disabled");
            if(ui.core.isFunction(callback)) {
                callback.call(that);
            }
        });
    },
    _formatDateValue: function(date) {
        var dateValue = this.dateFormat;
        dateValue = formatDateItem(formatYear, date.getFullYear(), dateValue);
        dateValue = formatDateItem(formatMonth, date.getMonth() + 1, dateValue);
        dateValue = formatDateItem(formatDay, date.getDate(), dateValue);
        if(this.isDateTime()) {
            dateValue = formatDateItem(formatHour, date.getHours(), dateValue);
            dateValue = formatDateItem(formatMinute, date.getMinutes(), dateValue);
            dateValue = formatDateItem(formatSecond, date.getSeconds(), dateValue);
        }
        return dateValue;
    },

    // API
    isDateTime: function() {
        return !!this.option.isDateTime;
    },
    setSelection: function(date) {
        var index,
            rowIndex,
            cellIndex,
            td;
        index = date.getDay() + date.getDate() - 1;
        rowIndex = Math.floor(index / 7);
        cellIndex = index - rowIndex * 7;

        td = $(this._currentDays[0].rows[rowIndex].cells[cellIndex]);
        if(td.length > 0) {
            this._selectItem(td);
        }
    },
    getSelection: function() {
        if(this._currentDate) {
            return this._getSelectionData(this._currentDate);
        }
        return null;
    },
    cancelSelection: function() {
        if(this._currentDate) {
            this._currentDate
                .removeClass(selectedClass)
                .removeClass("background-highlight");
        }
        this.fire("cancel");
    },
    setDateValue: function(value) {
        this._setCurrentDate(value);
        if(this.isDateTime()) {
            this._setCurrentTime(value);
        }
        this._fillMonth(this._currentDays, this._selYear, this._selMonth);
    },
    show: function() {
        var that,
            superShow,
            today, now,
            fn;

        // 更新今日按钮日期
        if(this._todayButton) {
            now = new Date();
            today = parseInt(this._todayButton.text(), 10);
            if(now.getDate() !== today) {
                this._todayButton
                    .html(now.getDate())
                    .attr("title", this._formatDateValue(now));
            }
        }

        that = this;
        superShow = this._super;
        fn = function() {
            that.moveToElement(that.element, true);
            superShow.call(that);
        };
        if(this.isShow()) {
            this.hide(fn);
        } else {
            fn();
        }
    }
});

/* 构造可以重用的日历选择器 */
var dateChooser,
    dateTimeChooser;

function noop() {}
function createDateChooser(option, element) {
    var dc = ui.ctrls.DateChooser(option, element);
    dc.selecting(function() {
        if(ui.core.isFunction(this.selectingHandler)) {
            return this.selectingHandler.apply(this, arguments);
        }
    });
    dc.selected(function() {
        if(ui.core.isFunction(this.selectedHandler)) {
            this.selectedHandler.apply(this, arguments);
        } else {
            if (this.element.nodeName() === "INPUT") {
                this.element.val(value);
            } else {
                this.element.html(value);
            }
        }
    });
    dc.cancel(function() {
        if(ui.core.isFunction(this.cancelHandler)) {
            this.cancelHandler.apply(this, arguments);
        } else {
            if(this.element.nodeName() === "INPUT") {
                this.element.val("");
            } else {
                this.element.html("");
            }
        }
    });
    return dc;
}
function onMousemoveHandler(e) {
    var eWidth,
        offsetX;
    if(!this.isShow()) {
        this.element.css("cursor", "auto");
        this._clearable = false;
        return;
    }
    eWidth = this.element.width();
    offsetX = e.offsetX;
    if(!offsetX) {
        offsetX = e.clientX - this.element.offset().left;
    }
    if (eWidth - offsetX < 0) {
        this.element.css("cursor", "pointer");
        this._clearable = true;
    } else {
        this.element.css("cursor", "auto");
        this._clearable = false;
    }
}
function onMouseupHandler(e) {
    var eWidth,
        offsetX;
    if(!this._clearable) {
        return;
    }
    eWidth = this.element.width();
    offsetX = e.offsetX;
    if(!offsetX) {
        offsetX = e.clientX - this.element.offset().left;
    }
    if (eWidth - offsetX < 0) {
        if ($.isFunction(this._clear)) {
            this._clear();
        }
    }
}
function setOptions(elem, option) {
    // 修正配置信息
    this.option = option;
    this.setLayoutPanel(option.layoutPanel);
    this.dateFormat = option.dateFormat;
    this.element = elem;
    // 修正事件引用
    this.selectingHandler = option.selectingHandler;
    this.selectedHandler = option.selectedHandler;
    this.clearHandler = option.cancelHandler;
    // 修正事件处理函数
    if(elem.nodeName() === "INPUT") {
        this.onMousemoveHandler = $.proxy(onMousemoveHandler, this);
        this.onMouseupHandler = $.proxy(onMouseupHandler, this);
    } else {
        this.onMousemoveHandler = noop;
        this.onMouseupHandler = noop;
    }
}

$.fn.dateChooser = function() {
    var nodeName,
        valueFn,
        currentDateChooser;

    if(this.length === 0) {
        return null;
    }

    if(this.hasClass("date-text")) {
        this.css("width", parseFloat(this.css("width"), 10) - 23 + "px");
    }
    nodeName = this.nodeName();
    if(nodeName !== "INPUT" && nodeName !== "A" && nodeName !== "SELECT") {
        this.attr("tabindex", 0);
    }

    if(nodeName === "INPUT") {
        valueFn = function() {
            return this.val();
        };
    } else {
        valueFn = function() {
            return this.text();
        };
    }

    if(option && option.isDateTime) {
        if(!dateTimeChooser) {
            dateTimeChooser = createDateChooser({
                isDateTime: true
            }, this);
        }
        currentDateChooser = dateTimeChooser;
    } else {
        if(!dateChooser) {
            dateChooser = createDateChooser(null, this);
        }
        currentDateChooser = dateChooser;
    }
    option = $.extend({}, currentDateChooser.option, option);
    this.focus(function(e) {
        var elem = $(e.target),
            value;
        if(currentDateChooser.isShow() && 
            currentDateChooser.element && 
            currentDateChooser.element[0] === elem[0]) {
            return;
        }
        if(currentDateChooser.element) {
            currentDateChooser.element.removeClass(currentDateChooser._clearClass);
        }
        setOptions.call(currentDateChooser, elem, option);
        value = valueFn.call(elem);
        currentDateChooser.setDateValue(value);

        ui.hideAll(currentDateChooser);
        currentDateChooser.show();
    }).click(function(e) {
        e.stopPropagation();
    });
    return currentDateChooser;
};
