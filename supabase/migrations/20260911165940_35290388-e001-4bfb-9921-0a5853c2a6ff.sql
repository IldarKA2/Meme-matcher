CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE REFERENCES public.users(device_id) ON DELETE CASCADE,
  total_swipes integer NOT NULL DEFAULT 0,
  likes_count integer NOT NULL DEFAULT 0,
  dislikes_count integer NOT NULL DEFAULT 0,
  saves_count integer NOT NULL DEFAULT 0,
  top_category text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.user_statistics TO service_role;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS user_statistics_top_category_idx ON public.user_statistics (top_category);