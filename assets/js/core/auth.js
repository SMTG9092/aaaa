/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * File : assets/js/core/auth.js
 * ============================================================
 */

"use strict";

import supabase, {
    getSession,
    getUser
} from "./supabase.js";

import APP_CONFIG from "./config.js";

/* ============================================================
   HELPERS
============================================================ */

const PROFILE_KEY = APP_CONFIG.AUTH.PROFILE_KEY;
const ROLE_KEY = "soufstock_role";

/* ============================================================
   SAVE LOCAL DATA
============================================================ */

function saveProfile(profile) {

    localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(profile)
    );

}

function saveRole(role) {

    localStorage.setItem(
        ROLE_KEY,
        JSON.stringify(role)
    );

}

function clearStorage() {

    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(ROLE_KEY);

}
/* ============================================================
   LOGIN (Email ou Username)
============================================================ */

export async function login(identifier, password) {

    try {

        let email = identifier.trim();

        /* --------------------------------------------
           Username -> Email
        -------------------------------------------- */

        if (!email.includes("@")) {

            const { data: userProfile, error } = await supabase
                .from(APP_CONFIG.DATABASE.USER_PROFILES_TABLE)
                .select("email")
                .eq("username", email)
                .maybeSingle();

            if (error) throw error;

            if (!userProfile) {

                throw new Error("Nom d'utilisateur introuvable.");

            }

            email = userProfile.email;

        }

        /* --------------------------------------------
           Login Supabase
        -------------------------------------------- */

        const {
            data,
            error
        } = await supabase.auth.signInWithPassword({

            email,
            password

        });

        if (error) throw error;

        /* --------------------------------------------
           Profile
        -------------------------------------------- */

        const {

            data: profile,
            error: profileError

        } = await supabase

            .from(APP_CONFIG.DATABASE.USER_PROFILES_TABLE)

            .select("*")

            .eq("id", data.user.id)

            .single();

        if (profileError) throw profileError;

        /* --------------------------------------------
           Role
        -------------------------------------------- */

        const {

            data: role,
            error: roleError

        } = await supabase

            .from(APP_CONFIG.DATABASE.ROLES_TABLE)

            .select("*")

            .eq("id", profile.role_id)

            .single();

        if (roleError) throw roleError;

        /* --------------------------------------------
           Save Local
        -------------------------------------------- */

        saveProfile(profile);

        saveRole(role);

        /* --------------------------------------------
           Last Login
        -------------------------------------------- */

        await updateLastLogin(data.user.id);

        return {

            success: true,

            user: data.user,

            session: data.session,

            profile,

            role

        };

    }

    catch (error) {

        console.error("[AUTH LOGIN]", error);

        return {

            success: false,

            message: error.message

        };

    }

}

/* ============================================================
   LOGIN WITH GOOGLE
============================================================ */

export async function loginWithGoogle() {

    try {

        const { data, error } = await supabase.auth.signInWithOAuth({

            provider: "google",

            options: {

                redirectTo:
                    window.location.origin +
                    "/" +
                    APP_CONFIG.ROUTES.DASHBOARD

            }

        });

        if (error) throw error;

        return {

            success: true,

            data

        };

    }

    catch (error) {

        console.error("[AUTH GOOGLE]", error);

        return {

            success: false,

            message: error.message

        };

    }

}

/* ============================================================
   LOGOUT
============================================================ */

export async function logout() {

    clearStorage();

    await supabase.auth.signOut();

}

/* ============================================================
   SESSION
============================================================ */

export async function currentSession() {

    return await getSession();

}

export async function currentUser() {

    return await getUser();

}

export async function isAuthenticated() {

    return (await getSession()) !== null;

}

/* ============================================================
   PROFILE
============================================================ */

export async function getProfile() {

    const user = await getUser();

    if (!user) return null;

    const {

        data,
        error

    } = await supabase

        .from(APP_CONFIG.DATABASE.USER_PROFILES_TABLE)

        .select("*")

        .eq("id", user.id)

        .single();

    if (error) return null;

    return data;

}

/* ============================================================
   ROLE
============================================================ */

export async function getRole() {

    const profile = await getProfile();

    if (!profile) return null;

    const {

        data,
        error

    } = await supabase

        .from(APP_CONFIG.DATABASE.ROLES_TABLE)

        .select("*")

        .eq("id", profile.role_id)

        .single();

    if (error) return null;

    return data;

}

/* ============================================================
   LAST LOGIN
============================================================ */

export async function updateLastLogin(userId) {

    await supabase

        .from(APP_CONFIG.DATABASE.USER_PROFILES_TABLE)

        .update({

            dernier_login: new Date().toISOString()

        })

        .eq("id", userId);

}

/* ============================================================
   LOCAL STORAGE
============================================================ */

export function storedProfile() {

    const profile = localStorage.getItem(PROFILE_KEY);

    return profile ? JSON.parse(profile) : null;

}

export function storedRole() {

    const role = localStorage.getItem(ROLE_KEY);

    return role ? JSON.parse(role) : null;

}

/* ============================================================
   USER HELPERS
============================================================ */

export function currentUserName() {

    const profile = storedProfile();

    if (!profile) return "";

    return (

        profile.nom_complet ||

        profile.nom ||

        profile.username ||

        profile.email ||

        ""

    );

}

export function currentUserPhoto() {

    return storedProfile()?.photo || "";

}

export async function currentUserId() {

    const user = await getUser();

    return user?.id || null;

}

/* ============================================================
   REFRESH PROFILE
============================================================ */

export async function refreshProfile() {

    const profile = await getProfile();

    if (profile) {

        saveProfile(profile);

    }

    return profile;

}

/* ============================================================
   DEFAULT EXPORT
============================================================ */

const AuthManager = {

    login,

    loginWithGoogle,

    logout,

    getSession: currentSession,

    getUser: currentUser,

    currentSession,

    currentUser,

    isAuthenticated,

    getProfile,

    getRole,

    refreshProfile,

    updateLastLogin,

    storedProfile,

    storedRole,

    currentUserName,

    currentUserPhoto,

    currentUserId

};

export default AuthManager;
