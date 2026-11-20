// ============================================================
// LOGIN (ZL FMS)
//
// The dashboard (js/app.js) only starts after a correct login ID
// and password. A sign-in is remembered on this device for
// SESSION_HOURS; "Log out" in the footer ends it.
//
// This is a login screen on a public website (GitHub Pages):
// it keeps casual visitors out of the dashboard, but the fund
// data it shows comes from the public VGrat FMS site.
// ============================================================

import { USERS } from "./auth-users.js";

const SESSION_KEY = "vgrat-fms-login";
const SESSION_HOURS = 12;

const gate = document.getElementById("auth-gate");
const form = document.getElementById("auth-form");
const idInput = document.getElementById("auth-id");
const passwordInput = document.getElementById("auth-password");
const errorBox = document.getElementById("auth-error");
const submit = document.getElementById("auth-submit");
const app = document.getElementById("app");

const fromBase64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));

async function hashPassword(password, saltB64, iterations) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt: fromBase64(saltB64), iterations },
        key,
        256
    );
    return new Uint8Array(bits);
}

function sameBytes(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
    return diff === 0;
}

function readSession() {
    try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
        if (session && USERS[session.user] && session.until > Date.now()) {
            return session;
        }
        localStorage.removeItem(SESSION_KEY);
    } catch {
        /* storage unavailable: sign in every visit */
    }
    return null;
}

function saveSession(user) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ user, until: Date.now() + SESSION_HOURS * 3600 * 1000 }));
    } catch {
        /* storage unavailable */
    }
}

function logOut() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch {
        /* storage unavailable */
    }
    // Back to the plain address: no ?query, no #view
    window.location.replace(window.location.origin + window.location.pathname);
}

// Never keep anything after "?" in the address bar (an old failed sign-in
// could have put the login ID and password there)
if (window.location.search) {
    history.replaceState(null, "", window.location.pathname + window.location.hash);
}

let started = false;

async function startDashboard(user) {
    if (started) return;
    started = true;

    gate.hidden = true;
    app.style.display = "";
    document.documentElement.dataset.user = user;

    document.getElementById("auth-logout")?.addEventListener("click", logOut);

    // Style buttons first, so they never wait for the data to load
    import("./style-toggle.js").catch(error => console.error("Style picker failed to load.", error));
    await import("./app.js");
    await Promise.allSettled([import("./changelog.js"), import("./user-guide.js")]);
}

function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
}

form.addEventListener("submit", async event => {
    event.preventDefault();
    showError("");

    const user = idInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!user || !password) {
        showError("Enter your login ID and password.");
        return;
    }

    submit.disabled = true;
    submit.textContent = "Signing in…";

    try {
        const account = USERS[user];
        // Hash even for an unknown ID, so both cases take the same time
        const hash = await hashPassword(password, account?.salt ?? "AAAAAAAAAAAAAAAAAAAAAA==", account?.iterations ?? 210000);

        if (account && sameBytes(hash, fromBase64(account.hash))) {
            passwordInput.value = "";
            saveSession(user);
            await startDashboard(user);
            return;
        }

        showError("Wrong login ID or password.");
        passwordInput.select();
    } catch (error) {
        console.error("VGrat FMS login failed.", error);
        showError("Sign-in isn't available in this browser. Use a current version of Chrome, Edge, Safari or Firefox.");
    } finally {
        submit.disabled = false;
        submit.textContent = "Sign in";
    }
});

const session = readSession();

if (session) {
    startDashboard(session.user);
} else {
    gate.hidden = false;
    idInput.focus();
}
