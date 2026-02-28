"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface Brand {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
    is_active: boolean;
}

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: "", slug: "", logo_url: "", is_active: true });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const loadBrands = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/admin/brands");
        const data = await res.json();
        setBrands(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadBrands(); }, [loadBrands]);

    function openCreate() {
        setForm({ name: "", slug: "", logo_url: "", is_active: true });
        setEditingId(null);
        setModalOpen(true);
    }

    function openEdit(b: Brand) {
        setForm({ name: b.name, slug: b.slug, logo_url: b.logo_url ?? "", is_active: b.is_active });
        setEditingId(b.id);
        setModalOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        const body = {
            name: form.name,
            slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            logo_url: form.logo_url || null,
            is_active: form.is_active,
        };
        if (editingId) {
            await fetch(`/api/admin/brands/${editingId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
            });
        } else {
            await fetch("/api/admin/brands", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
            });
        }
        setSaving(false);
        setModalOpen(false);
        loadBrands();
    }

    async function handleDelete() {
        if (!deleteId) return;
        await fetch(`/api/admin/brands/${deleteId}`, { method: "DELETE" });
        setDeleteId(null);
        loadBrands();
    }

    return (
        <div>
            <div className="admin-table-wrap">
                <div className="admin-table-header">
                    <h3>Brands ({brands.length})</h3>
                    <button className="admin-btn admin-btn-primary" onClick={openCreate}>
                        <Plus size={16} /> Add Brand
                    </button>
                </div>

                {loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /> Loading brands…</div>
                ) : brands.length === 0 ? (
                    <div className="admin-empty"><p>No brands found</p></div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brands.map((b) => (
                                <tr key={b.id}>
                                    <td style={{ color: "#9ca3af", fontSize: 12 }}>{b.id}</td>
                                    <td style={{ fontWeight: 500 }}>{b.name}</td>
                                    <td style={{ color: "#6b7280", fontSize: 13, fontFamily: "monospace" }}>{b.slug}</td>
                                    <td>
                                        <span className={`admin-badge ${b.is_active ? "green" : "gray"}`}>
                                            {b.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="admin-btn-icon" onClick={() => openEdit(b)}><Pencil size={16} /></button>
                                        <button className="admin-btn-icon danger" onClick={() => setDeleteId(b.id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modalOpen && (
                <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="admin-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>{editingId ? "Edit Brand" : "Add Brand"}</h3>
                            <button className="admin-btn-icon" onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="admin-form-group">
                                <label>Brand Name *</label>
                                <input className="admin-input" value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Nurpur" />
                            </div>
                            <div className="admin-form-group">
                                <label>Slug</label>
                                <input className="admin-input" value={form.slug}
                                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" />
                            </div>
                            <div className="admin-form-group">
                                <label>Logo URL</label>
                                <input className="admin-input" value={form.logo_url}
                                    onChange={(e) => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." />
                            </div>
                            <div className="admin-toggle-row">
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Active</label>
                                <button className={`admin-toggle ${form.is_active ? "on" : ""}`}
                                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} type="button" />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving || !form.name}>
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
                            <h3>Delete Brand</h3>
                            <button className="admin-btn-icon" onClick={() => setDeleteId(null)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p className="admin-confirm-text">Are you sure? Brands linked to products may prevent deletion.</p>
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
