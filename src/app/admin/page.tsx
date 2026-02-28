"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Package,
    Store,
    Tag,
    FolderTree,
    MapPin,
    ShoppingCart,
} from "lucide-react";

interface Stats {
    products: number;
    stores: number;
    brands: number;
    categories: number;
    areas: number;
    orders: number;
}

const QUICK_ACTIONS = [
    { href: "/admin/products", label: "Manage Products", desc: "Add, edit, or remove global products" },
    { href: "/admin/categories", label: "Manage Categories", desc: "Organize product categories" },
    { href: "/admin/brands", label: "Manage Brands", desc: "Add or update brand listings" },
    { href: "/admin/stores", label: "Manage Stores", desc: "View and configure stores" },
    { href: "/admin/areas", label: "Manage Areas", desc: "Delivery zones and regions" },
    { href: "/admin/orders", label: "View Orders", desc: "Track and manage orders" },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        products: 0, stores: 0, brands: 0, categories: 0, areas: 0, orders: 0,
    });

    useEffect(() => {
        async function loadStats() {
            try {
                const [products, stores, brands, categories, areas, orders] = await Promise.all([
                    fetch("/api/admin/products?limit=1").then(r => r.json()),
                    fetch("/api/admin/stores").then(r => r.json()),
                    fetch("/api/admin/brands").then(r => r.json()),
                    fetch("/api/admin/categories").then(r => r.json()),
                    fetch("/api/admin/areas").then(r => r.json()),
                    fetch("/api/admin/orders?limit=1").then(r => r.json()),
                ]);
                setStats({
                    products: products.total ?? 0,
                    stores: Array.isArray(stores) ? stores.length : 0,
                    brands: Array.isArray(brands) ? brands.length : 0,
                    categories: Array.isArray(categories) ? categories.length : 0,
                    areas: Array.isArray(areas) ? areas.length : 0,
                    orders: orders.total ?? 0,
                });
            } catch {
                // Supabase might not be running
            }
        }
        loadStats();
    }, []);

    const cards = [
        { label: "Global Products", value: stats.products, icon: Package, color: "amber" },
        { label: "Stores", value: stats.stores, icon: Store, color: "blue" },
        { label: "Brands", value: stats.brands, icon: Tag, color: "purple" },
        { label: "Categories", value: stats.categories, icon: FolderTree, color: "green" },
        { label: "Areas", value: stats.areas, icon: MapPin, color: "teal" },
        { label: "Orders", value: stats.orders, icon: ShoppingCart, color: "rose" },
    ];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, color: "#6b7280", fontWeight: 400, margin: 0 }}>
                    Welcome to the Lootmart admin panel
                </h3>
            </div>

            <div className="admin-stats-grid">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="admin-stat-card">
                            <div className={`admin-stat-icon ${card.color}`}>
                                <Icon />
                            </div>
                            <div className="admin-stat-info">
                                <h3>{card.value}</h3>
                                <p>{card.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="admin-table-wrap" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", margin: "0 0 12px" }}>
                    Quick Actions
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                    {QUICK_ACTIONS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="admin-quick-action"
                            style={{
                                padding: "14px 16px",
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                textDecoration: "none",
                                color: "#1f2937",
                                transition: "all 0.15s",
                                display: "block",
                            }}
                        >
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{item.desc}</div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
