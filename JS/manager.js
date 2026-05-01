function managerInit() {
    console.log("Manager module ready");
}

function loadManagerPortal() {
    fetch("MODULES/manager-portal.html")
        .then(r => r.text())
        .then(html => showModal(html));
}



// === ADDED: Manager portal enhancements – route importer + customer maintenance ===

// GitHub repo info for routes
// Base API for listing contents:
// https://api.github.com/repos/Billyschmidt123/Bottle-Water-/contents/routes
var GITHUB_ROUTES_API_BASE = "https://api.github.com/repos/Billyschmidt123/Bottle-Water-/contents/routes";
var GITHUB_ROUTE_FOLDERS = ["week1", "week2", "week3", "week4", "other"];

/**
 * Wrap showModal so that whenever the Manager Portal is opened,
 * we can enhance it (wire Load Routes button, add Customer Maintenance, etc.)
 * Original showModal is preserved and still called.
 */
(function () {
    if (typeof showModal === "function") {
        var originalShowModal = showModal;
        window.showModal = function (html) {
            originalShowModal(html);
            // Defer enhancement slightly to allow DOM insertion
            setTimeout(function () {
                try {
                    enhanceManagerPortalIfPresent();
                } catch (e) {
                    console.warn("Manager portal enhancement failed:", e);
                }
            }, 0);
        };
    }
})();

/**
 * Enhance the Manager Portal modal when it is present in the DOM.
 * - Attach importer to "Load Routes" button
 * - Add "Customer Maintenance" button
 * - Ensure route dropdown exists on main UI
 */
function enhanceManagerPortalIfPresent() {
    var modals = document.querySelectorAll(".modal");
    if (!modals || !modals.length) return;

    var managerModal = null;
    for (var i = 0; i < modals.length; i++) {
        var header = modals[i].querySelector(".modal-header");
        if (header && header.textContent && header.textContent.indexOf("Manager Portal") !== -1) {
            managerModal = modals[i];
            break;
        }
    }
    if (!managerModal) return;

    // Wire "Load Routes" button (without removing existing inline onclick)
    var routeButtons = managerModal.querySelectorAll(".manager-section button");
    for (var j = 0; j < routeButtons.length; j++) {
        var btn = routeButtons[j];
        if (btn.textContent && btn.textContent.indexOf("Load Routes") !== -1) {
            // Avoid double-binding
            if (!btn._routesImporterBound) {
                btn.addEventListener("click", function () {
                    importAllRoutesFromGitHub();
                });
                btn._routesImporterBound = true;
            }
        }
    }

    // Add "Customer Maintenance" button under Manager Portal if not already present
    var sections = managerModal.querySelectorAll(".manager-section");
    var hasCustomerSection = false;
    for (var k = 0; k < sections.length; k++) {
        var h3 = sections[k].querySelector("h3");
        if (h3 && h3.textContent && h3.textContent.indexOf("Customer Maintenance") !== -1) {
            hasCustomerSection = true;
            break;
        }
    }

    if (!hasCustomerSection) {
        var customerSection = document.createElement("div");
        customerSection.className = "manager-section";

        var h3 = document.createElement("h3");
        h3.textContent = "Customer Maintenance";

        var btnCust = document.createElement("button");
        btnCust.className = "manager-btn";
        btnCust.textContent = "Manage Customers";
        btnCust.addEventListener("click", function () {
            openCustomerMaintenanceModal();
        });

        customerSection.appendChild(h3);
        customerSection.appendChild(btnCust);

        managerModal.querySelector(".modal-body").appendChild(customerSection);
    }

    // Ensure route dropdown exists on main UI
    ensureRouteDropdown();
}

/**
 * Ensure a route dropdown exists in the main UI so routes can be selected later.
 * If #routeDropdown exists, we use it; otherwise we create one in #mapTopBar if present.
 */
function ensureRouteDropdown() {
    var existing = document.getElementById("routeDropdown");
    if (existing) {
        refreshRouteDropdownOptions(existing);
        return;
    }

    var mapTopBar = document.getElementById("mapTopBar");
    if (!mapTopBar) return;

    var container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "6px";
    container.style.marginLeft = "10px";

    var label = document.createElement("span");
    label.textContent = "Route:";

    var select = document.createElement("select");
    select.id = "routeDropdown";
    select.style.minWidth = "180px";

    select.addEventListener("change", function () {
        var key = select.value;
        saveSelectedRoute(key);
        // Live system: you can hook into map update here if needed
        console.log("Selected route:", key);
    });

    container.appendChild(label);
    container.appendChild(select);

    var controls = document.getElementById("mapControlButtons");
    if (controls) {
        controls.parentNode.insertBefore(container, controls);
    } else {
        mapTopBar.appendChild(container);
    }

    refreshRouteDropdownOptions(select);
}

/**
 * Refresh options in the route dropdown from stored routes.
 */
function refreshRouteDropdownOptions(selectEl) {
    if (!selectEl) {
        selectEl = document.getElementById("routeDropdown");
        if (!selectEl) return;
    }

    var routes = getRouteList();
    var selected = getSelectedRoute();

    // Clear existing
    while (selectEl.firstChild) {
        selectEl.removeChild(selectEl.firstChild);
    }

    var optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.textContent = routes.length ? "Select a route..." : "No routes loaded";
    selectEl.appendChild(optDefault);

    for (var i = 0; i < routes.length; i++) {
        var r = routes[i];
        var opt = document.createElement("option");
        opt.value = r.key;
        var label = (r.folder ? (r.folder.toUpperCase() + " - ") : "") + r.name;
        opt.textContent = label;
        if (selected && selected === r.key) {
            opt.selected = true;
        }
        selectEl.appendChild(opt);
    }
}

/**
 * Import all routes from GitHub (auto-scan all 5 folders).
 */
function importAllRoutesFromGitHub() {
    console.log("Starting route import from GitHub...");
    var folderPromises = [];

    for (var i = 0; i < GITHUB_ROUTE_FOLDERS.length; i++) {
        (function (folderName) {
            var url = GITHUB_ROUTES_API_BASE + "/" + encodeURIComponent(folderName);
            var p = fetch(url)
                .then(function (r) {
                    if (!r.ok) {
                        console.warn("Failed to list folder:", folderName, r.status);
                        return [];
                    }
                    return r.json();
                })
                .then(function (items) {
                    if (!items || !items.length) return [];
                    var csvFiles = [];
                    for (var j = 0; j < items.length; j++) {
                        var item = items[j];
                        if (item && item.name && item.name.toLowerCase().endsWith(".csv") && item.download_url) {
                            csvFiles.push({
                                folder: folderName,
                                name: item.name,
                                download_url: item.download_url,
                                path: folderName + "/" + item.name
                            });
                        }
                    }
                    return csvFiles;
                })
                .catch(function (e) {
                    console.warn("Error listing folder:", folderName, e);
                    return [];
                });

            folderPromises.push(p);
        })(GITHUB_ROUTE_FOLDERS[i]);
    }

    Promise.all(folderPromises).then(function (results) {
        var allFiles = [];
        for (var k = 0; k < results.length; k++) {
            var arr = results[k];
            if (arr && arr.length) {
                allFiles = allFiles.concat(arr);
            }
        }

        if (!allFiles.length) {
            console.log("No CSV route files found in GitHub routes folders.");
            return;
        }

        console.log("Found route CSV files:", allFiles);

        var fetchPromises = [];
        for (var m = 0; m < allFiles.length; m++) {
            (function (fileInfo) {
                var p = fetch(fileInfo.download_url)
                    .then(function (r) {
                        if (!r.ok) {
                            console.warn("Failed to fetch CSV:", fileInfo.download_url, r.status);
                            return null;
                        }
                        return r.text();
                    })
                    .then(function (text) {
                        if (!text) return;
                        processImportedRouteCSV(fileInfo, text);
                    })
                    .catch(function (e) {
                        console.warn("Error fetching CSV:", fileInfo.download_url, e);
                    });
                fetchPromises.push(p);
            })(allFiles[m]);
        }

        Promise.all(fetchPromises).then(function () {
            console.log("Route import complete.");
            // Update dropdown after import
            ensureRouteDropdown();
        });
    });
}

/**
 * Process a single imported CSV file into routesData + customersData.
 */
function processImportedRouteCSV(fileInfo, csvText) {
    var parsed = parseCSVToObjects(csvText);
    if (!parsed || !parsed.rows || !parsed.rows.length) {
        console.warn("CSV has no data:", fileInfo);
        return;
    }

    var routeKey = fileInfo.path; // e.g., "week1/route1.csv"
    var routeObj = {
        name: fileInfo.name,
        folder: fileInfo.folder,
        path: fileInfo.path,
        customers: parsed.rows
    };

    // Save route
    upsertRoute(routeKey, routeObj);

    // Flatten into customersData
    var customers = getCustomersData();
    for (var i = 0; i < parsed.rows.length; i++) {
        var row = parsed.rows[i];
        var customerId = routeKey + "::" + i;
        if (!customers[customerId]) {
            customers[customerId] = {
                id: customerId,
                routeKey: routeKey,
                active: true,
                data: row
            };
        }
    }
    saveCustomersData(customers);
}

/**
 * Simple CSV parser: returns { headers: [...], rows: [ {header: value, ...}, ... ] }
 * Assumes first row is headers, comma-separated.
 */
function parseCSVToObjects(csvText) {
    if (!csvText) return { headers: [], rows: [] };

    var lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    var headers = [];
    var rows = [];

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;

        var cols = line.split(",");
        if (!headers.length) {
            headers = cols.map(function (h) { return h.trim(); });
        } else {
            var obj = {};
            for (var c = 0; c < headers.length; c++) {
                obj[headers[c]] = cols[c] !== undefined ? cols[c].trim() : "";
            }
            rows.push(obj);
        }
    }

    return { headers: headers, rows: rows };
}

/**
 * Open Customer Maintenance modal with full CRUD + activate/deactivate.
 */
function openCustomerMaintenanceModal() {
    var customers = getCustomersData();
    var routes = getRouteList();

    var html = [];
    html.push('<div class="modal">');
    html.push('  <div class="modal-header">Customer Maintenance</div>');
    html.push('  <div class="modal-body" style="max-height:60vh; overflow:auto;">');

    html.push('    <div style="margin-bottom:10px;">');
    html.push('      <button class="btn-success" id="btnAddCustomer">Add Customer</button>');
    html.push('    </div>');

    html.push('    <table style="width:100%; border-collapse:collapse; font-size:0.9em;">');
    html.push('      <thead>');
    html.push('        <tr>');
    html.push('          <th style="border-bottom:1px solid #ccc; text-align:left;">ID</th>');
    html.push('          <th style="border-bottom:1px solid #ccc; text-align:left;">Route</th>');
    html.push('          <th style="border-bottom:1px solid #ccc; text-align:left;">Name</th>');
    html.push('          <th style="border-bottom:1px solid #ccc; text-align:left;">Active</th>');
    html.push('          <th style="border-bottom:1px solid #ccc; text-align:left;">Actions</th>');
    html.push('        </tr>');
    html.push('      </thead>');
    html.push('      <tbody id="customerTableBody">');

    var routeNameByKey = {};
    for (var r = 0; r < routes.length; r++) {
        routeNameByKey[routes[r].key] = (routes[r].folder ? (routes[r].folder.toUpperCase() + " - ") : "") + routes[r].name;
    }

    for (var id in customers) {
        if (!customers.hasOwnProperty(id)) continue;
        var c = customers[id];
        var displayName = "";
        if (c && c.data) {
            // Try some common header names; fallback to JSON
            displayName = c.data.Name || c.data.Customer || c.data.CustomerName || JSON.stringify(c.data);
        }
        var routeLabel = routeNameByKey[c.routeKey] || c.routeKey || "";
        html.push('        <tr data-id="' + id + '">');
        html.push('          <td style="border-bottom:1px solid #eee; padding:4px 2px;">' + id + '</td>');
        html.push('          <td style="border-bottom:1px solid #eee; padding:4px 2px;">' + routeLabel + '</td>');
        html.push('          <td style="border-bottom:1px solid #eee; padding:4px 2px;">' + escapeHtml(displayName) + '</td>');
        html.push('          <td style="border-bottom:1px solid #eee; padding:4px 2px;">' + (c.active ? "Yes" : "No") + '</td>');
        html.push('          <td style="border-bottom:1px solid #eee; padding:4px 2px;">');
        html.push('            <button class="btn-top btn-small" data-action="edit">Edit</button>');
        html.push('            <button class="btn-top btn-small" data-action="toggle">' + (c.active ? "Deactivate" : "Activate") + '</button>');
        html.push('            <button class="btn-top btn-small btn-danger" data-action="delete">Delete</button>');
        html.push('          </td>');
        html.push('        </tr>');
    }

    html.push('      </tbody>');
    html.push('    </table>');

    html.push('  </div>');
    html.push('  <div class="modal-footer">');
    html.push('    <button class="btn-warning" onclick="closeModal()">Close</button>');
    html.push('  </div>');
    html.push('</div>');

    showModal(html.join(""));

    // Wire table actions
    setTimeout(function () {
        var tbody = document.getElementById("customerTableBody");
        if (tbody) {
            tbody.addEventListener("click", function (evt) {
                var target = evt.target;
                if (!target || !target.getAttribute) return;
                var action = target.getAttribute("data-action");
                if (!action) return;
                var tr = target.closest("tr");
                if (!tr) return;
                var id = tr.getAttribute("data-id");
                if (!id) return;

                if (action === "edit") {
                    openEditCustomerModal(id);
                } else if (action === "toggle") {
                    toggleCustomerActive(id);
                    openCustomerMaintenanceModal(); // refresh
                } else if (action === "delete") {
                    if (confirm("Delete this customer?")) {
                        deleteCustomerById(id);
                        openCustomerMaintenanceModal(); // refresh
                    }
                }
            });
        }

        var btnAdd = document.getElementById("btnAddCustomer");
        if (btnAdd) {
            btnAdd.addEventListener("click", function () {
                openEditCustomerModal(null);
            });
        }
    }, 0);
}

/**
 * Escape HTML for safe display.
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Open modal to add/edit a single customer.
 * If customerId is null, create new.
 */
function openEditCustomerModal(customerId) {
    var customers = getCustomersData();
    var customer = customerId ? customers[customerId] : null;

    var routeKey = customer && customer.routeKey ? customer.routeKey : "";
    var nameValue = "";
    if (customer && customer.data) {
        nameValue = customer.data.Name || customer.data.Customer || customer.data.CustomerName || "";
    }

    var html = [];
    html.push('<div class="modal">');
    html.push('  <div class="modal-header">' + (customerId ? "Edit Customer" : "Add Customer") + '</div>');
    html.push('  <div class="modal-body">');

    html.push('    <div style="margin-bottom:10px;">');
    html.push('      <label>Route Key</label>');
    html.push('      <input type="text" id="editCustomerRouteKey" style="width:100%;" value="' + escapeHtml(routeKey) + '">');
    html.push('    </div>');

    html.push('    <div style="margin-bottom:10px;">');
    html.push('      <label>Display Name</label>');
    html.push('      <input type="text" id="editCustomerName" style="width:100%;" value="' + escapeHtml(nameValue) + '">');
    html.push('    </div>');

    html.push('    <div style="margin-bottom:10px;">');
    html.push('      <label>Active</label>');
    var activeChecked = (!customer || customer.active) ? "checked" : "";
    html.push('      <input type="checkbox" id="editCustomerActive" ' + activeChecked + '> Active');
    html.push('    </div>');

    html.push('  </div>');
    html.push('  <div class="modal-footer">');
    html.push('    <button class="btn-success" id="btnSaveCustomerEdit">Save</button>');
    html.push('    <button class="btn-warning" onclick="openCustomerMaintenanceModal()">Cancel</button>');
    html.push('  </div>');
    html.push('</div>');

    showModal(html.join(""));

    setTimeout(function () {
        var btnSave = document.getElementById("btnSaveCustomerEdit");
        if (!btnSave) return;
        btnSave.addEventListener("click", function () {
            var routeKeyInput = document.getElementById("editCustomerRouteKey");
            var nameInput = document.getElementById("editCustomerName");
            var activeInput = document.getElementById("editCustomerActive");

            var newRouteKey = routeKeyInput ? routeKeyInput.value.trim() : "";
            var newName = nameInput ? nameInput.value.trim() : "";
            var isActive = activeInput ? !!activeInput.checked : true;

            var customersData = getCustomersData();

            var id = customerId;
            if (!id) {
                // Create new id
                id = newRouteKey + "::" + Date.now();
            }

            var existing = customersData[id] || {
                id: id,
                routeKey: newRouteKey,
                active: isActive,
                data: {}
            };

            existing.routeKey = newRouteKey;
            existing.active = isActive;
            if (!existing.data || typeof existing.data !== "object") {
                existing.data = {};
            }
            existing.data.Name = newName;

            customersData[id] = existing;
            saveCustomersData(customersData);

            openCustomerMaintenanceModal();
        });
    }, 0);
}

// === END ADDED: Manager portal enhancements – route importer + customer maintenance ===
