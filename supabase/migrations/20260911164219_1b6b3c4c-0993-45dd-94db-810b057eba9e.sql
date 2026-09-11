CREATE TABLE public.memes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  top_text text NOT NULL DEFAULT '',
  bottom_text text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'en',
  category text NOT NULL DEFAULT 'relatable',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  meme_id uuid NOT NULL REFERENCES public.memes(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('like','dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, meme_id)
);

CREATE TABLE public.saved_memes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  meme_id uuid NOT NULL REFERENCES public.memes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, meme_id)
);

CREATE INDEX swipes_device_idx ON public.swipes (device_id);
CREATE INDEX saved_device_idx ON public.saved_memes (device_id);

GRANT SELECT ON public.memes TO anon, authenticated;
GRANT ALL ON public.memes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.swipes TO anon, authenticated;
GRANT ALL ON public.swipes TO service_role;
GRANT SELECT, INSERT, DELETE ON public.saved_memes TO anon, authenticated;
GRANT ALL ON public.saved_memes TO service_role;

ALTER TABLE public.memes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_memes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memes are public" ON public.memes FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can read swipes" ON public.swipes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add swipes" ON public.swipes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update swipes" ON public.swipes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete swipes" ON public.swipes FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can read saves" ON public.saved_memes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add saves" ON public.saved_memes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete saves" ON public.saved_memes FOR DELETE TO anon, authenticated USING (true);

INSERT INTO public.memes (image_url, top_text, bottom_text, language, category) VALUES
('https://i.imgflip.com/30b1gx.jpg', 'Finishing the task', 'Watching one more meme', 'en', 'relatable'),
('https://i.imgflip.com/1g8my4.jpg', 'Go to bed early', 'Start one more episode', 'en', 'relatable'),
('https://i.imgflip.com/1ur9b0.jpg', 'Me, my unfinished projects, and a brand new idea', '', 'en', 'work'),
('https://i.imgflip.com/2fm6x.jpg', 'Waiting for the build to finish', '', 'en', 'nerd'),
('https://i.imgflip.com/24y43o.jpg', 'Pineapple belongs on pizza', 'Change my mind', 'en', 'absurd'),
('https://i.imgflip.com/wxica.jpg', 'Deploying on Friday afternoon', 'This is fine', 'en', 'work'),
('https://i.imgflip.com/gk5el.jpg', 'Sure, this meeting could have been an email', '', 'en', 'work'),
('https://i.imgflip.com/1jwhww.jpg', 'Alarm at 7. Snooze at 7:09. Snooze at 7:18.', 'Work from bed', 'en', 'relatable'),
('https://i.imgflip.com/1h7in3.jpg', 'Can''t lose your keys', 'if you never leave the house', 'en', 'absurd'),
('https://i.imgflip.com/2gnnjh.jpg', 'When you send the message to the wrong chat', '', 'en', 'relatable'),
('https://i.imgflip.com/46e43q.png', 'Wait, it''s all cat videos?', 'Always has been', 'en', 'absurd'),
('https://i.imgflip.com/43a45p.png', 'Me planning the week', 'Me on Monday morning', 'en', 'relatable'),
('https://i.imgflip.com/54hjww.jpg', 'I receive: all the snacks', 'You receive: the crumbs', 'en', 'absurd'),
('https://i.imgflip.com/345v97.jpg', 'It is your turn to do the dishes', 'I am a cat', 'en', 'wholesome'),
('https://i.imgflip.com/1bij.jpg', 'One does not simply', 'eat only one chip', 'en', 'relatable'),
('https://i.imgflip.com/2ybua0.png', 'Drinking water', 'Maintaining optimal hydration', 'en', 'wholesome'),
('https://i.imgflip.com/3eqjd8.jpg', 'My three tabs with the exact same article', '', 'en', 'nerd'),
('https://i.imgflip.com/64sz4u.png', 'No meetings today?', '', 'en', 'work'),
('https://i.imgflip.com/3oevdk.jpg', 'Я снова прошу', 'выключить уведомления в рабочем чате', 'ru', 'work'),
('https://i.imgflip.com/19vcz0.jpg', 'Хочу отпуск на месяц', 'Лучшее, что могу предложить — пятница', 'ru', 'work'),
('https://i.imgflip.com/145qvv.jpg', 'Смотрю, как люди ложатся спать вовремя', '', 'ru', 'relatable'),
('https://i.imgflip.com/26jxvz.jpg', 'Куплю абонемент в зал. Буду ходить. Не буду ходить.', '', 'ru', 'relatable'),
('https://i.imgflip.com/1otk96.jpg', 'ПрОсТо НаЧнИ с ПоНеДеЛьНиКа', '', 'ru', 'absurd'),
('https://i.imgflip.com/28j0te.jpg', 'Кот в 5 утра и будильник в 7', 'Разбудить меня', 'ru', 'wholesome'),
('https://i.imgflip.com/23ls.jpg', 'Сказал: «последняя серия»', '', 'ru', 'dark'),
('https://i.imgflip.com/1o00in.jpg', 'Это отдых?', 'Проверяю рабочую почту в отпуске', 'ru', 'work'),
('https://i.imgflip.com/5c7lwq.png', 'Я всё сохранил', 'Ты же нажал Ctrl+S, да?', 'ru', 'nerd'),
('https://i.imgflip.com/5v6gwj.jpg', 'Я, который выспался', 'Я, который смотрел мемы до трёх ночи', 'ru', 'relatable');