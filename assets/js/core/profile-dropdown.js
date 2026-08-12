/**
 * Module Profile Dropdown & Session Management
 * SMTG - Système de Management et de Traçabilité Globale
 */

import supabase from './supabase.js';

export async function initProfileDropdown() {
    const profileBtn = document.getElementById('userProfileBtn');
    if (!profileBtn) return;

    // 1. Créer le DOM du Menu Déroulant (Dropdown) s'il n'existe pas encore
    createDropdownDOM(profileBtn);

    const dropdownMenu = document.getElementById('smtgProfileDropdownMenu');

    // 2. Charger les informations de l'utilisateur connecté
    await loadUserProfileData(profileBtn);

    // 3. Gérer l'affichage du menu au clic
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdownMenu.style.display === 'block';
        dropdownMenu.style.display = isVisible ? 'none' : 'block';
    });

    // Fermer le menu si on clique en dehors
    document.addEventListener('click', (e) => {
        if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });

    // 4. Gérer le bouton de Déconnexion
    const logoutBtn = document.getElementById('smtgLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await supabase.auth.signOut();
                localStorage.clear();
                window.location.href = 'login.html';
            } catch (err) {
                console.error("Erreur lors de la déconnexion :", err);
                window.location.href = 'login.html';
            }
        });
    }
}

/**
 * Créer la structure HTML du Dropdown et l'injecter dans le DOM
 */
function createDropdownDOM(profileBtn) {
    if (document.getElementById('smtgProfileDropdownMenu')) return;

    // Positionner le parent en relatif pour que le menu se place bien en dessous
    profileBtn.style.position = 'relative';
    profileBtn.style.cursor = 'pointer';

    const dropdownHTML = `
        <div id="smtgProfileDropdownMenu" style="display: none; position: absolute; top: calc(100% + 12px); right: 0; width: 240px; background: var(--card-bg, #111b24); border: 1px solid var(--card-border, rgba(16, 185, 129, 0.2)); border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); z-index: 10000; overflow: hidden; font-family: inherit; text-align: left;">
            
            <!-- Header du Dropdown -->
            <div style="padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.2);">
                <div id="dropUserName" style="font-size: 13px; font-weight: 700; color: var(--text-main, #fff); margin-bottom: 2px;">Chargement...</div>
                <div id="dropUserRole" style="font-size: 11px; color: var(--primary-glow, #10b981);">--</div>
            </div>

            <!-- Détails Service & Poste -->
            <div style="padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.06);">
                <div style="font-size: 11px; color: var(--text-sub, #cbd5e1);">
                    <strong style="color: var(--text-main, #fff);"><i class="fas fa-building" style="margin-right: 6px; color: var(--primary-glow);"></i>Service :</strong> 
                    <span id="dropUserService">--</span>
                </div>
                <div style="font-size: 11px; color: var(--text-sub, #cbd5e1);">
                    <strong style="color: var(--text-main, #fff);"><i class="fas fa-briefcase" style="margin-right: 6px; color: var(--primary-glow);"></i>Poste :</strong> 
                    <span id="dropUserPoste">--</span>
                </div>
            </div>

            <!-- Bouton Déconnexion -->
            <div style="padding: 8px;">
                <button id="smtgLogoutBtn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                    <i class="fas fa-sign-out-alt"></i> Fermer la session
                </button>
            </div>

        </div>
    `;

    profileBtn.insertAdjacentHTML('afterend', dropdownHTML);
}

/**
 * Charger les données de l'utilisateur depuis Supabase (auth + user_profiles + roles)
 */
async function loadUserProfileData(profileBtn) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
            window.location.href = 'login.html';
            return;
        }

        // Récupérer les informations depuis user_profiles en incluant le rôle
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select(`
                nom_complet,
                username,
                service,
                poste,
                roles (nom)
            `)
            .eq('id', session.user.id)
            .single();

        if (error) throw error;

        if (profile) {
            const displayName = profile.nom_complet || profile.username || 'Utilisateur';
            const roleName = profile.roles?.nom || 'Collaborateur';
            const serviceName = profile.service || 'Non assigné';
            const posteName = profile.poste || 'Non défini';

            // Mettre à jour l'affichage sur le bouton de l'en-tête (Header)
            profileBtn.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 28px; height: 28px; background: var(--primary-glow, #10b981); color: #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px;">
                        ${displayName.charAt(0).toUpperCase()}
                    </div>
                    <span style="font-size: 12px; font-weight: 600; color: var(--text-main, #fff);">${displayName}</span>
                    <i class="fas fa-chevron-down" style="font-size: 10px; color: var(--text-muted, #94a3b8); margin-left: 4px;"></i>
                </div>
            `;

            // Mettre à jour le contenu du menu déroulant
            document.getElementById('dropUserName').textContent = displayName;
            document.getElementById('dropUserRole').textContent = roleName;
            document.getElementById('dropUserService').textContent = serviceName;
            document.getElementById('dropUserPoste').textContent = posteName;
        }
    } catch (err) {
        console.error("Erreur chargement profil dropdown:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initProfileDropdown, 600);
});
