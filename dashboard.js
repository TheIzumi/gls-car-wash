(function () {
    "use strict";

    const TRANSACTION_FIELDS = [
        "id",
        "receipt_no",
        "customer_name",
        "vehicle_type",
        "service_name_snapshot",
        "amount",
        "payment_status",
        "created_at",
        "paid_at"
    ].join(",");

    let isLoadingDashboard = false;
    let refreshRequested = false;

    const currencyFormatter = new Intl.NumberFormat("en-MY", {
        style: "currency",
        currency: "MYR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const dateFormatter = new Intl.DateTimeFormat("en-MY", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

    /*
     * Return the beginning and end of the current day
     * in the browser's local timezone.
     *
     * The browser should be using Malaysia time (UTC+8).
     */
    function getTodayRange() {
        const now = new Date();

        const start = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const end = new Date(start);

        end.setDate(end.getDate() + 1);

        return {
            start: start.toISOString(),
            end: end.toISOString()
        };
    }

    /*
     * Exclude clearly identified test records from
     * operational dashboard figures.
     *
     * The existing test receipt remains in Supabase
     * and remains visible in Record Payment.
     */
    function isTestTransaction(transaction) {
        const customerName = String(
            transaction.customer_name || ""
        ).toLowerCase();

        const serviceName = String(
            transaction.service_name_snapshot || ""
        ).toLowerCase();

        return (
            customerName.includes("test") ||
            customerName.includes("jangan guna") ||
            serviceName.includes("test") ||
            serviceName.includes("jangan guna")
        );
    }

    function formatCurrency(amount) {
        return currencyFormatter.format(Number(amount) || 0);
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return "—";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return dateFormatter.format(date);
    }

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined && text !== null) {
            element.textContent = String(text);
        }

        return element;
    }

    function showRecentTransactionsError() {
        const container = document.getElementById(
            "recent-transactions-list"
        );

        if (!container) {
            return;
        }

        container.replaceChildren();

        const message = createElement(
            "div",
            "empty-state",
            "Unable to load transaction records. Please refresh the page and try again."
        );

        container.appendChild(message);
    }

    function renderEmptyTransactions() {
        const container = document.getElementById(
            "recent-transactions-list"
        );

        if (!container) {
            return;
        }

        container.replaceChildren();

        const emptyState = createElement(
            "div",
            "empty-state"
        );

        emptyState.appendChild(
            createElement("div", "", "🧾")
        );

        emptyState.appendChild(
            createElement("h3", "", "No transactions yet")
        );

        emptyState.appendChild(
            createElement(
                "p",
                "",
                "Real customer and payment records will appear here once recorded."
            )
        );

        container.appendChild(emptyState);
    }

    function renderRecentTransactions(transactions) {
        const container = document.getElementById(
            "recent-transactions-list"
        );

        if (!container) {
            return;
        }

        container.replaceChildren();

        const realTransactions = (transactions || [])
            .filter(function (transaction) {
                return !isTestTransaction(transaction);
            });

        if (realTransactions.length === 0) {
            renderEmptyTransactions();
            return;
        }

        realTransactions.forEach(function (transaction) {
            const card = createElement(
                "article",
                "recent-transaction-card"
            );

            const main = createElement(
                "div",
                "recent-transaction-main"
            );

            const heading = createElement(
                "div",
                "recent-transaction-heading",
                "Receipt #" + transaction.receipt_no
            );

            main.appendChild(heading);

            main.appendChild(
                createElement(
                    "div",
                    "recent-transaction-customer",
                    transaction.customer_name || "Customer"
                )
            );

            const details = createElement(
                "div",
                "recent-transaction-details"
            );

            details.appendChild(
                createElement(
                    "span",
                    "",
                    "Vehicle: " + (transaction.vehicle_type || "—")
                )
            );

            details.appendChild(
                createElement(
                    "span",
                    "",
                    "Service: " +
                    (transaction.service_name_snapshot || "—")
                )
            );

            details.appendChild(
                createElement(
                    "span",
                    "",
                    "Created: " + formatDate(transaction.created_at)
                )
            );

            main.appendChild(details);

            const side = createElement(
                "div",
                "recent-transaction-side"
            );

            side.appendChild(
                createElement(
                    "div",
                    "recent-transaction-amount",
                    formatCurrency(transaction.amount)
                )
            );

            const isPaid = transaction.payment_status === "paid";

            side.appendChild(
                createElement(
                    "span",
                    isPaid
                        ? "recent-transaction-status paid"
                        : "recent-transaction-status unpaid",
                    isPaid ? "PAID" : "UNPAID"
                )
            );

            card.appendChild(main);
            card.appendChild(side);

            container.appendChild(card);
        });
    }

    async function refreshDashboard() {
        const dashboard = document.getElementById("dashboard");

        /*
         * Do not query while the user is logged out
         * or the dashboard is hidden.
         */
        if (!dashboard || dashboard.hidden) {
            return;
        }

        if (isLoadingDashboard) {
            refreshRequested = true;
            return;
        }

        const client = window.glsSupabase;

        if (!client) {
            console.error(
                "GLS Dashboard: Supabase client is not available."
            );

            showRecentTransactionsError();
            return;
        }

        isLoadingDashboard = true;

        try {
            const range = getTodayRange();

            const [
                todayResult,
                paidResult,
                recentResult
            ] = await Promise.all([
                /*
                 * All transactions created today.
                 */
                client
                    .from("transactions")
                    .select(TRANSACTION_FIELDS)
                    .gte("created_at", range.start)
                    .lt("created_at", range.end)
                    .order("created_at", {
                        ascending: false
                    }),

                /*
                 * Payments received today.
                 */
                client
                    .from("transactions")
                    .select(
                        "customer_name,service_name_snapshot,amount"
                    )
                    .eq("payment_status", "paid")
                    .gte("paid_at", range.start)
                    .lt("paid_at", range.end),

                /*
                 * Most recent transactions.
                 */
                client
                    .from("transactions")
                    .select(TRANSACTION_FIELDS)
                    .order("created_at", {
                        ascending: false
                    })
                    .limit(10)
            ]);

            if (todayResult.error) {
                throw todayResult.error;
            }

            if (paidResult.error) {
                throw paidResult.error;
            }

            if (recentResult.error) {
                throw recentResult.error;
            }

            /*
             * Remove test records from operational totals.
             */
            const realTodayTransactions = (
                todayResult.data || []
            ).filter(function (transaction) {
                return !isTestTransaction(transaction);
            });

            const realPaidTransactions = (
                paidResult.data || []
            ).filter(function (transaction) {
                return !isTestTransaction(transaction);
            });

            const todayCustomerCount =
                realTodayTransactions.length;

            const todayTransactionCount =
                realTodayTransactions.length;

            const todayRevenue = realPaidTransactions.reduce(
                function (total, transaction) {
                    return total + (Number(transaction.amount) || 0);
                },
                0
            );

            /*
             * Update the dashboard summary cards.
             */
            setText(
                "today-customers-value",
                todayCustomerCount
            );

            setText(
                "today-revenue-value",
                formatCurrency(todayRevenue)
            );

            setText(
                "today-transactions-value",
                todayTransactionCount
            );

            /*
             * Show recent real transactions.
             * Test records stay out of this section.
             */
            renderRecentTransactions(recentResult.data || []);

        } catch (error) {
            console.error(
                "GLS Dashboard could not load data:",
                error
            );

            showRecentTransactionsError();

        } finally {
            isLoadingDashboard = false;

            if (refreshRequested) {
                refreshRequested = false;

                window.setTimeout(function () {
                    refreshDashboard();
                }, 250);
            }
        }
    }

    function startDashboardUpdates() {
        const client = window.glsSupabase;

        if (!client) {
            console.error(
                "GLS Dashboard: window.glsSupabase is missing. Check script.js."
            );
            return;
        }

        /*
         * Update when authentication changes.
         * Use setTimeout to avoid doing dashboard queries
         * directly inside the authentication callback.
         */
        client.auth.onAuthStateChange(function (event, session) {
            if (session) {
                window.setTimeout(function () {
                    refreshDashboard();
                }, 0);
            }
        });

        /*
         * Handle a user who has already logged in.
         */
        client.auth.getSession()
            .then(function (result) {
                if (result.error) {
                    throw result.error;
                }

                if (result.data && result.data.session) {
                    refreshDashboard();
                }
            })
            .catch(function (error) {
                console.error(
                    "GLS Dashboard session check failed:",
                    error
                );
            });

        /*
         * Refresh when the page becomes visible again.
         */
        document.addEventListener(
            "visibilitychange",
            function () {
                if (!document.hidden) {
                    refreshDashboard();
                }
            }
        );

        /*
         * Refresh periodically so new transactions and
         * payments appear without a manual page reload.
         */
        window.setInterval(function () {
            refreshDashboard();
        }, 20000);

        /*
         * Other GLS features can request an immediate refresh
         * by dispatching this custom event.
         */
        window.addEventListener(
            "gls:data-changed",
            refreshDashboard
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            startDashboardUpdates
        );
    } else {
        startDashboardUpdates();
    }
})();
