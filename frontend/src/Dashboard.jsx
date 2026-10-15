import { useEffect, useState } from "react";
import api from "./services/api";
import "./Dashboard.css";

const emptyForm = {
    name: "",
    category: "Entertainment",
    amount: "",
    billingCycle: "MONTHLY",
    nextRenewalDate: "",
    notes: "",
};

function Dashboard({ user, onLogout }) {
    const [subscriptions, setSubscriptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("renewal");
    const [renewals, setRenewals] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    async function loadSubscriptions() {
        try {
            const response = await api.get("/subscriptions");
            setSubscriptions(response.data);
            setMessage("");
        } catch {
            setMessage("Unable to load subscriptions. Please log in again.");
        } finally {
            setLoading(false);
        }
    }

    async function loadRenewals() {
        try {
            const response = await api.get("/renewals?days=7");
            setRenewals(response.data);
        } catch {
            setMessage("Unable to load upcoming renewals.");
        }
    }

    useEffect(() => {
        loadSubscriptions();
        loadRenewals();
    }, []);

    function updateField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    }

    function openAddForm() {
        setEditingId(null);
        setForm(emptyForm);
        setMessage("");
        setShowForm(true);
    }

    function openEditForm(subscription) {
        setEditingId(subscription.id);
        setForm({
            name: subscription.name,
            category: subscription.category || "Other",
            amount: String(subscription.amount),
            billingCycle: subscription.billingCycle,
            nextRenewalDate: subscription.nextRenewalDate,
            notes: subscription.notes || "",
        });
        setMessage("");
        setShowForm(true);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");

        const payload = {
            ...form,
            name: form.name.trim(),
            amount: Number(form.amount),
            nextRenewalDate: form.nextRenewalDate,
            active: editingId !== null ? subscriptions.find((item) => item.id === editingId)?.active ?? true
                : true,
        };

        try {
            if (editingId !== null) {
                await api.put(`/subscriptions/${editingId}`, payload);
                setMessage("Subscription updated successfully.");
            } else {
                await api.post("/subscriptions", payload);
                setMessage("Subscription added successfully.");
            }

            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm);
            await loadSubscriptions();
            await loadRenewals();
        } catch (error) {
            setMessage(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                "Unable to save subscription. Please check your details."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(subscription) {
        const confirmed = window.confirm(
            `Delete ${subscription.name}? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            await api.delete(`/subscriptions/${subscription.id}`);
            setSubscriptions((current) =>
                current.filter((item) => item.id !== subscription.id)
            );
            setMessage(`${subscription.name} deleted successfully.`);
        } catch {
            setMessage("Unable to delete this subscription.");
        }
    }

    async function handleToggleActive(subscription) {
        try {
            const updatedSubscription = {
                ...subscription,
                active: !subscription.active,
            };

            await api.put(
                `/subscriptions/${subscription.id}`,
                updatedSubscription
            );

            await loadSubscriptions();
            await loadRenewals();
            setMessage(
                `${subscription.name} ${updatedSubscription.active ? "activated" : "cancelled"
                } successfully.`
            );
        } catch {
            setMessage("Unable to update subscription status.");
        }
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(Number(amount));
    }

    function monthlyEquivalent(subscription) {
        const amount = Number(subscription.amount);

        switch (subscription.billingCycle) {
            case "YEARLY":
                return amount / 12;
            case "WEEKLY":
                return (amount * 52) / 12;
            default:
                return amount;
        }
    }

    const activeSubscriptions = subscriptions.filter((item) => item.active);

    const filteredSubscriptions = subscriptions
        .filter((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
        )
        .filter((item) =>
            categoryFilter === "ALL" ||
            (item.category || "Other") === categoryFilter
        )
        .filter((item) => {
            if (statusFilter === "ACTIVE") return item.active;
            if (statusFilter === "CANCELLED") return !item.active;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === "name") {
                return a.name.localeCompare(b.name);
            }

            if (sortBy === "amount-high") {
                return Number(b.amount) - Number(a.amount);
            }

            if (sortBy === "amount-low") {
                return Number(a.amount) - Number(b.amount);
            }

            return a.nextRenewalDate.localeCompare(b.nextRenewalDate);
        });

    const monthlySpend = activeSubscriptions.reduce(
        (total, item) => total + monthlyEquivalent(item),
        0
    );

    const yearlySpend = monthlySpend * 12;

    const upcomingRenewals = activeSubscriptions.filter((item) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const renewal = new Date(`${item.nextRenewalDate}T00:00:00`);
        const days = (renewal - today) / (1000 * 60 * 60 * 24);

        return days >= 0 && days <= 7;
    }).length;

    return (
        <main className="dashboard-shell">
            <header className="dashboard-header">
                <div className="dashboard-brand">
                    <div className="brand-icon">S</div>
                    <span>SubTrack</span>
                </div>

                <div className="profile-actions">
                    <span className="welcome-user">
                        Hi, {user?.name || "User"}
                    </span>
                    <button className="logout-button" onClick={onLogout}>
                        Log out
                    </button>
                </div>
            </header>

            <section className="dashboard-content">
                <div className="dashboard-heading">
                    <div>
                        <p className="dashboard-eyebrow">YOUR FINANCIAL OVERVIEW</p>
                        <h1>Subscription dashboard</h1>
                        <p className="dashboard-description">
                            Keep track of recurring payments in one place.
                        </p>
                    </div>

                    <button className="add-button" onClick={openAddForm}>
                        + Add subscription
                    </button>
                </div>

                {message && (
                    <p className="dashboard-message" role="status">
                        {message}
                    </p>
                )}

                <section className="summary-grid">
                    <article className="summary-card">
                        <p>Monthly spending</p>
                        <h2>{formatCurrency(monthlySpend)}</h2>
                        <span>Estimated monthly equivalent</span>
                    </article>

                    <article className="summary-card">
                        <p>Annual spending</p>
                        <h2>{formatCurrency(yearlySpend)}</h2>
                        <span>Projected for 12 months</span>
                    </article>

                    <article className="summary-card">
                        <p>Active subscriptions</p>
                        <h2>{activeSubscriptions.length}</h2>
                        <span>Currently active</span>
                    </article>

                    <article className="summary-card">
                        <p>Upcoming renewals</p>
                        <h2>{upcomingRenewals}</h2>
                        <span>Due within 7 days</span>
                    </article>
                </section>

                <section className="renewals-section">
                    <div className="section-heading">
                        <div>
                            <h2>Upcoming renewals</h2>
                            <p>Subscriptions due in the next 7 days.</p>
                        </div>
                        <span className="subscription-count">
                            {renewals.length} upcoming
                        </span>
                    </div>

                    {renewals.length === 0 ? (
                        <div className="renewals-empty">
                            You're all caught up! No renewals due in the next 7 days.
                        </div>
                    ) : (
                        <div className="renewals-list">
                            {renewals.map((renewal) => (
                                <article className="renewal-card" key={renewal.id}>
                                    <div className="service-icon">
                                        {renewal.name.charAt(0).toUpperCase()}
                                    </div>

                                    <div className="renewal-details">
                                        <h3>{renewal.name}</h3>
                                        <p>{renewal.nextRenewalDate}</p>
                                        <span>
                                            {renewal.daysRemaining === 0
                                                ? "Due today"
                                                : renewal.daysRemaining === 1
                                                    ? "Due tomorrow"
                                                    : `Due in ${renewal.daysRemaining} days`}
                                        </span>
                                    </div>

                                    <div className="renewal-amount">
                                        {formatCurrency(renewal.amount)}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {showForm && (
                    <section className="subscription-form-card">
                        <div className="form-heading">
                            <h2>
                                {editingId !== null
                                    ? "Edit subscription"
                                    : "Add a subscription"}
                            </h2>
                            <button
                                type="button"
                                className="close-button"
                                onClick={() => setShowForm(false)}
                                aria-label="Close form"
                            >
                                ×
                            </button>
                        </div>

                        <form className="subscription-form" onSubmit={handleSubmit}>
                            <label>
                                Subscription name
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={updateField}
                                    placeholder="e.g. Netflix"
                                    maxLength={255}
                                    required
                                />
                            </label>

                            <label>
                                Category
                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={updateField}
                                >
                                    <option>Entertainment</option>
                                    <option>Music</option>
                                    <option>Software</option>
                                    <option>Education</option>
                                    <option>Shopping</option>
                                    <option>Fitness</option>
                                    <option>Utilities</option>
                                    <option>Other</option>
                                </select>
                            </label>

                            <label>
                                Amount (INR)
                                <input
                                    name="amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={updateField}
                                    placeholder="649"
                                    required
                                />
                            </label>

                            <label>
                                Billing cycle
                                <select
                                    name="billingCycle"
                                    value={form.billingCycle}
                                    onChange={updateField}
                                >
                                    <option value="MONTHLY">Monthly</option>
                                    <option value="YEARLY">Yearly</option>
                                    <option value="WEEKLY">Weekly</option>
                                </select>
                            </label>

                            <label>
                                Next renewal date
                                <input
                                    name="nextRenewalDate"
                                    type="date"
                                    value={form.nextRenewalDate}
                                    onChange={updateField}
                                    required
                                />
                            </label>

                            <label>
                                Notes (optional)
                                <input
                                    name="notes"
                                    value={form.notes}
                                    onChange={updateField}
                                    maxLength={500}
                                    placeholder="Any useful details"
                                />
                            </label>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="add-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId !== null
                                            ? "Save changes"
                                            : "Add subscription"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                <section className="subscriptions-section">
                    <div className="section-heading">
                        <div>
                            <h2>Your subscriptions</h2>
                            <p>Manage your recurring services.</p>
                        </div>
                        <span className="subscription-count">
                            {subscriptions.length} total
                        </span>
                    </div>

                    {loading ? (
                        <div className="empty-state">Loading subscriptions...</div>
                    ) : subscriptions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">↗</div>
                            <h3>No subscriptions yet</h3>
                            <p>Add your first subscription to start tracking expenses.</p>
                            <button className="add-button" onClick={openAddForm}>
                                + Add your first subscription
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="subscription-filters">
                                <input
                                    type="text"
                                    placeholder="Search subscriptions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />

                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="ALL">All Categories</option>
                                    {[...new Set(subscriptions.map((item) => item.category || "Other"))]
                                        .sort()
                                        .map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="renewal">Next Renewal</option>
                                    <option value="name">Name (A–Z)</option>
                                    <option value="amount-high">Amount (High to Low)</option>
                                    <option value="amount-low">Amount (Low to High)</option>
                                </select>
                            </div>

                            <div className="subscription-list">
                                {filteredSubscriptions.map((subscription) => (
                                    <article className="subscription-row" key={subscription.id}>
                                        <div className="service-icon">
                                            {subscription.name.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="service-details">
                                            <h3>
                                                {subscription.name}
                                                {!subscription.active && (
                                                    <span className="inactive-badge">Cancelled</span>
                                                )}
                                            </h3>
                                            <p>{subscription.category || "Other"}</p>
                                            <span>
                                                Renews {subscription.nextRenewalDate}
                                            </span>
                                        </div>

                                        <div className="service-price">
                                            <strong>{formatCurrency(subscription.amount)}</strong>
                                            <span>
                                                / {subscription.billingCycle.toLowerCase()}
                                            </span>
                                        </div>

                                        <div className="service-actions">
                                            <button className="edit-button"
                                                onClick={() => openEditForm(subscription)}>Edit</button>
                                            <button className="edit-button" onClick={() => handleToggleActive(subscription)}>
                                                {subscription.active ? "Cancel" : "Reactivate"}
                                            </button>

                                            <button
                                                className="delete-button"
                                                onClick={() => handleDelete(subscription)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </section>
        </main>
    );
}

export default Dashboard;