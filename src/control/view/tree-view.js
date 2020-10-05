
/**
 * 树形列表
 */

ui.ctrls.define("ui.ctrls.TreeView", ui.ctrls.SelectionTree, {
    _render: function() {
        var position;

        this.treePanel = this.element;
        position = this.treePanel.css("position");
        
        this.treePanel
            .addClass("ui-selection-tree-panel")
            .addClass("ui-tree-view-panel")
            .css("position", position);
        this.treePanel.on("click", this.onTreeItemClickHandler);

        if (Array.isArray(this.option.viewData)) {
            this._fill(this.option.viewData);
        }
    }
});

$.fn.treeView = function(option) {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.TreeView(option, this);
};
