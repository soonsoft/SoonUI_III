// Progress

// TODO Progress
ui.ctrls.define("ui.ctrls.Progress", {
    _defineOption: function() {
        return {
        };
    },
    _defineEvents: function() {
        return ["changed"];
    },
    _create: function() {
    },
    _render: function() {
    }
});

$.fn.progress = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Progress(option, this);
};
