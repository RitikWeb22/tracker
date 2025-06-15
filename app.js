const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);

const io = socketio(server);
io.on("connection", (socket) => {
    socket.on("send-location", (data) => {
        io.emit("receive-location", { id: socket.id, ...data });
    });
    socket.on("disconnect", () => {
        io.emit("user-disconnected", socket.id);
    });
    console.log("connected");
});
app.get("/", (req, res) => {
    res.render("index");
});

server.listen(3000, () => {
    console.log("server is working");
});