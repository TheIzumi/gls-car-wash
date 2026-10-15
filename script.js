/* =====================================================
   CAR WASH BY GLOBAL LINE SERVICES (GLS)
   Supabase Authentication and Dashboard
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


/* =====================================================
   3. PAGE ELEMENTS
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
   4. DATE AND YEAR
===================================================== */

function updateCurrentDate() {
    const element = document.getElementById("current-date");

    if (!element) return;

    element.textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: GLS_TIMEZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(new Date());
}


function updateCurrentYear() {
    const element = document.getElementById("current-year");

    if (!element) return;

    element.textContent = new Intl.DateTimeFormat("en", {
        timeZone: GLS_TIMEZONE,
        year: "numeric"
    }).format(new Date());
}


/* =====================================================
   5. LOGIN MESSAGES
===================================================== */

function setLoginMessage(message, type = "error") {
    if (!loginMessage) return;

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
   6. SHOW LOGIN SCREEN
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
        logoutButton.textContent = "Log Out";
    }

    setLoginMessage(message, type);
}


/* =====================================================
   7. SHOW AUTHENTICATED DASHBOARD
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
        const name = profile.full_name || "GLS User";
        const role = profile.role === "admin" ? "Admin" : "Staff";

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
   8. VERIFY USER PROFILE
===================================================== */

async function verifyAndDisplayUser(session) {
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
        console.error("GLS profile verification failed:", error);

        await glsSupabase.auth.signOut({ scope: "local" });

        showLoginScreen(
            "Unable to verify your profile. Please contact the administrator."
        );

        return false;
    }

    if (
        !profile ||
        profile.is_active !== true ||
        !["admin", "staff"].includes(profile.role)
    ) {
        await glsSupabase.auth.signOut({ scope: "local" });

        showLoginScreen(
            "This account has no active GLS profile. Please contact the administrator."
        );

        return false;
    }

    showDashboard(profile);

    return true;
}


/* =====================================================
   9. SIGN IN
===================================================== */

async function handleLogin(event) {
    event.preventDefault();

    if (loginInProgress || !glsSupabase) {
        return;
    }

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
        setLoginMessage("Enter your email address and password.");
        return;
    }

    loginInProgress = true;
    loginSubmit.disabled = true;
    loginSubmit.textContent = "Signing In...";

    setLoginMessage("Verifying your account...", "info");

    try {
        const {
            data,
            error
        } = await glsSupabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("GLS login failed:", error);

            setLoginMessage(
                "Sign-in failed. Check your email, password and account confirmation."
            );

            return;
        }

        if (!data.session || !data.user) {
            setLoginMessage("No active session was created.");
            return;
        }

        await verifyAndDisplayUser(data.session);

    } catch (error) {
        console.error("Unexpected GLS login error:", error);

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
   10. SIGN OUT
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
        console.error("GLS logout failed:", error);

        logoutButton.disabled = false;
        logoutButton.textContent = "Log Out";

        alert("Unable to sign out. Please try again.");
        return;
    }

    showLoginScreen();

    if (loginEmail) {
        loginEmail.focus();
    }
}


/* =====================================================
   11. DASHBOARD PLACEHOLDERS
===================================================== */

function showNotice(feature) {
    if (!currentProfile) {
        showLoginScreen(
            "Please sign in before accessing the system."
        );

        return;
    }

    const messages = {
        "New Customer":
            "The customer registration feature is not ready yet.",

        "Record Payment":
            "The payment recording feature is not ready yet.",

        "Customer Records":
            "Customer records are not available yet.",

        "Reports":
            "Financial reports are not available yet."
    };

    alert(messages[feature] || "This feature is not available yet.");
}


/* =====================================================
   12. INITIALISE APPLICATION
===================================================== */

async function initialiseGLS() {
    updateCurrentDate();
    updateCurrentYear();

    showLoginScreen();

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
        console.error("GLS: Required HTML elements are missing.");
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

    if (
        !GLS_SUPABASE_PUBLISHABLE_KEY ||
        GLS_SUPABASE_PUBLISHABLE_KEY ===
            "sb_publishable_LeQuTjkWs3U9lidfPTi4Vw_X9tWo2bk"
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

    loginForm.addEventListener("submit", handleLogin);
    logoutButton.addEventListener("click", handleLogout);

    glsSupabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
            showLoginScreen();
        }
    });

    try {
        const {
            data,
            error
        } = await glsSupabase.auth.getSession();

        if (error) {
            console.error("GLS session error:", error);

            showLoginScreen(
                "Unable to restore your session. Please sign in again."
            );

            return;
        }

        if (data.session) {
            await verifyAndDisplayUser(data.session);
        } else {
            showLoginScreen();
        }

    } catch (error) {
        console.error("GLS initialisation error:", error);

        showLoginScreen(
            "The application could not start. Refresh the page and try again."
        );
    }
}


/* =====================================================
   13. START APPLICATION
===================================================== */

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialiseGLS);
} else {
    initialiseGLS();
}
