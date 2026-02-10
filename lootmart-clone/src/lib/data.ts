// Real data from LootMart API endpoints

export interface Area {
  id: number;
  name: string;
  city: string;
  is_active: boolean;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  areas: number[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  parent_id: number | null;
  display_order: number;
}

export const areas: Area[] = [
  { id: 1, name: "DHA Phase 2", city: "Islamabad", is_active: true },
  { id: 2, name: "Bahria Phase 1-6", city: "Rawalpindi", is_active: true },
  { id: 3, name: "Bahria Phase 7", city: "Rawalpindi", is_active: true },
  { id: 4, name: "Bahria Phase 8", city: "Rawalpindi", is_active: true },
  { id: 5, name: "Sector F-7", city: "Islamabad", is_active: true },
  { id: 6, name: "Sector G-9", city: "Islamabad", is_active: true },
  { id: 7, name: "Sector I-8", city: "Islamabad", is_active: true },
];

export const stores: Store[] = [
  { id: 1, name: "Hash Mart", slug: "hash-mart", is_active: true, areas: [5] },
  { id: 2, name: "Royal Cash & Carry", slug: "royal-cash-and-carry", is_active: true, areas: [2, 4] },
];

export const categories: Category[] = [
  { id: 1, name: "Fruits & Vegetables", slug: "fruits-vegetables", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fruits-vegetables.png", parent_id: null, display_order: 1 },
  { id: 6, name: "Fresh Fruits", slug: "fresh-fruits", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-fruits.png", parent_id: 1, display_order: 1 },
  { id: 7, name: "Fresh Vegetables", slug: "fresh-vegetables", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-vegetables.png", parent_id: 1, display_order: 2 },
  { id: 8, name: "Organic Produce", slug: "organic-produce", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/organic-produce.png", parent_id: 1, display_order: 3 },
  { id: 2, name: "Dairy & Eggs", slug: "dairy-eggs", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/dairy-eggs.png", parent_id: null, display_order: 2 },
  { id: 9, name: "Milk", slug: "milk", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/milk.png", parent_id: 2, display_order: 1 },
  { id: 10, name: "Cheese", slug: "cheese", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/cheese.png", parent_id: 2, display_order: 2 },
  { id: 11, name: "Eggs", slug: "eggs", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/eggs.png", parent_id: 2, display_order: 3 },
  { id: 12, name: "Butter & Cream", slug: "butter-cream", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/butter-cream.png", parent_id: 2, display_order: 4 },
  { id: 13, name: "Yogurt", slug: "yogurt", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/yogurt.png", parent_id: 2, display_order: 5 },
  { id: 3, name: "Bakery & Snacks", slug: "bakery-snacks", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/bakery-snacks.png", parent_id: null, display_order: 3 },
  { id: 14, name: "Bread & Rolls", slug: "bread-rolls", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/bread-rolls.png", parent_id: 3, display_order: 1 },
  { id: 15, name: "Biscuits & Cookies", slug: "biscuits-cookies", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/biscuits-cookies.png", parent_id: 3, display_order: 2 },
  { id: 16, name: "Chips & Crisps", slug: "chips-crisps", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/chips-crisps.png", parent_id: 3, display_order: 3 },
  { id: 17, name: "Namkeen & Snacks", slug: "namkeen-snacks", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/namkeen-snacks.png", parent_id: 3, display_order: 4 },
  { id: 18, name: "Cakes & Pastries", slug: "cakes-pastries", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/cakes-pastries.png", parent_id: 3, display_order: 5 },
  { id: 19, name: "Rusks & Toast", slug: "rusks-toast", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/rusks-toast.png", parent_id: 3, display_order: 6 },
  { id: 4, name: "Beverages", slug: "beverages", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/beverages.png", parent_id: null, display_order: 4 },
  { id: 20, name: "Water", slug: "water", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/water.png", parent_id: 4, display_order: 1 },
  { id: 21, name: "Juices", slug: "juices", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/juices.png", parent_id: 4, display_order: 2 },
  { id: 22, name: "Soft Drinks", slug: "soft-drinks", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/soft-drinks.png", parent_id: 4, display_order: 3 },
  { id: 23, name: "Tea", slug: "tea", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/tea.png", parent_id: 4, display_order: 4 },
  { id: 24, name: "Coffee", slug: "coffee", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/coffee.png", parent_id: 4, display_order: 5 },
  { id: 25, name: "Energy Drinks", slug: "energy-drinks", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/energy-drinks.png", parent_id: 4, display_order: 6 },
  { id: 5, name: "Pantry Staples", slug: "pantry-staples", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/pantry-staples.png", parent_id: null, display_order: 5 },
  { id: 26, name: "Rice", slug: "rice", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/rice.png", parent_id: 5, display_order: 1 },
  { id: 27, name: "Flour & Atta", slug: "flour-atta", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/flour-atta.png", parent_id: 5, display_order: 2 },
  { id: 28, name: "Cooking Oil", slug: "cooking-oil", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/cooking-oil.png", parent_id: 5, display_order: 3 },
  { id: 29, name: "Spices", slug: "spices", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/spices.png", parent_id: 5, display_order: 4 },
  { id: 30, name: "Sugar & Salt", slug: "sugar-salt", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/sugar-salt.png", parent_id: 5, display_order: 5 },
  { id: 31, name: "Lentils & Pulses", slug: "lentils-pulses", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/lentils-pulses.png", parent_id: 5, display_order: 6 },
];

export const parentCategories = categories.filter(c => c.parent_id === null);
export const getSubcategories = (parentId: number) => categories.filter(c => c.parent_id === parentId);

export interface Product {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  unit: string;
  image_url: string;
  category_id: number;
  in_stock: boolean;
}

// Sample products for the store page
export const sampleProducts: Product[] = [
  // Fruits & Vegetables
  { id: 1, name: "Fresh Bananas", price: 120, original_price: 150, unit: "1 dozen", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-fruits.png", category_id: 6, in_stock: true },
  { id: 2, name: "Red Apples", price: 350, unit: "1 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-fruits.png", category_id: 6, in_stock: true },
  { id: 3, name: "Fresh Mangoes", price: 280, original_price: 320, unit: "1 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-fruits.png", category_id: 6, in_stock: true },
  { id: 4, name: "Oranges", price: 200, unit: "1 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-fruits.png", category_id: 6, in_stock: true },
  { id: 5, name: "Grapes (Green)", price: 450, unit: "1 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-fruits.png", category_id: 6, in_stock: false },
  { id: 6, name: "Fresh Tomatoes", price: 80, unit: "1 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-vegetables.png", category_id: 7, in_stock: true },
  { id: 7, name: "Potatoes", price: 60, original_price: 80, unit: "1 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-vegetables.png", category_id: 7, in_stock: true },
  { id: 8, name: "Onions", price: 90, unit: "1 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-vegetables.png", category_id: 7, in_stock: true },
  { id: 9, name: "Fresh Spinach", price: 40, unit: "1 bunch", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-vegetables.png", category_id: 7, in_stock: true },
  { id: 10, name: "Capsicum", price: 180, unit: "1 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/fresh-vegetables.png", category_id: 7, in_stock: true },
  // Dairy & Eggs
  { id: 11, name: "Olpers Milk 1L", price: 260, unit: "1 litre", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/milk.png", category_id: 9, in_stock: true },
  { id: 12, name: "Nestle MilkPak", price: 250, original_price: 270, unit: "1 litre", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/milk.png", category_id: 9, in_stock: true },
  { id: 13, name: "Farm Eggs", price: 320, unit: "12 pcs", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/eggs.png", category_id: 11, in_stock: true },
  { id: 14, name: "Cheddar Cheese", price: 180, unit: "200g", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/cheese.png", category_id: 10, in_stock: true },
  { id: 15, name: "Fresh Butter", price: 350, unit: "200g", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/butter-cream.png", category_id: 12, in_stock: true },
  { id: 16, name: "Plain Yogurt", price: 120, unit: "500g", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/yogurt.png", category_id: 13, in_stock: true },
  // Bakery & Snacks
  { id: 17, name: "Fresh Bread", price: 100, unit: "1 loaf", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/bread-rolls.png", category_id: 14, in_stock: true },
  { id: 18, name: "Lays Classic", price: 70, unit: "70g", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/chips-crisps.png", category_id: 16, in_stock: true },
  { id: 19, name: "Oreo Cookies", price: 90, original_price: 110, unit: "1 pack", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/biscuits-cookies.png", category_id: 15, in_stock: true },
  { id: 20, name: "Nimko Mix", price: 150, unit: "200g", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/namkeen-snacks.png", category_id: 17, in_stock: true },
  // Beverages
  { id: 21, name: "Nestle Pure Life", price: 80, unit: "1.5L", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/water.png", category_id: 20, in_stock: true },
  { id: 22, name: "Coca Cola", price: 100, unit: "1.5L", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/soft-drinks.png", category_id: 22, in_stock: true },
  { id: 23, name: "Tapal Danedar", price: 420, original_price: 450, unit: "950g", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/tea.png", category_id: 23, in_stock: true },
  { id: 24, name: "Nescafe Classic", price: 550, unit: "200g", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/coffee.png", category_id: 24, in_stock: true },
  { id: 25, name: "Shezan Mango Juice", price: 60, unit: "250ml", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/juices.png", category_id: 21, in_stock: true },
  // Pantry Staples
  { id: 26, name: "Super Kernel Basmati", price: 800, original_price: 900, unit: "5 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/rice.png", category_id: 26, in_stock: true },
  { id: 27, name: "Sunflower Atta", price: 320, unit: "5 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/flour-atta.png", category_id: 27, in_stock: true },
  { id: 28, name: "Dalda Cooking Oil", price: 650, unit: "5L", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/cooking-oil.png", category_id: 28, in_stock: true },
  { id: 29, name: "Shan Biryani Masala", price: 85, unit: "60g", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/spices.png", category_id: 29, in_stock: true },
  { id: 30, name: "White Sugar", price: 180, unit: "1 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/sugar-salt.png", category_id: 30, in_stock: true },
  { id: 31, name: "Masoor Dal", price: 280, unit: "1 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/lentils-pulses.png", category_id: 31, in_stock: true },
  { id: 32, name: "Chana Dal", price: 250, original_price: 280, unit: "1 kg", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/lentils-pulses.png", category_id: 31, in_stock: true },
  { id: 33, name: "Red Chilli Powder", price: 200, unit: "200g", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/spices.png", category_id: 29, in_stock: true },
  { id: 34, name: "Turmeric Powder", price: 150, unit: "200g", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/spices.png", category_id: 29, in_stock: true },
  { id: 35, name: "Penne Pasta", price: 220, unit: "500g", image_url: "https://dpgultbqxxdttrjcatco.supabase.co/storage/v1/object/public/category-images/pantry-staples.png", category_id: 26, in_stock: true },
];
