// column style 默认提供的GridView和ReportView的格式化器
function addZero (val) {
    return val < 10 ? "0" + val : "" + val;
}
function getMoney (symbol, content) {
    if (!symbol) {
        symbol = "";
    }
    if (!ui.core.isNumber(content))
        return null;
    return "<span>" + ui.str.moneyFormat(content, symbol) + "</span>";
}
function getDate(val) {
    var date = val;
    if(!date) {
        return null;
    }
    if(ui.core.isString(val)) {
        date = ui.str.jsonToDate(date);
    }
    return date;
}

var columnFormatter,
    cellFormatter,
    cellParameterFormatter;

var progressError = new Error("column.len或width设置太小，无法绘制进度条！");

// 列头格式化器
columnFormatter = {
    columnCheckboxAll: function (col) {
        var checkbox = $("<i class='fa fa-square grid-checkbox-all' />");
        checkbox.click(this.onCheckboxAllClickHandler);
        this.resetColumnStateHandlers.checkboxAllCancel = function () {
            checkbox.removeClass("fa-check-square").addClass("fa-square");
            this._checkedCount = 0;
        };
        return checkbox;
    },
    columnText: function (col) {
        var span = $("<span class='table-cell-text' />"),
            value = col.text;
        if (value === undefined || value === null) {
            return null;
        }
        span.text(value);
        return span;
    },
    empty: function (col) {
        return null;
    }
};

// 单元格格式化器
cellFormatter = {
    text: function (val, col) {
        var span;
        if (val === undefined || val === null || isNaN(val)) {
            return null;
        }
        span = $("<span class='table-cell-text' />");
        span.text(t + "");
        return span;
    },
    empty: function (val, col) {
        return null;
    },
    rowNumber: function (val, col, idx) {
        var span;
        if(val === "no-count") {
            return null;
        }
        span = $("<span />");
        span.text((this.pageIndex - 1) * this.pageSize + (idx + 1));
        return span;
    },
    checkbox: function(val, col) {
        var checkbox = $("<i class='fa fa-square grid-checkbox' />");
        checkbox.attr("data-value", ui.str.htmlEncode(value));
        return checkbox;
    },
    paragraph: function (val, col) {
        var p;
        if(val === undefined || val === null || isNaN(val)) {
            return null;
        }
        p = $("<p class='table-cell-block' />")
        p.text(val + "");
        return p;
    },
    date: function(val, col) {
        var span,
            date = getDate(val);
        if(date === null) {
            return null;
        }

        span = $("<span />");
        if(isNaN(date)) {
            span.text("无法转换");
        } else {
            span.text([date.getFullYeaer(), "-",
                addZero(date.getMonth() + 1), "-",
                addZero(date.getDate())].join(""));
        }
        return span;
    },
    time: function(val, col) {
        var span,
            date = getDate(val);
        if(date === null) {
            return null;
        }

        span = $("<span />");
        if(isNaN(date)) {
            span.text("无法转换");
        } else {
            span.text([addZero(date.getHours()), ":",
                addZero(date.getMinutes()), ":",
                addZero(date.getSeconds())].join(""));
        }
        return span;
    },
    datetime: function(val, col) {
        var span,
            date = getDate(val);
        if(date === null) {
            return null;
        }

        span = $("<span />");
        if(isNaN(date)) {
            span.text("无法转换");
        } else {
            span.text([date.getFullYear(), "-",
                addZero(date.getMonth() + 1), "-",
                addZero(date.getDate()), " ",
                addZero(date.getHours()), ":",
                addZero(date.getMinutes()), ":",
                addZero(date.getSeconds())].join(""));
        }
        return span;
    },
    money: function(val, col) {
        return getMoney("￥", val);
    },
    cellPhone: function(val, col) {
        var span;
        if(!val) {
            return;
        }
        span = $("<span />");
        if (val.length == 11) {
            span.text(val.substring(0, 3) + "-" + val.substring(3, 7) + "-" + val.substring(7));
        } else {
            span.text(val);
        }
        return span;
    },
    rowspan: function(val, col, idx, td) {
        var ctx,
            span,
            key = "__temp$TdContext-" + col.column;
        if (idx === 0) {
            ctx = this[key] = {
                rowSpan: 1,
                value: val,
                td: td
            };
        } else {
            ctx = this[key];
            if (ctx.value !== val) {
                ctx.rowSpan = 1;
                ctx.value = val;
                ctx.td = td;
            } else {
                ctx.rowSpan++;
                ctx.td.prop("rowSpan", ctx.rowSpan);
                td.isAnnulment = true;
                return null;
            }
        }
        return $("<span />").text(val);
    }
};

// 带参数的单元格格式化器
cellParameterFormatter = {
    getBooleanFormatter: function(trueText, falseText, nullText) {
        var width = 16,
            trueWidth,
            falseWidth;
        trueText += "";
        falseText += "";
        if (arguments.length === 2) {
            nullText = "";
        }

        trueWidth = width * trueText.length || width,
        falseWidth = width * falseText.length || width;

        return function (val, col) {
            var span = $("<span />");
            if (val === true) {
                span.addClass("state-text").addClass("state-true")
                    .css("width", trueWidth + "px");
                span.text(trueText);
            } else if (val === false) {
                span.addClass("state-text").addClass("state-false")
                    .css("width", falseWidth + "px");
                span.text(falseText);
            } else {
                span.text(nullText);
            }
            return span;
        };
    },
    getNumberFormatter: function(decimalLen) {
        return function(val, col) {
            if(!ui.core.isNumber(val)) {
                return null;
            }
            return $("<span />").text(ui.str.numberScaleFormat(val, decimalLen));
        };
    },
    getMoneyFormatter: function(symbol) {
        return function(val, col) {
            return getMoney(symbol, col);
        };
    },
    getProgressFormatter: function(progressWidth, totalValue) {
        var defaultWidth = 162;
        if (!ui.core.isNumber(progressWidth) || progressWidth < 60) {
            progressWidth = false;
        }
        if (!$.isNumeric(totalValue)) {
            totalValue = null;
        } else if (totalValue < 1) {
            totalValue = null;
        }
        return function(val, col, idx, td) {
            var div, 
                barDiv, progressDiv, percentDiv,
                percent;

            if(ui.core.isNumber(val.value)) {
                val.total = totalValue || 0;
            } else {
                val = {
                    value: val,
                    total: totalValue || 0
                };
            }
            if(!ui.core.isNumber(val.total)) {
                val.total = val.value;
            }
            if(val.total === 0) {
                val.total = 1;
            }
            if(!ui.core.isNumber(val.value)) {
                val.value = 0;
            }

            percent = val.value / val.total;
            if(isNaN(percent)) {
                percent = 0;
            }
            percent = ui.str.numberScaleFormat(percent * 100, 2) + "%";
            div = $("<div class='cell-progress-panel' />");
            barDiv = $("<div class='cell-progress-bar' />");
            progressDiv = $("<div class='cell-progress-value background-highlight' />");
            progressDiv.css("width", percent);
            barDiv.append(progressDiv);

            percentDiv = $("<div class='cell-progress-text font-highlight'/>");
            percentDiv.append("<span>" + percent + "</span>");

            div.append(barDiv);
            div.append(percentDiv);
            div.append("<br clear='all' />");
            
            return div;
        };
    },
    getRowspanFormatter: function(index, key, createFn) {
        var columnKey = "__temp$TdContext-" + key;
        return function(val, col, idx, td) {
            var ctx;
            if (idx === 0) {
                ctx = this[key] = {
                    rowSpan: 1,
                    value: val,
                    td: td
                };
            } else {
                ctx = this[key];
                if (ctx.value !== val) {
                    ctx.rowSpan = 1;
                    ctx.value = val;
                    ctx.td = td;
                } else {
                    ctx.rowSpan++;
                    ctx.td.prop("rowSpan", ctx.rowSpan);
                    td.isAnnulment = true;
                    return null;
                }
            }
            return createFn.apply(this, arguments);
        };
    },
    getImageFormatter: function(width, height, prefix, defaultSrc, fillMode) {
        var imageZoomer;
        if(ui.core.isNumber(width) || width <= 0) {
            width = 120;
        }
        if(ui.core.isNumber(height) || width <= 0) {
            height = 90;
        }
        if(!prefix) {
            prefix = "";
        } else {
            prefix += "";
        }
        
        if(!ui.images) {
            throw new ReferenceError("require ui.images");
        }
        imageZoomer = ui.ctrls.ImageZoomer({
            getNext: function(val) {
                var img = this.target;
                var cell = img.parent().parent();
                var row = cell.parent();
                var tableBody = row.parent();
                var rowCount = tableBody[0].rows.length;
                
                var rowIndex = row[0].rowIndex + val;
                var imgPanel = null;
                do {
                    if(rowIndex < 0 || rowIndex >= rowCount) {
                        return false;
                    }
                    imgPanel = $(tableBody[0].rows[rowIndex].cells[cell[0].cellIndex]).children();
                    img = imgPanel.children("img");
                    rowIndex += val;
                } while(imgPanel.hasClass("failed-image"));
                return img;
            },
            onNext: function() {
                return this.option.getNext.call(this, 1) || null;
            },
            onPrev: function() {
                return this.option.getNext.call(this, -1) || null;
            },
            hasNext: function() {
                return !!this.option.getNext.call(this, 1);
            },
            hasPrev: function() {
                return !!this.option.getNext.call(this, -1);
            }
        });
        return function(imageSrc, column, index, td) {
            if(!imageSrc) {
                return "<span>暂无图片</span>";
            }
            var imagePanel = $("<div class='grid-small-image' style='overflow:hidden;' />");
            var image = $("<img style='cursor:crosshair;' />");
            imagePanel.css({
                "width": width + "px",
                "height": height + "px"
            });
            imagePanel.append(image);
            image.setImage(prefix + imageSrc, width, height, fillMode)
                .then(
                    function(result) {
                        image.addImageZoomer(imageZoomer);
                    }, 
                    function(e) {
                        image.attr("alt", "请求图片失败");
                        if(defaultSrc) {
                            image.prop("src", defaultSrc);
                            image.addClass("default-image");
                        }
                        imagePanel.addClass("failed-image");
                    });
            return imagePanel;
        };
    }
};

ui.ColumnStyle = {
    cnfn: columnFormatter,
    cfn: cellFormatter,
    cfnp: cellParameterFormatter
};
