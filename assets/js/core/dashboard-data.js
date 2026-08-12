/**
 * ============================================================
 * SoufStock Enterprise ERP
 * dashboard-data.js
 * ============================================================
 */

import Api from "./api.js";
import { Toast } from "./utils.js";

class DashboardData {

    constructor() {

        this.stats = {

            stock: 0,
            commandes: 0,
            picking: 0,
            expeditions: 0

        };

        this.movements = [];

    }

    /* ============================================================
     * LOAD
     * ============================================================ */

    async load() {

        try {

            await Promise.all([

                this.loadStats(),

                this.loadLastMovements()

            ]);

            this.render();

            return true;

        }

        catch (error) {

            console.error(error);

            Toast.error(

                "Dashboard",

                error.message

            );

            return false;

        }

    }

    /* ============================================================
     * STATS
     * ============================================================ */

    async loadStats() {

        this.stats = await Api.getDashboardStats();

    }

    /* ============================================================
     * LAST MOVEMENTS
     * ============================================================ */

    async loadLastMovements() {

        this.movements =

            await Api.getLastMovements(10);

    }

    /* ============================================================
     * RENDER
     * ============================================================ */

    render() {

        this.renderStats();

        this.renderMovements();

    }

   /* ============================================================
 * KPI
 * ============================================================ */

renderStats() {

    const stockTotal = Number(this.stats.stock || 0);

    this.setValue(

        "stockTotal",

        stockTotal.toLocaleString(

            "fr-FR",

            {

                minimumFractionDigits: 3,

                maximumFractionDigits: 3

            }

        ) + " KG"

    );

    this.setValue(

        "ordersCount",

        this.stats.commandes || 0

    );

    this.setValue(

        "pickingCount",

        this.stats.picking || 0

    );

    this.setValue(

        "expeditionCount",

        this.stats.expeditions || 0

    );

}

    /* ============================================================
     * TABLE
     * ============================================================ */

    renderMovements() {

        const tbody =

            document.getElementById(

                "movementsTableBody"

            );

        if (!tbody) return;

        tbody.innerHTML = "";

        if (

            this.movements.length === 0

        ) {

            tbody.innerHTML =

            `

            <tr>

                <td colspan="5">

                    Aucun mouvement.

                </td>

            </tr>

            `;

            return;

        }

        this.movements.forEach(item => {

            tbody.insertAdjacentHTML(

                "beforeend",

                `

                <tr>

                    <td>

                        ${item.created_at ?

                        new Date(

                            item.created_at

                        ).toLocaleString("fr-FR")

                        : "-"}

                    </td>

                    <td>

                        ${item.article ?? "-"}

                    </td>

                    <td>

                        ${item.lot ?? "-"}

                    </td>

                    <td>

                        ${item.quantite ?? 0}

                    </td>

                    <td>

                        ${item.unite ?? ""}

                    </td>

                </tr>

                `

            );

        });

    }

    /* ============================================================
     * REFRESH
     * ============================================================ */

    async refresh() {

        return await this.load();

    }

    /* ============================================================
     * HELPERS
     * ============================================================ */

    setValue(id, value) {

        const element =

            document.getElementById(id);

        if (element) {

            element.textContent =

                value ?? 0;

        }

    }

    /* ============================================================
     * GETTERS
     * ============================================================ */

    getStats() {

        return this.stats;

    }

    getMovements() {

        return this.movements;

    }

}

const DashboardDataManager =

    new DashboardData();

export default DashboardDataManager;
