// 天气可交互磁贴
/*
    cityName: 城市名称
    days: [
        weatherDay: {
            date: yyyy-MM-dd
            type: 天气类型
            temperature: 当前气温
            low: 低温
            high: 高温
            description: 天气描述
            windDirection: 风向
        }
    ]

    晴朗 | 多云 | 阴天 | 雨天 | 雾霾 | 雨雪 | 雪天
 */
var weatherStyle;

if(!ui.tiles) {
    ui.tiles = {};
}

function findToday(days) {
    var i, len,
        weatherDay,
        today;
    if(Array.isArray(days)) {
        today = new Date();
        for(i = 0, len = days.length; i < len; i++) {
            weatherDay = days[i];
            weatherDay.date = ui.str.jsonToDate(weatherDay.date);
            if(!weatherDay.date) {
                continue;
            }
            if(weatherDay.date.getFullYear() === today.getFullYear()
                && weatherDay.date.getMonth() === today.getMonth()
                && weatherDay.date.getDate() === today.getDate()) {
                return weatherDay;
            }
        }
    }
    return null;
}
function getDateText(date) {
    var month = date.getMonth() + 1,
        day = date.getDate();
    return month < 10 ? "0" + month : month
            + " / "
            + day < 10 ? "0" + day : day;
}
function getWeekday(date) {
    var today = new Date(),
        dayCount;
    dayCount = (date.getTime() / 1000 / 60 / 60 / 24) - (today.getTime() / 1000 / 60 / 60 / 24);
    if(dayCount < 0) {
        return "昨天";
    } else if(dayCount < 1) {
        return "今天";
    } else if(dayCount < 2) {
        return "明天";
    } else {
        return "周" + "日一二三四五六".charAt(date.getDay());
    }
}
function getWeatherText(type) {
    return "晴朗";
}

function createBuilder(weatherData) {
    return {
        htmlBuilder: [],
        weatherData: weatherData,
        weatherToday: findToday(weatherData.days),
        graph: graph,
        info: info,
        days: days,
        build: build
    };
}
function graph() {
    var builder = this.htmlBuilder;
    builder.push("<div class='weather-graph'>");
    _callChildBuilders.apply(this, arguments);
    builder.push("</div>");
    return this;
}
function info() {
    var builder = this.htmlBuilder;
    builder.push("<div class='weather-info'>");
    _callChildBuilders.apply(this, arguments);
    builder.push("</div>");
    return this;
}
function days() {
    var builder = this.htmlBuilder,
        weatherData = this.weatherData,
        weatherDay,
        i, len;
    if(Array.isArray(weatherData.days)) {
        builder.push("<ul class='weather-days'>");
        for(i = 0, len = weatherData.days.length; i < len; i++) {
            weatherDay = weatherData.days[i];
            builder.push("<li class='weather-day'", i === 0 ? " style='height:150px'" : "", ">");
            builder.push("<div class='weather-item'>");
            this.graph();
            this.info();
            builder.push("</div>");
            builder.push("<div class='weather-handle'>");
            builder.push("<span class='weather-text'>", 
                ui.str.textFormat("{0} {1} {2}, {3}",
                    getDateText(weatherDay.date),
                    getWeekday(weatherDay.date), 
                    getWeatherText(weatherData.type), 
                    ui.str.textFormat("{0}℃ - {1}℃", weatherDay.low, weatherDay.high)),
                "</span>");
            builder.push("</div>");
            builder.push("</li>");
        }
        builder.push("</ul>");
    }
    return this;
}
function build() {
    return this.htmlBuilder.join("");
}
function _callChildBuilders() {
    var i, len,
        weatherDay;
    weatherDay = this.weatherToday;
    for(i = 0, len = arguments.length; i < len; i++) {
        if(ui.core.isFunction(arguments[i])) {
            arguments[i].call(this, weatherDay);
        }
    }
}
function city(weatherDay) {
    var builder = this.htmlBuilder,
        weatherData = this.weatherData;
    builder.push("<h6 class='weather-city'>", weatherData.city, "</h6>");
}
function temperature(weatherDay) {
    var builder = this.htmlBuilder;
    builder.push("<h3 class='weather-temperature'>");
    if(weatherDay.temperature) {
        builder.push("<span class='weather-curr-temp'>", weatherDay.temperature, "℃", "</span>");
    }
    builder.push("<span class='weather-low-high'>", weatherDay.low, "℃ / ", weatherData.high, "℃", "</span>");
    builder.push("</h3>");
}
function description(weatherDay) {
    var builder = this.htmlBuilder;
    builder.push("<h6 class='weather-description'>", weatherDay.description, "</h6>");
}
function windDirection(weatherDay) {
    var builder = this.htmlBuilder;
    builder.push("<h6 class='weather-wind'>", weatherDay.windDirection, "</h6>");
}

function activeMutualTile(tile) {
    var animator,
        context,
        days;
    context = tile.weatherContext;
    context.changeDayAnimator = ui.animator({
        ease: ui.AnimationStyle.easeFromTo,
        onChange: function(val) {
            this.target.css("height", val + "px");
        }
    }).addTarget({
        ease: ui.AnimationStyle.easeFromTo,
        onChange: function(val) {
            this.target.css("opacity", (val / 100) + "px");
        }
    }).addTarget({
        ease: ui.AnimationStyle.easeFromTo,
        onChange: function(val) {
            this.target.css("height", val + "px");
        }
    }).addTarget({
        ease: ui.AnimationStyle.easeFromTo,
        onChange: function(val) {
            this.target.css("opacity", (val / 100) + "px");
        }
    });

    days = context.parent.children(".weather-days");
    context.current = $(days.children()[0]);
    days.click(onWeatherHandleClick.bind(tile));
}
function onWeatherHandleClick(e) {
    var context,
        elem,
        item,
        option;
    elem = $(e.target);
    while(!elem.hasClass("weather-handle")) {
        if(elem.nodeName() === "LI") {
            return;
        }
        elem = elem.parent();
    }

    context = this.weatherContext;
    if(elem.parent()[0] === context.current[0]) {
        return;
    }
    context.changeDayAnimator.stop();
    
    item = context.current.children(".weather-item");
    item.removeClass("active-dynamic");
    item.children(".weather-info").css("display", "none");
    option = context.changeDayAnimator[0];
    option.target = context.current;
    option.begin = parseFloat(option.target.css("height")) || 150;
    option.end = 22;

    option = context.changeDayAnimator[1];
    option.target = context.current;
    option.begin = parseFloat(option.target.css("opacity")) * 100 || 100;
    option.end = 0;

    option = context.changeDayAnimator[2];
    option.target = elem.parent();
    option.begin = parseFloat(option.target.css("height")) || 22;
    option.end = 150;

    option = context.changeDayAnimator[3];
    option.target = elem.parent();
    option.begin = parseFloat(option.target.css("opacity")) * 100 || 0;
    option.end = 100;

    context.current = option.target;
    item = context.current.children(".weather-item");
    item.children(".weather-info").css("display", "block");
    context.changeDayAnimator.start().done(function() {
        var op = this[0];
        op.target.children(".weather-item").css("display", "none");
        item.addClass("active-dynamic");
    });
}

weatherStyle = {
    medium: function(tile, weatherData) {
        var html;
        html = createBuilder(weatherData)
            .graph()
            .info(
                temperature,
                description
            )
            .build();

        tile.weatherContext.parent.html(html);
    },
    wide: function(tile, weatherData) {
        var html;
        html = createBuilder(weatherData)
            .graph()
            .info(
                city,
                temperature,
                description,
                windDirection
            )
            .build();

        tile.weatherContext.parent.html(html);
    },
    large: function(tile, weatherData) {
        var html;
        html = createBuilder(weatherData)
            .days()
            .build();

        tile.weatherContext.parent.html(html);
        setTimeout(function() {
            activeMutualTile(tile);
        }, 1000);
        tile.update();
    }
};

ui.tiles.weather = function(tile, weatherData) {
    tile.weatherContext = {
        weatherData: weatherData
    };
    if(tile.tileInfo.updateStyle === "moveup") {
        tile.weatherContext.parent = tile.updatePanel;
        tile.smallIconImg.remove();
        tile.titlePanel.remove();
    } else {
        tile.weatherContext.parent = tile.tileInnerBack;
    }
    weatherStyle[tile.type].apply(this, arguments);
};
