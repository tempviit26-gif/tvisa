-- ==============================================================================
-- TVISA / Lumière Jewels Database Schema Migration (Idempotent)
-- Designed for Supabase PostgreSQL with RLS, FK constraints & Indexes
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- Utility Function: Automated updated_at timestamp trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. Users Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) DEFAULT '',
    is_active BOOLEAN DEFAULT false,
    is_staff BOOLEAN DEFAULT false,
    is_email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 2. Email Verification OTPs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_verification_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_otps_user_id ON public.email_verification_otps(user_id);

-- ------------------------------------------------------------------------------
-- 3. Addresses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    street TEXT DEFAULT '',
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
DROP TRIGGER IF EXISTS trigger_addresses_updated_at ON public.addresses;
CREATE TRIGGER trigger_addresses_updated_at
BEFORE UPDATE ON public.addresses
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 4. Categories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    image TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON public.categories;
CREATE TRIGGER trigger_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 5. Subcategories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    image TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
DROP TRIGGER IF EXISTS trigger_subcategories_updated_at ON public.subcategories;
CREATE TRIGGER trigger_subcategories_updated_at
BEFORE UPDATE ON public.subcategories
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 6. Coating Types
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coating_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color_rgb VARCHAR(50) DEFAULT '#CCCCCC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trigger_coating_types_updated_at ON public.coating_types;
CREATE TRIGGER trigger_coating_types_updated_at
BEFORE UPDATE ON public.coating_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 7. Products
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    styling TEXT DEFAULT '',
    base_price NUMERIC(12, 2) NOT NULL,
    discounted_price NUMERIC(12, 2),
    discount_text VARCHAR(50) DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    is_bestseller BOOLEAN DEFAULT false,
    is_quick_pick BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_product_bestseller ON public.products(is_active, is_bestseller, updated_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_quickpick ON public.products(is_active, is_quick_pick, updated_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_newarrival ON public.products(is_active, is_new_arrival, updated_at DESC, created_at DESC);

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 8. Product Variants
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    coating_id UUID REFERENCES public.coating_types(id) ON DELETE SET NULL,
    metal_type VARCHAR(100) NOT NULL,
    size VARCHAR(50) DEFAULT '',
    price NUMERIC(12, 2) NOT NULL,
    stock INT DEFAULT 0,
    sku VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_coating_id ON public.product_variants(coating_id);

DROP TRIGGER IF EXISTS trigger_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER trigger_product_variants_updated_at
BEFORE UPDATE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 9. Product Images
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

DROP TRIGGER IF EXISTS trigger_product_images_updated_at ON public.product_images;
CREATE TRIGGER trigger_product_images_updated_at
BEFORE UPDATE ON public.product_images
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 10. Hero Sliders & Instagram Posts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hero_sliders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image TEXT NOT NULL,
    mobile_image TEXT,
    title VARCHAR(255) DEFAULT '',
    subtitle VARCHAR(255) DEFAULT '',
    link_url VARCHAR(500) DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.instagram_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image TEXT NOT NULL,
    link_url VARCHAR(500) DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 11. Shopping Carts & Cart Items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    guest_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

DROP TRIGGER IF EXISTS trigger_carts_updated_at ON public.carts;
CREATE TRIGGER trigger_carts_updated_at
BEFORE UPDATE ON public.carts
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_cart_variant UNIQUE (cart_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items(variant_id);

DROP TRIGGER IF EXISTS trigger_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER trigger_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 12. Orders, Order Items, Status & Payment History
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'payment_not_received',
    subtotal_amount NUMERIC(12, 2) NOT NULL,
    shipping_charge NUMERIC(8, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    tracking_link VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_address_id ON public.orders(address_id);

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    note TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(255) NOT NULL,
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(500),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'initiated',
    payment_method VARCHAR(50),
    failure_reason TEXT,
    refund_id VARCHAR(255),
    refund_amount NUMERIC(12, 2),
    gateway_response JSONB,
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_order_id ON public.payment_history(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON public.payment_history(user_id);

-- ------------------------------------------------------------------------------
-- 13. Wishlists
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    guest_id VARCHAR(100),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);

-- ------------------------------------------------------------------------------
-- 14. Enable Row Level Security (RLS) on all tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coating_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_sliders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 15. Standard Security Policies (RLS - Idempotent)
-- ------------------------------------------------------------------------------

-- Public catalog tables: Read access for everyone (anon + authenticated)
DROP POLICY IF EXISTS "Public catalog read access" ON public.categories;
CREATE POLICY "Public catalog read access" ON public.categories FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Public subcategories read access" ON public.subcategories;
CREATE POLICY "Public subcategories read access" ON public.subcategories FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Public coating types read access" ON public.coating_types;
CREATE POLICY "Public coating types read access" ON public.coating_types FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public products read access" ON public.products;
CREATE POLICY "Public products read access" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Public product variants read access" ON public.product_variants;
CREATE POLICY "Public product variants read access" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public product images read access" ON public.product_images;
CREATE POLICY "Public product images read access" ON public.product_images FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public hero sliders read access" ON public.hero_sliders;
CREATE POLICY "Public hero sliders read access" ON public.hero_sliders FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Public instagram posts read access" ON public.instagram_posts;
CREATE POLICY "Public instagram posts read access" ON public.instagram_posts FOR SELECT TO anon, authenticated USING (is_active = true);

-- User personal data: Ownership-restricted access
DROP POLICY IF EXISTS "User self select" ON public.users;
CREATE POLICY "User self select" ON public.users FOR SELECT TO authenticated USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "User self update" ON public.users;
CREATE POLICY "User self update" ON public.users FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Address user select" ON public.addresses;
CREATE POLICY "Address user select" ON public.addresses FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Address user insert" ON public.addresses;
CREATE POLICY "Address user insert" ON public.addresses FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Address user update" ON public.addresses;
CREATE POLICY "Address user update" ON public.addresses FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Address user delete" ON public.addresses;
CREATE POLICY "Address user delete" ON public.addresses FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Cart user select" ON public.carts;
CREATE POLICY "Cart user select" ON public.carts FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Cart user insert" ON public.carts;
CREATE POLICY "Cart user insert" ON public.carts FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Cart user update" ON public.carts;
CREATE POLICY "Cart user update" ON public.carts FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Orders user select" ON public.orders;
CREATE POLICY "Orders user select" ON public.orders FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Orders user insert" ON public.orders;
CREATE POLICY "Orders user insert" ON public.orders FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 16. Data API Grants
-- ------------------------------------------------------------------------------
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
