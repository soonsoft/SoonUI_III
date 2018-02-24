// ISO 8601日期和时间表示法 https://en.wikipedia.org/wiki/ISO_8601

/*
 'yyyy': 4 digit representation of year (e.g. AD 1 => 0001, AD 2010 => 2010)
 'yy': 2 digit representation of year, padded (00-99). (e.g. AD 2001 => 01, AD 2010 => 10)
 'y': 1 digit representation of year, e.g. (AD 1 => 1, AD 199 => 199)
 'MMMM': Month in year (January-December)
 'MMM': Month in year (Jan-Dec)
 'MM': Month in year, padded (01-12)
 'M': Month in year (1-12)
 'dd': Day in month, padded (01-31)
 'd': Day in month (1-31)
 'EEEE': Day in Week,(Sunday-Saturday)
 'EEE': Day in Week, (Sun-Sat)
 'HH': Hour in day, padded (00-23)
 'H': Hour in day (0-23)
 'hh': Hour in am/pm, padded (01-12)
 'h': Hour in am/pm, (1-12)
 'mm': Minute in hour, padded (00-59)
 'm': Minute in hour (0-59)
 'ss': Second in minute, padded (00-59)
 's': Second in minute (0-59)
 'S': Milliseconds in second (0-999)
 't': the first char of AM/PM marker padded(A/P)
 'tt': AM/PM marker
 'Z': 4 digit (+sign) representation of the timezone offset (-1200-+1200)
 format string can also be one of the following predefined localizable formats:
 
 'medium': equivalent to 'MMM d, y h:mm:ss a' for en_US locale (e.g. Sep 3, 2010 12:05:08 pm)
 'short': equivalent to 'M/d/yy h:mm a' for en_US locale (e.g. 9/3/10 12:05 pm)
 'fullDate': equivalent to 'EEEE, MMMM d,y' for en_US locale (e.g. Friday, September 3, 2010)
 'longDate': equivalent to 'MMMM d, y' for en_US locale (e.g. September 3, 2010
 'mediumDate': equivalent to 'MMM d, y' for en_US locale (e.g. Sep 3, 2010)
 'shortDate': equivalent to 'M/d/yy' for en_US locale (e.g. 9/3/10)
 'mediumTime': equivalent to 'h:mm:ss a' for en_US locale (e.g. 12:05:08 pm)
 'shortTime': equivalent to 'h:mm a' for en_US locale (e.g. 12:05 pm)
 */

var formatters,
	parsers,
	locale;
var rFormat = /((?:[^yMdHhmstZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|t+|Z))(.*)/,
	rAspNetFormat = /^\/Date\((\d+)\)\/$/;
var lastFormat,
	lastParts;

function noop() {}

function toInt(str) {
	return parseInt(str, 10) || 0;
}

function padNumber(num, digits, isTrim) {
	var negative = "";
	if(num < 0) {
		negative = "-";
		num = -num;
	}
	num += "";
	while(num.length < digits) {
		num = "0" + num;
	}
	if(isTrim && num.length > digits) {
		num = num.substring(num.length - digits);
	}
	return negative + num;
}

function dateGetter(name, len, offset, isTrim) {
	return function(date) {
		var value = date["get" + name]();
		if(offset > 0 || value > -offset) {
			value += offset;
		}
		if(value === 0 && offset === -12) {
			// 如果是0点，并且是12个小时制，则将0点改为12点
			value = 12;
		}
		return padNumber(value, len, isTrim)
	};
}

function dateStrGetter(name, shortForm) {
	return function(date, formats) {
		var value = date["get" + name],
			key = (shortForm ? ("SHORT" + name) : name).toUpperCase();
		return formats[key][value];
	};
}

function getTimeZone(date) {
	var zone = date.getTimezoneOffset() * -1,
		result = "";

	if(zone >= 0) {
		result += "+";
	}
	if(zone > 0) {
		result += padNumber(Math.floor(zone / 60), 2);
	} else {
		result += padNumber(Math.ceil(zone / 60), 2);
	}
	result += ":" + padNumber(Math.abs(zone % 60), 2);

	return result;
}

function ampmGetter(len) {
	return function(date) {
		var value = date.getHours(),
			result = value > 12 ? "PM" : "AM";
		if(result.length > len) {
			result = result.substring(0, len);
		}
		return result;
	};
}

formatters = {
	"yyyy": dateGetter("FullYear", 4),
	"yy": dateGetter("FullYear", 2, 0, true),
	"y": dateGetter("FullYear", 1),
	"MMMM": dateStrGetter("Month"),
	"MMM": dateStrGetter("Month", true),
	"MM": dateGetter("Month", 2, 1),
	"M": dateGetter("Month", 1, 1),
	"dd": dateGetter("Date", 2),
	"d": dateGetter("Date", 1),
	"EEEE": dateStrGetter("Day"),
	"EEE": dateStrGetter("Day", true),
	"HH": dateGetter("Hours", 2),
	"H": dateGetter("Hours", 1),
	"hh": dateGetter("Hours", 2, -12),
	"h": dateGetter("Hours", 1, -12),
	"mm": dateGetter("Minutes", 2),
	"m": dateGetter("Minutes", 1),
	"ss": dateGetter("Seconds", 2),
	"s": dateGetter("Seconds", 1),
	"S": dateGetter("Milliseconds", 1),
	"t": ampmGetter(1),
	"tt": ampmGetter(2),
	"Z": getTimeZone
};

function getDateParser(name) {
	return function(value, dateInfo) {
		dateInfo[name] = toInt(name);
	};
}

function ampmParser(value, dateInfo) {
	value = value.toUpperCase();
	if(value === "P" || value === "PM") {
		dateInfo.AMPM = "PM";
	} else {
		dateInfo.AMPM = "AM";
	}

	if(dateInfo.hours > 0) {
		hour12Parser(dateInfo.hours, dateInfo);
	}
}

function hour12Parser(value, dateInfo) {
	dateInfo.hours = toInt(value);
	if(dateInfo.hasOwnProperty("AMPM")) {
		if(dateInfo.AMPM === "PM" && dateInfo.hours > 0) {
			dateInfo.hours += 12;
			if(dateInfo.hours >= 24) {
				dateInfo.hours = 0;
			}
		}
	}
}

function monthTextParser(value, dateInfo, part) {
	var name = (part.length === 4 ? "" : "SHORT") + "_MONTH_MAPPING";
	if(!locale[name]) {
		dateInfo.month = NaN;
		return;
	}
	dateInfo.month = locale[name][value] || NaN;
}

parsers = {
	"yyyy": getDateParser("year"),
	"yy": noop,
	"y": getDateParser("year"),
	"MMMM": monthTextParser,
	"MMM": monthTextParser,
	"MM": getDateParser("month"),
	"M": getDateParser("month"),
	"dd": getDateParser("date"),
	"d": getDateParser("date"),
	"EEEE": noop,
	"EEE": noop,
	"HH": getDateParser("hours"),
	"H": getDateParser("hours"),
	"hh": hour12Parser,
	"h": hour12Parser,
	"mm": getDateParser("minutes"),
	"m": getDateParser("minutes"),
	"ss": getDateParser("seconds"),
	"s": getDateParser("seconds"),
	"S": getDateParser("milliseconds"),
	"t": ampmParser,
	"tt": ampmParser,
	"Z": noop
};

locale = {
	"MONTH": ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
	"DAY": ["星期天", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
	"SHORTDAY": ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],

	default: "yyyy-MM-dd HH:mm:ss"
};
locale["SHORTMONTH"] = locale["MONTH"];

function getParts(format) {
	var parts;
	if(format === lastFormat) {
		parts = lastParts;
	} else {
		parts = [];
		while(format) {
			match = rFormat.exec(format);
			if(match) {
				parts.push(match[1]);
				format = parts[2];
			} else {
				parts.push(format);
				break;
			}
		}
		if(parts.length > 0) {
			lastFormat = format;
			lastParts = parts;
		}
	}
	return parts;
}

ui.date = {
	format: function(date, format) {
		var dateValue,
			formatValue,
			match,
			parts,
			result;

		if(ui.core.isString(date)) {
			if(/^\d+$/.test(date)) {
				// 如果全是数字
				dateValue = toInt(date);
			} else {
				// 尝试ISO 8601
				dateValue = new Date(date);
				if(isNaN(dateValue)) {
					// 尝试AspNet的格式
					dateValue = rAspNetFormat.exec(date);
					if(dateValue !== null) {
						dateValue = Number(dateValue[1]);
					}
				}
			}
		} else {
			dateValue = date;
		}

		if(ui.core.isNumber(dateValue)) {
			dateValue = new Date(dateValue);
		}

		result = [];

		formatValue = format || "default";
		formatValue = locale[formatValue] || formatValue;
		
		if(dateValue instanceof Date) {
			parts = getParts(formatValue);
			parts.forEach(function(p) {
				var formatter = formatters[p];
				if(formatter) {
					result.push(formatter(dateValue, locale));
				} else {
					result.push(p);
				}
			});
		}

		return result.join("");
	},
	parse: function(dateStr, format) {
		var formatValue,
			parts,
			valueParts,
			part,
			nextPart,
			startIndex, index,
			i, len,
			dateInfo;

		if(typeof dateStr !== "string" || !dateStr) {
			return null;
		}

		formatValue = format || "default";
		formatValue = locale[formatValue] || formatValue;

		dateInfo = {
			year: 1970,
			month: 0,
			date: 1,
			hours: 0,
			minutes: 0,
			seconds: 0,
			milliseconds: 0
		};

		parts = getParts(format);
		startIndex = 0;
		for(i = 0, len = parts.length; i < len;) {
			part = parts[i];
			if(!parsers.hasOwnProperty(part)) {
				i++;
				startIndex += part.length;
				continue;
			}

			i++;
			if(i < len) {
				nextPart = parsers[i + 1];
				index = dateStr.indexOf(nextPart, startIndex);
			} else {
				index = dateStr.length;
			}

			parsers[part](dateStr.substring(startIndex, index), dateInfo, part);
			startIndex += index;
		}

		return new Date(
			dateInfo.year,
			dateInfo.month,
			dateInfo.date,
			dateInfo.hours,
			dateInfo.minutes,
			dateInfo.seconds,
			dateInfo.milliseconds);
	},
	locale: locale
};
