/**
 * Module for handling the visuals and logic of the collab picker.
 * @namespace collabPicker
 */
const collabPicker = (function() {
    "use strict";

    let _lastShownImage = null;
    let _collabList = null;
    let _availableCollabs = [];

    function _retrieveCollabInfo(image) {
        let resolveLoad, rejectLoad;
        const loadPromise = new Promise((resolve, reject) => {
            resolveLoad = resolve;
            rejectLoad = reject;
        });
        const collabReq = new XMLHttpRequest();
        const address = `${window.location.api}/collaboration/available?image=${image}`;
        collabReq.open("GET", address, true);
        collabReq.send(null);
        collabReq.onreadystatechange = () => {
            if (collabReq.readyState === 4 && collabReq.status === 200) {
                const available = JSON.parse(collabReq.responseText).available;
                resolveLoad(available);
            }
            else if (collabReq.readyState === 4) {
                rejectLoad();
            }
        };
        return loadPromise;
    }

    function _updateCollabList() {
        if (_collabList) {
            _collabList.updateData(_availableCollabs);
        }
        else {
            throw new Error("Tried to refresh collab picker before initialization.");
        }
    }

    function clear() {
        _availableCollabs = [];
        _updateCollabList();
    }

    function refresh(image) {
        _lastShownImage = image;
        $("#collab-image-path").text(image);
        _retrieveCollabInfo(image).then(collabData => {
            _availableCollabs = collabData;
            _updateCollabList();
        });
    }

    function open(image, forceChoice, imageCallback) {
        if (image === _lastShownImage) {
            clear();
        }
        refresh(image);
        $("#collab-picker").modal() // Open
    }

    function init() {
        _collabList = new AnnotationList("#collab-list", "#collab-list-container", "id", [
            {
                name: "Name",
                key: "name",
                sortable: true
            },
            {
                name: "Created by",
                key: "author",
                sortable: true
            },
            {
                name: "Updated",
                key: "updatedOn",
                sortable: true
            },
            {
                name: "# Annotations",
                key: "nAnnotations",
                sortable: true
            },
            {
                name: "# Users",
                key: "nUsers",
                sortable: true
            }
        ]);
    }

    return {
        clear: clear,
        refresh: refresh,
        open: open,
        init: init
    };
})();
