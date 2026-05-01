function navigationInit() {
    console.log("Navigation system ready");
}

function setActiveRoute(routeId) {
    appState.activeRoute = routeId;
    console.log("Active route:", routeId);
}
