/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * File : assets/js/login.js
 * ============================================================
 */

"use strict";

import { login, isAuthenticated, loginWithGoogle } from "./core/auth.js";
import Router from "./core/router.js";
import { initPermissions } from "./core/permissions.js";
import Language from "./core/language.js";
import Theme from "./core/theme.js";

/* ============================================================
   ELEMENTS
============================================================ */
const form = document.getElementById("login-form");
const email = document.getElementById("email");
const password = document.getElementById("password");

const togglePassword = document.querySelector("#password + span");
const rememberMe = document.querySelector("input[type='checkbox']");

const message = document.getElementById("error-msg");
const loginButton = document.querySelector("#login-form button[type='submit']");
const offlineBanner = document.getElementById("offlineBanner");

/* ============================================================
   INIT
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {
    Theme.init();
    Language.init();

    const handleConnectivity = () => {
        if (offlineBanner) {
            offlineBanner.style.display = navigator.onLine ? "none" : "block";
        }
    };
    window.addEventListener("online", handleConnectivity);
    window.addEventListener("offline", handleConnectivity);
    handleConnectivity();

    if (await isAuthenticated()) {
        Router.dashboard();
        return;
    }

    const savedEmail = localStorage.getItem("soufstock_email");
    if (savedEmail && email) {
        email.value = savedEmail;
        if (rememberMe) rememberMe.checked = true;
    }
});

/* ============================================================
   AFFICHER / MASQUER LE MOT DE PASSE
============================================================ */
if (togglePassword && password) {
    togglePassword.addEventListener("click", () => {
        const isPassword = password.type === "password";
        password.type = isPassword ? "text" : "password";
        
        const icon = togglePassword.querySelector("i");
        if (icon) {
            icon.classList.toggle("fa-eye", !isPassword);
            icon.classList.toggle("fa-eye-slash", isPassword);
        }
    });
}

/* ============================================================
   SOUMISSION DU FORMULAIRE
============================================================ */
form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();

    if (!validate()) return;

    loading(true);

    try {

        const result = await login(
            email.value.trim(),
            password.value
        );

        if (!result.success) {
            showError(result.message);
            return;
        }

        // Remember Me
        if (rememberMe?.checked) {
            localStorage.setItem(
                "soufstock_email",
                email.value.trim()
            );
        } else {
            localStorage.removeItem(
                "soufstock_email"
            );
        }

        // Charger les permissions
        await initPermissions();

        showSuccess(
            Language.t("msg_success") || "Connexion réussie."
        );

        setTimeout(() => {
            Router.dashboard();
        }, 500);

    } catch (error) {

        console.error("[LOGIN ERROR]", error);

        showError(
            error?.message ||
            "Une erreur est survenue."
        );

    } finally {

        loading(false);

    }
});

/* ============================================================
   VALIDATION
============================================================ */
function validate() {
    if (!email.value.trim()) {
        showError(Language.t("err_username_required") || "Veuillez entrer votre nom d'utilisateur.");
        email.focus();
        return false;
    }

    if (!password.value) {
        showError(Language.t("err_password_required") || "Veuillez entrer votre mot de passe.");
        password.focus();
        return false;
    }

    return true;
}

/* ============================================================
   ÉTAT DE CHARGEMENT
============================================================ */
function loading(state) {
    if (!loginButton) return;
    loginButton.disabled = state;
    loginButton.innerHTML = state 
        ? `<i class="fas fa-spinner fa-spin" style="margin-right: 6px;"></i> ${Language.t("btn_connecting") || "Connexion..."}` 
        : `<i class="fas fa-arrow-right-to-bracket"></i> Se connecter`;
}

/* ============================================================
   FEEDBACK UTILISATEUR
============================================================ */
function showError(text) {
    if (!message) return;
    message.classList.remove("hidden");
    message.style.color = "#dc2626";
    message.textContent = text;
}

function showSuccess(text) {
    if (!message) return;
    message.classList.remove("hidden");
    message.style.color = "#16a34a";
    message.textContent = text;
}

function clearMessage() {
    if (!message) return;
    message.textContent = "";
    message.classList.add("hidden");
}
