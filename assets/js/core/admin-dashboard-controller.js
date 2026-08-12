/**
 * ============================================================
 * SMTG - ADMIN DASHBOARD CONTROLLER
 * ============================================================
 *
 * Dashboard Administration générale
 *
 * - Nombre total utilisateurs
 * - Rôles
 * - Pages
 * - Modules
 * - Permissions
 * - Connexions
 * - Utilisateurs réels par rôle
 * - Activité des connexions
 * - Dernières connexions
 * - Journaux système
 *
 * IMPORTANT :
 * Le bouton Actualiser recharge uniquement les données
 * du dashboard admin, sans recharger toute la page.
 * ============================================================
 */

import supabase from './supabase.js';
import APP_CONFIG from './config.js';


/* ============================================================
   VARIABLES
   ============================================================ */

let usersRoleChart = null;
let connectionsActivityChart = null;

let adminDashboardLoading = false;
let adminRefreshBound = false;


/* ============================================================
   INITIALISATION
   ============================================================ */

function initAdminDashboard() {

    if (!isAdminDashboardVisible()) {
        return;
    }

    setupRefreshButton();

    loadAdminDashboardData();
}


/* ============================================================
   DOM READY
   ============================================================ */

if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        initAdminDashboard,
        {
            once: true
        }
    );

} else {

    initAdminDashboard();

}


/* ============================================================
   DASHBOARD CHARGÉ DYNAMIQUEMENT
   ============================================================ */

document.addEventListener(
    'dashboardLoaded',
    () => {

        setTimeout(
            () => {

                if (
                    isAdminDashboardVisible()
                ) {

                    setupRefreshButton();

                    loadAdminDashboardData({
                        refresh: true
                    });

                }

            },
            50
        );

    }
);


/* ============================================================
   DETECTION DASHBOARD ADMIN
   ============================================================ */

function isAdminDashboardVisible() {

    return !!document.getElementById(
        'totalUsersVal'
    );

}


/* ============================================================
   CHARGEMENT PRINCIPAL
   ============================================================ */

export async function loadAdminDashboardData(
    options = {}
) {

    if (
        adminDashboardLoading
    ) {

        return;
    }


    if (
        !isAdminDashboardVisible()
    ) {

        return;
    }


    adminDashboardLoading = true;


    try {

        /* ====================================================
           TABLE USER_PROFILES
           ==================================================== */

        const userProfilesTable =

            APP_CONFIG?.DATABASE?.USER_PROFILES_TABLE ||

            'user_profiles';


        /* ====================================================
           CHARGEMENT DES DONNÉES
           ==================================================== */

        const [

            usersRes,

            rolesRes,

            pagesRes,

            permissionsRes,

            modulesRes,

            notificationsRes

        ] = await Promise.all([


            /* USER PROFILES */

            supabase
                .from(userProfilesTable)
                .select('*'),


            /* ROLES */

            supabase
                .from('roles')
                .select('*'),


            /* PAGES */

            supabase
                .from('pages')
                .select('*'),


            /* PERMISSIONS */

            supabase
                .from('permissions')
                .select('*'),


            /* MODULES */

            supabase
                .from('hub_modules')
                .select('*'),


            /*
             * Notifications :
             * select('*') pour éviter les erreurs 400
             * liées à des colonnes inexistantes.
             */

            supabase
                .from('notifications')
                .select('*')
                .order(
                    'created_at',
                    {
                        ascending: false
                    }
                )
                .limit(10)

        ]);


        /* ====================================================
           DONNÉES
           ==================================================== */

        const users =

            Array.isArray(usersRes.data)

                ? usersRes.data

                : [];


        const roles =

            Array.isArray(rolesRes.data)

                ? rolesRes.data

                : [];


        const pages =

            Array.isArray(pagesRes.data)

                ? pagesRes.data

                : [];


        const permissions =

            Array.isArray(
                permissionsRes.data
            )

                ? permissionsRes.data

                : [];


        const modules =

            Array.isArray(
                modulesRes.data
            )

                ? modulesRes.data

                : [];


        const notifications =

            Array.isArray(
                notificationsRes.data
            )

                ? notificationsRes.data

                : [];


        /* ====================================================
           ERREURS
           ==================================================== */

        logQueryError(
            'user_profiles',
            usersRes.error
        );


        logQueryError(
            'roles',
            rolesRes.error
        );


        logQueryError(
            'pages',
            pagesRes.error
        );


        logQueryError(
            'permissions',
            permissionsRes.error
        );


        logQueryError(
            'hub_modules',
            modulesRes.error
        );


        logQueryError(
            'notifications',
            notificationsRes.error
        );


        /* ====================================================
           DEBUG
           ==================================================== */

        console.info(
            '[SMTG ADMIN] Utilisateurs reçus :',
            users.length
        );


        console.info(
            '[SMTG ADMIN] Rôles reçus :',
            roles.length
        );


        console.info(
            '[SMTG ADMIN] Pages reçues :',
            pages.length
        );


        console.info(
            '[SMTG ADMIN] Permissions reçues :',
            permissions.length
        );


        console.info(
            '[SMTG ADMIN] Modules reçus :',
            modules.length
        );


        /* ====================================================
           STATISTIQUES
           ==================================================== */

        renderAdminStatistics({

            users,

            roles,

            pages,

            permissions,

            modules

        });


        /* ====================================================
           UTILISATEURS RÉELS PAR RÔLE
           ==================================================== */

        renderUsersByRole(
            users,
            roles
        );


        /* ====================================================
           ACTIVITÉ DES CONNEXIONS
           ==================================================== */

        renderConnectionsActivity(
            users
        );


        /* ====================================================
           DERNIÈRES CONNEXIONS
           ==================================================== */

        renderLastLogins(
            users,
            roles
        );


        /* ====================================================
           JOURNAUX
           ==================================================== */

        const profilesById =

            new Map(

                users.map(
                    user => [

                        String(
                            user.id
                        ),

                        user

                    ]
                )

            );


        const logs =

            notifications.map(
                notification => ({

                    ...notification,

                    user_profiles:
                        profilesById.get(
                            String(
                                notification.user_id ||
                                notification.created_by ||
                                notification.user_id_fk ||
                                ''
                            )
                        ) || null

                })
            );


        renderSystemLogs(
            logs
        );


    } catch (error) {

        console.error(
            '[SMTG ADMIN] Erreur critique :',
            error
        );


        showDashboardError(
            error
        );


    } finally {

        adminDashboardLoading = false;

    }

}


/* ============================================================
   ERREUR QUERY
   ============================================================ */

function logQueryError(
    name,
    error
) {

    if (!error) {
        return;
    }


    console.error(
        `[SMTG ADMIN] Erreur ${name}:`,
        error
    );

}


/* ============================================================
   STATISTIQUES PRINCIPALES
   ============================================================ */

function renderAdminStatistics({

    users,

    roles,

    pages,

    permissions,

    modules

}) {


    /* ========================================================
       UTILISATEURS
       ======================================================== */

    /*
     * IMPORTANT :
     *
     * On compte tous les utilisateurs retournés
     * par user_profiles.
     *
     * Donc :
     *
     * YAHYA
     * KARIM
     *
     * = 2
     */

    setElementText(
        'totalUsersVal',
        users.length
    );


    /* ========================================================
       RÔLES
       ======================================================== */

    setElementText(
        'totalRolesVal',
        roles.length
    );


    /* ========================================================
       PAGES
       ======================================================== */

    setElementText(
        'totalPagesVal',
        pages.length
    );


    /* ========================================================
       MODULES
       ======================================================== */

    setElementText(
        'totalModulesVal',
        modules.length
    );


    /* ========================================================
       PERMISSIONS
       ======================================================== */

    setElementText(
        'totalPermissionsVal',
        permissions.length
    );


    /* ========================================================
       CONNEXIONS / UTILISATEURS ACTIFS
       ======================================================== */

    const activeUsers =

        users.filter(
            user =>
                user.actif === true
        ).length;


    setElementText(
        'totalConnectionsVal',
        activeUsers
    );

}


/* ============================================================
   UTILISATEURS RÉELS PAR RÔLE
   ============================================================ */

function renderUsersByRole(
    users,
    roles
) {


    /* ========================================================
       CANVAS
       ======================================================== */

    const canvas =

        document.getElementById(
            'stockEmplacementDonut'
        );


    if (!canvas) {

        console.warn(
            '[SMTG ADMIN] Canvas usersRoleChart introuvable.'
        );

        return;
    }


    /* ========================================================
       CHART.JS
       ======================================================== */

    if (
        typeof Chart === 'undefined'
    ) {

        console.warn(
            '[SMTG ADMIN] Chart.js non chargé.'
        );

        return;
    }


    /* ========================================================
       MAP DES RÔLES
       ======================================================== */

    const roleMap = {};


    roles.forEach(
        role => {

            roleMap[
                Number(
                    role.id
                )
            ] =

                role.nom ||

                role.role_name ||

                role.name ||

                role.code ||

                'Utilisateur';

        }
    );


    /* ========================================================
       UTILISATEURS RÉELS
       ======================================================== */

    const realUsers =

        users.filter(
            user => {

                if (!user) {
                    return false;
                }


                return (

                    user.nom_complet ||

                    user.nom ||

                    user.prenom ||

                    user.username ||

                    user.email

                );

            }
        );


    /* ========================================================
       AUCUN UTILISATEUR
       ======================================================== */

    if (
        realUsers.length === 0
    ) {


        updateUsersRoleLegend(
            []
        );


        if (
            usersRoleChart
        ) {

            try {

                usersRoleChart.destroy();

            } catch (_) {}

            usersRoleChart = null;

        }


        return;
    }


    /* ========================================================
       PALETTE
       ======================================================== */

    const palette = [

        '#10b981',

        '#3b82f6',

        '#f59e0b',

        '#8b5cf6',

        '#ec4899',

        '#06b6d4',

        '#84cc16',

        '#f97316',

        '#14b8a6',

        '#a855f7',

        '#ef4444',

        '#6366f1',

        '#14b8a6',

        '#eab308'

    ];


    /* ========================================================
       DATA CHART
       ======================================================== */

    const labels = [];

    const values = [];

    const colors = [];

    const legendUsers = [];


    realUsers.forEach(
        (
            user,
            index
        ) => {


            /* ================================================
               NOM COMPLET
               ================================================ */

            const fullName =

                user.nom_complet ||

                `${user.nom || ''} ${
                    user.prenom || ''
                }`.trim() ||

                user.username ||

                user.email ||

                'Utilisateur';


            /* ================================================
               RÔLE
               ================================================ */

            const roleName =

                roleMap[
                    Number(
                        user.role_id
                    )
                ] ||

                'Rôle inconnu';


            /* ================================================
               COULEUR
               ================================================ */

            const color =

                palette[
                    index %
                    palette.length
                ];


            /* ================================================
               DONUT
               ================================================ */

            labels.push(
                fullName
            );


            /*
             * Chaque utilisateur = 1
             */

            values.push(
                1
            );


            colors.push(
                color
            );


            /* ================================================
               LEGEND
               ================================================ */

            legendUsers.push({

                id:
                    user.id,

                name:
                    fullName,

                role:
                    roleName,

                color:
                    color

            });

        }
    );


    /* ========================================================
       DESTROY ANCIEN CHART
       ======================================================== */

    if (
        usersRoleChart
    ) {

        try {

            usersRoleChart.destroy();

        } catch (_) {}

        usersRoleChart = null;

    }


    /* ========================================================
       CRÉATION DONUT
       ======================================================== */

    usersRoleChart =

        new Chart(
            canvas.getContext(
                '2d'
            ),
            {

                type:
                    'doughnut',


                data: {

                    labels:
                        labels,


                    datasets: [

                        {

                            data:
                                values,

                            backgroundColor:
                                colors,

                            borderWidth:
                                0,

                            hoverOffset:
                                6

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        '70%',


                    plugins: {

                        legend: {

                            display:
                                false

                        },


                        tooltip: {

                            callbacks: {

                                label(
                                    context
                                ) {

                                    const index =

                                        context.dataIndex;


                                    const user =

                                        legendUsers[
                                            index
                                        ];


                                    if (!user) {
                                        return '';
                                    }


                                    return (

                                        ` ${user.name}` +

                                        ` — ${user.role}`

                                    );

                                }

                            }

                        }

                    }

                }

            }

        );


    /* ========================================================
       LEGEND AVEC LES VRAIS UTILISATEURS
       ======================================================== */

    updateUsersRoleLegend(
        legendUsers
    );

}


/* ============================================================
   LEGEND DES VRAIS UTILISATEURS
   ============================================================ */

function updateUsersRoleLegend(
    users
) {


    const legend =

        document.getElementById(
            'usersRoleLegend'
        );


    if (!legend) {
        return;
    }


    /* ========================================================
       VIDE
       ======================================================== */

    if (
        !users ||
        users.length === 0
    ) {

        legend.innerHTML = `

            <div
                style="
                    color:#8a99ad;
                    font-size:10px;
                "
            >
                Aucun utilisateur
            </div>

        `;

        return;
    }


    /* ========================================================
       RESET
       ======================================================== */

    legend.innerHTML = '';


    /* ========================================================
       UTILISATEURS
       ======================================================== */

    users.forEach(
        user => {


            const item =

                document.createElement(
                    'div'
                );


            item.style.cssText = `

                display:flex;

                align-items:center;

                gap:7px;

                margin-bottom:8px;

                font-size:10px;

            `;


            item.innerHTML = `

                <span
                    style="
                        width:8px;
                        height:8px;
                        min-width:8px;
                        border-radius:50%;
                        background:${user.color};
                        display:inline-block;
                    "
                ></span>


                <div
                    style="
                        display:flex;
                        flex-direction:column;
                        line-height:1.3;
                        min-width:0;
                    "
                >

                    <span
                        style="
                            color:#ffffff;
                            font-weight:600;
                            white-space:nowrap;
                            overflow:hidden;
                            text-overflow:ellipsis;
                            max-width:180px;
                        "
                    >
                        ${escapeHtml(
                            user.name
                        )}
                    </span>


                    <span
                        style="
                            color:#8a99ad;
                            font-size:8px;
                        "
                    >
                        ${escapeHtml(
                            user.role
                        )}
                    </span>

                </div>

            `;


            legend.appendChild(
                item
            );

        }
    );

}


/* ============================================================
   ACTIVITÉ CONNEXIONS - 7 JOURS
   ============================================================ */

function renderConnectionsActivity(
    users
) {


    const canvas =

        document.getElementById(
            'mouvements7DaysChart'
        );


    if (!canvas) {
        return;
    }


    if (
        typeof Chart === 'undefined'
    ) {
        return;
    }


    const now =
        new Date();


    const labels = [];

    const dates = [];


    /* ========================================================
       7 JOURS
       ======================================================== */

    for (
        let i = 6;
        i >= 0;
        i--
    ) {


        const date =
            new Date(
                now
            );


        date.setHours(
            0,
            0,
            0,
            0
        );


        date.setDate(
            date.getDate() - i
        );


        dates.push(
            date
        );


        labels.push(

            date
                .toLocaleDateString(
                    'fr-FR',
                    {
                        weekday:
                            'short'
                    }
                )
                .replace(
                    '.',
                    ''
                )

        );

    }


    /* ========================================================
       ACTIVITÉ
       ======================================================== */

    const activity =

        dates.map(
            day => {


                const start =
                    new Date(
                        day
                    );


                const end =
                    new Date(
                        day
                    );


                end.setDate(
                    end.getDate() + 1
                );


                return users.filter(
                    user => {


                        if (
                            !user.dernier_login
                        ) {

                            return false;

                        }


                        const loginDate =

                            new Date(
                                user.dernier_login
                            );


                        if (
                            isNaN(
                                loginDate
                            )
                        ) {

                            return false;

                        }


                        return (

                            loginDate >=
                            start

                            &&

                            loginDate <
                            end

                        );

                    }
                ).length;

            }
        );


    /* ========================================================
       DESTROY
       ======================================================== */

    if (
        connectionsActivityChart
    ) {

        try {

            connectionsActivityChart.destroy();

        } catch (_) {}

        connectionsActivityChart = null;

    }


    /* ========================================================
       CHART
       ======================================================== */

    connectionsActivityChart =

        new Chart(
            canvas.getContext(
                '2d'
            ),
            {

                type:
                    'line',


                data: {

                    labels:
                        labels,


                    datasets: [

                        {

                            label:
                                'Connexions',

                            data:
                                activity,

                            borderColor:
                                '#10b981',

                            backgroundColor:
                                'rgba(16,185,129,0.10)',

                            borderWidth:
                                2,

                            fill:
                                true,

                            tension:
                                0.3,

                            pointRadius:
                                3,

                            pointHoverRadius:
                                5,

                            pointBackgroundColor:
                                '#10b981'

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    plugins: {

                        legend: {

                            display:
                                false

                        }

                    },


                    scales: {

                        x: {

                            grid: {

                                display:
                                    false

                            },


                            ticks: {

                                color:
                                    '#8a99ad',

                                font: {

                                    size:
                                        9

                                }

                            }

                        },


                        y: {

                            beginAtZero:
                                true,


                            ticks: {

                                precision:
                                    0,

                                color:
                                    '#8a99ad',

                                font: {

                                    size:
                                        9

                                }

                            },


                            grid: {

                                color:
                                    'rgba(255,255,255,0.03)'

                            }

                        }

                    }

                }

            }

        );

}


/* ============================================================
   DERNIÈRES CONNEXIONS
   ============================================================ */

function renderLastLogins(
    users,
    roles
) {


    const container =

        document.getElementById(
            'lastLoginsContainer'
        );


    if (!container) {
        return;
    }


    /* ========================================================
       MAP RÔLES
       ======================================================== */

    const roleMap = {};


    roles.forEach(
        role => {

            roleMap[
                Number(
                    role.id
                )
            ] =

                role.nom ||

                role.role_name ||

                role.name ||

                role.code ||

                'Collaborateur';

        }
    );


    /* ========================================================
       USERS TRIÉS PAR DERNIER LOGIN
       ======================================================== */

    const sorted =

        [...users]

            .filter(
                user =>

                    user.dernier_login ||

                    user.updated_at
            )


            .sort(
                (
                    a,
                    b
                ) => {


                    const dateA =

                        new Date(
                            a.dernier_login ||
                            a.updated_at
                        );


                    const dateB =

                        new Date(
                            b.dernier_login ||
                            b.updated_at
                        );


                    return (
                        dateB -
                        dateA
                    );

                }
            )


            .slice(
                0,
                5
            );


    /* ========================================================
       AUCUNE CONNEXION
       ======================================================== */

    if (
        sorted.length === 0
    ) {

        container.innerHTML = `

            <div
                style="
                    font-size:10px;
                    color:#8a99ad;
                    text-align:center;
                    padding:10px;
                "
            >
                Aucune connexion enregistrée
            </div>

        `;

        return;
    }


    /* ========================================================
       RESET
       ======================================================== */

    container.innerHTML = '';


    /* ========================================================
       AFFICHAGE
       ======================================================== */

    sorted.forEach(
        (
            user,
            index
        ) => {


            const fullName =

                user.nom_complet ||

                `${user.nom || ''} ${
                    user.prenom || ''
                }`.trim() ||

                user.username ||

                user.email ||

                'Utilisateur';


            const initials =

                fullName

                    .split(' ')

                    .filter(
                        Boolean
                    )

                    .map(
                        name =>
                            name[0]
                    )

                    .join('')

                    .substring(
                        0,
                        2
                    )

                    .toUpperCase() ||

                'SM';


            const roleName =

                roleMap[
                    Number(
                        user.role_id
                    )
                ] ||

                'Collaborateur';


            const loginDate =

                new Date(
                    user.dernier_login ||
                    user.updated_at
                );


            const validDate =

                !isNaN(
                    loginDate
                );


            const timeFormatted =

                validDate

                    ? loginDate.toLocaleTimeString(
                        'fr-FR',
                        {

                            hour:
                                '2-digit',

                            minute:
                                '2-digit',

                            second:
                                '2-digit'

                        }
                    )

                    : '--:--';


            const dateFormatted =

                validDate

                    ? loginDate.toLocaleDateString(
                        'fr-FR'
                    )

                    : '--/--/----';


            const isToday =

                validDate &&

                isSameDay(
                    loginDate,
                    new Date()
                );


            const colors = [

                '#10b981',

                '#3b82f6',

                '#f59e0b',

                '#8b5cf6',

                '#ec4899'

            ];


            const color =

                colors[
                    index %
                    colors.length
                ];


            container.insertAdjacentHTML(
                'beforeend',
                `

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;

                        ${
                            index <
                            sorted.length - 1

                                ? `
                                    border-bottom:
                                        1px solid
                                        rgba(
                                            255,
                                            255,
                                            255,
                                            0.03
                                        );

                                    padding-bottom:6px;

                                    margin-bottom:6px;
                                  `

                                : ''
                        }
                    "
                >


                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:8px;
                        "
                    >


                        <div
                            style="
                                width:26px;
                                height:26px;
                                background:${color};
                                border-radius:50%;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                font-size:10px;
                                font-weight:700;
                                color:#000;
                            "
                        >
                            ${escapeHtml(
                                initials
                            )}
                        </div>


                        <div>

                            <div
                                style="
                                    font-size:11px;
                                    color:#fff;
                                    font-weight:600;
                                "
                            >

                                ${escapeHtml(
                                    fullName
                                )}


                                <span
                                    style="
                                        font-size:8px;
                                        background:
                                            rgba(
                                                16,
                                                185,
                                                129,
                                                0.2
                                            );
                                        color:#10b981;
                                        padding:
                                            1px 4px;
                                        border-radius:3px;
                                        margin-left:3px;
                                    "
                                >
                                    ${escapeHtml(
                                        roleName
                                    )}
                                </span>

                            </div>


                            <div
                                style="
                                    font-size:9px;
                                    color:#8a99ad;
                                "
                            >
                                ${escapeHtml(
                                    user.email ||
                                    user.username ||
                                    ''
                                )}
                            </div>

                        </div>

                    </div>


                    <div
                        style="
                            text-align:right;
                            font-size:10px;
                            color:#fff;
                        "
                    >

                        ${timeFormatted}

                        <br>

                        <span
                            style="
                                font-size:8px;
                                color:#8a99ad;
                            "
                        >

                            ${
                                isToday

                                    ? 'Aujourd’hui'

                                    : dateFormatted

                            }

                        </span>

                    </div>

                </div>

                `
            );

        }
    );

}


/* ============================================================
   JOURNAUX SYSTÈME
   ============================================================ */

function renderSystemLogs(
    logs
) {


    const tbody =

        document.getElementById(
            'systemLogsTableBody'
        );


    if (!tbody) {
        return;
    }


    /* ========================================================
       AUCUN LOG
       ======================================================== */

    if (
        !logs ||
        logs.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    style="
                        padding:8px;
                        text-align:center;
                        color:#8a99ad;
                    "
                >
                    Aucun journal en base de données
                </td>

            </tr>

        `;

        return;
    }


    /* ========================================================
       RESET
       ======================================================== */

    tbody.innerHTML = '';


    /* ========================================================
       LOGS
       ======================================================== */

    logs
        .slice(
            0,
            10
        )
        .forEach(
            log => {


                const level =

                    String(
                        log.type ||
                        log.level ||
                        'INFO'
                    )
                    .toUpperCase();


                let color =
                    '#10b981';


                if (
                    level === 'ERROR'
                ) {

                    color =
                        '#ef4444';

                } else if (

                    level === 'WARN' ||

                    level === 'WARNING'

                ) {

                    color =
                        '#f59e0b';

                }


                const profile =
                    log.user_profiles;


                const userName =

                    profile

                        ? (

                            profile.nom_complet ||

                            `${profile.nom || ''} ${
                                profile.prenom || ''
                            }`.trim() ||

                            profile.username ||

                            profile.email ||

                            'Utilisateur'

                        )

                        : (

                            log.user_name ||

                            log.username ||

                            'Système SMTG'

                        );


                const createdAt =

                    log.created_at

                        ? new Date(
                            log.created_at
                        )

                        : null;


                const dateTime =

                    createdAt &&

                    !isNaN(
                        createdAt
                    )

                        ? createdAt.toLocaleString(
                            'fr-FR'
                        )

                        : '';


                const message =

                    log.message ||

                    log.title ||

                    log.description ||

                    '—';


                const ip =

                    log.ip_address ||

                    log.ip ||

                    '—';


                tbody.insertAdjacentHTML(
                    'beforeend',
                    `

                    <tr
                        style="
                            border-bottom:
                                1px solid
                                rgba(
                                    255,
                                    255,
                                    255,
                                    0.03
                                );
                        "
                    >

                        <td
                            style="
                                padding:5px 4px;
                            "
                        >

                            <span
                                style="
                                    color:${color};
                                    font-weight:700;
                                "
                            >
                                ${escapeHtml(
                                    level
                                )}
                            </span>

                        </td>


                        <td
                            style="
                                padding:5px 4px;
                                color:#fff;
                            "
                        >

                            ${escapeHtml(
                                message
                            )}

                            ${
                                dateTime

                                    ? `
                                        <div
                                            style="
                                                font-size:8px;
                                                color:#64748b;
                                                margin-top:2px;
                                            "
                                        >
                                            ${escapeHtml(
                                                dateTime
                                            )}
                                        </div>
                                      `

                                    : ''
                            }

                        </td>


                        <td
                            style="
                                padding:5px 4px;
                                color:#fff;
                            "
                        >

                            ${escapeHtml(
                                userName
                            )}

                        </td>


                        <td
                            style="
                                padding:5px 4px;
                                text-align:right;
                                color:#8a99ad;
                            "
                        >

                            ${escapeHtml(
                                ip
                            )}

                        </td>

                    </tr>

                    `
                );

            }
        );

}


/* ============================================================
   BOUTON ACTUALISER
   ============================================================ */

function setupRefreshButton() {


    const button =

        document.getElementById(
            'refreshAdminDashboard'
        ) ||

        document.getElementById(
            'adminRefreshButton'
        ) ||

        document.getElementById(
            'refreshBtn'
        ) ||

        document.querySelector(
            '[data-admin-refresh]'
        );


    if (!button) {
        return;
    }


    /* ========================================================
       EVITER DOUBLE EVENT
       ======================================================== */

    if (
        button.dataset.adminRefreshBound ===
        'true'
    ) {

        return;
    }


    button.dataset.adminRefreshBound =
        'true';


    adminRefreshBound =
        true;


    /* ========================================================
       REMOVE ONCLICK
       ======================================================== */

    button.removeAttribute(
        'onclick'
    );


    /* ========================================================
       CLICK
       ======================================================== */

    button.addEventListener(
        'click',
        async event => {


            event.preventDefault();

            event.stopPropagation();


            if (
                adminDashboardLoading
            ) {

                return;
            }


            const originalHTML =
                button.innerHTML;


            button.disabled =
                true;


            button.style.opacity =
                '0.7';


            button.innerHTML = `

                <i
                    class="fas fa-sync-alt fa-spin"
                ></i>

                Actualisation...

            `;


            try {


                /*
                 * IMPORTANT :
                 *
                 * Pas de :
                 *
                 * window.location.reload()
                 *
                 * On actualise uniquement
                 * les données du dashboard.
                 */

                await loadAdminDashboardData({

                    refresh:
                        true

                });


            } catch (error) {


                console.error(
                    '[SMTG ADMIN] Erreur actualisation:',
                    error
                );


            } finally {


                button.disabled =
                    false;


                button.style.opacity =
                    '1';


                button.innerHTML =
                    originalHTML;

            }

        }
    );

}


/* ============================================================
   AFFICHER ERREUR
   ============================================================ */

function showDashboardError(
    error
) {


    console.error(
        '[SMTG ADMIN] Dashboard error:',
        error
    );


    let notification =

        document.getElementById(
            'adminDashboardError'
        );


    if (!notification) {


        notification =

            document.createElement(
                'div'
            );


        notification.id =
            'adminDashboardError';


        notification.style.cssText = `

            position:fixed;

            right:20px;

            bottom:20px;

            z-index:99999;

            background:
                rgba(
                    127,
                    29,
                    29,
                    0.95
                );

            color:#fff;

            border:
                1px solid
                rgba(
                    239,
                    68,
                    68,
                    0.5
                );

            border-radius:8px;

            padding:10px 14px;

            font-size:11px;

            box-shadow:
                0 10px 30px
                rgba(
                    0,
                    0,
                    0,
                    0.4
                );

        `;


        document.body.appendChild(
            notification
        );

    }


    notification.textContent =

        'Erreur lors du chargement des données administrateur.';


    clearTimeout(
        notification._timer
    );


    notification._timer =

        setTimeout(
            () => {

                if (
                    notification &&
                    notification.parentNode
                ) {

                    notification.remove();

                }

            },
            5000
        );

}


/* ============================================================
   SET TEXT
   ============================================================ */

function setElementText(
    id,
    text
) {


    const element =

        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.textContent =

        String(
            text ?? ''
        );

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHtml(
    value
) {


    return String(
        value ?? ''
    )

        .replace(
            /&/g,
            '&amp;'
        )

        .replace(
            /</g,
            '&lt;'
        )

        .replace(
            />/g,
            '&gt;'
        )

        .replace(
            /"/g,
            '&quot;'
        )

        .replace(
            /'/g,
            '&#039;'
        );

}


/* ============================================================
   SAME DAY
   ============================================================ */

function isSameDay(
    date1,
    date2
) {


    if (
        !date1 ||
        !date2 ||
        isNaN(date1) ||
        isNaN(date2)
    ) {

        return false;
    }


    return (

        date1.getFullYear() ===
        date2.getFullYear()

        &&

        date1.getMonth() ===
        date2.getMonth()

        &&

        date1.getDate() ===
        date2.getDate()

    );

}


/* ============================================================
   GLOBAL REFRESH
   ============================================================ */

window.refreshAdminDashboard =

    async function () {


        if (
            !isAdminDashboardVisible()
        ) {

            return;
        }


        await loadAdminDashboardData({

            refresh:
                true

        });

    };


/* ============================================================
   EXPORT
   ============================================================ */

export default {

    loadAdminDashboardData

};