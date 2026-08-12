/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * File : assets/js/core/db.js
 * Description : Connexion et requêtes Supabase / PostgreSQL
 * ============================================================
 */

"use strict";

// Import du client Supabase depuis CDN (ou configuration locale)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Configuration Supabase (Remplace par tes clés réelles ou variables d'environnement)
const SUPABASE_URL = "https://votre-projet.supabase.co";
const SUPABASE_ANON_KEY = "votre-cle-anon-publique";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fonction globale pour récupérer les données de la table commandes_excel
 */
export async function getCommandesExcel() {
    try {
        const { data, error } = await supabase
            .from("commandes_excel")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("[DB ERROR - getCommandesExcel]:", error.message);
        return { success: false, message: error.message };
    }
}

/**
 * Insertion des données importées depuis Excel dans PostgreSQL
 */
export async function insertCommandesBatch(rows) {
    try {
        const { data, error } = await supabase
            .from("commandes_excel")
            .insert(rows);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("[DB ERROR - insertCommandesBatch]:", error.message);
        return { success: false, message: error.message };
    }
}
