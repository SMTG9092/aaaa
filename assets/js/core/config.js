/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * assets/js/config.js
 * ============================================================
 * Enterprise Configuration
 * ES Module
 * Production Ready
 * ============================================================
 */

"use strict";

const APP_CONFIG = Object.freeze({

    /* =======================================================
       APPLICATION
    ======================================================= */

    APP: {

        NAME: "SoufStock Enterprise ERP",

        SHORT_NAME: "SoufStock",

        VERSION: "1.0.0",

        BUILD: "Enterprise",

        COMPANY: "SoufStock",

        AUTHOR: "Soufiane Yahya",

        DEBUG: false

    },

    /* =======================================================
       SUPABASE
    ======================================================= */

    SUPABASE: {

        URL: "https://uygctxutxupnidebmici.supabase.co",

        ANON_KEY: "sb_publishable_21dqMSyc533hsUcOqpQQPw_e08YdzrF"

    },

    /* =======================================================
       AUTHENTICATION
    ======================================================= */

    AUTH: {

        SESSION_KEY: "soufstock_session",

        TOKEN_KEY: "soufstock_token",

        PROFILE_KEY: "soufstock_profile",

        REMEMBER_KEY: "soufstock_remember",

        SESSION_DURATION: 8 * 60 * 60 * 1000,

        REMEMBER_DURATION: 30 * 24 * 60 * 60 * 1000,

        AUTO_LOGIN: true

    },

    /* =======================================================
       STORAGE
    ======================================================= */

    STORAGE: {

        LANGUAGE: "soufstock_language",

        THEME: "soufstock_theme",

        SETTINGS: "soufstock_settings"

    },

    /* =======================================================
       DEFAULTS
    ======================================================= */

    DEFAULTS: {

        LANGUAGE: "fr",

        THEME: "light"

    },

    /* =======================================================
       ROUTES
    ======================================================= */

    ROUTES: {

        LOGIN: "login.html",

        DASHBOARD: "dashboard.html",

        LOGOUT: "login.html"

    },

    /* =======================================================
       DATABASE
       مطابق 100% لقاعدة البيانات الحالية
    ======================================================= */

    DATABASE: {

        USER_PROFILES_TABLE: "user_profiles",

        ROLES_TABLE: "roles",

        PERMISSIONS_TABLE: "permissions",

        ROLE_PERMISSIONS_TABLE: "role_permissions",

        PAGES_TABLE: "pages",

        HISTORIQUE_IMPORTS_TABLE: "historique_imports",

        STOCK_TABLE: "stock",

        COMMANDES_TABLE: "commandes_excel",

        COMMANDES_PIECES_TABLE: "commandes_clients_pieces",

        MODIFICATIONS_TABLE: "modifications_commandes",

        COMMANDES_SUPPRIMEES_TABLE: "commandes_supprimees",

        SUIVI_COMMANDES_TABLE: "suivi_commandes_lancer",

        PICKING_TABLE: "picking",

        PICKING_DETAILS_TABLE: "picking_details",

        RESERVATIONS_TABLE: "reservations_stock",

        AB10_TABLE: "ab10_stock",

        EXPEDITIONS_TABLE: "expeditions",

        MOUVEMENTS_TABLE: "mouvements_stock",

        RETOURS_TABLE: "retours_stock"

    },

    /* =======================================================
       PROFILE FIELDS
       مطابق لجدول user_profiles
    ======================================================= */

    PROFILE: {

        ID: "id",

        ROLE_ID: "role_id",

        MATRICULE: "matricule",

        USERNAME: "username",

        EMAIL: "email",

        NOM: "nom",

        PRENOM: "prenom",

        NOM_COMPLET: "nom_complet",

        PHOTO: "photo",

        TELEPHONE: "telephone",

        SERVICE: "service",

        POSTE: "poste",

        LANGUE: "langue",

        THEME: "theme",

        DERNIER_LOGIN: "dernier_login",

        ACTIF: "actif"

    },

    /* =======================================================
       ROLE FIELDS
    ======================================================= */

    ROLE: {

        ID: "id",

        CODE: "code",

        NOM: "nom",

        DESCRIPTION: "description"

    },

    /* =======================================================
       API
    ======================================================= */

    API: {

        TIMEOUT: 15000,

        RETRIES: 3

    },

    /* =======================================================
       UI
    ======================================================= */

    UI: {

        LOADER_DELAY: 300,

        TOAST_DURATION: 4000,

        ANIMATION_DURATION: 300

    },

    /* =======================================================
       DATE
    ======================================================= */

    DATE: {

        LOCALE: "fr-FR",

        TIMEZONE: "Africa/Casablanca"

    }

});

export default APP_CONFIG;
