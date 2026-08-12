/**
 * ============================================================
 * SoufStock Enterprise ERP
 * assets/js/core/sidebar.js
 * ============================================================
 */

import * as Permissions from "./permissions.js";
import supabase from "./supabase.js";

class SidebarManager {

    constructor() {
        this.sidebar = null;
        this.toggle = null;
        this.links = [];
        this.storageKey = "soufstock_sidebar";
    }

    /* ============================================================
     * INIT
     * ============================================================ */

    async init() {
        this.sidebar = document.getElementById("sidebar");
        this.toggle = document.getElementById("sidebarToggle");

        // 1. Jib les pages mn Supabase w rmihoum f la Sidebar awalan
        await this.loadPagesIntoSidebar();

        // 2. Jama3 les liens morama t-bnawo w t-tchearjaw
        this.links = [
            ...document.querySelectorAll(".nav-item")
        ];

        this.restore();

        this.applyPermissions();

        this.bindToggle();

        this.bindLinks();
    }

    /* ============================================================
     * LOAD PAGES FROM SUPABASE
     * ============================================================ */

    async loadPagesIntoSidebar() {
        // Lawal, qleb 3la l'container fin khasshom y-t-7etto (ila makanch sidebarNav, khdm b sidebar)
        let navContainer = document.getElementById("sidebarNav");
        
        if (!navContainer && this.sidebar) {
            navContainer = this.sidebar.querySelector("nav") || this.sidebar.querySelector(".sidebar-nav");
        }

        if (!navContainer) {
            console.error("Container dyal navigation (sidebarNav) ma t-l9ach f l'HTML!");
            return;
        }

        try {
            const { data: pages, error } = await supabase
                .from('pages')
                .select('*')
                .eq('actif', true)
                .order('ordre_affichage', { ascending: true });

            if (error) {
                console.error("Erreur chargement pages sidebar Supabase:", error);
                navContainer.innerHTML = `<div style="color: #ef4444; font-size: 11px; padding: 10px;">Erreur de chargement</div>`;
                return;
            }

            if (!pages || pages.length === 0) {
                navContainer.innerHTML = `<div style="color: #94a3b8; font-size: 11px; padding: 10px;">Aucune page configurée</div>`;
                return;
            }

            // Mapping dyal les icônes 3la hsab l'code dyal la page f Supabase
            const iconsMap = {
                'dashboard': 'fa-chart-pie',
                'import_stock': 'fa-file-import',
                'import_commandes_kg': 'fa-file-excel',
                'import_commandes_pieces': 'fa-file-excel',
                'stock': 'fa-warehouse',
                'commandes': 'fa-file-invoice',
                'picking': 'fa-dolly',
                'ab10': 'fa-box-open',
                'expeditions': 'fa-truck',
                'utilisateurs': 'fa-users',
                'parametres': 'fa-cog',
                'roles': 'fa-user-shield',
                'permissions': 'fa-lock'
            };

            // Générer les liens dyal la sidebar otomatikan
            navContainer.innerHTML = pages.map(page => {
                const codeKey = (page.code || '').toLowerCase();
                const iconClass = iconsMap[codeKey] || 'fa-folder';
                
                let pageUrl = page.url || '#';
                if (!pageUrl.startsWith('http') && !pageUrl.startsWith('/') && !pageUrl.startsWith('./')) {
                    pageUrl = '/' + pageUrl;
                }

                return `
                    <a href="${pageUrl}" class="nav-item" data-page="${page.code}" data-permission="${page.code}">
                        <i class="fas ${iconClass}"></i>
                        <span>${page.nom}</span>
                    </a>
                `;
            }).join('');

            // ** Mouhim: 3awd jma3 les liens jdads mn baab t-generation dyalhoum DOM w t-biko 3lihoum permissions w events **
            this.links = [...document.querySelectorAll(".nav-item")];
            this.applyPermissions();
            this.bindLinks();

        } catch (err) {
            console.error("Erreur technique f loadPagesIntoSidebar:", err);
        }
    }

    /* ============================================================
     * PERMISSIONS
     * ============================================================ */

    applyPermissions() {
        this.links.forEach(link => {
            const permission = link.dataset.permission;
            if (!permission) return;

            if (Permissions.can(permission)) {
                link.hidden = false;
                link.style.display = ""; // Bach t-bayan flex/block l'original dialha CSS
            } else {
                link.hidden = true;
                link.style.display = "none";
            }
        });
    }

    /* ============================================================
     * EVENTS
     * ============================================================ */

    bindLinks() {
        this.links.forEach(link => {
            // Eviter d'ajouter plusieurs event listeners ila t-3awdat l'appel
            if (link.dataset.bound === "true") return;
            link.dataset.bound = "true";

            link.addEventListener("click", e => {
                // Ila kanti bghiti tkhdm SPA (Single Page Application) w t-preventiw default navigation:
                // e.preventDefault();
                
                const page = link.dataset.page;
                if (!page) return;

                this.setActive(page);

                window.dispatchEvent(
                    new CustomEvent(
                        "navigate",
                        {
                            detail: {
                                page
                            }
                        }
                    )
                );
            });
        });
    }

    /* ============================================================
     * ACTIVE
     * ============================================================ */

    setActive(page) {
        this.links.forEach(link => {
            link.classList.remove("active");
            if (link.dataset.page === page) {
                link.classList.add("active");
            }
        });
    }

    /* ============================================================
     * TOGGLE
     * ============================================================ */

    bindToggle() {
        if (!this.sidebar || !this.toggle) return;
        this.toggle.addEventListener(
            "click",
            () => this.toggleSidebar()
        );
    }

    toggleSidebar() {
        this.sidebar.classList.toggle("collapsed");
        this.save();
    }

    /* ============================================================
     * STORAGE
     * ============================================================ */

    save() {
        localStorage.setItem(
            this.storageKey,
            this.sidebar.classList.contains("collapsed")
        );
    }

    restore() {
        const value = localStorage.getItem(this.storageKey);
        if (value === "true") {
            this.sidebar?.classList.add("collapsed");
        }
    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    collapse() {
        this.sidebar?.classList.add("collapsed");
        this.save();
    }

    expand() {
        this.sidebar?.classList.remove("collapsed");
        this.save();
    }

    isCollapsed() {
        return this.sidebar?.classList.contains("collapsed");
    }

}

const Sidebar = new SidebarManager();

export default Sidebar;
