// 为String对象添加ES6的一些方法

var prototypeOfObject = Object.prototype,
	hasOwnProperty = prototypeOfObject.hasOwnProperty,
	isEnumerable = prototypeOfObject.propertyIsEnumerable,

	supportsAccessors,
	defineGetter,
	defineSetter,
	lookupGetter,
	lookupSetter;

supportsAccessors = hasOwnProperty.call(prototypeOfObject, "__defineGetter__");
if(supportsAccessors) {
	defineGetter = prototypeOfObject.__defineGetter__;
	defineSetter = prototypeOfObject.__defineSetter__;
	lookupGetter = prototypeOfObject.__lookupGetter__;
	lookupSetter = prototypeOfObject.__lookupSetter__;
}
	

function isFunction(fn) {
	return ui.core.isFunction(fn);
}

function isPrimitive(obj) {
	return typeof obj !== 'object' && typeof obj !== 'function' || obj === null
}

// 返回一个由一个给定对象的自身可枚举属性组成的数组
if(!isFunction(Object.keys)) {
	Object.keys = function(obj) {
		var result,
			property;

		if (isPrimitive(obj)) {
			throw new TypeError('Object.keys called on non-object');
		}

		result = [];
		for(property in obj) {
			if(hasOwnProperty.call(obj, property)) {
				result.push(property);
			}
		}
		return result;
	};
}

// 获取原型
if(!isFunction(Object.getPrototypeOf)) {
	Object.getPrototypeOf = function(obj) {
		var type,
			proto;

		type = ui.core.type(obj);
		if(type === "null" || type === "undefined") {
			throw new TypeError("Cannot convert undefined or null to object");
		}

		proto = obj.__proto__;
		if(proto || proto === null) {
			return proto;
		} else if(isFunction(obj.constructor)) {
			return obj.constructor.prototype;
		} else if(obj instanceof Object) {
			return prototypeOfObject;
		} else {
			// Object.create(null) or { __proto__: null }
			return null;
		}
	};
}

// 返回一个由指定对象的所有自身属性的属性名（包括不可枚举属性
if(!isFunction(Object.getOwnPropertyNames)) {
	Object.getOwnPropertyNames = function(obj) {
		return Object.keys(obj);
	};
}

// 检查getOwnPropertyDescriptor是否需要修复
var getOwnPropertyDescriptorFallback = null;
function doesGetOwnPropertyDescriptorWork(obj) {
	try {
		object.sentinel = 0;
		return Object.getOwnPropertyDescriptor(object, 'sentinel').value === 0;
	} catch (e) {
		return false;
	}
}
if(Object.getOwnPropertyDescriptor) {
	if(!doesGetOwnPropertyDescriptorWork({}) || 
		!(typeof document === "undefined" || doesGetOwnPropertyDescriptorWork(document.createElement("div")))) {
		getOwnPropertyDescriptorFallback = Object.getOwnPropertyDescriptor;
	}
}
if(!isFunction(Object.getOwnPropertyDescriptor) || getOwnPropertyDescriptorFallback) {
	Object.getOwnPropertyDescriptor = function(obj, property) {
		var descriptor,
			originalPrototype,
			notPrototypeOfObject;

		if(isPrimitive(obj)) {
			throw new TypeError("Object.getOwnPropertyDescriptor called on non-object");
		}

		// 尝试使用原始的getOwnPropertyDescriptor方法 for IE8
		if(getOwnPropertyDescriptorFallback) {
			try {
				return getOwnPropertyDescriptorFallback.call(Object, obj, property);
			} catch(e) {
				// 如果没用，那就用模拟方法
			}
		}

		if(!hasOwnProperty.call(obj, property)) {
			return descriptor;
		}

		descriptor = {
            enumerable: isEnumerable.call(obj, property),
            value: obj[property],
            configurable: true,
            writable: true
        };
		
		if(supportsAccessors) {
			originalPrototype = obj.__proto__;

			notPrototypeOfObject = originalPrototype !== prototypeOfObject;
			if(notPrototypeOfObject) {
				obj.__proto__ = prototypeOfObject;
			}

			getter = lookupSetter.call(obj, property);
			setter = lookupSetter.call(obj, property);

			if(notPrototypeOfObject) {
				obj.__proto__ = originalPrototype;
			}

			if(getter || setter) {
				if(getter) {
					descriptor.get = getter;
				}
				if(setter) {
					descriptor.set = setter;
				}
			}
		}

        return descriptor;
	};
}

// 检查defineProperty是否需要修复
var definePropertyFallback = null,
	definePropertiesFallback = null;
function doesDefinePropertyWork(object) {
	try {
		Object.defineProperty(object, 'sentinel', {});
		return 'sentinel' in object;
	} catch (exception) {
		return false;
	}
}
if(Object.defineProperty) {
	if(!doesDefinePropertyWork({}) || 
		!(typeof document === "undefined" || doesDefinePropertyWork(document.createElement("div")))) {
		definePropertyFallback = Object.defineProperty;
		definePropertiesFallback = Object.defineProperties;
	}
}
if(!isFunction(Object.defineProperty) || definePropertyFallback) {
	Object.defineProperty = function(obj, property, descriptor) {
		var originalPrototype,
			notPrototypeOfObject,
			hasGetter,
			hasSetter;

		if(isPrimitive(obj) || isPrimitive(property)) {
			throw new TypeError("Object.defineProperty called on non-object");
		}

		// 尝试使用原始的defineProperty方法 for IE8
		if(definePropertyFallback) {
			try {
				return definePropertyFallback.call(Object, obj, property, descriptor);
			} catch(e) {
				// 如果没用，那就用模拟方法
			}
		}

		if("value" in descriptor) {
			if(supportsAccessors && (lookupGetter.call(obj, property) || lookupSetter.call(obj, property))) {
				originalPrototype = obj.__proto__;
				obj.__proto__ = prototypeOfObject;
				
				delete obj[prototype];
				obj[prototype] = descriptor.value;

				obj.__proto__ = originalPrototype;
			} else {
				obj[prototype] = descriptor.value;
			}
		} else {
			hasGetter = "get" in descriptor && isFunction(descriptor.get);
			hasSetter = "set" in descriptor && isFunction(descriptor.set);
			if(!supportsAccessors && (hasGetter || hasSetter)) {
				throw new TypeError("getters & setters can not be defined on this javascript engine");
			}

			if(hasGetter) {
				defineGetter.call(obj, property, descriptor.get);
			}
			if(hasSetter) {
				defineSetter.call(obj, property, descriptor.set);
			}
		}
	};
}

// 检查defineProperties是否需要修复
if(!isFunction(Object.defineProperties) || definePropertiesFallback) {
	Object.defineProperties = function(obj, properties) {
		if(definePropertiesFallback) {
			try {
				return definePropertiesFallback.call(obj, properties);
			} catch(e) {
				// 如果没用，那就用模拟方法
			}
		}

		Object.keys(obj).forEash(function(prop) {
			if(prop !== "__proto__") {
				Object.defineProperty(obj, prop);
			}
		});
		return obj;
	}
}

// 检查isExtensible是否需要修复
if(!isFunction(Object.isExtensible)) {
	Object.isExtensible = function(obj) {
		var tmpPropertyName,
			returnValue;
		if(ui.core.isObject(obj)) {
			throw new TypeError("Object.isExtensible can only be called on Objects.");
		}

		tmpPropertyName = "_tmp";
		while(hasOwnProperty(obj, tmpPropertyName)) {
			tmpPropertyName += "_";
		}

		obj[tmpPropertyName] = true;
		returnValue = hasOwnProperty(obj, tmpPropertyName);
		delete obj[tmpPropertyName];

		return returnValue;
	};
}


