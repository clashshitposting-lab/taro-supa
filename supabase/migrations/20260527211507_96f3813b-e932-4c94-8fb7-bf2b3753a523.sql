CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles select dono" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles insert dono" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles update dono" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios veem seus papeis" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- readings
CREATE TABLE public.readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text,
  full_interpretation jsonb,
  is_unlocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.readings TO authenticated;
GRANT ALL ON public.readings TO service_role;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leituras select dono" ON public.readings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Leituras insert dono" ON public.readings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leituras update dono" ON public.readings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Leituras delete dono" ON public.readings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- reading_previews
CREATE TABLE public.reading_previews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text,
  claimed_by uuid,
  claimed_reading_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reading_previews TO anon, authenticated;
GRANT UPDATE ON public.reading_previews TO authenticated;
GRANT ALL ON public.reading_previews TO service_role;
ALTER TABLE public.reading_previews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Previews select publico" ON public.reading_previews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Previews insert publico" ON public.reading_previews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Previews update dono reivindica" ON public.reading_previews FOR UPDATE TO authenticated
  USING (claimed_by IS NULL OR claimed_by = auth.uid())
  WITH CHECK (claimed_by = auth.uid());

-- astral_charts
CREATE TABLE public.astral_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  birth_name text NOT NULL,
  birth_date date NOT NULL,
  birth_time time,
  birth_place text NOT NULL,
  interpretation jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.astral_charts TO authenticated;
GRANT ALL ON public.astral_charts TO service_role;
ALTER TABLE public.astral_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mapas select dono" ON public.astral_charts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Mapas insert dono" ON public.astral_charts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Mapas update dono" ON public.astral_charts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Mapas delete dono" ON public.astral_charts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- offers
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  includes jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.offers TO anon, authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ofertas publicas" ON public.offers FOR SELECT TO anon, authenticated USING (is_active = true);

-- purchases
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  offer_id uuid NOT NULL REFERENCES public.offers(id),
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Compras select dono" ON public.purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Compras insert dono" ON public.purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- user_entitlements
CREATE TABLE public.user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  source_purchase_id uuid REFERENCES public.purchases(id),
  daily_quota integer,
  total_remaining integer,
  last_consumed_at timestamptz,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_entitlements TO authenticated;
GRANT ALL ON public.user_entitlements TO service_role;
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Direitos select dono" ON public.user_entitlements FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END $$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_readings_updated_at BEFORE UPDATE ON public.readings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_astral_charts_updated_at BEFORE UPDATE ON public.astral_charts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_user_entitlements_updated_at BEFORE UPDATE ON public.user_entitlements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.offers (slug, title, subtitle, description, price_cents, currency, includes, is_active)
VALUES (
  'pacote-despertar',
  'Pacote Despertar',
  'Sua jornada começa aqui',
  'Acesso à leitura completa de tarot + mapa astral personalizado.',
  4990,
  'BRL',
  '["Leitura de tarot completa", "Mapa astral personalizado", "Histórico ilimitado"]'::jsonb,
  true
);