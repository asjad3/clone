"use client";

import { useState, useEffect, useCallback } from "react";
import { Pencil, Trash2, X } from "lucide-react";

interface StoreArea {
    area_id: number;
    areas: { name: string } | null;
}

interface AdminStore {
    id: number;
    name: string;
    slug: string;
    store_type: string;
    status: string;
    same_day_delivery: boolean;
    delivery_charges: number;
    min_order_value: number;
    free_delivery_threshold: number;
    store_hours: string | null;
    delivery_hours: string | null;
    contact_phone: string | null;
    rating_avg: number;
    rating_count: number;
    store_areas: StoreArea[];
}

const STATUS_COLORS: Record<string, string> = {
    active: "green",
    pending: "amber",
    suspended: "red",
    closed: "gray",
};

export default function AdminStoresPage() {
    const [stores, setStores] = useState<AdminStore[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingStore, setEditingStore] = useState<AdminStore | null>(null);
    const [form, setForm] = useState({
        name: "", slug: "", store_type: "mart", status: "active",
        delivery_charges: 0, min_order_value: 0, free_delivery_threshold: 0,
        store_hours: "", delivery_hours: "", contact_phone: "",
    });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const loadStores = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/admin/stores");
        const data = await res.json();
        setStores(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadStores(); }, [loadStores]);

    function openEdit(s: AdminStore) {
        setForm({
            name: s.name, slug: s.slug, store_type: s.store_type, status: s.status,
            delivery_charges: Number(s.delivery_charges),
            min_order_value: Number(s.min_order_value),
            free_delivery_threshold: Number(s.free_delivery_threshold),
            store_hours: s.store_hours ?? "", delivery_hours: s.delivery_hours ?? "",
            contact_phone: s.contact_phone ?? "",
        });
        setEditingStore(s);
    }

    async function handleSave() {
        if (!editingStore) return;
        setSaving(true);
        await fetch(`/api/admin/stores/${editingStore.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        setSaving(false);
        setEditingStore(null);
        loadStores();
    }

    async function handleDelete() {
        if (!deleteId) return;
        await fetch(`/api/admin/stores/${deleteId}`, { method: "DELETE" });
        setDeleteId(null);
        loadStores();
    }

    return (
        <div>
            <div className="admin-table-wrap">
                <div className="admin-table-header">
                    <h3>Stores ({stores.length})</h3>
                </div>

                {loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /> Loading stores…</div>
                ) : stores.length === 0 ? (
                    <div className="admin-empty"><p>No stores found</p></div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Delivery Fee</th>
                                <th>Areas</th>
                                <th>Rating</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ color: "#9ca3af", fontSize: 12 }}>{s.id}</td>
                                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                                    <td style={{ textTransform: "capitalize" }}>{s.store_type}</td>
                                    <td>
                                        <span className={`admin-badge ${STATUS_COLORS[s.status] ?? "gray"}`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td>Rs {Number(s.delivery_charges)}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                            {s.store_areas?.map((sa, i) => (
                                                <span key={i} className="admin-badge blue" style={{ fontSize: 10 }}>
                                                    {sa.areas?.name ?? `Area ${sa.area_id}`}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        {Number(s.rating_avg) > 0 ? `${Number(s.rating_avg).toFixed(1)} ⭐ (${s.rating_count})` : "—"}
                                    </td>
                                    <td>
                                        <button className="admin-btn-icon" onClick={() => openEdit(s)}><Pencil size={16} /></button>
                                        <button className="admin-btn-icon danger" onClick={() => setDeleteId(s.id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Edit Modal */}
            {editingStore && (
                <div className="admin-modal-overlay" onClick={() => setEditingStore(null)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>Edit Store: {editingStore.name}</h3>
                            <button className="admin-btn-icon" onClick={() => setEditingStore(null)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Store Name</label>
                                    <input className="admin-input" value={form.name}
                                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                                </div>
                                <div className="admin-form-group">
                                    <label>Status</label>
                                    <select className="admin-select" value={form.status}
                                        onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                                        <option value="pending">Pending</option>
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Delivery Charges (Rs)</label>
                                    <input className="admin-input" type="number" value={form.delivery_charges}
                                        onChange={(e) => setForm(f => ({ ...f, delivery_charges: Number(e.target.value) }))} />
                                </div>
                                <div className="admin-form-group">
                                    <label>Min Order Value (Rs)</label>
                                    <input className="admin-input" type="number" value={form.min_order_value}
                                        onChange={(e) => setForm(f => ({ ...f, min_order_value: Number(e.target.value) }))} />
                                </div>
                            </div>
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Free Delivery Threshold</label>
                                    <input className="admin-input" type="number" value={form.free_delivery_threshold}
                                        onChange={(e) => setForm(f => ({ ...f, free_delivery_threshold: Number(e.target.value) }))} />
                                </div>
                                <div className="admin-form-group">
                                    <label>Contact Phone</label>
                                    <input className="admin-input" value={form.contact_phone}
                                        onChange={(e) => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
                                </div>
                            </div>
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Store Hours</label>
                                    <input className="admin-input" value={form.store_hours}
                                        onChange={(e) => setForm(f => ({ ...f, store_hours: e.target.value }))} placeholder="e.g. 8AM - 11PM" />
                                </div>
                                <div className="admin-form-group">
                                    <label>Delivery Hours</label>
                                    <input className="admin-input" value={form.delivery_hours}
                                        onChange={(e) => setForm(f => ({ ...f, delivery_hours: e.target.value }))} placeholder="e.g. 4PM - 11PM" />
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn-secondary" onClick={() => setEditingStore(null)}>Cancel</button>
                            <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? "Saving…" : "Update Store"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>Delete Store</h3>
                            <button className="admin-btn-icon" onClick={() => setDeleteId(null)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p className="admin-confirm-text">Are you sure? This will also delete all store products and related data.</p>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="admin-btn admin-btn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
