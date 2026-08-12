/**
 * ============================================================
 * SoufStock Enterprise ERP
 * Charts Manager - Optimized for Dynamic Data
 * ============================================================
 */

import Api from "./api.js"; // تأكد من صحة مسار الاستيراد
import { Toast } from "./utils.js";

class ChartsManager {
    constructor() {
        this.charts = {}; // مخزن لجميع الـ Instances الخاصة بالرسوم البيانية
    }

    /**
     * تدمير الرسم البياني قبل إعادة إنشائه لمنع التداخل
     */
    destroy(name) {
        if (this.charts[name]) {
            this.charts[name].destroy();
            delete this.charts[name];
        }
    }

/**
 * ============================================================
 * RENDER ALL CHARTS
 * ============================================================
 */

async renderAll() {

    try {

        await Promise.all([

            this.renderStockChart(),

            this.renderChambreChart(),

            this.renderProductionChart()

        ]);

    }

    catch (error) {

        console.error(

            "[Charts] Error rendering:",

            error

        );

        Toast.error(

            "Graphiques",

            error.message ||

            "Erreur lors du chargement des graphiques"

        );

    }

}

/**
 * ============================================================
 * STOCK CHART
 * ============================================================
 */

async renderStockChart() {

    this.destroy("stock");

    const result = await Api.select(

        "stock",

        "magasin,quantite"

    );

    if (!result.success) {

        throw new Error(result.error);

    }

    const rows = result.data || [];

    const dataMap = rows.reduce((acc, row) => {

        const key = row.magasin || "N/A";

        acc[key] = (acc[key] || 0) +

            Number(row.quantite || 0);

        return acc;

    }, {});

    const canvas = document.getElementById(

        "stockChart"

    );

    if (!canvas) return;

    this.charts.stock = new Chart(

        canvas,

        {

            type: "bar",

            data: {

                labels: Object.keys(dataMap),

                datasets: [{

                    label: "Quantité en Stock",

                    data: Object.values(dataMap),

                    backgroundColor: "#16a34a",

                    borderRadius: 6

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false

            }

        }

    );

}
/**
 * ============================================================
 * CHAMBRE CHART
 * ============================================================
 */

async renderChambreChart() {

    this.destroy("chambre");

    const result = await Api.select(

        "stock",

        "emplacement,quantite"

    );

    if (!result.success) {

        throw new Error(result.error);

    }

    const rows = result.data || [];

    const dataMap = rows.reduce((acc, row) => {

        const key = row.emplacement || "N/A";

        acc[key] =

            (acc[key] || 0)

            + Number(row.quantite || 0);

        return acc;

    }, {});

    const canvas = document.getElementById(

        "chambreChart"

    );

    if (!canvas) return;

    this.charts.chambre = new Chart(

        canvas,

        {

            type: "doughnut",

            data: {

                labels: Object.keys(dataMap),

                datasets: [{

                    data: Object.values(dataMap),

                    backgroundColor: [

                        "#3b82f6",

                        "#10b981",

                        "#f59e0b",

                        "#ef4444",

                        "#8b5cf6",

                        "#06b6d4"

                    ]

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false

            }

        }

    );

}
/**
 * ============================================================
 * PRODUCTION CHART
 * ============================================================
 */

async renderProductionChart() {

    this.destroy("production");

    const canvas = document.getElementById("productionChart");

    if (!canvas) return;

    this.charts.production = new Chart(canvas, {

        type: "line",

        data: {

            labels: [],

            datasets: [{

                label: "Production",

                data: [],

                borderColor: "#16a34a",

                backgroundColor: "rgba(22,163,74,.15)",

                fill: true,

                tension: 0.3

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false

        }

    });

}
destroyAll() {

    Object.keys(this.charts)

        .forEach(key => this.destroy(key));

}

}

const Charts = new ChartsManager();

export default Charts;
