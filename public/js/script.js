const socket = io();
const map = L.map("map").setView([0, 0], 20);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Ritik",
}).addTo(map);

// Define marker icon style
const customIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/252/252025.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

// Track user data
const markers = {};
const paths = {};

// Watch and send location
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.log(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

// Receive and render location
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    // Center the map on the latest location
    map.setView([latitude, longitude]);

    // Marker exists
    if (markers[id]) {
        // Add point to polyline path
        if (!paths[id]) {
            paths[id] = L.polyline([], { color: "blue" }).addTo(map);
        }
        paths[id].addLatLng([latitude, longitude]);

        // Update marker position
        markers[id].setLatLng([latitude, longitude]);
    } else {
        // First-time marker
        markers[id] = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);

        // Initialize polyline
        paths[id] = L.polyline([[latitude, longitude]], { color: "blue" }).addTo(map);
    }
});

// Remove marker on disconnect
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
    if (paths[id]) {
        map.removeLayer(paths[id]);
        delete paths[id];
    }
});
