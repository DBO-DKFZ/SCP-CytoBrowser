/**
 * Interface for programatically interacting with the HTML elements not
 * connected to OpenSeadragon. Putting these functions here keeps
 * things in the same place and removes clutter from other namespaces.
 * The initUI() function should be called initially to add the elements
 * that need to be added programatically.
 * @namespace tmappUI
 */
tmappUI = {
    /**
     * Initialize UI components that need to be added programatically
     * and add any event handlers that are needed.
     */
    initUI: function() {
        // Set the initial class
        tmapp.setMClass(bethesdaClassUtils.getClassFromID(0).name);

        // Add buttons for the available marker classes
        bethesdaClassUtils.forEachClass(function(item, index){
            let label = $("<label></label>");
            label.addClass("btn btn-dark");
            if (index == 0) { label.addClass("active"); }
            label.attr("id", "class_" + item.name);
            label.attr("title", item.description);
            let input = $("<input>" + item.name + "</input>");
            input.attr("type", "radio");
            input.attr("name", "class_options");
            input.attr("autocomplete", "off");
            label.append(input);
            label.click(function(){ tmapp.setMClass(item.name); });
            $("#class_buttons").append(label);
        });

        // Add event listeners for local storage buttons
        $("#pointstojson").click(JSONUtils.downloadJSON);
        $("#jsontodata").click(JSONUtils.readJSONToData);

        // Add event listeners for focus buttons
        $("#focus_next").click(() => tmapp.setFocusLevel(tmapp.getFocusLevel() + 1));
        $("#focus_prev").click(() => tmapp.setFocusLevel(tmapp.getFocusLevel() - 1));

        // Set up callbacks for the collaboration client
        collabClient.onConnect(function(connection) {
            tmappUI.setCollabID(connection.id);
        });

        collabClient.onDisconnect(function(connection) {
            tmappUI.clearCollabID();
        });

        // Add handlers for the collaboration menu
        $("#create_collaboration").click(function(event) {
            const name = $("#collaboration_start [name='username']").val();
            const include = $("#include_points").prop("checked");
            collabClient.createCollab(name, include);
        });
        $("#join_collaboration").click(function(event) {
            const name = $("#collaboration_start [name='username']").val();
            const id = $("#collaboration_start [name='joined_id']").val();
            const include = $("#include_points").prop("checked");
            collabClient.connect(id, name, include);
        });
        $("#leave_collaboration").click(function(event) {
            collabClient.disconnect();
        });
    },

    /**
     * Set the ID of the current collaboration so it can be displayed,
     * disable the elements for creating and joining collaborations, and
     * enable the button for leaving the collaboration.
     * @param {string} id Identifier for the active collaboration.
     */
    setCollabID: function(id) {
        $("#collaboration_start [name='active_id']").val(id);
        $("#collaboration_start input, #collaboration_start button").prop("disabled", true);
        $("#leave_collaboration").prop("disabled", false);
    },

    /**
     * Clear the information about the ongoing collaboration,
     * reenable the buttons for joining and creating collaborations, and
     * disable the button for leaving the collaboration.
     */
    clearCollabID: function() {
        $("#collaboration_start [name='active_id']").val("");
        $("#collaboration_start input, #collaboration_start button").prop("disabled", false);
        $("#leave_collaboration").prop("disabled", true);
    },

    /**
     * Add an image selection element to the image browser.
     * @param {Object} image Information about the image being added.
     * @param {string} image.name Name of the image.
     * @param {Object} image.thumbnails Thumbnails for image preview.
     * @param {string} image.thumbnails.overview Address to a tile
     * with a zoomed-out view of the image.
     * @param {string} image.thumbnails.detail Address to a tile with
     * a zoomed-out detail view of the image.
     */
    addImage: function(image) {
        // Messy function, might want to do it some better way
        let deck = $("#available_images .row").last();
        if (deck.length === 0 || deck.children().length === 3) {
            deck = $("<div></div>");
            deck.addClass("row mb-4");
            $("#available_images").append(deck);
        }
        const col = $("<div></div>");
        col.addClass("col-4 d-flex");
        const card = $("<div></div>");
        card.addClass("card w-100");
        const overview = $("<img>", {src: image.thumbnails.overview});
        overview.addClass("card-img-top position-absolute");
        overview.css({height: "230px", objectFit: "cover"});
        const detail = $("<img>", {src: image.thumbnails.detail});
        detail.addClass("card-img-top hide fade");
        detail.css({zIndex: 9000, pointerEvents: "none", height: "230px", objectFit: "cover"});
        const body = $("<div></div>");
        body.addClass("card-body");
        const title = $("<h5></h5>");
        title.text(image.name);
        title.addClass("card-title");
        const footer = $("<div></div>");
        footer.addClass("card-footer");
        const a = $("<a></a>");
        a.addClass("card-link stretched-link");
        a.attr("href", "#");
        a.text("Open image");
        a.click((e) => {
            e.preventDefault();
            tmapp.changeImage(image.name, () => {
                collabClient.send({
                    type: "imageSwap",
                    image: imageName
                });
            });
        });
        a.hover((e) =>
            detail.addClass("show").removeClass("hide"),
            (e) =>
            detail.addClass("hide").removeClass("show")
        );
        footer.append(a);
        body.append(title);
        card.append(overview);
        card.append(detail);
        card.append(body);
        card.append(footer);
        col.append(card);
        deck.append(col);
    }
}
