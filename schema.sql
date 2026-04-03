-- users table (Links to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  phone text,
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- addresses table (for user shipping routes)
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image text,
  "order" integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- banners table (for homepage)
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  subtitle text,
  image_url text,
  link text,
  "order" integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  original_price numeric,
  stock integer DEFAULT 0,
  category text,
  images jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  featured boolean DEFAULT false,
  sales_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  type text CHECK (type IN ('percentage', 'fixed')),
  value numeric NOT NULL,
  max_discount numeric,
  min_order_value numeric,
  max_uses integer,
  max_uses_per_user integer DEFAULT 1,
  used_count integer DEFAULT 0,
  used_by jsonb DEFAULT '{}'::jsonb,
  expiry_date timestamp with time zone,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name text,
  email text,
  phone text,
  shipping_address jsonb,
  billing_address jsonb,
  items jsonb,
  subtotal numeric,
  discount numeric,
  total numeric,
  refund_amount numeric DEFAULT 0,
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  payment_method text,
  payment_id text,
  shipment_id text,
  tracking_url text,
  awb_code text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- settings table (Polymorphic structure for admin configs)
CREATE TABLE IF NOT EXISTS public.settings (
  id text PRIMARY KEY,
  -- Store Configs
  store_name text,
  tagline text,
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  free_shipping_threshold numeric,
  standard_shipping numeric,
  express_shipping numeric,
  gst_number text,
  business_address text,
  facebook_url text,
  instagram_url text,
  pinterest_url text,
  return_policy text,
  terms_of_service text,
  privacy_policy text,
  cod_available boolean,
  
  -- Integrations (Payment / Logistics)
  provider text,
  enabled boolean,
  environment text,
  client_id text,
  client_secret text,
  client_version text,
  webhook_username text,
  webhook_password text,
  email text,
  password text,
  
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security) Templates:
-- To keep things smooth initially, these tables assume standard read/write for now,
-- but you should run these statements if you want simple, open-door access from the client while debugging, 
-- or write custom rules locking down the API endpoints safely.

-- Example: Open read-access to products:
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_all_read" ON products FOR SELECT USING (true);
