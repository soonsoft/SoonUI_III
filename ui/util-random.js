
var random = {
    /** 获取一定范围内的随机数 */
    getNum: function(min, max) {
        var val = null;
        if (isNaN(min)) {
            min = 0;
        }
        if (isNaN(max)) {
            max = 100;
        }
        if (max == min) {
            return min;
        }
        var temp;
        if (max < min) {
            temp = max;
            max = min;
            min = temp;
        }
        var range = max - min;
        val = min + Math.floor(Math.random() * range);
        return val;
    }
};

// uuid
var _time = new Date(),
    getBits = function(val, start, end){ 
        val = val.toString(36).split('');
        start = (start / 4) | 0;
        end = (end / 4) | 0;
        for(var i = start; i <= end; i++) {
            if(!val[i]) { 
                (val[i] = 0);
            }
        }
        return val.slice(start,end + 1).join(''); 
    },
    rand = function (max) {
        return Math.random() * (max + 1) | 0;
    },
    hnv1a = function (key) {
        key = key.replace(/./g, function (m) {
            return m.charCodeAt();
        }).split('');
        var p = 16777619, hash = 0x811C9DC5, l = key.length;
        for(var i=0; i< l; i++) {
            hash = (hash ^ key[i]) * p;
        }
        hash += hash << 13;
        hash ^= hash >> 7;
        hash += hash << 3;
        hash ^= hash >> 17;
        hash += hash << 5;
        hash = hash & 0x7FFFFFFF; //取正.
        hash = hash.toString(36);
        if(hash.length < 6) {
            (hash += (l % 36).toString(36));
        }
        return hash;
    },
    info = [
        screen.width, 
        screen.height,
        navigator.plugins.length,
        navigator.javaEnabled(),
        screen.colorDepth,
        location.href,
        navigator.userAgent
    ].join('');

random.uuid = function () {
    var s = new Date(),
        t = (+s +  0x92f3973c00).toString(36),
        m = getBits(rand(0xfff),0,7) +
            getBits(rand(0x1fff),0,7) +
            getBits(rand(0x1fff),0,8),
        // random from 50 - 300
        c = Math.random() * (251) + 50 | 0,
        a = [];
    if(t.length < 9) {
        (t += (s % 36).toString(36));
    }
    for (; c--;) {
        //借助不定次数,多次随机，打散客户端，因软硬环境类似，导致产生随机种子的线性规律性，以及重复性.
        a.push(Math.random());
    }

    return (
        //增加物理维度分流.
        hnv1a(info) +
        //增加用户随机性分流.
        hnv1a([
            document.documentElement.offsetWidth, document.documentElement.offsetHeight,                       , 
            history.length, 
            (new Date()) - _time
            ].join('')) +
        t +
        m + 
        hnv1a(a.slice(0, 10).join('')) +
        hnv1a(a.slice(c - 9).join(''))
    );
};

// 随机颜色
var rgb =  function () {
    return Math.floor(Math.random()*256);
};
random.hex = function() {
    return  '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice(-6);
};
random.hsb = function() {
    return "hsb(" + Math.random()  + ", 1, 1)";
};
random.rgb = function() {
    return "rgb(" + [ rgb(), rgb(), rgb() ] + ")";
};
random.vivid = function(ranges) {
    if (!ranges) {
        ranges = [
            [150,256],
            [0, 190],
            [0, 30]
        ];
    }
    var g = function() {
        //select random range and remove
        var range = ranges.splice(Math.floor(Math.random()*ranges.length), 1)[0];
        //pick a random number from within the range
        return Math.floor(Math.random() * (range[1] - range[0])) + range[0];
    };
    return "rgb(" + g() + "," + g() + "," + g() +")";
};

ui.random = random;
