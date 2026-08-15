-- ==============================================================================
-- CediTrack - Ghana Personal & SME Finance Tracker
-- Supabase Database Schema & Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ACCOUNTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('mobile_money', 'bank', 'cash', 'other')),
    initial_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'GHS',
    color TEXT DEFAULT '#10B981',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast user account lookups
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- ------------------------------------------------------------------------------
-- 2. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system-wide defaults
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#64748B',
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for category lookups
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- ------------------------------------------------------------------------------
-- 3. TRANSACTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
    category TEXT NOT NULL,
    is_flagged_anomaly BOOLEAN NOT NULL DEFAULT false,
    anomaly_reason TEXT,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv_upload')),
    reference_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning fast queries, filtering and anomaly detection
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_date ON public.transactions(user_id, category, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_flagged ON public.transactions(user_id, is_flagged_anomaly);

-- ------------------------------------------------------------------------------
-- 4. UPLOAD LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.upload_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    row_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_upload_logs_user_id ON public.upload_logs(user_id);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_logs ENABLE ROW LEVEL SECURITY;

-- Accounts RLS Policies
CREATE POLICY "Users can view their own accounts"
    ON public.accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts"
    ON public.accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts"
    ON public.accounts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts"
    ON public.accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Categories RLS Policies (System categories readable by all authenticated users)
CREATE POLICY "Users can view system or their own categories"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Transactions RLS Policies
CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Upload Logs RLS Policies
CREATE POLICY "Users can view their own upload logs"
    ON public.upload_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own upload logs"
    ON public.upload_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. SYSTEM DEFAULT CATEGORIES (SEED DATA)
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (name, type, icon, color, is_system) VALUES
    -- Income
    ('Salary', 'Income', 'briefcase', '#10B981', true),
    ('Business Income', 'Income', 'store', '#059669', true),
    ('Gift/Remittance', 'Income', 'gift', '#14B8A6', true),
    ('Susu Payout', 'Income', 'piggy-bank', '#0D9488', true),
    ('Investment/Interest', 'Income', 'trending-up', '#0284C7', true),
    ('Other Income', 'Income', 'plus-circle', '#64748B', true),
    -- Expenses
    ('Transport', 'Expense', 'bus', '#F59E0B', true),
    ('Food', 'Expense', 'utensils', '#EF4444', true),
    ('MoMo/Airtime', 'Expense', 'smartphone', '#8B5CF6', true),
    ('Data Bundle', 'Expense', 'wifi', '#6366F1', true),
    ('Rent', 'Expense', 'home', '#EC4899', true),
    ('Bills', 'Expense', 'zap', '#F97316', true),
    ('Susu/Savings', 'Expense', 'vault', '#059669', true),
    ('Entertainment', 'Expense', 'film', '#A855F7', true),
    ('Personal Care', 'Expense', 'sparkles', '#D946EF', true),
    ('Inventory/Supplies', 'Expense', 'package', '#EAB308', true),
    ('Logistics/Delivery', 'Expense', 'truck', '#3B82F6', true),
    ('Marketing', 'Expense', 'megaphone', '#06B6D4', true),
    ('Other Expense', 'Expense', 'minus-circle', '#94A3B8', true)
ON CONFLICT DO NOTHING;
