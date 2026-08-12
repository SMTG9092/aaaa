/**
 * ============================================================
 * SMTG Enterprise ERP/WMS
 * File : assets/js/core/permissions-page.js
 * ============================================================
 *
 * Gestion des permissions des pages et des actions.
 *
 * ACCES PAGE :
 *   role_page_permissions.can_view
 *
 * ACTIONS :
 *   user_page_permissions
 *
 * Actions disponibles :
 *   Ajouter
 *   Modifier
 *   Supprimer
 *   Imprimer
 *   Valider
 *   Lancer
 *   enregistrer
 *
 * ============================================================
 */

"use strict";

import {
    canPage,
    can,
    canAction,
    getPermissions
} from "./permissions.js";


/* ============================================================
   NORMALISATION DU NOM DE PAGE
   ============================================================ */

export function getCleanPageName(pageFile) {

    return String(pageFile || "")
        .split("?")[0]
        .split("#")[0]
        .split("/")
        .pop()
        .replace(/\.html$/i, "")
        .trim();

}


/* ============================================================
   ROLE ADMIN
   ============================================================ */

function isAdmin(roleCode) {

    const role =
        String(
            roleCode ||
            window.currentUserRoleCode ||
            ""
        )
            .trim()
            .toUpperCase();

    return (
        role === "ADMIN" ||
        role === "ADMINISTRATEUR" ||
        role === "ADMINISTRATOR"
    );

}


/* ============================================================
   VERIFICATION ACCES PAGE
   ============================================================ */

export function canAccessPage(pageFile) {

    if (!pageFile) {

        return false;

    }


    /*
     * IMPORTANT :
     *
     * On attend le chargement complet des permissions.
     */
    if (
        window.permissionsLoaded !== true
    ) {

        return false;

    }


    const cleanName =
        getCleanPageName(
            pageFile
        );


    if (!cleanName) {

        return false;

    }


    /*
     * Vérification principale.
     *
     * role_page_permissions
     */
    try {

        if (
            canPage(
                cleanName
            )
        ) {

            return true;

        }

    } catch (error) {

        console.error(
            "[PERMISSIONS PAGE] Erreur canPage :",
            error
        );

    }


    /*
     * Compatibilité avec les anciennes permissions.
     */
    try {

        if (
            can(
                cleanName
            )
        ) {

            return true;

        }

    } catch (error) {

        console.error(
            "[PERMISSIONS PAGE] Erreur can :",
            error
        );

    }


    return false;

}


/* ============================================================
   VERIFICATION ACTION
   ============================================================

   Exemple :

   canPageAction(
       "produits.html",
       "Ajouter"
   );

   ============================================================ */

export function canPageAction(
    pageFile,
    action
) {

    if (!pageFile || !action) {

        return false;

    }


    if (
        window.permissionsLoaded !== true
    ) {

        return false;

    }


    const cleanPage =
        getCleanPageName(
            pageFile
        );


    if (!cleanPage) {

        return false;

    }


    /*
     * Utilisation directe de canAction()
     * provenant de permissions.js.
     */
    try {

        return !!canAction(
            action,
            cleanPage
        );

    } catch (error) {

        console.error(
            "[PERMISSIONS PAGE] Erreur canAction :",
            error
        );

        return false;

    }

}


/* ============================================================
   ALIAS
   ============================================================ */

export function canActionPage(
    pageFile,
    action
) {

    return canPageAction(
        pageFile,
        action
    );

}


/* ============================================================
   APPLICATION DES PERMISSIONS AUX BOUTONS
   ============================================================ */

export function applyPageActionPermissions(
    pageFile
) {

    if (!pageFile) {

        return;

    }


    const actions = [

        "Ajouter",

        "Modifier",

        "Supprimer",

        "Imprimer",

        "Valider",

        "Lancer",

        "enregistrer"

    ];


    /*
     * ========================================================
     * BOUTONS AVEC data-permission-action
     * ========================================================
     */

    actions.forEach(
        action => {

            const allowed =
                canPageAction(
                    pageFile,
                    action
                );


            document
                .querySelectorAll(
                    `[data-permission-action="${action}"]`
                )
                .forEach(
                    button => {

                        button.style.display =
                            allowed
                                ? ""
                                : "none";


                        button.classList.toggle(
                            "permission-hidden",
                            !allowed
                        );

                    }
                );

        }
    );


    /*
     * ========================================================
     * AJOUTER
     * ========================================================
     */

    const canAdd =
        canPageAction(
            pageFile,
            "Ajouter"
        );


    document
        .querySelectorAll(
            '[data-action="add"],' +
            '[data-action="ajouter"],' +
            '.add-action-btn,' +
            '.btn-add,' +
            '#btnNewProduct'
        )
        .forEach(
            button => {

                button.style.display =
                    canAdd
                        ? ""
                        : "none";


                button.classList.toggle(
                    "permission-hidden",
                    !canAdd
                );

            }
        );


    /*
     * ========================================================
     * MODIFIER
     * ========================================================
     */

    const canEdit =
        canPageAction(
            pageFile,
            "Modifier"
        );


    document
        .querySelectorAll(
            '[data-action="edit"],' +
            '[data-action="modifier"],' +
            '.edit-action-btn,' +
            '.btn-edit'
        )
        .forEach(
            button => {

                button.style.display =
                    canEdit
                        ? ""
                        : "none";


                button.classList.toggle(
                    "permission-hidden",
                    !canEdit
                );

            }
        );


    /*
     * ========================================================
     * SUPPRIMER
     * ========================================================
     */

    const canDelete =
        canPageAction(
            pageFile,
            "Supprimer"
        );


    document
        .querySelectorAll(
            '[data-action="delete"],' +
            '[data-action="supprimer"],' +
            '.delete-action-btn,' +
            '.btn-delete'
        )
        .forEach(
            button => {

                button.style.display =
                    canDelete
                        ? ""
                        : "none";


                button.classList.toggle(
                    "permission-hidden",
                    !canDelete
                );

            }
        );


    /*
     * ========================================================
     * IMPRIMER
     * ========================================================
     */

    const canPrint =
        canPageAction(
            pageFile,
            "Imprimer"
        );


    document
        .querySelectorAll(
            '[data-action="print"],' +
            '[data-action="imprimer"],' +
            '.print-action-btn,' +
            '.btn-print'
        )
        .forEach(
            button => {

                button.style.display =
                    canPrint
                        ? ""
                        : "none";


                button.classList.toggle(
                    "permission-hidden",
                    !canPrint
                );

            }
        );


    /*
     * ========================================================
     * VALIDER
     * ========================================================
     */

    const canValidate =
        canPageAction(
            pageFile,
            "Valider"
        );


    document
        .querySelectorAll(
            '[data-action="validate"],' +
            '[data-action="valider"],' +
            '.validate-action-btn,' +
            '.btn-validate'
        )
        .forEach(
            button => {

                button.style.display =
                    canValidate
                        ? ""
                        : "none";


                button.classList.toggle(
                    "permission-hidden",
                    !canValidate
                );

            }
        );


    /*
     * ========================================================
     * LANCER
     * ========================================================
     */

    const canLaunch =
        canPageAction(
            pageFile,
            "Lancer"
        );


    document
        .querySelectorAll(
            '[data-action="launch"],' +
            '[data-action="lancer"],' +
            '.launch-action-btn,' +
            '.btn-launch'
        )
        .forEach(
            button => {

                button.style.display =
                    canLaunch
                        ? ""
                        : "none";


                button.classList.toggle(
                    "permission-hidden",
                    !canLaunch
                );

            }
        );


    /*
     * ========================================================
     * ENREGISTRER
     * ========================================================
     */

    const canSave =
        canPageAction(
            pageFile,
            "enregistrer"
        );


    document
        .querySelectorAll(
            '[data-permission-action="Enregistrer"],' +
            '[data-permission-action="enregistrer"],' +
            '[data-action="save"],' +
            '[data-action="enregistrer"],' +
            '.save-action-btn,' +
            '.btn-save'
        )
        .forEach(
            button => {

                button.style.display =
                    canSave
                        ? ""
                        : "none";


                button.classList.toggle(
                    "permission-hidden",
                    !canSave
                );

            }
        );

}


/* ============================================================
   SUPPRESSION
   ============================================================ */

export function applyDeletePermissionsUI(
    roleCode,
    pageFile
) {

    /*
     * ADMIN ne reçoit pas automatiquement les permissions
     * des pages/actions.
     *
     * Les permissions DB restent la source de vérité.
     */

    const currentPage =
        pageFile ||
        window.currentPageFile ||
        window.currentPage ||
        document.body.dataset.page ||
        "";


    if (!currentPage) {

        /*
         * Sécurité :
         * si on ne connaît pas la page,
         * on cache les boutons delete.
         */

        document
            .querySelectorAll(
                '[data-action="delete"],' +
                '[data-action="supprimer"],' +
                '.delete-action-btn,' +
                '.btn-delete'
            )
            .forEach(
                button => {

                    button.style.display =
                        "none";

                }
            );

        return;

    }


    const allowed =
        canPageAction(
            currentPage,
            "Supprimer"
        );


    document
        .querySelectorAll(
            '[data-action="delete"],' +
            '[data-action="supprimer"],' +
            '.delete-action-btn,' +
            '.btn-delete'
        )
        .forEach(
            button => {

                button.style.display =
                    allowed
                        ? ""
                        : "none";

            }
        );

}


/* ============================================================
   SIDEBAR
   ============================================================ */

export function applyPagePermissionsToSidebar() {

    const navLinks =
        document.querySelectorAll(
            ".sidebar-nav .nav-link[data-page]"
        );


    if (!navLinks.length) {

        return;

    }


    /*
     * Pendant le chargement :
     * cacher temporairement les liens.
     */

    if (
        window.permissionsLoaded !== true
    ) {

        navLinks.forEach(
            link => {

                link.style.display =
                    "none";

                link.classList.add(
                    "permission-hidden"
                );

            }
        );

        return;

    }


    navLinks.forEach(
        link => {

            const pageFile =
                link.getAttribute(
                    "data-page"
                );


            if (!pageFile) {

                return;

            }


            const allowed =
                canAccessPage(
                    pageFile
                );


            link.style.display =
                allowed
                    ? "flex"
                    : "none";


            link.classList.toggle(
                "permission-hidden",
                !allowed
            );

        }
    );

}


/* ============================================================
   APPLICATION COMPLETE
   ============================================================ */

export function applyAllPagePermissions(
    pageFile
) {

    /*
     * Sidebar
     */
    applyPagePermissionsToSidebar();


    /*
     * Actions de la page.
     */
    if (pageFile) {

        applyPageActionPermissions(
            pageFile
        );

    }

}


/* ============================================================
   REFRESH AUTOMATIQUE
   ============================================================ */

function refreshPermissionUI() {

    /*
     * Sidebar.
     */
    applyPagePermissionsToSidebar();


    /*
     * Page courante.
     */
    const currentPage =
        window.currentPageFile ||
        window.currentPage ||
        document.body.dataset.page ||
        "";


    if (currentPage) {

        applyPageActionPermissions(
            currentPage
        );

    }

}


/* ============================================================
   EVENEMENT PERMISSIONS CHARGEES
   ============================================================ */

window.addEventListener(
    "permissionsLoaded",
    () => {

        refreshPermissionUI();

    }
);


/* ============================================================
   EVENEMENT PERMISSIONS MODIFIEES
   ============================================================ */

window.addEventListener(
    "permissionsUpdated",
    () => {

        refreshPermissionUI();

    }
);


/* ============================================================
   DOM READY
   ============================================================ */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            refreshPermissionUI();

        }
    );

} else {

    refreshPermissionUI();

}


/* ============================================================
   GLOBAL
   ============================================================ */

window.SMTGPermissionsPage = {

    canAccessPage,

    canPageAction,

    canActionPage,

    applyPageActionPermissions,

    applyDeletePermissionsUI,

    applyPagePermissionsToSidebar,

    applyAllPagePermissions,

    getCleanPageName

};