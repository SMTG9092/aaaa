/**
 * ============================================================
 * SoufStock Enterprise ERP/WMS
 * assets/js/core/security.js
 * ============================================================
 * Enterprise Security & Access Control Guard
 * ES2023 | ES Modules | Production Ready
 * ============================================================
 */

"use strict";

import supabase from './supabase.js';
import SessionManager from './session.js';

const SecurityManager = {

    /**
     * التحقق من الجلسة، نشاط الحساب، وصلاحية الوصول للصفحة
     * @param {string} pageCode - كود الصفحة
     * @returns {Promise<boolean>}
     */
    async protectPage(pageCode = 'index_stock') {
        try {
            const isAuthenticated = await SessionManager.requireAuth();
            if (!isAuthenticated) {
                return false;
            }

            const profile = await SessionManager.getProfile();
            if (!profile || !profile.id) {
                await SessionManager.logout();
                return false;
            }

            const { data: userRecord, error: userError } = await supabase
                .from('user_profiles')
                .select('actif, role_id')
                .eq('id', profile.id)
                .maybeSingle();

            if (userError || !userRecord || !userRecord.actif) {
                alert("Accès refusé : Votre compte est inactif ou introuvable.");
                await SessionManager.logout();
                return false;
            }

            // Ila kan l-user ando role_id = 1 (Admin), 3tih l-accès direct bla ma t-vérifi rpc
            if (Number(userRecord.role_id) === 1) {
                return true;
            }

            if (!pageCode || pageCode === 'index_stock') {
                return true;
            }

            const { data: hasAccess, error: rpcError } = await supabase
                .rpc('check_user_page_access', { 
                    p_user_id: profile.id, 
                    p_page_code: pageCode 
                });

            if (rpcError || !hasAccess) {
                alert("Alerte Sécurité : Vous n'avez pas l'autorisation d'accéder à cette page.");
                window.location.replace("index-stock.html");
                return false;
            }

            return true;

        } catch (err) {
            console.error("Erreur de sécurité critique:", err);
            await SessionManager.logout();
            return false;
        }
    }
};

export default SecurityManager;
