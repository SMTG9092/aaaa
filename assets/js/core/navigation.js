/**
 * ============================================================
 * SoufStock Enterprise ERP
 * assets/js/core/navigation.js
 * ============================================================
 */

import { Loader, Toast } from "./utils.js";
import Sidebar from "./sidebar.js";
import supabase from "./supabase.js";
import { canPage, loadPermissions } from "./permissions.js";

class NavigationManager {

    constructor() {
        this.currentPage = "";
        this.routes = {}; 
        this.initialized = false;
        
        this.pageConfig = {
            'dashboard': { name: 'Tableau de bord', icon: 'fas fa-chart-pie' },
            'import_stock': { name: 'Import Stock', icon: 'fas fa-file-excel' },
            'import_commandes_kg': { name: 'Import Commandes KG', icon: 'fas fa-weight-hanging' },
            'import_commandes_pieces': { name: 'Import Commandes Pcs', icon: 'fas fa-boxes-stacked' },
            'stock': { name: 'Gestion Stock', icon: 'fas fa-warehouse' },
            'commandes': { name: 'Commandes', icon: 'fas fa-shopping-cart' },
            'picking': { name: 'Préparation Picking', icon: 'fas fa-dolly' },
            'ab10': { name: 'Magasin ', icon: 'fas fa-box-open' },
            'expeditions': { name: 'Expéditions', icon: 'fas fa-truck-fast' },
            'utilisateurs': { name: 'Utilisateurs', icon: 'fas fa-users-cog' },
            'parametres': { name: 'Paramètres', icon: 'fas fa-sliders' },
            'roles': { name: 'Rôles & Permissions', icon: 'fas fa-shield-alt' },
            'permissions': { name: 'Permissions', icon: 'fas fa-key' }
        };
    }

    async init() {
        this.detectCurrentPage();
        
        // Chargement dyal les permissions lowlīn bash l-cache y-kon 3mri
        await loadPermissions();

        await this.loadRoutesFromDatabase();
        await this.renderSidebar();

        this.bindEvents();

        Sidebar.setActive(this.currentPage);

        this.updateTitle();

        this.updateBreadcrumb();

        this.initialized = true;
    }

    async loadRoutesFromDatabase() {
        try {
            const { data: pages, error } = await supabase
                .from('pages')
                .select('code, url')
                .eq('actif', true);

            if (error) {
                console.error("Erreur chargement routes Supabase:", error);
                return;
            }

            if (pages) {
                this.routes = {};
                pages.forEach(page => {
                    if (page.code && page.url) {
                        let cleanUrl = page.url;
                        if (cleanUrl.startsWith('/')) {
                            cleanUrl = cleanUrl.substring(1);
                        }
                        this.routes[page.code.toLowerCase()] = cleanUrl;
                    }
                });
            }
        } catch (err) {
            console.error("Erreur de connexion base de données pour les routes:", err);
        }
    }

    async renderSidebar() {
        const navContainer = document.getElementById("sidebarNav");
        if (!navContainer) return;

        try {
            // Zidna .eq('show_in_menu', true) bach tjib gha les pages li mamsouhinch mn menu
            const { data: pages, error } = await supabase
                .from('pages')
                .select('code, url')
                .eq('actif', true)
                .eq('show_in_menu', true);

            if (error) {
                console.error("Erreur chargement sidebar:", error);
                return;
            }

            if (pages) {
                let html = '<div class="nav-menu-list" style="display: flex; flex-direction: column; gap: 4px;">';
                
                pages.forEach(page => {
                    const pageKey = (page.code || '').toLowerCase();
                    
                    let config = this.pageConfig[pageKey];
                    if (!config) {
                        let formattedName = page.code.replace(/_/g, ' ');
                        formattedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
                        config = {
                            name: formattedName,
                            icon: 'fas fa-folder-open'
                        };
                    }

                    const isActive = this.currentPage === pageKey;

                    html += `
                        <a href="${page.url}" class="sidebar-item ${isActive ? 'active' : ''}" data-page="${page.code}" style="
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            padding: 10px 14px;
                            border-radius: 10px;
                            color: ${isActive ? '#fff' : '#94a3b8'};
                            background: ${isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))' : 'transparent'};
                            border: 1px solid ${isActive ? 'rgba(16, 185, 129, 0.4)' : 'transparent'};
                            text-decoration: none;
                            font-size: 13px;
                            font-weight: ${isActive ? '600' : '500'};
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='rgba(16, 185, 129, 0.1)'; this.style.color='#fff';" 
                           onmouseout="this.style.background='${isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))' : 'transparent'}'; this.style.color='${isActive ? '#fff' : '#94a3b8'}';">
                            <i class="${config.icon}" style="width: 18px; text-align: center; color: ${isActive ? '#10b981' : '#64748b'};"></i>
                            <span>${config.name}</span>
                        </a>
                    `;
                });

                html += '</div>';
                navContainer.innerHTML = html;

                // Interception dyal l-clicks 3la les liens d la sidebar b souhola
                const sidebarLinks = navContainer.querySelectorAll("a.sidebar-item");
                sidebarLinks.forEach(link => {
                    link.addEventListener("click", async (e) => {
                        e.preventDefault();
                        const pageCode = link.getAttribute("data-page");
                        if (pageCode) {
                            await this.navigate(pageCode);
                        } else {
                            const href = link.getAttribute("href");
                            window.location.href = href;
                        }
                    });
                });
            }
        } catch (err) {
            console.error("Erreur generation sidebar:", err);
        }
    }

    bindEvents() {
        window.addEventListener(
            "navigate",
            e => {
                this.navigate(
                    e.detail.page
                );
            }
        );
    }

    async navigate(page) {
        if (!page) return;

        const pageKey = page.toLowerCase();
        if (pageKey === this.currentPage)
            return;

        // Vérification b ḥalat wach 3ndo ṣ-ṣalḥiyya b canPage mn permissions.js
        const hasAccess = canPage(pageKey);
        if (!hasAccess) {
            window.location.href = "444.html";
            return;
        }

        if (Object.keys(this.routes).length === 0) {
            await this.loadRoutesFromDatabase();
        }

        const route = this.routes[pageKey];

        if (!route) {
            Toast.error(
                "Navigation",
                "Page introuvable."
            );
            return;
        }

        Loader.show(
            "Chargement...",
            "Ouverture de " + page
        );

        window.location.href = route;
    }

    detectCurrentPage() {
        const file =
            window.location.pathname
                .split("/")
                .pop()
                .replace(".html", "")
                .toLowerCase();

        this.currentPage =
            file || "dashboard";
    }

    updateTitle() {
        const title = document.getElementById("pageTitle");
        if (!title) return;
        title.textContent = this.format(this.currentPage);
    }

    updateBreadcrumb() {
        const breadcrumb = document.getElementById("breadcrumb");
        if (!breadcrumb) return;

        breadcrumb.innerHTML = `
            <span>Accueil</span>
            <span>/</span>
            <strong>${this.format(this.currentPage)}</strong>
        `;
    }

    format(text) {
        if (!text) return "";
        const lowerKey = text.toLowerCase();
        if (this.pageConfig[lowerKey]) {
            return this.pageConfig[lowerKey].name;
        }
        return text
            .replace(/_/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    getCurrentPage() {
        return this.currentPage;
    }
}

const Navigation = new NavigationManager();

export { NavigationManager, Navigation as navigationManager };
export default Navigation;
