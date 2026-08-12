import supabase from "../core/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Charger les graphiques (Charts)
    initCharts();

    // 2. Charger les données réelles depuis la table mouvements_stock
    await loadDashboardData();
});

/* ============================================================
 * INIT CHARTS
 * ============================================================ */
function initCharts() {
    // Chart 1: Entrées vs Sorties
    const ctxLines = document.getElementById('entriesExitsChart');
    if (ctxLines) {
        new Chart(ctxLines, {
            type: 'line',
            data: {
                labels: ['19/06', '20/06', '21/06', '22/06', '23/06', '24/06', '25/06'],
                datasets: [
                    {
                        label: 'Entrées (KG)',
                        data: [150000, 110000, 180000, 100000, 160000, 90000, 120000],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Sorties (KG)',
                        data: [50000, 130000, 80000, 60000, 40000, 110000, 130000],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
                scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.03)' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.03)' } }
                }
            }
        });
    }

    // Chart 2: Stock par Magasin (Donut)
    const ctxDonut = document.getElementById('stockMagasinChart');
    if (ctxDonut) {
        new Chart(ctxDonut, {
            type: 'doughnut',
            data: {
                labels: ['ABPG', 'AB10', 'Congelé', 'Autres'],
                datasets: [{
                    data: [652120, 321450, 198300, 77862],
                    backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                cutout: '75%'
            }
        });
    }
}

/* ============================================================
 * LOAD DATA FROM SUPABASE (mouvements_stock)
 * ============================================================ */
async function loadDashboardData() {
    try {
        const { data: mouvements, error } = await supabase
            .from('mouvements_stock')
            .select('date_mouvement, type_mouvement, article, lot, emplacement, quantite, magasin')
            .order('date_mouvement', { ascending: false })
            .limit(5);

        if (error) {
            console.error("Erreur chargement mouvements_stock:", error.message);
            return;
        }

        const tbody = document.getElementById('mouvementsTableBody');
        if (!tbody || !mouvements) return;

        let html = '';
        mouvements.forEach(item => {
            const isEntree = ['AJOUT', 'IMPORT', 'RETOUR'].includes(item.type_mouvement);
            const badgeClass = isEntree ? 'bg-success' : 'bg-danger';
            
            let formattedDate = '';
            if (item.date_mouvement) {
                const d = new Date(item.date_mouvement);
                formattedDate = d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            }

            html += `
                <tr>
                    <td>${formattedDate}</td>
                    <td><span class="badge ${badgeClass}">${item.type_mouvement}</span></td>
                    <td>${item.article || ''}</td>
                    <td>${item.lot || ''}</td>
                    <td>${item.emplacement || ''}</td>
                    <td>${item.quantite || ''}</td>
                    <td>${item.magasin || ''}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;

    } catch (err) {
        console.error("Erreur de connexion Supabase:", err);
    }
}
