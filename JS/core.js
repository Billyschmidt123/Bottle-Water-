let map = null;
let appState = {
    routes: [],
    customers: [],
    activeRoute: null
};

function appInit() {
    console.log("App initialized");
    initMap();
    uiInit();
    navigationInit();
    managerInit();
}

// === ADDED: Extended appState for route / stop / driver tracking ===
appState.stops = [];              // array of stop objects loaded from CSV (or placeholder)
appState.currentStopIndex = -1;   // index of currently selected stop
appState.driverName = "";         // driver name captured on Start
appState.tripLog = [];            // simple in-memory trip log
// === END ADDED: Extended appState ===
