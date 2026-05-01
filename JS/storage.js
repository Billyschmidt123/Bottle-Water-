function saveState() {
    localStorage.setItem("appState", JSON.stringify(appState));
}

function loadState() {
    const data = localStorage.getItem("appState");
    if (data) appState = JSON.parse(data);
}

// === ADDED: Simple trip log persistence (optional) ===
function saveTripLog() {
    try {
        localStorage.setItem("tripLog", JSON.stringify(appState.tripLog || []));
    } catch (e) {
        console.warn("Failed to save trip log:", e);
    }
}

function loadTripLog() {
    try {
        const data = localStorage.getItem("tripLog");
        if (data) {
            appState.tripLog = JSON.parse(data);
        } else {
            appState.tripLog = [];
        }
    } catch (e) {
        console.warn("Failed to load trip log:", e);
        appState.tripLog = [];
    }
}
// === END ADDED: Simple trip log persistence ===



// === ADDED: Route and customer persistence for live system ===

// Storage keys (separate from appState to avoid interfering with existing logic)
const ROUTES_DATA_KEY = "routesData";
const CUSTOMERS_DATA_KEY = "customersData";
const SELECTED_ROUTE_KEY = "selectedRoute";
const DRIVER_STATE_KEY = "driverState";
const DELIVERY_EDITS_KEY = "deliveryEdits";

/**
 * Get all routes data from localStorage.
 * Structure:
 * {
 *   "week1/route1.csv": {
 *      name: "route1.csv",
 *      folder: "week1",
 *      path: "week1/route1.csv",
 *      customers: [ { ...rowObject }, ... ]
 *   },
 *   ...
 * }
 */
function getRoutesData() {
    try {
        const raw = localStorage.getItem(ROUTES_DATA_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        console.warn("Failed to parse routesData:", e);
        return {};
    }
}

/**
 * Save routes data back to localStorage.
 */
function saveRoutesData(routesData) {
    try {
        localStorage.setItem(ROUTES_DATA_KEY, JSON.stringify(routesData || {}));
    } catch (e) {
        console.warn("Failed to save routesData:", e);
    }
}

/**
 * Upsert a single route into routesData.
 * routeKey is typically "folder/file.csv" (e.g., "week1/route1.csv").
 * routeObj: { name, folder, path, customers: [...] }
 */
function upsertRoute(routeKey, routeObj) {
    const routesData = getRoutesData();
    routesData[routeKey] = routeObj;
    saveRoutesData(routesData);
}

/**
 * Get a list of route keys and metadata for dropdowns.
 * Returns array: [ { key, name, folder, path }, ... ]
 */
function getRouteList() {
    const routesData = getRoutesData();
    const list = [];
    for (var key in routesData) {
        if (!routesData.hasOwnProperty(key)) continue;
        var r = routesData[key];
        list.push({
            key: key,
            name: r && r.name ? r.name : key,
            folder: r && r.folder ? r.folder : "",
            path: r && r.path ? r.path : key
        });
    }
    return list;
}

/**
 * Selected route helpers.
 */
function saveSelectedRoute(routeKey) {
    try {
        localStorage.setItem(SELECTED_ROUTE_KEY, routeKey || "");
    } catch (e) {
        console.warn("Failed to save selectedRoute:", e);
    }
}

function getSelectedRoute() {
    try {
        return localStorage.getItem(SELECTED_ROUTE_KEY) || "";
    } catch (e) {
        console.warn("Failed to load selectedRoute:", e);
        return "";
    }
}

/**
 * Customers data structure:
 * {
 *   "routeKey::index": {
 *      id: "routeKey::index",
 *      routeKey: "week1/route1.csv",
 *      active: true,
 *      data: { ...rowObject }
 *   },
 *   ...
 * }
 */
function getCustomersData() {
    try {
        const raw = localStorage.getItem(CUSTOMERS_DATA_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        console.warn("Failed to parse customersData:", e);
        return {};
    }
}

function saveCustomersData(customersData) {
    try {
        localStorage.setItem(CUSTOMERS_DATA_KEY, JSON.stringify(customersData || {}));
    } catch (e) {
        console.warn("Failed to save customersData:", e);
    }
}

/**
 * Upsert a single customer.
 * customerObj must contain at least { id }.
 */
function upsertCustomer(customerObj) {
    if (!customerObj || !customerObj.id) return;
    var customers = getCustomersData();
    customers[customerObj.id] = customerObj;
    saveCustomersData(customers);
}

/**
 * Delete a customer by id.
 */
function deleteCustomerById(customerId) {
    var customers = getCustomersData();
    if (customers.hasOwnProperty(customerId)) {
        delete customers[customerId];
        saveCustomersData(customers);
    }
}

/**
 * Toggle active flag for a customer.
 */
function toggleCustomerActive(customerId) {
    var customers = getCustomersData();
    if (customers.hasOwnProperty(customerId)) {
        var c = customers[customerId];
        c.active = !c.active;
        customers[customerId] = c;
        saveCustomersData(customers);
    }
}

/**
 * Driver state helpers (for live system).
 */
function getDriverState() {
    try {
        const raw = localStorage.getItem(DRIVER_STATE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        console.warn("Failed to load driverState:", e);
        return {};
    }
}

function saveDriverState(driverState) {
    try {
        localStorage.setItem(DRIVER_STATE_KEY, JSON.stringify(driverState || {}));
    } catch (e) {
        console.warn("Failed to save driverState:", e);
    }
}

/**
 * Delivery edits per stop (email, fee, travel, instructions, products, signature, etc).
 * Structure:
 * {
 *   "stopId": { ...fields... },
 *   ...
 * }
 */
function getDeliveryEdits() {
    try {
        const raw = localStorage.getItem(DELIVERY_EDITS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
        console.warn("Failed to load deliveryEdits:", e);
        return {};
    }
}

function saveDeliveryEdits(edits) {
    try {
        localStorage.setItem(DELIVERY_EDITS_KEY, JSON.stringify(edits || {}));
    } catch (e) {
        console.warn("Failed to save deliveryEdits:", e);
    }
}

/**
 * Upsert a single delivery edit by stopId.
 */
function upsertDeliveryEdit(stopId, editObj) {
    if (!stopId) return;
    var edits = getDeliveryEdits();
    edits[stopId] = editObj || {};
    saveDeliveryEdits(edits);
}

// === END ADDED: Route and customer persistence for live system ===
