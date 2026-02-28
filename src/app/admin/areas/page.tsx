"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface Area {
    id: number;
    name: string;
    city: string;
    is_active: boolean;
    lat: number | null;
    lng: number | null;
}

export default function AdminAreasPage() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: "", city: "", is_active: true });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const loadAreas = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/admin/areas");
        const data = await res.json();
        setAreas(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadAreas(); }, [loadAreas]);

    function openCreate() {
        setForm({ name: "", city: "", is_active: true });
        setEditingId(null);
        setModalOpen(true);
    }

    function openEdit(a: Area) {
        setForm({ name: a.name, city: a.city, is_active: a.is_active });
        setEditingId(a.id);
        setModalOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        const body = { name: form.name, city: form.city, is_active: form.is_active };
        if (editingId) {
            await fetch(`/api/admin/areas/${editingId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
            });
        } else {
            await fetch("/api/admin/areas", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
            });
        }
        setSaving(false);
        setModalOpen(false);
        loadAreas();
    }

    async function handleDelete() {
        if (!deleteId) return;
        await fetch(`/api/admin/areas/${deleteId}`, { method: "DELETE" });
        setDeleteId(null);
        loadAreas();
    }

    // Group by city
    const cities = [...new Set(areas.map(a => a.city))];

    return (
        <div>
            <div className="admin-table-wrap">
                <div className="admin-table-header">
                    <h3>Areas ({areas.length})</h3>
                    <button className="admin-btn admin-btn-primary" onClick={openCreate}>
                        <Plus size={16} /> Add Area
                    </button>
                </div>

                {loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /> Loading areas…</div>
                ) : areas.length === 0 ? (
                    <div className="admin-empty"><p>No areas found</p></div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>City</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cities.map(city => (
                                areas.filter(a => a.city === city).map((a, idx) => (
                                    <tr key={a.id}>
                                        <td style={{ color: "#9ca3af", fontSize: 12 }}>{a.id}</td>
                                        <td style={{ fontWeight: 500 }}>{a.name}</td>
                                        <td>
                                            {idx === 0 ? (
                                                <span className="admin-badge blue">{city}</span>
                                            ) : (
                                                <span style={{ color: "#9ca3af", fontSize: 13 }}>{city}</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`admin-badge ${a.is_active ? "green" : "gray"}`}>
                                                {a.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="admin-btn-icon" onClick={() => openEdit(a)}><Pencil size={16} /></button>
                                            <button className="admin-btn-icon danger" onClick={() => setDeleteId(a.id)}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modalOpen && (
                <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>{editingId ? "Edit Area" : "Add Area"}</h3>
                            <button className="admin-btn-icon" onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="admin-form-group">
                                <label>Area Name *</label>
                                <input className="admin-input" value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Sector H-12" />
                            </div>
                            <div className="admin-form-group">
                                <label>City *</label>
                                <input className="admin-input" value={form.city}
                                    onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                                    placeholder="e.g. Islamabad"
                                    list="city-suggestions" />
                                <datalist id="city-suggestions">
                                    {cities.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                            <div className="admin-toggle-row">
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Active</label>
                                <button className={`admin-toggle ${form.is_active ? "on" : ""}`}
                                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} type="button" />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="admin-btn admin-btn-primary" onClick={handleSave}
                                disabled={saving || !form.name || !form.city}>
                                {saving ? "Saving…" : editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>Delete Area</h3>
                            <button className="admin-btn-icon" onClick={() => setDeleteId(null)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p className="admin-confirm-text">Are you sure? Areas linked to stores will have their junction removed.</p>
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
