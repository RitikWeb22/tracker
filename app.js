const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = socketio(server);

// Store users and their last location
const users = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Assign random username and store
    const username = "User-" + Math.floor(Math.random() * 1000);
    users[socket.id] = { username };

    // Send all existing users' location to the newly connected client
    const existingUsers = [];
    for (let id in users) {
        if (users[id].location && id !== socket.id) {
            existingUsers.push({ id, username: users[id].username, ...users[id].location });
        }
    }
    socket.emit("existing-users", existingUsers);

    // When user sends location
    socket.on("send-location", (location) => {
        users[socket.id].location = location;
        io.emit("receive-location", {
            id: socket.id,
            username: users[socket.id].username,
            ...location,
        });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        delete users[socket.id];
        io.emit("user-disconnected", socket.id);
    });
});

app.get("/", (req, res) => {
    res.render("index");
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
