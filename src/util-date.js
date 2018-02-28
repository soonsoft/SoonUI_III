// ISO 8601日期和时间表示法 https://en.wikipedia.org/wiki/ISO_8601

/*
 'yyyy': 4位数字年份，会补零 (e.g. AD 1 => 0001, AD 2010 => 2010)
 'yy': 2位数字年份 (e.g. AD 2001 => 01, AD 2010 => 10)
 'y': 不固定位数年份, e.g. (AD 1 => 1, AD 199 => 199)
 'MMMM': 完整月份 (January-December)
 'MMM': 简写月份 (Jan-Dec)
 'MM': 2位数字月份, padded (01-12)
 'M': 不固定位数月份 (1-12)
 'dd': 2位数字日期, padded (01-31)
 'd': 不固定位数日期 (1-31)
 'EEEE': 完整星期表示,(Sunday-Saturday)
 'EEE': 简写星期表示, (Sun-Sat)
 'HH': 2位数字小时, padded (00-23)
 'H': 不固定位数小时 (0-23)
 'hh': 2位数字12小时表示, padded (01-12)
 'h': 不固定位数12小时表示, (1-12)
 'mm': 2位数字分钟, padded (00-59)
 'm': 不固定位数分钟 (0-59)
 'ss': 2位数字秒, padded (00-59)
 's': 不固定位数秒 (0-59)
 'S': 毫秒数 (0-999)
 't': AM和PM的第一个字符(A/P)
 'tt': AM/PM
 'Z': 时区格式化如(+08:00)
 格式化别名:
 
 'default': 'yyyy-MM-dd HH:mm:ss'
 'medium': 'yyyy-MM-dd HH:mm'
 'date': 'yyyy-MM-dd'
 'longDate': 'yyyy-MM-dd EEEE',
 'shortDate': 'y-M'
 'time': 'HH:mm:ss'
 'shortTime': 'HH:mm'
 'time12': 'h:m:s tt'
 'shortTime12': 'h:m tt'
 */

var formatters,
	parsers,
	locale;
var rFormat = /((?:[^yMdHhmsStZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|S|t+|Z))(.*)/,
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
		var value = date["get" + name](),
			key = (shortForm ? ("SHORT" + name) : name).toUpperCase();
		return formats[key][value];
	};
}

function getTimeZone(date) {
	var zone,
		result;

	zone = date.getTimezoneOffset();
	if(zone === 0) {
		return "Z";
	}

	zone *= -1;
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
	"S": dateGetter("Milliseconds", 3),
	"t": ampmGetter(1),
	"tt": ampmGetter(2),
	"Z": getTimeZone
};

function getDateParser(name) {
	return function(value, dateInfo) {
		dateInfo[name] = toInt(value);
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

function monthTextParser(value, dateInfo, parts, index) {
	var part, name;
	part = parts[index];
	name = (part.length === 4 ? "" : "SHORT") + "MONTH_MAPPING";
	if(!locale[name]) {
		dateInfo.month = NaN;
		return;
	}
	dateInfo.month = locale[name][value] || NaN;
}

function parseTimeZone(dateStr, startIndex, dateInfo, parts, index) {
	var part = parts[index],
		datePart,
		timeZonePart,
		hour, minute,
		skip = startIndex,
		char,
		i;

	for(i = startIndex; i < dateStr.length; i++) {
		char = dateStr.charAt(i);
		if(char === 'Z' || char === '+' || char === '-') {
			datePart = dateStr.substring(startIndex, i);
			if(char === 'Z') {
				timeZonePart = dateStr.substring(i, i + 1);
			} else {
				timeZonePart = dateStr.substring(i, i + 6);
			}
			break;
		}
	}

	if(datePart && parsers[part]) {
		skip += datePart.length;
		parsers[part](datePart, dateInfo, parts, index);
	}
	if(timeZonePart && timeZonePart !== "Z") {
		skip += timeZonePart.length;
		char = timeZonePart.charAt(0);
		minute = timeZonePart.substring(1).split(":");
		hour = toInt(minute[0]);
		minute = toInt(minute[1]);

		dateInfo.timezone = hour * 60;
		dateInfo.timezone += minute;
		if(char === '-' && dateInfo.timezone > 0) {
			dateInfo.timezone = -dateInfo.timezone;
		}
	}
	return skip;
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
	"MONTH_MAPPING": {
		"一月": 1,
		"二月": 2,
		"三月": 3,
		"四月": 4,
		"五月": 5,
		"六月": 6,
		"七月": 7,
		"八月": 8,
		"九月": 9,
		"十月": 10,
		"十一月": 11,
		"十二月": 12
	},

	default: "yyyy-MM-dd HH:mm:ss",
	medium: "yyyy-MM-dd HH:mm",
	date: "yyyy-MM-dd",
	longDate: "yyyy-MM-dd EEEE",
	shortDate: "y-M",
	time: "HH:mm:ss",
	shortTime: "HH:mm",
	time12: "h:m:s tt",
	shortTime12: "h:m tt",
	json: "yyyy-MM-ddTHH:mm:ss.SZ"
};
locale["SHORTMONTH"] = locale["MONTH"];
locale["SHORTMONTH_MAPPING"] = locale["MONTH_MAPPING"];

function getParts(format) {
	var parts,
		match;
	if(format === lastFormat) {
		parts = lastParts;
	} else {
		parts = [];
		while(format) {
			match = rFormat.exec(format);
			if(match) {
				parts.push(match[1]);
				format = match[2];
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

function parseJSON(dateStr) {
	var date;

	dateStr = dateStr.trim();
	if(dateStr.length === 0) {
		return null;
	}

	if(/^\d+$/.test(dateStr)) {
		// 如果全是数字
		return new Date(toInt(dateStr));
	} else {
		// 尝试ISO 8601
		date = new Date(dateStr);
		if(isNaN(date)) {
			// 尝试AspNet的格式
			date = rAspNetFormat.exec(dateStr);
			if(date !== null) {
				date = new Date(Number(date[1]));
			}
		}
		return isNaN(date) ? null : date;
	}
}

ui.date = {
	format: function(date, format) {
		var dateValue,
			formatValue,
			match,
			parts,
			result;

		if(ui.core.isString(date)) {
			dateValue = parseJSON(date);
		} else {
			dateValue = date;
		}

		if(ui.core.isNumber(dateValue)) {
			dateValue = new Date(dateValue);
		}

		result = [];

		formatValue = (ui.core.isString(format) ? format.trim() : format) || "default";
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
	parseJSON: function(dateStr) {
		if(ui.core.isString(dateStr)) {
			return parseJSON(dateStr);
		} else if(dateStr instanceof Date) {
			return dateStr;
		} else {
			return null;
		}
	},
	parse: function(dateStr, format) {
		var formatValue,
			parts,
			part,
			nextPart,
			timeZoneParser,
			startIndex, endIndex, index,
			i, len,
			dateInfo,
			result;

		if(typeof dateStr !== "string" || !dateStr) {
			return null;
		}

		formatValue = (ui.core.isString(format) ? format.trim() : format) || "default";
		formatValue = locale[formatValue] || formatValue;

		dateInfo = {
			year: 1970,
			month: 1,
			date: 1,
			hours: 0,
			minutes: 0,
			seconds: 0,
			milliseconds: 0
		};

		parts = getParts(formatValue);
		startIndex = 0;
		for(i = 0, len = parts.length; i < len;) {
			part = parts[i];
			nextPart = "";
			index = i;
			if(!parsers.hasOwnProperty(part)) {
				i++;
				startIndex += part.length;
				continue;
			}

			i++;
			if(i < len) {
				nextPart = parts[i];
				if(nextPart === "Z") {
					// 对时区做特殊处理
					i++;
					timeZoneParser = parsers[nextPart];
					if(timeZoneParser === noop || !ui.core.isFunction(timeZoneParser)) {
						timeZoneParser = parseTimeZone;
					}
					startIndex += timeZoneParser(dateStr, startIndex, dateInfo, parts, index);
					continue;
				} else {
					if(parsers.hasOwnProperty(nextPart)) {
						return null;
					}
					i++;
					endIndex = dateStr.indexOf(nextPart, startIndex);
					if(endIndex === -1) {
						return null;
					}
				}
			} else {
				endIndex = dateStr.length;
			}

			if(parsers[part]) {
				parsers[part](
					dateStr.substring(startIndex, endIndex), 
					dateInfo, 
					parts, 
					index);
			}
			startIndex = endIndex + nextPart.length;
		}

		result = new Date(
			dateInfo.year,
			dateInfo.month - 1,
			dateInfo.date,
			dateInfo.hours,
			dateInfo.minutes,
			dateInfo.seconds,
			dateInfo.milliseconds);
		if(dateInfo.timezone) {
			result.setMinutes(result.getMinutes() + dateInfo.timezone);
		}
		return result;
	},
	locale: locale
};
