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



// ============================================================================
// === ADDED: FULL ROUTE NAVIGATION + SIDEBAR + DIRECTIONS (ADD-ONLY) ========
// ============================================================================

/**
 * Start the imported route.
 */
function startRouteFlow() {
    if (!appState.stops || !appState.stops.length) {
        console.warn("No stops loaded.");
        return;
    }

    appState.currentStopIndex = 0;
    updateCurrentStopInfo();
    updateMapForCurrentStop();
    renderSidebarStops();
}

/**
 * Finish the route.
 */
function finishRouteFlow() {
    appState.currentStopIndex = -1;
    updateCurrentStopInfo();
    clearSidebarStops();
    console.log("Route finished.");
}

/**
 * Go to next stop.
 */
function goToNextStop() {
    if (!appState.stops || !appState.stops.length) return;

    if (appState.currentStopIndex < appState.stops.length - 1) {
        appState.currentStopIndex++;
        updateCurrentStopInfo();
        updateMapForCurrentStop();
        highlightSidebarStop(appState.currentStopIndex);
    }
}

/**
 * Go to previous stop.
 */
function goToPreviousStop() {
    if (!appState.stops || !appState.stops.length) return;

    if (appState.currentStopIndex > 0) {
        appState.currentStopIndex--;
        updateCurrentStopInfo();
        updateMapForCurrentStop();
        highlightSidebarStop(appState.currentStopIndex);
    }
}

/**
 * Open directions in Google Maps.
 */
function openDirectionsForCurrentStop() {
    const idx = appState.currentStopIndex;
    const stop = appState.stops[idx];
    if (!stop || !stop.lat || !stop.lng) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`;
    window.open(url, "_blank");
}

/**
 * Render sidebar stop list.
 */
function renderSidebarStops() {
    const container = document.getElementById("sidebarStops");
    if (!container) return;

    container.innerHTML = "";

    appState.stops.forEach((stop, index) => {
        const div = document.createElement("div");
        div.className = "sidebar-stop";
        div.textContent = stop.company || stop.address || ("Stop " + (index + 1));
        div.dataset.index = index;

        div.addEventListener("click", () => {
            appState.currentStopIndex = index;
            updateCurrentStopInfo();
            updateMapForCurrentStop();
            highlightSidebarStop(index);
        });

        container.appendChild(div);
    });

    highlightSidebarStop(appState.currentStopIndex);
}

/**
 * Highlight the active stop in the sidebar.
 */
function highlightSidebarStop(index) {
    const container = document.getElementById("sidebarStops");
    if (!container) return;

    const children = container.querySelectorAll(".sidebar-stop");
    children.forEach((el, i) => {
        if (i === index) {
            el.classList.add("active-stop");
        } else {
            el.classList.remove("active-stop");
        }
    });
}

/**
 * Clear sidebar stops.
 */
function clearSidebarStops() {
    const container = document.getElementById("sidebarStops");
    if (container) container.innerHTML = "";
}

// ============================================================================
// === END ADDED: FULL ROUTE NAVIGATION + SIDEBAR + DIRECTIONS ===============
// ============================================================================
