var open = "{",
    close = "}",
    formatterOperator = "|";
function bindTemplate(data, converter) {
    var indexes = this.braceIndexes,
        parts,
        name,
        index, value,
        i, len;
    if(!converter) {
        converter = {};
    }
    if(Array.isArray(indexes)) {
        parts = [].concat(this.parts)
        for(i = 0, len = indexes.length; i < len; i++) {
            index = indexes[i];
            name = parts[index];
            if(ui.str.isEmpty(name)) {
                parts[index] = "";
            } else {
                value = getValue(name, data, converter);
                if(ui.str.isEmpty(value)) {
                    value = "";
                }
                parts[index] = value;
            }
        }
    } else {
        parts = this.parts;
    }
    return parts.join("");
}
function getValue(name, data, converter) {
    var index,
        formatterName,
        names, type,
        value;

    if(!data) {
        return null;
    }
    
    index = name.indexOf(formatterOperator);
    if(index >= 0) {
        formatterName = name.substring(index + 1).trim();
        name = name.substring(0, index).trim();
    }

    names = name.split(".");
    value = names.reduce(function(o, n) {
        if(!o) {
            return null;
        }
        return o[n];
    }, data);

    type = ui.core.type(value);
    if(type === "null" || type === "undefined") {
        return null;
    }
    
    if(formatterName && converter && ui.core.isFunction(converter[formatterName])) {
        return converter[formatterName].call(data, value, name);
    }

    return value;
}
function parseTemplate(template) {
    var index, 
        openIndex,
        closeIndex,
        builder,
        parts;
    parts = [];
    builder = {
        parts: parts,
        braceIndexes: [],
        statusText: "",
        bind: bindTemplate
    };
    if(typeof template !== "string" || template.length === 0) {
        parts.push(template);
        builder.statusText = "template error";
        return builder;
    }
    index = 0;
    while(true) {
        openIndex = template.indexOf(open, index);
        closeIndex = template.indexOf(close, (openIndex > -1 ? openIndex : index));
        // 没有占位符
        if(openIndex < 0 && closeIndex < 0) {
            parts.push(template.substring(index));
            break;
        }
        // 可是要输出'}'标记符
        if(closeIndex > -1 && (closeIndex < openIndex || openIndex === -1)) {
            if(template.charAt(closeIndex + 1) !== close) {
                throw new TypeError("字符'}'， index:" + closeIndex + "， 标记符输出格式错误，应为}}");
            }
            parts.push(template.substring(index, closeIndex + 1));
            index = closeIndex + 2;
            continue;
        }
        // 处理占位符
        parts.push(template.substring(index, openIndex));
        index = openIndex + 1;
        if(template.charAt(index) === open) {
            // 说明要输出'{'标记符
            parts.push(template.charAt(index));
            index += 1;
            continue;
        }
        if(closeIndex === -1) {
            throw new TypeError("缺少闭合标记，正确的占位符应为{text}");
        }
        parts.push(template.substring(index, closeIndex).trim());
        builder.braceIndexes.push(parts.length - 1);
        index = closeIndex + 1;
    }
    return builder;
}

function parseXML(data) {
    var xml, tmp;
	if (!data || typeof data !== "string") {
		return null;
	}
	try {
		if (window.DOMParser) { 
            // Standard
			tmp = new DOMParser();
			xml = tmp.parseFromString(data, "text/xml");
		} else { 
            // IE
			xml = new ActiveXObject("Microsoft.XMLDOM");
			xml.async = "false";
			xml.loadXML(data);
		}
	} catch(e) {
		xml = undefined;
	}
	if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
		throw new TypeError("Invalid XML: " + data);
	}
	return xml;
}

function parseHTML(html) {
    return html;
}

ui.parseTemplate = parseTemplate;
ui.parseXML = parseXML;
ui.parseHTML = parseHTML;
ui.parseJSON = JSON.parse;