
var supportsPushState = typeof window !== 'undefined' && (function() {
    return window.history && "pushState" in window.history;
})();
var _key = getKey();

function getKey() {
    return Date.now().toFixed(3);
}

function callFn(fn, args) {
    if(ui.core.isFunction(fn)) {
        fn.apply(null, args);
    }
}

function transitionTo(location, onComplete, onAbort) {
    var view = location.view;
    var promise;
    if(view) {
        try {
            promise = view.render(this);
            if(promise && ui.core.isFunction(promise.then)) {
                promise
                    .then(function(viewInstance) {
                        onComplete(viewInstance, location);
                    })
                    .catch(function(e) {
                        onAbort(e, location);
                    });
            } else {
                // 返回的是viewInstance
                onComplete(promise, location);
            }
        } catch(e) {
            onAbort(e, location);
        }
    }
}

function pushState(url, isReplace) {
    var history = window.history;
    try {
        if (isReplace) {
            history.replaceState({ key: _key }, '', url);
        } else {
            _key = genKey();
            history.pushState({ key: _key }, '', url);
        }
    } catch (e) {
        window.location[isReplace ? 'replace' : 'assign'](url);
    }
}

var historyPrototype = {
    _baseInitailize: function() {
        this.beforeTransitionHandler = ui.LinkedList();

        this.current = null;
        this.pedding = null;
        // START PEDDING READY
        this.status = "START";
    },
    _transition: function(location, onComplete, onAbort) {
        var currentRouter = this.current;
        transitionTo(
            location, 
            function(viewInstance, location) {
                this.current = location;
                if(currentRouter) {
                    currentRouter.view.dispose();
                }
                callFn(onComplete, arguments);
            }, 
            function() {
                callFn(onAbort, arguments);
            }
        );
    }
};

/*
    Hash History API通过在URL后面添加#/url这样的方式完成前端路由，兼容性更好，不过URL的样式不太好看。
 */
function HashHistory(routeTable) {
    if(this instanceof HashHistory) {
        this.initialize(routeTable);
    } else {
        return new HashHistory(routeTable);
    }
}
HashHistory.prototype = ui.extend({}, historyPrototype, {
    constructor: HashHistory,
    initialize: function(routeTable) {
        if(!routeTable) {
            throw new TypeError("the parameter routeTable is required.");
        }

        this._baseInitailize();

        // 当用户通过浏览器UI，前进后退按钮或是地址栏输入的方式才会触发该事件
        window.addEventListener(
            supportsPushState ? "popstate" : "hashchange", 
            (function(e) {
                // var current = this.getCurrent();
                var location;
                if(!this.ensureSlash()) {
                    return;
                }
                location = routeTable.match(this.getHash());
                this._transitionTo(location, function(location) {
                    
                });
            }).bind(this)
        );
    },
    getHash: function() {
        var href = window.location.href,
            hashPosition = href.indexOf("#"),
            queryStringPosition;
        if(hashPosition < 0) {
            return "";
        }

        href = href.substring(hashPosition + 1);
        queryStringPosition = href.indexOf("?");
        if(queryStringPosition < 0) {
            hashPosition = href.indexOf("#");
            href = hashPosition > -1
                        ? decodeURI(herf.substring(0, hashPosition)) + href.substring(hashPosition)
                        : decodeURI(href);
        } else {
            href = decodeURI(href.substring(0, queryStringPosition)) + href.substring(queryStringPosition);
        }
        return href;
    },
    getUrl: function(path) {
        var href = window.location.href,
            hashPosition = href.indexOf("#"),
            base = hashPosition > -1 ? href.substring(0, hashPosition) : href,
            queryStringPosition = base.indexOf("?"),
            queryString = queryStringPosition > -1 ? base.substring(queryStringPosition) : "";
            
        base = queryStringPosition > -1 ? base.substring(0, queryStringPosition) : base;
        return [base, "#", path, queryString].join("");
    },
    pushHash: function(path) {
        var url = this.getUrl(path);
        if(supportsPushState) {
            pushState(url);
        } else {
            window.location.hash = path;
        }
    },
    replaceHash: function(path) {
        var url = this.getUrl(path);
        if(supportsPushState) {
            pushState(url, true);
        } else {
            window.location.replace(url);
        }
    },
    ensureSlash: function() {
        var url = this.getHash();
        if (url.charAt(0) === '/') {
            return true;
        }
        this.replaceHash('/' + url);
        return false;
    },
    // 跳转
    go: function(num) {
        window.history.go(num);
    },
    // 跳转，激活后退按钮
    push: function(location, onComplete, onAbort) {
        this._transition(location, (function() {
            this.pushHash(location.url);
            callFn(onComplete, arguments);
        }).bind(this), onAbort);
    },
    // 跳转，无法通过后退按钮回到之前的页面
    replace: function(location, onComplete, onAbort) {
        this._transition(location, (function() {
            this.replaceHash(location.url);
            callFn(onComplete, arguments);
        }).bind(this), onAbort);
    },
    // 获取当前的url关联的路由对象
    getCurrentLocation: function() {
        return this.getHash();
    }
});

/*
    HTML5 History API可以通过pushstate和replacestate两个方法向浏览器的“前进”和“后退”按钮添加信息，用户点击浏览器导航按钮后，如果该项目是由pushstate和replacestate添加的就会触发popstate事件
    此时，并不会刷新页面，但是可以将url替换为一个普通url样式，但用户如果手动点击“刷新”按钮后，由于后台并不能处理这个url，所以会返回404。
    这需要后台枚举出前端所有的url，并统一返回"/"对应的view。
    *注意：pushstate和replacestate两个方法被调用并不会触发pushstate事件，只有用户点击浏览器的导航按钮才能触发。
 */
// function HTML5History() {
//     if(this instanceof HTML5History) {
//         this.initialize();
//     } else {
//         return new HTML5History();
//     }
// }
// HashHistory.prototype = ui.extend({}, historyPrototype, {
//     constructor: HTML5History,
//     initialize: function() {
//         window.addEventListener("popstate", function(e) {

//         });
//     }
// });


/** 路由表 */
function RouteTable() {
    this.nameMap = {};
    this.urls = [];
}
RouteTable.prototype = {
    constructor: RouteTable,
    match: function(url, params) {
        var location = this._matchByName(url, params);
        if(!location) {
            location = this._matchByUrl(url);
        }
        return location;
    },
    add: function(route) {
        var url = route.url,
            parts;

        if(!url) {
            return;
        }
    
        parts = getParts(url);
        route.parts = parts;
        this.urls.push(route);
        if(ui.core.isString(route.name)) {
            route.name = ui.str.trim(route.name);
            if(route.name) {
                this.nameMap[route.name] = this.urls.length - 1;
            }
        }
    },
    _matchByName: function(name, params) {
        var location,
            route,
            urlParts = [];
        
        route = this.nameMap[name];
        if(!route) {
            return null;
        }

        if(!params) {
            params = {};
        }

        route.parts.forEach(function(p) {
            if(p.charAt(0) === ":") {
                urlParts.push(encodeURIComponent(params[p.substring(1)]));
            } else {
                urlParts.push(p);
            }
        });

        location = {
            url: "/" + urlParts.join("/"),
            params: params 
        };
        this._mergeLocation(location, route);

        return location;
    },
    _matchByUrl: function(url) {
        var i, len,
            route, location,
            queryStringPosition = url.indexOf("?"),
            queryString = queryStringPosition > -1 ? url.substring(queryStringPosition) : null;

        if(queryStringPosition > -1) {
            url = url.substring(0, queryStringPosition);
            queryString = ui.url.getParams(queryString);
        }
        
        for(i = 0, len = this.urls.length; i < len; i++) {
            route = this.urls[i];
            location = matchRoute(route, url, queryString);
            if(location) {
                this._mergeLocation(location, route);
                return location;
            }
        }
        return null;
    },
    _mergeLocation: function(location, route) {
        location.view = route.view || null;
        if(route.params) {
            Object.keys(route.params).forEach(function(key) {
                var value = location.params[key];
                if(typeof value === "undefined" || typeof value === "null") {
                    location.params[key] = value;
                }
            });
        }
    }
};
function getParts(url) {
    var parts = [];
    url.split("/").forEach(function(p) {
        p = ui.str.trim(p);
        if(p.length !== 0) {
            parts.push(p);
        }
    });
    return parts;
}
function matchRoute(route, url, queryString) {
    var location,
        params,
        urlParts,
        i, len,
        routePart,
        urlPart;

    url = queryStringPosition > -1 ? url.substring(0, queryStringPosition) : url;
    urlParts = getParts(url);
    if(route.parts.length !== urlParts.length) {
        return null;
    }

    params = {};
    if(queryString) {
        Object.keys(queryString).forEach(function(key) {
            params[key] = queryString[key];
        });
    }

    for(i = 0, len = route.parts.length; i < len; i++) {
        routePart = route.parts[i];
        urlPart = urlParts[i];
        if(routePart.charAt(0) === ":") {
            params[routePart.substring(1)] = urlPart;
            urlParts[i] = encodeURIComponent(urlPart);
        } else {
            if(routePart.toLowerCase() !== urlPart.toLowerCase()) {
                return null;
            }
        }
    }

    location = {
        url: "/" + urlParts.join("/"),
        params: params
    };
    return location;
}

/** 前端路由器 */
function Router(routes) {
    var i;

    this.routerTable = new RouteTable();
    if(Array.isArray(routes)) {
        for(i = 0; i < routes.length; i++) {
            this.routerTable.add(routes[i]);
        }
    }

    this.history = new HashHistory(this.routeTable);
}
Router.prototype = {
    constructor: Router,
    go: function(num) {
        this.history.go(num);
    },
    back: function() {
        this.history.go(-1);
    },
    forward: function() {
        this.history.go(1);
    },
    push: function(url, params) {
        var location = this.routerTable.match(url, params);
        this.history.push(location);
    },
    replace: function(url, params) {
        var location = this.routerTable.match(url, params);
        this.history.replace(location);
    }
};

ui.Router = function(routes) {
    var router = new Router(routes);
    return router;
};