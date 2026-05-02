// map.js - Build 15
let map;
let markers = [];

function initMap() {
    map = L.map('map').setView([55.1707, -118.7947], 13); // Grande Prairie coords
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    console.log("LogiFlow Map: Initialized successfully.");
}

// Attach to window so index.html can see it
window.processCSV = function(csvText) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    const lines = csvText.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    lines.slice(1).forEach(line => {
        const vals = line.split(',');
        let data = {};
        headers.forEach((h, i) => data[h] = vals[i] ? vals[i].trim() : "");

        // Logic to handle plotting if Lat/Lng exist, or just log for now
        if (data.latitude && data.longitude) {
            const marker = L.marker([data.latitude, data.longitude])
                .addTo(map)
                .bindPopup(`<b>${data.company}</b><br>${data.address}`);
            markers.push(marker);
        }
    });

    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds());
    }
};

document.addEventListener('DOMContentLoaded', initMap);
