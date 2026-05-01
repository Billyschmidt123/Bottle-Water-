function initMap() {
    map = L.map('map').setView([51.0447, -114.0719], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);
}

window.initMap = initMap;
