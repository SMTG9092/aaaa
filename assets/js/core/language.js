/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * File : assets/js/core/language.js
 * ============================================================
 */

"use strict";

import FR from "./lang/fr.js";
import AR from "./lang/ar.js";
import EN from "./lang/en.js";

const TRANSLATIONS = {
    fr: FR,
    ar: AR,
    en: EN
};

const STORAGE_KEY = "soufstock_lang";
const DEFAULT_LANG = "fr";

/* ============================================================
   FONCTIONS EXPORTÉES
============================================================ */

export function getCurrentLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TRANSLATIONS[saved]) {
        return saved;
    }
    const browserLang = navigator.language.split('-')[0];
    return TRANSLATIONS[browserLang] ? browserLang : DEFAULT_LANG;
}

export function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    
    localStorage.setItem(STORAGE_KEY, lang);
    applyLanguage(lang);
}

function applyLanguage(lang) {
    const dict = TRANSLATIONS[lang];
    const htmlElement = document.documentElement;

    // Configurer le sens de lecture global (RTL pour l'arabe, LTR pour fr/en)
    if (lang === "ar") {
        htmlElement.setAttribute("dir", "rtl");
        htmlElement.setAttribute("lang", "ar");
        htmlElement.classList.add("rtl-mode");
    } else {
        htmlElement.setAttribute("dir", "ltr");
        htmlElement.setAttribute("lang", lang);
        htmlElement.classList.remove("rtl-mode");
    }

    // Parcourir et traduire les balises de l'UI
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.getAttribute("data-i18n");
        if (dict[key]) {
            if (element.tagName === "INPUT") {
                element.placeholder = dict[key];
            } else {
                element.innerHTML = dict[key];
            }
        }
    });
}

export function translate(key) {
    const lang = getCurrentLanguage();
    return TRANSLATIONS[lang][key] || key;
}

export function initLanguage() {
    const activeLang = getCurrentLanguage();
    applyLanguage(activeLang);

    const select = document.getElementById("langSelect");
    if (select) {
        select.value = activeLang;
        select.addEventListener("change", (e) => {
            setLanguage(e.target.value);
        });
    }
}

export default {
    init: initLanguage,
    set: setLanguage,
    getCurrent: getCurrentLanguage,
    t: translate
};
