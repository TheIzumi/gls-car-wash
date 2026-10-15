/* =====================================================
   CAR WASH BY GLOBAL LINE SERVICES (GLS)
   Authentication and Dashboard
===================================================== */

"use strict";


/* =====================================================
   1. SUPABASE CONFIGURATION
===================================================== */

const GLS_SUPABASE_URL =
    "https://pvbfsrelqruxluhtqddh.supabase.co";

// Replace the placeholder with your Supabase Publishable Key.
// Keep the quotation marks.
// Never use a Supabase Secret Key or service_role key here.

const GLS_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LeQuTjkWs3U9lidfPTi4Vw_X9tWo2bk";


/* =====================================================
   2. MALAYSIA TIMEZONE
===================================================== */

const GLS_TIMEZONE = "Asia/Kuala_Lumpur";


/* =====================================================
   3. DOM ELEMENTS
===================================================== */

const loginScreen = document.getElementById("login-screen");

const loginForm = document.getElementById("login-form");

const loginEmail = document.getElementById("login-email");

const loginPassword = document.getElementById("login-password");

const loginMessage = document.getElementById("login-message");

const loginSubmit = document.getElementById("login-submit");

const dashboard = document.getElementById("dashboard");

const authStatus = document.getElementById("auth-status");

const logoutButton = document.getElementById("logout-button");


/* =====================================================
   4. APPLICATION STATE
===================================================== */

let glsSupabase = null;

let currentProfile = null;

let loginInProgress = false;


/* =====================================================
   5. DATE AND YEAR
===================================================== */

function updateCurrentDate() {
    const dateElement = document.getElementById("current-date");

    if (!dateElement) {
        return;
    }

    dateElement.textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: GLS_TIMEZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date());
}


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


/* =====================================================
   6. LOGIN MESSAGES
===================================================== */

function setLoginMessage(message, type = "error") {
    if (!loginMessage) {
        return;
    }

    loginMessage.textContent = message;

    loginMessage.className = "login-message";

    if (type === "success") {
        loginMessage.classList.add("success");
    }

    if (type === "info") {
        loginMessage.classList.add("info");
    }
}


/* =====================================================
   7. DISPLAY LOGIN SCREEN
===================================================== */

function showLoginScreen(message = "", type = "error") {
    currentProfile = null;

    if (loginScreen) {
        loginScreen.hidden = false;
    }

    if (dashboard) {
        dashboard.hidden = true;
    }

    if (authStatus) {
        authStatus.textContent = "Please sign in";
    }

    if (logoutButton) {
        logoutButton.hidden = true;
        logoutButton.disabled = false;
    }

    setLoginMessage(message, type);
}


/* =====================================================
   8. DISPLAY AUTHENTICATED DASHBOARD
===================================================== */

function showDashboard(profile) {
    currentProfile = profile;

    if (loginScreen) {
        loginScreen.hidden = true;
    }

    if (dashboard) {
        dashboard.hidden = false;
    }

    if (authStatus) {
        const displayName = profile.full_name || "GLS User";

        const roleName =
            profile.role === "admin" ? "Admin" : "Staff";

        authStatus.textContent =
            `${displayName} · ${roleName}`;
    }

    if (logoutButton) {
        logoutButton.hidden = false;
        logoutButton.disabled = false;
    }

    if (loginPassword) {
        loginPassword.value = "";
    }

    setLoginMessage("");

    updateCurrentDate();
    updateCurrentYear();
}


/* =====================================================
   9. SIGN OUT SAFELY
===================================================== */

async function signOutLocally() {
    if (!glsSupabase) {
        showLoginScreen();
        return;
    }

    const { error } = await glsSupabase.auth.signOut({
        scope: "local"
    });

    if (error) {
        console.error("GLS sign-out error:", error);

        alert(
            "We could not complete sign out. " +
            "Please try again."
        );

        return false;
    }

    showLoginScreen();

    if (loginEmail) {
        loginEmail.focus();
    }

    return true;
}


/* =====================================================
   10. VERIFY USER PROFILE AND ROLE
===================================================== */

async function verifyAndDisplayUser(session) {
    if (!session || !session.user) {
        showLoginScreen();
        return false;
    }

    /*
     * Read the signed-in user's profile.
     *
     * Row Level Security must permit the user to read
     * their own profile. The application does not trust
     * a role value supplied by the browser.
     */

    const {
        data: profile,
        error
    } = await glsSupabase
        .from("profiles")
        .select("id, full_name, role, is_active")
        .eq("id", session.user.id)
        .maybeSingle();


    if (error) {
        console.error("GLS profile verification error:", error);

        await glsSupabase.auth.signOut({
            scope: "local"
        });

        showLoginScreen(
            "We could not verify your GLS profile. " +
            "Please contact the administrator."
        );

        return false;
    }


    /*
     * Only active profiles with an approved role
     * may display the dashboard.
     */

    if (
        !profile ||
        profile.is_active !== true ||
        !["admin", "staff"].includes(profile.role)
    ) {
        await glsSupabase.auth.signOut({
            scope: "local"
        });

        showLoginScreen(
            "This account does not have an active GLS profile. " +
            "Please contact the administrator."
        );

        return false;
    }


    showDashboard(profile);

    return true;
}


/* =====================================================
   11. LOGIN FORM
===================================================== */

async function handleLogin(event) {
    event.preventDefault();

    if (loginInProgress) {
        return;
    }

    if (!glsSupabase) {
        setLoginMessage(
            "The login system has not been configured yet."
        );

        return;
    }

    const email = loginEmail.value.trim();

    const password = loginPassword.value;

    if (!email || !password) {
        setLoginMessage(
            "Please enter your email address and password."
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
            console.error("GLS login error:", error);

            setLoginMessage(
                "Sign-in failed. Check your email, password " +
                "and email confirmation status."
            );

            return;
        }


        if (!data.session || !data.user) {
            setLoginMessage(
                "Sign-in could not be completed. " +
                "Please check your account status."
            );

            return;
        }


        await verifyAndDisplayUser(data.session);

    } catch (error) {
        console.error("GLS unexpected login error:", error);

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
   12. DASHBOARD ACTION PLACEHOLDERS
===================================================== */

function showNotice(feature) {
    const messages = {
        "New Customer":
            "Customer registration has not been implemented yet.",

        "Record Payment":
            "Payment recording has not been implemented yet.",

        "Customer Records":
            "Customer records have not been implemented yet.",

        "Reports":
            "Financial reports have not been implemented yet."
    };

    if (!currentProfile) {
        showLoginScreen(
            "Please sign in before accessing the system."
        );

        return;
    }

    alert(
        messages[feature] ||
        "This feature is not available yet."
    );
}


/* =====================================================
   13. INITIALISE APPLICATION
===================================================== */

async function initialiseGLS() {
    updateCurrentDate();

    updateCurrentYear();

    showLoginScreen();


    // Ensure the required page elements exist.

    if (
        !loginScreen ||
        !loginForm ||
        !loginEmail ||
        !loginPassword ||
        !loginMessage ||
        !loginSubmit ||
        !dashboard ||
        !authStatus ||
        !logoutButton
    ) {
        console.error(
            "GLS initialisation failed: required HTML elements are missing."
        );

        return;
    }


    // Check the Supabase JavaScript library.

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {
        setLoginMessage(
            "The login library could not be loaded. " +
            "Refresh the page and try again."
        );

        return;
    }


    // Check that the Publishable Key has been configured.

    if (
        !GLS_SUPABASE_PUBLISHABLE_KEY ||
        GLS_SUPABASE_PUBLISHABLE_KEY ===
            "sb_publishable_LeQuTjkWs3U9lidfPTi4Vw_X9tWo2bk"
    ) {
        setLoginMessage(
            "Supabase setup is incomplete. " +
            "Add the Publishable Key in script.js."
        );

        return;
    }


    // Create the Supabase client.

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


    // Attach the login form handler.

    loginForm.addEventListener(
        "submit",
        handleLogin
    );


    // Attach the logout handler.

    logoutButton.addEventListener(
        "click",
        async function () {
            if (logoutButton.disabled) {
                return;
            }

            logoutButton.disabled = true;

            logoutButton.textContent = "Signing Out...";

            await signOutLocally();
        }
    );


    // Handle sign-out events in this browser session.

    glsSupabase.auth.onAuthStateChange(
        function (event) {
            if (event === "SIGNED_OUT") {
                showLoginScreen();
            }
        }
    );


    // Restore an existing session after a page refresh.

    try {
        const {
            data,
            error
        } = await glsSupabase.auth.getSession();


        if (error) {
            console.error(
                "GLS session restoration error:",
                error
            );

            showLoginScreen(
                "We could not restore your session. " +
                "Please sign in again."
            );

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
            "The application could not be initialised. " +
            "Please refresh the page."
        );
    }
}


/* =====================================================
   14. START APPLICATION
===================================================== */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initialiseGLS
    );
} else {
    initialiseGLS();
}
