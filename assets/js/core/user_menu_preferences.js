import supabase from './supabase.js';

export function initMenuPreferences() {
    document.addEventListener('DOMContentLoaded', async () => {
        // Chargement dyal SortableJS ila makantch m-importya f HTML
        if (typeof Sortable === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.2/Sortable.min.js';
            script.onload = () => setupMenuDragAndDrop();
            document.head.appendChild(script);
        } else {
            setupMenuDragAndDrop();
        }
    });
}

async function setupMenuDragAndDrop() {
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (!sidebarNav) return;

    if (!window.supabase) {
        window.supabase = supabase;
    }

    const { data: { session } } = await window.supabase.auth.getSession();
    const userId = session?.user?.id;

    // 1. Chargement dyal l'ordre l9dim mn Supabase
    if (userId) {
        const { data, error } = await window.supabase
            .from('user_menu_preferences')
            .select('menu_order')
            .eq('user_id', userId)
            .maybeSingle();

        if (data && data.menu_order && Array.isArray(data.menu_order)) {
            const savedOrder = data.menu_order;
            
            // Re-ordonner les elements f DOM
            savedOrder.forEach(pagePath => {
                const link = sidebarNav.querySelector(`.nav-link[data-page="${pagePath}"]`);
                if (link) {
                    sidebarNav.appendChild(link);
                }
            });
        }
    }

    // 2. Tfa3il Drag & Drop b SortableJS
    Sortable.create(sidebarNav, {
        animation: 150,
        filter: '.nav-section-title', // Ma nkhalliwch les titres ytjro, gha les links
        onEnd: async function () {
            const newOrder = Array.from(sidebarNav.querySelectorAll('.nav-link'))
                .map(link => link.getAttribute('data-page'))
                .filter(Boolean);

            if (userId) {
                await window.supabase
                    .from('user_menu_preferences')
                    .upsert({ 
                        user_id: userId, 
                        menu_order: newOrder,
                        updated_at: new Date()
                    }, { onConflict: 'user_id' });
            }
        }
    });
}

// Auto-run ila t-importa direct
initMenuPreferences();
