
-- Budget settings per user: single source of truth untuk threshold Rp 2.000.000
CREATE TABLE public.budget_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_threshold NUMERIC NOT NULL DEFAULT 2000000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.budget_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own budget_settings" ON public.budget_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own budget_settings" ON public.budget_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budget_settings" ON public.budget_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_budget_settings_updated_at BEFORE UPDATE ON public.budget_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Category flags: kategori mana yang tetap boleh dipakai saat Survival Mode, dan mana yang dianggap hutang/paylater
ALTER TABLE public.categories ADD COLUMN is_essential BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.categories ADD COLUMN is_debt BOOLEAN NOT NULL DEFAULT false;

-- Pre-tag kategori default yang sudah ada (user masih bisa ubah manual lewat halaman Profil nanti)
UPDATE public.categories SET is_essential = true WHERE is_default = true AND name IN ('Keluarga', 'Kebutuhan Pribadi', 'Transportasi');
UPDATE public.categories SET is_debt = true WHERE is_default = true AND name = 'Hutang';

-- Vault Lock acknowledgement flag — true kalau user sudah checklist "sudah pindahkan uang" untuk transaksi income ini
ALTER TABLE public.transactions ADD COLUMN vault_ack BOOLEAN NOT NULL DEFAULT false;
