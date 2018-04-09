// Source: src/effect/0.js

(function($, ui) {
ui.effect = {};

})(jQuery, ui);

// Source: src/effect/wave.js

(function($, ui) {
function globalAttenuation(x, k) {
    return Math.pow(k * 4 / (k * 4 + Math.pow(x, 4)), k);
}

function WaveLine(option) {
    if(this instanceof WaveLine) {
        this.initialize(option);
    } else {
        return new WaveLine(option);
    }
}
WaveLine.prototype = {
    constructor: WaveLine,
    initialize: function(option) {
        this.K = option.K || 2;
        this.F = option.F || 6;

        this.speed = option.speed || 0.01;
        this.phase = 0;

        this.width = option.width || 100;
        this.height = option.height || 100;

        this.wavePeak = Math.floor(this.height * (option.waveMax || .5) * (option.level || .1));
        this.deep = option.deep || 1.5;
        this.attenuation = option.attenuation || 1;
        
        this.thin = option.thin || 1;
        this.color = option.color || "rgba(0,0,0,1)";

        this.context = option.context || null;
    },
    draw: function() {
        var x, y,
            k, f;

        k = this.K;
        f = this.F;

        if(!this.context) {
            return;
        }

        this.context.moveTo(0, 0);
        this.context.beginPath();

        this.phase = (this.phase + this.speed) % (Math.PI * 64);
        for (var i = -k; i <= k; i += 0.01) {
            x = this.width * ((i + k) / (k * 2));
            y = this.height / 2 + this.wavePeak * globalAttenuation(i, k) * (1 / this.attenuation) * (Math.sin(f * i * .2 - this.phase) - .5);
            y *= this.deep;
            this.context.lineTo(x, y);
        }

        this.context.strokeStyle = this.color;
        this.context.lineWidth = this.thin;
        this.context.stroke();
    }
};

function WaveArea(option) {
    if(this instanceof WaveArea) {
        this.initialize(option);
    } else {
        return new WaveArea(option);
    }
}
WaveArea.prototype = {
    constructor: WaveArea,
    initialize: function(option) {
        WaveLine.prototype.initialize.call(this, option);
        this.bgColor = option.bgColor || "rgba(255,255,255,1)";
    },
    draw: function() {
        var x, y,
            k, f,
            gradient;

        k = this.K;
        f = this.F;

        if(!this.context) {
            return;
        }

        this.context.moveTo(0, 0);
        this.context.beginPath();
        this.context.lineTo(0, this.height);

        this.phase = (this.phase + this.speed) % (Math.PI * 64);
        for (var i = -k; i <= k; i += 0.01) {
            x = this.width * ((i + k) / (k * 2));
            y = this.height / 2 + this.wavePeak * globalAttenuation(i, k) * (1 / this.attenuation) * (Math.sin(f * i * .2 - this.phase) - .5);
            y *= this.deep;
            this.context.lineTo(x, y);
        }
        this.context.lineTo(this.width, this.height);

        this.context.strokeStyle = this.color;
        this.context.lineWidth = this.thin;
        this.context.stroke();

        gradient = this.context.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.bgColor);
        this.context.fillStyle = gradient;
        this.context.fill();
    }
};

function Wave(canvas, width, height) {
    var wave;
    
    wave = new ui.ArrayFaker();
    wave.width = width;
    wave.height = height;
    wave.canvas = canvas;
    wave.canvas.width = width;
    wave.canvas.height = height;
    wave.context = canvas.getContext("2d");

    function clear() {
        this.context.globalCompositeOperation = "destination-out";
        this.context.fillRect(0, 0, this.width, this.height);
        this.context.globalCompositeOperation = "source-over";
    }

    wave.start = function() {
        var fn;
        if(this.animationHandler) {
            return;
        }

        fn = (function() {
            clear.call(this);
            this.forEach(function(line) {
                line.draw();
            });
            this.animationHandler = requestAnimationFrame(fn, 1000);
        }).bind(this);
        fn();
    };
    wave.stop = function() {
        if(this.animationHandler) {
            cancelAnimationFrame(this.animationHandler);
            this.animationHandler = null;
        }
    };
    wave.reset = function() {
        clear.call(this);
        this.forEach(function(line) {
            line.phase = 0;
        });
    };
    wave.resize = function() {
        var c = $(this.canvas);
        this.width = c.width();
        this.height = c.height();
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    };
    return wave;
}

ui.effect.WaveLine = WaveLine;
ui.effect.WaveArea = WaveArea;
ui.effect.Wave = Wave;

})(jQuery, ui);
