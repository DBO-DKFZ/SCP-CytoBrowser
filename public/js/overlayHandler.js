const overlayHandler = (function (){
    "use strict";

    let _cursorOverlay;

    /**
     * Use d3 to update the collaboration cursors, adding new ones and
     * removing old ones.
     * @param {Array} nonLocalMembers An array of members, excluding the
     * local member.
     */
    function updateMembers(nonLocalMembers) {
        const visibleMembers = nonLocalMembers.filter((member) => {
            return member.cursor;
        });

        const selection = _cursorOverlay.selectAll("g")
            .data(visibleMembers, (d) => d.id)
            .join(enter => enter.append("g").attr("transform", (d) => `translate(${d.cursor.x}, ${d.cursor.y}), rotate(-30), scale(0.003, 0.003)`)
                                .append("path")
                                .attr("d", "M 0 0 L -0.4 1.0 L 0 0.9 L 0.4 1.0 Z")
                                .style("fill", "rgb(173, 29, 40)"),
                  update => update.attr("transform", (d) => `translate(${d.cursor.x}, ${d.cursor.y}), rotate(-30), scale(0.003, 0.003)`));
    }
//M -0.4 1.1 L -0.44 1.2 L 0.44 1.2 L 0.40 1.1 L 0 1.0 Z
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
        updateMembers: updateMembers,
        init: init
    };
})();
