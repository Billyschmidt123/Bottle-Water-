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

        const isCompleted = typeof isStopCompleted === "function" ? isStopCompleted(stop) : false;
        const icon = L.icon({
            iconUrl: isCompleted ? "images/marker-icon-green.png" : "images/marker-icon.png",
            shadowUrl: "images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map);
        marker.on('click', () => {
            appState.currentStopIndex = index;
            updateCurrentStopInfo();
            updateMapForCurrentStop();
            if (typeof highlightSidebarStop === "function") {
                highlightSidebarStop(index);
            }
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
// === ADDED: Route → Map Integration ========================================
// ============================================================================

function convertCustomerToLatLng(customerRow) {
    if (!customerRow) return null;

    const lat = parseFloat(customerRow.lat || customerRow.Lat || customerRow.latitude);
    const lng = parseFloat(customerRow.lng || customerRow.Lng || customerRow.longitude);

    if (isNaN(lat) || isNaN(lng)) return null;

    return { lat: lat, lng: lng };
}

function buildStopIdFromRow(row, index) {
    if (!row) return "stop-" + index;
    const parts = [];
    if (row.CustomerId) parts.push(row.CustomerId);
    if (row.Customer) parts.push(row.Customer);
    if (row.Address) parts.push(row.Address);
    return parts.join("|") || ("stop-" + index);
}

function loadRouteOntoMap(routeKey) {
    if (!routeKey) return;

    const routes = typeof getRoutesData === "function" ? getRoutesData() : appState.routes || {};
    const route = routes[routeKey];
    if (!route || !Array.isArray(route.customers)) {
        console.warn("Route not found:", routeKey);
        return;
    }

    const stops = [];

    route.customers.forEach((row, index) => {
        const coords = convertCustomerToLatLng(row);
        if (!coords) return;

        const stop = {
            id: buildStopIdFromRow(row, index),
            lat: coords.lat,
            lng: coords.lng,
            company: row.Customer || row.Name || row.CustomerName || ("Stop " + (index + 1)),
            address: row.Address || "",
            addressCombined: row.Address || "",
            phone: row.Phone || "",
            email: row.Email || "",
            deliveryFee: row.DeliveryFee || "",
            travel: row.Travel || "",
            specialInstructions: row.SpecialInstructions || "",
            receivedBy: row.ReceivedBy || "",
            raw: row
        };

        const existingEdits = typeof getStopEdits === "function" ? getStopEdits(stop) : null;
        if (existingEdits) {
            Object.assign(stop, existingEdits);
        }

        stops.push(stop);
    });

    if (typeof appState !== "object") window.appState = {};
    appState.stops = stops;
    appState.currentStopIndex = stops.length ? 0 : -1;

    renderStopsOnMap();
    updateMapForCurrentStop();
    if (typeof renderSidebarStops === "function") {
        renderSidebarStops();
    }
    if (typeof updateCurrentStopInfo === "function") {
        updateCurrentStopInfo();
    }
}

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
// === END ADDED: Route → Map Integration ====================================
// ============================================================================
