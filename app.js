// Declare required modules
const fs = require("fs");
const express = require("express");
const availableImages = require("./availableImages");

// Store the address to be used from arguments
const hostname = process.argv[2] || "localhost";
const port = process.argv[3] || 0;

// Initialize the server
const app = express();
const expressWs = require("express-ws")(app);

// Serve static files
app.use("/js", express.static("js"));
app.use("/css", express.static("css"));
app.use("/misc", express.static("misc"));
app.use("/data", express.static("data"));

// Serve the index page at the root
app.get("/", (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

// Get a list of available images
app.get("/api/images", (req, res) => {
    // Get the available images and send them as a response
    const images = availableImages();
    if (images === null) {
        res.status(500);
        res.send("The server was unable to find images.");
    }
    else {
        res.status(200);
        res.json(images);
    }
});

app.ws("/test/:id", (ws, req) => {
    ws.on("message", (msg) => {
        console.log(req.params.id);
        console.log(msg);
    })
});

// Begin listening on the specified interface
const listener = app.listen(port, hostname, () => {
    const address = listener.address().address;
    const port = listener.address().port;
    console.log(`CytoBrowser server listening at http://${address}:${port}`);
});
