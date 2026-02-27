-- ============================================================================
-- LOOTMART — SEED DATA
-- ============================================================================
-- Test data matching existing app mock data.
-- Run with: supabase db reset (auto-runs seed.sql after migrations)
-- ============================================================================

-- Note: Seed data uses service_role bypass (no RLS).
-- In local dev, seed.sql runs as superuser so RLS is not enforced.


-- ────────────────────────────────────────────────────────────────────────────
-- AREAS
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO areas (name, city) VALUES
    ('Sector F-7',              'Islamabad'),
    ('Sector H-12',             'Islamabad'),
    ('Sector H-13',             'Islamabad'),
    ('Bahria Phase 8',          'Rawalpindi'),
    ('DHA Phase 2',             'Islamabad'),
    ('Askari 14, Sector A/B',   'Rawalpindi'),
    ('Askari 14, Sector D',     'Rawalpindi');

-- ────────────────────────────────────────────────────────────────────────────
-- BRANDS
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO brands (name, slug) VALUES
    ('Nurpur',      'nurpur'),
    ('NESCAFE',     'nescafe'),
    ('Kingston',    'kingston'),
    ('Guard',       'guard'),
    ('Butterfly',   'butterfly'),
    ('Dalda',       'dalda'),
    ('Tapal',       'tapal'),
    ('Coca Cola',   'coca-cola'),
    ('Oreo',        'oreo'),
    ('Cadbury',     'cadbury'),
    ('Lays',        'lays'),
    ('Nestle',      'nestle'),
    ('Knorr',       'knorr'),
    ('National',    'national'),
    ('Olpers',      'olpers'),
    ('Lipton',      'lipton'),
    ('Pepsi',       'pepsi'),
    ('Shan',        'shan'),
    ('Everyday',    'everyday'),
    ('Prince',      'prince'),
    ('Milo',        'milo'),
    ('Habib',       'habib'),
    ('KitKat',      'kitkat'),
    ('Kurkure',     'kurkure'),
    ('Maggi',       'maggi');

-- ────────────────────────────────────────────────────────────────────────────
-- CATEGORIES (LTREE paths computed automatically by trigger)
-- ────────────────────────────────────────────────────────────────────────────

-- Level 0: Root categories
INSERT INTO categories (name, slug, parent_id) VALUES
    ('Fresh',        'fresh',        NULL),      -- id 1
    ('Snacks',       'snacks',       NULL),      -- id 2
    ('Beverages',    'beverages',    NULL),       -- id 3
    ('Tea & Coffee', 'tea_coffee',   NULL),       -- id 4
    ('Grocery',      'grocery',      NULL);       -- id 5

-- Level 1: Sub-categories (parent IDs reference the roots above)
INSERT INTO categories (name, slug, parent_id) VALUES
    ('Fruits & Veg', 'fruits_veg',   1),         -- id 6
    ('Meat',         'meat',         1),          -- id 7
    ('Biscuits',     'biscuits',     2),          -- id 8
    ('Chocolates',   'chocolates',   2),          -- id 9
    ('Chips',        'chips',        2),          -- id 10
    ('Soft Drinks',  'soft_drinks',  3),          -- id 11
    ('Juices',       'juices',       3),          -- id 12
    ('Tea',          'tea',          4),          -- id 13
    ('Coffee',       'coffee',       4),          -- id 14
    ('Whiteners',    'whiteners',    4),          -- id 15
    ('Pulses',       'pulses',       5),          -- id 16
    ('Noodles',      'noodles',      5),          -- id 17
    ('Spices',       'spices',       5),          -- id 18
    ('Oil & Ghee',   'oil_ghee',     5),          -- id 19
    ('Rice',         'rice',         5);          -- id 20

-- Level 2: Deeper sub-categories (demonstrating N-level depth)
INSERT INTO categories (name, slug, parent_id) VALUES
    ('Flavored Yogurt',  'flavored_yogurt',  6),  -- id 21 (Fresh > Fruits & Veg > Flavored Yogurt)
    ('Dark Chocolate',   'dark_chocolate',   9),   -- id 22 (Snacks > Chocolates > Dark Chocolate)
    ('Green Tea',        'green_tea',        13);  -- id 23 (Tea & Coffee > Tea > Green Tea)


-- ────────────────────────────────────────────────────────────────────────────
-- GLOBAL PRODUCTS (sysadmin catalog)
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO global_products (name, slug, brand_id, category_id, base_price, weight, weight_value, weight_unit, image_url, attributes) VALUES
    ('Nurpur Milk Full Cream 1000ml',               'nurpur-milk-1000ml',           1,  6,  520,   '1000 ml',  1000, 'ml', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',  '{"fat_pct": 3.5}'),
    ('NESCAFE Classic Coffee Jar 50g',               'nescafe-classic-50g',          2,  14, 1049,  '50 g',     50,   'g',  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',  '{"type": "instant"}'),
    ('Kingston Kerosene 650ml Green',                'kingston-kerosene-650ml',      3,  3,  750,   '650 ml',   650,  'ml', 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop', '{}'),
    ('Guard Ultimate Basmati Rice 5kg',              'guard-basmati-5kg',            4,  20, 570,   '5 kg',     5000, 'g',  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop', '{"grain_length": "extra_long"}'),
    ('Butterfly Pads Breathable Maxi XL 16s',        'butterfly-pads-xl-16',         5,  5,  600,   '16 pcs',   16,   'pcs','https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop', '{}'),
    ('Dalda Cooking Oil 5L',                         'dalda-oil-5l',                 6,  19, 2200,  '5 L',      5000, 'ml', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop', '{"type": "vegetable"}'),
    ('Tapal Danedar Tea 190g',                       'tapal-danedar-190g',           7,  13, 350,   '190 g',    190,  'g',  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',  '{"type": "black"}'),
    ('Coca Cola Pet Bottle 1.5L',                    'cocacola-1.5l',                8,  11, 180,   '1.5 L',    1500, 'ml', 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop', '{"carbonated": true}'),
    ('Oreo Original Biscuits 133g',                  'oreo-original-133g',           9,  8,  120,   '133 g',    133,  'g',  'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=400&fit=crop', '{"flavor": "original"}'),
    ('Dairy Milk Chocolate 38g',                     'dairy-milk-38g',               10, 9,  100,   '38 g',     38,   'g',  'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop', '{}'),
    ('Lays Classic Salted 70g',                      'lays-classic-70g',             11, 10, 80,    '70 g',     70,   'g',  'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop', '{"flavor": "salted"}'),
    ('Nestle Fruita Vitals Mango 1L',                'nestle-mango-1l',              12, 12, 250,   '1 L',      1000, 'ml', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop', '{"flavor": "mango"}'),
    ('Chana Dal 1kg',                                'chana-dal-1kg',                NULL, 16, 280, '1 kg',     1000, 'g',  'https://images.unsplash.com/photo-1515543904815-1ce5abfc329c?w=400&h=400&fit=crop', '{}'),
    ('Knorr Noodles Chatpata 66g',                   'knorr-chatpata-66g',           13, 17, 40,    '66 g',     66,   'g',  'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop', '{"flavor": "chatpata"}'),
    ('National Red Chili Powder 200g',               'national-chili-200g',          14, 18, 170,   '200 g',    200,  'g',  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop', '{"heat_level": "medium"}'),
    ('Olpers Full Cream Milk 1L',                    'olpers-milk-1l',               15, 6,  310,   '1 L',      1000, 'ml', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',  '{"fat_pct": 3.5}'),
    ('Lipton Yellow Label Tea 190g',                 'lipton-yellow-190g',           16, 13, 380,   '190 g',    190,  'g',  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',  '{"type": "black"}'),
    ('Pepsi Pet Bottle 1.5L',                        'pepsi-1.5l',                   17, 11, 170,   '1.5 L',    1500, 'ml', 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop', '{"carbonated": true}'),
    ('Shan Biryani Masala 50g',                      'shan-biryani-50g',             18, 18, 95,    '50 g',     50,   'g',  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop', '{}'),
    ('Super Basmati Rice 5kg',                       'super-basmati-5kg',            NULL, 20, 650, '5 kg',     5000, 'g',  'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop', '{"grain_length": "long"}'),
    ('Nestle Everyday Whitener 375g',                'everyday-whitener-375g',       19, 15, 490,   '375 g',    375,  'g',  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',  '{}'),
    ('Prince Biscuits Family Pack',                  'prince-biscuits-family',       20, 8,  150,   '190 g',    190,  'g',  'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=400&fit=crop', '{}'),
    ('Milo Energy Drink 180ml',                      'milo-180ml',                   21, 12, 120,   '180 ml',   180,  'ml', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop', '{}'),
    ('Masoor Dal 1kg',                               'masoor-dal-1kg',               NULL, 16, 320, '1 kg',     1000, 'g',  'https://images.unsplash.com/photo-1515543904815-1ce5abfc329c?w=400&h=400&fit=crop', '{}'),
    ('Habib Cooking Oil 5L',                         'habib-oil-5l',                 22, 19, 2100,  '5 L',      5000, 'ml', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop', '{"type": "vegetable"}'),
    ('KitKat Chocolate 38g',                         'kitkat-38g',                   23, 9,  90,    '38 g',     38,   'g',  'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&h=400&fit=crop', '{}'),
    ('Kurkure Chutney Chaska 65g',                   'kurkure-chutney-65g',          24, 10, 70,    '65 g',     65,   'g',  'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop', '{"flavor": "chutney_chaska"}'),
    ('Maggi Noodles 62g',                            'maggi-62g',                    25, 17, 45,    '62 g',     62,   'g',  'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop', '{}'),
    ('Chicken Breast 1kg',                           'chicken-breast-1kg',           NULL, 7, 580,  '1 kg',     1000, 'g',  'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=400&fit=crop', '{"cut": "breast"}'),
    ('Fresh Bananas 1 dozen',                        'bananas-1-dozen',              NULL, 6, 140,  '1 dozen',  12,   'pcs','https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop', '{}');


-- ────────────────────────────────────────────────────────────────────────────
-- PRODUCT BARCODES (demonstrating N:1 barcode → global product)
-- ────────────────────────────────────────────────────────────────────────────

INSERT INTO product_barcodes (global_product_id, barcode, barcode_format, is_primary) VALUES
    (1,  '8964001510017',  'EAN13', TRUE),   -- Nurpur Milk
    (1,  '8964001510024',  'EAN13', FALSE),  -- Nurpur Milk alt barcode
    (2,  '7613036080163',  'EAN13', TRUE),   -- NESCAFE
    (6,  '8964001809016',  'EAN13', TRUE),   -- Dalda Oil
    (7,  '8964001300014',  'EAN13', TRUE),   -- Tapal Danedar
    (8,  '5449000000996',  'EAN13', TRUE),   -- Coca Cola intl
    (8,  '8901030797019',  'EAN13', FALSE),  -- Coca Cola Pakistan variant
    (9,  '7622210100610',  'EAN13', TRUE),   -- Oreo
    (11, '8901491101615',  'EAN13', TRUE),   -- Lays
    (18, '012000802959',   'UPC_A', TRUE),   -- Pepsi UPC
    (18, '8859100700015',  'EAN13', FALSE);  -- Pepsi EAN alt


-- ────────────────────────────────────────────────────────────────────────────
-- Note: Stores, merchants, riders, customers, and orders require auth.users
-- entries. In local dev, create test users via Supabase Dashboard or API:
--
--   supabase auth signup --email admin@lootmart.pk --password test123456
--   supabase auth signup --email merchant@royal.pk --password test123456
--   supabase auth signup --email rider@lootmart.pk --password test123456
--   supabase auth signup --email customer@test.pk  --password test123456
--
-- Then populate profiles, stores, merchants, etc. with those UUIDs.
-- Below we use placeholder comments showing the intended structure.
-- ────────────────────────────────────────────────────────────────────────────

-- Example: After creating auth users, you would run:
--
-- INSERT INTO profiles (id, role, full_name, phone) VALUES
--     ('<admin-uuid>',    'sysadmin',  'Lootmart Admin',    '+923001234567'),
--     ('<merchant-uuid>', 'merchant',  'Royal Store Owner', '+923009876543'),
--     ('<rider-uuid>',    'rider',     'Ali Rider',         '+923005551234'),
--     ('<customer-uuid>', 'customer',  'Test Customer',     '+923007778888');
--
-- INSERT INTO stores (owner_id, name, slug, store_type, status, same_day_delivery, delivery_charges, min_order_value, free_delivery_threshold, store_hours, delivery_hours) VALUES
--     ('<merchant-uuid>', 'Royal Cash & Carry', 'royal-cash-and-carry', 'mart', 'active', TRUE, 100, 100, 1000, '8:00 AM - 11:59 PM', '4:00 PM - 11:00 PM');
--
-- Then link store_areas, merchants, store_products, etc.

SELECT 'Seed data loaded successfully. Create auth users and run store/merchant seeds next.' AS status;
