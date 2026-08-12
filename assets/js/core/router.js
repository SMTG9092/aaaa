/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * File : assets/js/core/router.js
 * ============================================================
 */

"use strict";

import * as Auth from "./auth.js";

// Définition des chemins absolus vers les pages clés de l'ERP
const PATHS = {
    login: "/login.html",
    dashboard: "/dashboard.html",
    unauthorized: "/unauthorized.html"
};

/**
 * ============================================================
 * CONFIGURATION ET SÉCURISATION DES ROUTES
 * ============================================================
 */
const ROUTE_RULES = {
    // Pages publiques (Accessibles sans être connecté)
    public: [
        PATHS.login,
        "/register.html",
        "/forgot-password.html"
    ],
    
    // Pages privées nécessitant une permission ou un rôle spécifique
    // Clé: URL relative, Valeur: permission requise (ou true pour connexion simple)
    protected: {
        [PATHS.dashboard]: true, // Accessible à tout utilisateur connecté
        "/inventory.html": "items.read",
        "/users.html": "users.read",
        "/settings.html": "settings.read",
        "/orders.html": "orders.read",
        "/suppliers.html": "suppliers.read"
    }
};

/* ============================================================
   MOTEUR DE NAVIGATION ET CONTRÔLE D'ACCÈS
============================================================ */

/**
 * Redirige vers une page spécifique du système
 * @param {string} path - URL ou clé PATHS vers laquelle rediriger
 */
export function navigate(path) {
    const target = PATHS[path] || path;
    if (window.location.pathname !== target) {
        window.location.href = target;
    }
}

/**
 * Redirige l'utilisateur vers la page de connexion
 */
export function login() {
    navigate("login");
}

/**
 * Redirige l'utilisateur vers le tableau de bord principal
 */
export function dashboard() {
    navigate("dashboard");
}

/**
 * Redirige l'utilisateur vers la page d'interdiction d'accès
 */
export function unauthorized() {
    navigate("unauthorized");
}

/**
 * Analyse l'URL actuelle et applique les contrôles de sécurité (Route Guards).
 * Bloque l'accès et redirige si l'utilisateur n'a pas les droits requis.
 * @returns {Promise<boolean>} True si la navigation est autorisée sur la page actuelle
 */
export async function checkAccess() {
    const currentPath = window.location.pathname;

    // 1. Si la route est publique, on autorise l'accès directement
    if (ROUTE_RULES.public.some(route => currentPath.endsWith(route))) {
        // Redirection préventive : Si l'utilisateur est déjà connecté et tente d'aller sur le login
        if (currentPath.endsWith(PATHS.login) && Auth.isLogged()) {
            dashboard();
            return false;
        }
        return true;
    }

    // 2. Si la route est protégée
    const matchedProtectedPath = Object.keys(ROUTE_RULES.protected).find(route => 
        currentPath.endsWith(route)
    );

    if (matchedProtectedPath) {
        // A. Vérification de l'authentification active
        if (!Auth.isLogged()) {
            console.warn("[Router Guard] Accès refusé : Session non active. Redirection vers login.");
            login();
            return false;
        }

        const requiredPermission = ROUTE_RULES.protected[matchedProtectedPath];

        // B. Vérification des permissions granulaires (si la route exige un droit spécifique)
        if (typeof requiredPermission === "string" && !Auth.can(requiredPermission)) {
            console.warn(`[Router Guard] Accès refusé : Permission '${requiredPermission}' manquante.`);
            unauthorized();
            return false;
        }

        return true;
    }

    // 3. Par défaut, pour les pages hors route listée, on exige une connexion simple
    if (!Auth.isLogged()) {
        login();
        return false;
    }

    return true;
}

/**
 * Initialise l'intercepteur de navigation au chargement de la page
 */
export async function initRouter() {
    // Attendre que l'état d'authentification soit complètement chargé avant de vérifier l'accès
    await Auth.init();
    await checkAccess();
}

// Export par défaut de l'interface du Router
export default {
    navigate,
    login,
    dashboard,
    unauthorized,
    checkAccess,
    init: initRouter,
    PATHS
};
