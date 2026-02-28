"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";

interface Product {
    id: number;
    name: string;
    slug: string;
    base_price: number;
    weight: string | null;
    image_url: string | null;
    category_id: number;
    brand_id: number | null;
    is_active: boolean;
    attributes: Record<string, unknown>;
    brands?: { name: string } | null;
    categories?: { name: string } | null;
}

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
}

interface Brand {
    id: number;
    name: string;
}

const EMPTY_PRODUCT = {
    name: "",
    slug: "",
    base_price: 0,
    weight: "",
    weight_value: 0,
    weight_unit: "g",
    image_url: "",
    category_id: 0,
    brand_id: null as number | null,
    is_active: true,
    attributes: {} as Record<string, unknown>,
};

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ ...EMPTY_PRODUCT });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const LIMIT = 15;

    const loadProducts = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            limit: String(LIMIT),
        });
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/products?${params}`);
        const json = await res.json();
        setProducts(json.data ?? []);
        setTotal(json.total ?? 0);
        setLoading(false);
    }, [page, search]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    useEffect(() => {
        fetch("/api/admin/categories").then(r => r.json()).then(d => setCategories(d));
        fetch("/api/admin/brands").then(r => r.json()).then(d => setBrands(d));
    }, []);

    function openCreate() {
        setForm({ ...EMPTY_PRODUCT });
        setEditingId(null);
        setModalOpen(true);
    }

    function openEdit(p: Product) {
        setForm({
            name: p.name,
            slug: p.slug,
            base_price: Number(p.base_price),
            weight: p.weight ?? "",
            weight_value: 0,
            weight_unit: "g",
            image_url: p.image_url ?? "",
            category_id: p.category_id,
            brand_id: p.brand_id,
            is_active: p.is_active,
            attributes: (p.attributes || {}) as Record<string, unknown>,
        });
        setEditingId(p.id);
        setModalOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        const body = {
            name: form.name,
            slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            base_price: form.base_price,
            weight: form.weight,
            image_url: form.image_url || null,
            category_id: form.category_id,
            brand_id: form.brand_id || null,
            is_active: form.is_active,
            attributes: form.attributes,
        };

        if (editingId) {
            await fetch(`/api/admin/products/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        } else {
            await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        }
        setSaving(false);
        setModalOpen(false);
        loadProducts();
    }

    async function handleDelete() {
        if (!deleteId) return;
        await fetch(`/api/admin/products/${deleteId}`, { method: "DELETE" });
        setDeleteId(null);
        loadProducts();
    }

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div>
            <div className="admin-table-wrap">
                <div className="admin-table-header">
                    <h3>Global Products ({total})</h3>
                    <div className="admin-table-actions">
                        <div className="admin-search-wrap">
                            <Search size={16} />
                            <input
                                className="admin-search"
                                placeholder="Search products…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            />
                        </div>
                        <button className="admin-btn admin-btn-primary" onClick={openCreate}>
                            <Plus size={16} /> Add Product
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="admin-loading">
                        <div className="admin-spinner" /> Loading products…
                    </div>
                ) : products.length === 0 ? (
                    <div className="admin-empty">
                        <p>No products found</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Brand</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Weight</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td style={{ color: "#9ca3af", fontSize: 12 }}>{p.id}</td>
                                    <td>
                                        {p.image_url ? (
                                            <img src={p.image_url} alt="" className="admin-table-img" />
                                        ) : (
                                            <div className="admin-table-img" />
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 500, maxWidth: 240 }}>
                                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {p.name}
                                        </div>
                                    </td>
                                    <td>{p.brands?.name ?? "—"}</td>
                                    <td>{p.categories?.name ?? "—"}</td>
                                    <td style={{ fontWeight: 600 }}>Rs {Number(p.base_price).toLocaleString()}</td>
                                    <td style={{ color: "#6b7280" }}>{p.weight ?? "—"}</td>
                                    <td>
                                        <span className={`admin-badge ${p.is_active ? "green" : "gray"}`}>
                                            {p.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="admin-btn-icon" onClick={() => openEdit(p)} title="Edit">
                                            <Pencil size={16} />
                                        </button>
                                        <button className="admin-btn-icon danger" onClick={() => setDeleteId(p.id)} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {totalPages > 1 && (
                    <div className="admin-table-footer">
                        <span>Page {page + 1} of {totalPages}</span>
                        <div className="admin-pagination">
                            <button className="admin-page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>←</button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const p = page < 3 ? i : page - 2 + i;
                                if (p >= totalPages) return null;
                                return (
                                    <button
                                        key={p}
                                        className={`admin-page-btn ${p === page ? "active" : ""}`}
                                        onClick={() => setPage(p)}
                                    >
                                        {p + 1}
                                    </button>
                                );
                            })}
                            <button className="admin-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>→</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>{editingId ? "Edit Product" : "Add Product"}</h3>
                            <button className="admin-btn-icon" onClick={() => setModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="admin-form-group">
                                <label>Product Name *</label>
                                <input
                                    className="admin-input"
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Nurpur Milk 1L"
                                />
                            </div>
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Base Price (Rs) *</label>
                                    <input
                                        className="admin-input"
                                        type="number"
                                        value={form.base_price}
                                        onChange={(e) => setForm(f => ({ ...f, base_price: Number(e.target.value) }))}
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Weight</label>
                                    <input
                                        className="admin-input"
                                        value={form.weight}
                                        onChange={(e) => setForm(f => ({ ...f, weight: e.target.value }))}
                                        placeholder="e.g. 1 kg"
                                    />
                                </div>
                            </div>
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Category *</label>
                                    <select
                                        className="admin-select"
                                        value={form.category_id}
                                        onChange={(e) => setForm(f => ({ ...f, category_id: Number(e.target.value) }))}
                                    >
                                        <option value={0}>Select category</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.parent_id ? "  └ " : ""}{c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label>Brand</label>
                                    <select
                                        className="admin-select"
                                        value={form.brand_id ?? ""}
                                        onChange={(e) => setForm(f => ({ ...f, brand_id: e.target.value ? Number(e.target.value) : null }))}
                                    >
                                        <option value="">No brand</option>
                                        {brands.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="admin-form-group">
                                <label>Image URL</label>
                                <input
                                    className="admin-input"
                                    value={form.image_url}
                                    onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Slug</label>
                                <input
                                    className="admin-input"
                                    value={form.slug}
                                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                                    placeholder="auto-generated from name"
                                />
                            </div>
                            <div className="admin-toggle-row">
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Active</label>
                                <button
                                    className={`admin-toggle ${form.is_active ? "on" : ""}`}
                                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                    type="button"
                                />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn-secondary" onClick={() => setModalOpen(false)}>
                                Cancel
                            </button>
                            <button
                                className="admin-btn admin-btn-primary"
                                onClick={handleSave}
                                disabled={saving || !form.name || !form.category_id}
                            >
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
                            <h3>Delete Product</h3>
                            <button className="admin-btn-icon" onClick={() => setDeleteId(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            <p className="admin-confirm-text">
                                Are you sure you want to delete this product? This action <strong>cannot be undone</strong>.
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
