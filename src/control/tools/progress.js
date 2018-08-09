// Progress

var circlePrototype,
    dashboardPrototype,
    barPrototype,
    svgNameSpace = "http://www.w3.org/2000/svg";

function createSVGElement(tagName) {
    return document.createElementNS(svgNameSpace, tagName);
}
function setAttribute(element, name, value) {
    if(arguments.length === 2 && name) {
        Object.keys(name).forEach(function(key) {
            element.setAttribute(key, name[key]);
        });
    } else if(arguments.length > 2) {
        element.setAttribute(name, value);
    }
}
function setStyle(element, name, value) {
    if(arguments.length === 2 && name) {
        Object.keys(name).forEach(function(key) {
            element.style[key] = name[key];
        });
    } else if(arguments.length > 2) {
        element.style[name] = value;
    }
}

function ProgressView(option) {
    var percent = 0;

    this.trackColor = option.trackColor;
    this.trackWidth = option.trackWidth;
    this.trackLength = option.trackLength;

    this.progressColor = option.progressColor;
    this.progressWidth = option.progressWidth;

    this.size = option.size;
    this.type = option.type;

    Object.defineProperty(this, "percent", {
        get: function() {
            return percent;
        },
        set: function(value) {
            percent = value;
            this.update(percent);
        },
        enumerable: true,
        configurable: true
    });
}

circlePrototype = {
    render: function() {
        var contianer,
            svg,
            path,
            pathData,
            radius;

        contianer = $("<div class='ui-progress-container' />");
        contianer.css({
            "width": this.size + "px",
            "height": this.size + "px"
        });
        svg = $("<svg viewBox='0 0 100 100'></svg>");
        
        radius = 100 / 2 - Math.max(this.trackWidth, this.progressWidth) / 2;
        this.trackLength = 2 * Math.PI * radius;

        pathData = [
            "M 50,50 m 0,", -radius, 
            " a ", radius, ",", radius, " 0 1 1 0,", radius * 2,
            " a ", radius, ",", radius, " 0 1 1 0,", -radius * 2
        ];
        pathData = pathData.join("");

        path = createSVGElement("path");
        setAttribute(path, {
            "d": pathData,
            "fill-opacity": 0,
            "stroke": this.trackColor,
            "stroke-width": this.trackWidth
        });
        svg.append(path);

        path = createSVGElement("path");
        setAttribute(path, {
            "d": pathData,
            "fill-opacity": 0,
            "stroke-linecap": "round",
            "stroke": this.progressColor,
            "stroke-width": this.progressWidth
        });
        setStyle(path, {
            "stroke-dasharray": this.trackLength + "px," + this.trackLength + "px",
            "stroke-dashoffset": ((100 - this.percent) / 100 * this.trackLength) + "px",
            "transition": "stroke-dashoffset 0.6s ease 0s, stroke 0.6s ease"
        });
        svg.append(path);

        contianer.append(svg);

        this.textElem = $("<div class='ui-progress-text' />");
        contianer.append(this.textElem);

        this.progressElem = path;

        return contianer;
    },
    update: function(percent) {
        setStyle(
            this.progressElem, 
            "stroke-dashoffset",
            ((100 - percent) / 100 * this.trackLength) + "px");
    }
};
dashboardPrototype = {
    render: function() {
        var contianer,
            svg,
            path,
            pathData,
            radius;

        contianer = $("<div class='ui-progress-container' />");
        contianer.css({
            "width": this.size + "px",
            "height": this.size + "px"
        });
        svg = $("<svg viewBox='0 0 100 100'></svg>");
        
        radius = 100 / 2 - Math.max(this.trackWidth, this.progressWidth) / 2;
        this.trackLength = 2 * Math.PI * radius;
        this.gap = 75;

        pathData = [
            "M 50,50 m 0,", radius, 
            " a ", radius, ",", radius, " 0 1 1 0,", -radius * 2,
            " a ", radius, ",", radius, " 0 1 1 0,", radius * 2
        ];
        pathData = pathData.join("");

        path = createSVGElement("path");
        setAttribute(path, {
            "d": pathData,
            "fill-opacity": 0,
            "stroke": this.trackColor,
            "stroke-width": this.trackWidth
        });
        setStyle(path, {
            "stroke-dasharray": this.trackLength - this.gap + "px," + this.trackLength + "px",
            "stroke-dashoffset": -this.gap / 2 + "px",
            "transition": "stroke-dashoffset .3s ease 0s, stroke-dasharray .3s ease 0s, stroke .3s"
        });
        svg.append(path);

        path = createSVGElement("path");
        setAttribute(path, {
            "d": pathData,
            "fill-opacity": 0,
            "stroke-linecap": "round",
            "stroke": this.progressColor,
            "stroke-width": this.progressWidth
        });
        setStyle(path, {
            "stroke-dasharray": (this.percent / 100) * (this.trackLength - this.gap) + "px," + this.trackLength + "px",
            "stroke-dashoffset": -this.gap / 2 + "px",
            "transition": "stroke-dashoffset .3s ease 0s, stroke-dasharray .6s ease 0s, stroke .6s, stroke-width .06s ease .6s"
        });
        svg.append(path);

        contianer.append(svg);

        this.textElem = $("<div class='ui-progress-text' />");
        contianer.append(this.textElem);

        this.progressElem = path;

        return contianer;
    },
    update: function(percent) {
        setStyle(
            this.progressElem, 
            "stroke-dasharray",
            (percent / 100) * (this.trackLength - this.gap) + "px," + this.trackLength + "px");
    }
};
barPrototype = {
    render: function() {
        var track,
            progressBar;

        track = $("<div class='ui-progress-track' />");
        track.css({
            "width": this.size + "px",
            "height": this.progressWidth + "px"
        });

        progressBar = $("<div class='ui-progress-bar background-highlight' />");
        track.append(progressBar);

        this.progressElem = progressBar;

        return track;
    },
    update: function(percent) {
        this.progressElem.css("width", percent + "%");
    }
};

function createProgressView(option) {
    var view;

    option.type = (option.type || "circle").toLowerCase();
    if(option.type === "circle") {
        ProgressView.prototype = circlePrototype;
        view = new ProgressView(option);
    } else if(option.type === "dashboard") {
        ProgressView.prototype = dashboardPrototype;
        view = new ProgressView(option);
    } else if(option.type === "bar") {
        ProgressView.prototype = barPrototype;
        view = new ProgressView(option);
    } else {
        return null;
    }

    return view;
}

ui.ctrls.define("ui.ctrls.Progress", {
    _defineOption: function() {
        return {
            // 进度条样式 circle: 进度环, dashboard: 仪表盘, bar: 进度条 
            type: "circle",
            // 宽度和高度，单位px
            size: 100,
            trackColor: "#f1f1f1",
            trackWidth: 5,
            progressColor: "#ff0066",
            progressWidth: 6
        };
    },
    _create: function() {
        this.view = createProgressView(this.option);
        if(!this.view) {
            throw new TypeError("the option.type: " + this.option.type + " is invalid.");
        }
        
        this.defineProperty("percent", this.getPercent, this.setPercent);
    },
    _render: function() {
        this.element.addClass("ui-progress");
        this.element.append(this.view.render());
    },

    // API
    /** 获取百分比 */
    getPercent: function() {
        return this.view.percent;
    },
    /** 设置百分比 */
    setPercent: function(value) {
        if(ui.core.isNumber(value)) {
            this.view.percent = value;
        }
    }
});

$.fn.progress = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Progress(option, this);
};
