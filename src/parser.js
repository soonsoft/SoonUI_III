
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

function parseHTML() {

}

ui.parseXML = parseXML;
ui.parseHTML = parseHTML;
ui.parseJSON = JSON.parse;