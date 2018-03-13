//全局遮罩
ui.mask = {
    maskId: "#ui_mask_rectangle",
    isOpen: function() {
        return $(this.maskId).css("display") === "block";
    },
    open: function(target, option) {
        var mask = $(this.maskId),
            body = $(document.body),
            offset;
        if(ui.core.isPlainObject(target)) {
            option = target;
            target = null;
        }
        if(!target) {
            target = option.target;
        }
        target = ui.getJQueryElement(target);
        if(!target) {
            target = body;
        }
        if(!option) {
            option = {};
        }
        option.color = option.color || "#000000";
        option.opacity = option.opacity || .6;
        option.animate = option.animate !== false;
        if (mask.length === 0) {
            mask = $("<div class='mask-panel' />");
            mask.prop("id", this.maskId.substring(1));
            body.append(mask);
            ui.page.resize(function (e, width, height) {
                mask.css({
                    "height": height + "px",
                    "width": width + "px"
                });
            }, ui.eventPriority.ctrlResize);
            this._mask_animator = ui.animator({
                target: mask,
                onChange: function (op) {
                    this.target.css({
                        "opacity": op / 100,
                        "filter": "Alpha(opacity=" + op + ")"
                    });
                }
            });
            this._mask_animator.duration = 500;
        }
        mask.css("background-color", option.color);
        this._mask_data = {
            option: option,
            target: target
        };
        if(target.nodeName() === "BODY") {
            this._mask_data.overflow = body.css("overflow");
            if(this._mask_data.overflow !== "hidden") {
                body.css("overflow", "hidden");
            }
            mask.css({
                top: "0",
                left: "0",
                width: document.documentElement.clientWidth + "px",
                height: document.documentElement.clientHeight + "px"
            });
        } else {
            offset = target.offset();
            mask.css({
                top: offset.top + "px",
                left: offset.left + "px",
                width: target.outerWidth() + "px",
                height: target.outerHeight() + "px"
            });
        }
        
        if(option.animate) {
            mask.css({
                "display": "block",
                "opacity": "0",
                "filter": "Alpha(opacity=0)"
            });
            this._mask_animator[0].begin = 0;
            this._mask_animator[0].end = option.opacity * 100;
            this._mask_animator.start();
        } else {
            mask.css({
                "display": "block",
                "filter": "Alpha(opacity=" + (option.opacity * 100) + ")",
                "opacity": option.opacity
            });
        }
        return mask;
    },
    close: function() {
        var mask, data;

        mask = $(this.maskId);
        if (mask.length === 0) {
            return;
        }
        data = this._mask_data;
        this._mask_data = null;
        if(data.target.nodeName() === "BODY") {
            data.target.css("overflow", data.overflow);
        }
        if(data.option.animate) {
            this._mask_animator[0].begin = 60;
            this._mask_animator[0].end = 0;
            this._mask_animator.start().then(function() {
                mask.css("display", "none");
            });
        } else {
            mask.css("display", "none");
        }
    }
};