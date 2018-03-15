// cookie 操作

function parseCookieValue(s) {
    if (s.indexOf('"') === 0) {
        // This is a quoted cookie as according to RFC2068, unescape...
        s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    try {
        //处理加号
        return decodeURIComponent(s.replace(/\+/g, ' '));
    } catch (e) {
        return s;
    }
}

ui.cookie = {
    stringify: function(name, val, opts) {
        var pairs = [name + "=" + encodeURIComponent(val)];
        if (isFinite(opts) && typeof opts === "number") {
            pairs.push("Max-Age=" + opts);
        } else {
            opts = opts || {};
            if (opts.maxAge)
                pairs.push("Max-Age=" + opts.maxAge);
            if (opts.domain)
                pairs.push("Domain=" + opts.domain);
            if (opts.path)
                pairs.push("Path=" + opts.path);
            if (opts.expires)
                pairs.push("Expires=" + opts.expires.toUTCString());
            if (opts.httpOnly)
                pairs.push("HttpOnly");
            if (opts.secure)
                pairs.push("Secure");
        }
        return pairs.join("; ");
    },
    forEach: function(callback) {
        var pairs = String(document.cookie).split(/; */);
        pairs.forEach(function(pair) {
            var index = pair.indexOf('=');
            if (index === -1) {
                return;
            }
            var key = pair.substr(0, index).trim();
            var val = pair.substr(++index, pair.length).trim();
            callback(key, parseCookieValue(val));
        });
    },
    get: function(name) {
        var ret;
        try {
            this.forEach(function(key, value) {
                if (key === name) {
                    ret = value;
                    throw "";
                }
            });
        } catch (e) {
        }
        return ret;
    },
    getAll: function() {
        var obj = {};
        this.forEach(function(key, value) {
            if (!(key in obj)) {
                obj[key] = value;
            }
        });
        return obj;
    },
    set: function(key, val, opts) {
        document.cookie = this.stringify.apply(0, arguments);
    },
    remove: function(key, opt) {
        opt = opt || {};
        if (!opt.expires) {
            opt.expires = new Date(1970, 0, 1);
        }
        this.set(key, '', opt);
    },
    clear: function() {
        var that = this;
        this.forEach(function(key, value) {
            that.remove(key);
        });
    }
};