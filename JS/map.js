// JS/map.js

/**
 * Initializes the Leaflet map for the LogiFlow Delivery System.
 */
(function() {
    // Check if Leaflet (L) is actually loaded first
    if (typeof L === 'undefined') {
        console.error("Leaflet library (L) is missing. Map cannot initialize.");
        return;
    }

    // 1. Initialize the map object on the 'map' div
    // We attach it to the window object so the LogiFlow main script can see it
    window.map = L.map('map', {
        zoomControl: true,
        trackResize: true 
    }).setView([55.1708, -118.7947], 13); // Grande Prairie coordinates

    // 2. Add the OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(window.map);

    console.log("LogiFlow Map: Initialized successfully.");

    // 3. Fix the "grey box" by forcing a size recalculation
    setTimeout(() => {
        if (window.map) {
            window.map.invalidateSize();
            console.log("LogiFlow Map: Layout refreshed.");
        }
    }, 500);
})();
