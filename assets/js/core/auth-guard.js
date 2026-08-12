import supabase, { getUser } from "./supabase.js";

/**
 * Kat-tbaqqeq l-permissions dyal s-safha 3la ḥsab l-pages w actions
 * @param {string} pageCode - Code dyal s-safha (ex: 'stock')
 */
export async function applyPagePermissions(pageCode) {
    try {
        const user = await getUser();
        if (!user) {
            window.location.href = "index.html";
            return;
        }

        // 1. Jib l-profile w role_id dyal l-utilisateur
        const { data: profile, error: profError } = await supabase
            .from("profiles")
            .select("role_id, role")
            .eq("id", user.id)
            .single();

        if (profError || !profile) return;

        // Ila kan Admin (kamel l-soloriat)
        if (profile.role === 'admin') {
            document.querySelectorAll("[data-permission]").forEach(el => {
                el.style.display = "";
                if (el.tagName === 'INPUT' || el.tagName === 'BUTTON') el.disabled = false;
            });
            return;
        }

        // 2. Jib les actions autorisées l had role f had s-safha mn page_actions
        const { data: userPerms, error: permError } = await supabase
            .from("role_permissions")
            .select(`
                autorise,
                page_actions!inner (
                    pages!inner (code),
                    actions!inner (code)
                )
            `)
            .eq("role_id", profile.role_id)
            .eq("autorise", true);

        if (permError) throw permError;

        // 3. Jma3 l-actions li 3ndo fihom lhaq f had s-safha
        const allowedActions = new Set();
        (userPerms || []).forEach(rp => {
            const pa = rp.page_actions;
            if (pa && pa.pages && pa.pages.code === pageCode && pa.actions) {
                allowedActions.add(pa.actions.code); // ex: 'view', 'ajouter', 'modifier', 'supprimer', 'imprimer'
            }
        });

        // 4. Appliquer 3la l-elements f s-safha
        document.querySelectorAll("[data-permission]").forEach(el => {
            const actionCode = el.getAttribute("data-permission"); // ex: 'ajouter', 'modifier'
            
            if (!allowedActions.has(actionCode)) {
                el.style.display = "none"; // Khfi l-zir ila makanch 3ndo lhaq
            } else {
                el.style.display = "";
            }
        });

    } catch (err) {
        console.error("Erreur applyPagePermissions:", err.message);
    }
}
