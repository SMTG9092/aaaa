/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * assets/js/core/supabase.js
 * ============================================================
 * Supabase Singleton Client
 * ES2023
 * Vanilla JavaScript
 * Enterprise Ready
 * ============================================================
 */

"use strict";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import APP_CONFIG from "./config.js";

/**
 * Singleton Supabase Client
 */
const supabase = createClient(
    APP_CONFIG.SUPABASE.URL,
    APP_CONFIG.SUPABASE.ANON_KEY,
    {

        auth: {

            autoRefreshToken: true,

            persistSession: true,

            detectSessionInUrl: true,

            flowType: "pkce"

        },

        realtime: {

            params: {

                eventsPerSecond: 10

            }

        },

        db: {

            schema: "public"

        },

        global: {

            headers: {

                "X-Client-Info": APP_CONFIG.APP.NAME,

                "X-App-Version": APP_CONFIG.APP.VERSION

            }

        }

    }
);

/**
 * Test Connection
 */
export async function testConnection() {

    try {

        const { error } = await supabase
            .from(APP_CONFIG.DATABASE.ROLES_TABLE)
            .select("id")
            .limit(1);

        if (error) {

            console.error("❌ Supabase:", error.message);

            return false;

        }

        console.log("✅ Supabase Connected");

        return true;

    } catch (err) {

        console.error(err);

        return false;

    }

}

/**
 * Get Current Session
 */
export async function getSession() {

    const { data } = await supabase.auth.getSession();

    return data.session;

}

/**
 * Get Current User
 */
export async function getUser() {

    const { data } = await supabase.auth.getUser();

    return data.user;

}

/**
 * Is Authenticated
 */
export async function isAuthenticated() {

    const session = await getSession();

    return session !== null;

}

/**
 * Export Singleton
 */
export default supabase;
