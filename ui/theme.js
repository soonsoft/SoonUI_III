
//主题
ui.theme = {
    /** 当前的主题背景色 */
    background: "Light",
    /** 默认主题色 */
    defaultThemeId: "Default",
    /** 主题文件StyleID */
    themeSheetId: "theme",
    /** 用户当前设置的主题 */
    currentTheme: null,
    /** 获取主题 */
    getTheme: function (themeId) {
        if (!themeId)
            themeId = defaultThemeId;
        var info;
        var themeInfo = null;
        if (Array.isArray(this.Colors)) {
            for (var i = 0, l = this.Colors.length; i < l; i++) {
                info = this.Colors[i];
                if (info.Id === themeId) {
                    themeInfo = info;
                    break;
                }
            }
        }
        return themeInfo;
    },
    /** 修改主题 */
    changeHighlight: function(url, color) {
        ui.ajax.ajaxPost(url, 
            { themeId: color.Id },
            function(success) {
                var sheet,
                    url,
                    urlObj;
                if(success.Result) {
                    sheet = $("#" + ui.theme.themeSheetId);
                    if(sheet.length > 0) {
                        url = sheet.prop("href");
                        url = ui.url.setParams({
                            themeId: color.Id
                        });
                        sheet.prop("href", url);
                    }
                    ui.theme.currentTheme = color;
                    ui.page.fire("themeChanged", color);
                }
            },
            function(error) {
                ui.msgshow("修改主题失败，" + error.message, true);
            }
        );
    }
};
