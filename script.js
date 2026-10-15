/* =====================================================
   GLS CAR WASH MANAGEMENT SYSTEM
   Authentication, Services, Customers and Payments
===================================================== */

"use strict";


/* =====================================================
   1. SUPABASE CONFIGURATION
===================================================== */

const GLS_SUPABASE_URL =
    "https://pvbfsrelqruxluhtqddh.supabase.co";

const GLS_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LeQuTjkWs3U9lidfPTi4Vw_X9tWo2bk";


/* =====================================================
   2. APPLICATION STATE
===================================================== */

const GLS_TIMEZONE = "Asia/Kuala_Lumpur";

let glsSupabase = null;
let currentProfile = null;

let loginInProgress = false;
let passwordUpdateInProgress = false;
let serviceSaveInProgress = false;
let customerSaveInProgress = false;
let paymentSaveInProgress = false;

let servicesLoading = false;
let paymentsLoading = false;

let activeServicesForVehicle = [];

const initialHashParams = new URLSearchParams(
    window.location.hash.replace(/^#/, "")
);

const initialQueryParams = new URLSearchParams(
    window.location.search
);

let passwordRecoveryMode =
    initialHashParams.get("type") === "recovery" ||
    initialQueryParams.get("type") === "recovery";


/* =====================================================
   3. PAGE ELEMENTS — LOGIN
===================================================== */

const loginScreen =
    document.getElementById("login-screen");

const loginForm =
    document.getElementById("login-form");

const loginEmail =
    document.getElementById("login-email");

const loginPassword =
    document.getElementById("login-password");

const loginMessage =
    document.getElementById("login-message");

const loginSubmit =
    document.getElementById("login-submit");


/* =====================================================
   4. PAGE ELEMENTS — PASSWORD RESET
===================================================== */

const passwordResetScreen =
    document.getElementById("password-reset-screen");

const passwordResetForm =
    document.getElementById("password-reset-form");

const newPasswordInput =
    document.getElementById("new-password");

const confirmNewPasswordInput =
    document.getElementById("confirm-new-password");

const passwordResetMessage =
    document.getElementById("password-reset-message");

const passwordResetSubmit =
    document.getElementById("password-reset-submit");

const backToLoginButton =
    document.getElementById("back-to-login");


/* =====================================================
   5. PAGE ELEMENTS — DASHBOARD
===================================================== */

const dashboard =
    document.getElementById("dashboard");

const authStatus =
    document.getElementById("auth-status");

const logoutButton =
    document.getElementById("logout-button");


/* =====================================================
   6. PAGE ELEMENTS — SERVICES
===================================================== */

const manageServicesAction =
    document.getElementById("manage-services-action");

const servicesManagementSection =
    document.getElementById("services-management-section");

const closeServicesPanel =
    document.getElementById("close-services-panel");

const serviceForm =
    document.getElementById("service-form");

const serviceIdInput =
    document.getElementById("service-id");

const serviceNameInput =
    document.getElementById("service-name");

const serviceVehicleTypeInput =
    document.getElementById("service-vehicle-type");

const servicePriceInput =
    document.getElementById("service-price");

const serviceActiveInput =
    document.getElementById("service-active");

const serviceFormHeading =
    document.getElementById("service-form-heading");

const serviceFormMessage =
    document.getElementById("service-form-message");

const serviceSaveButton =
    document.getElementById("service-save-button");

const serviceClearButton =
    document.getElementById("service-clear-button");

const servicesList =
    document.getElementById("services-list");


/* =====================================================
   7. PAGE ELEMENTS — CUSTOMER REGISTRATION
===================================================== */

const newCustomerAction =
    document.getElementById("new-customer-action");

const newCustomerSection =
    document.getElementById("new-customer-section");

const closeCustomerPanel =
    document.getElementById("close-customer-panel");

const customerForm =
    document.getElementById("customer-transaction-form");

const customerNameInput =
    document.getElementById("customer-name");

const customerPhoneInput =
    document.getElementById("customer-phone");

const customerVehicleTypeInput =
    document.getElementById("transaction-vehicle-type");

const customerServiceSelect =
    document.getElementById("transaction-service-id");

const customerPriceDisplay =
    document.getElementById("transaction-price");

const customerFormMessage =
    document.getElementById("customer-form-message");

const customerSaveButton =
    document.getElementById("customer-save-button");

const customerClearButton =
    document.getElementById("customer-clear-button");


/* =====================================================
   8. PAGE ELEMENTS — PAYMENT
===================================================== */

const paymentManagementSection =
    document.getElementById("payment-management-section");

const closePaymentPanel =
    document.getElementById("close-payment-panel");

const refreshPaymentListButton =
    document.getElementById("refresh-payment-list");

const paymentFormMessage =
    document.getElementById("payment-form-message");

const unpaidTransactionsList =
    document.getElementById("unpaid-transactions-list");


/* =====================================================
   9. DATE AND CURRENCY HELPERS
===================================================== */

function updateCurrentDate() {
    const element =
        document.getElementById("current-date");

    if (!element) return;

    element.textContent = new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone: GLS_TIMEZONE,
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(new Date());
}


function updateCurrentYear() {
    const element =
        document.getElementById("current-year");

    if (!element) return;

    element.textContent = new Intl.DateTimeFormat(
        "en",
        {
            timeZone: GLS_TIMEZONE,
            year: "numeric"
        }
    ).format(new Date());
}


function formatRM(value) {
    return new Intl.NumberFormat(
        "en-MY",
        {
            style: "currency",
            currency: "MYR"
        }
    ).format(Number(value));
}


function formatMalaysiaDateTime(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat(
        "en-MY",
        {
            timeZone: GLS_TIMEZONE,
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    ).format(date);
}


/* =====================================================
   10. STATUS MESSAGES
===================================================== */

function setLoginMessage(message, type = "error") {
    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.className = "login-message";

    if (type === "success") {
        loginMessage.classList.add("success");
    } else if (type === "info") {
        loginMessage.classList.add("info");
    }
}


function setPasswordResetMessage(message, type = "error") {
    if (!passwordResetMessage) return;

    passwordResetMessage.textContent = message;
    passwordResetMessage.className = "login-message";

    if (type === "success") {
        passwordResetMessage.classList.add("success");
    } else if (type === "info") {
        passwordResetMessage.classList.add("info");
    }
}


function setServiceFormMessage(message, type = "error") {
    if (!serviceFormMessage) return;

    serviceFormMessage.textContent = message;
    serviceFormMessage.className = "service-form-message";

    if (type === "success") {
        serviceFormMessage.classList.add("success");
    } else if (type === "info") {
        serviceFormMessage.classList.add("info");
    }
}


function setCustomerFormMessage(message, type = "error") {
    if (!customerFormMessage) return;

    customerFormMessage.textContent = message;
    customerFormMessage.className = "service-form-message";

    if (type === "success") {
        customerFormMessage.classList.add("success");
    } else if (type === "info") {
        customerFormMessage.classList.add("info");
    }
}


function setPaymentFormMessage(message, type = "error") {
    if (!paymentFormMessage) return;

    paymentFormMessage.textContent = message;
    paymentFormMessage.className = "service-form-message";

    if (type === "success") {
        paymentFormMessage.classList.add("success");
    } else if (type === "info") {
        paymentFormMessage.classList.add("info");
    }
}


/* =====================================================
   11. SHOW LOGIN SCREEN
===================================================== */

function showLoginScreen(message = "", type = "error") {
    currentProfile = null;
    activeServicesForVehicle = [];

    if (loginScreen) loginScreen.hidden = false;
    if (passwordResetScreen) passwordResetScreen.hidden = true;
    if (dashboard) dashboard.hidden = true;

    if (manageServicesAction) {
        manageServicesAction.hidden = true;
    }

    if (servicesManagementSection) {
        servicesManagementSection.hidden = true;
    }

    if (newCustomerSection) {
        newCustomerSection.hidden = true;
    }

    if (paymentManagementSection) {
        paymentManagementSection.hidden = true;
    }

    if (authStatus) {
        authStatus.textContent = "Please sign in";
    }

    if (logoutButton) {
        logoutButton.hidden = true;
        logoutButton.disabled = false;
        logoutButton.textContent = "Log Out";
    }

    setLoginMessage(message, type);
}


/* =====================================================
   12. PASSWORD RESET SCREEN
===================================================== */

function showPasswordResetScreen() {
    passwordRecoveryMode = true;
    currentProfile = null;

    if (loginScreen) loginScreen.hidden = true;
    if (dashboard) dashboard.hidden = true;

    if (passwordResetScreen) {
        passwordResetScreen.hidden = false;
    }

    if (authStatus) {
        authStatus.textContent = "Reset Password";
    }

    if (logoutButton) {
        logoutButton.hidden = true;
    }

    if (newPasswordInput) newPasswordInput.value = "";
    if (confirmNewPasswordInput) {
        confirmNewPasswordInput.value = "";
    }

    setPasswordResetMessage(
        "Enter your new password below.",
        "info"
    );
}


/* =====================================================
   13. SHOW DASHBOARD
===================================================== */

function showDashboard(profile) {
    currentProfile = profile;
    passwordRecoveryMode = false;

    if (loginScreen) loginScreen.hidden = true;
    if (passwordResetScreen) {
        passwordResetScreen.hidden = true;
    }

    if (dashboard) dashboard.hidden = false;

    if (manageServicesAction) {
        manageServicesAction.hidden =
            profile.role !== "admin";
    }

    if (servicesManagementSection) {
        servicesManagementSection.hidden = true;
    }

    if (newCustomerSection) {
        newCustomerSection.hidden = true;
    }

    if (paymentManagementSection) {
        paymentManagementSection.hidden = true;
    }

    if (authStatus) {
        const name = profile.full_name || "GLS User";

        const role =
            profile.role === "admin" ? "Admin" : "Staff";

        authStatus.textContent = `${name} · ${role}`;
    }

    if (logoutButton) {
        logoutButton.hidden = false;
        logoutButton.disabled = false;
        logoutButton.textContent = "Log Out";
    }

    if (loginPassword) loginPassword.value = "";

    setLoginMessage("");

    updateCurrentDate();
    updateCurrentYear();
}


/* =====================================================
   14. VERIFY USER PROFILE
===================================================== */

async function verifyAndDisplayUser(session) {
    if (passwordRecoveryMode) {
        showPasswordResetScreen();
        return false;
    }

    if (!session || !session.user) {
        showLoginScreen();
        return false;
    }

    const {
        data: profile,
        error
    } = await glsSupabase
        .from("profiles")
        .select("id, full_name, role, is_active")
        .eq("id", session.user.id)
        .maybeSingle();

    if (error) {
        console.error(
            "GLS profile verification failed:",
            error.message
        );

        await glsSupabase.auth.signOut({
            scope: "local"
        });

        showLoginScreen(
            "Unable to verify your GLS profile. Please contact the administrator."
        );

        return false;
    }

    if (
        !profile ||
        profile.is_active !== true ||
        !["admin", "staff"].includes(profile.role)
    ) {
        await glsSupabase.auth.signOut({
            scope: "local"
        });

        showLoginScreen(
            "This account has no active GLS profile. Please contact the administrator."
        );

        return false;
    }

    showDashboard(profile);
    return true;
}


/* =====================================================
   15. LOGIN
===================================================== */

async function handleLogin(event) {
    event.preventDefault();

    if (!glsSupabase || loginInProgress || passwordRecoveryMode) {
        return;
    }

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
        setLoginMessage(
            "Enter your email address and password."
        );
        return;
    }

    loginInProgress = true;
    loginSubmit.disabled = true;
    loginSubmit.textContent = "Signing In...";

    setLoginMessage(
        "Verifying your account...",
        "info"
    );

    try {
        const {
            data,
            error
        } = await glsSupabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error(
                "GLS login failed:",
                error.message
            );

            setLoginMessage(
                "Sign-in failed. Check your email and password, then try again."
            );

            return;
        }

        if (!data.session || !data.user) {
            setLoginMessage("No active session was created.");
            return;
        }

        await verifyAndDisplayUser(data.session);

    } catch (error) {
        console.error(
            "Unexpected GLS login error:",
            error
        );

        setLoginMessage(
            "An unexpected error occurred. Please try again."
        );

    } finally {
        loginInProgress = false;
        loginSubmit.disabled = false;
        loginSubmit.textContent = "Sign In";
    }
}


/* =====================================================
   16. RESET PASSWORD
===================================================== */

async function handlePasswordReset(event) {
    event.preventDefault();

    if (!glsSupabase || !passwordRecoveryMode) {
        setPasswordResetMessage(
            "Open a valid password recovery link from your email first."
        );
        return;
    }

    if (passwordUpdateInProgress) return;

    const password = newPasswordInput.value;
    const confirmation = confirmNewPasswordInput.value;

    if (password.length < 8) {
        setPasswordResetMessage(
            "Your password must contain at least 8 characters."
        );
        return;
    }

    if (password !== confirmation) {
        setPasswordResetMessage("The passwords do not match.");
        return;
    }

    passwordUpdateInProgress = true;
    passwordResetSubmit.disabled = true;
    passwordResetSubmit.textContent = "Updating Password...";

    setPasswordResetMessage(
        "Updating your password securely...",
        "info"
    );

    try {
        const { error } = await glsSupabase.auth.updateUser({
            password
        });

        if (error) {
            console.error(
                "GLS password update failed:",
                error.message
            );

            setPasswordResetMessage(
                "Unable to update the password. The recovery link may have expired."
            );
            return;
        }

        passwordRecoveryMode = false;

        newPasswordInput.value = "";
        confirmNewPasswordInput.value = "";

        const { error: signOutError } =
            await glsSupabase.auth.signOut({
                scope: "local"
            });

        if (signOutError) {
            console.warn(
                "GLS sign-out warning:",
                signOutError.message
            );
        }

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

        showLoginScreen(
            "Password updated successfully. Sign in with your new password.",
            "success"
        );

    } catch (error) {
        console.error(
            "Unexpected password update error:",
            error
        );

        setPasswordResetMessage(
            "An unexpected error occurred. Please try again."
        );

    } finally {
        passwordUpdateInProgress = false;
        passwordResetSubmit.disabled = false;
        passwordResetSubmit.textContent = "Update Password";
    }
}


async function handleBackToLogin() {
    if (glsSupabase) {
        const { error } = await glsSupabase.auth.signOut({
            scope: "local"
        });

        if (error) {
            console.warn(
                "GLS sign-out warning:",
                error.message
            );
        }
    }

    passwordRecoveryMode = false;

    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );

    showLoginScreen();
}


/* =====================================================
   17. LOGOUT
===================================================== */

async function handleLogout() {
    if (!glsSupabase || logoutButton.disabled) return;

    logoutButton.disabled = true;
    logoutButton.textContent = "Signing Out...";

    const { error } = await glsSupabase.auth.signOut({
        scope: "local"
    });

    if (error) {
        console.error(
            "GLS logout failed:",
            error.message
        );

        logoutButton.disabled = false;
        logoutButton.textContent = "Log Out";

        alert("Unable to sign out. Please try again.");
        return;
    }

    passwordRecoveryMode = false;
    showLoginScreen();
}


/* =====================================================
   18. SERVICES — FORM HELPERS
===================================================== */

function clearServiceForm() {
    if (!serviceForm) return;

    serviceForm.reset();

    serviceIdInput.value = "";
    serviceActiveInput.checked = true;

    serviceFormHeading.textContent = "Add New Service";
    serviceSaveButton.textContent = "Save Service";

    setServiceFormMessage("");
}


function setServiceFormBusy(isBusy) {
    serviceSaveButton.disabled = isBusy;
    serviceClearButton.disabled = isBusy;

    serviceSaveButton.textContent = isBusy
        ? "Saving..."
        : (
            serviceIdInput.value
                ? "Update Service"
                : "Save Service"
        );
}


/* =====================================================
   19. SERVICES — RENDER LIST
===================================================== */

function renderServices(serviceRows) {
    if (!servicesList) return;

    servicesList.replaceChildren();

    if (!serviceRows || serviceRows.length === 0) {
        const empty = document.createElement("div");

        empty.className = "services-loading";
        empty.textContent =
            "No services have been configured yet. Use the form above to add a service.";

        servicesList.appendChild(empty);
        return;
    }

    serviceRows.forEach((service) => {
        const card = document.createElement("article");
        card.className = "service-item";

        const information = document.createElement("div");
        information.className = "service-item-information";

        const title = document.createElement("h4");
        title.className = "service-item-name";
        title.textContent = service.name;

        const vehicle = document.createElement("p");
        vehicle.className = "service-item-vehicle";
        vehicle.textContent = service.vehicle_type;

        const price = document.createElement("p");
        price.className = "service-item-price";
        price.textContent = formatRM(service.price);

        const status = document.createElement("span");

        status.className = service.is_active
            ? "service-status service-status-active"
            : "service-status service-status-inactive";

        status.textContent = service.is_active
            ? "Active"
            : "Inactive";

        information.appendChild(title);
        information.appendChild(vehicle);
        information.appendChild(price);
        information.appendChild(status);

        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.className = "secondary-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editService(service);
        });

        card.appendChild(information);
        card.appendChild(editButton);

        servicesList.appendChild(card);
    });
}


/* =====================================================
   20. SERVICES — LOAD FROM SUPABASE
===================================================== */

async function loadServices() {
    if (!glsSupabase || !currentProfile) return;

    if (currentProfile.role !== "admin") {
        setServiceFormMessage(
            "Only an Admin can manage service names and prices."
        );
        return;
    }

    if (servicesLoading) return;

    servicesLoading = true;

    if (servicesList) {
        servicesList.replaceChildren();

        const loading = document.createElement("div");
        loading.className = "services-loading";
        loading.textContent = "Loading services from Supabase...";

        servicesList.appendChild(loading);
    }

    try {
        const {
            data,
            error
        } = await glsSupabase
            .from("services")
            .select(
                "id, name, vehicle_type, price, is_active, created_at, updated_at"
            )
            .order("name", { ascending: true });

        if (error) {
            console.error(
                "GLS service loading failed:",
                error.message
            );

            renderServices([]);

            setServiceFormMessage(
                "Unable to load services. Check Admin access and database policies."
            );

            return;
        }

        renderServices(data || []);

        setServiceFormMessage(
            `${(data || []).length} service(s) loaded.`,
            "success"
        );

    } catch (error) {
        console.error(
            "Unexpected GLS service loading error:",
            error
        );

        renderServices([]);

        setServiceFormMessage(
            "An unexpected error occurred while loading services."
        );

    } finally {
        servicesLoading = false;
    }
}


/* =====================================================
   21. SERVICES — OPEN/CLOSE/EDIT/SAVE
===================================================== */

async function openServicesPanel() {
    if (!currentProfile || currentProfile.role !== "admin") {
        alert("Only an Admin can manage services and pricing.");
        return;
    }

    servicesManagementSection.hidden = false;

    if (newCustomerSection) {
        newCustomerSection.hidden = true;
    }

    if (paymentManagementSection) {
        paymentManagementSection.hidden = true;
    }

    servicesManagementSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    clearServiceForm();

    await loadServices();
}


function closeServicesPanelHandler() {
    servicesManagementSection.hidden = true;
    clearServiceForm();
}


function editService(service) {
    if (!currentProfile || currentProfile.role !== "admin") {
        alert("Only an Admin can edit services.");
        return;
    }

    serviceIdInput.value = service.id;
    serviceNameInput.value = service.name;
    serviceVehicleTypeInput.value = service.vehicle_type;
    servicePriceInput.value = Number(service.price).toFixed(2);
    serviceActiveInput.checked = service.is_active;

    serviceFormHeading.textContent = "Edit Service";
    serviceSaveButton.textContent = "Update Service";

    setServiceFormMessage(
        "Edit the details and save your changes.",
        "info"
    );

    serviceForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    serviceNameInput.focus();
}


async function handleServiceSave(event) {
    event.preventDefault();

    if (!glsSupabase || !currentProfile) {
        setServiceFormMessage("Please sign in first.");
        return;
    }

    if (currentProfile.role !== "admin") {
        setServiceFormMessage(
            "Only an Admin can add or change services."
        );
        return;
    }

    if (serviceSaveInProgress) return;

    const name = serviceNameInput.value.trim();
    const vehicleType = serviceVehicleTypeInput.value;
    const price = Number(servicePriceInput.value);
    const isActive = serviceActiveInput.checked;
    const serviceId = serviceIdInput.value.trim();

    if (!name) {
        setServiceFormMessage("Enter a service name.");
        serviceNameInput.focus();
        return;
    }

    if (!vehicleType) {
        setServiceFormMessage("Select a vehicle type.");
        serviceVehicleTypeInput.focus();
        return;
    }

    if (
        !Number.isFinite(price) ||
        price <= 0 ||
        price > 9999999.99
    ) {
        setServiceFormMessage(
            "Enter a valid price greater than RM 0.00."
        );
        servicePriceInput.focus();
        return;
    }

    const serviceData = {
        name,
        vehicle_type: vehicleType,
        price: Number(price.toFixed(2)),
        is_active: isActive
    };

    serviceSaveInProgress = true;
    setServiceFormBusy(true);

    setServiceFormMessage(
        "Saving service to the database...",
        "info"
    );

    try {
        let result;

        if (serviceId) {
            result = await glsSupabase
                .from("services")
                .update(serviceData)
                .eq("id", serviceId)
                .select(
                    "id, name, vehicle_type, price, is_active"
                )
                .single();
        } else {
            result = await glsSupabase
                .from("services")
                .insert(serviceData)
                .select(
                    "id, name, vehicle_type, price, is_active"
                )
                .single();
        }

        if (result.error) {
            console.error(
                "GLS service save failed:",
                result.error.message
            );

            setServiceFormMessage(
                "The service could not be saved. Check Admin access and database permissions."
            );

            return;
        }

        clearServiceForm();

        await loadServices();

        setServiceFormMessage(
            serviceId
                ? "Service updated successfully."
                : "Service added successfully.",
            "success"
        );

    } catch (error) {
        console.error(
            "Unexpected GLS service save error:",
            error
        );

        setServiceFormMessage(
            "An unexpected error occurred. Please try again."
        );

    } finally {
        serviceSaveInProgress = false;
        setServiceFormBusy(false);
    }
}


/* =====================================================
   22. CUSTOMER — FORM HELPERS
===================================================== */

function resetCustomerServiceOptions(
    placeholder = "Select vehicle type first"
) {
    if (!customerServiceSelect) return;

    activeServicesForVehicle = [];

    customerServiceSelect.replaceChildren();

    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;

    customerServiceSelect.appendChild(option);
    customerServiceSelect.disabled = true;

    if (customerPriceDisplay) {
        customerPriceDisplay.textContent = formatRM(0);
    }
}


function clearCustomerForm() {
    if (!customerForm) return;

    customerForm.reset();

    resetCustomerServiceOptions();

    setCustomerFormMessage("");
}


function setCustomerFormBusy(isBusy) {
    customerSaveButton.disabled = isBusy;
    customerClearButton.disabled = isBusy;

    customerSaveButton.textContent = isBusy
        ? "Saving Transaction..."
        : "Save Customer & Transaction";
}


/* =====================================================
   23. CUSTOMER — LOAD ACTIVE SERVICES
===================================================== */

async function loadCustomerServicesForVehicle() {
    if (!glsSupabase || !currentProfile) return;

    const vehicleType = customerVehicleTypeInput.value;

    resetCustomerServiceOptions(
        vehicleType
            ? "Loading available services..."
            : "Select vehicle type first"
    );

    setCustomerFormMessage("");

    if (!vehicleType) return;

    try {
        const {
            data,
            error
        } = await glsSupabase
            .from("services")
            .select("id, name, vehicle_type, price")
            .eq("is_active", true)
            .eq("vehicle_type", vehicleType)
            .order("name", { ascending: true });

        if (error) {
            console.error(
                "GLS customer service loading failed:",
                error.message
            );

            resetCustomerServiceOptions(
                "Unable to load services"
            );

            setCustomerFormMessage(
                "Unable to load active services. Please try again."
            );

            return;
        }

        activeServicesForVehicle = data || [];

        customerServiceSelect.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent =
            activeServicesForVehicle.length > 0
                ? "Select a car wash service"
                : "No active services for this vehicle";

        customerServiceSelect.appendChild(placeholder);

        activeServicesForVehicle.forEach((service) => {
            const option = document.createElement("option");

            option.value = service.id;

            option.textContent =
                `${service.name} — ${formatRM(service.price)}`;

            customerServiceSelect.appendChild(option);
        });

        customerServiceSelect.disabled =
            activeServicesForVehicle.length === 0;

        if (customerPriceDisplay) {
            customerPriceDisplay.textContent = formatRM(0);
        }

        if (activeServicesForVehicle.length === 0) {
            setCustomerFormMessage(
                "No active services for this vehicle. Ask the Admin to activate or add a service.",
                "info"
            );
        }

    } catch (error) {
        console.error(
            "Unexpected customer service loading error:",
            error
        );

        resetCustomerServiceOptions(
            "Unable to load services"
        );

        setCustomerFormMessage(
            "An unexpected error occurred while loading services."
        );
    }
}


function updateSelectedCustomerServicePrice() {
    const serviceId = customerServiceSelect.value;

    const service = activeServicesForVehicle.find(
        item => item.id === serviceId
    );

    customerPriceDisplay.textContent =
        service ? formatRM(service.price) : formatRM(0);
}


/* =====================================================
   24. CUSTOMER — OPEN/CLOSE/SAVE
===================================================== */

function openCustomerPanel() {
    if (!currentProfile) {
        showLoginScreen(
            "Please sign in before accessing the system."
        );
        return;
    }

    newCustomerSection.hidden = false;

    if (servicesManagementSection) {
        servicesManagementSection.hidden = true;
    }

    if (paymentManagementSection) {
        paymentManagementSection.hidden = true;
    }

    clearCustomerForm();

    newCustomerSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    customerNameInput.focus();
}


function closeCustomerPanelHandler() {
    newCustomerSection.hidden = true;
    clearCustomerForm();
}


async function handleCustomerSave(event) {
    event.preventDefault();

    if (!glsSupabase || !currentProfile) {
        setCustomerFormMessage("Please sign in first.");
        return;
    }

    if (customerSaveInProgress) return;

    const customerName = customerNameInput.value.trim();
    const customerPhone = customerPhoneInput.value.trim();
    const vehicleType = customerVehicleTypeInput.value;
    const serviceId = customerServiceSelect.value;

    const selectedService = activeServicesForVehicle.find(
        item => item.id === serviceId
    );

    if (!vehicleType) {
        setCustomerFormMessage("Select the vehicle type.");
        customerVehicleTypeInput.focus();
        return;
    }

    if (!serviceId || !selectedService) {
        setCustomerFormMessage(
            "Select an active service for this vehicle."
        );
        customerServiceSelect.focus();
        return;
    }

    const transactionData = {
        customer_name: customerName || null,
        customer_phone: customerPhone || null,

        vehicle_type: selectedService.vehicle_type,
        service_id: selectedService.id,
        service_name_snapshot: selectedService.name,

        amount: Number(selectedService.price),

        payment_status: "unpaid",
        payment_method: null,
        payment_received_by: null,
        paid_at: null,

        created_by: currentProfile.id
    };

    customerSaveInProgress = true;
    setCustomerFormBusy(true);

    setCustomerFormMessage(
        "Saving the customer and transaction...",
        "info"
    );

    try {
        const {
            data,
            error
        } = await glsSupabase
            .from("transactions")
            .insert(transactionData)
            .select("id, receipt_no, created_at, amount")
            .single();

        if (error) {
            console.error(
                "GLS transaction save failed:",
                error.message
            );

            setCustomerFormMessage(
                "The transaction could not be saved. Check your account, service selection and database permissions."
            );

            return;
        }

        clearCustomerForm();

        setCustomerFormMessage(
            `Transaction saved successfully. Receipt #${data.receipt_no}. Payment is still unpaid.`,
            "success"
        );

    } catch (error) {
        console.error(
            "Unexpected customer transaction error:",
            error
        );

        setCustomerFormMessage(
            "An unexpected error occurred. Please try again."
        );

    } finally {
        customerSaveInProgress = false;
        setCustomerFormBusy(false);
    }
}


/* =====================================================
   25. PAYMENT — RENDER UNPAID TRANSACTIONS
===================================================== */

function isTestTransaction(transaction) {
    const serviceName =
        String(transaction.service_name_snapshot || "").toLowerCase();

    const customerName =
        String(transaction.customer_name || "").toLowerCase();

    return (
        serviceName.includes("test") ||
        serviceName.includes("jangan guna") ||
        customerName.includes("test") ||
        customerName.includes("jangan guna")
    );
}


function createPaymentDetail(label, value) {
    const paragraph = document.createElement("p");

    const strong = document.createElement("strong");
    strong.textContent = `${label}: `;

    const span = document.createElement("span");
    span.textContent = value;

    paragraph.appendChild(strong);
    paragraph.appendChild(span);

    return paragraph;
}


function renderUnpaidTransactions(rows) {
    if (!unpaidTransactionsList) return;

    unpaidTransactionsList.replaceChildren();

    if (!rows || rows.length === 0) {
        const empty = document.createElement("div");

        empty.className = "services-loading";
        empty.textContent =
            "No unpaid transactions found.";

        unpaidTransactionsList.appendChild(empty);
        return;
    }

    rows.forEach((transaction) => {
        const card = document.createElement("article");
        card.className = "unpaid-transaction-card";

        const heading = document.createElement("div");
        heading.className = "unpaid-transaction-heading";

        const title = document.createElement("h3");
        title.textContent = `Receipt #${transaction.receipt_no}`;

        const amount = document.createElement("strong");
        amount.className = "unpaid-transaction-amount";
        amount.textContent = formatRM(transaction.amount);

        heading.appendChild(title);
        heading.appendChild(amount);

        const details = document.createElement("div");
        details.className = "unpaid-transaction-details";

        details.appendChild(
            createPaymentDetail(
                "Customer",
                transaction.customer_name || "Walk-in customer"
            )
        );

        details.appendChild(
            createPaymentDetail(
                "Vehicle",
                transaction.vehicle_type
            )
        );

        details.appendChild(
            createPaymentDetail(
                "Service",
                transaction.service_name_snapshot
            )
        );

        details.appendChild(
            createPaymentDetail(
                "Created",
                formatMalaysiaDateTime(transaction.created_at)
            )
        );

        card.appendChild(heading);
        card.appendChild(details);

        const testRecord = isTestTransaction(transaction);

        if (testRecord) {
            const warning = document.createElement("p");

            warning.className = "payment-test-warning";
            warning.textContent =
                "TEST RECORD — Payment disabled to prevent false revenue.";

            card.appendChild(warning);

            const blockedNote = document.createElement("p");
            blockedNote.className = "payment-test-note";
            blockedNote.textContent =
                "Keep this transaction unpaid. Do not use it as a real payment record.";

            card.appendChild(blockedNote);

        } else {
            const form = document.createElement("form");
            form.className = "payment-record-form";

            const label = document.createElement("label");
            label.textContent = "Payment Method";

            const methodSelect = document.createElement("select");
            methodSelect.required = true;
            methodSelect.setAttribute(
                "aria-label",
                `Payment method for receipt ${transaction.receipt_no}`
            );

            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "Select payment method";

            methodSelect.appendChild(placeholder);

            const paymentMethods = [
                ["cash", "Cash"],
                ["qr", "QR Payment"],
                ["other", "Other"]
            ];

            paymentMethods.forEach(([value, text]) => {
                const option = document.createElement("option");

                option.value = value;
                option.textContent = text;

                methodSelect.appendChild(option);
            });

            const submitButton = document.createElement("button");

            submitButton.type = "submit";
            submitButton.className = "primary-button";
            submitButton.textContent = "Record Payment";

            form.appendChild(label);
            form.appendChild(methodSelect);
            form.appendChild(submitButton);

            form.addEventListener("submit", async (event) => {
                event.preventDefault();

                const method = methodSelect.value;

                if (!method) {
                    setPaymentFormMessage(
                        `Select a payment method for receipt #${transaction.receipt_no}.`
                    );
                    methodSelect.focus();
                    return;
                }

                await recordTransactionPayment(
                    transaction,
                    method,
                    submitButton,
                    methodSelect
                );
            });

            card.appendChild(form);
        }

        unpaidTransactionsList.appendChild(card);
    });
}


/* =====================================================
   26. PAYMENT — LOAD UNPAID TRANSACTIONS
===================================================== */

async function loadUnpaidTransactions() {
    if (!glsSupabase || !currentProfile) return;

    if (paymentsLoading) return;

    paymentsLoading = true;

    if (refreshPaymentListButton) {
        refreshPaymentListButton.disabled = true;
        refreshPaymentListButton.textContent = "Loading...";
    }

    if (unpaidTransactionsList) {
        unpaidTransactionsList.replaceChildren();

        const loading = document.createElement("div");
        loading.className = "services-loading";
        loading.textContent = "Loading unpaid transactions...";

        unpaidTransactionsList.appendChild(loading);
    }

    setPaymentFormMessage(
        "Loading unpaid transactions from Supabase...",
        "info"
    );

    try {
        const {
            data,
            error
        } = await glsSupabase
            .from("transactions")
            .select(
                "id, receipt_no, customer_name, vehicle_type, service_name_snapshot, amount, created_at, payment_status"
            )
            .eq("payment_status", "unpaid")
            .order("created_at", { ascending: true });

        if (error) {
            console.error(
                "GLS unpaid transaction loading failed:",
                error.message
            );

            if (unpaidTransactionsList) {
                unpaidTransactionsList.replaceChildren();

                const errorMessage = document.createElement("div");
                errorMessage.className = "services-loading";
                errorMessage.textContent =
                    "Unable to load unpaid transactions. Check account access and database policies.";

                unpaidTransactionsList.appendChild(errorMessage);
            }

            setPaymentFormMessage(
                "Unable to load unpaid transactions.",
                "error"
            );

            return;
        }

        renderUnpaidTransactions(data || []);

        setPaymentFormMessage(
            `${(data || []).length} unpaid transaction(s) found.`,
            "success"
        );

    } catch (error) {
        console.error(
            "Unexpected payment loading error:",
            error
        );

        if (unpaidTransactionsList) {
            unpaidTransactionsList.replaceChildren();

            const errorMessage = document.createElement("div");
            errorMessage.className = "services-loading";
            errorMessage.textContent =
                "Unexpected error while loading transactions.";

            unpaidTransactionsList.appendChild(errorMessage);
        }

        setPaymentFormMessage(
            "An unexpected error occurred while loading transactions."
        );

    } finally {
        paymentsLoading = false;

        if (refreshPaymentListButton) {
            refreshPaymentListButton.disabled = false;
            refreshPaymentListButton.textContent = "Refresh";
        }
    }
}


/* =====================================================
   27. PAYMENT — OPEN/CLOSE PANEL
===================================================== */

async function openPaymentPanel() {
    if (!currentProfile) {
        showLoginScreen(
            "Please sign in before accessing the system."
        );
        return;
    }

    if (paymentManagementSection) {
        paymentManagementSection.hidden = false;
    }

    if (servicesManagementSection) {
        servicesManagementSection.hidden = true;
    }

    if (newCustomerSection) {
        newCustomerSection.hidden = true;
    }

    paymentManagementSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    await loadUnpaidTransactions();
}


function closePaymentPanelHandler() {
    if (paymentManagementSection) {
        paymentManagementSection.hidden = true;
    }

    setPaymentFormMessage("");
}


/* =====================================================
   28. PAYMENT — RECORD VIA SECURE DATABASE FUNCTION
===================================================== */

async function recordTransactionPayment(
    transaction,
    paymentMethod,
    submitButton,
    methodSelect
) {
    if (!glsSupabase || !currentProfile) {
        setPaymentFormMessage(
            "Please sign in before recording a payment."
        );
        return;
    }

    if (paymentSaveInProgress) return;

    /*
     * Prevent test data from being marked as real income.
     * The database function is used for real payment records.
     */

    if (isTestTransaction(transaction)) {
        setPaymentFormMessage(
            "Payment is disabled for test records."
        );
        return;
    }

    if (!["cash", "qr", "other"].includes(paymentMethod)) {
        setPaymentFormMessage(
            "Choose a valid payment method."
        );
        return;
    }

    paymentSaveInProgress = true;

    submitButton.disabled = true;
    methodSelect.disabled = true;
    submitButton.textContent = "Recording...";

    setPaymentFormMessage(
        `Recording payment for receipt #${transaction.receipt_no}...`,
        "info"
    );

    try {
        /*
         * Use the SECURITY DEFINER database function.
         * The database records:
         * - logged-in payment receiver
         * - payment method
         * - paid_at timestamp
         *
         * The browser cannot choose payment_received_by.
         */

        const {
            error
        } = await glsSupabase.rpc(
            "record_payment",
            {
                p_transaction_id: transaction.id,
                p_payment_method: paymentMethod
            }
        );

        if (error) {
            console.error(
                "GLS payment recording failed:",
                error.message
            );

            setPaymentFormMessage(
                "Payment was not recorded. The transaction may already be paid, or the database rejected the operation. Refresh the list and try again if appropriate."
            );

            return;
        }

        await loadUnpaidTransactions();

        setPaymentFormMessage(
            `Payment recorded successfully for receipt #${transaction.receipt_no}.`,
            "success"
        );

    } catch (error) {
        console.error(
            "Unexpected payment recording error:",
            error
        );

        setPaymentFormMessage(
            "An unexpected error occurred. Verify the transaction status before trying again."
        );

    } finally {
        paymentSaveInProgress = false;
        submitButton.disabled = false;
        methodSelect.disabled = false;
        submitButton.textContent = "Record Payment";
    }
}


/* =====================================================
   29. DASHBOARD QUICK ACTIONS
===================================================== */

function showNotice(feature) {
    if (!currentProfile) {
        showLoginScreen(
            "Please sign in before accessing the system."
        );
        return;
    }

    if (feature === "Manage Services & Pricing") {
        openServicesPanel();
        return;
    }

    if (feature === "New Customer") {
        openCustomerPanel();
        return;
    }

    if (feature === "Record Payment") {
        openPaymentPanel();
        return;
    }

    const messages = {
        "Customer Records":
            "Customer record browsing is not available yet.",

        "Reports":
            "Financial reporting is not available yet."
    };

    alert(
        messages[feature] ||
        "This feature is not available yet."
    );
}


/* =====================================================
   30. INITIALISE APPLICATION
===================================================== */

async function initialiseGLS() {
    updateCurrentDate();
    updateCurrentYear();

    showLoginScreen();

    const requiredElements = [
        loginScreen,
        loginForm,
        loginEmail,
        loginPassword,
        loginMessage,
        loginSubmit,

        passwordResetScreen,
        passwordResetForm,
        newPasswordInput,
        confirmNewPasswordInput,
        passwordResetMessage,
        passwordResetSubmit,
        backToLoginButton,

        dashboard,
        authStatus,
        logoutButton,

        manageServicesAction,
        servicesManagementSection,
        closeServicesPanel,
        serviceForm,
        serviceIdInput,
        serviceNameInput,
        serviceVehicleTypeInput,
        servicePriceInput,
        serviceActiveInput,
        serviceFormHeading,
        serviceFormMessage,
        serviceSaveButton,
        serviceClearButton,
        servicesList,

        newCustomerAction,
        newCustomerSection,
        closeCustomerPanel,
        customerForm,
        customerNameInput,
        customerPhoneInput,
        customerVehicleTypeInput,
        customerServiceSelect,
        customerPriceDisplay,
        customerFormMessage,
        customerSaveButton,
        customerClearButton,

        paymentManagementSection,
        closePaymentPanel,
        refreshPaymentListButton,
        paymentFormMessage,
        unpaidTransactionsList
    ];

    if (requiredElements.some(element => !element)) {
        console.error(
            "GLS initialisation failed: one or more required HTML elements are missing."
        );
        return;
    }

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {
        setLoginMessage(
            "The Supabase library could not load. Refresh the page and try again."
        );
        return;
    }

    /*
     * Correct key validation.
     * Do not compare the key with itself.
     */

    if (
        !GLS_SUPABASE_PUBLISHABLE_KEY ||
        GLS_SUPABASE_PUBLISHABLE_KEY.trim() === "" ||
        GLS_SUPABASE_PUBLISHABLE_KEY ===
            "PASTE_YOUR_PUBLISHABLE_KEY_HERE"
    ) {
        setLoginMessage(
            "Supabase setup is incomplete. Add the Publishable Key in script.js."
        );
        return;
    }

        glsSupabase = window.supabase.createClient(
        GLS_SUPABASE_URL,
        GLS_SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        }
    );

    // Share the existing Supabase client with dashboard.js
    window.glsSupabase = glsSupabase;


    /* Authentication forms */

    loginForm.addEventListener(
        "submit",
        handleLogin
    );

    passwordResetForm.addEventListener(
        "submit",
        handlePasswordReset
    );

    backToLoginButton.addEventListener(
        "click",
        handleBackToLogin
    );

    logoutButton.addEventListener(
        "click",
        handleLogout
    );


    /* Services forms */

    serviceForm.addEventListener(
        "submit",
        handleServiceSave
    );

    serviceClearButton.addEventListener(
        "click",
        clearServiceForm
    );

    closeServicesPanel.addEventListener(
        "click",
        closeServicesPanelHandler
    );


    /* Customer forms */

    customerForm.addEventListener(
        "submit",
        handleCustomerSave
    );

    customerClearButton.addEventListener(
        "click",
        clearCustomerForm
    );

    closeCustomerPanel.addEventListener(
        "click",
        closeCustomerPanelHandler
    );

    customerVehicleTypeInput.addEventListener(
        "change",
        loadCustomerServicesForVehicle
    );

    customerServiceSelect.addEventListener(
        "change",
        updateSelectedCustomerServicePrice
    );


    /* Payment panel */

    closePaymentPanel.addEventListener(
        "click",
        closePaymentPanelHandler
    );

    refreshPaymentListButton.addEventListener(
        "click",
        loadUnpaidTransactions
    );


    /* Authentication state changes */

    glsSupabase.auth.onAuthStateChange(
        (event) => {
            if (event === "PASSWORD_RECOVERY") {
                passwordRecoveryMode = true;
                showPasswordResetScreen();

            } else if (
                event === "SIGNED_OUT" &&
                !passwordUpdateInProgress
            ) {
                showLoginScreen();
            }
        }
    );


    /* Restore session */

    try {
        const {
            data,
            error
        } = await glsSupabase.auth.getSession();

        if (error) {
            console.error(
                "GLS session restoration failed:",
                error.message
            );

            showLoginScreen(
                "Unable to restore your session. Please sign in again."
            );
            return;
        }

        if (passwordRecoveryMode) {
            showPasswordResetScreen();
            return;
        }

        if (data.session) {
            await verifyAndDisplayUser(data.session);
        } else {
            showLoginScreen();
        }

    } catch (error) {
        console.error(
            "GLS initialisation error:",
            error
        );

        showLoginScreen(
            "The application could not start. Refresh the page and try again."
        );
    }
}


/* =====================================================
   31. START APPLICATION
===================================================== */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initialiseGLS
    );
} else {
    initialiseGLS();
}
