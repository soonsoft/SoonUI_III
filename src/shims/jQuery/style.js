$.fn.getBoundingClientRect = function() {
  if(this.length === 0) {
    return undefined;
  }

  return this[0].getBoundingClientRect();
};

ui.core.each("Width, Height", function(name) {
  $.fn["outer" + name] = function() {
    var elem, docElem;
    if(this.length === 0) {
      return 0;
    }
    elem = this[0];
    if(ui.core.isWindow(elem)) {
      return elem["inner" + name];
    }
    if(elem.nodeType === 9) {
      docElem = elem.documentElement;
      return Math.max(
        elem.body["scroll" + name], 
        docElem["scroll" + name],
        elem.body["offset" + name], 
        docElem["offset" + name],
        docElem["client" + name]
      );
    }

    return this.getBoundingClientRect()[name.toLowerCase()];
  };
});
