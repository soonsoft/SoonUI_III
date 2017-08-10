// 时钟动态磁贴
var clockStyle;

if(!ui.tiles) {
    ui.tiles = {};
}

function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}

function getNow() {
    var date,
        now;
    date = new Date();
    now = {
        hour: twoNumberFormatter(date.getHours()),
        minute: twoNumberFormatter(date.getMinutes()),
        spliter: ":"
    };
    return now;
}

clockStyle = {
    medium: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='clock-hour'>", now.hour, "</span>");
        builder.push("<span class='clock-minute'>", now.minute, "</span>");

        tile.updatePanel
                .css("text-align", "center")
                .html(builder.join(""));

        if(!tile.isDynamicChanged) {
            tile.update();
        }
    },
    wide: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='clock-hour'>", now.hour, "</span>");
        builder.push("<span class='clock-spliter'></span>");
        builder.push("<span class='clock-minute'>", now.minute, "</span>");

        tile.updatePanel
                .css({ "text-align": "center", "line-height": tile.height + "px" })
                .html(builder.join(""));

        if(!tile.isDynamicChanged) {
            tile.update();
        }
    },
    large: function(tile) {
        clockStyle.wide.call(this, arguments);
    }
};

ui.tiles.clock = function(tile) {
    clockStyle[tile.type].apply(this, arguments);
    tile.register();
};
