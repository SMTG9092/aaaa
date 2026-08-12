/**
 * ============================================================
 * SMTG Enterprise ERP/WMS
 * File : assets/js/core/permissions.js
 * ============================================================
 *
 * SYSTEME DE PERMISSIONS
 *
 * 1. role_page_permissions
 *    -> contrôle l'accès aux pages
 *
 * 2. user_page_permissions
 *    -> contrôle les opérations dans chaque page
 *
 * Opérations :
 *
 *    Ajouter
 *    Modifier
 *    Supprimer
 *    Imprimer
 *    Valider
 *    Lancer
 *    enregistrer
 *
 * ============================================================
 */

"use strict";

import supabase from "./supabase.js";
import { getProfile } from "./auth.js";


/* ============================================================
   VARIABLES
   ============================================================ */

let role = null;

let currentUserId = null;

let permissions = [];

let activePagesCache = [];

let rolePagePermissions = [];

let userPagePermissions = [];

let loadPromise = null;


/* ============================================================
   NORMALISATION
   ============================================================ */

function norm(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\\/g, "/")
        .split("?")[0]
        .split("#")[0]
        .split("/")
        .pop()
        .replace(/\.html$/i, "")
        .trim();

}


/* ============================================================
   NORMALISATION ACTION
   ============================================================ */

function normalizeAction(action) {

    const value =
        String(action || "")
            .trim()
            .toLowerCase();


    const actions = {

        "ajouter":
            "Ajouter",

        "add":
            "Ajouter",

        "create":
            "Ajouter",


        "modifier":
            "Modifier",

        "edit":
            "Modifier",

        "update":
            "Modifier",


        "supprimer":
            "Supprimer",

        "delete":
            "Supprimer",

        "remove":
            "Supprimer",


        "imprimer":
            "Imprimer",

        "print":
            "Imprimer",


        "valider":
            "Valider",

        "validate":
            "Valider",


        "lancer":
            "Lancer",

        "launch":
            "Lancer",


        "enregistrer":
            "enregistrer",

        "save":
            "enregistrer"

    };


    return (
        actions[value] ||
        action
    );

}


/* ============================================================
   COMPARAISON PAGE
   ============================================================ */

function matchesPage(
    page,
    value
) {

    const normalized =
        norm(value);


    if (!normalized) {

        return false;

    }


    return (

        norm(
            page?.code
        ) === normalized

        ||

        norm(
            page?.url
        ) === normalized

        ||

        norm(
            page?.nom
        ) === normalized

    );

}


/* ============================================================
   CHARGEMENT DES PERMISSIONS
   ============================================================ */

export async function loadPermissions() {

    /*
     * Empêcher plusieurs chargements simultanés.
     */
    if (loadPromise) {

        return loadPromise;

    }


    loadPromise =
        (async () => {

            /*
             * Etat sécurisé pendant le chargement.
             */
            window.permissionsLoaded =
                false;


            permissions = [];

            activePagesCache = [];

            rolePagePermissions = [];

            userPagePermissions = [];

            role = null;

            currentUserId = null;


            try {

                /* ==================================================
                   PROFIL UTILISATEUR
                   ================================================== */

                const profile =
                    await getProfile();


                if (!profile) {

                    console.warn(
                        "Aucun profil utilisateur trouvé."
                    );


                    return [];

                }


                /*
                 * Role
                 */
                role =
                    profile.role_id;


                /*
                 * User ID
                 */
                currentUserId =
                    profile.id;


                /*
                 * Variables globales utiles au projet.
                 */
                window.currentRoleId =
                    role;


                window.currentUserId =
                    currentUserId;


                /* ==================================================
                   1. CHARGER LES PAGES ACTIVES
                   ================================================== */

                const {
                    data: pages,
                    error: pagesError
                } =
                    await supabase

                        .from("pages")

                        .select(`
                            id,
                            code,
                            url,
                            nom,
                            module,
                            ordre_affichage,
                            actif,
                            show_in_menu
                        `)

                        .eq(
                            "actif",
                            true
                        )

                        .order(
                            "ordre_affichage",
                            {
                                ascending: true
                            }
                        );


                if (pagesError) {

                    console.error(
                        "Erreur chargement pages :",
                        pagesError
                    );

                }


                activePagesCache =
                    pages || [];


                /* ==================================================
                   2. ROLE_PAGE_PERMISSIONS
                   
                   CONTROLE :
                   ACCES A LA PAGE
                   ================================================== */

                const {
                    data: roleRows,
                    error: roleError
                } =
                    await supabase

                        .from(
                            "role_page_permissions"
                        )

                        .select(`
                            id,
                            role_id,
                            page_id,
                            can_view,
                            pages (
                                id,
                                code,
                                url,
                                nom,
                                module,
                                ordre_affichage,
                                actif,
                                show_in_menu
                            )
                        `)

                        .eq(
                            "role_id",
                            role
                        );


                if (roleError) {

                    console.error(
                        "Erreur role_page_permissions :",
                        roleError
                    );

                } else {

                    rolePagePermissions =
                        roleRows || [];


                    /*
                     * Ajouter uniquement les pages
                     * autorisées.
                     */
                    rolePagePermissions

                        .filter(
                            row =>
                                row.can_view === true &&
                                row.pages &&
                                row.pages.actif !== false
                        )

                        .forEach(
                            row => {

                                const page =
                                    row.pages;


                                permissions.push({

                                    pageId:
                                        page.id,

                                    page:
                                        page.code || "",

                                    code:
                                        page.code || "",

                                    url:
                                        page.url || "",

                                    nom:
                                        page.nom || "",

                                    module:
                                        page.module || "",

                                    action:
                                        "",

                                    pageData:
                                        page,

                                    source:
                                        "role"

                                });

                            }
                        );

                }


                /* ==================================================
                   3. USER_PAGE_PERMISSIONS
                   
                   CONTROLE :
                   ACTIONS DANS LA PAGE
                   
                   Ajouter
                   Modifier
                   Supprimer
                   Imprimer
                   Valider
                   Lancer
                   enregistrer
                   ================================================== */

                const {
                    data: userRows,
                    error: userError
                } =
                    await supabase

                        .from(
                            "user_page_permissions"
                        )

                        .select(`
                            id,
                            user_id,
                            page_id,
                            "Ajouter",
                            "Modifier",
                            "Supprimer",
                            "Imprimer",
                            "Valider",
                            "Lancer",
                            enregistrer,
                            pages (
                                id,
                                code,
                                url,
                                nom,
                                module,
                                ordre_affichage,
                                actif,
                                show_in_menu
                            )
                        `)

                        .eq(
                            "user_id",
                            currentUserId
                        );


                if (userError) {

                    console.error(
                        "Erreur user_page_permissions :",
                        userError
                    );

                } else {

                    userPagePermissions =
                        userRows || [];


                    /*
                     * Pour debug / autres modules.
                     */
                    window.currentUserPagePermissions =
                        userPagePermissions;

                }


                /* ==================================================
                   4. USER_PAGE_ACTIONS
                   
                   Ancien système conservé pour compatibilité.
                   ================================================== */

                const {
                    data: oldUserRows,
                    error: oldUserError
                } =
                    await supabase

                        .from(
                            "user_page_actions"
                        )

                        .select(`
                            autorise,
                            page_action_id,
                            page_actions (
                                id,
                                page_id,
                                action_id,
                                pages (
                                    id,
                                    code,
                                    url,
                                    module,
                                    nom,
                                    actif,
                                    show_in_menu
                                ),
                                actions (
                                    code,
                                    nom
                                )
                            )
                        `)

                        .eq(
                            "user_id",
                            currentUserId
                        )

                        .eq(
                            "autorise",
                            true
                        );


                /*
                 * Si la table n'existe pas ou n'est pas utilisée,
                 * on ne bloque pas le nouveau système.
                 */
                if (oldUserError) {

                    console.warn(
                        "user_page_actions non disponible ou non utilisé :",
                        oldUserError.message
                    );

                } else {

                    (
                        oldUserRows || []
                    ).forEach(
                        row => {

                            const pageAction =
                                row.page_actions;


                            if (
                                !pageAction ||
                                !pageAction.pages
                            ) {

                                return;

                            }


                            const page =
                                pageAction.pages;


                            const action =
                                pageAction.actions ||
                                {};


                            const pageCode =
                                page.code || "";


                            const actionCode =
                                action.code || "";


                            permissions.push({

                                pageId:
                                    page.id,

                                page:
                                    pageCode,

                                code:
                                    actionCode
                                        ? `${pageCode}.${actionCode}`
                                        : pageCode,

                                url:
                                    page.url || "",

                                nom:
                                    page.nom || "",

                                module:
                                    page.module || "",

                                action:
                                    actionCode,

                                pageData:
                                    page,

                                source:
                                    "user"

                            });

                        }
                    );

                }


                /* ==================================================
                   5. DEDUPLICATION DES PERMISSIONS DE PAGE
                   ================================================== */

                const unique =
                    new Map();


                permissions.forEach(
                    permission => {

                        const key =
                            `${permission.pageId}|${permission.action}`;


                        unique.set(
                            key,
                            permission
                        );

                    }
                );


                permissions =
                    [
                        ...unique.values()
                    ];


                /* ==================================================
                   VARIABLES GLOBALES
                   ================================================== */

                window.currentRolePagePermissions =
                    rolePagePermissions;


                window.currentUserPagePermissions =
                    userPagePermissions;


                /*
                 * Pour compatibilité.
                 */
                window.currentUserRoleId =
                    role;


                return permissions;


            } catch (error) {

                console.error(
                    "Erreur générale permissions :",
                    error
                );


                /*
                 * Sécurité :
                 * aucune permission en cas d'erreur.
                 */
                permissions = [];

                userPagePermissions = [];

                rolePagePermissions = [];


                return [];


            } finally {

                /*
                 * Chargement terminé.
                 */
                window.permissionsLoaded =
                    true;


                window.dispatchEvent(
                    new CustomEvent(
                        "permissionsLoaded"
                    )
                );


                loadPromise =
                    null;

            }

        })();


    return loadPromise;

}


/* ============================================================
   GETTERS
   ============================================================ */

export function getPermissions() {

    return permissions;

}


export function getRoleId() {

    return role;

}


export function getCurrentUserId() {

    return currentUserId;

}


export function getRolePagePermissions() {

    return rolePagePermissions;

}


export function getUserPagePermissions() {

    return userPagePermissions;

}


export function getActivePages() {

    return activePagesCache;

}


/* ============================================================
   FIND USER PAGE PERMISSION
   ============================================================ */

export function getPageActionPermissions(
    pageId
) {

    if (!pageId) {

        return null;

    }


    return userPagePermissions.find(
        permission =>
            Number(
                permission.page_id
            ) ===
            Number(pageId)
    ) || null;

}


/* ============================================================
   CAN PAGE
   ============================================================

   Source :
   role_page_permissions.can_view

   IMPORTANT :
   Aucun bypass ADMIN.
   ============================================================ */

export function canPage(
    value
) {

    if (!value) {

        return false;

    }


    const normalized =
        norm(value);


    if (!normalized) {

        return false;

    }


    return permissions.some(
        permission => {

            /*
             * Code page.
             */
            if (
                norm(
                    permission.page
                ) === normalized
            ) {

                return true;

            }


            /*
             * Code permission.
             */
            if (
                norm(
                    permission.code
                ) === normalized
            ) {

                return true;

            }


            /*
             * URL.
             */
            if (
                norm(
                    permission.url
                ) === normalized
            ) {

                return true;

            }


            /*
             * pages.code / pages.url / pages.nom
             */
            if (
                matchesPage(
                    permission.pageData,
                    value
                )
            ) {

                return true;

            }


            return false;

        }
    );

}


/* ============================================================
   RESOLVE PAGE ID
   ============================================================

   Permet :

   canAction("Ajouter", 45)

   ou :

   canAction("Ajouter", "commandes.html")

   ============================================================ */

export function resolvePageId(
    page
) {

    /*
     * ID numérique.
     */
    if (
        page !== null &&
        page !== undefined &&
        String(page).trim() !== "" &&
        !isNaN(Number(page))
    ) {

        return Number(page);

    }


    const normalized =
        norm(page);


    if (!normalized) {

        return null;

    }


    /*
     * Chercher dans pages.
     */
    const foundPage =
        activePagesCache.find(
            p =>
                matchesPage(
                    p,
                    page
                )
        );


    if (
        foundPage &&
        foundPage.id !== undefined
    ) {

        return Number(
            foundPage.id
        );

    }


    /*
     * Chercher dans permissions.
     */
    const foundPermission =
        permissions.find(
            p =>
                matchesPage(
                    p.pageData,
                    page
                )
        );


    if (
        foundPermission &&
        foundPermission.pageId !== undefined
    ) {

        return Number(
            foundPermission.pageId
        );

    }


    /*
     * Chercher directement dans
     * user_page_permissions.
     */
    const foundUserPermission =
        userPagePermissions.find(
            p => {

                return (
                    matchesPage(
                        p.pages,
                        page
                    )
                );

            }
        );


    if (
        foundUserPermission &&
        foundUserPermission.page_id !== undefined
    ) {

        return Number(
            foundUserPermission.page_id
        );

    }


    return null;

}


/* ============================================================
   CAN ACTION
   ============================================================

   Exemple :

   canAction("Ajouter", 45)

   canAction("Modifier", "commandes.html")

   canAction("Supprimer", "Modules/commandes.html")

   ============================================================ */

export function canAction(
    action,
    page
) {

    if (!action) {

        return false;

    }


    const normalizedAction =
        normalizeAction(
            action
        );


    const pageId =
        resolvePageId(
            page
        );


    if (!pageId) {

        console.warn(
            "canAction() : page introuvable :",
            page
        );


        return false;

    }


    const permission =
        getPageActionPermissions(
            pageId
        );


    /*
     * Pas de ligne dans user_page_permissions
     *
     * => aucune opération autorisée.
     */
    if (!permission) {

        return false;

    }


    /*
     * IMPORTANT :
     *
     * Les noms doivent respecter les colonnes
     * PostgreSQL.
     */
    switch (
        normalizedAction
    ) {

        case "Ajouter":

            return permission.Ajouter === true;


        case "Modifier":

            return permission.Modifier === true;


        case "Supprimer":

            return permission.Supprimer === true;


        case "Imprimer":

            return permission.Imprimer === true;


        case "Valider":

            return permission.Valider === true;


        case "Lancer":

            return permission.Lancer === true;


        case "enregistrer":

            return permission.enregistrer === true;


        default:

            return false;

    }

}


/* ============================================================
   CAN ACTION BY PAGE FILE
   ============================================================

   Version pratique :

   canActionPage(
       "Ajouter",
       "Modules/commandes.html"
   )

   ============================================================ */

export function canActionPage(
    action,
    pageFile
) {

    return canAction(
        action,
        pageFile
    );

}


/* ============================================================
   CAN ACTION BY PAGE ID
   ============================================================ */

export function canActionByPageId(
    action,
    pageId
) {

    return canAction(
        action,
        pageId
    );

}


/* ============================================================
   GET ACTION PERMISSION
   ============================================================ */

export function getActionPermission(
    action,
    page
) {

    const normalizedAction =
        normalizeAction(
            action
        );


    const pageId =
        resolvePageId(
            page
        );


    if (!pageId) {

        return false;

    }


    const permission =
        getPageActionPermissions(
            pageId
        );


    if (!permission) {

        return false;

    }


    switch (
        normalizedAction
    ) {

        case "Ajouter":

            return permission.Ajouter === true;


        case "Modifier":

            return permission.Modifier === true;


        case "Supprimer":

            return permission.Supprimer === true;


        case "Imprimer":

            return permission.Imprimer === true;


        case "Valider":

            return permission.Valider === true;


        case "Lancer":

            return permission.Lancer === true;


        case "enregistrer":

            return permission.enregistrer === true;


        default:

            return false;

    }

}


/* ============================================================
   CAN
   ============================================================ */

export function can(
    code,
    page = null
) {

    /*
     * Aucun code :
     * compatible avec l'ancien système.
     */
    if (!code) {

        return true;

    }


    const value =
        String(code)
            .trim();


    /*
     * Si c'est une action connue.
     */
    const action =
        normalizeAction(
            value
        );


    const knownActions = [

        "Ajouter",

        "Modifier",

        "Supprimer",

        "Imprimer",

        "Valider",

        "Lancer",

        "enregistrer"

    ];


    if (
        knownActions.includes(
            action
        )
    ) {

        /*
         * Une page est obligatoire pour
         * vérifier une action.
         */
        if (!page) {

            return false;

        }


        return canAction(
            action,
            page
        );

    }


    /*
     * Permission ancienne :
     *
     * page.action
     */
    const normalized =
        value
            .toLowerCase();


    if (
        normalized.includes(".")
    ) {

        const parts =
            normalized.split(".");


        const pageName =
            parts.shift();


        const actionName =
            parts.join(".");


        if (
            actionName
        ) {

            return canAction(
                actionName,
                pageName
            );

        }

    }


    /*
     * Sinon :
     * vérifier une page.
     */
    return canPage(
        value
    );

}


/* ============================================================
   CAN MODULE
   ============================================================ */

export function canModule(
    module
) {

    if (!module) {

        return false;

    }


    const normalized =
        String(module)
            .trim()
            .toLowerCase();


    return permissions.some(
        permission =>
            String(
                permission.module || ""
            )
                .trim()
                .toLowerCase() ===
            normalized
    );

}


/* ============================================================
   MENUS VISIBLES
   ============================================================ */

export function visibleMenus() {

    return permissions

        .filter(
            permission =>
                permission.pageData &&
                permission.pageData.show_in_menu !== false
        )

        .map(
            permission =>
                permission.module
        )

        .filter(Boolean);

}


/* ============================================================
   GET PAGE PERMISSIONS FOR UI
   ============================================================ */

export function getPagePermissionsForUI(
    page
) {

    const pageId =
        resolvePageId(
            page
        );


    if (!pageId) {

        return {

            Ajouter: false,

            Modifier: false,

            Supprimer: false,

            Imprimer: false,

            Valider: false,

            Lancer: false,

            enregistrer: false

        };

    }


    const permission =
        getPageActionPermissions(
            pageId
        );


    if (!permission) {

        return {

            Ajouter: false,

            Modifier: false,

            Supprimer: false,

            Imprimer: false,

            Valider: false,

            Lancer: false,

            enregistrer: false

        };

    }


    return {

        Ajouter:
            permission.Ajouter === true,

        Modifier:
            permission.Modifier === true,

        Supprimer:
            permission.Supprimer === true,

        Imprimer:
            permission.Imprimer === true,

        Valider:
            permission.Valider === true,

        Lancer:
            permission.Lancer === true,

        enregistrer:
            permission.enregistrer === true

    };

}


/* ============================================================
   INITIALISATION
   ============================================================ */

export async function initPermissions() {

    return await loadPermissions();

}


/* ============================================================
   INITIALISATION AUTOMATIQUE
   ============================================================ */

initPermissions()
    .catch(
        error => {

            console.error(
                "Erreur initialisation permissions :",
                error
            );

        }
    );