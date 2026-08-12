/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * assets/js/session.js
 * ============================================================
 * Enterprise Session Manager
 * ES2023
 * ES Modules
 * Production Ready
 * ============================================================
 */

"use strict";

import APP_CONFIG from "./config.js";
import AuthManager from "./auth.js";

const SessionManager = {

/**
 * ============================================================
 * INIT
 * ============================================================
 */

async init() {

    const authenticated = await AuthManager.isAuthenticated();

    if (!authenticated) {

        this.clearLocalSession();

        return false;

    }

    await this.refreshProfile();

    return true;

},

/**
 * ============================================================
 * CREATE LOCAL SESSION
 * ============================================================
 */

createSession(profile, remember = false) {

    const duration = remember
        ? APP_CONFIG.AUTH.REMEMBER_DURATION
        : APP_CONFIG.AUTH.SESSION_DURATION;

    const session = {

        profile,

        created: Date.now(),

        expires: Date.now() + duration,

        remember

    };

    const storage = remember
        ? localStorage
        : sessionStorage;

    storage.setItem(

        APP_CONFIG.AUTH.SESSION_KEY,

        JSON.stringify(session)

    );

    window.dispatchEvent(

        new CustomEvent(

            "sessioncreated",

            {

                detail: session

            }

        )

    );

    return session;

},

/**
 * ============================================================
 * GET LOCAL SESSION
 * ============================================================
 */

getLocalSession() {

    let session = sessionStorage.getItem(
        APP_CONFIG.AUTH.SESSION_KEY
    );

    if (!session) {

        session = localStorage.getItem(
            APP_CONFIG.AUTH.SESSION_KEY
        );

    }

    if (!session) {

        return null;

    }

    try {

        return JSON.parse(session);

    }

    catch {

        this.clearLocalSession();

        return null;

    }

},

/**
 * ============================================================
 * GET PROFILE
 * ============================================================
 */

async getProfile() {

    const profile = await AuthManager.getProfile();

    if (profile) {

        return profile;

    }

    const local = this.getLocalSession();

    return local?.profile ?? null;

},

/**
 * ============================================================
 * GET USER
 * ============================================================
 */

async getUser() {

    return await AuthManager.currentUser();

},

/**
 * ============================================================
 * IS AUTHENTICATED
 * ============================================================
 */

async isAuthenticated() {

    const authenticated = await AuthManager.isAuthenticated();

    if (!authenticated) {

        this.clearLocalSession();

        return false;

    }

    const local = this.getLocalSession();

    if (!local) {

        return true;

    }

    if (
        local.expires &&
        local.expires <= Date.now()
    ) {

        this.clearLocalSession();

        await AuthManager.logout();

        window.dispatchEvent(
            new Event("sessionexpired")
        );

        return false;

    }

    return true;

},

/**
 * ============================================================
 * REFRESH PROFILE
 * ============================================================
 */

async refreshProfile() {

    const profile = await AuthManager.getProfile();

    if (!profile) {

        return null;

    }

    const session = this.getLocalSession();

    if (!session) {

        return profile;

    }

    session.profile = profile;

    const storage = session.remember
        ? localStorage
        : sessionStorage;

    storage.setItem(

        APP_CONFIG.AUTH.SESSION_KEY,

        JSON.stringify(session)

    );

    window.dispatchEvent(

        new CustomEvent(

            "profilerefreshed",

            {

                detail: profile

            }

        )

    );

    return profile;

},

/**
 * ============================================================
 * CLEAR LOCAL SESSION
 * ============================================================
 */

clearLocalSession() {

    sessionStorage.removeItem(
        APP_CONFIG.AUTH.SESSION_KEY
    );

    localStorage.removeItem(
        APP_CONFIG.AUTH.SESSION_KEY
    );

    window.dispatchEvent(
        new Event("sessioncleared")
    );

},

/**
 * ============================================================
 * LOGOUT
 * ============================================================
 */

async logout() {

    this.clearLocalSession();

    await AuthManager.logout();

    window.location.replace(
        APP_CONFIG.ROUTES.LOGIN
    );

},

/**
 * ============================================================
 * REQUIRE AUTH
 * ============================================================
 */

async requireAuth() {

    const authenticated = await this.isAuthenticated();

    if (!authenticated) {

        window.location.replace(
            APP_CONFIG.ROUTES.LOGIN
        );

        return false;

    }

    return true;

}

};

export default SessionManager;
