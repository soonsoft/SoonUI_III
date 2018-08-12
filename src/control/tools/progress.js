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
function defaultTextTemplate() {
    return "<span class='ui-progress-indication' style='color:" + this.progressColor + "'>" + this.percent + "%</span>";
}

function ProgressView(option) {
    var that = this;
    Object.keys(option).forEach(function(name) {
        Object.defineProperty(that, name, {
            get: function() {
                return option[name];
            },
            set: function(value) {
                option[name] = value;
                this.update(name);
            },
            enumerable: true,
            configurable: true
        });
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
        this.updateText();
        contianer.append(this.textElem);

        this.contianer = contianer;
        this.progressElem = path;

        return contianer;
    },
    update: function(propertyName) {
        if(propertyName === "percent") {
            setStyle(
                this.progressElem, 
                "stroke-dashoffset",
                ((100 - this.percent) / 100 * this.trackLength) + "px");
            this.updateText();
        } else if(propertyName === "progressColor") {
            setAttribute( this.progressElem, "stroke", this.progressColor);
            this.updateText();
        }
    },
    updateText: function() {
        if(this.textTemplate === false) {
            return;
        }
        if(ui.core.isFunction(this.textTemplate)) {
            this.textElem.html(this.textTemplate());
        } else {
            this.textElem.html(defaultTextTemplate.call(this));
        }
    },
    show: function() {
        this.contianer.css("display", "block");
    },
    hide: function() {
        this.contianer.css("display", "none");
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
            "stroke-linecap": "butt",
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
        this.updateText();
        contianer.append(this.textElem);

        this.contianer = contianer;
        this.progressElem = path;

        return contianer;
    },
    update: function(propertyName) {
        if(propertyName === "percent") {
            setStyle(
                this.progressElem, 
                "stroke-dasharray",
                (percent / 100) * (this.trackLength - this.gap) + "px," + this.trackLength + "px");
            this.updateText();
        } else if(propertyName === "progressColor") {
            setAttribute( this.progressElem, "stroke", this.progressColor);
            this.updateText();
        }
    },
    updateText: circlePrototype.updateText,
    show: circlePrototype.show,
    hide: circlePrototype.hide
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
        progressBar.css("width", this.percent + "%");
        track.append(progressBar);

        this.progressElem = progressBar;

        return track;
    },
    update: function(propertyName) {
        if(propertyName === "percent") {
            this.progressElem.css("width", this.percent + "%");
        }
    },
    show: function() {
        this.progressElem.parent().css("display", "block");
    },
    hide: function() {
        this.progressElem.parent().css("display", "none");
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
            // 进度值 0 ~ 100
            percent: 0,
            // 进度条轨道颜色
            trackColor: "#f1f1f1",
            // 进度条轨道宽度
            trackWidth: 5,
            // 进度条颜色
            progressColor: "#ff0066",
            // 进度条宽度
            progressWidth: 6,
            // 显示进度数值
            textTemplate: defaultTextTemplate
        };
    },
    _create: function() {
        if(!ui.core.isNumber(this.option.percent)) {
            this.option.percent = 0;
        }
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
    },
    /** 显示进度条 */
    show: function() {
        this.view.show();
    },
    /** 隐藏进度条 */
    hide: function() {
        this.view.hide();
    }
});

$.fn.progress = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Progress(option, this);
};
