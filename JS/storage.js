function saveState() {
    localStorage.setItem("appState", JSON.stringify(appState));
}

function loadState() {
    const data = localStorage.getItem("appState");
    if (data) appState = JSON.parse(data);
}

// === ADDED: Simple trip log persistence (optional) ===
function saveTripLog() {
    try {
        localStorage.setItem("tripLog", JSON.stringify(appState.tripLog || []));
    } catch (e) {
        console.warn("Failed to save trip log:", e);
    }
}

function loadTripLog() {
    try {
        const data = localStorage.getItem("tripLog");
        if (data) {
            appState.tripLog = JSON.parse(data);
        } else {
            appState.tripLog = [];
        }
    } catch (e) {
        console.warn("Failed to load trip log:", e);
        appState.tripLog = [];
    }
}
// === END ADDED: Simple trip log persistence ===
