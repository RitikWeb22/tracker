const socket = io();

let myId = null;
let myLocation = null;
const markers = {};
const distanceLabels = {}; // store distance texts

// Haversine Formula for distance
// function calculateDistance(lat1, lon1, lat2, lon2) {
//     const R = 6371000; // Radius of Earth in meters
//     const dLat = ((lat2 - lat1) * Math.PI) / 180;
//     const dLon = ((lon2 - lon1) * Math.PI) / 180;
//     const a =
//         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//         Math.cos((lat1 * Math.PI) / 180) *
//         Math.cos((lat2 * Math.PI) / 180) *
//         Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c; // distance in meters
// }

const map = L.map("map", {
    center: [0, 0],
    zoom: 16,
    minZoom: 3,
    maxZoom: 19,
    zoomControl: false,
    worldCopyJump: true,
});

// Esri Satellite Layer
L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri | Map by Ritik",
    maxZoom: 19,
    minZoom: 3,
    errorTileUrl: "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg" // fallback tile
}).addTo(map);

// Zoom Control bottom right
L.control.zoom({ position: "bottomright" }).addTo(map);

socket.on("connect", () => {
    myId = socket.id;
});

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            myLocation = { latitude, longitude };
            socket.emit("send-location", { latitude, longitude });

            if (markers[myId]) {
                map.setView([latitude, longitude], 16);
            }
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

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    // Create or update marker
    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }

    // Show distance from your location to others
    if (id !== myId && myLocation) {
        const dist = calculateDistance(
            myLocation.latitude,
            myLocation.longitude,
            latitude,
            longitude
        );
        const text = `Distance: ${Math.round(dist)} m`;

        // Add or update label
        if (distanceLabels[id]) {
            distanceLabels[id].setLatLng([latitude, longitude]);
            distanceLabels[id].setContent(text);
        } else {
            distanceLabels[id] = L.tooltip({
                permanent: true,
                direction: "top",
                className: "distance-label",
            })
                .setLatLng([latitude, longitude])
                .setContent(text)
                .addTo(map);
        }
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
    if (distanceLabels[id]) {
        map.removeLayer(distanceLabels[id]);
        delete distanceLabels[id];
    }
});
