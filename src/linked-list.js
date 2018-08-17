// LinkedList

function Node(element) {
    if(this instanceof Node) {
        this.initialize(element);
    } else {
        return new Node(element);
    }
}
Node.prototype = {
    constructor: Node,
    initialize: function(element) {
        this.element = element;
        this.next = null;
        this.previous = null;
    },
    hasNext: function() {
        return !!this.next;
    },
    hasProvious: function() {
        return !!this.previous;
    }
};

function LinkedList() {
    if(this instanceof LinkedList) {
        this.initialize();
    } else {
        return new LinkedList();
    }
}
LinkedList.prototype = {
    constructor: LinkedList,
    initialize: function() {
        this._first = null;
        this._last = null;
    },
    isEmpty: function() {
        return !this._first;
    },
    clear: function() {
        this._first = null;
        this._last = null;
    },
    /** 先进后出，返回最后一个元素，并移除 */
    pop: function() {
        return getAndRemove.call(this, true);
    },
    /** 将元素添加到末尾 */
    push: function(element) {
        insert.call(this, element, true);
    },
    /** 先进先出，返回第一个元素，并移除 */
    shift: function(element) {
        return getAndRemove.call(this, false);
    },
    /** 将元素添加到开头 */
    unshift: function() {
        insert.call(this, element, false);
    },
    /** 移除元素 */
    remove: function(element) {
        var anchor,
            currentNode;
        for (currentNode = this._first; currentNode instanceof Node; currentNode = currentNode.next) {
            if(currentNode.element !== element) {
                continue;
            }
            if (currentNode.prev && currentNode.next) {
                // middle
                anchor = currentNode.prev;
                anchor.next = currentNode.next;
                currentNode.next.prev = anchor;

            } else if (!currentNode.prev && !currentNode.next) {
                // only node
                this._first = null;
                this._last = null;

            } else if (!currentNode.next) {
                // last
                this._last = this._last.prev;
                this._last.next = null;

            } else if (!currentNode.prev) {
                // first
                this._first = this._first.next;
                this._first.prev = null;
            }
        }
    },
    /** 遍历 */
    forEach: function(fn, caller) {
        var currentNode,
            index;
        if(!ui.core.isFunction(fn)) {
            return;
        }
        index = 0;
        for(currentNode = this._first; 
            currentNode instanceof Node; 
            currentNode = currentNode.next, index++) {

            fn.call(caller, currentNode.element, index, this);
        }
    },
    /** 转换为数组 */
    toArray: function() {
        var arr = [];
        this.forEach(function(element) {
            arr.push(element);
        });
        return arr;
    }
};

function insert(element, atTheEnd) {
    var newNode = new Node(element),
        oldFirst,
        oldLast;

    if(this.isEmpty()) {
        this._first = newNode;
        this._last = newNode;
    } else if(atTheEnd) {
        // push
        oldLast = this._last;
        this._last = newNode;
        newNode.previous = oldLast;
        oldLast.next = newNode;
    } else {
        // unshift
        oldFirst = this._first;
        this._first = newNode;
        newNode.next = oldFirst;
        oldFirst.previous = newNode;
    }
}

function getAndRemove(atTheEnd) {
    var oldFirst,
        oldLast;
    if(this.isEmpty()) {
        return null;
    } else if(atTheEnd) {
        // pop
        oldLast = this._last;
        this._last = this._last.previous;
        return oldLast;
    } else {
        // shift
        oldFirst = this._first;
        this._first = this._first.next;
        return oldFirst;
    }
}