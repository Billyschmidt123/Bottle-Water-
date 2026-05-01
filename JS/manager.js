function managerInit() {
    console.log("Manager module ready");
}

function loadManagerPortal() {
    fetch("MODULES/manager-portal.html")
        .then(r => r.text())
        .then(html => showModal(html));
}
