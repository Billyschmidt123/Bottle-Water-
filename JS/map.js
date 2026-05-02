// JS/map.js

/**
 * Initializes the Leaflet map for the LogiFlow Delivery System.
 */
(function() {
    // 1. Initialize the map object on the 'map' div
    // We attach it to the window object to ensure global visibility
    window.map = L.map('map', {
        zoomControl: true,
        trackResize: true 
    }).setView([55.1708, -118.7947], 13); // Centered on Grande Prairie

    // 2. Add the OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(window.map);

    console.log("Map initialized successfully on window.map");

    // 3. Immediate fix for the "grey box" calculation
    setTimeout(() => {
        if (window.map) {
            window.map.invalidateSize();
        }
    }, 250);
})();
