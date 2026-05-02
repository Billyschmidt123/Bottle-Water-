let map;
let markers = [];

/**
 * Initializes the Leaflet map centered on Grande Prairie.
 */
function initMap() {
    // Center the map on Grande Prairie, AB
    map = L.map('map').setView([55.1707, -118.7947], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

/**
 * Processes the CSV route data and places markers for each customer stop.
 */
window.processCSV = function(csvText) {
    // 1. Clear existing markers from the map
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const lines = csvText.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;

    // 2. Extract headers and normalize to lowercase
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    lines.slice(1).forEach(line => {
        const vals = line.split(',');
        let data = {};
        headers.forEach((h, i) => {
            data[h] = vals[i] ? vals[i].trim() : "";
        });
        
        // 3. Extract coordinates (handles latitude, lat, longitude, lng, or long)
        const lat = parseFloat(data.latitude || data.lat);
        const lng = parseFloat(data.longitude || data.lng || data.long);

        if (!isNaN(lat) && !isNaN(lng)) {
            // 4. Create marker and add to map
            const m = L.marker([lat, lng])
                .addTo(map)
                .bindPopup(`<b>${data.company || "Delivery Stop"}</b><br>${data.address || ''}`);
            
            markers.push(m);
        }
    });

    // 5. Automatically zoom/pan to fit all route stops
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
};

// Start the map once the page is ready
document.addEventListener('DOMContentLoaded', initMap);
