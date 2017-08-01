// 动态磁贴

///磁贴组
var tileSize = {
    // 小
    small: { width: 60, height: 60, iconSize: 32, countX: 1, countY: 1 },
    // 中
    medium: { width: 128, height: 128, iconSize: 64, countX: 2, countY: 2 },
    // 宽
    wide: { width: 264, height: 128, iconSize: 64, countX: 4, countY: 2 },
    // 大
    large: { width: 264, height: 264, iconSize: 64, countX: 4, countY: 4 }
};
var tileMargin = 4,
    titleHeight = 24,
    edgeDistance = 48,
    groupTitleHeight = 48;
var defineProperty = ui.ctrls.CtrlBase.defineProperty,
    tileInfoProperties = ["name", "title", "icon", "link", "color"];

// 磁贴
/*
    tileInfo: {
        name: string 磁贴名称，用于动态更新，不能重复,
        type: string 磁贴类型，small|medium|wide|large,
        color: string 磁贴颜色,
        title: string 磁贴标题,
        icon: string 磁贴图标,
        link: string 磁贴调整的URL，如果为null则点击磁贴不会发生跳转,
        interval: int 动态更新的时间间隔,
        updateFn: function 动态更新的方法
    }
 */
function Tile(tileInfo, group) {
    if(this instanceof Tile) {
        this.initialize(tileInfo, group);
    } else {
        return new Tile(tileInfo, group);
    }
}
Tile.prototype = {
    initialize: function(tileInfo, group) {
        var type;

        this.type = (tileInfo.type + "").toLowerCase();
        type = tileSize[this.type];
        if(!type) {
            throw new TypeError("Invalid tile type: " + this.type);
        }

        this.group = group;
        this.isDynamic = false;

        this.width = type.width;
        this.height = type.height;
        this.iconSize = type.iconSize;
        this.countX = type.countX;
        this.countY = type.countY;

        this.locationX = 0;
        this.locationY = 0;

        this.tileInfo = tileInfo || {};

        tileInfoProperties.forEach(function(propertyName) {
            if(tileInfo.hasOwnProperty(propertyName)) {
                defineProperty.call(this, propertyName, function() {
                    return this.tileInfo[propertyName];
                });
            }
        });

        this.updateFn = 
            ui.core.isFunction(this.tileInfo.updateFn) 
                ? this.tileInfo.updateFn 
                : null;
        this._render();
    },
    _render: function() {
        this.tilePanel = $("<div class='ui-tile tile-" + this.type + "' />");
        this.tilePanel.css("background-color", this.color);
        
        this.iconImg = $("<img class='tile-icon' />");
        this.iconImg.prop("src", this.icon);
        this.iconImg.css({
            "width": this.iconSize + "px",
            "height": this.iconSize + "px",
            "left": (this.width - this.iconSize) / 2 + "px",
            "top": (this.height - titleHeight / 2 - this.iconSize) / 2 + "px"
        });

        this.smallIconImg = null;
        if(this.type !== "small") {
            // 内容面板
            this.contentPanel = $("<div class='tile-content' />");
            this.contentPanel.append(this.iconImg);

            // 动态信息面板
            this.updatePanel = $("<div class='update-panel' />");
            this.contentPanel.append(this.updatePanel);

            // 磁贴标题
            this.titlePanel = $("<div class='tile-title' />");
            this.titlePanel.html("<span class='tile-title-text'>" + this.title + "</span>");
            
            this.tilePanel
                    .append(this.contentPanel)
                    .append(this.titlePanel);
            if(this.updateFn) {
                this.isDynamic = true;
                if(!ui.core.isNumber(this.interval) || this.interval <= 0) {
                    this.interval = 60;
                }
                this.smallIconImg = $("<img class='tile-small-icon' />");
                this.smallIconImg.prop("src", this.iconSrc);
                this.tilePanel.append(this.smallIconImg);
            }
        } else {
            this.tilePanel.append(this.iconImg);
        }

        this.linkAnchor = null;
        if(ui.core.isString(this.link) && this.link.length > 0) {
            this.linkAnchor = $("<a class='tile-link " + this.type + "' />");
            this.linkAnchor.prop("href", this.link);
            this.tilePanel.append(this.linkAnchor);
        }
    },
    update: function() {
        if(ui.core.isFunction(this.updateFn)) {
            this.updateFn();
        }
    }
};

function TileGroup(tileInfos, container) {
    if(this instanceof TileGroup) {
        this.initialize(tileInfos, container);
    } else {
        return new TileGroup(tileInfos, container);
    }
}
TileGroup.prototype = {
    initialize: function(tileInfos, container) {
        var arr = new Array(tileInfos.length),
            that;
        
        this.container = container;
        that = this;
        tileInfos.forEach(function(tileInfo) {
            var tile = new Tile(tileInfo);
            if(tile.isDynamic) {
                that.container.putDynamicTile(tile);
            }
            arr.push(tile);
        });
        
        ArrayFaker.prototype.setArray.call(this, arr);

        this.titleHeight = groupTitleHeight;

        this._render();
    },
    _render: function() {
        var i, len;

        this.groupPanel = $("<div class='ui-tile-group' />");
        this.groupPanel.css("visibility", "hidden");
        this.groupTitle = $("<div class='ui-tile-group-title' />");
        this.groupContent = $("<div class='ui-tile-group-content' />");
        this.groupPanel
                .append(this.groupTitle)
                .append(this.groupContent);

        for(i = 0, len = this.length; i < len; i++) {
            this.groupContent.append(this[i].tilePanel);
        }
    }, 
    _calculatePosition: function(size, positionBox, currentPosition, countX, countY) {
        var row, cell,
            x, y,
            indexX, xLen, 
            indexY, yLen,
            positionX, positionY;

        x = currentPosition.x;
        y = currentPosition.y;

        for(;;) {
            // 确保有空间
            for(i = 0; i < countY; i++) {
                if(!positionBox[y + i]) {
                    // 用最小单位来作为网格标注，以免浪费空间
                    positionBox[y + i] = new Array(size * tileSize.medium.countX);
                }
            }

            positionX = x;
            positionY = y;

            // 检查合适的空间
            for(indexY = y, yLen = y + countY; indexY < yLen; indexY++) {
                row = positionBox[indexY];
                for(;;) {
                    indexX = x;
                    xLen = x + countX;
                    if(xLen > row.length || indexX >= row.length) {
                        positionX = -1;
                        break;
                    }
                    for(; indexX < xLen; indexX++) {
                        if(row[indexX]) {
                            // 发现起始点已经被使用则位移
                            x = indexX + 1;
                            positionX = -1;
                            break;
                        }
                    }
                    if(positionX !== -1) {
                        break;
                    } else {
                        positionX = x;
                    }
                }
                if(positionX === -1) {
                    break;
                }
            }

            if(positionX !== -1 && positionY !== -1) {
                currentPosition.x = positionX;
                currentPosition.y = positionY;
                // 标记空间已经被使用
                for(indexY = positionY, yLen = positionY + countY; indexY < yLen; indexY++) {
                    row = positionBox[indexY];
                    for(indexX = positionX, xLen = positionX + countX; indexX < xLen; indexX++) {
                        row[indexX] = true;
                    }
                }
                return;
            }
        
            x = 0;
            y += 2;
        }
    },
    arrange: function(size) {
        var i, len,
            standard,
            smallCount, smallX, smallY, smallIndex,
            positionBox, currentPosition;

        standard = tileSize.medium;
        positionBox = [];
        // 本次的起始位置
        currentPosition = {
            x: 0,
            y: 0
        };
        // 每一次循环都是medium的倍数
        for(i = 0, len = this.length; i < len;) {
            tile = this[i];
            if(tile.countX <= standard.countX && tile.countY <= standard.countY) {
                this._calculatePosition(size, positionBox, currentPosition, standard.countX, standard.countY);
            } else {
                this._calculatePosition(size, positionBox, currentPosition, tile.countX, tile.countY);
            }

            if(tile.type === "small") {
                smallCount = tileSize.medium.countX * tileSize.medium.countY;
                smallX = currentPosition.x;
                smallY = currentPosition.y;
                smallIndex = 1;
                // 获取连续的小磁贴，最多获取4枚，组成一个medium磁贴
                while(smallIndex <= smallCount) {
                    tile = this[i];
                    if(tile.type !== "small") {
                        break;
                    }
                    if(smallIndex > tileSize.medium.countX) {
                        smallX = currentPosition.x;
                        smallY = currentPosition.y + 1;
                    } else if(smallX % 2 === 0) {
                        smallX = currentPosition.x + 1;
                    }
                    tile.tilePanel.css({
                        top: currentPosition.y * (tileSize.small.height + tileMargin) + "px",
                        left: currentPosition.x * (tileSize.small.width + tileMargin) + "px"
                    });
                    smallIndex++;
                    i++;
                }
                currentPosition.x += tileSize.medium.countX;
            } else {
                tile.tilePanel.css({
                    top: currentPosition.y * (tileSize.small.height + tileMargin) + "px",
                    left: currentPosition.x * (tileSize.small.width + tileMargin) + "px"
                });
                currentPosition.x += tile.countX;
                i++;
            }
        }

        len = positionBox[0].length;
        this.width = len * tileSize.small.width + (len - 1) * tileMargin;
        len = positionBox.length;
        this.height = len * tileSize.small.height + (len - 1) * tileMargin;
        
        this.groupContent.css("height", this.height + "px");
        this.height += this.titleHeight;
        this.groupPanel.css({
            "width": this.width + "px",
            "height": this.height + "px"
        });
    },

    addTile: function(tileInfo) {
        var tile = new Tile(tileInfo);
        ArrayFaker.prototype.push(tile);
    },
    removeTile: function(tileInfo) {

    }
};

// 磁贴容器
function TileContainer(containerPanel) {
    if(this instanceof TileContainer) {
        this.initialize(containerPanel);
    } else {
        return new TileContainer(containerPanel);
    }
}
TileContainer.prototype = {
    initialize: function(containerPanel) {
        this.groups = [];

        this.container = ui.getJQueryElement(containerPanel);
        if(!this.container) {
            this.container = $("<div class='ui-tile-container' />");
        } else {
            this.container.addClass("ui-tile-container");
        }
    },
    _calculateGroupLayoutInfo: function(containerWidth) {
        var size,
            medium,
            groupCount,
            groupWidth;

        medium = tileSize.medium;
        size = 4;
        groupWidth = size * medium.width + (size - 1) * tileMargin;
        groupCount = Math.floor((containerWidth - edgeDistance) / (groupWidth + edgeDistance));

        if(groupCount > 1 && this.groups.length === 1) {
            groupCount = 1;
        }
        if(groupCount < 1) {
            size = Math.floor(containerWidth / (medium.width + edgeDistance));
            // 最少一行放两个磁贴
            if(size < 2) {
                size = 2;
            }
        } else if(groupCount === 1) {
            size += Math.floor((containerWidth - edgeDistance - groupWidth) / (medium.width + edgeDistance));
            if(size % 2) {
                size--;
            }
        }
        return {
            // 水平放几组
            groupCount: groupCount ? groupCount : 1,
            // 每组一行放几个标准磁贴
            groupSize: size
        };
    },
    /** 布局磁贴 */
    layout: function(containerWidth, containerHeight) {
        var groupLayoutInfo,
            groupWholeWidth,
            groupWholeHeight,
            groupEdgeDistance, 
            scrollWidth,
            group,
            groupTemp
            i, len, j;

        if(this.groups.length === 0) {
            return;
        }
        groupLayoutInfo = this._calculateGroupLayoutInfo(containerWidth);
        
        // 排列每一组磁贴
        groupWholeHeight = 0;
        for(i = 0, len = this.groups.length; i < len; i++) {
            group = this.groups[i];
            group.arrange(groupLayoutInfo.groupSize);
            groupWholeHeight += group.height;
        }

        scrollWidth = 0;
        if(groupWholeHeight > containerHeight) {
            scrollWidth = ui.scrollbarWidth;
        }
        groupWholeWidth = this.groups[0].width * groupLayoutInfo.groupSize + edgeDistance * (groupLayoutInfo.groupSize - 1);
        groupEdgeDistance = (containerWidth - groupEdgeDistance - groupWholeWidth) / 2;
        
        // 排列组
        groupTemp = {};
        for(i = 0, len = this.groups.length; i < len;) {
            groupTemp.left = groupEdgeDistance;
            for(j = 0; j < groupLayoutInfo.groupSize; j++) {
               group = this.groups[i];
               if(groupTemp[j] === undefined) {
                   groupTemp[j] = 0;
               }
               group.left = groupTemp.left;
               group.top = groupTemp[j];
               group.groupPanel.css({
                   "left": group.left + "px",
                   "top": group.top + "px"
               });
               groupTemp.left += group.width + edgeDistance;
               groupTemp[j] += group.height;
               i++; 
            }
        }
    },
    /** 添加组 */
    addGroup: function(groupName, tileInfos) {
        var group;
        if(!Array.isArray(tileInfos) || tileInfos.length === 0) {
            return;
        }
        group = new TileGroup(tileInfos, this);
        this.groups.push(group);
    },
    /** 放置动态磁贴 */
    putDynamicTile: function(dynamicTile) {
        // TODO
    }
};

