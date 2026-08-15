"""
Seed Test Data into Supabase PostgreSQL Database for TVISA / Lumière Jewels
"""
import psycopg2
import uuid

DB_URL = "postgresql://postgres.acdlrnbqnnuvobvfbwaf:sisode11002299@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require"

conn = psycopg2.connect(DB_URL)
cursor = conn.cursor()

print("Seeding test categories, products, variants, images, hero sliders, and social posts...")

# 1. Coating Types
coatings = [
    ('18k Yellow Gold', '#FFD700'),
    ('925 Sterling Silver', '#C0C0C0'),
    ('18k Rose Gold', '#B76E79')
]
for name, hex_c in coatings:
    cursor.execute("""
    INSERT INTO coating_types (id, name, color_rgb, created_at, updated_at)
    VALUES (%s, %s, %s, NOW(), NOW())
    ON CONFLICT (name) DO NOTHING;
    """, (str(uuid.uuid4()), name, hex_c))

# 2. Categories
cats_data = [
    ('Rings', 'rings', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop', 1),
    ('Necklaces', 'necklaces', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop', 2),
    ('Earrings', 'earrings', 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=800&auto=format&fit=crop', 3),
    ('Bracelets', 'bracelets', 'https://images.unsplash.com/photo-1611591475143-be232935f458?q=80&w=800&auto=format&fit=crop', 4)
]

for name, slug, img, order in cats_data:
    cursor.execute("""
    INSERT INTO categories (id, name, slug, image, is_active, display_order, created_at, updated_at)
    VALUES (%s, %s, %s, %s, True, %s, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET image = EXCLUDED.image, is_active = True;
    """, (str(uuid.uuid4()), name, slug, img, order))

# Get category IDs from DB
cursor.execute("SELECT id, slug FROM categories WHERE slug IN ('rings', 'necklaces', 'earrings', 'bracelets');")
cats = {row[1]: row[0] for row in cursor.fetchall()}

# 3. Products Data
products_list = [
    {
        "id": str(uuid.uuid4()),
        "cat_id": cats['rings'],
        "name": "Aura Solitaire Diamond Ring",
        "desc": "Handcrafted 18k gold solitaire ring featuring a brilliant round diamond.",
        "styling": "Style with evening gowns or minimal office wear.",
        "base_price": 24999.00,
        "disc_price": 19999.00,
        "disc_text": "20% OFF",
        "bestseller": True,
        "quick_pick": True,
        "new_arrival": False,
        "image": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1000&auto=format&fit=crop",
        "variants": [
            ("Gold", "US 7", 19999.00, 25, "SKU-RING-SOL-G7"),
            ("Silver", "US 7", 17999.00, 15, "SKU-RING-SOL-S7")
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "cat_id": cats['necklaces'],
        "name": "Elysian Emerald Cut Pendant",
        "desc": "Stunning emerald pendant encased in fine sterling silver with a delicate chain.",
        "styling": "Perfect statement piece for celebrations.",
        "base_price": 14999.00,
        "disc_price": 11999.00,
        "disc_text": "20% OFF",
        "bestseller": True,
        "quick_pick": False,
        "new_arrival": True,
        "image": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1000&auto=format&fit=crop",
        "variants": [
            ("Silver", "18 inch", 11999.00, 30, "SKU-NECK-EM-S18")
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "cat_id": cats['earrings'],
        "name": "Celeste Pearl Drop Earrings",
        "desc": "Lustrous freshwater pearls suspended from delicate 18k gold drop hooks.",
        "styling": "Pair with traditional silk wear or contemporary dresses.",
        "base_price": 8999.00,
        "disc_price": 6999.00,
        "disc_text": "22% OFF",
        "bestseller": False,
        "quick_pick": True,
        "new_arrival": True,
        "image": "https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=1000&auto=format&fit=crop",
        "variants": [
            ("Gold", "Standard", 6999.00, 50, "SKU-EAR-PRL-G")
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "cat_id": cats['bracelets'],
        "name": "Sovereign Cuban Chain Bracelet",
        "desc": "Bold 18k yellow gold Cuban link bracelet with high-polish finish.",
        "styling": "Ideal for layering or bold standalone wristwear.",
        "base_price": 18499.00,
        "disc_price": 15999.00,
        "disc_text": "13% OFF",
        "bestseller": True,
        "quick_pick": True,
        "new_arrival": False,
        "image": "https://images.unsplash.com/photo-1611591475143-be232935f458?q=80&w=1000&auto=format&fit=crop",
        "variants": [
            ("Gold", "7.5 inch", 15999.00, 20, "SKU-BRAC-CUB-G75")
        ]
    },
    {
        "id": str(uuid.uuid4()),
        "cat_id": cats['bracelets'],
        "name": "Lumière Diamond Tennis Bracelet",
        "desc": "Timeless line bracelet set with continuous brilliant-cut cubic zirconia.",
        "styling": "Elevates any ensemble instantly.",
        "base_price": 12999.00,
        "disc_price": 9999.00,
        "disc_text": "23% OFF",
        "bestseller": False,
        "quick_pick": True,
        "new_arrival": True,
        "image": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1000&auto=format&fit=crop",
        "variants": [
            ("Silver", "7 inch", 9999.00, 40, "SKU-BRAC-TEN-S7")
        ]
    }
]

for p in products_list:
    cursor.execute("""
    INSERT INTO products (id, category_id, name, description, styling, base_price, discounted_price, discount_text, is_active, is_bestseller, is_quick_pick, is_new_arrival, created_at, updated_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, True, %s, %s, %s, NOW(), NOW());
    """, (p["id"], p["cat_id"], p["name"], p["desc"], p["styling"], p["base_price"], p["disc_price"], p["disc_text"], p["bestseller"], p["quick_pick"], p["new_arrival"]))
    
    # Image
    cursor.execute("""
    INSERT INTO product_images (id, product_id, image, is_primary, display_order, created_at, updated_at)
    VALUES (%s, %s, %s, True, 1, NOW(), NOW());
    """, (str(uuid.uuid4()), p["id"], p["image"]))
    
    # Variants
    for metal, sz, prc, stk, sku_code in p["variants"]:
        cursor.execute("""
        INSERT INTO product_variants (id, product_id, coating_id, metal_type, size, price, stock, sku, created_at, updated_at)
        VALUES (%s, %s, NULL, %s, %s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT (sku) DO NOTHING;
        """, (str(uuid.uuid4()), p["id"], metal, sz, prc, stk, sku_code))

# 4. Hero Sliders
cursor.execute("""
INSERT INTO hero_sliders (id, image, mobile_image, title, subtitle, link_url, is_active, display_order, created_at)
VALUES
    (%s, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop', NULL, 'Timeless Luxury', 'Discover handcrafted fine jewelry made for every occasion.', '/products', True, 1, NOW()),
    (%s, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1600&auto=format&fit=crop', NULL, 'New Arrivals Collection', 'Elegant diamond & gemstone designs newly added.', '/categories/necklaces', True, 2, NOW());
""", (str(uuid.uuid4()), str(uuid.uuid4())))

# 5. Instagram Posts
cursor.execute("""
INSERT INTO instagram_posts (id, image, link_url, is_active, display_order, created_at)
VALUES
    (%s, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop', 'https://instagram.com', True, 1, NOW()),
    (%s, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop', 'https://instagram.com', True, 2, NOW()),
    (%s, 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=600&auto=format&fit=crop', 'https://instagram.com', True, 3, NOW());
""", (str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())))

conn.commit()
cursor.close()
conn.close()

print("Successfully seeded test products, categories, images, hero sliders, and Instagram posts!")
