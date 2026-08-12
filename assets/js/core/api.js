/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * File : assets/js/core/api.js
 * ============================================================
 */

"use strict";

import supabase, { getUser } from "./supabase.js";
import * as Permissions from "./permissions.js";

/**
 * ============================================================
 * Structure de réponse standardisée
 * ============================================================
 */

const apiResponse = (
    success,
    data = null,
    error = null
) => ({
    success,
    data,
    error
});

/* ============================================================
   MOTEUR DE REQUÊTES GÉNÉRIQUES (CRUD)
============================================================ */

/**
 * Effectue une requête de lecture (SELECT)
 */
async function select(
    table,
    fields = "*",
    options = {},
    requiredPermission = null
) {

    if (
        requiredPermission &&
        !Permissions.can(requiredPermission)
    ) {
        return apiResponse(
            false,
            null,
            `Accès refusé : Permission '${requiredPermission}' requise.`
        );
    }

    try {

        let query = supabase
            .from(table)
            .select(fields);

        if (options.eq) {

            Object.entries(options.eq).forEach(([key, value]) => {

                if (value !== undefined && value !== null) {

                    query = query.eq(key, value);

                }

            });

        }

        if (options.ilike) {

            Object.entries(options.ilike).forEach(([key, value]) => {

                if (value) {

                    query = query.ilike(key, `%${value}%`);

                }

            });

        }

        if (options.order) {

            query = query.order(
                options.order.col,
                {
                    ascending: options.order.asc ?? true
                }
            );

        }

        if (options.limit) {

            query = query.limit(options.limit);

        }

        const { data, error } = await query.range(0, 10000);

        if (error) throw error;

        return apiResponse(true, data);

    }

    catch (err) {

        console.error("[API SELECT]", err);

        return apiResponse(false, null, err.message);

    }

}

/**
 * INSERT
 */
async function insert(
    table,
    payload,
    requiredPermission = null
) {

    if (
        requiredPermission &&
        !Permissions.can(requiredPermission)
    ) {
        return apiResponse(
            false,
            null,
            `Accès refusé : Permission '${requiredPermission}' requise.`
        );
    }

    try {

        const { data, error } = await supabase
            .from(table)
            .insert(payload)
            .select();

        if (error) throw error;

        return apiResponse(true, data);

    }

    catch (err) {

        console.error("[API INSERT]", err);

        return apiResponse(false, null, err.message);

    }

}

/**
 * UPDATE
 */
async function update(
    table,
    id,
    payload,
    requiredPermission = null
) {

    if (
        requiredPermission &&
        !Permissions.can(requiredPermission)
    ) {
        return apiResponse(
            false,
            null,
            `Accès refusé : Permission '${requiredPermission}' requise.`
        );
    }

    try {

        const { data, error } = await supabase
            .from(table)
            .update(payload)
            .eq("id", id)
            .select();

        if (error) throw error;

        return apiResponse(true, data);

    }

    catch (err) {

        console.error("[API UPDATE]", err);

        return apiResponse(false, null, err.message);

    }

}

/**
 * DELETE
 */
async function remove(
    table,
    id,
    requiredPermission = null
) {

    if (
        requiredPermission &&
        !Permissions.can(requiredPermission)
    ) {
        return apiResponse(
            false,
            null,
            `Accès refusé : Permission '${requiredPermission}' requise.`
        );
    }

    try {

        const { data, error } = await supabase
            .from(table)
            .delete()
            .eq("id", id)
            .select();

        if (error) throw error;

        return apiResponse(true, data);

    }

    catch (err) {

        console.error("[API DELETE]", err);

        return apiResponse(false, null, err.message);

    }

}


/* ============================================================
   MÉTHODES MÉTIER ERP / WMS
============================================================ */

/**
 * État actuel du stock
 */
async function getStockStatus() {

    return await select(
        "stock",
        "*",
        {
            order: {
                col: "quantite",
                asc: true
            }
        }
    );

}

/* ============================================================
   AJOUT MOUVEMENT DE STOCK
============================================================ */

async function logStockMovement(
    itemId,
    type,
    quantity,
    reference = ""
) {

    const user = await getUser();

    const userId = user?.id ?? null;

    return await insert(
        "mouvements_stock",
        {
            item_id: itemId,
            type,
            quantity,
            reference,
            created_by: userId
        }
    );

}

/* ============================================================
   PROFILE
============================================================ */

async function getProfile(userId) {

    const { data, error } = await supabase
        .from("user_profiles")
        .select(`
            *,
            roles (
                id,
                nom,
                code
            )
        `)
        .eq("id", userId)
        .single();

    if (error) throw error;

    return data;

}

/* ============================================================
   DASHBOARD STATS
============================================================ */

async function getDashboardStats() {

    const [

        dashboard,

        commandes,

        picking,

        expeditions

    ] = await Promise.all([

        supabase
            .from("vw_dashboard")
            .select("*")
            .single(),

        supabase
            .from("commandes_excel")
            .select("*", {
                count: "exact",
                head: true
            }),

        supabase
            .from("picking")
            .select("*", {
                count: "exact",
                head: true
            }),

        supabase
            .from("expeditions")
            .select("*", {
                count: "exact",
                head: true
            })

    ]);

    if (dashboard.error) throw dashboard.error;

    return {

        stock: dashboard.data.stock_total,

        commandes: commandes.count || 0,

        picking: picking.count || 0,

        expeditions: expeditions.count || 0,

        articles: dashboard.data.total_articles,

        lignes: dashboard.data.total_lignes,

        magasins: dashboard.data.total_magasins,

        emplacements: dashboard.data.total_emplacements

    };

}

/* ============================================================
   DERNIERS MOUVEMENTS
============================================================ */

async function getLastMovements(limit = 10) {

    const { data, error } = await supabase
        .from("mouvements_stock")
        .select("*")
        .order("created_at", {
            ascending: false
        })
        .limit(limit);

    if (error) throw error;

    return data || [];

}

/* ============================================================
   IMPORT STOCK
============================================================ */

async function importStock(payload) {

    try {

        switch (payload.mode) {

            /* ==========================================
               1 - REMPLACER
            ========================================== */

            case "REMPLACER": {

                const { error: deleteError } = await supabase
                    .from("stock")
                    .delete()
                    .neq("id", 0);

                if (deleteError) throw deleteError;

                const { data, error } = await supabase
                    .from("stock")
                    .insert(payload.rows)
                    .select();

                if (error) throw error;

                return apiResponse(true, data);

            }

            /* ==========================================
               2 - MISE A JOUR
            ========================================== */

            case "UPDATE": {

                const { data, error } = await supabase
                    .from("stock")
                    .upsert(
                        payload.rows,
                        {
                            onConflict:
                                "article,lot,magasin,emplacement"
                        }
                    )
                    .select();

                if (error) throw error;

                return apiResponse(true, data);

            }

            /* ==========================================
               3 - SYNCHRONISATION
               Ajouter uniquement
            ========================================== */

            case "SYNC": {

                const rowsToInsert = [];

                for (const row of payload.rows) {

                    const { data, error } = await supabase
                        .from("stock")
                        .select("id")
                        .eq("article", row.article)
                        .eq("lot", row.lot)
                        .eq("magasin", row.magasin)
                        .eq("emplacement", row.emplacement)
                        .limit(1);

                    if (error) throw error;

                    if (!data || data.length === 0) {

                        rowsToInsert.push(row);

                    }

                }

                if (rowsToInsert.length === 0) {

                    return apiResponse(true, []);

                }

                const { data, error } = await supabase
                    .from("stock")
                    .insert(rowsToInsert)
                    .select();

                if (error) throw error;

                return apiResponse(true, data);

            }

            default:

                throw new Error("Mode d'import inconnu.");

        }

    }

    catch (err) {

        console.error("[IMPORT STOCK]", err);

        return apiResponse(false, null, err.message);

    }

}

/* ============================================================
   IMPORT HISTORY
============================================================ */

async function getImportHistory() {

    return await select(

        "historique_imports",

        "*",

        {

            order: {

                col: "created_at",

                asc: false

            },

            limit: 20

        }

    );

}

/* ============================================================
   STOCK
============================================================ */

async function getStock(filters = {}) {

    const pageSize = 1000;
    let from = 0;
    let allRows = [];

    while (true) {

        let query = supabase
            .from("vw_stock")
            .select("*")
            .order("designation_article", {
                ascending: true
            })
            .range(from, from + pageSize - 1);

        if (filters.article) {
            query = query.eq("article", filters.article);
        }

        if (filters.magasin) {
            query = query.eq("magasin", filters.magasin);
        }

        if (filters.lot) {
            query = query.ilike("lot", `%${filters.lot}%`);
        }

        if (filters.search) {
            query = query.or(
                `article.ilike.%${filters.search}%,
designation_article.ilike.%${filters.search}%,
lot.ilike.%${filters.search}%`
            );
        }

        const { data, error } = await query;

        if (error) throw error;

        allRows.push(...(data || []));

        if (!data || data.length < pageSize) {
            break;
        }

        from += pageSize;
    }

    return allRows;

}
/* ============================================================
   EXPORT
============================================================ */

export default {

    select,

    insert,

    update,

    delete: remove,

    getProfile,

    getDashboardStats,

    getLastMovements,

    getStockStatus,

    getStock,          // ← زيد هادي

    logStockMovement,

    importStock,

    getImportHistory

};
