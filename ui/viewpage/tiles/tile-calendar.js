// 日期动态磁贴
var calendarStyle,
    weekChars;

if(!ui.tiles) {
    ui.tiles = {};
}

weekChars = "日一二三四五六";

function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}

function getNow() {
    var date,
        now;
    date = new Date();
    now = {
        year: date.getFullYear(),
        month: twoNumberFormatter(date.getMonth() + 1),
        day: date.getDate().toString(),
        week: "星期" + weekChars.charAt(date.getDay())
    };
    return now;
}

calendarStyle = {
    medium: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='day-text'>", now.day, "</span>");
        builder.push("<span class='week-text'>", now.week, "</span>");
        builder.push("<span class='year-month-text'>", now.year, ".", now.month, "</span>");

        tile.updatePanel.html(builder.join(""));
        if(!tile.isDynamicChanged) {
            tile.updateTile();
        }
    },
    wide: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='day-text'>", now.day, "</span>");
        builder.push("<span class='week-text'>", now.week, "</span>");
        builder.push("<span class='year-month-text'>", now.year, ".", now.month, "</span>");

        tile.updatePanel.html(builder.join(""));
        if(!tile.isDynamicChanged) {
            tile.updateTile();
        }
    },
    large: function(tile) {
        calendarStyle.wide.apply(this, arguments);
    }
};

ui.tiles.calendar = function(tile) {
    var now;
    calendarStyle[tile.type].apply(this, arguments);
    now = new Date();
    now = now.getHours() * 60 * 60 + now.getMinutes() * 60 + now.getSeconds();
    tile.interval = 86400 - now;
    tile.activate();
};
