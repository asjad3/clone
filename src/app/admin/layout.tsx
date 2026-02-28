"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    FolderTree,
    Tag,
    Store,
    MapPin,
    ShoppingCart,
    ShoppingBag,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";
import "./admin.css";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Global Products", href: "/admin/products", icon: Package },
    { label: "Store Products", href: "/admin/store-products", icon: ShoppingBag },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Brands", href: "/admin/brands", icon: Tag },
    { label: "Stores", href: "/admin/stores", icon: Store },
    { label: "Areas", href: "/admin/areas", icon: MapPin },
    { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
];

const pageTitle: Record<string, string> = {
    "/admin": "Dashboard",
    "/admin/products": "Global Products",
    "/admin/store-products": "Store Products",
    "/admin/categories": "Categories",
    "/admin/brands": "Brands",
    "/admin/stores": "Stores",
    "/admin/areas": "Areas",
    "/admin/orders": "Orders",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const title = pageTitle[pathname] || "Admin";

    return (
        <div className="admin-layout">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="admin-modal-overlay"
                    style={{ zIndex: 49, background: "rgba(0,0,0,0.3)" }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
                <div className="admin-sidebar-brand">
                    <h1>LootMart</h1>
                    <span>Admin</span>
                </div>
                <nav className="admin-sidebar-nav">
                    <div className="admin-nav-section">
                        <div className="admin-nav-label">Management</div>
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive =
                                item.href === "/admin"
                                    ? pathname === "/admin"
                                    : pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`admin-nav-link ${isActive ? "active" : ""}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
                <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <Link
                        href="/"
                        className="admin-nav-link"
                        style={{ fontSize: 13, color: "#667085" }}
                    >
                        ← Back to Storefront
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="admin-main">
                <header className="admin-topbar">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button
                            className="admin-btn-icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ display: "none" }}
                            id="admin-menu-btn"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h2>{title}</h2>
                    </div>
                    <div style={{ fontSize: 13, color: "#9ca3af" }}>
                        Supabase Admin Panel
                    </div>
                </header>
                <div className="admin-content">{children}</div>
            </main>

            {/* Show mobile hamburger via CSS */}
            <style>{`
                @media (max-width: 768px) {
                    #admin-menu-btn { display: inline-flex !important; }
                }
            `}</style>
        </div>
    );
}
