// ============================================================
// LOGIN (ZL FMS)
//
// The dashboard (js/app.js) only starts after a correct login ID
// and password. A sign-in lasts until the browser is closed, and
// never longer than SESSION_HOURS; "Log out" in the footer ends it
// (in every open ZL FMS tab).
//
// The sign-in is kept in sessionStorage, which the browser clears
// when it closes. A new tab asks any open ZL FMS tab for the
// sign-in, so you only sign in again once all of them are closed.
//
// This is a login screen on a public website (GitHub Pages):
// it keeps casual visitors out of the dashboard, but the fund
// data it shows comes from the public VGrat FMS site.
// ============================================================

import { USERS } from "./auth-users.js";

const SESSION_KEY = "vgrat-fms-login";
const SESSION_HOURS = 3;
const ASK_TABS_MS = 300;

// Sign-ins used to be kept after the browser closed: remove any left over
try { localStorage.removeItem(SESSION_KEY); } catch { /* storage unavailable */ }

// Open ZL FMS tabs share the sign-in with new tabs, and log out together
let channel = null;
try { channel = new BroadcastChannel("zl-fms-login"); } catch { /* not supported */ }

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

function validSession(session) {
    return session && USERS[session.user] && session.until > Date.now() ? session : null;
}

function readSession() {
    try {
        const session = validSession(JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"));
        if (!session) sessionStorage.removeItem(SESSION_KEY);
        return session;
    } catch {
        /* storage unavailable: sign in every visit */
    }
    return null;
}

function storeSession(session) {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
        /* storage unavailable */
    }
}

function saveSession(user) {
    storeSession({ user, until: Date.now() + SESSION_HOURS * 3600 * 1000 });
}

// No sign-in in this tab: ask the other open ZL FMS tabs for theirs
function askOtherTabs() {
    if (!channel) return Promise.resolve(null);
    return new Promise(resolve => {
        const timer = setTimeout(() => { channel.removeEventListener("message", onReply); resolve(null); }, ASK_TABS_MS);
        function onReply(event) {
            const session = event.data?.type === "session" ? validSession(event.data.session) : null;
            if (!session) return;
            clearTimeout(timer);
            channel.removeEventListener("message", onReply);
            resolve(session);
        }
        channel.addEventListener("message", onReply);
        channel.postMessage({ type: "ask" });
    });
}

function backToSignIn() {
    // Back to the plain address: no ?query, no #view
    window.location.replace(window.location.origin + window.location.pathname);
}

function logOut() {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch {
        /* storage unavailable */
    }
    channel?.postMessage({ type: "logout" });
    backToSignIn();
}

channel?.addEventListener("message", event => {
    if (event.data?.type === "ask") {
        const session = readSession();
        if (session) channel.postMessage({ type: "session", session });
    } else if (event.data?.type === "logout" && readSession()) {
        try { sessionStorage.removeItem(SESSION_KEY); } catch { /* storage unavailable */ }
        backToSignIn();
    }
});

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
    app.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: "ease-out" });
    document.documentElement.dataset.user = user;

    document.getElementById("auth-logout")?.addEventListener("click", logOut);

    // Style buttons and smooth opening first, so they never wait for the data
    import("./motion.js").catch(error => console.error("Smooth opening failed to load.", error));
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

(async () => {
    let session = readSession();

    if (!session) {
        session = await askOtherTabs();
        if (session) storeSession(session);
    }

    if (session) {
        startDashboard(session.user);
    } else {
        gate.hidden = false;
        idInput.focus();
    }
})();
