-- ====================================================================
-- JUSTINO AI LEGAL // MIGRACIÓN DE TABLA DE ÓRDENES Y AUDITORÍA FINANCIERA
-- ====================================================================
-- Ejecuta este script en el Editor SQL de tu panel de Supabase
-- para habilitar la trazabilidad completa entre ventas reales y cupones.

-- 1. Crear o ampliar la tabla 'orders'
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    stripe_product_id TEXT DEFAULT 'prod_Tc8CPnxlKG0Yrm',
    customer_email TEXT,
    customer_name TEXT,
    amount_subtotal NUMERIC(10,2) DEFAULT 400.00,
    amount_discount NUMERIC(10,2) DEFAULT 0.00,
    amount_paid NUMERIC(10,2) DEFAULT 400.00,
    amount_total NUMERIC(10,2) DEFAULT 400.00,
    currency TEXT DEFAULT 'MXN',
    payment_method_type TEXT DEFAULT 'card', -- 'card', 'oxxo', 'spei', 'coupon_100'
    card_brand TEXT,                         -- 'visa', 'mastercard', 'amex', etc.
    card_last4 TEXT,                         -- '4242'
    coupon_applied TEXT,                     -- código de cupón si aplica
    payment_status TEXT DEFAULT 'paid',      -- 'paid', 'no_payment_required', 'pending'
    is_real_revenue BOOLEAN DEFAULT TRUE,    -- TRUE si amount_paid > 0, FALSE si cupón 100%
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Asegurar columnas en caso de que la tabla 'orders' ya exista previamente
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='amount_subtotal') THEN
        ALTER TABLE public.orders ADD COLUMN amount_subtotal NUMERIC(10,2) DEFAULT 400.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='amount_discount') THEN
        ALTER TABLE public.orders ADD COLUMN amount_discount NUMERIC(10,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='amount_paid') THEN
        ALTER TABLE public.orders ADD COLUMN amount_paid NUMERIC(10,2) DEFAULT 400.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_name') THEN
        ALTER TABLE public.orders ADD COLUMN customer_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method_type') THEN
        ALTER TABLE public.orders ADD COLUMN payment_method_type TEXT DEFAULT 'card';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='card_brand') THEN
        ALTER TABLE public.orders ADD COLUMN card_brand TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='card_last4') THEN
        ALTER TABLE public.orders ADD COLUMN card_last4 TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='is_real_revenue') THEN
        ALTER TABLE public.orders ADD COLUMN is_real_revenue BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='metadata') THEN
        ALTER TABLE public.orders ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Índices de aceleración
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_real_revenue ON public.orders(is_real_revenue);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_type ON public.orders(payment_method_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 4. Permisos de RLS para el servicio
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Política de lectura para administradores / service role
CREATE POLICY "Service Role Full Access Orders" ON public.orders
    FOR ALL
    USING (true)
    WITH CHECK (true);
