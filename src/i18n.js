// Internationalization

var locale = "zh-CN",
    language = {},
    defaultNote = "common";

ui.i18n = function() {
    var i, len, 
        propertyNameArr,    
        propertyName,
        langObj;

    len = arguments.length;
    if(len === 0) {
        return language[defaultNote];
    } else if(len === 1) {
        propertyNameArr = [arguments[0]];
    } else {
        propertyNameArr = Array.from(arguments);
    }

    langObj = language[propertyNameArr[0]] || language[defaultNote];
    for(i = 1, len = propertyNameArr.length; i < len; i++) {
        propertyName = propertyNameArr[i] || "";
        langObj = langObj[propertyName];
        if(!langObj) {
            break;
        }
    }
    if(langObj === language || !langObj) {
        return null;
    }
    return langObj;
};

ui.i18n.locale = locale;
ui.i18n.language = language;