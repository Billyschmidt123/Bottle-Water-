function managerInit() {
    console.log("Manager module ready");
}

function loadManagerPortal() {
    fetch("MODULES/manager-portal.html")
        .then(r => r.text())
        .then(html => {
            showModal(html);
        })
        .catch(err => {
            console.error("Failed to load manager portal:", err);
        });
}

// === ADDED: Route import + manager portal enhancement =======================

function importAllRoutesFromGitHub() {
    console.log("Starting route import from GitHub...");

    // Placeholder: you can replace this with real GitHub fetch logic.
    // For now, just log and pretend we loaded routes.
    if (!appState.routes) appState.routes = {};

    appState.routes["demo-route"] = {
        name: "Demo Route",
        customers: [
            { Customer: "Demo Stop 1", Address: "123 Main St", lat: 51.045, lng: -114.07 },
            { Customer: "Demo Stop 2", Address: "456 2nd St", lat: 51.05, lng: -114.08 }
        ]
    };

    console.log("Routes imported:", Object.keys(appState.routes));
}

function enhanceManagerPortalIfPresent() {
    const modals = document.querySelectorAll(".modal");
    if (!modals.length) return;

    let managerModal = null;
    modals.forEach(m => {
        const header = m.querySelector(".modal-header");
        if (header && header.textContent.includes("Manager")) {
            managerModal = m;
        }
    });

    if (!managerModal) return;

    const buttons = managerModal.querySelectorAll("button");
    buttons.forEach(btn => {
        if (btn.textContent.includes("Load routes") && !btn._bound) {
            btn.addEventListener("click", () => {
                console.log("Load routes clicked");
                importAllRoutesFromGitHub();
            });
            btn._bound = true;
        }
    });
}

(function () {
    const originalShowModal = window.showModal;
    if (typeof originalShowModal === "function") {
        window.showModal = function (html) {
            originalShowModal(html);
            setTimeout(() => {
                try {
                    enhanceManagerPortalIfPresent();
                } catch (e) {
                    console.warn("Manager portal enhancement failed:", e);
                }
            }, 0);
        };
    }
})();

// === END ADDED: Route import + manager portal enhancement ===================
