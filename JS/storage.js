function saveState() {
    localStorage.setItem("appState", JSON.stringify(appState));
}

function loadState() {
    const data = localStorage.getItem("appState");
    if (data) appState = JSON.parse(data);
}
