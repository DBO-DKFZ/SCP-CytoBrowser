/**
 * @module collaboration
 * @desc Contains necessary server-side logic for collaboration between
 * different users of the CytoBrowser.
 */

// Object for storing all ongoing collaborations
const collabs = {};

class Collaboration {
    constructor(id, image) {
        this.members = new Map();
        this.points = [];
        this.id = id;
        this.image = image;
    }

    addMember(ws, name) {
        this.members.set(ws, {
            name: name,
            ready: true,
        });
        ws.send(JSON.stringify(this.stateSummary()));
        this.broadcastMessage(ws, {
            type: "memberEvent",
            eventType: "connect",
            member: this.members.get(ws)
        });
    }

    removeMember(ws) {
        this.broadcastMessage(ws, {
            type: "memberEvent",
            eventType: "disconnect",
            member: this.members.get(ws)
        });
        this.members.delete(ws);
    }

    broadcastMessage(sender, msg) {
        // Forward the message to all other members
        const msgJSON = JSON.stringify(msg);
        for (let [ws, member] of this.members.entries()) {
            if (ws !== sender && member.ready) {
                ws.send(msgJSON);
            }
        }
    }

    handleMessage(sender, msg) {
        // Keep track of the current points
        switch (msg.type) {
            case "markerAction":
                this.broadcastMessage(sender, msg);
                switch (msg.actionType) {
                    case "add":
                        this.points.push(msg.point);
                        break;
                    case "update":
                        Object.assign(this.points.find((point) => point.id === msg.id), msg.point)
                        break;
                    case "remove":
                        const index = this.points.findIndex((point) => point.id === msg.id);
                        this.points.splice(index, 1);
                        break;
                    case "clear":
                        this.points = [];
                        break;
                    default:
                        console.warn(`Tried to handle unknown marker action: ${msg.actionType}`);
                }
                break;
            case "memberEvent":
                switch (msg.eventType) {
                    case "nameChange":
                        console.info(`${this.members.get(sender).name} changed their name to ${msg.name}`);
                        this.members.get(sender).name = msg.name;
                        this.broadcastMessage(sender, msg);
                        break;
                    default:
                        console.warn(`Tried to handle unknown member event: ${msg.eventType}`);
                }
                break;
            case "imageSwap":
                this.broadcastMessage(sender, msg);
                for (let [ws, member] of this.members.entries()) {
                    if (ws !== sender) {
                        member.ready = false;
                    }
                }
                this.points = [];
                this.image = msg.image;
                break;
            case "requestSummary":
                sender.send(JSON.stringify(this.stateSummary()));
                this.members.get(sender).ready = true;
                break;
            default:
                this.broadcastMessage(sender, msg);
                console.info("Received a message with an unknown type, forwarding anyway.");
        }
    }

    stateSummary() {
        return {
            type: "summary",
            id: this.id,
            image: this.image,
            members: Array.from(this.members.values()),
            points: this.points
        }
    }
};

function getCollab(id, image) {
    return collab = collabs[id] || (collabs[id] = new Collaboration(id, image));
}

/**
 * Generate an unused, randomly generated collaboration ID. There are
 * around 6*10^7 possible IDs that can be generated with this function,
 * as they are generated as five-character lower-case alphanumeric strings.
 * @returns {string} A randomly generated, unused collaboration ID.
 */
function getId() {
    let id;
    do {
        // Generate a random number
        const num = Math.random();
        // Convert the number to an alphanumeric string
        const str = num.toString(36);
        // Shorten the string to something more human-readable
        id = str.slice(2,7);
    } while (collabs[id]);
    return id;
}

/**
 * Add a websocket context to a specified collaboration. The collaboration
 * takes care of the necessary initial communication with the new member
 * to make sure that they get all the necessary data. If the collaboration
 * does not already exist, it is created.
 * @param {WebSocket} ws WebSocket object to add to collab.
 * @param {string} name Human-readable name for identifying the new member.
 * @param {string} id ID of the collab being joined.
 * @param {string} image Name of the image observed in the collab. Only
 * has an effect if the collaboration has not been created yet.
 */
function joinCollab(ws, name, id, image) {
    const collab = getCollab(id, image);
    collab.addMember(ws, name);
}

/**
 * Remove a websocket context from a collaboration. Other contexts are
 * notified of their removal.
 * @param {WebSocket} ws WebSocket to remove from collab.
 * @param {string} id ID of collab to remove websocket from.
 */
function leaveCollab(ws, id) {
    const collab = collabs[id];
    if (collab) {
        collab.removeMember(ws);
    }
}

/**
 * Pass a message on to the appropriate collaboration and take the
 * appropriate actions based on its content.
 * @param {WebSocket} ws WebSocket that the message was sent from.
 * @param {string} id ID of the collab the message was sent to.
 * @param {string} msg JSON representation of the message object.
 */
function handleMessage(ws, id, msg) {
    const collab = getCollab(id);
    collab.handleMessage(ws, JSON.parse(msg));
}

exports.getId = getId;
exports.joinCollab = joinCollab;
exports.leaveCollab = leaveCollab;
exports.handleMessage = handleMessage;
