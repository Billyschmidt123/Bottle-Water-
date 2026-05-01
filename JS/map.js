function initMap() {
    map = L.map('map').setView([51.0447, -114.0719], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);
}

window.initMap = initMap;

// === ADDED: Map helpers for current stop display and centering ===
let stopMarkers = [];

function clearStopMarkers() {
    stopMarkers.forEach(m => map.removeLayer(m));
    stopMarkers = [];
}

function renderStopsOnMap() {
    if (!map || !Array.isArray(appState.stops)) return;
    clearStopMarkers();

    appState.stops.forEach((stop, index) => {
        if (!stop.lat || !stop.lng) return;
        const marker = L.marker([stop.lat, stop.lng]).addTo(map);
        marker.on('click', () => {
            selectStop(index);
        });
        marker.bindTooltip(stop.company || stop.address || ("Stop " + (index + 1)));
        stopMarkers.push(marker);
    });
}

function updateMapForCurrentStop() {
    const stop = appState.stops[appState.currentStopIndex];
    if (!stop || !map) return;

    if (stop.lat && stop.lng) {
        map.setView([stop.lat, stop.lng], 14);
    }
}
// === END ADDED: Map helpers ===



// ============================================================================
// === ADDED: Route → Map Integration (DO NOT MODIFY EXISTING CODE ABOVE) ===
// ============================================================================

/**
 * Convert a customer row into a lat/lng pair.
 * Your CSV MUST contain fields named:
 *   - "lat"
 *   - "lng"
 * If not, the stop will be skipped.
 */
function convertCustomerToLatLng(customerRow) {
    if (!customerRow) return null;

    const lat = parseFloat(customerRow.lat || customerRow.Lat || customerRow.latitude);
    const lng = parseFloat(customerRow.lng || customerRow.Lng || customerRow.longitude);

    if (isNaN(lat) || isNaN(lng)) return null;

    return { lat: lat, lng: lng };
}

/**
 * Load a selected route from storage and push it into appState.stops
 * so your existing map logic (renderStopsOnMap, updateMapForCurrentStop)
 * works WITHOUT ANY MODIFICATION.
 */
function loadRouteOntoMap(routeKey) {
    if (!routeKey) return;

    const routes = getRoutesData();
    const route = routes[routeKey];
    if (!route || !Array.isArray(route.customers)) {
        console.warn("Route not found:", routeKey);
        return;
    }

    // Convert CSV rows → stops compatible with your existing map logic
    const stops = [];

    route.customers.forEach((row, index) => {
        const coords = convertCustomerToLatLng(row);
        if (!coords) return;

        stops.push({
            lat: coords.lat,
            lng: coords.lng,
            company: row.Customer || row.Name || row.CustomerName || ("Stop " + (index + 1)),
            address: row.Address || "",
            raw: row
        });
    });

    // Push into your existing appState (ADD ONLY — DO NOT MODIFY EXISTING STRUCTURE)
    if (typeof appState !== "object") window.appState = {};
    appState.stops = stops;
    appState.currentStopIndex = 0;

    // Render using your existing functions
    renderStopsOnMap();
    updateMapForCurrentStop();
}

/**
 * Listen for route selection changes.
 * This is additive — does NOT modify any existing dropdown logic.
 */
(function attachRouteDropdownListener() {
    document.addEventListener("change", function (evt) {
        const el = evt.target;
        if (!el || el.id !== "routeDropdown") return;

        const routeKey = el.value;
        if (!routeKey) return;

        console.log("Loading route onto map:", routeKey);
        loadRouteOntoMap(routeKey);
    });
})();

// ============================================================================
// === END ADDED: Route → Map Integration =====================================
// ============================================================================
