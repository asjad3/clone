import { Category } from "@/types";

export const categories: Category[] = [
    { id: 1, name: "Fresh", parent_id: null },
    { id: 9, name: "Snacks", parent_id: null },
    { id: 28, name: "Beverages", parent_id: null },
    { id: 42, name: "Tea & Coffee", parent_id: null },
    { id: 50, name: "Grocery", parent_id: null },
    { id: 2, name: "Fruits & Veg", parent_id: 1 },
    { id: 6, name: "Meat", parent_id: 1 },
    { id: 10, name: "Biscuits", parent_id: 9 },
    { id: 17, name: "Chocolates", parent_id: 9 },
    { id: 23, name: "Chips", parent_id: 9 },
    { id: 29, name: "Soft Drinks", parent_id: 28 },
    { id: 33, name: "Juices", parent_id: 28 },
    { id: 43, name: "Tea", parent_id: 42 },
    { id: 46, name: "Coffee", parent_id: 42 },
    { id: 48, name: "Whiteners", parent_id: 42 },
    { id: 51, name: "Pulses", parent_id: 50 },
    { id: 53, name: "Noodles", parent_id: 50 },
    { id: 57, name: "Spices", parent_id: 50 },
    { id: 65, name: "Oil & Ghee", parent_id: 50 },
    { id: 71, name: "Rice", parent_id: 50 },
];

export const catColors = [
    "#1a3a5c",
    "#C4881C",
    "#0d7c4a",
    "#6d28d9",
    "#dc2626",
    "#0369a1",
    "#9333ea",
    "#b45309",
];

export function getCatName(catId: number): string {
    const c = categories.find((x) => x.id === catId);
    return c ? c.name : "General";
}

export function getCatColorForProduct(categoryId: number): string {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return catColors[0];
    const parentId = cat.parent_id || cat.id;
    const parentCats = categories.filter((c) => c.parent_id === null);
    const idx = parentCats.findIndex((c) => c.id === parentId);
    return catColors[idx >= 0 ? idx % catColors.length : 0];
}
