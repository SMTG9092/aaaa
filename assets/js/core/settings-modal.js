/**
 * Module Paramètre Utilisateur (Langue, Thème, Mot de passe)
 * SMTG - Système de Management et de Traçabilité Globale
 */

import supabase from './supabase.js';

export function initSettingsModal() {
    createSettingsModalDOM();

    // Appliquer le thème stocké dès le chargement
    const savedTheme = localStorage.getItem('smtg_theme') || 'dark';
    applyTheme(savedTheme);

    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('smtgSettingsModal');

    if (!settingsBtn || !settingsModal) return;

    settingsBtn.addEventListener('click', async () => {
        settingsModal.style.display = 'flex';
        await loadUserSettings();
    });
}

function createSettingsModalDOM() {
    if (document.getElementById('smtgSettingsModal')) return;

    const modalHTML = `
        <div id="smtgSettingsModal" style="display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center;">
            <div style="background: var(--card-bg, #111b24); border: 1px solid var(--card-border, rgba(16, 185, 129, 0.2)); width: 480px; max-width: 90%; border-radius: 14px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); overflow: hidden;">
                
                <div style="padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-cog" style="color: var(--primary-glow); font-size: 16px;"></i>
                        <h3 style="font-size: 13px; font-weight: 700; color: var(--text-main, #fff); margin: 0;">Paramètres du Compte</h3>
                    </div>
                    <button onclick="closeSettingsModal()" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px;"><i class="fas fa-times"></i></button>
                </div>

                <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px;">
                    
                    <div>
                        <label style="display: block; font-size: 11px; font-weight: 600; color: var(--text-sub, #cbd5e1); margin-bottom: 6px;">
                            <i class="fas fa-language" style="margin-right: 6px; color: var(--primary-glow);"></i> Langue de l'application
                        </label>
                        <select id="settingsLangSelect" style="width: 100%; background: var(--input-bg, rgba(0,0,0,0.3)); border: 1px solid var(--input-border, rgba(255,255,255,0.1)); color: var(--text-main, #fff); padding: 10px; border-radius: 8px; font-size: 12px; outline: none;">
                            <option value="fr">Français</option>
                            <option value="ar">العربية</option>
                            <option value="en">English</option>
                        </select>
                    </div>

                    <div>
                        <label style="display: block; font-size: 11px; font-weight: 600; color: var(--text-sub, #cbd5e1); margin-bottom: 6px;">
                            <i class="fas fa-palette" style="margin-right: 6px; color: var(--primary-glow);"></i> Thème visuel
                        </label>
                        <select id="settingsThemeSelect" style="width: 100%; background: var(--input-bg, rgba(0,0,0,0.3)); border: 1px solid var(--input-border, rgba(255,255,255,0.1)); color: var(--text-main, #fff); padding: 10px; border-radius: 8px; font-size: 12px; outline: none;">
                            <option value="dark">Sombre (Dark)</option>
                            <option value="light">Clair (Light)</option>
                        </select>
                    </div>

                    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 4px 0;">

                    <div>
                        <label style="display: block; font-size: 11px; font-weight: 600; color: var(--text-sub, #cbd5e1); margin-bottom: 6px;">
                            <i class="fas fa-lock" style="margin-right: 6px; color: var(--primary-glow);"></i> Modifier le mot de passe
                        </label>
                        <input type="password" id="settingsNewPassword" placeholder="Nouveau mot de passe" style="width: 100%; background: var(--input-bg, rgba(0,0,0,0.3)); border: 1px solid var(--input-border, rgba(255,255,255,0.1)); color: var(--text-main, #fff); padding: 10px; border-radius: 8px; font-size: 12px; outline: none; margin-bottom: 8px; box-sizing: border-box;">
                        <input type="password" id="settingsConfirmPassword" placeholder="Confirmer le nouveau mot de passe" style="width: 100%; background: var(--input-bg, rgba(0,0,0,0.3)); border: 1px solid var(--input-border, rgba(255,255,255,0.1)); color: var(--text-main, #fff); padding: 10px; border-radius: 8px; font-size: 12px; outline: none; box-sizing: border-box;">
                    </div>

                    <div id="settingsAlertBox" style="display: none; padding: 10px; border-radius: 6px; font-size: 11px; text-align: center;"></div>

                </div>

                <div style="padding: 12px 20px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: flex-end; gap: 10px;">
                    <button onclick="closeSettingsModal()" style="background: transparent; color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1); padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">Annuler</button>
                    <button onclick="saveUserSettings()" style="background: var(--primary-glow); color: #000; border: none; padding: 6px 16px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">Enregistrer</button>
                </div>

            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function loadUserSettings() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
            console.warn("Aucune session active détectée.");
            return;
        }

        console.log("Utilisateur connecté actuellement (ID):", session.user.id);

        const { data, error } = await supabase
            .from('user_profiles')
            .select('langue, theme')
            .eq('id', session.user.id)
            .single();

        if (error) throw error;

        if (data) {
            if (data.langue) document.getElementById('settingsLangSelect').value = data.langue;
            if (data.theme) {
                document.getElementById('settingsThemeSelect').value = data.theme;
                applyTheme(data.theme);
            }
        }
    } catch (err) {
        console.error("Erreur chargement paramètres utilisateur:", err);
    }
}

window.saveUserSettings = async function() {
    const lang = document.getElementById('settingsLangSelect').value;
    const theme = document.getElementById('settingsThemeSelect').value;
    const newPassword = document.getElementById('settingsNewPassword').value;
    const confirmPassword = document.getElementById('settingsConfirmPassword').value;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
            showAlert("Erreur : Aucun utilisateur connecté.", "error");
            return;
        }

        const currentUserId = session.user.id;
        console.log("Mise à jour des paramètres pour l'utilisateur ID:", currentUserId);

        // 1. Mettre à jour uniquement la ligne de l'utilisateur connecté dans user_profiles
        const { data: updateData, error: profileError } = await supabase
            .from('user_profiles')
            .update({ 
                langue: lang, 
                theme: theme, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', currentUserId)
            .select();

        if (profileError) throw profileError;
        console.log("Profil mis à jour avec succès dans la base :", updateData);

        // 2. Appliquer le thème instantanément
        applyTheme(theme);

        // 3. Mettre à jour le mot de passe si rempli
        if (newPassword || confirmPassword) {
            if (newPassword !== confirmPassword) {
                showAlert("Les mots de passe ne correspondent pas.", "error");
                return;
            }
            if (newPassword.length < 6) {
                showAlert("Le mot de passe doit contenir au moins 6 caractères.", "error");
                return;
            }

            const { error: pwdError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (pwdError) throw pwdError;
            console.log("Mot de passe mis à jour avec succès via Supabase Auth.");
        }

        showAlert("Paramètres enregistrés avec succès !", "success");

        setTimeout(() => {
            closeSettingsModal();
        }, 1500);

    } catch (err) {
        console.error("Erreur lors de la sauvegarde :", err);
        showAlert("Erreur : " + err.message, "error");
    }
};

function applyTheme(themeName) {
    localStorage.setItem('smtg_theme', themeName);
    document.documentElement.setAttribute('data-theme', themeName);

    const root = document.documentElement;
    if (themeName === 'light') {
        root.style.setProperty('--card-bg', '#ffffff');
        root.style.setProperty('--card-border', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--text-main', '#0f172a');
        root.style.setProperty('--text-sub', '#475569');
        root.style.setProperty('--input-bg', '#f8fafc');
        root.style.setProperty('--input-border', '#cbd5e1');
        document.body.style.backgroundColor = '#f1f5f9';
        document.body.style.color = '#0f172a';
    } else {
        root.style.setProperty('--card-bg', '#111b24');
        root.style.setProperty('--card-border', 'rgba(16, 185, 129, 0.2)');
        root.style.setProperty('--text-main', '#ffffff');
        root.style.setProperty('--text-sub', '#cbd5e1');
        root.style.setProperty('--input-bg', 'rgba(0,0,0,0.3)');
        root.style.setProperty('--input-border', 'rgba(255,255,255,0.1)');
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
    }
}

window.closeSettingsModal = function() {
    const modal = document.getElementById('smtgSettingsModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('settingsNewPassword').value = '';
        document.getElementById('settingsConfirmPassword').value = '';
        document.getElementById('settingsAlertBox').style.display = 'none';
    }
};

function showAlert(message, type) {
    const alertBox = document.getElementById('settingsAlertBox');
    alertBox.style.display = 'block';
    alertBox.textContent = message;
    if (type === 'success') {
        alertBox.style.background = 'rgba(16, 185, 129, 0.1)';
        alertBox.style.color = '#10b981';
        alertBox.style.border = '1px solid rgba(16, 185, 129, 0.2)';
    } else {
        alertBox.style.background = 'rgba(239, 68, 68, 0.1)';
        alertBox.style.color = '#ef4444';
        alertBox.style.border = '1px solid rgba(239, 68, 68, 0.2)';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initSettingsModal, 500);
});
