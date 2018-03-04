
// 事件优先级
ui.eventPriority = {
    masterReady: 3,
    pageReady: 2,

    bodyResize: 3,
    ctrlResize: 2,
    elementResize: 2
};
var page = ui.page = {
    // resize事件延迟时间
    _resizeDelay: 200,
    _resizeTimeoutHandler: null,
    events: [
        "themechanged",
        "hlchanged", 
        "ready", 
        "htmlclick", 
        "docmouseup", 
        "resize", 
        "hashchange"
    ]
};
page.event = new ui.CustomEvent(page);
page.event.initEvents();

$(document)
    //注册全局ready事件
    .ready(function (e) {
        page.fire("ready");
    })
    //注册全局click事件
    .click(function (e) {
        page.fire("htmlclick");
    });

$(window)
    //注册全局resize事件
    .on("resize", function (e) {
        console.log("resize");
        if(page._resizeTimeoutHandler) {
            clearTimeout(page._resizeTimeoutHandler);
        }
        page._resizeTimeoutHandler = setTimeout(function() {
            console.log("do");
            page._resizeTimeoutHandler = null;
            page.fire("resize", 
                document.documentElement.clientWidth, 
                document.documentElement.clientHeight);
        }, page._resizeDelay);
    })
    //注册全局hashchange事件
    .on("hashchange", function(e) {
        var hash = "";
        if(window.location.hash) {
            hash = window.location.hash;
        }
        page.fire("hashchange", hash);
    });
