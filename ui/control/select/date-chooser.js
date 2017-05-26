
var language,
    selectedClass = "";

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
    months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    seasons: ["一季", "二季", "三季", "四季"]
};
//英文
language["en-US"] = {
    dateFormat: "yyyy-mm-dd",
    year: "Year",
    month: "Month",
    weeks: ["S", "M", "T", "W", "T", "F", "S"],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    seasons: ["S I", "S II", "S III", "S IV"]
};

// 格式化器
function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}
function calendarTitleFormatter(year, month) {
    month += 1;
    return year + "-" + twoNumberFormatter.call(this, number) + "&nbsp;▼";
} 

// 事件处理函数
function onYearChanged(e) {

}
function onYearSelected(e) {

}
function onMonthSelected(e) {

}
function onApplyYearMonth(e) {

}
function onCancelYearMonth(e) {
    
}
function onMonthChanged(e) {

}
function onCalendarTitleClick(e) {

}

ui.define("ui.ctrls.DateChooser", {
    _defineOption: function() {
        return {
            dateFormat: "yyyy-MM-dd",
            language: "zh-CN",
            calendarPanel: null,
            isDateTime: false
        };
    },
    _defineEvents: function() {
        return ["selecting", "selected", "cancel"];
    },
    _create: function() {
        var defaultFormat;
        this._super();

        defaultFormat = "yyyy-MM-dd";
        if(this.isDateTime()) {
            defaultFormat = "yyyy-MM-dd hh:mm:ss";
        }
        // 日期格式化
        this.option.defaultFormat = this.option.defaultFormat || defaultFormat;

        // 日期参数
        this._now = new Date();
        this._year = this._now.getFullYear();
        this._month = this._now.getMonth();
        this._selDay = this._now.getDate();

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

        this._init();
    },
    _init: function() {
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
        html.push("</fieldset>")
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
        this._yearsTable = $("<table class='date-chooser-year-table' cellpadding='0' cellspacing='0' />");
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
        this._monthsTable = $("<table class='date-chooser-month-table' cellpadding='0' cellspacing='0' />");
        this._monthsTable.click(this.onMonthSelectedHandler);
        tbody = $("<tbody />");
        index = 0;
        for (i = 0; i < 3; i++) {
            tr = $("<tr />");
            for (j = 0; j < 4; j++) {
                td = $("<td class='date-chooser-month-td' />");
                td.html(this._language.months[index]);
                    td.data("month", index++);
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
        prev.click({ month: -1 }, this.onMonthChangedHandler);
        titlePanel.append(prev);
        // 标题
        dateTitle = $("<div class='date-chooser-title' />");
        this._linkBtn = $("<a href='javascript:void(0)' class='date-chooser-title-text font-highlight' />");
        this._linkBtn.html(calendarTitleFormatter.call(this, this._year, this._month));
        this._linkBtn.click(this.onCalendarTitleClickHandler);
        titlePanel.append(dateTitle);
        // 前进
        next = $("<div class='date-chooser-next' />");
        next.click({ month: 1 }, this.onMonthChangedHandler);
        titlePanel.append(next);

        return titlePanel;
    },
    _createDatePanel: function() {

    },
    _createCtrlPanel: function() {

    },

    _createButton: function (eventFn, innerHtml, className, css) {
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

    // API
    isDateTime: function() {
        return !!this.option.isDateTime;
    }
});

$.fn.dateChooser = function() {

};
