function uiInit() {
    console.log("UI initialized");

    document.getElementById("openManagerBtn").addEventListener("click", () => {
        loadManagerPortal();
    });

    document.getElementById("refreshRoutesBtn").addEventListener("click", () => {
        console.log("Refreshing routes...");
    });

    // === ADDED: Wire up map control buttons ===
    const btnPrev = document.getElementById("btnPrevStop");
    const btnNext = document.getElementById("btnNextStop");
    const btnStart = document.getElementById("btnStartRoute");
    const btnFinish = document.getElementById("btnFinishRoute");
    const btnDirections = document.getElementById("btnDirections");

    if (btnPrev) {
        btnPrev.addEventListener("click", () => {
            goToPreviousStop();
        });
    }

    if (btnNext) {
        btnNext.addEventListener("click", () => {
            goToNextStop();
        });
    }

    if (btnStart) {
        btnStart.addEventListener("click", () => {
            startRouteFlow();
        });
    }

    if (btnFinish) {
        btnFinish.addEventListener("click", () => {
            finishRouteFlow();
        });
    }

    if (btnDirections) {
        btnDirections.addEventListener("click", () => {
            openDirectionsForCurrentStop();
        });
    }

    // Load a route (placeholder CSV-based loader)
    loadRouteFromCsv();
    // === END ADDED: Wire up map control buttons ===
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

// === ADDED: UI helpers for current stop info and stop modal ===
function updateCurrentStopInfo() {
    const el = document.getElementById("currentStopInfo");
    if (!el) return;

    const idx = appState.currentStopIndex;
    const stop = appState.stops[idx];

    if (!stop) {
        el.textContent = "No stop selected";
        return;
    }

    const headerParts = [];
    if (stop.company) headerParts.push(stop.company);
    if (stop.addressCombined) headerParts.push(stop.addressCombined);
    if (stop.phone) headerParts.push("Phone: " + stop.phone);

    el.textContent = headerParts.join(" | ");
}

function openStopModal(index) {
    const stop = appState.stops[index];
    if (!stop) return;

    fetch("MODULES/stop-modal.html")
        .then(r => r.text())
        .then(html => {
            // Inject stop data placeholders
            const filled = html
                .replace(/{{COMPANY}}/g, stop.company || "")
                .replace(/{{ADDRESS_HEADER}}/g, stop.addressCombined || "")
                .replace(/{{PHONE}}/g, stop.phone || "")
                .replace(/{{EMAIL}}/g, stop.email || "")
                .replace(/{{DELIVERY_FEE}}/g, stop.deliveryFee || "")
                .replace(/{{TRAVEL}}/g, stop.travel || "")
                .replace(/{{SPECIAL_INSTRUCTIONS}}/g, stop.specialInstructions || "")
                .replace(/{{RECEIVED_BY}}/g, stop.receivedBy || "");

            showModal(filled);

            // Initialize signature pad and product dropdowns after modal is in DOM
            initSignaturePad();
            populateProductDropdowns(stop);
            attachStopModalHandlers(index);
        })
        .catch(err => {
            console.error("Failed to load stop modal:", err);
        });
}
// === END ADDED: UI helpers ===
