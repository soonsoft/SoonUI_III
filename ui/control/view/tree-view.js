
/**
 * 树形列表
 */

ui.define("ui.ctrls.TreeView", {
    _init: function() {
        var position;

        this.treePanel = this.element;
        position = this.treePanel.css(position);
        
        this.treePanel
            .addClass("ui-selection-tree-panel")
            .addClass("ui-tree-view-panel")
            .css("position", position);
        this.treePanel.click(this.onTreeItemClickHandler);

        if (Array.isArray(this.option.viewData)) {
            this._fill(this.option.viewData);
        }
    }
});
