// 天气可交互磁贴
/*
    cityName: 城市名称
    days: [
        weatherDay: {
            date: yyyy-MM-dd
            type: 天气类型
            temperature: 当前气温
            lowTemperature: 低温
            highTemperature: 高温
            description: 天气描述
            windDirection: 风向
        }
    ]
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
        htmlBuilder.push("<ul>");
        for(i = 0, len = weatherData.days.length; i < len; i++) {
            weatherDay = weatherData.days[i];
            htmlBuilder.push("<li>");
            htmlBuilder.push("<div class='weather-item'>");
            this.graph();
            this.info();
            htmlBuilder.push("</div>");
            htmlBuilder.push("<div class='weather-text'>");
            htmlBuilder.push("<span>", ui.str.textFormat(), "</span>");
            htmlBuilder.push("</div>");
            htmlBuilder.push("</li>");
        }
        htmlBuilder.push("</ul>");
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
    builder.push("<span class='weather-low-high'>", weatherDay.lowTemperature, "℃ / ", weatherData.highTemperature, "℃", "</span>");
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

weatherStyle = {
    medium: function(tile, weatherData) {
        var html = createBuilder(weatherData)
            .graph()
            .info(
                temperature,
                description
            )
            .build();
    },
    wide: function(tile, weatherData) {
        var html = createBuilder(weatherData)
            .graph()
            .info(
                city,
                temperature,
                description,
                windDirection
            )
            .build();
    },
    large: function(tile) {
        var html = createBuilder(weatherData)
            .days()
            .build();
    }
};

ui.tiles.weather = function(tile, weatherData) {

};
