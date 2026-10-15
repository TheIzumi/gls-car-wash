/* =====================================================
   GLS CAR WASH MANAGEMENT SYSTEM
   Authentication, Password Recovery and Services
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
let servicesLoading = false;

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
   3. PAGE ELEMENTS
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

const dashboard =
    document.getElementById("dashboard");

const authStatus =
    document.getElementById("auth-status");

const logoutButton =
    document.getElementById("logout-button");


/* Services management elements */

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
   4. DATE AND YEAR
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


/* =====================================================
   5. LOGIN AND RESET MESSAGES
===================================================== */

function setLoginMessage(
    message,
    type = "error"
) {
    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.className = "login-message";

    if (type === "success") {
        loginMessage.classList.add("success");
    } else if (type === "info") {
        loginMessage.classList.add("info");
    }
}


function setPasswordResetMessage(
    message,
    type = "error"
) {
    if (!passwordResetMessage) return;

    passwordResetMessage.textContent = message;
    passwordResetMessage.className = "login-message";

    if (type === "success") {
        passwordResetMessage.classList.add("success");
    } else if (type === "info") {
        passwordResetMessage.classList.add("info");
    }
}


function setServiceFormMessage(
    message,
    type = "error"
) {
    if (!serviceFormMessage) return;

    serviceFormMessage.textContent = message;
    serviceFormMessage.className = "service-form-message";

    if (type === "success") {
        serviceFormMessage.classList.add("success");
    } else if (type === "info") {
        serviceFormMessage.classList.add("info");
    }
}


/* =====================================================
   6. SHOW LOGIN SCREEN
===================================================== */

function showLoginScreen(
    message = "",
    type = "error"
) {
    currentProfile = null;

    if (loginScreen) {
        loginScreen.hidden = false;
    }

    if (passwordResetScreen) {
        passwordResetScreen.hidden = true;
    }

    if (dashboard) {
        dashboard.hidden = true;
    }

    if (servicesManagementSection) {
        servicesManagementSection.hidden = true;
    }

    if (manageServicesAction) {
        manageServicesAction.hidden = true;
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
   7. PASSWORD RESET SCREEN
===================================================== */

function showPasswordResetScreen() {
    passwordRecoveryMode = true;
    currentProfile = null;

    if (loginScreen) {
        loginScreen.hidden = true;
    }

    if (dashboard) {
        dashboard.hidden = true;
    }

    if (passwordResetScreen) {
        passwordResetScreen.hidden = false;
    }

    if (authStatus) {
        authStatus.textContent = "Reset Password";
    }

    if (logoutButton) {
        logoutButton.hidden = true;
    }

    if (newPasswordInput) {
        newPasswordInput.value = "";
    }

    if (confirmNewPasswordInput) {
        confirmNewPasswordInput.value = "";
    }

    setPasswordResetMessage(
        "Enter your new password below.",
        "info"
    );

    if (newPasswordInput) {
        newPasswordInput.focus();
    }
}


/* =====================================================
   8. SHOW AUTHORIZED DASHBOARD
===================================================== */

function showDashboard(profile) {
    currentProfile = profile;
    passwordRecoveryMode = false;

    if (loginScreen) {
        loginScreen.hidden = true;
    }

    if (passwordResetScreen) {
        passwordResetScreen.hidden = true;
    }

    if (dashboard) {
        dashboard.hidden = false;
    }

    /*
     * The services-management button is visible only
     * to an Admin. Database RLS remains authoritative.
     */

    if (manageServicesAction) {
        manageServicesAction.hidden =
            profile.role !== "admin";
    }

    if (servicesManagementSection) {
        servicesManagementSection.hidden = true;
    }

    if (authStatus) {
        const name = profile.full_name || "GLS User";

        const role =
            profile.role === "admin"
                ? "Admin"
                : "Staff";

        authStatus.textContent = `${name} · ${role}`;
    }

    if (logoutButton) {
        logoutButton.hidden = false;
        logoutButton.disabled = false;
        logoutButton.textContent = "Log Out";
    }

    if (loginPassword) {
        loginPassword.value = "";
    }

    setLoginMessage("");

    updateCurrentDate();
    updateCurrentYear();
}


/* =====================================================
   9. VERIFY USER PROFILE
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
   10. LOGIN
===================================================== */

async function handleLogin(event) {
    event.preventDefault();

    if (
        loginInProgress ||
        !glsSupabase ||
        passwordRecoveryMode
    ) {
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
            setLoginMessage(
                "No active session was created."
            );
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
   11. PASSWORD RESET
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
        setPasswordResetMessage(
            "The passwords do not match."
        );
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
        const {
            error
        } = await glsSupabase.auth.updateUser({
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

        const {
            error: signOutError
        } = await glsSupabase.auth.signOut({
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


/* =====================================================
   12. BACK TO LOGIN
===================================================== */

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
   13. LOGOUT
===================================================== */

async function handleLogout() {
    if (!glsSupabase || logoutButton.disabled) {
        return;
    }

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

    if (loginEmail) {
        loginEmail.focus();
    }
}


/* =====================================================
   14. SERVICES MANAGEMENT — FORM HELPERS
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
   15. SERVICES MANAGEMENT — RENDER LIST
===================================================== */

function renderServices(serviceRows) {
    if (!servicesList) return;

    servicesList.replaceChildren();

    if (!serviceRows || serviceRows.length === 0) {
        const empty = document.createElement("div");

        empty.className = "services-loading";
        empty.textContent =
            "No services have been configured yet. Use the form above to add the first service.";

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
   16. SERVICES MANAGEMENT — LOAD FROM SUPABASE
===================================================== */

async function loadServices() {
    if (!glsSupabase || !currentProfile) {
        return;
    }

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
                "Unable to load services. Check your Admin access and database policies."
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
   17. SERVICES MANAGEMENT — OPEN AND CLOSE PANEL
===================================================== */

async function openServicesPanel() {
    if (!currentProfile || currentProfile.role !== "admin") {
        alert("Only an Admin can manage services and pricing.");
        return;
    }

    if (!servicesManagementSection) return;

    servicesManagementSection.hidden = false;

    servicesManagementSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    clearServiceForm();

    await loadServices();
}


function closeServicesPanelHandler() {
    if (servicesManagementSection) {
        servicesManagementSection.hidden = true;
    }

    clearServiceForm();
}


/* =====================================================
   18. SERVICES MANAGEMENT — EDIT SERVICE
===================================================== */

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


/* =====================================================
   19. SERVICES MANAGEMENT — SAVE SERVICE
===================================================== */

async function handleServiceSave(event) {
    event.preventDefault();

    if (!glsSupabase || !currentProfile) {
        setServiceFormMessage(
            "Please sign in first."
        );
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
        setServiceFormMessage(
            "Enter a service name."
        );
        serviceNameInput.focus();
        return;
    }

    if (!vehicleType) {
        setServiceFormMessage(
            "Select a vehicle type."
        );
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
                "The service could not be saved. Confirm that you are logged in as Admin and that the database permissions allow this action."
            );

            return;
        }

        clearServiceForm();

        setServiceFormMessage(
            serviceId
                ? "Service updated successfully."
                : "Service added successfully.",
            "success"
        );

        await loadServices();

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
   20. DASHBOARD QUICK ACTIONS
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

    const messages = {
        "New Customer":
            "Customer registration is not available yet.",

        "Record Payment":
            "Payment recording is not available yet.",

        "Customer Records":
            "Customer records are not available yet.",

        "Reports":
            "Financial reports are not available yet."
    };

    alert(
        messages[feature] ||
        "This feature is not available yet."
    );
}


/* =====================================================
   21. INITIALISE APPLICATION
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
        servicesList
    ];

    if (requiredElements.some(element => !element)) {
        console.error(
            "GLS initialisation failed: one or more required HTML elements are missing."
        );

        return;
    }


    /* Verify that the Supabase library loaded. */

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {
        setLoginMessage(
            "The Supabase library could not load. Refresh the page and try again."
        );

        return;
    }


    /* Validate the Publishable Key. */

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


    /* Create the Supabase client. */

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


    /* Register authentication forms. */

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


    /* Register service management forms. */

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


    /* Handle Supabase authentication events. */

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


    /* Restore an existing session, if available. */

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
   22. START APPLICATION
===================================================== */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initialiseGLS
    );
} else {
    initialiseGLS();
}
