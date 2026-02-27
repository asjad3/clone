/**
 * ============================================================================
 * Lootmart — Full Seed Script for Local Supabase
 * ============================================================================
 *
 * This script creates test auth users and populates stores, merchants,
 * store_areas, and store_products — the parts that require auth.users UUIDs.
 *
 * HOW TO RUN:
 *   1. Make sure Supabase is running: `supabase start`
 *   2. Make sure migrations have been applied: `supabase db reset`
 *   3. Run this script: `npx tsx scripts/seed-local.ts`
 *
 * WHAT IT DOES:
 *   - Creates 4 test users (admin, merchant1, merchant2, customer)
 *   - Creates their profiles
 *   - Creates 2 stores (Royal Cash & Carry, Hash Mart)
 *   - Links stores to areas
 *   - Creates merchant records
 *   - Links global products to stores as store_products
 * ============================================================================
 */

import { createClient } from "@supabase/supabase-js";

// Require env vars — no hardcoded fallbacks for keys
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
        "❌ Missing environment variables.\n" +
        "   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.\n" +
        "   Hint: source .env.local or set them inline:\n" +
        "   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/seed-local.ts"
    );
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
    console.log("🌱 Starting Lootmart seed...\n");

    // ── Step 1: Create auth users ──
    console.log("👤 Creating test users...");

    const users = [
        { email: "admin@lootmart.pk", password: "test123456", role: "sysadmin", name: "Lootmart Admin" },
        { email: "merchant1@royal.pk", password: "test123456", role: "merchant", name: "Royal Store Owner" },
        { email: "merchant2@hash.pk", password: "test123456", role: "merchant", name: "Hash Mart Owner" },
        { email: "rider@lootmart.pk", password: "test123456", role: "rider", name: "Ahmed Khan" },
        { email: "customer@test.pk", password: "test123456", role: "customer", name: "Test Customer" },
    ];

    const userIds: Record<string, string> = {};

    for (const user of users) {
        const { data, error } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            app_metadata: { role: user.role },
        });

        if (error) {
            if (error.message.includes("already been registered")) {
                // User exists, look them up
                const { data: existing } = await supabase.auth.admin.listUsers();
                const found = existing?.users?.find((u) => u.email === user.email);
                if (found) {
                    userIds[user.email] = found.id;
                    console.log(`  ⚡ ${user.email} already exists (${found.id.slice(0, 8)}...)`);
                    continue;
                }
            }
            console.error(`  ❌ Failed to create ${user.email}:`, error.message);
            continue;
        }

        userIds[user.email] = data.user.id;
        console.log(`  ✅ ${user.email} → ${data.user.id.slice(0, 8)}...`);
    }

    // ── Step 2: Create profiles ──
    console.log("\n📋 Creating profiles...");

    for (const user of users) {
        const uid = userIds[user.email];
        if (!uid) continue;

        const { error } = await supabase.from("profiles").upsert({
            id: uid,
            role: user.role,
            full_name: user.name,
            phone: "+92300" + Math.floor(1000000 + Math.random() * 9000000),
        });

        if (error) {
            console.error(`  ❌ Profile for ${user.email}:`, error.message);
        } else {
            console.log(`  ✅ Profile: ${user.name} (${user.role})`);
        }
    }

    // ── Step 3: Create stores ──
    console.log("\n🏪 Creating stores...");

    const storeDefs = [
        {
            owner_email: "merchant1@royal.pk",
            name: "Royal Cash & Carry",
            slug: "royal-cash-and-carry",
            store_type: "mart",
            status: "active",
            same_day_delivery: true,
            delivery_charges: 100,
            min_order_value: 100,
            free_delivery_threshold: 1000,
            store_hours: "8:00 AM - 11:59 PM",
            delivery_hours: "4:00 PM - 11:00 PM",
            areas: [1, 3], // Sector F-7, Sector H-13 (by insert order in seed.sql)
        },
        {
            owner_email: "merchant2@hash.pk",
            name: "Hash Mart",
            slug: "hash-mart",
            store_type: "mart",
            status: "active",
            same_day_delivery: true,
            delivery_charges: 200,
            min_order_value: 100,
            free_delivery_threshold: 500,
            store_hours: "All day",
            delivery_hours: "All day",
            areas: [4], // Bahria Phase 8
        },
    ];

    const storeIds: Record<string, number> = {};

    for (const sd of storeDefs) {
        const ownerId = userIds[sd.owner_email];
        if (!ownerId) {
            console.error(`  ❌ No user ID for ${sd.owner_email}`);
            continue;
        }

        const { data, error } = await supabase
            .from("stores")
            .upsert(
                {
                    owner_id: ownerId,
                    name: sd.name,
                    slug: sd.slug,
                    store_type: sd.store_type,
                    status: sd.status,
                    same_day_delivery: sd.same_day_delivery,
                    delivery_charges: sd.delivery_charges,
                    min_order_value: sd.min_order_value,
                    free_delivery_threshold: sd.free_delivery_threshold,
                    store_hours: sd.store_hours,
                    delivery_hours: sd.delivery_hours,
                },
                { onConflict: "slug" }
            )
            .select("id")
            .single();

        if (error) {
            console.error(`  ❌ Store ${sd.name}:`, error.message);
            continue;
        }

        storeIds[sd.slug] = data.id;
        console.log(`  ✅ Store: ${sd.name} (id: ${data.id})`);

        // Link areas
        for (const areaId of sd.areas) {
            await supabase.from("store_areas").upsert(
                { store_id: data.id, area_id: areaId },
                { onConflict: "store_id,area_id" }
            );
        }
        console.log(`     📍 Linked ${sd.areas.length} area(s)`);

        // Create merchant record
        await supabase.from("merchants").upsert(
            {
                profile_id: ownerId,
                store_id: data.id,
                is_owner: true,
                is_active: true,
                permissions: {},
            },
            { onConflict: "profile_id,store_id" }
        );
        console.log(`     👤 Merchant linked`);
    }

    // ── Step 4: Create a rider ──
    console.log("\n🏍️ Creating rider...");

    const riderId = userIds["rider@lootmart.pk"];
    if (riderId) {
        await supabase.from("riders").upsert(
            {
                profile_id: riderId,
                vehicle: "Motorcycle",
                is_online: true,
            },
            { onConflict: "profile_id" }
        );
        console.log("  ✅ Rider: Ahmed Khan");
    }

    // ── Step 5: Create a customer ──
    console.log("\n🛒 Creating customer...");

    const customerId = userIds["customer@test.pk"];
    if (customerId) {
        const { data: custData } = await supabase
            .from("customers")
            .upsert({ profile_id: customerId }, { onConflict: "profile_id" })
            .select("id")
            .single();

        if (custData) {
            // Add an address
            await supabase.from("customer_addresses").insert({
                customer_id: custData.id,
                label: "Home",
                address: "House 42, Street 5, Sector F-7/2",
                area_id: 1,
                city: "Islamabad",
                is_default: true,
            });
            console.log("  ✅ Customer: Test Customer + home address");
        }
    }

    // ── Step 6: Link global products to stores ──
    console.log("\n📦 Creating store products (linking global catalog to stores)...");

    // Get all global products
    const { data: globalProducts } = await supabase
        .from("global_products")
        .select("id, name, base_price, category_id")
        .eq("is_active", true);

    if (!globalProducts || globalProducts.length === 0) {
        console.error("  ❌ No global products found. Did you run migrations (supabase db reset)?");
    } else {
        // Royal gets first 15 products, Hash Mart gets products 10-30 (some overlap)
        const royalId = storeIds["royal-cash-and-carry"];
        const hashId = storeIds["hash-mart"];

        if (royalId) {
            const royalProducts = globalProducts.slice(0, 15);
            for (const gp of royalProducts) {
                const priceVariation = 1 + (Math.random() * 0.1 - 0.05); // ±5%
                await supabase.from("store_products").upsert(
                    {
                        store_id: royalId,
                        global_product_id: gp.id,
                        price_override: Math.round(gp.base_price * priceVariation),
                        stock_quantity: Math.floor(Math.random() * 200) + 10,
                        is_in_stock: true,
                        is_active: true,
                    },
                    { onConflict: "store_id,global_product_id" }
                );
            }
            console.log(`  ✅ Royal Cash & Carry: ${royalProducts.length} products linked`);
        }

        if (hashId) {
            const hashProducts = globalProducts.slice(10);
            for (const gp of hashProducts) {
                const priceVariation = 1 + (Math.random() * 0.1 - 0.05);
                await supabase.from("store_products").upsert(
                    {
                        store_id: hashId,
                        global_product_id: gp.id,
                        price_override: Math.round(gp.base_price * priceVariation),
                        stock_quantity: Math.floor(Math.random() * 200) + 10,
                        is_in_stock: true,
                        is_active: true,
                    },
                    { onConflict: "store_id,global_product_id" }
                );
            }
            console.log(`  ✅ Hash Mart: ${hashProducts.length} products linked`);

            // Add a custom local product (not in global catalog)
            await supabase.from("store_products").insert({
                store_id: hashId,
                global_product_id: null,
                custom_name: "Hash Mart Special Biryani Box",
                custom_slug: "hash-mart-special-biryani",
                custom_description: "Our famous in-house biryani, serves 2-3 people",
                custom_category_id: 5, // Grocery
                custom_price: 450,
                custom_weight: "750 g",
                custom_image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=400&fit=crop",
                stock_quantity: 25,
                is_in_stock: true,
                is_active: true,
                custom_attributes: { serves: "2-3", spice_level: "medium" },
            });
            console.log("  ✅ Hash Mart: 1 custom local product added");
        }
    }

    console.log("\n🎉 Seed complete! Your local Supabase is ready.\n");
    console.log("Test accounts (all use the same password set in the seed script):");
    console.log("  Admin:    admin@lootmart.pk");
    console.log("  Merchant: merchant1@royal.pk");
    console.log("  Merchant: merchant2@hash.pk");
    console.log("  Rider:    rider@lootmart.pk");
    console.log("  Customer: customer@test.pk");
    console.log("\nOpen Studio: http://127.0.0.1:54323");
}

main().catch(console.error);
