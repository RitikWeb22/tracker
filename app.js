const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = socketio(server);

// Store users
const users = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Get username from client
    socket.on("register-user", (username) => {
        users[socket.id] = { username };
    });

    socket.on("send-location", (data) => {
        io.emit("receive-location", {
            id: socket.id,
            username: users[socket.id]?.username || "Anonymous",
            ...data,
        });
    });

    socket.on("disconnect", () => {
        io.emit("user-disconnected", socket.id);
        delete users[socket.id];
        console.log("User disconnected:", socket.id);
    });
});

app.get("/", (req, res) => {
    res.render("index");
});

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
