/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * File : assets/js/core/theme.js
 * ============================================================
 */

"use strict";

const STORAGE_KEY = "soufstock_theme";
const THEMES = {
    LIGHT: "light",
    DARK: "dark",
    SYSTEM: "system"
};
const DEFAULT_THEME = THEMES.SYSTEM;

// Garder une référence à l'écouteur d'événements système pour pouvoir le détacher si nécessaire
let systemThemeListener = null;

/* ============================================================
   FONCTIONS DE GESTION DU THÈME
============================================================ */

/**
 * Récupère le thème actuellement sauvegardé par l'utilisateur
 * @returns {string} 'light', 'dark' ou 'system'
 */
export function getTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
        return savedTheme;
    }
    return DEFAULT_THEME;
}

/**
 * Détermine le thème réel appliqué (utile si le thème est configuré sur 'system')
 * @returns {string} 'light' ou 'dark'
 */
export function getCurrentAppliedTheme() {
    const theme = getTheme();
    if (theme === THEMES.SYSTEM) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches 
            ? THEMES.DARK 
            : THEMES.LIGHT;
    }
    return theme;
}

/**
 * Définit et applique un nouveau thème
 * @param {string} theme - 'light', 'dark' ou 'system'
 */
export function setTheme(theme) {
    if (!Object.values(THEMES).includes(theme)) return;

    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    
    // Dispatch d'un événement personnalisé pour permettre à d'autres composants (comme des graphiques Chart.js) de réagir au changement
    const event = new CustomEvent("themeChanged", { detail: { theme, applied: getCurrentAppliedTheme() } });
    window.dispatchEvent(event);
}

/**
 * Applique techniquement le thème sur l'élément racine HTML (documentElement)
 * @param {string} theme 
 */
function applyTheme(theme) {
    const htmlElement = document.documentElement;
    const isDarkSystem = window.matchMedia("(prefers-color-scheme: dark)");

    // Nettoyer l'écouteur système précédent s'il existe
    if (systemThemeListener) {
        isDarkSystem.removeEventListener("change", systemThemeListener);
        systemThemeListener = null;
    }

    if (theme === THEMES.DARK) {
        htmlElement.setAttribute("data-theme", THEMES.DARK);
        htmlElement.classList.add("dark-mode");
        htmlElement.classList.remove("light-mode");
    } else if (theme === THEMES.LIGHT) {
        htmlElement.setAttribute("data-theme", THEMES.LIGHT);
        htmlElement.classList.add("light-mode");
        htmlElement.classList.remove("dark-mode");
    } else {
        // Mode SYSTEM : S'adapte aux préférences de l'OS
        const applySystemPreference = (e) => {
            if (e.matches) {
                htmlElement.setAttribute("data-theme", THEMES.DARK);
                htmlElement.classList.add("dark-mode");
                htmlElement.classList.remove("light-mode");
            } else {
                htmlElement.setAttribute("data-theme", THEMES.LIGHT);
                htmlElement.classList.add("light-mode");
                htmlElement.classList.remove("dark-mode");
            }
        };

        // Application initiale
        applySystemPreference(isDarkSystem);

        // Écoute active des changements de thème du système d'exploitation
        systemThemeListener = applySystemPreference;
        isDarkSystem.addEventListener("change", systemThemeListener);
    }
}

/**
 * Initialise le module de thème sur la page courante.
 * Doit être appelé le plus tôt possible (de préférence dans le <head> de votre HTML pour éviter les flashs visuels).
 */
export function initTheme() {
    const activeTheme = getTheme();
    applyTheme(activeTheme);

    // Initialisation automatique du sélecteur ou du bouton switch s'il existe dans le DOM
    const select = document.getElementById("themeSelect");
    if (select) {
        select.value = activeTheme;
        select.addEventListener("change", (e) => {
            setTheme(e.target.value);
        });
    }

    // Alternative : Gestion d'un bouton de type "toggle" unique (Clair/Sombre)
    const toggleBtn = document.getElementById("themeToggleBtn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const current = getCurrentAppliedTheme();
            setTheme(current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
        });
    }
}

// Export par défaut de l'API de gestion thématique
export default {
    init: initTheme,
    set: setTheme,
    get: getTheme,
    getApplied: getCurrentAppliedTheme,
    THEMES
};
