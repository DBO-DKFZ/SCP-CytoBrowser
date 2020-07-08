collabClient = {
    createCollab: function(name, include) {
        // Get a new code for a collab first
        const idReq = new XMLHttpRequest();
        idReq.open("GET", window.location.origin + "/api/collaboration/id", true)
        idReq.send();
        idReq.onreadystatechange = function() {
            if (idReq.readyState === 4 && idReq.status === 200) {
                const response = JSON.parse(idReq.responseText);
                const id = response.id;
                collabClient.connect(id, name, include, callback);
            }
        };
    },
    connect: function(id, name="Unnamed", include) {
        if (collabClient.ws) {
            collabClient.disconnect();
        }

        const address = `ws://${window.location.host}/collaboration/${id}?name=${name}&image=${tmapp.image_name}`;
        const ws = new WebSocket(address);
        ws.onopen = function(event) {
            console.info(`Successfully connected to collaboration ${id}.`);
            collabClient.ws = ws;
            collabClient.connection = {id: id, name: name, ws: ws};
            collabClient.connectFun && collabClient.connectFun(collabClient.connection);

            if (include) {
                markerPoints.forEachPoint((point) => {
                    collabClient.send({
                        type: "markerAction",
                        actionType: "add",
                        point: point
                    });
                });
            }
            else if (confirm("All your placed markers will be lost unless you have saved them. Do you want to continue anyway?")) {
                markerPoints.clearPoints();
            }
            else {
                collabClient.disconnect();
            }
        }
        ws.onmessage = function(event) {
            console.log(`Received: ${event.data}`);
            collabClient.handleMessage(JSON.parse(event.data));
        }
        ws.onclose = function(event) {
            delete collabClient.connection;
            delete collabClient.ws;
        }
    },
    disconnect: function() {
        if (collabClient.ws) {
            collabClient.disconnectFun && collabClient.disconnectFun(collabClient.connection);
            collabClient.ws.close();
        }
        else {
            console.warn("Tried to disconnect from nonexistent collaboration.");
        }
    },
    send: function(msg) {
        if (collabClient.ws) {
            if (typeof(msg) === "object") {
                collabClient.ws.send(JSON.stringify(msg));
            }
            else {
                collabClient.ws.send(msg);
            }
        }
    },
    handleMessage: function(msg) {
        switch(msg.type) {
            case "markerAction":
                switch(msg.actionType) {
                    case "add":
                        markerPoints.addPoint(msg.point, "image", false);
                        break;
                    case "update":
                        markerPoints.updatePoint(msg.id, msg.point, "image", false);
                        break;
                    case "remove":
                        markerPoints.removePoint(msg.id, false);
                        break;
                    case "clear":
                        markerPoints.clearPoints(false);
                        break;
                    default:
                        console.warn(`Unknown marker action type: ${msg.actionType}`)
                }
                break;
            case "summary":
                console.info("Receiving collaboration info.");
                if (msg.image !== tmapp.image_name) {
                    // TODO: Change image
                }
                msg.points.forEach((point) => markerPoints.addPoint(point, "image", false));
                break;
            default:
                console.warn(`Unknown message type received in collab: ${msg.type}`);
        }
    },
    onConnect: function(f) {
        collabClient.connectFun = f;
    },
    onDisconnect: function(f) {
        collabClient.disconnectFun = f;
    }
}
