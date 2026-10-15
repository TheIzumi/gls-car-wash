/* =========================================
   GLS CAR WASH MANAGEMENT SYSTEM
   Dashboard Functions
========================================= */

// Malaysia timezone
const GLS_TIMEZONE = "Asia/Kuala_Lumpur";

// Display the current date
function updateCurrentDate() {
    const dateElement = document.getElementById("current-date");

    if (!dateElement) {
        return;
    }

    const today = new Intl.DateTimeFormat("en-GB", {
        timeZone: GLS_TIMEZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date());

    dateElement.textContent = today;
}

// Display the current year in the footer
function updateCurrentYear() {
    const yearElement = document.getElementById("current-year");

    if (!yearElement) {
        return;
    }

    yearElement.textContent = new Intl.DateTimeFormat("en", {
        timeZone: GLS_TIMEZONE,
        year: "numeric"
    }).format(new Date());
}

// Temporary messages for dashboard buttons
function showNotice(feature) {
    const messages = {
        "New Customer":
            "The New Customer feature is not ready yet. We will build the customer registration form next.",

        "Record Payment":
            "The payment recording feature is not ready yet. We will build it in a later step.",

        "Customer Records":
            "Customer records will be available after we build the customer management feature.",

        "Reports":
            "Revenue reports will be available after we build the transaction and reporting features."
    };

    const message = messages[feature];

    if (message) {
        alert(message);
    }
}

// Initialise the dashboard
function initialiseDashboard() {
    updateCurrentDate();
    updateCurrentYear();
}

// Run when the page is ready
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initialiseDashboard
    );
} else {
    initialiseDashboard();
}
