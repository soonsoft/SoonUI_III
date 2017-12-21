// 折叠视图
function onFoldTitleClick(e) {
    var elem,
        nodeName,
        dd, icon;
    
    elem = $(e.target);
    while((nodeName = elem.nodeName()) !== "DT" 
        || !elem.hasClass("ui-fold-view-title")) {

        if(elem.hasClass("ui-fold-view")) {
            return;
        }
        elem = elem.parent();
    }
    icon = elem.children(".ui-fold-view-icon");
    dd = elem.next();
    if(dd.css("display") === "none") {
        icon.removeClass("background-highlight")
            .addClass("font-highlight")
            .html("<i class='fa fa-angle-up' />");
        dd.css("display", "block");
    } else {
        icon.removeClass("font-highlight")
            .addClass("background-highlight")
            .html("<i class='fa fa-angle-down' />");
        dd.css("display", "none");
    }
}
function FoldView(element) {
    if(this instanceof FoldView) {
        this.initialize(element);
    } else {
        return new FoldView(element);
    }
}
FoldView.prototype = {
    constructor: FoldView,
    initialize: function(element) {
        this.element = element;
        this.onFoldTitleClickHandler = $.proxy(onFoldTitleClick, this);
    },
    _render: function() {
        var dtList,
            dt, div, text,
            i, len;
        dtList = this.element.children("dt");
        len = dtList.length;
        if(len > 0) {
            this.element.click(this.onFoldTitleClickHandler);
        }
        for(i = 0; i < len; i++) {
            dt = $(dtList[i]);
            text = dt.text();
            dt.addClass("ui-fold-view-title");
            div = $("<div class='ui-fold-view-icon border-highlight' />");
            if(dt.next().css("display") === "none") {
                div.addClass("background-highlight")
                    .html("<i class='fa fa-angle-down' />");
            } else {
                div.addClass("font-highlight")
                    .html("<i class='fa fa-angle-up' />");
            }
            dt.empty();
            dt.append(div)
                .append("<span class='font-highlight'>" + text + "</span>");
        }
    }
};

$.fn.foldView = function() {
    var i,
        elem,
        foldView;
    if(this.length === 0) {
        return;
    }
    for(i = 0; i < this.length; i++) {
        elem = $(this[i]);
        if(!elem.isNodeName("dl") || !elem.hasClass("ui-fold-view")) {
            continue;
        }
        foldView = FoldView(elem);
        foldView._render();
        elem[0].foldView = foldView;
    }
};
