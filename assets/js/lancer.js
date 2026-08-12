import supabase, { getUser } from "./core/supabase.js";

const els = {
    userName: document.getElementById("user-name"),
    statAttente: document.getElementById("stat-attente"),
    statLancee: document.getElementById("stat-lancee"),
    statPicking: document.getElementById("stat-picking"),
    radioModes: document.getElementsByName("mode"),
    tbody: document.getElementById("commandes-table-body"),
    thead: document.getElementById("table-head"),
    btnLancerTout: document.getElementById("btn-lancer-tout")
};

document.addEventListener("DOMContentLoaded", async () => {
    const user = await getUser();
    els.userName.textContent = user?.email || "Administrateur";
    
    initDateCheckboxes();

    els.radioModes.forEach(radio => radio.addEventListener("change", loadDashboard));
    
    injectChoiceModal();

    if (els.btnLancerTout) {
        els.btnLancerTout.addEventListener("click", openLancerChoiceModal);
    }
    
    loadDashboard();
});

function initDateCheckboxes() {
    const container = document.getElementById("days-checkbox-container");
    if (!container) return;

    let html = '';
    const today = new Date();

    for (let i = 0; i <= 6; i++) {
        let d = new Date();
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        let labelName = i === 0 ? "Aujourd'hui (J)" : `J+${i}`;
        let isChecked = (i <= 1) ? 'checked' : '';

        html += `
            <label class="flex flex-col p-2.5 bg-gray-900 rounded border border-gray-700 hover:border-indigo-500 cursor-pointer transition text-center shadow-sm">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-indigo-300">${labelName}</span>
                    <input type="checkbox" name="target-date-chk" value="${dateStr}" ${isChecked} class="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500">
                </div>
                <span class="text-xs font-semibold text-gray-200">${dateStr}</span>
            </label>
        `;
    }
    container.innerHTML = html;

    document.querySelectorAll('input[name="target-date-chk"]').forEach(chk => {
        chk.addEventListener("change", loadDashboard);
    });
}

function getTargetDates() {
    const checkboxes = document.querySelectorAll('input[name="target-date-chk"]:checked');
    let dates = [];
    checkboxes.forEach(chk => {
        dates.push(chk.value);
    });
    return dates;
}

async function loadDashboard() {
    const dates = getTargetDates();
    const mode = document.querySelector('input[name="mode"]:checked')?.value || 'commande';

    if (dates.length === 0) {
        els.tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-500">Veuillez sélectionner au moins un jour de livraison</td></tr>`;
        if (els.statAttente) els.statAttente.textContent = 0;
        if (els.statLancee) els.statLancee.textContent = 0;
        if (els.statPicking) els.statPicking.textContent = 0;
        return;
    }

    const { data: commandesExcel, error: errExcel } = await supabase.from("commandes_excel")
        .select("*")
        .in("date_livraison", dates);

    const { data: qtaPieces, error: errPieces } = await supabase.from("commandes_clients_pieces")
        .select("*")
        .in("date_livraison", dates);

    if (errExcel) console.error("Erreur commandes_excel:", errExcel);
    if (errPieces) console.error("Erreur commandes_clients_pieces:", errPieces);

    const commandes = commandesExcel || [];
    const piecesData = qtaPieces || [];

    if (els.statAttente) els.statAttente.textContent = commandes.filter(c => c.statut === 'IMPORTEE' || !c.statut).length;
    if (els.statLancee) els.statLancee.textContent = commandes.filter(c => c.statut === 'LANCEE').length;
    if (els.statPicking) els.statPicking.textContent = commandes.filter(c => c.statut === 'EN_PICKING').length;

    renderTableComplet(commandes, piecesData, mode);
}

function renderTableComplet(commandes, piecesData, mode) {
    if (mode === 'tournee') {
        els.thead.innerHTML = `
            <tr>
                <th class="p-3">Tournée (Itinéraire)</th>
                <th class="p-3">Nombre Commandes</th>
                <th class="p-3">Poids Total (KG)</th>
                <th class="p-3">Nombre de Pièces</th>
                <th class="p-3">Action</th>
            </tr>
        `;

        const tourneeMap = {};
        
        // 1. Hisab l-commandes w l-poids mn commandes_excel (quantite_commandee)
        commandes.forEach(c => {
            const t = (c.itineraire || c.tournee || c.code_tournee || "Standard").trim();
            if (!tourneeMap[t]) {
                tourneeMap[t] = { docs: new Set(), weight: 0, pieces: 0 };
            }
            tourneeMap[t].docs.add(c.document_vente);
            tourneeMap[t].weight += Number(c.quantite_commandee || 0);
        });

        // 2. Hisab l-pièces mn commandes_clients_pieces
        piecesData.forEach(p => {
            const t = (p.itineraire || p.tournee || p.code_tournee || "Standard").trim();
            if (!tourneeMap[t]) {
                tourneeMap[t] = { docs: new Set(), weight: 0, pieces: 0 };
            }
            tourneeMap[t].pieces += Number(p.nombre_pieces || 0);
        });

        const entries = Object.entries(tourneeMap);
        els.tbody.innerHTML = entries.length ? entries.map(([tournee, info]) => `
            <tr class="border-b border-gray-700 hover:bg-gray-750">
                <td class="p-3 font-semibold text-gray-200">${tournee}</td>
                <td class="p-3 text-indigo-300">${info.docs.size} commande(s)</td>
                <td class="p-3 text-green-400 font-bold">${info.weight.toFixed(2)} KG</td>
                <td class="p-3 text-yellow-400 font-bold">${info.pieces}</td>
                <td class="p-3">
                    <button onclick="window.lancerTournee('${tournee.replace(/'/g, "\\'")}')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1">
                        <i class="fas fa-print"></i> Lancer Tournée
                    </button>
                </td>
            </tr>
        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-500">Aucune tournée trouvée</td></tr>`;

    } else {
        els.thead.innerHTML = `
            <tr>
                <th class="p-3">Doc Vente</th>
                <th class="p-3">Client</th>
                <th class="p-3">Date Livraison</th>
                <th class="p-3">Statut</th>
                <th class="p-3">Action</th>
            </tr>
        `;

        const uniqueCommandesMap = new Map();
        commandes.forEach(c => {
            if (!uniqueCommandesMap.has(c.document_vente)) {
                uniqueCommandesMap.set(c.document_vente, c);
            }
        });

        const uniqueCommandes = Array.from(uniqueCommandesMap.values());

        els.tbody.innerHTML = uniqueCommandes.length ? uniqueCommandes.map(c => `
            <tr class="border-b border-gray-700 hover:bg-gray-750">
                <td class="p-3 font-semibold text-indigo-300">${c.document_vente || '-'}</td>
                <td class="p-3 text-gray-200">${c.nom_receptionnaire || c.client || '-'}</td>
                <td class="p-3 text-gray-400">${c.date_livraison || '-'}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded text-xs font-bold ${c.statut === 'LANCEE' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}">
                        ${c.statut || 'IMPORTEE'}
                    </span>
                </td>
                <td class="p-3">
                    <button onclick="window.lancerCommande('${c.document_vente}')" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1">
                        <i class="fas fa-print"></i> Lancer &amp; Imprimer
                    </button>
                </td>
            </tr>
        `).join('') : `<tr><td colspan="5" class="p-6 text-center text-gray-500">Aucune commande trouvée</td></tr>`;
    }
}

function injectChoiceModal() {
    if (document.getElementById('lancer-choice-modal')) return;

    const modalHTML = `
        <div id="lancer-choice-modal" class="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center hidden">
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 w-96 shadow-2xl text-center space-y-4">
                <h3 class="text-lg font-bold text-white">Mode de Lancement Global</h3>
                <p class="text-sm text-gray-300">Comment souhaitez-vous lancer et imprimer les éléments affichés ?</p>
                <div class="flex flex-col gap-3 pt-2">
                    <button id="btn-choice-tournee" class="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded font-bold text-sm transition shadow">
                        Par Tournée (Regroupé)
                    </button>
                    <button id="btn-choice-commande" class="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded font-bold text-sm transition shadow">
                        Par Commande (Individuel)
                    </button>
                </div>
                <button id="btn-choice-cancel" class="text-gray-400 hover:text-white text-xs underline pt-2">Annuler</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('btn-choice-cancel').addEventListener('click', closeLancerChoiceModal);
    document.getElementById('btn-choice-tournee').addEventListener('click', () => {
        closeLancerChoiceModal();
        lancerToutParTournee();
    });
    document.getElementById('btn-choice-commande').addEventListener('click', () => {
        closeLancerChoiceModal();
        lancerToutParCommande();
    });
}

function openLancerChoiceModal() {
    document.getElementById('lancer-choice-modal').classList.remove('hidden');
}

function closeLancerChoiceModal() {
    document.getElementById('lancer-choice-modal').classList.add('hidden');
}

async function lancerToutParTournee() {
    const dates = getTargetDates();
    if (dates.length === 0) {
        alert("Veuillez sélectionner au moins une date.");
        return;
    }
    const user = await getUser();
    const numLancementVal = "TOURALL-" + Date.now();

    const { data: commandesList, error: fetchErr } = await supabase.from("commandes_excel")
        .select("*")
        .in("date_livraison", dates);

    if (fetchErr || !commandesList || commandesList.length === 0) {
        alert("Aucune commande à lancer.");
        return;
    }

    await supabase.from("commandes_excel")
        .update({ statut: 'LANCEE' })
        .in("date_livraison", dates);

    const tourneeMap = {};
    const uniqueDocsMap = new Map();
    
    commandesList.forEach(cmd => {
        const t = cmd.itineraire || "Standard";
        if (!tourneeMap[t]) tourneeMap[t] = [];
        tourneeMap[t].push(cmd);

        if (!uniqueDocsMap.has(cmd.document_vente)) {
            uniqueDocsMap.set(cmd.document_vente, cmd);
        }
    });

    const suiviRows = Array.from(uniqueDocsMap.values()).map(cmd => ({
        commande_id: cmd.id,
        historique_import_id: cmd.historique_import_id || 1,
        document_vente: cmd.document_vente,
        client: cmd.nom_receptionnaire || cmd.client || "Client Inconnu",
        date_creation: cmd.date_creation || new Date().toISOString().split('T')[0],
        date_livraison: cmd.date_livraison,
        heure_livraison: cmd.heure_livraison || null,
        itineraire: cmd.itineraire || "Standard",
        statut: 'LANCEE',
        lance_par: user?.id || null,
        date_lancement: new Date().toISOString(),
        num_lancement: numLancementVal
    }));

    await supabase.from("suivi_commandes_lancer").upsert(suiviRows, { onConflict: 'document_vente' });

    Object.keys(tourneeMap).forEach(tourneeName => {
        window.open(`print-bon-Tournee.html?tournee=${encodeURIComponent(tourneeName)}&dates=${encodeURIComponent(dates.join(','))}`, '_blank');
    });

    loadDashboard();
}

async function lancerToutParCommande() {
    const dates = getTargetDates();
    if (dates.length === 0) {
        alert("Veuillez sélectionner au moins une date.");
        return;
    }
    const user = await getUser();
    const numLancementVal = "ALL-" + Date.now();

    const { data: commandesList, error: fetchErr } = await supabase.from("commandes_excel")
        .select("*")
        .in("date_livraison", dates);

    if (fetchErr || !commandesList || commandesList.length === 0) {
        alert("Aucune commande à lancer.");
        return;
    }

    await supabase.from("commandes_excel")
        .update({ statut: 'LANCEE' })
        .in("date_livraison", dates);

    const uniqueDocsMap = new Map();
    commandesList.forEach(cmd => {
        if (!uniqueDocsMap.has(cmd.document_vente)) {
            uniqueDocsMap.set(cmd.document_vente, cmd);
        }
    });

    const suiviRows = Array.from(uniqueDocsMap.values()).map(cmd => ({
        commande_id: cmd.id,
        historique_import_id: cmd.historique_import_id || 1,
        document_vente: cmd.document_vente,
        client: cmd.nom_receptionnaire || cmd.client || "Client Inconnu",
        date_creation: cmd.date_creation || new Date().toISOString().split('T')[0],
        date_livraison: cmd.date_livraison,
        heure_livraison: cmd.heure_livraison || null,
        itineraire: cmd.itineraire || "Standard",
        statut: 'LANCEE',
        lance_par: user?.id || null,
        date_lancement: new Date().toISOString(),
        num_lancement: numLancementVal
    }));

    await supabase.from("suivi_commandes_lancer").upsert(suiviRows, { onConflict: 'document_vente' });

    uniqueDocsMap.forEach((_, docVente) => {
        window.open(`print-bon.html?cmd=${encodeURIComponent(docVente)}`, '_blank');
    });

    loadDashboard();
}

window.lancerCommande = async function(docVente) {
    if (!docVente || docVente === '-') {
        alert("Numéro de document de vente invalide.");
        return;
    }

    const { data: cmdRows, error: cmdFetchError } = await supabase
        .from("commandes_excel")
        .select("*")
        .eq("document_vente", docVente)
        .limit(1);

    if (cmdFetchError || !cmdRows || cmdRows.length === 0) {
        alert("Erreur: Commande introuvable.");
        return;
    }

    const cmdData = cmdRows[0];

    await supabase.from("commandes_excel").update({ statut: 'LANCEE' }).eq("document_vente", docVente);

    const user = await getUser();
    const numLancementVal = "LANC-" + Date.now();

    const suiviPayload = {
        commande_id: cmdData.id,
        historique_import_id: cmdData.historique_import_id || 1,
        document_vente: cmdData.document_vente,
        client: cmdData.nom_receptionnaire || cmdData.client || "Client Inconnu",
        date_creation: cmdData.date_creation || new Date().toISOString().split('T')[0],
        date_livraison: cmdData.date_livraison,
        heure_livraison: cmdData.heure_livraison || null,
        itineraire: cmdData.itineraire || "Standard",
        statut: 'LANCEE',
        lance_par: user?.id || null,
        date_lancement: new Date().toISOString(),
        num_lancement: numLancementVal
    };

    await supabase.from("suivi_commandes_lancer").upsert(suiviPayload, { onConflict: 'document_vente' });

    loadDashboard();
    window.open(`print-bon.html?cmd=${encodeURIComponent(docVente)}`, '_blank');
};

window.lancerTournee = async function(tourneeName) {
    const dates = getTargetDates();
    const user = await getUser();
    const numLancementVal = "TOUR-" + Date.now();

    const { data: commandesList, error: fetchErr } = await supabase
        .from("commandes_excel")
        .select("*")
        .in("date_livraison", dates)
        .ilike("itineraire", tourneeName);

    if (fetchErr || !commandesList || commandesList.length === 0) {
        alert("Aucune commande trouvée pour cette tournée.");
        return;
    }

    await supabase.from("commandes_excel")
        .update({ statut: 'LANCEE' })
        .in("date_livraison", dates)
        .ilike("itineraire", tourneeName);

    const uniqueDocsMap = new Map();
    commandesList.forEach(cmd => {
        if (!uniqueDocsMap.has(cmd.document_vente)) {
            uniqueDocsMap.set(cmd.document_vente, cmd);
        }
    });

    const suiviRows = Array.from(uniqueDocsMap.values()).map(cmd => ({
        commande_id: cmd.id,
        historique_import_id: cmd.historique_import_id || 1,
        document_vente: cmd.document_vente,
        client: cmd.nom_receptionnaire || cmd.client || "Client Inconnu",
        date_creation: cmd.date_creation || new Date().toISOString().split('T')[0],
        date_livraison: cmd.date_livraison,
        heure_livraison: cmd.heure_livraison || null,
        itineraire: tourneeName,
        statut: 'LANCEE',
        lance_par: user?.id || null,
        date_lancement: new Date().toISOString(),
        num_lancement: numLancementVal
    }));

    await supabase.from("suivi_commandes_lancer").upsert(suiviRows, { onConflict: 'document_vente' });

    loadDashboard();
    window.open(`print-bon-Tournee.html?tournee=${encodeURIComponent(tourneeName)}&dates=${encodeURIComponent(dates.join(','))}`, '_blank');
};
