/* ============================================================
   SMTG - STOCK DASHBOARD CONTROLLER
   Compatible avec dashboard.html ci-dessous.
   Sources utilisées : stock, mouvements_stock, articles,
   emplacements, magasins.
   Aucun nouveau tableau / aucune nouvelle colonne.
   ============================================================ */

(function () {
    "use strict";

    const CONFIG = {
        TABLES: {
            STOCK: "stock",
            STOCK_SECURITE: "stock_securite",
            MOUVEMENTS: "mouvements_stock",
            ARTICLES: "articles",
            EMPLACEMENTS: "emplacements",
            MAGASINS: "magasins"
        },
        LIMITS: {
            STOCK: 10000,
            MOUVEMENTS: 2000,
            ARTICLES: 5000,
            EMPLACEMENTS: 5000,
            MAGASINS: 1000
        },
        DAYS_HISTORY: 7,
        TUNNEL_CAPACITY: 315000,
        DEBUG: true
    };

    let stockData = [];
    let mouvementsData = [];
    let articlesData = [];
    let emplacementsData = [];
    let magasinsData = [];
    let stockSecuriteData = [];

    let emplacementChart = null;
    let evolutionChart = null;
    let categoryChart = null;
    let dlcChart = null;
    let isLoading = false;
    let autoRefreshTimer = null;

    const $ = (id) => document.getElementById(id);

    function log(...args) {
        if (CONFIG.DEBUG) console.log("[SMTG STOCK]", ...args);
    }

    function warn(...args) {
        console.warn("[SMTG STOCK]", ...args);
    }

    function getSupabase() {
        if (window.supabaseClient && typeof window.supabaseClient.from === "function") {
            return window.supabaseClient;
        }
        if (window.supabase && typeof window.supabase.from === "function") {
            return window.supabase;
        }
        throw new Error("Client Supabase introuvable. Vérifiez votre config Supabase.");
    }

    function num(value) {
        if (value === null || value === undefined || value === "") return 0;
        const n = Number(String(value).replace(/\s/g, "").replace(",", "."));
        return Number.isFinite(n) ? n : 0;
    }

    function formatNumber(value, decimals = 0) {
        return num(value).toLocaleString("fr-FR", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function parseDate(value) {
        if (!value) return null;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function dateKey(value) {
        const d = parseDate(value);
        if (!d) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    function formatDateTime(value) {
        const d = parseDate(value);
        if (!d) return "-";
        return d.toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function movementSign(type) {
        const t = String(type || "").trim().toUpperCase();
        if (t === "ENTREE") return 1;
        if (t === "CONSOMMATION" || t === "SORTIE") return -1;
        // Un transfert ne modifie pas le stock global.
        return 0;
    }

    /* ============================================================
       CHARGEMENT DB
       ============================================================ */

    async function loadStock() {
        const sb = getSupabase();
        const { data, error } = await sb
            .from(CONFIG.TABLES.STOCK)
            .select(`
                id,
                historique_import_id,
                division,
                magasin,
                emplacement,
                article,
                designation_article,
                lot,
                quantite,
                unite,
                type_article,
                groupe_article,
                famille_article,
                controle_qualite,
                stock_reserve,
                stock_disponible,
                statut,
                date_import,
                created_at,
                updated_at
            `)
            .limit(CONFIG.LIMITS.STOCK);

        if (error) throw error;
        stockData = data || [];
        return stockData;
    }

    async function loadMouvements() {
        const sb = getSupabase();
        const { data, error } = await sb
            .from(CONFIG.TABLES.MOUVEMENTS)
            .select(`
                id,
                stock_id,
                document_vente,
                type_mouvement,
                article,
                designation_article,
                lot,
                magasin_source,
                magasin_destination,
                quantite,
                unite,
                utilisateur,
                commentaire,
                date_mouvement,
                created_at,
                updated_at
            `)
            .order("date_mouvement", { ascending: false })
            .limit(CONFIG.LIMITS.MOUVEMENTS);

        if (error) throw error;
        mouvementsData = data || [];
        return mouvementsData;
    }

    async function loadArticles() {
        const sb = getSupabase();
        const { data, error } = await sb
            .from(CONFIG.TABLES.ARTICLES)
            .select("id,article,designation,date_limite_vente,created_at")
            .limit(CONFIG.LIMITS.ARTICLES);

        if (error) throw error;
        articlesData = data || [];
        return articlesData;
    }

    async function loadStockSecurite() {
        const sb = getSupabase();
        try {
            const { data, error } = await sb
                .from(CONFIG.TABLES.STOCK_SECURITE)
                .select("*")
                .limit(10000);
            if (error) throw error;
            stockSecuriteData = data || [];
        } catch (error) {
            console.warn("[SMTG STOCK] stock_securite non disponible :", error.message);
            stockSecuriteData = [];
        }
        return stockSecuriteData;
    }

    async function loadEmplacements() {
        const sb = getSupabase();
        const { data, error } = await sb
            .from(CONFIG.TABLES.EMPLACEMENTS)
            .select("id,magasin_code,code_emplacement,libelle_emplacement,statut,created_at,updated_at")
            .limit(CONFIG.LIMITS.EMPLACEMENTS);

        if (error) throw error;
        emplacementsData = data || [];
        return emplacementsData;
    }

    async function loadMagasins() {
        const sb = getSupabase();
        const { data, error } = await sb
            .from(CONFIG.TABLES.MAGASINS)
            .select("id,code_magasin,libelle_magasin,gere_emplacement,description,statut,created_at,updated_at")
            .limit(CONFIG.LIMITS.MAGASINS);

        if (error) throw error;
        magasinsData = data || [];
        return magasinsData;
    }

    async function loadAllData() {
        await Promise.all([
            loadStock(),
            loadStockSecurite(),
            loadMouvements(),
            loadArticles(),
            loadEmplacements(),
            loadMagasins()
        ]);

        log("Données chargées", {
            stock: stockData.length,
            mouvements: mouvementsData.length,
            articles: articlesData.length,
            emplacements: emplacementsData.length,
            magasins: magasinsData.length
        });
    }

    /* ============================================================
       CALCULS
       ============================================================ */

    function calculateTotalStock() {
        return stockData.reduce((sum, row) => sum + num(row.stock_disponible), 0);
    }

    function calculateReferences() {
        return new Set(
            stockData
                .filter(r => num(r.stock_disponible) > 0 && r.article)
                .map(r => String(r.article))
        ).size;
    }

    function calculateLots() {
        return new Set(
            stockData
                .filter(r => num(r.stock_disponible) > 0 && r.lot)
                .map(r => String(r.lot))
        ).size;
    }

    function getSecurityRow(row) {
        const article = String(row.article || "").trim();
        if (!article) return null;
        return stockSecuriteData.find(s => String(s.article || "").trim() === article) || null;
    }

    function calculateAlertsRows() {
        return stockData
            .map(row => {
                const sec = getSecurityRow(row);
                if (!sec) return null;
                const min = Number(sec.min);
                if (!Number.isFinite(min)) return null;
                const available = num(row.stock_disponible);
                return { ...row, stock_min: min, stock_max: Number.isFinite(Number(sec.max)) ? Number(sec.max) : null, available };
            })
            .filter(row => row && row.available <= row.stock_min)
            .sort((a,b) => a.available - b.available);
    }

    function calculateAlerts() {
        return calculateAlertsRows().length;
    }

    function calculateStockByEmplacement() {
        const map = new Map();

        stockData.forEach(row => {
            const key = String(row.emplacement || "Autres").trim() || "Autres";
            const qty = num(row.stock_disponible);
            map.set(key, (map.get(key) || 0) + qty);
        });

        return [...map.entries()]
            .map(([emplacement, quantity]) => ({ emplacement, quantity }))
            .sort((a, b) => b.quantity - a.quantity);
    }

    function calculateStockByCategory() {
        const map = new Map();

        stockData.forEach(row => {
            const category = String(
                row.famille_article ||
                row.groupe_article ||
                row.type_article ||
                "Autres"
            ).trim() || "Autres";

            map.set(category, (map.get(category) || 0) + num(row.stock_disponible));
        });

        return [...map.entries()]
            .map(([category, quantity]) => ({ category, quantity }))
            .sort((a, b) => b.quantity - a.quantity);
    }

    function calculateDlcStatus(row) {
        const article = articlesData.find(a => String(a.article) === String(row.article));
        if (!article) return "Inconnu";

        const days = num(article.date_limite_vente);
        const base = parseDate(row.date_import || row.created_at);
        if (!days || !base) return "Inconnu";

        const dlc = new Date(base);
        dlc.setDate(dlc.getDate() + days);

        const diff = Math.ceil((dlc.getTime() - Date.now()) / 86400000);

        if (diff < 0) return "Expire";
        if (diff <= 15) return "1-15 jours";
        if (diff <= 30) return "15-30 jours";
        return "> 30 jours";
    }

    function calculateDlc() {
        const result = {
            "> 30 jours": 0,
            "15-30 jours": 0,
            "1-15 jours": 0,
            "Expire": 0,
            "Inconnu": 0
        };

        stockData.forEach(row => {
            const status = calculateDlcStatus(row);
            result[status] = (result[status] || 0) + num(row.stock_disponible);
        });

        return result;
    }

    function getRecentMovements() {
        return mouvementsData
            .slice()
            .sort((a, b) => {
                const da = parseDate(a.date_mouvement)?.getTime() || 0;
                const db = parseDate(b.date_mouvement)?.getTime() || 0;
                return db - da;
            })
            .slice(0, 5);
    }

    /* Historique réel des mouvements sur les 7 derniers jours.
       Si aucun mouvement n'existe un jour donné, la valeur est 0.
       On garde donc le graphique cohérent avec les données DB. */
    function calculateEvolution() {
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = CONFIG.DAYS_HISTORY - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            days.push(d);
        }

        return {
            labels: days.map(d => d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" })),
            values: days.map(d => {
                const key = dateKey(d);
                return mouvementsData.reduce((sum, m) => {
                    return dateKey(m.date_mouvement) === key
                        ? sum + movementSign(m.type_mouvement) * num(m.quantite)
                        : sum;
                }, 0);
            })
        };
    }

    /* Tunnels : aucune table tunnel n'est utilisée ici.
       On exploite uniquement les emplacements 401-404 présents
       dans la table stock, sans créer de nouvelle structure. */
    function calculateTunnels() {
        const names = ["401", "402", "403", "404"];

        return names.map(code => {
            const quantity = stockData.reduce((sum, row) => {
                const emplacement = String(row.emplacement || "").trim().toUpperCase();
                const magasin = String(row.magasin || "").trim().toUpperCase();
                const articleLocation = `${magasin} ${emplacement}`;

                if (
                    emplacement === code ||
                    emplacement === `TUNNEL ${code}` ||
                    emplacement === `T${code}` ||
                    articleLocation.includes(`TUNNEL ${code}`)
                ) {
                    return sum + num(row.stock_disponible);
                }
                return sum;
            }, 0);

            const percent = Math.min(100, (quantity / CONFIG.TUNNEL_CAPACITY) * 100);
            return { code, quantity, capacity: CONFIG.TUNNEL_CAPACITY, percent };
        });
    }

    /* ============================================================
       KPI
       ============================================================ */

    function renderKpis() {
        const total = calculateTotalStock();
        const refs = calculateReferences();
        const lots = calculateLots();
        const alerts = calculateAlerts();

        if ($("statTotalStockVal")) $("statTotalStockVal").textContent = formatNumber(total, 3);
        if ($("statTotalRefsVal")) $("statTotalRefsVal").textContent = formatNumber(refs);
        if ($("statTotalLotsVal")) $("statTotalLotsVal").textContent = formatNumber(lots);
        if ($("statTotalAlertsVal")) $("statTotalAlertsVal").textContent = formatNumber(alerts);
        if ($("statTotalValueVal")) $("statTotalValueVal").textContent = "—";

        const today = dateKey(new Date());
        const netToday = mouvementsData.reduce((sum, m) => {
            if (dateKey(m.date_mouvement) !== today) return sum;
            return sum + movementSign(m.type_mouvement) * num(m.quantite);
        }, 0);

        if ($("statTotalStockTrend")) {
            $("statTotalStockTrend").innerHTML = netToday >= 0
                ? `<i class="fas fa-arrow-up"></i> +${formatNumber(netToday,3)} KG net aujourd'hui`
                : `<i class="fas fa-arrow-down"></i> ${formatNumber(Math.abs(netToday),3)} KG net aujourd'hui`;
            $("statTotalStockTrend").style.color = netToday >= 0 ? "#10b981" : "#ef4444";
        }
        if ($("statTotalValueTrend")) $("statTotalValueTrend").textContent = "Prix non disponible dans la base";
        if ($("statTotalRefsTrend")) $("statTotalRefsTrend").textContent = `${formatNumber(refs)} références avec stock`;
        if ($("statTotalLotsTrend")) $("statTotalLotsTrend").textContent = `${formatNumber(lots)} lots avec stock`;
        if ($("statTotalAlertsTrend")) {
            $("statTotalAlertsTrend").textContent = `${formatNumber(alerts)} sous seuil`;
            $("statTotalAlertsTrend").style.color = alerts > 0 ? "#ef4444" : "#10b981";
        }
    }

    /* ============================================================
       CHARTS
       ============================================================ */

    function destroyChart(instance) {
        if (instance && typeof instance.destroy === "function") {
            try { instance.destroy(); } catch (_) {}
        }
        return null;
    }

    function renderStockChart() {
        if (typeof Chart === "undefined") return;
        const canvas = $("stockEmplacementChart");
        if (!canvas) return;

        const all = calculateStockByEmplacement();
        const main = all.filter(x => ["A407", "A408", "A409", "A411"].includes(String(x.emplacement).toUpperCase()));
        const others = all
            .filter(x => !["A407", "A408", "A409", "A411"].includes(String(x.emplacement).toUpperCase()))
            .reduce((sum, x) => sum + x.quantity, 0);

        if (others > 0) main.push({ emplacement: "Autres", quantity: others });
        if (!main.length) main.push({ emplacement: "Autres", quantity: 0 });

        emplacementChart = destroyChart(emplacementChart);
        emplacementChart = new Chart(canvas.getContext("2d"), {
            type: "doughnut",
            data: {
                labels: main.map(x => x.emplacement),
                datasets: [{ data: main.map(x => x.quantity), borderWidth: 1 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "58%",
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label} : ${formatNumber(ctx.raw, 3)} KG`
                        }
                    }
                }
            }
        });

        const total = main.reduce((s, x) => s + x.quantity, 0);
        const colors = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#64748b"];
        const legend = $("stockEmplacementLegend");
        if (legend) {
            legend.innerHTML = main.map((item, index) => {
                const pct = total > 0 ? item.quantity / total * 100 : 0;
                return `<div style="display:flex;justify-content:space-between;">
                    <span style="color:${colors[index % colors.length]}">&#9632; ${escapeHtml(item.emplacement)}</span>
                    <span>${formatNumber(pct, 1)}% (${formatNumber(item.quantity / 1000, 1)}K)</span>
                </div>`;
            }).join("");
        }
    }

    function renderEvolutionChart() {
        if (typeof Chart === "undefined") return;
        const canvas = $("stockEvolutionChart");
        if (!canvas) return;

        const evolution = calculateEvolution();
        evolutionChart = destroyChart(evolutionChart);
        evolutionChart = new Chart(canvas.getContext("2d"), {
            type: "line",
            data: {
                labels: evolution.labels,
                datasets: [{
                    label: "Mouvements nets",
                    data: evolution.values,
                    tension: 0.35,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${formatNumber(ctx.raw, 3)} KG`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: value => formatNumber(value, 0)
                        }
                    }
                }
            }
        });
    }

    function renderCategoryChart() {
        if (typeof Chart === "undefined") return;
        const canvas = $("stockCategoryChart");
        if (!canvas) return;

        let data = calculateStockByCategory();
        if (data.length > 5) {
            const top = data.slice(0, 4);
            const other = data.slice(4).reduce((sum, x) => sum + x.quantity, 0);
            if (other > 0) top.push({ category: "Autres", quantity: other });
            data = top;
        }

        categoryChart = destroyChart(categoryChart);
        categoryChart = new Chart(canvas.getContext("2d"), {
            type: "doughnut",
            data: {
                labels: data.map(x => x.category),
                datasets: [{ data: data.map(x => x.quantity), borderWidth: 1 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "55%",
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label} : ${formatNumber(ctx.raw, 3)} KG`
                        }
                    }
                }
            }
        });

        const total = data.reduce((s, x) => s + x.quantity, 0);
        const colors = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#64748b"];
        const list = $("categoryLegend");
        if (list) {
            list.innerHTML = data.map((item, index) => {
                const pct = total > 0 ? item.quantity / total * 100 : 0;
                return `<div style="margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px;">
                        <span>${escapeHtml(item.category)}</span>
                        <span style="color:#8a99ad">${formatNumber(pct,1)}%</span>
                    </div>
                    <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${Math.min(100,pct)}%;background:${colors[index % colors.length]}"></div></div>
                </div>`;
            }).join("");
        }
    }

    function renderDlcChart() {
        if (typeof Chart === "undefined") return;
        const canvas = $("stockDlcChart");
        if (!canvas) return;

        const data = calculateDlc();
        const labels = ["> 30 jours", "15-30 jours", "1-15 jours", "Expire"];
        const values = labels.map(label => data[label] || 0);

        dlcChart = destroyChart(dlcChart);
        dlcChart = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels,
                datasets: [{ label: "Stock", data: values, borderWidth: 1 }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${formatNumber(ctx.raw, 3)} KG`
                        }
                    }
                },
                scales: {
                    x: { ticks: { callback: value => formatNumber(value, 0) } }
                }
            }
        });

        const total = labels.reduce((sum, label) => sum + (data[label] || 0), 0);
        const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
        const list = $("dlcLegend");
        if (list) {
            list.innerHTML = labels.map((label, index) => {
                const qty = data[label] || 0;
                const pct = total > 0 ? qty / total * 100 : 0;
                return `<div style="display:flex;justify-content:space-between;">
                    <span style="color:${colors[index]}">&#9632; ${label}</span>
                    <span>${formatNumber(pct,1)}% (${formatNumber(qty / 1000,1)}K)</span>
                </div>`;
            }).join("");
        }
    }

    /* ============================================================
       TABLES
       ============================================================ */

    function renderAlertsTable() {
        const tbody = $("lowStockTableBody");
        if (!tbody) return;

        const rows = calculateAlertsRows().slice(0, 10);
        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Aucune alerte de stock nul</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const stock = num(row.stock_disponible);
            const statusClass = stock < 0 ? "badge-critique" : "badge-faible";
            const status = stock < 0 ? "Critique" : "Stock nul";
            return `<tr>
                <td>${escapeHtml(row.designation_article || row.article || "-")}</td>
                <td style="color:#8a99ad">${escapeHtml(row.lot || "-")}</td>
                <td>${escapeHtml(row.emplacement || "-")}</td>
                <td>${formatNumber(stock, 3)} ${escapeHtml(row.unite || "KG")}</td>
                <td>—</td>
                <td><span class="badge-status ${statusClass}">${status}</span></td>
            </tr>`;
        }).join("");
    }

    function movementBadge(type) {
        const t = String(type || "").toUpperCase();
        if (t === "ENTREE") return "badge-entree";
        if (t === "CONSOMMATION" || t === "SORTIE") return "badge-sortie";
        if (t === "TRANSFERT") return "badge-transfert";
        return "badge-ajustement";
    }

    function renderRecentMovements() {
        const tbody = $("recentMovementsTableBody");
        if (!tbody) return;

        const rows = getRecentMovements();
        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Aucun mouvement</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(row => {
            const type = row.type_mouvement || "-";
            const emplacement = row.magasin_destination || row.magasin_source || "-";
            const sign = movementSign(type);
            const quantityColor = sign > 0 ? "#10b981" : sign < 0 ? "#ef4444" : "#f59e0b";
            return `<tr>
                <td><span class="badge-status ${movementBadge(type)}">${escapeHtml(type)}</span></td>
                <td>${escapeHtml(row.designation_article || row.article || "-")}<br><span style="font-size:8px;color:#8a99ad">${escapeHtml(row.lot || "")}</span></td>
                <td>${escapeHtml(emplacement)}</td>
                <td style="color:${quantityColor};font-weight:600">${formatNumber(row.quantite,3)} ${escapeHtml(row.unite || "KG")}</td>
                <td style="color:#8a99ad;font-size:9px">${formatDateTime(row.date_mouvement)}</td>
            </tr>`;
        }).join("");
    }

    /* ============================================================
       TUNNELS
       ============================================================ */

    function renderTunnels() {
        const container = $("tunnelsContainer");
        if (!container) return;

        const tunnels = calculateTunnels();
        const colors = ["#10b981", "#3b82f6", "#10b981", "#f59e0b"];

        container.innerHTML = tunnels.map((tunnel, index) => `
            <div style="margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;">
                    <span>Tunnel ${tunnel.code}</span>
                    <span style="color:#8a99ad">${formatNumber(tunnel.quantity / 1000,1)}K / ${formatNumber(tunnel.capacity / 1000,0)}K</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width:${tunnel.percent}%;background:${colors[index]}"></div>
                </div>
            </div>
        `).join("");

        const totalCapacity = tunnels.reduce((sum, x) => sum + x.capacity, 0);
        const totalStock = tunnels.reduce((sum, x) => sum + x.quantity, 0);
        const avg = totalCapacity > 0 ? totalStock / totalCapacity * 100 : 0;

        const capacityEl = $("tunnelTotalCapacity");
        const occupationEl = $("tunnelAverageOccupation");
        if (capacityEl) capacityEl.textContent = `${formatNumber(totalCapacity,0)} KG`;
        if (occupationEl) occupationEl.textContent = `${formatNumber(avg,0)}%`;
    }

    /* ============================================================
       RENDU GLOBAL
       ============================================================ */

    function renderDashboard() {
        renderKpis();
        renderStockChart();
        renderEvolutionChart();
        renderCategoryChart();
        renderDlcChart();
        renderAlertsTable();
        renderRecentMovements();
        renderTunnels();
        log("Dashboard rendu.");
    }

    /* ============================================================
       REFRESH / LOADING
       ============================================================ */

    function setLoadingState(loading) {
        isLoading = Boolean(loading);
        const button = $("refreshBtn");
        if (!button) return;

        button.disabled = isLoading;
        if (isLoading) {
            if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Chargement...`;
        } else if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
        }
    }

    async function refreshDashboard() {
        if (isLoading) return;
        try {
            setLoadingState(true);
            await loadAllData();
            renderDashboard();
        } catch (error) {
            console.error("[SMTG STOCK] Erreur actualisation :", error);
            showError("Impossible de charger les données du stock. Vérifiez la console.");
        } finally {
            setLoadingState(false);
        }
    }

    function showError(message) {
        if (typeof window.showToast === "function") {
            window.showToast(message, "error");
            return;
        }
        if (typeof window.showNotification === "function") {
            window.showNotification(message, "error");
            return;
        }
        console.error("[SMTG STOCK]", message);
    }

    function bindRefreshButton() {
        const button = $("refreshBtn");
        if (!button || button.dataset.bound === "true") return;
        button.dataset.bound = "true";
        button.addEventListener("click", event => {
            event.preventDefault();
            refreshDashboard();
        });
    }

    function bindExportButton() {
        const button = document.querySelector(".btn-export-rapport");
        if (!button || button.dataset.bound === "true") return;
        button.dataset.bound = "true";
        button.addEventListener("click", event => {
            event.preventDefault();
            exportReport();
        });
    }

    function bindUnitFilters() {
        document.querySelectorAll(".panel-select-sm").forEach(select => {
            if (select.dataset.bound === "true") return;
            select.dataset.bound = "true";
            select.addEventListener("change", () => renderDashboard());
        });
    }

    function exportReport() {
        const rows = [
            ["SMTG - Rapport Stock", ""],
            ["Date", new Date().toLocaleString("fr-FR")],
            [],
            ["Indicateur", "Valeur"],
            ["Stock total disponible (KG/Pièce)", calculateTotalStock()],
            ["Références actives", calculateReferences()],
            ["Lots en stock", calculateLots()],
            ["Alertes stock", calculateAlerts()],
            [],
            ["Stock par emplacement", "Quantité"],
            ...calculateStockByEmplacement().map(x => [x.emplacement, x.quantity]),
            [],
            ["Mouvements récents", ""],
            ["Type", "Article", "Lot", "Emplacement", "Quantité", "Date"],
            ...getRecentMovements().map(x => [
                x.type_mouvement || "",
                x.designation_article || x.article || "",
                x.lot || "",
                x.magasin_destination || x.magasin_source || "",
                x.quantite || 0,
                formatDateTime(x.date_mouvement)
            ])
        ];

        const csv = rows.map(row => row.map(value => {
            const text = String(value ?? "").replace(/"/g, '""');
            return `"${text}"`;
        }).join(";")).join("\r\n");

        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SMTG_Rapport_Stock_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    /* ============================================================
       AUTO REFRESH
       ============================================================ */

    function startAutoRefresh() {
        if (autoRefreshTimer) clearInterval(autoRefreshTimer);
        autoRefreshTimer = setInterval(() => {
            if (document.visibilityState === "visible") refreshDashboard();
        }, 5 * 60 * 1000);
    }

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") startAutoRefresh();
        else if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
    });

    /* ============================================================
       INITIALISATION
       ============================================================ */

    async function initStockDashboard() {
        bindRefreshButton();
        bindExportButton();
        bindUnitFilters();

        try {
            setLoadingState(true);
            await loadAllData();
            renderDashboard();
            startAutoRefresh();
            log("Stock Dashboard prêt.");
        } catch (error) {
            console.error("[SMTG STOCK] Initialisation impossible :", error);
            showError("Erreur lors du chargement du dashboard Stock.");
        } finally {
            setLoadingState(false);
        }
    }

    window.StockDashboardController = {
        init: initStockDashboard,
        refresh: refreshDashboard,
        load: loadAllData,
        render: renderDashboard,
        exportReport,
        getStock: () => stockData,
        getMouvements: () => mouvementsData,
        getArticles: () => articlesData,
        getEmplacements: () => emplacementsData,
        getMagasins: () => magasinsData,
        getTotalStock: calculateTotalStock,
        getReferences: calculateReferences,
        getLots: calculateLots,
        getAlerts: calculateAlerts,
        getStockByEmplacement: calculateStockByEmplacement,
        getStockByCategory: calculateStockByCategory,
        getEvolution: calculateEvolution,
        getDlc: calculateDlc,
        getTunnels: calculateTunnels
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initStockDashboard);
    } else {
        initStockDashboard();
    }
})();
