// 图片动态磁贴

if(!ui.tiles) {
    ui.tiles = {};
}

ui.tiles.picture = function(tile, images) {
    var i, len,
        arr;
    if(!Array.isArray(images)) {
        return;
    }
    arr = [];
    for(i = 0, len = images.length; i < len; i++) {
        if(images[i]) {
            arr.push(images[i]);
        }
    }
    images = arr;
    if(images.length > 0) {
        return;
    }

    tile.pictureContext = {
        images: images,
        currentIndex: 0,
        imageLoader: ImageLoader()
    };
    initDisplayArea(tile);
    initAnimator(tile);
    showPicture(tile, firstPictrue);
};

function initDisplayArea(tile) {
    var context;
    context = tile.pictureContext;

    context.currentImagePanel = $("<div class='tile-picture-container' />");
    context.currentImage = $("<img class='tile-picture' />");
    context.currentImagePanel.append(context.currentImage);

    context.nextImagePanel = $("<div class='tile-picture-container' />");
    context.nextImage = $("<img class='tile-picture' />");
    context.nextImagePanel.append(context.nextImage);

    tile.updatePanel
            .append(context.currentImagePanel)
            .append(context.nextImagePanel);
}

function initAnimator() {

}

function showPicture(tile, callback) {
    var imageSrc,
        context;

    if(context.images.length === 0) {
        return;
    }
    context = tile.pictureContext;
    imageSrc = context.images[context.currentIndex];

    context.imageLoader
                .load(imageSrc, tile.width, tile.height, ImageLoader.centerCrop)
                .then(
                    function(loader) {
                        context.currentImage.css({
                            "width": loader.displayWidth + "px",
                            "height": loader.displayHeight + "px",
                            "top": loader.marginTop + "px",
                            "left": loader.marginLeft + "px",
                            "-webkit-transform": scale(1.5, 1.5),
                            "-ms-transform": scale(1.5, 1.5),
                            "-o-transform": scale(1.5, 1.5),
                            "-moz-transform": scale(1.5, 1.5),
                            "transform": scale(1.5, 1.5)
                        });
                        context.currentImage.prop("src", imageSrc);
                        callback(tile);
                    }, 
                    function() {
                        var idx;
                        context.images.splice(index, 1);
                        if(context.images.length > 0) {
                            idx = context.currentIndex + 1;
                            if(idx >= context.images.length) {
                                idx = 0;
                            }
                            context.currentIndex = idx;
                            showPicture(context.currentIndex, tile);
                        }
                    }
                );
}

function firstPictrue(tile) {

}

function nextPicture() {

}
