import supabase from "./core/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
    await loadAnalytics();
});

async function loadAnalytics() {
    // جلب جميع الطلبيات من جدول commandes_excel
    const { data: commandes, error } = await supabase
        .from("commandes_excel")
        .select("*");

    if (error) {
        console.error("Erreur chargement données:", error);
        return;
    }

    if (!commandes || commandes.length === 0) return;

    // 1. حساب المؤشرات العامة (KPIs)
    const totalCmd = commandes.length;
    document.getElementById("stat-total-cmd").textContent = totalCmd;

    const todayStr = new Date().toISOString().split('T')[0];
    const cmdJour = commandes.filter(c => c.date_livraison === todayStr).length;
    document.getElementById("stat-cmd-jour").textContent = cmdJour;

    // حساب الأسبوع والشهر الحاليين
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const cmdMois = commandes.filter(c => {
        if (!c.date_livraison) return false;
        const d = new Date(c.date_livraison);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    document.getElementById("stat-cmd-mois").textContent = cmdMois;

    // تقدير الأسبوع (آخر 7 أيام)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const cmdSemaine = commandes.filter(c => {
        if (!c.date_livraison) return false;
        const d = new Date(c.date_livraison);
        return d >= sevenDaysAgo && d <= now;
    }).length;
    document.getElementById("stat-cmd-semaine").textContent = cmdSemaine;


    // 2. حساب فئات الأوزان (Tranches de Poids)
    let pInf100 = 0, p100_300 = 0, p300_500 = 0, pSup500 = 0;
    
    commandes.forEach(c => {
        const kg = Number(c.quantite_commandee || c.poids || 0);
        if (kg < 100) pInf100++;
        else if (kg >= 100 && kg < 300) p100_300++;
        else if (kg >= 300 && kg < 500) p300_500++;
        else pSup500++;
    });

    document.getElementById("poids-inf-100").textContent = pInf100;
    document.getElementById("poids-100-300").textContent = p100_300;
    document.getElementById("poids-300-500").textContent = p300_500;
    document.getElementById("poids-sup-500").textContent = pSup500;


    // 3. Top 10 Clients
    const clientsMap = {};
    commandes.forEach(c => {
        const client = c.nom_receptionnaire || c.client || "Inconnu";
        clientsMap[client] = (clientsMap[client] || 0) + 1;
    });

    const topClients = Object.entries(clientsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    document.getElementById("top-clients-body").innerHTML = topClients.map(([client, count]) => `
        <tr class="border-b border-gray-700">
            <td class="p-2">${client}</td>
            <td class="p-2 font-bold text-indigo-400">${count} commandes</td>
        </tr>
    `).join('') || `<tr><td colspan="2" class="p-4 text-center text-gray-500">Aucune donnée</td></tr>`;


    // 4. Top 10 Produits / Articles les plus sortants (باسم المنتج الحقيقي عوض الكود)
    const produitsMap = {};
    commandes.forEach(c => {
        // التحقق من الحقول التي تحمل اسم المنتج الوصفي أولاً
        const produit = c.designation || c.libelle_article || c.nom_article || c.article_nom || c.article || "Article Inconnu";
        const qty = Number(c.quantite_commandee || 1);
        produitsMap[produit] = (produitsMap[produit] || 0) + qty;
    });

    const topProduits = Object.entries(produitsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    document.getElementById("top-produits-body").innerHTML = topProduits.map(([prod, qty]) => `
        <tr class="border-b border-gray-700">
            <td class="p-2">${prod}</td>
            <td class="p-2 font-bold text-yellow-400">${qty.toFixed(2)} KG / Unités</td>
        </tr>
    `).join('') || `<tr><td colspan="2" class="p-4 text-center text-gray-500">Aucune donnée</td></tr>`;


    // 5. Suivi Quotidien (مجموع الطلبيات والوزن لكل تاريخ)
    const dailyMap = {};
    commandes.forEach(c => {
        const date = c.date_livraison || "Non définie";
        if (!dailyMap[date]) {
            dailyMap[date] = { count: 0, weight: 0 };
        }
        dailyMap[date].count += 1;
        dailyMap[date].weight += Number(c.quantite_commandee || c.poids || 0);
    });

    const sortedDays = Object.entries(dailyMap).sort((a, b) => new Date(b[0]) - new Date(a[0]));

    document.getElementById("suivi-journalier-body").innerHTML = sortedDays.map(([date, info]) => `
        <tr class="border-b border-gray-700 hover:bg-gray-750">
            <td class="p-3 font-semibold text-gray-200">${date}</td>
            <td class="p-3 text-indigo-300">${info.count}</td>
            <td class="p-3 font-bold text-green-400">${info.weight.toFixed(2)} KG</td>
        </tr>
    `).join('') || `<tr><td colspan="3" class="p-6 text-center text-gray-500">Aucun suivi disponible</td></tr>`;
}
