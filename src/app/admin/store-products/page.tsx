"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Pencil, Trash2, X, Plus } from "lucide-react";

interface StoreProduct {
    store_product_id: number;
    store_id: number;
    store_name: string;
    store_slug: string;
    global_product_id: number | null;
    product_name: string;
    product_slug: string;
    description: string | null;
    brand_name: string | null;
    category_id: number;
    category_name: string | null;
    price: number;
    old_price: number | null;
    weight: string | null;
    image_url: string | null;
    is_in_stock: boolean;
    stock_quantity: number;
    is_active: boolean;
    sort_order: number;
}

interface StoreOption {
    id: number;
    name: string;
}

export default function AdminStoreProductsPage() {
    const [products, setProducts] = useState<StoreProduct[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [storeFilter, setStoreFilter] = useState<number | null>(null);
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [loading, setLoading] = useState(true);

    const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
    const [form, setForm] = useState({
        price_override: null as number | null,
        old_price_override: null as number | null,
        stock_quantity: 0,
        is_in_stock: true,
        is_active: true,
        sort_order: 0,
    });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const LIMIT = 15;

    // Load stores for filter dropdown
    useEffect(() => {
        fetch("/api/admin/stores").then(r => r.json()).then(data => {
            if (Array.isArray(data)) {
                setStores(data.map((s: { id: number; name: string }) => ({ id: s.id, name: s.name })));
            }
        });
    }, []);

    const loadProducts = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            limit: String(LIMIT),
        });
        if (search) params.set("search", search);
        if (storeFilter) params.set("store_id", String(storeFilter));
        const res = await fetch(`/api/admin/store-products?${params}`);
        const json = await res.json();
        setProducts(json.data ?? []);
        setTotal(json.total ?? 0);
        setLoading(false);
    }, [page, search, storeFilter]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    function openEdit(p: StoreProduct) {
        setForm({
            price_override: p.price,
            old_price_override: p.old_price,
            stock_quantity: p.stock_quantity,
            is_in_stock: p.is_in_stock,
            is_active: p.is_active,
            sort_order: p.sort_order,
        });
        setEditingProduct(p);
    }

    async function handleSave() {
        if (!editingProduct) return;
        setSaving(true);
        const body = {
            price_override: form.price_override,
            old_price_override: form.old_price_override,
            stock_quantity: form.stock_quantity,
            is_in_stock: form.is_in_stock,
            is_active: form.is_active,
            sort_order: form.sort_order,
        };
        await fetch(`/api/admin/store-products/${editingProduct.store_product_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        setSaving(false);
        setEditingProduct(null);
        loadProducts();
    }

    async function handleDelete() {
        if (!deleteId) return;
        await fetch(`/api/admin/store-products/${deleteId}`, { method: "DELETE" });
        setDeleteId(null);
        loadProducts();
    }

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div>
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "#FEF3C7", borderRadius: 8, fontSize: 13, color: "#92400E" }}>
                <strong>ℹ️ Store Products</strong> — This is what customers actually see on the storefront.
                Prices here override global product prices. Use &ldquo;Global Products&rdquo; to manage the master catalog.
            </div>

            <div className="admin-table-wrap">
                <div className="admin-table-header">
                    <h3>Store Products ({total})</h3>
                    <div className="admin-table-actions">
                        <select
                            className="admin-select"
                            style={{ width: 180 }}
                            value={storeFilter ?? ""}
                            onChange={(e) => { setStoreFilter(e.target.value ? Number(e.target.value) : null); setPage(0); }}
                        >
                            <option value="">All Stores</option>
                            {stores.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <div className="admin-search-wrap">
                            <Search size={16} />
                            <input
                                className="admin-search"
                                placeholder="Search products…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="admin-loading">
                        <div className="admin-spinner" /> Loading store products…
                    </div>
                ) : products.length === 0 ? (
                    <div className="admin-empty">
                        <p>No store products found</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Store</th>
                                <th>Price</th>
                                <th>Old Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Source</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.store_product_id}>
                                    <td style={{ color: "#9ca3af", fontSize: 12 }}>{p.store_product_id}</td>
                                    <td>
                                        {p.image_url ? (
                                            <img src={p.image_url} alt="" className="admin-table-img" />
                                        ) : (
                                            <div className="admin-table-img" />
                                        )}
                                    </td>
                                    <td style={{ fontWeight: 500, maxWidth: 200 }}>
                                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {p.product_name}
                                        </div>
                                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                                            {p.brand_name && `${p.brand_name} · `}{p.category_name}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="admin-badge blue" style={{ fontSize: 11 }}>{p.store_name}</span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>Rs {Number(p.price).toLocaleString()}</td>
                                    <td style={{ color: "#9ca3af", textDecoration: "line-through", fontSize: 12 }}>
                                        {p.old_price ? `Rs ${Number(p.old_price).toLocaleString()}` : "—"}
                                    </td>
                                    <td>
                                        <span className={`admin-badge ${p.is_in_stock ? "green" : "red"}`}>
                                            {p.is_in_stock ? `${p.stock_quantity} in stock` : "Out of stock"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`admin-badge ${p.is_active ? "green" : "gray"}`}>
                                            {p.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`admin-badge ${p.global_product_id ? "purple" : "amber"}`} style={{ fontSize: 10 }}>
                                            {p.global_product_id ? "Global" : "Custom"}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="admin-btn-icon" onClick={() => openEdit(p)} title="Edit">
                                            <Pencil size={16} />
                                        </button>
                                        <button className="admin-btn-icon danger" onClick={() => setDeleteId(p.store_product_id)} title="Delete">
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
                                    <button key={p} className={`admin-page-btn ${p === page ? "active" : ""}`}
                                        onClick={() => setPage(p)}>{p + 1}</button>
                                );
                            })}
                            <button className="admin-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>→</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingProduct && (
                <div className="admin-modal-overlay" onClick={() => setEditingProduct(null)}>
                    <div className="admin-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>Edit: {editingProduct.product_name}</h3>
                            <button className="admin-btn-icon" onClick={() => setEditingProduct(null)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ marginBottom: 14, padding: "8px 12px", background: "#f0f9ff", borderRadius: 6, fontSize: 12, color: "#1d4ed8" }}>
                                Store: <strong>{editingProduct.store_name}</strong>
                                {editingProduct.global_product_id && (
                                    <> · Global ID: {editingProduct.global_product_id}</>
                                )}
                            </div>
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Store Price (Rs)</label>
                                    <input className="admin-input" type="number"
                                        value={form.price_override ?? ""}
                                        onChange={(e) => setForm(f => ({ ...f, price_override: e.target.value ? Number(e.target.value) : null }))}
                                        placeholder="Uses global price if empty"
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Old Price (Rs)</label>
                                    <input className="admin-input" type="number"
                                        value={form.old_price_override ?? ""}
                                        onChange={(e) => setForm(f => ({ ...f, old_price_override: e.target.value ? Number(e.target.value) : null }))}
                                        placeholder="For showing discounts"
                                    />
                                </div>
                            </div>
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Stock Quantity</label>
                                    <input className="admin-input" type="number"
                                        value={form.stock_quantity}
                                        onChange={(e) => setForm(f => ({ ...f, stock_quantity: Number(e.target.value) }))} />
                                </div>
                                <div className="admin-form-group">
                                    <label>Sort Order</label>
                                    <input className="admin-input" type="number"
                                        value={form.sort_order}
                                        onChange={(e) => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
                                </div>
                            </div>
                            <div className="admin-toggle-row">
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>In Stock</label>
                                <button className={`admin-toggle ${form.is_in_stock ? "on" : ""}`}
                                    onClick={() => setForm(f => ({ ...f, is_in_stock: !f.is_in_stock }))} type="button" />
                            </div>
                            <div className="admin-toggle-row">
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Active</label>
                                <button className={`admin-toggle ${form.is_active ? "on" : ""}`}
                                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} type="button" />
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn admin-btn-secondary" onClick={() => setEditingProduct(null)}>Cancel</button>
                            <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? "Saving…" : "Update"}
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
                            <h3>Delete Store Product</h3>
                            <button className="admin-btn-icon" onClick={() => setDeleteId(null)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p className="admin-confirm-text">
                                Are you sure? This removes the product from this store. The global product will remain in the catalog.
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
