// column style 默认提供的GridView和ReportView的格式化器
var spanKey = "_RowspanContext",
    hoverViewKey = "_HoverView";

function noop() {}
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
    return ui.date.parseJSON(val);
}

var columnFormatter,
    cellFormatter,
    cellParameterFormatter;

var progressError = new Error("column.len或width设置太小，无法绘制进度条！");

// 列头格式化器
columnFormatter = {
    /** 全选按钮 */
    checkAll: function (col) {
        var checkbox = $("<i class='fa fa-square grid-checkbox-all' />");
        //checkbox.click(this.onCheckboxAllClickHandler);
        this.columnResetter.add(function () {
            checkbox.removeClass("fa-check-square").addClass("fa-square");
        });
        return checkbox;
    },
    /** 列头文本 */
    columnText: function (col) {
        var span = $("<span class='table-cell-text' />"),
            value = col.text;
        if (value === undefined || value === null) {
            return null;
        }
        span.text(value);
        return span;
    },
    /** 空列 */
    empty: function (col) {
        return null;
    }
};

// 单元格格式化器
cellFormatter = {
    /** 单行文本 */
    text: function (val, col) {
        var span;
        val += "";
        if (val === "undefined" || val === "null" || val === "NaN") {
            return null;
        }
        span = $("<span class='table-cell-text' />");
        span.text(val);
        return span;
    },
    /** 空单元格 */
    empty: function (val, col) {
        return null;
    },
    /** 行号 */
    rowNumber: function (val, col, idx) {
        var span;
        if(val === "no-count") {
            return null;
        }
        span = $("<span />");
        span.text((this.pageIndex - 1) * this.pageSize + (idx + 1));
        return span;
    },
    /** 多选框 */
    check: function(val, col) {
        var checkbox = $("<i class='fa fa-square grid-checkbox' />");
        checkbox.attr("data-value", val + "");
        return checkbox;
    },
    /** 多行文本 */
    paragraph: function (val, col) {
        var p;
        val += "";
        if (val === "undefined" || val === "null" || val === "NaN") {
            return null;
        }
        p = $("<p class='table-cell-block' />");
        p.text(val);
        return p;
    },
    /** 日期 yyyy-MM-dd */
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
            span.text([date.getFullYear(), "-",
                addZero(date.getMonth() + 1), "-",
                addZero(date.getDate())].join(""));
        }
        return span;
    },
    /** 时间 HH:mm:ss */
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
    /** 日期时间 yyyy-MM-dd hh:mm:ss */
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
    /** 短时期时间，不显示秒 yyyy-MM-dd hh:mm */
    shortDatetime: function(val, col) {
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
                addZero(date.getMinutes())].join(""));
        }
        return span;
    },
    /** 人民币，￥9,999.00 */
    money: function(val, col) {
        return getMoney("￥", val);
    },
    /** 手机号码，136-1151-8560 */
    cellPhone: function(val, col) {
        var span;
        if(!val) {
            return;
        }
        span = $("<span />");
        if (val.length === 11) {
            span.text(val.substring(0, 3) + "-" + val.substring(3, 7) + "-" + val.substring(7));
        } else {
            span.text(val);
        }
        return span;
    },
    /** 相同内容自动合并 */
    rowspan: function(val, col, idx, td) {
        var ctx,
            span;
        if (idx === 0) {
            ctx = col[spanKey] = {
                rowSpan: 1,
                value: val,
                td: td
            };
        } else {
            ctx = col[spanKey];
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
    /** 格式化boolean类型 */
    getBooleanFormatter: function(trueText, falseText, nullText) {
        var width = 16,
            trueWidth,
            falseWidth;
        trueText += "";
        falseText += "";
        if (arguments.length === 2) {
            nullText = "";
        }

        trueWidth = width * trueText.length || width;
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
    /** 数字小数格式化 */
    getNumberFormatter: function(decimalLen) {
        return function(val, col) {
            if(!ui.core.isNumber(val)) {
                return null;
            }
            return $("<span />").text(ui.str.numberScaleFormat(val, decimalLen));
        };
    },
    /** 其它国家货币格式化 */
    getMoneyFormatter: function(symbol) {
        return function(val, col) {
            return getMoney(symbol, col);
        };
    },
    /** 进度条格式化 */
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
            var div, progress,
                barDiv, progressDiv, percentDiv,
                barWidth, percent;

            progress = {};
            if(ui.core.isNumber(val[0])) {
                progress.value = val[0];
                progress.total = totalValue || val[1] || 0;
            } else {
                progress.value = val;
                progress.total = totalValue || 0;
            }
            if(progress.total === 0) {
                progress.total = 1;
            }
            if(!ui.core.isNumber(progress.value)) {
                progress.value = 0;
            }

            percent = progress.value / progress.total;
            if(isNaN(percent)) {
                percent = 0;
            }
            percent = ui.str.numberScaleFormat(percent * 100, 2) + "%";
            div = $("<div class='cell-progress-panel' />");
            barDiv = $("<div class='cell-progress-bar' />");
            barWidth = progressWidth;
            if(!ui.core.isNumber(barWidth)) {
                barWidth = col.len - 12;
            }
            barWidth -= 52;
            barDiv.css("width", barWidth + "px");

            progressDiv = $("<div class='cell-progress-value background-highlight' />");
            progressDiv.css("width", percent);
            barDiv.append(progressDiv);

            percentDiv = $("<div class='cell-progress-text font-highlight'/>");
            percentDiv.append("<span style='margin:0'>" + percent + "</span>");

            div.append(barDiv);
            div.append(percentDiv);
            div.append("<br clear='all' />");
            
            return div;
        };
    },
    /** 跨行合并 */
    getRowspanFormatter: function(key, createFn) {
        return function(val, col, idx, td) {
            var ctx;
            if (idx === 0) {
                ctx = col[spanKey] = {
                    rowSpan: 1,
                    value: val[key],
                    td: td
                };
            } else {
                ctx = col[spanKey];
                if (ctx.value !== val[key]) {
                    ctx.rowSpan = 1;
                    ctx.value = val[key];
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
    /** 显示图片，并具有点击放大浏览功能 */
    getImageFormatter: function(width, height, prefix, defaultSrc, fillMode) {
        var imageZoomer,
            getFn;
        if(!ui.core.isNumber(width) || width <= 0) {
            width = 120;
        }
        if(!ui.core.isNumber(height) || height <= 0) {
            height = 90;
        }
        if(!prefix) {
            prefix = "";
        } else {
            prefix += "";
        }

        getFn = function(val) {
            var img = this.target,
                cell = img.parent().parent(),
                row = cell.parent(),
                tableBody = row.parent(),
                rowCount = tableBody[0].rows.length,
                rowIndex = row[0].rowIndex + val,
                imgPanel;
            do {
                if(rowIndex < 0 || rowIndex >= rowCount) {
                    return false;
                }
                imgPanel = $(tableBody[0].rows[rowIndex].cells[cell[0].cellIndex]).children();
                img = imgPanel.children("img");
                rowIndex += val;
            } while(imgPanel.hasClass("failed-image"));
            return img;
        };

        imageZoomer = ui.ctrls.ImageZoomer({
            getNext: function() {
                return getFn.call(this, 1) || null;
            },
            getPrev: function() {
                return getFn.call(this, -1) || null;
            },
            hasNext: function() {
                return !!getFn.call(this, 1);
            },
            hasPrev: function() {
                return !!getFn.call(this, -1);
            }
        });
        return function(imageSrc, column, index, td) {
            var imagePanel,
                image;
            if(!imageSrc) {
                return "<span>暂无图片</span>";
            }
            imagePanel = $("<div class='grid-small-image' style='overflow:hidden;' />");
            image = $("<img style='cursor:crosshair;' />");
            imagePanel.css({
                "width": width + "px",
                "height": height + "px"
            });
            imagePanel.append(image);
            image
                .setImage(prefix + imageSrc, width, height, fillMode)
                .then(
                    function(result) {
                        image.addImageZoomer(imageZoomer);
                    }, 
                    function(e) {
                        var imageInfo = {
                            originalWidth: 120,
                            originalHeight: 90,
                            width: width,
                            height: height
                        };
                        image.attr("alt", "请求图片失败");
                        if(defaultSrc) {
                            image.prop("src", defaultSrc);
                            fillMode.call(imageInfo);
                            image.css({
                                "vertical-align": "top",
                                "width": imageInfo.displayWidth + "px",
                                "height": imageInfo.displayHeight + "px",
                                "margin-top": imageInfo.marginTop + "px",
                                "margin-left": imageInfo.marginLeft + "px"
                            });
                            image.addClass("default-image");
                        }
                        imagePanel.addClass("failed-image");
                    });
            return imagePanel;
        };
    },
    /** 悬停提示 */
    hoverView: function(viewWidth, viewHeight, formatViewFn) {
        if(!ui.core.isNumber(viewWidth) || viewWidth <= 0) {
            viewWidth = 160;
        }
        if(!ui.core.isNumber(viewHeight) || viewHeight <= 0) {
            viewHeight = 160;
        }
        if(!ui.core.isFunction(formatViewFn)) {
            formatViewFn = noop;
        }
        return function(val, col, idx) {
            var hoverView = col[hoverViewKey],
                anchor;
            if(!hoverView) {
                hoverView = ui.ctrls.HoverView({
                    width: viewWidth,
                    height: viewHeight
                });
                hoverView._contextCtrl = this;
                hoverView.showing(function(e) {
                    var rowData,
                        index,
                        result;
                    this.clear();
                    index = parseInt(this.target.attr("data-rowIndex"), 10);
                    rowData = this._contextCtrl.getRowData(index);
                    result = formatViewFn.call(this._contextCtrl, rowData);
                    if(result) {
                        this.append(result);
                    }
                });
                col[hoverViewKey] = hoverView;
            }

            anchor = $("<a href='javascript:void(0)' class='grid-hover-target' />");
            anchor.text(val + " ");
            anchor.addHoverView(hoverView);
            anchor.attr("data-rowIndex", idx);
            return anchor;
        };
    },
    /** 开关按钮 */
    switchButton: function(changeFn, style) {
        if(!ui.core.isFunction(changeFn)) {
            changeFn = noop;
        }
        if(!ui.core.isString(style)) {
            style = null;
        }

        return function(val, col, idx) {
            var checkbox,
                switchButton;
            
            checkbox = $("<input type='checkbox' />");
            checkbox.prop("checked", !!val);
            switchButton = checkbox.switchButton({
                thumbColor: ui.theme.currentTheme === "Light" ? "#666666" : "#888888",
                style: style
            });
            switchButton.changed(changeFn);
            checkbox.data("switchButton", switchButton);
            return switchButton.switchBox;
        };
    }
};

ui.ColumnStyle = {
    emptyColumn: {
        text: columnFormatter.empty,
        formatter: cellFormatter.empty
    },
    multipleEmptyColumn: function(rowSpan) {
        var emptyColumn = {
            text: columnFormatter.empty,
            formatter: cellFormatter.empty
        };
        if(ui.core.isNumber(rowSpan) && rowSpan > 1) {
            emptyColumn.rowspan = rowSpan;
        }
        return emptyColumn;
    },
    isEmpty: function(column) {
        return column === this.emptyColumn || 
            (column && column.text === columnFormatter.empty && column.formatter === cellFormatter.empty);
    },
    cnfn: columnFormatter,
    cfn: cellFormatter,
    cfnp: cellParameterFormatter
};
