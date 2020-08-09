/*
    SOONUI 主命名空间声明
 */
(function(global, factory) {
	if (typeof module === "object" && typeof module.exports === "object") {

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get SOONUI.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var soonui = require("SOONUI")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory(global, true) :
			function(w) {
				if (!w.document) {
					throw new Error("SOONUI requires a window with a document");
				}
				return factory(w);
			};
	} else {
		factory(global, true);
	}
// Pass this if window is not defined yet
})(typeof window !== "undefined" ? window : this, function(window, noGlobal) {

/**
 * 严格模式
 * 变量必须声明后再使用
 * 函数的参数不能有同名属性，否则报错
 * 不能使用with语句
 * 不能对只读属性赋值，否则报错
 * 不能使用前缀0表示八进制数，否则报错
 * 不能删除不可删除的属性，否则报错
 * 不能删除变量delete prop，会报错，只能删除属性delete global[prop]
 * eval不会在它的外层作用域引入变量
 * eval和arguments不能被重新赋值
 * arguments不会自动反映函数参数的变化
 * 不能使用arguments.callee
 * 不能使用arguments.caller
 * 禁止this指向全局对象
 * 不能使用fn.caller和fn.arguments获取函数调用的堆栈
 * 增加了保留字（比如protected、static和interface）
 */
"use strict";
var ui = {};

// 常规的浏览器导入
if(noGlobal) {
	window.ui = ui;
	window.SOONUI = ui;
}

//$|$

// 兼容AMD
if(typeof define === "function" && define.amd) {
	define("SOONUI", [], function() {
		return ui;
	});
}

return ui;

});
