
function setHighlight(highlight, url) {
    var sheet = document.getElementById(ui.theme.highlightSheetId),
        styleUrl = url;
    if(sheet) {
        // 如果没有指定Url，则使用现有的Url更新参数
        if(!styleUrl) {
            styleUrl = sheet.href;
            styleUrl = ui.url.setParams({
                highlight: highlight.Id
            });
        }
        sheet.href = styleUrl;
    }
    ui.theme.currentHighlight = highlight;
    ui.page.fire("hlchanged", ui.theme.currentHighlight);
}

//主题
ui.theme = {
    /** 当前的主题 */
    currentTheme: "Light",
    /** 用户当前设置的主题 */
    currentHighlight: null,
    /** 默认主题色 */
    defaultHighlight: "Default",
    /** 主题文件StyleID */
    highlightSheetId: "highlight",
    /** 获取高亮色 */
    getHighlight: function (highlight) {
        var highlightInfo,
            info,
            i, len;
        if (!highlight) {
            highlight = this.defaultHighlight;
        }
        if (Array.isArray(this.highlights)) {
            for (i = 0, len = this.highlights.length; i < len; i++) {
                info = this.highlights[i];
                if (info.Id === highlight) {
                    highlightInfo = info;
                    break;
                }
            }
        }
        return highlightInfo;
    },
    /** 修改高亮色 */
    changeHighlight: function(url, color) {
        ui.post(url, { themeId: color.Id },
            function(success) {
                if(success.Result) {
                    setHighlight(color);
                }
            }, "json"
        );
    },
    /** 设置高亮色 */
    setHighlight: function(color, styleUrl) {
        if(color) {
            setHighlight(color, styleUrl);
        }
    },
    /** 初始化高亮色 */
    initHighlight: function() {
        var sheet,
            styleUrl,
            highlight;
        sheet = document.getElementById(this.highlightSheetId);
        if(sheet) {
            styleUrl = sheet.href;
            highlight = ui.url.getParams(styleUrl).highlight;
        }
        this.currentHighlight = this.getHighlight(highlight) || null;
        if(this.currentHighlight) {
            ui.page.fire("hlchanged", this.currentHighlight);
        }
    }
};
