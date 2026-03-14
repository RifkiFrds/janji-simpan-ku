
-- Create accounts table (financial buckets)
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '💰',
  is_master BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id AND is_master = false);

-- Create allocation_rules table
CREATE TABLE public.allocation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, account_id)
);

ALTER TABLE public.allocation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allocation_rules" ON public.allocation_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own allocation_rules" ON public.allocation_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own allocation_rules" ON public.allocation_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own allocation_rules" ON public.allocation_rules FOR DELETE USING (auth.uid() = user_id);

-- Create saving_rules table
CREATE TABLE public.saving_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  min_saving_per_semester NUMERIC NOT NULL DEFAULT 0,
  ideal_saving_ratio NUMERIC NOT NULL DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.saving_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saving_rules" ON public.saving_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own saving_rules" ON public.saving_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saving_rules" ON public.saving_rules FOR UPDATE USING (auth.uid() = user_id);

-- Add account_id to transactions table
ALTER TABLE public.transactions ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Create update triggers
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_allocation_rules_updated_at BEFORE UPDATE ON public.allocation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_saving_rules_updated_at BEFORE UPDATE ON public.saving_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for semesters and transactions updated_at (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_semesters_updated_at') THEN
    CREATE TRIGGER update_semesters_updated_at BEFORE UPDATE ON public.semesters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_transactions_updated_at') THEN
    CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
