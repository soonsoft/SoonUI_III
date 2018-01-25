// 为String对象添加ES6的一些方法

function isFunction(fn) {
    return ui.core.isFunction(fn);
}

function ensureInteger(position) {
	var index = position ? Number(position) : 0;
	if(isNaN(index)) {
		index = 0;
	}
	return index;
}

var toString = Object.prototype.toString;

// at
if(!isFunction(String.prototype.at)) {
	String.prototype.at = function(position) {
		var str,
			index,
			endIndex,
			len,
			firstChar, secondChar;

		if(this === null || this === undefined) {
			throw new TypeError("String.prototype.indexOf called on null or undefined");
		}

		index = ensureInteger(position);
		index = Math.max(index, 0);

		str = toString.call(this);
		len = str.length;
		if(index <= -1 || index >= len) {
			return "";
		}

		first = str.charCodeAt(index);
		endIndex = index + 1;
		if (firstChar >= 0xD800 && firstChar <= 0xDBFF && endIndex < len) {
			secondChar = str.charCodeAt(endIndex);
			if(secondChar >= 0xDC00 && secondChar <= 0xDFFF) {
				endIndex = index + 2;
			}
		}

		return str.slice(index, endIndex);
	};
}

// includes
if(!isFunction(String.prototype.includes)) {
	String.prototype.includes = function() {
		return String.prototype.indexOf.apply(this, arguments) !== -1;
	};
}

// startsWith
if(!isFunction(String.prototype.startsWith)) {
	String.prototype.startsWith = function(searchStr) {
		var str,
			search,
			startIndex;

		if(ui.core.isRegExp(searchStr)) {
			throw new TypeError("Cannot call method \"startsWith\" with a regex");
		}

		if(this === null || this === undefined) {
			throw new TypeError("String.prototype.indexOf called on null or undefined");
		}

		str = toString.call(this);
		search = toString.call(searchStr);

		if(arguments.length > 1) {
			startIndex = ensureInteger(arguments[1]);
		} else {
			startIndex = 0;
		}
		startIndex = Math.max(startIndex, 0);
		
		return str.slice(startIndex, startIndex + search.length) === search;
	};
}

// endsWith
if(!isFunction(String.prototype.endsWith)) {
	String.prototype.endsWith = function(searchStr) {
		var str,
			search,
			endIndex;

		if(ui.core.isRegExp(searchStr)) {
			throw new TypeError("Cannot call method \"startsWith\" with a regex");
		}

		if(this === null || this === undefined) {
			throw new TypeError("String.prototype.indexOf called on null or undefined");
		}

		str = toString.call(this);
		search = toString.call(searchStr);

		if(arguments.length > 1) {
			endIndex = ensureInteger(arguments[1]);
		} else {
			endIndex = str.length;
		}
		endIndex = Math.min(Math.max(endIndex, 0), str.length);
		
		return str.slice(endIndex - search.length, endIndex) === search;
	};
}
