const socket = io();

// Generate a simple random username (no prompt)
const username = "User-" + Math.floor(Math.random() * 1000);
socket.emit("register-user", username);

const map = L.map("map").setView([0, 0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Ritik",
}).addTo(map);

const markers = {};
const colors = {};
const getRandomColor = () => "#" + Math.floor(Math.random() * 16777215).toString(16);

// Store your own socket id
let myId = null;

socket.on("connect", () => {
    myId = socket.id;
});

// Track and send location
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });

            // Center map only on YOUR location updates
            if (myId) {
                // We can be sure this is your own update
                map.setView([latitude, longitude], 16);
            }
        },
        (error) => console.log(error),
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

// Receive location of all users
socket.on("receive-location", (data) => {
    const { id, latitude, longitude, username } = data;

    if (!colors[id]) {
        colors[id] = getRandomColor();
    }

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        const marker = L.circleMarker([latitude, longitude], {
            radius: 8,
            color: colors[id],
            fillColor: colors[id],
            fillOpacity: 0.9,
        }).addTo(map);

        // Remove username label if you want:
        // marker.bindTooltip(username, { permanent: true, direction: "top", className: "user-label" });

        markers[id] = marker;
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
        delete colors[id];
    }
});
