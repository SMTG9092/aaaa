/**
 * Module de gestion des notifications (Supabase Realtime + UI + Modal Détails + Auto-Refresh 3s)
 * SMTG - Système de Management et de Traçabilité Globale
 */

import supabase from './supabase.js';

let notificationsChannel = null;
let autoRefreshInterval = null;

export async function initNotifications() {
    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const notifListContainer = document.getElementById('notifListContainer');

    if (!notifBtn || !notifDropdown || !notifListContainer) return;

    // Créer la structure Modal dans le DOM si elle n'existe pas encore
    createNotificationModalDOM();

    // 1. Gestion de l'affichage du menu déroulant au clic sur la cloche
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = notifDropdown.style.display === 'block';
        notifDropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            fetchAndRenderNotifications();
        }
    });

    // Fermer le dropdown si on clique ailleurs sur la page
    document.addEventListener('click', (e) => {
        if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
            notifDropdown.style.display = 'none';
        }
    });

    // 2. Charger les notifications initiales
    await fetchAndRenderNotifications();

    // 3. Configurer l'écouteur Realtime Supabase
    setupRealtimeNotifications();

    // 4. 🔥 Auto-refresh kol 3 thwani (3000 ms) en plus dyal Realtime
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        // On actualise seulement si le menu n'est pas ouvert pour éviter de perturber l'utilisateur, ou bien en arrière-plan
        fetchAndRenderNotifications();
    }, 3000);
}

/**
 * Créer dynamiquement la boîte de dialogue Modal pour afficher le message complet
 */
function createNotificationModalDOM() {
    if (document.getElementById('smtgNotifModal')) return;

    const modalHTML = `
        <div id="smtgNotifModal" style="display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center;">
            <div style="background: var(--card-bg, #111b24); border: 1px solid var(--card-border, rgba(16, 185, 129, 0.2)); width: 450px; max-width: 90%; border-radius: 14px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); overflow: hidden;">
                <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div id="modalNotifIconBox" style="font-size: 16px; color: var(--primary-glow);"><i id="modalNotifIcon" class="fas fa-info-circle"></i></div>
                        <h3 id="modalNotifTitle" style="font-size: 13px; font-weight: 700; color: #fff;">Titre de la notification</h3>
                    </div>
                    <button onclick="closeNotificationModal()" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px;"><i class="fas fa-times"></i></button>
                </div>
                <div style="padding: 20px;">
                    <div id="modalNotifMessage" style="font-size: 12px; color: #cbd5e1; line-height: 1.6; word-break: break-word; white-space: pre-wrap; background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.03);"></div>
                    <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--text-muted);">
                        <span id="modalNotifDate">--</span>
                        <span id="modalNotifTypeBadge" style="background: rgba(16,185,129,0.1); color: var(--primary-glow); padding: 2px 8px; border-radius: 4px; font-weight: 600;">--</span>
                    </div>
                </div>
                <div style="padding: 12px 20px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: flex-end;">
                    <button onclick="closeNotificationModal()" style="background: var(--primary-glow); color: #000; border: none; padding: 6px 16px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">Fermer</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Récupère les notifications depuis la base de données et met à jour l'UI
 */
async function fetchAndRenderNotifications() {
    const notifListContainer = document.getElementById('notifListContainer');
    const notifCountBadge = document.querySelector('.notification-badge-dot');
    const notifCountText = document.getElementById('notifCountText');

    if (!notifListContainer) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) return;
        const userId = session.user.id;

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .or(`user_id.eq.${userId},user_id.is.null`)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        const unreadList = notifications.filter(n => n.is_read === false);
        const unreadCount = unreadList.length;

        if (notifCountBadge) {
            if (unreadCount > 0) {
                notifCountBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                notifCountBadge.style.display = 'inline-block';
            } else {
                notifCountBadge.style.display = 'none';
            }
        }

        if (notifCountText) {
            notifCountText.textContent = `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`;
        }

        if (!notifications || notifications.length === 0) {
            notifListContainer.innerHTML = '<div style="padding: 15px; text-align: center; color: var(--text-muted); font-size: 11px;">Aucune notification</div>';
            return;
        }

        notifListContainer.innerHTML = notifications.map(notif => {
            let iconClass = 'fas fa-info-circle';
            let iconColor = '#10b981';

            if (notif.type === 'warning') {
                iconClass = 'fas fa-exclamation-triangle';
                iconColor = '#f59e0b';
            } else if (notif.type === 'danger' || notif.type === 'error') {
                iconClass = 'fas fa-times-circle';
                iconColor = '#ef4444';
            }

            const timeAgo = formatTimeAgo(notif.created_at);
            const bgStyle = notif.is_read ? 'background: transparent;' : 'background: rgba(16, 185, 129, 0.05);';
            const safeNotif = encodeURIComponent(JSON.stringify(notif));

            return `
                <div class="notif-item" style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.2s; ${bgStyle}" onclick="openNotificationDetail('${safeNotif}')">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <div style="color: ${iconColor}; font-size: 13px; margin-top: 2px;"><i class="${iconClass}"></i></div>
                        <div style="flex: 1; overflow: hidden;">
                            <div style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(notif.title)}</div>
                            <div style="font-size: 10px; color: var(--text-muted); line-height: 1.3; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(notif.message)}</div>
                            <div style="font-size: 9px; color: rgba(255,255,255,0.3);">${timeAgo}</div>
                        </div>
                        ${!notif.is_read ? '<div style="width: 6px; height: 6px; background: var(--primary-glow); border-radius: 50%; margin-top: 4px; flex-shrink: 0;"></div>' : ''}
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Erreur chargement notifications:", err);
    }
};

/**
 * Ouvre le Modal, affiche le message complet et marque DIRECTEMENT comme lu
 */
window.openNotificationDetail = async function(encodedNotif) {
    try {
        const notif = JSON.parse(decodeURIComponent(encodedNotif));
        
        document.getElementById('modalNotifTitle').textContent = notif.title;
        document.getElementById('modalNotifMessage').textContent = notif.message;
        document.getElementById('modalNotifDate').textContent = `Reçu le : ${new Date(notif.created_at).toLocaleString('fr-FR')}`;
        document.getElementById('modalNotifTypeBadge').textContent = notif.type.toUpperCase();

        const iconEl = document.getElementById('modalNotifIcon');
        if (notif.type === 'warning') {
            iconEl.className = 'fas fa-exclamation-triangle';
            iconEl.style.color = '#f59e0b';
        } else if (notif.type === 'danger' || notif.type === 'error') {
            iconEl.className = 'fas fa-times-circle';
            iconEl.style.color = '#ef4444';
        } else {
            iconEl.className = 'fas fa-info-circle';
            iconEl.style.color = '#10b981';
        }

        document.getElementById('smtgNotifModal').style.display = 'flex';

        const notifDropdown = document.getElementById('notifDropdown');
        if (notifDropdown) notifDropdown.style.display = 'none';

        if (!notif.is_read) {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, updated_at: new Date().toISOString() })
                .eq('id', notif.id);

            if (!error) {
                await fetchAndRenderNotifications();
            }
        }
    } catch (err) {
        console.error("Erreur ouverture modal:", err);
    }
};

/**
 * Fermer le Modal
 */
window.closeNotificationModal = function() {
    const modal = document.getElementById('smtgNotifModal');
    if (modal) modal.style.display = 'none';
};

/**
 * Configuration Realtime Supabase
 */
function setupRealtimeNotifications() {
    if (notificationsChannel) return;

    notificationsChannel = supabase
        .channel('public:notifications')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications'
        }, payload => {
            const newNotif = payload.new;
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (!session || !session.user) return;
                const userId = session.user.id;

                if (!newNotif.user_id || newNotif.user_id === userId) {
                    fetchAndRenderNotifications();
                }
            });
        })
        .subscribe();
}

function formatTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return "À l'instant";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} j`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initNotifications, 500);
});
