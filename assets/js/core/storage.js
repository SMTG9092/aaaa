/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * File : assets/js/core/storage.js
 * ============================================================
 */

"use strict";

/* ============================================================
   STORAGE MANAGER
============================================================ */

class StorageManager {

    /* ========================================================
       SAVE
    ======================================================== */

    static set(key, value, persistent = true) {

        const storage = persistent
            ? localStorage
            : sessionStorage;

        storage.setItem(

            key,

            JSON.stringify(value)

        );

    }

    /* ========================================================
       SAVE WITH EXPIRATION
    ======================================================== */

    static setWithExpiry(
        key,
        value,
        ttl,
        persistent = true
    ) {

        const storage = persistent
            ? localStorage
            : sessionStorage;

        const item = {

            value,

            expiry: Date.now() + ttl

        };

        storage.setItem(

            key,

            JSON.stringify(item)

        );

    }

    /* ========================================================
       GET
    ======================================================== */

    static get(key, persistent = true) {

        const storage = persistent
            ? localStorage
            : sessionStorage;

        const item = storage.getItem(key);

        if (!item) {

            return null;

        }

        try {

            return JSON.parse(item);

        }

        catch {

            return item;

        }

    }

    /* ========================================================
       GET WITH EXPIRY
    ======================================================== */

    static getWithExpiry(
        key,
        persistent = true
    ) {

        const storage = persistent
            ? localStorage
            : sessionStorage;

        const item = storage.getItem(key);

        if (!item) {

            return null;

        }

        try {

            const parsed = JSON.parse(item);

            if (!parsed.expiry) {

                return parsed;

            }

            if (Date.now() > parsed.expiry) {

                storage.removeItem(key);

                return null;

            }

            return parsed.value;

        }

        catch {

            return null;

        }

    }

    /* ========================================================
       EXISTS
    ======================================================== */

    static exists(
        key,
        persistent = true
    ) {

        const storage = persistent
            ? localStorage
            : sessionStorage;

        return storage.getItem(key) !== null;

    }

    /* ========================================================
       REMOVE
    ======================================================== */

    static remove(
        key,
        persistent = true
    ) {

        const storage = persistent
            ? localStorage
            : sessionStorage;

        storage.removeItem(key);

    }

    /* ========================================================
       CLEAR
    ======================================================== */

    static clear(
        persistent = true
    ) {

        const storage = persistent
            ? localStorage
            : sessionStorage;

        storage.clear();

    }

    /* ========================================================
       KEYS
    ======================================================== */

    static keys(
        persistent = true
    ) {

        const storage = persistent
            ? localStorage
            : sessionStorage;

        return Object.keys(storage);

    }

    /* ========================================================
       LENGTH
    ======================================================== */

    static length(
        persistent = true
    ) {

        const storage = persistent
            ? localStorage
            : sessionStorage;

        return storage.length;

    }

    /* ========================================================
       USER PROFILE
    ======================================================== */

    static saveProfile(profile) {

        this.set(

            "soufstock_profile",

            profile

        );

    }

    static getProfile() {

        return this.get(

            "soufstock_profile"

        );

    }

    /* ========================================================
       ROLE
    ======================================================== */

    static saveRole(role) {

        this.set(

            "soufstock_role",

            role

        );

    }

    static getRole() {

        return this.get(

            "soufstock_role"

        );

    }

    /* ========================================================
       THEME
    ======================================================== */

    static saveTheme(theme) {

        this.set(

            "soufstock_theme",

            theme

        );

    }

    static getTheme() {

        return this.get(

            "soufstock_theme"

        );

    }

    /* ========================================================
       LANGUAGE
    ======================================================== */

    static saveLanguage(lang) {

        this.set(

            "soufstock_language",

            lang

        );

    }

    static getLanguage() {

        return this.get(

            "soufstock_language"

        );

    }

}

/* ============================================================
   EXPORT
============================================================ */

export default StorageManager;
