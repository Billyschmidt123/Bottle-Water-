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
