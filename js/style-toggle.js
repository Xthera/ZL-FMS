// ============================================================
// STYLE (Settings > Style): Glass or Classic
// Sets <html data-style="..."> and remembers the choice in this
// browser. The page's first script already applied the saved
// choice before drawing, so this only wires up the buttons.
// ============================================================

const STORAGE_KEY = "zl-fms-style";
const STYLES = ["glass", "classic"];

function currentStyle() {
    const value = document.documentElement.dataset.style;
    return STYLES.includes(value) ? value : "glass";
}

function markButtons(style) {
    document.querySelectorAll("[data-style-option]").forEach(button => {
        const active = button.dataset.styleOption === style;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

function applyStyle(style) {
    const choice = STYLES.includes(style) ? style : "glass";
    document.documentElement.dataset.style = choice;
    try {
        localStorage.setItem(STORAGE_KEY, choice);
    } catch {
        /* storage unavailable: still applies for this visit */
    }
    markButtons(choice);
}

document.querySelectorAll("[data-style-option]").forEach(button => {
    button.addEventListener("click", () => applyStyle(button.dataset.styleOption));
});

markButtons(currentStyle());
