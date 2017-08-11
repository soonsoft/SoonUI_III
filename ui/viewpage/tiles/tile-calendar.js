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

        builder.push("<span>", now.day, "</span>");
        builder.push("<span>", now.week, "</span>");
        builder.push("<span>", now.year, ".", now.month, "</span>");

        this.updatePanel.html(builder.join(""));

        if(!tile.isDynamicChanged) {
            this.updatePanel
                .css("text-align", "center");
            tile.updateTile();
        }
    },
    wide: function(tile) {

    },
    large: function(tile) {

    }
};

ui.tiles.calendar = function(tile) {
    calendarStyle[tile.type].apply(this, arguments);
    tile.activate();
};
