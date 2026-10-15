/* =====================================================
   GLS CAR WASH MANAGEMENT SYSTEM
   Authentication and Password Recovery
===================================================== */

"use strict";

/* 1. SUPABASE CONFIGURATION */

const GLS_SUPABASE_URL =
    "https://pvbfsrelqruxluhtqddh.supabase.co";

// Replace this placeholder with your actual Supabase
// Publishable Key. Never use a Secret or service_role key.

const GLS_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LeQuTjkWs3U9lidfPTi4Vw_X9tWo2bk";


/* 2. APPLICATION STATE */

const GLS_TIMEZONE = "Asia/Kuala_Lumpur";

let glsSupabase = null;
let currentProfile = null;
let loginInProgress = false;
let passwordUpdateInProgress = false;

const initialHashParams = new URLSearchParams(
    window.location.hash.replace(/^#/, "")
);

let passwordRecoveryMode =
    initialHashParams.get("type") === "recovery" ||
    new URLSearchParams(window.location.search)
        .get("type") === "recovery";


/* 3. PAGE ELEMENTS */

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


/* 4. DATE AND YEAR */

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


/* 5. LOGIN MESSAGES */

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


/* 6. SHOW LOGIN SCREEN */

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


/* 7. SHOW PASSWORD RESET SCREEN */

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


/* 8. SHOW AUTHORIZED DASHBOARD */

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

    if (loginPassword) {
        loginPassword.value = "";
    }

    setLoginMessage("");

    updateCurrentDate();
    updateCurrentYear();
}


/* 9. VERIFY AUTHENTICATED USER PROFILE */

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
            error
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


/* 10. LOGIN */

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


/* 11. RESET PASSWORD */

async function handlePasswordReset(event) {
    event.preventDefault();

    if (
        !glsSupabase ||
        !passwordRecoveryMode ||
        passwordUpdateInProgress
    ) {
        setPasswordResetMessage(
            "Open a valid password recovery link from your email first."
        );

        return;
    }

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
                "Unable to update the password. The recovery link may have expired. Request a new link and try again."
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


/* 12. BACK TO LOGIN */

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
    showLoginScreen();
}


/* 13. LOGOUT */

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


/* 14. DASHBOARD PLACEHOLDER BUTTONS */

function showNotice(feature) {
    if (!currentProfile) {
        showLoginScreen(
            "Please sign in before accessing the system."
        );
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


/* 15. INITIALISE APPLICATION */

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
        logoutButton
    ];

    if (requiredElements.some(element => !element)) {
        console.error(
            "GLS initialisation failed: HTML elements are missing."
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

    if (
    !GLS_SUPABASE_PUBLISHABLE_KEY ||
    GLS_SUPABASE_PUBLISHABLE_KEY.trim() === "" ||
    GLS_SUPABASE_PUBLISHABLE_KEY.includes(
        "PASTE_YOUR_PUBLISHABLE_KEY_HERE"
    )
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


/* 16. START APPLICATION */

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initialiseGLS
    );
} else {
    initialiseGLS();
}
