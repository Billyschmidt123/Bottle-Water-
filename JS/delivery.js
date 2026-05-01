function startDelivery(routeId) {
    console.log("Starting delivery for route:", routeId);
}

// === ADDED: Route / stop navigation, modal logic, PDF + email flow ===

// Placeholder CSV loader: in a real system, this would fetch and parse a CSV file.
// For v1, we simulate a few stops and keep the structure ready for CSV wiring.
function loadRouteFromCsv() {
    console.log("Loading route from CSV (placeholder)");

    // Example stops; in production, replace with parsed CSV rows.
    appState.stops = [
        {
            id: 1,
            company: "Culligan Customer A",
            address: "123 Main St",
            city: "Calgary",
            postalCode: "T2P 1A1",
            province: "AB",
            phone: "555-111-2222",
            email: "customerA@example.com",
            deliveryFee: "",
            travel: "",
            specialInstructions: "",
            receivedBy: "",
            lat: 51.045,
            lng: -114.07
        },
        {
            id: 2,
            company: "Culligan Customer B",
            address: "456 7 Ave SW",
            city: "Calgary",
            postalCode: "T2P 3N5",
            province: "AB",
            phone: "555-333-4444",
            email: "customerB@example.com",
            deliveryFee: "",
            travel: "",
            specialInstructions: "",
            receivedBy: "",
            lat: 51.047,
            lng: -114.08
        }
    ];

    // Build combined address header
    appState.stops.forEach(stop => {
        stop.addressCombined = [
            stop.address,
            stop.city,
            stop.postalCode,
            stop.province
        ].filter(Boolean).join(", ");
    });

    // Render markers and select first stop
    renderStopsOnMap();
    if (appState.stops.length > 0) {
        appState.currentStopIndex = 0;
        updateCurrentStopInfo();
        updateMapForCurrentStop();
    }
}

function selectStop(index) {
    if (index < 0 || index >= appState.stops.length) return;
    appState.currentStopIndex = index;
    updateCurrentStopInfo();
    updateMapForCurrentStop();
    openStopModal(index);
}

function goToNextStop() {
    if (!appState.stops.length) return;
    let idx = appState.currentStopIndex;
    if (idx < 0) idx = 0;
    else idx = (idx + 1) % appState.stops.length;
    selectStop(idx);
}

function goToPreviousStop() {
    if (!appState.stops.length) return;
    let idx = appState.currentStopIndex;
    if (idx < 0) idx = 0;
    else idx = (idx - 1 + appState.stops.length) % appState.stops.length;
    selectStop(idx);
}

function startRouteFlow() {
    if (!appState.stops.length) {
        alert("No route loaded.");
        return;
    }

    const name = prompt("Enter driver name:");
    if (!name) {
        alert("Driver name is required to start the route.");
        return;
    }

    appState.driverName = name;
    appState.tripLog.push({
        type: "start",
        driver: name,
        timestamp: new Date().toISOString()
    });

    console.log("Route started by:", name);
    alert("Route started for driver: " + name);
}

function finishRouteFlow() {
    appState.tripLog.push({
        type: "finish",
        driver: appState.driverName || "",
        timestamp: new Date().toISOString()
    });

    console.log("Route finished.");
    alert("Route finished.");
}

// Directions: open Google Maps with current location as origin and stop address as destination.
function openDirectionsForCurrentStop() {
    const stop = appState.stops[appState.currentStopIndex];
    if (!stop) {
        alert("No stop selected.");
        return;
    }

    const destination = encodeURIComponent(stop.addressCombined || stop.address || "");
    if (!destination) {
        alert("Stop has no address.");
        return;
    }

    // Let Google Maps handle current GPS location as origin ("Current Location")
    const url = "https://www.google.com/maps/dir/?api=1&destination=" + destination + "&travelmode=driving";
    window.open(url, "_blank");
}

// Attach handlers inside the stop modal
function attachStopModalHandlers(stopIndex) {
    const btnSave = document.getElementById("btnSaveAndReceipt");
    const btnNotDelivered = document.getElementById("btnNotDelivered");

    if (btnSave) {
        btnSave.addEventListener("click", () => {
            handleSaveAndCreateReceipt(stopIndex, btnSave);
        });
    }

    if (btnNotDelivered) {
        btnNotDelivered.addEventListener("click", () => {
            handleNotDelivered(stopIndex);
        });
    }
}

// Populate product dropdowns using productCatalog
function populateProductDropdowns(stop) {
    const waterSelect = document.getElementById("waterProducts");
    const coffeeSelect = document.getElementById("coffeeProducts");

    if (waterSelect && productCatalog && Array.isArray(productCatalog.water)) {
        waterSelect.innerHTML = "";
        productCatalog.water.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.name;
            opt.textContent = p.name + " (" + p.unitSize + ")";
            waterSelect.appendChild(opt);
        });
    }

    if (coffeeSelect && productCatalog && Array.isArray(productCatalog.coffee)) {
        coffeeSelect.innerHTML = "";
        productCatalog.coffee.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.name;
            opt.textContent = p.name + " (" + p.unitSize + ")";
            coffeeSelect.appendChild(opt);
        });
    }
}

// Signature pad
let signaturePad = null;
let signatureHintVisible = true;

function initSignaturePad() {
    const canvas = document.getElementById("signatureCanvas");
    const hint = document.getElementById("signatureHint");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let drawing = false;

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        return { x, y };
    }

    function startDraw(e) {
        e.preventDefault();
        drawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        if (hint && signatureHintVisible) {
            hint.style.opacity = "0";
            signatureHintVisible = false;
        }
    }

    function moveDraw(e) {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    function endDraw(e) {
        if (!drawing) return;
        e.preventDefault();
        drawing = false;
    }

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", moveDraw);
    canvas.addEventListener("mouseup", endDraw);
    canvas.addEventListener("mouseleave", endDraw);

    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", moveDraw, { passive: false });
    canvas.addEventListener("touchend", endDraw, { passive: false });

    signaturePad = canvas;
}

function getSignatureDataUrl() {
    if (!signaturePad) return "";
    try {
        return signaturePad.toDataURL("image/png");
    } catch (e) {
        console.error("Failed to capture signature:", e);
        return "";
    }
}

// Not delivered flow
function handleNotDelivered(stopIndex) {
    const stop = appState.stops[stopIndex];
    if (!stop) return;

    stop.status = "not_delivered";
    stop.notDeliveredTimestamp = new Date().toISOString();

    // In a real system, this would append to a CSV or send to backend.
    console.log("Stop marked as NOT delivered:", stop);

    alert("Not delivered status saved for this stop.");
    closeModal();
    goToNextStop();
}

// Save + create delivery receipt flow
let saveButtonLocked = false;
let saveButtonTimeoutId = null;

function handleSaveAndCreateReceipt(stopIndex, buttonEl) {
    if (saveButtonLocked) {
        alert("Please wait, creating delivery receipt...");
        return;
    }

    const stop = appState.stops[stopIndex];
    if (!stop) return;

    // Collect modal fields
    const emailEl = document.getElementById("stopEmail");
    const feeEl = document.getElementById("stopDeliveryFee");
    const travelEl = document.getElementById("stopTravel");
    const instrEl = document.getElementById("stopSpecialInstructions");
    const recvEl = document.getElementById("stopReceivedBy");
    const waterEl = document.getElementById("waterProducts");
    const coffeeEl = document.getElementById("coffeeProducts");

    stop.email = emailEl ? emailEl.value : stop.email;
    stop.deliveryFee = feeEl ? feeEl.value : stop.deliveryFee;
    stop.travel = travelEl ? travelEl.value : stop.travel;
    stop.specialInstructions = instrEl ? instrEl.value : stop.specialInstructions;
    stop.receivedBy = recvEl ? recvEl.value : stop.receivedBy;
    stop.waterProduct = waterEl ? waterEl.value : "";
    stop.coffeeProduct = coffeeEl ? coffeeEl.value : "";
    stop.signatureDataUrl = getSignatureDataUrl();
    stop.status = "delivered";
    stop.deliveredTimestamp = new Date().toISOString();

    // Lock button and show message
    saveButtonLocked = true;
    const originalText = buttonEl.textContent;
    buttonEl.textContent = "Creating delivery receipt...";
    buttonEl.disabled = true;

    // 60 second timeout safety
    saveButtonTimeoutId = setTimeout(() => {
        saveButtonLocked = false;
        buttonEl.textContent = originalText;
        buttonEl.disabled = false;
        alert("Delivery receipt creation timed out. You can try again.");
    }, 60000);

    // Run PDF creation
    createDeliveryReceipt(stop)
        .then(pdfBlob => {
            clearTimeout(saveButtonTimeoutId);
            saveButtonLocked = false;
            buttonEl.textContent = originalText;
            buttonEl.disabled = false;

            // Trigger download
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "delivery-receipt-" + (stop.company || "customer") + ".pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Open mailto with subject/body; real attachment sending requires backend.
            if (stop.email) {
                const subject = encodeURIComponent("Your delivery receipt from Culligan");
                const body = encodeURIComponent("Thanks for choosing Culligan");
                const mailto = "mailto:" + encodeURIComponent(stop.email) +
                    "?subject=" + subject +
                    "&body=" + body;
                window.location.href = mailto;
            }

            alert("Delivery receipt created.");
            closeModal();
            goToNextStop();
        })
        .catch(err => {
            console.error("Failed to create delivery receipt:", err);
            clearTimeout(saveButtonTimeoutId);
            saveButtonLocked = false;
            buttonEl.textContent = originalText;
            buttonEl.disabled = false;
            alert("Failed to create delivery receipt. Please try again.");
        });
}

// PDF creation using template.html + jsPDF
async function createDeliveryReceipt(stop) {
    // Fetch template.html (simple HTML template)
    let templateHtml = "";
    try {
        const resp = await fetch("MODULES/template.html");
        templateHtml = await resp.text();
    } catch (e) {
        console.warn("template.html not found, using fallback template.");
        templateHtml = `
            <h1>Delivery Receipt</h1>
            <p>Company: {{COMPANY}}</p>
            <p>Address: {{ADDRESS}}</p>
            <p>Phone: {{PHONE}}</p>
            <p>Driver: {{DRIVER}}</p>
            <p>Received by: {{RECEIVED_BY}}</p>
            <p>Water: {{WATER}}</p>
            <p>Coffee: {{COFFEE}}</p>
            <p>Delivery fee: {{DELIVERY_FEE}}</p>
            <p>Travel: {{TRAVEL}}</p>
            <p>Special instructions: {{SPECIAL_INSTRUCTIONS}}</p>
        `;
    }

    const filled = templateHtml
        .replace(/{{COMPANY}}/g, stop.company || "")
        .replace(/{{ADDRESS}}/g, stop.addressCombined || "")
        .replace(/{{PHONE}}/g, stop.phone || "")
        .replace(/{{DRIVER}}/g, appState.driverName || "")
        .replace(/{{RECEIVED_BY}}/g, stop.receivedBy || "")
        .replace(/{{WATER}}/g, stop.waterProduct || "")
        .replace(/{{COFFEE}}/g, stop.coffeeProduct || "")
        .replace(/{{DELIVERY_FEE}}/g, stop.deliveryFee || "")
        .replace(/{{TRAVEL}}/g, stop.travel || "")
        .replace(/{{SPECIAL_INSTRUCTIONS}}/g, stop.specialInstructions || "");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Simple text-based rendering for v1
    const lines = filled
        .replace(/<[^>]+>/g, "") // strip tags for now
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

    let y = 10;
    lines.forEach(line => {
        doc.text(line, 10, y);
        y += 8;
    });

    // Signature image (if present)
    if (stop.signatureDataUrl) {
        try {
            doc.addImage(stop.signatureDataUrl, "PNG", 10, y + 5, 60, 20);
        } catch (e) {
            console.warn("Failed to add signature image to PDF:", e);
        }
    }

    const blob = doc.output("blob");
    return blob;
}
// === END ADDED: Route / stop navigation, modal logic, PDF + email flow ===
