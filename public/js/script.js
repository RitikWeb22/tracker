const socket = io();

// Ask for user's name
let username = prompt("Enter your name:");
socket.emit("register-user", username || "Anonymous");

const map = L.map("map").setView([0, 0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Ritik",
}).addTo(map);

// Store markers and colors
const markers = {};
const colors = {};
const getRandomColor = () => "#" + Math.floor(Math.random() * 16777215).toString(16);

// Track and send location
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
            map.setView([latitude, longitude], 16);
        },
        (error) => console.log(error),
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

// Handle location from other users
socket.on("receive-location", (data) => {
    const { id, latitude, longitude, username } = data;

    // Assign a random color if new
    if (!colors[id]) {
        colors[id] = getRandomColor();
    }

    // If marker exists, update position
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        // Create a colored circle + name label
        const marker = L.circleMarker([latitude, longitude], {
            radius: 8,
            color: colors[id],
            fillColor: colors[id],
            fillOpacity: 0.9,
        }).addTo(map);

        // Add label above marker
        marker.bindTooltip(username, { permanent: true, direction: "top", className: "user-label" });

        markers[id] = marker;
    }
});

// Remove marker on disconnect
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
        delete colors[id];
    }
});
