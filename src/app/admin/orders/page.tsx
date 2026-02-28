"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, X } from "lucide-react";

interface OrderItem {
    id: number;
    product_name_snapshot: string;
    product_image_snapshot: string | null;
    unit_price: number;
    quantity: number;
    line_total: number;
    category_name_snapshot: string | null;
    brand_name_snapshot: string | null;
}

interface Order {
    id: string;
    order_number: string;
    customer_id: number;
    store_id: number;
    store_name_snapshot: string;
    status: string;
    subtotal: number;
    delivery_fee: number;
    discount: number;
    total: number;
    payment_method: string;
    payment_status: string;
    placed_at: string;
    delivered_at: string | null;
    rider_name_snapshot: string | null;
    order_items?: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
    pending: "amber",
    confirmed: "blue",
    preparing: "purple",
    ready_for_pickup: "teal",
    picked_up: "blue",
    in_transit: "purple",
    delivered: "green",
    cancelled: "red",
    refunded: "gray",
};

const ALL_STATUSES = [
    "all", "pending", "confirmed", "preparing", "ready_for_pickup",
    "picked_up", "in_transit", "delivered", "cancelled", "refunded",
];

const ORDER_STATUS_OPTIONS = [
    "pending", "confirmed", "preparing", "ready_for_pickup",
    "picked_up", "in_transit", "delivered", "cancelled", "refunded",
];

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [detailOrder, setDetailOrder] = useState<Order | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const LIMIT = 15;

    const loadOrders = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            limit: String(LIMIT),
        });
        if (statusFilter !== "all") params.set("status", statusFilter);
        const res = await fetch(`/api/admin/orders?${params}`);
        const json = await res.json();
        setOrders(json.data ?? []);
        setTotal(json.total ?? 0);
        setLoading(false);
    }, [page, statusFilter]);

    useEffect(() => { loadOrders(); }, [loadOrders]);

    async function openDetail(orderId: string) {
        setLoadingDetail(true);
        const res = await fetch(`/api/admin/orders/${orderId}`);
        const data = await res.json();
        setDetailOrder(data);
        setLoadingDetail(false);
    }

    async function updateStatus(orderId: string, newStatus: string) {
        await fetch(`/api/admin/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        loadOrders();
        if (detailOrder?.id === orderId) {
            setDetailOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
    }

    const totalPages = Math.ceil(total / LIMIT);

    function formatDate(d: string) {
        return new Date(d).toLocaleDateString("en-PK", {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        });
    }

    return (
        <div>
            {/* Status filter tabs */}
            <div className="admin-filter-tabs">
                {ALL_STATUSES.map((s) => (
                    <button
                        key={s}
                        className={`admin-filter-tab ${statusFilter === s ? "active" : ""}`}
                        onClick={() => { setStatusFilter(s); setPage(0); }}
                    >
                        {s === "all" ? "All" : s.replace(/_/g, " ")}
                    </button>
                ))}
            </div>

            <div className="admin-table-wrap">
                <div className="admin-table-header">
                    <h3>Orders ({total})</h3>
                </div>

                {loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /> Loading orders…</div>
                ) : orders.length === 0 ? (
                    <div className="admin-empty"><p>No orders found</p></div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Store</th>
                                <th>Status</th>
                                <th>Total</th>
                                <th>Payment</th>
                                <th>Rider</th>
                                <th>Placed</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o) => (
                                <tr key={o.id}>
                                    <td style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600 }}>
                                        {o.order_number}
                                    </td>
                                    <td>{o.store_name_snapshot}</td>
                                    <td>
                                        <select
                                            className="admin-select"
                                            value={o.status}
                                            onChange={(e) => updateStatus(o.id, e.target.value)}
                                            style={{
                                                padding: "4px 8px",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                borderRadius: 9999,
                                                width: "auto",
                                            }}
                                        >
                                            {ORDER_STATUS_OPTIONS.map(s => (
                                                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>Rs {Number(o.total).toLocaleString()}</td>
                                    <td>
                                        <span className={`admin-badge ${o.payment_status === "paid" ? "green" : "amber"}`}>
                                            {o.payment_method.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ color: "#6b7280", fontSize: 13 }}>
                                        {o.rider_name_snapshot ?? "—"}
                                    </td>
                                    <td style={{ fontSize: 12, color: "#6b7280" }}>
                                        {formatDate(o.placed_at)}
                                    </td>
                                    <td>
                                        <button className="admin-btn-icon" onClick={() => openDetail(o.id)} title="View details">
                                            <Eye size={16} />
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

            {/* Order Detail Modal */}
            {(detailOrder || loadingDetail) && (
                <div className="admin-modal-overlay" onClick={() => { setDetailOrder(null); setLoadingDetail(false); }}>
                    <div className="admin-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
                        {loadingDetail ? (
                            <div className="admin-loading" style={{ minHeight: 200 }}>
                                <div className="admin-spinner" /> Loading order…
                            </div>
                        ) : detailOrder ? (
                            <>
                                <div className="admin-modal-header">
                                    <h3>Order {detailOrder.order_number}</h3>
                                    <button className="admin-btn-icon" onClick={() => setDetailOrder(null)}><X size={18} /></button>
                                </div>
                                <div className="admin-modal-body">
                                    <div className="admin-order-meta">
                                        <div className="admin-order-meta-item">
                                            <label>Status</label>
                                            <p>
                                                <span className={`admin-badge ${STATUS_COLORS[detailOrder.status] ?? "gray"}`}>
                                                    {detailOrder.status.replace(/_/g, " ")}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="admin-order-meta-item">
                                            <label>Store</label>
                                            <p>{detailOrder.store_name_snapshot}</p>
                                        </div>
                                        <div className="admin-order-meta-item">
                                            <label>Total</label>
                                            <p>Rs {Number(detailOrder.total).toLocaleString()}</p>
                                        </div>
                                        <div className="admin-order-meta-item">
                                            <label>Payment</label>
                                            <p>{detailOrder.payment_method.toUpperCase()} — {detailOrder.payment_status}</p>
                                        </div>
                                        <div className="admin-order-meta-item">
                                            <label>Placed</label>
                                            <p style={{ fontSize: 13 }}>{formatDate(detailOrder.placed_at)}</p>
                                        </div>
                                        {detailOrder.rider_name_snapshot && (
                                            <div className="admin-order-meta-item">
                                                <label>Rider</label>
                                                <p>{detailOrder.rider_name_snapshot}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Items */}
                                    {detailOrder.order_items && detailOrder.order_items.length > 0 && (
                                        <div>
                                            <h4 style={{ fontSize: 14, fontWeight: 600, margin: "16px 0 8px" }}>
                                                Items ({detailOrder.order_items.length})
                                            </h4>
                                            <table className="admin-table" style={{ fontSize: 13 }}>
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th>Qty</th>
                                                        <th>Unit Price</th>
                                                        <th>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {detailOrder.order_items.map((item) => (
                                                        <tr key={item.id}>
                                                            <td>{item.product_name_snapshot}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>Rs {Number(item.unit_price).toLocaleString()}</td>
                                                            <td style={{ fontWeight: 600 }}>Rs {Number(item.line_total).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            <div style={{
                                                marginTop: 12, padding: "12px 16px", background: "#f9fafb",
                                                borderRadius: 8, display: "flex", justifyContent: "space-between",
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                                                        Subtotal: Rs {Number(detailOrder.subtotal).toLocaleString()}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                                                        Delivery: Rs {Number(detailOrder.delivery_fee).toLocaleString()}
                                                    </div>
                                                    {Number(detailOrder.discount) > 0 && (
                                                        <div style={{ fontSize: 12, color: "#047857" }}>
                                                            Discount: -Rs {Number(detailOrder.discount).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ fontWeight: 700, fontSize: 16, alignSelf: "center" }}>
                                                    Rs {Number(detailOrder.total).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
