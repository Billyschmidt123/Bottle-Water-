// Declare map globally so LogiFlow main script can access it
var map;

/**
 * Initializes the Leaflet map for the LogiFlow Delivery System.
 * Centered on Grande Prairie, Alberta.
 */
function initMap() {
    // 1. Initialize the map object on the 'map' div
    // We attach it to the window object to ensure global visibility
    window.map = L.map('map', {
        zoomControl: true,
        // This helps prevent the map from being stuck in a "hidden" state
        trackResize: true 
    }).setView([55.1708, -118.7947], 13); // Centered on Grande Prairie

    // 2. Add the OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(window.map);

    console.log("Map initialized successfully.");

    // 3. Optional: Initial fix for the grey box issue
    setTimeout(() => {
        window.map.invalidateSize();
    }, 200);
}

// Execute initialization
initMap();
