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
