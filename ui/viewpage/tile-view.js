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
    edgeDistance = 48;
var defineProperty = ui.ctrls.CtrlBase.defineProperty,
    tileInfoProperties = ["name", "title", "icon", "link", "color"];

// 磁贴
function Tile(tileInfo) {
    if(this instanceof Tile) {
        this.initialize(tileInfo);
    } else {
        return new Tile(tileInfo);
    }
}
Tile.prototype = {
    initialize: function(tileInfo) {
        var type;

        this.type = (tileInfo.type + "").toLowerCase();
        type = tileSize[this.type];
        if(!type) {
            throw new TypeError("Invalid tile type: " + this.type);
        }

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
            // 动态信息面板
            this.updatePanel = $("<div class='update-panel' />");
            this.contentPanel.append(this.iconImg).append(this.updatePanel);
            // 磁贴标题
            this.titlePanel = $("<div class='tile-title' />");
            this.tilePanel.append(this.contentPanel).append(this.titlePanel);
            if(this.updateFn) {
                this.smallIconImg = $("<img class='tile-icon' />");
                this.smallIconImg.prop("src", this.iconSrc);
                this.tilePanel.append(this.smallIconImg);
            }
        } else {
            this.tilePanel.append(this.iconImg);
        }

        this.linkAnchor = null;
        if(this.link) {
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

function TileGroup(tileInfos) {
    if(this instanceof TileGroup) {
        this.initialize(tileInfos);
    } else {
        return new TileGroup(tileInfos);
    }
}
TileGroup.prototype = {
    initialize: function(tileInfos) {
        var arr = new Array(tileInfos.length),
            tileGridCount = 0;
        tileInfos.forEach(function(tileInfo) {
            var tile = new Tile(tileInfo);
            tileGridCount += tile.countX * tile.countY;
            arr.push(tile);
        });
        
        ArrayFaker.prototype.setArray.call(this, arr);

        this._render();
        this._calculateGrid();
    },
    _render: function() {
        var i, len;

        this.groupPanel = $("<div class='ui-tile-group' />");
        this.groupPanel.css("visibility", "hidden");
        
        for(i = 0, len = this.length; i < len; i++) {
            this.groupPanel.append(this[i].tilePanel);
        }
    },
    _calculateGrid: function() {
        if(this.length === 0) {
            return;
        }
    },
    _scan: function(size, rows, countX, countY, rowIndex) {
        var i, j,
            x, y,
            row, nextRow,
            indexX, indexY;

        for(;;) {
            row = rows[rowIndex];
            if(!row) {
                row = new ArrayFaker(size * tileSize.medium.countX);
                row.freeCount = row.length;
                rows[rowIndex] = row;
            }
            indexY = rowIndex;
            for(i = 0; i < row.length; i++) {
                y = countY;
                j = rowIndex;
                while(y--) {
                    nextRow = rows[j];
                    if(!nextRow) {
                        nextRow = new ArrayFaker(size * tileSize.medium.countX);
                        nextRow.freeCount = nextRow.length;
                        rows[j] = nextRow;
                    }
                    j++;
                    x = countX;
                    while(x--) {
                        if(row[i++]) {
                            indexX = -1;
                            break;
                        }
                    }
                    if(indexX === -1) {
                        break;
                    }
                }
            }
            if(indexX !== -1 && indexY !== -1) {
                y = countY;
                j = indexY;
                while(y) {
                    row = rows[j++];
                    i = indexX;
                    while(x) {
                        row[i++] = true;
                        row.freeCount--;
                        x--;
                    }
                    y--;
                }
                return {
                    x: indexX,
                    y: indexY
                };
                
            }
            rowIndex++;
        }
    },
    arrange: function(size) {
        var rows = [],
            rowIndex = 0,
            row,
            i, len,
            tilePosition,
            tile;

        for(i = 0, len = this.length; i < len; i++) {
            tile = this[i];
            if(rows[rowIndex].freeCount < tile.countX) {
                rowIndex++;
            }
            tilePosition = this._scan(size, rows, tile.countX, tile.countY, rowIndex);
            tile.tilePanel.css({
                top: tilePosition.y * (tileSize.small.height + tileMargin) + "px",
                left: tilePosition.x * (tileSize.small.width + tileMargin) + "px"
            });
        }
        
    },
    addTile: function(tileInfo) {
        var tile = new Tile(tileInfo);
        ArrayFaker.prototype.push(tile);
    },
    removeTile: function(tile) {

    }
};

// 磁贴容器
function TileContainer() {
    if(this instanceof TileContainer) {
        this.initialize();
    } else {
        return new TileContainer();
    }
}
TileContainer.prototype = {
    initialize: function() {
        this.groups = [];
        this.container = null;
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
            groupCount: groupCount ? groupCount : 1,
            groupSize: size
        };
    },
    layout: function(containerWidth, containerHeight) {
        var groupLayoutInfo,
            i, len;

        groupLayoutInfo = this._calculateGroupLayoutInfo(containerWidth);
        
        // 排列每一组磁贴
        for(i = 0, len = this.groups.length; i < len; i++) {
            this.groups[i].arrange(groupLayoutInfo.groupSize);
        }

        // 排列组
        for(i = 0, len = this.groups.length; i < len; i++) {

        }
    },
    /** 添加组 */
    addGroup: function(groupName, tileInfos) {
        if(!Array.isArray(tileInfos) || tileInfos.length === 0) {
            return;
        }
        this.groups.push(TileGroup(tileInfos));
    },
    /** 添加一个磁贴 */
    addTile: function(groupIndex, tile) {
        if(!(tile instanceof Tile)) {
            throw new TypeError("the arguments tile is not Tile");
        }
    },
    /** 设置容器的大小 */
    setSize: function(width, height) {

    }
};

