const overlayHandler = (function (){
    "use strict";

    let _cursorOverlay;

    /**
     * Use d3 to update the collaboration cursors, adding new ones and
     * removing old ones.
     * @param {Array} cursors An array of cursor data
     */
    function updateCursors(cursors) {
        const selection = _cursorOverlay.selectAll("circle")
            .data(cursors, (d) => d.id);

        // Handle any incoming cursors
        selection.enter()
            .append("circle")
            .attr({
                transform: function(d) { return `translate(${d.x}, ${d.y}`},
              	d: d3.symbol().size(0.000001).type(d3.symbolCircle),
              	strokeWidth: 0.00001,
                stroke: "#000000"
            });

        // Handle any exiting cursors
        selection.exit()
            .remove();
    }

    /**
     * Initialize the overlay handler. Should be called whenever OSD is
     * initialized.
     * @param {Object} svgOverlay The return value of the OSD instance's
     * svgOverlay() method.
     */
    function init(svgOverlay) {
        const cursors = d3.select(svgOverlay.node())
            .append("g")
            .attr("id", "cursors");
        _cursorOverlay = d3.select(cursors.node());
    }

    return {
        updateCursors: updateCursors,
        init: init
    };
})();
