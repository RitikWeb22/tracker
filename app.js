const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = socketio(server);

const locations = {}; // Store latest user locations

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Send existing users' locations to the new user
    for (const id in locations) {
        socket.emit("receive-location", {
            id,
            ...locations[id],
        });
    }

    socket.on("send-location", (data) => {
        locations[socket.id] = data;
        io.emit("receive-location", {
            id: socket.id,
            ...data,
        });
    });

    socket.on("disconnect", () => {
        io.emit("user-disconnected", socket.id);
        delete locations[socket.id];
    });
});

app.get("/", (req, res) => {
    res.render("index");
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
