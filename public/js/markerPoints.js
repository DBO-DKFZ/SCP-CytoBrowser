/**
 * Namespace for handling marker points. Deals with both the data
 * representation of the points and the graphical representation. All
 * manipulation of the points should go through this namespace's
 * functions to ensure that all necessary steps are performed.
 * @namespace markerPoints
 */
markerPoints = {
    /**
     * Data representation of a point that should be used when adding or
     * updating information about it. While all points that have already
     * been added will have an id property, it can optionally be included
     * when adding information about the point to force an id.
     * @typedef {Object} MarkerPoint
     * @property {number} x X position of the point.
     * @property {number} y Y position of the point.
     * @property {number} z Z value when the point was placed.
     * @property {string} mclass Class name of the point.
     * @property {number} [id] Hard-coded ID of the point.
     */
    /**
     * Representation of the OpenSeadragon coordinate system used to
     * represent a point. Should take on the values of "web", "viewport"
     * or "image". See more information about the different coordinate
     * systems {@link https://openseadragon.github.io/examples/viewport-coordinates/|here.}
     * @typedef {string} CoordSystem
     */
    _points: [],
    _nextId: 0,
    _generateId: function() {
        let id = markerPoints._nextId;
        if (markerPoints.getPointById(id) !== undefined) {
            // If for some reason the next id has already been taken
            const points = markerPoints._points;
            const maxId = Math.max(...points.map((point) => point.id));
            id = maxId + 1;
        }
        markerPoints._nextId = id + 1;
        return id;
    },
    _clonePoint: function(point) {
        /**
         * Note: This implementation copies references, so if the
         * representation of a point is ever changed to include a
         * reference to an Object, this function should be changed to
         * take this into account.
         */
        return Object.assign({}, point);
    },
    _getCoordSystems: function(point, coordSystem) {
        const originalPoint = new OpenSeadragon.Point(point.x, point.y);
        let webPoint, viewportPoint, imagePoint;
        // TODO: Doesn't convert to web coordinates, but not sure if needed
        switch(coordSystem) {
            case "web":
                viewportPoint = overlayUtils.pointFromOSDPixel(originalPoint, "ISS");
                imagePoint = overlayUtils.pointToImage(viewportPoint, "ISS");
                return {
                    web: {x: point.x, y: point.y},
                    viewport: {x: viewportPoint.x, y: viewportPoint.y},
                    image: {x: imagePoint.x, y: imagePoint.y}
                };
            case "viewport":
                webPoint = {};
                imagePoint = overlayUtils.pointToImage(originalPoint, "ISS");
                return {
                    web: {x: webPoint.x, y: webPoint.y},
                    viewport: {x: point.x, y: point.y},
                    image: {x: imagePoint.x, y: imagePoint.y}
                };
            case "image":
                webPoint = {};
                viewportPoint = overlayUtils.imageToViewport(originalPoint, "ISS");
                return {
                    web: {x: webPoint.x, y: webPoint.y},
                    viewport: {x: viewportPoint.x, y: viewportPoint.y},
                    image: {x: point.x, y: point.y}
                };
            default:
                throw new Error("Invalid OSD coordinate system specified.");
        }
    },

    /**
     * Add a single point to the data.
     * @param {MarkerPoint} point A data representation of the point.
     * @param {CoordSystem} [coordSystem="web"] Coordinate system used by the point.
     * @param {boolean} [transmit=true] Any collaborators should also be
     * told to add the point.
     */
    addPoint: function(point, coordSystem="web", transmit = true) {
        const addedPoint = markerPoints._clonePoint(point);

        // Make sure the point has an id
        if (addedPoint.id === undefined) {
            addedPoint.id = markerPoints._generateId();
        }
        else {
            // If the id has been specified, check if it's not taken
            const existingPoint = markerPoints.getPointById(addedPoint.id);
            if (existingPoint !== undefined) {
                throw new Error("Tried assign an already-used id.");
            }
        }

        // Store the coordinates in all systems and set the image coordinates
        const coords = markerPoints._getCoordSystems(addedPoint, coordSystem);
        if (coordSystem != "image") {
            addedPoint.x = coords.image.x;
            addedPoint.y = coords.image.y;
        }

        // Store a data representation of the point
        markerPoints._points.push(addedPoint);

        // Send the update to collaborators
        transmit && collabClient.send({
            type: "markerAction",
            actionType: "add",
            point: addedPoint
        });

        // Add a graphical representation of the point
        overlayUtils.addTMCP(
            addedPoint.id,
            coords.viewport.x,
            coords.viewport.y,
            addedPoint.z,
            addedPoint.mclass
        );
    },

    /**
     * Update the parameters of an already existing point.
     * @param {number} id The initial id of the point to be updated.
     * @param {MarkerPoint} point The new values for the point to be updated.
     * @param {CoordSystem} [coordSystem="web"] Coordinate system used by the point.
     * @param {boolean} [transmit=true] Any collaborators should also be
     * told to update their point.
     */
    updatePoint: function(id, point, coordSystem="web", transmit = true) {
        const points = markerPoints._points;
        const updatedIndex = points.findIndex((point) => point.id == id);
        const updatedPoint = markerPoints.getPointById(id);

        // Check if the point being updated exists first
        if (updatedPoint === undefined) {
            throw new Error("Tried to update a point that doesn't exist.");
        }

        // If the id is being changed, check if it's not taken
        if (point.id !== undefined && point.id !== id) {
            const existingPoint = markerPoints.getPointById(point.id);
            if (existingPoint !== undefined) {
                throw new Error("Tried to update to an already-used id.");
            }
        }

        // Copy over the updated properties
        Object.assign(updatedPoint, point);

        // Make sure the data is stored in the image coordinate system
        const coords = markerPoints._getCoordSystems(updatedPoint, coordSystem);
        if (coordSystem != "image") {
            updatedPoint.x = coords.image.x;
            updatedPoint.y = coords.image.y;
        }

        // Store the point in data
        points[updatedIndex] = updatedPoint;

        // Send the update to collaborators
        transmit && collabClient.send({
            type: "markerAction",
            actionType: "update",
            id: id,
            point: updatedPoint
        });

        // Update the point in the graphics
        overlayUtils.updateTMCP(point.id, coords.viewport.x, coords.viewport.y, point.z, point.mclass);
    },

    /**
     * Remove a point from the data.
     * @param {number} id The id of the point to be removed.
     * @param {boolean} [transmit=true] Any collaborators should also be
     * told to remove the point.
     */
    removePoint: function(id, transmit = true) {
        const points = markerPoints._points;
        const deletedIndex = points.findIndex((point) => point.id == id);

        // Check if the point exists first
        if (deletedIndex === -1) {
            throw new Error("Tried to remove a point that doesn't exist");
        }

        // Remove the point from the data
        points.splice(deletedIndex, 1);

        // Send the update to collaborators
        transmit && collabClient.send({
            type: "markerAction",
            actionType: "remove",
            id: id
        });

        // Remove the point from the graphics
        overlayUtils.removeTMCP(id);
    },

    /**
     * Remove all points from the data.
     * @param {boolean} [transmit=true] Any collaborators should also
     * be told to clear their points.
     */
    clearPoints: function(transmit = true) {
        const points = markerPoints._points;
        const ids = points.map((point) => point.id);
        ids.forEach((id) => markerPoints.removePoint(id));

        // Send the update to collaborators
        transmit && collabClient.send({
            type: "markerAction",
            actionType: "clear",
        });
    },

    /**
     * Iterate a function for each point. The function will not change
     * the values of the point, and will instead work on clones of them,
     * effectively making them read-only. If the point values should be
     * updated, updatePoint() can be run in the passed function.
     * @param {function} f Function to be called with each point.
     */
    forEachPoint: function(f) {
        markerPoints._points.map(markerPoints._clonePoint).forEach(f);
    },

    /**
     * Get a copy of a specified point by its id.
     * @param {number} id The id used for looking up the point.
     * @returns {Object} A clone of the point with the specified id, or undefined if not in use.
     */
    getPointById: function(id) {
        const point = markerPoints._points.find((point) => point.id == id);
        if (point === undefined) {
            return undefined;
        }
        const pointClone = markerPoints._clonePoint(point);
        return pointClone;
    },

    /**
     * Check whether or not the list of marker points is empty.
     * @returns {boolean} Whether or not the list is empty.
     */
    empty: function() {
        return markerPoints._points.length === 0;
    }
};
