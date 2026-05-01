function uiInit() {
    console.log("UI initialized");

    document.getElementById("openManagerBtn").addEventListener("click", () => {
        loadManagerPortal();
    });

    document.getElementById("refreshRoutesBtn").addEventListener("click", () => {
        console.log("Refreshing routes...");
    });
}

function showModal(html) {
    const container = document.getElementById("modalContainer");
    container.innerHTML = html;
    container.style.display = "flex";
}

function closeModal() {
    const container = document.getElementById("modalContainer");
    container.style.display = "none";
}
