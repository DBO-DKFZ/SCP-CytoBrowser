const coordinateHelper = (function() {
    let _activeImage;

    function imageToViewport({x, y}){
        if (!_activeImage) {
            throw new Error("Can't find coordinates without setting an image first.");
        }
        return _activeImage.imageToViewportCoordinates(x, y);
    }

    function viewportToImage({x, y}){
        if (!_activeImage) {
            throw new Error("Can't find coordinates without setting an image first.");
        }
        return _activeImage.viewportToImageCoordinates(x, y);
    }

    function imageToWeb({x, y}){
        if (!_activeImage) {
            throw new Error("Can't find coordinates without setting an image first.");
        }
        return _activeImage.imageToViewerElementCoordinates(x, y);

    }

    function webToImage({x, y}){
        if (!_activeImage) {
            throw new Error("Can't find coordinates without setting an image first.");
        }
        return _activeImage.viewerElementToImageCoordinates(x, y);

    }

    function webToViewport({x, y}){
        return webToImage(imageToViewport({x, y}));
    }

    function viewportToWeb({x, y}){
        return viewportToImage(imageToWeb({x, y}));
    }

    /**
     * Set the coordinate helper to work with a given image. Due to
     * inaccuracies in coordinates when working with multiple images
     * in OpenSeadragon, this should be called with a specific image
     * in a stack whenever the focus changes.
     * @param {OpenSeadragon.TiledImage} image The currently active image.
     */
    function setImage(image) {
        _activeImage = image;
    }

    /**
     * Clear information about the current image.
     */
    function clearImage() {
        _activeImage = null;
    }

    return {
        imageToViewport: imageToViewport,
        viewportToImage: viewportToImage,
        imageToWeb: imageToWeb,
        webToImage: webToImage,
        webToViewport: webToViewport,
        viewportToWeb: viewportToWeb,
        setImage: setImage,
        clearImage: clearImage
    };
})();
