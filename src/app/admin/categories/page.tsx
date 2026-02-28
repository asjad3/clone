"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, FolderTree } from "lucide-react";

interface Category {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    depth: number;
    path: string | null;
    is_active: boolean;
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: "", slug: "", parent_id: null as number | null, is_active: true });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const loadCategories = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        setCategories(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadCategories(); }, [loadCategories]);

    function openCreate(parentId: number | null = null) {
        setForm({ name: "", slug: "", parent_id: parentId, is_active: true });
        setEditingId(null);
        setModalOpen(true);
    }

    function openEdit(c: Category) {
        setForm({ name: c.name, slug: c.slug, parent_id: c.parent_id, is_active: c.is_active });
        setEditingId(c.id);
        setModalOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        const body = {
            name: form.name,
            slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
            parent_id: form.parent_id,
            is_active: form.is_active,
        };
        if (editingId) {
            await fetch(`/api/admin/categories/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        } else {
            await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        }
        setSaving(false);
        setModalOpen(false);
        loadCategories();
    }

    async function handleDelete() {
        if (!deleteId) return;
        await fetch(`/api/admin/categories/${deleteId}`, { method: "DELETE" });
        setDeleteId(null);
        loadCategories();
    }

    const rootCats = categories.filter(c => c.parent_id === null);

    function renderChildren(parentId: number, depth: number): React.ReactNode {
        const children = categories.filter(c => c.parent_id === parentId);
        if (children.length === 0) return null;
        return children.map(c => (
            <div key={c.id}>
                <div className="admin-cat-item" style={{ paddingLeft: 16 + depth * 28 }}>
                    <div className="name">
                        {depth > 0 && <span className="depth-indicator">{"└".padStart(depth, " ")}</span>}
                        <FolderTree size={14} style={{ color: "#9ca3af" }} />
                        <span>{c.name}</span>
                        <span className={`admin-badge ${c.is_active ? "green" : "gray"}`} style={{ marginLeft: 8 }}>
                            {c.is_active ? "Active" : "Inactive"}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#9ca3af", marginRight: 8 }}>{c.path}</span>
                        <button className="admin-btn-icon" onClick={() => openCreate(c.id)} title="Add child">
                            <Plus size={14} />
                        </button>
                        <button className="admin-btn-icon" onClick={() => openEdit(c)} title="Edit">
                            <Pencil size={14} />
                        </button>
                        <button className="admin-btn-icon danger" onClick={() => setDeleteId(c.id)} title="Delete">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                {renderChildren(c.id, depth + 1)}
            </div>
        ));
    }

    return (
        <div>
            <div className="admin-table-wrap">
                <div className="admin-table-header">
                    <h3>Categories ({categories.length})</h3>
                    <button className="admin-btn admin-btn-primary" onClick={() => openCreate()}>
                        <Plus size={16} /> Add Root Category
                    </button>
                </div>

                {loading ? (
                    <div className="admin-loading">
                        <div className="admin-spinner" /> Loading categories…
                    </div>
                ) : categories.length === 0 ? (
                    <div className="admin-empty"><p>No categories found</p></div>
                ) : (
                    <div>
                        {rootCats.map(c => (
                            <div key={c.id}>
                                <div className="admin-cat-item" style={{ background: "#f9fafb" }}>
                                    <div className="name">
                                        <FolderTree size={16} style={{ color: "#E5A528" }} />
                                        <strong>{c.name}</strong>
                                        <span className={`admin-badge ${c.is_active ? "green" : "gray"}`} style={{ marginLeft: 8 }}>
                                            {c.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                        <span style={{ fontSize: 11, color: "#9ca3af", marginRight: 8 }}>{c.path}</span>
                                        <button className="admin-btn-icon" onClick={() => openCreate(c.id)} title="Add child">
                                            <Plus size={14} />
                                        </button>
                                        <button className="admin-btn-icon" onClick={() => openEdit(c)} title="Edit">
                                            <Pencil size={14} />
                                        </button>
                                        <button className="admin-btn-icon danger" onClick={() => setDeleteId(c.id)} title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                {renderChildren(c.id, 1)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="admin-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>{editingId ? "Edit Category" : "Add Category"}</h3>
                            <button className="admin-btn-icon" onClick={() => setModalOpen(false)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="admin-form-group">
                                <label>Name *</label>
                                <input className="admin-input" value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Category name" />
                            </div>
                            <div className="admin-form-group">
                                <label>Slug</label>
                                <input className="admin-input" value={form.slug}
                                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                                    placeholder="auto-generated" />
                            </div>
                            <div className="admin-form-group">
                                <label>Parent Category</label>
                                <select className="admin-select" value={form.parent_id ?? ""}
                                    onChange={(e) => setForm(f => ({ ...f, parent_id: e.target.value ? Number(e.target.value) : null }))}>
                                    <option value="">None (root category)</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{"  ".repeat(c.depth)}{c.name}</option>
                                    ))}
                                </select>
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
                                disabled={saving || !form.name}>
                                {saving ? "Saving…" : editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>Delete Category</h3>
                            <button className="admin-btn-icon" onClick={() => setDeleteId(null)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p className="admin-confirm-text">
                                Are you sure? Deleting a category with children or linked products may fail due to foreign key constraints.
                            </p>
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
