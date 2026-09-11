DELETE FROM public.saved_memes;
DELETE FROM public.swipes;
DELETE FROM public.memes;

ALTER TABLE public.memes DROP COLUMN image_url;
ALTER TABLE public.memes DROP COLUMN top_text;
ALTER TABLE public.memes DROP COLUMN bottom_text;
ALTER TABLE public.memes ADD COLUMN template text NOT NULL DEFAULT 'drake';
ALTER TABLE public.memes ADD COLUMN lines text[] NOT NULL DEFAULT '{}';

INSERT INTO public.memes (template, lines, language, category) VALUES
('drake', ARRAY['Finishing the task','Watching one more meme'], 'en', 'relatable'),
('ds', ARRAY['Go to bed early','One more episode','Me at 1 a.m.'], 'en', 'relatable'),
('db', ARRAY['A brand new idea','Me','My unfinished projects'], 'en', 'work'),
('fine', ARRAY['Deploying on Friday','This is fine'], 'en', 'dark'),
('cmm', ARRAY['Pineapple belongs on pizza'], 'en', 'absurd'),
('harold', ARRAY['This meeting could have been an email','But I smile anyway'], 'en', 'work'),
('rollsafe', ARRAY['Can''t lose your keys','if you never leave the house'], 'en', 'absurd'),
('mordor', ARRAY['One does not simply','eat only one chip'], 'en', 'relatable'),
('spiderman', ARRAY['My tab','My other tab with the same article'], 'en', 'nerd'),
('pooh', ARRAY['Drinking water','Maintaining optimal hydration'], 'en', 'wholesome'),
('woman-cat', ARRAY['It''s your turn to do the dishes','I am a cat'], 'en', 'wholesome'),
('astronaut', ARRAY['Wait, it''s all cat videos?','Always has been'], 'en', 'absurd'),
('success', ARRAY['Woke up before the alarm','Went back to sleep anyway'], 'en', 'relatable'),
('grumpycat', ARRAY['They told me to smile','No'], 'en', 'dark'),
('stonks', ARRAY['Bought snacks for the whole week','Ate them in one night'], 'en', 'absurd'),
('oprah', ARRAY['You get a deadline','Everybody gets a deadline'], 'en', 'work'),
('seagull', ARRAY['When someone says','the code is self-documenting'], 'en', 'nerd'),
('kombucha', ARRAY['Monday morning coffee','Monday morning meetings'], 'en', 'work'),
('bus', ARRAY['Я, который выспался','Я, который смотрел мемы до трёх ночи'], 'ru', 'relatable'),
('gru', ARRAY['Куплю абонемент в зал','Схожу один раз','Больше не пойду','Больше не пойду'], 'ru', 'relatable'),
('spongebob', ARRAY['просто начни с понедельника'], 'ru', 'absurd'),
('disastergirl', ARRAY['Сказал: последняя серия','Три часа ночи'], 'ru', 'dark'),
('pigeon', ARRAY['Я','Почта в отпуске','Это отдых?'], 'ru', 'work'),
('kermit', ARRAY['Можно было выспаться','Но это не моё дело'], 'ru', 'relatable'),
('doge', ARRAY['такой понедельник','много кофе'], 'ru', 'absurd'),
('handshake', ARRAY['Кот в 5 утра','Будильник в 7','Разбудить меня'], 'ru', 'wholesome'),
('morpheus', ARRAY['Что если я скажу тебе','что задача была на пять минут'], 'ru', 'work'),
('fry', ARRAY['Не понял: это баг','или так и задумано'], 'ru', 'nerd'),
('buzz', ARRAY['Уведомления','Уведомления повсюду'], 'ru', 'work'),
('panik-kalm-panik', ARRAY['Сдал отчёт вовремя','Всё успел','Отправил не тот файл'], 'ru', 'work'),
('khaby-lame', ARRAY['Совет: просто не уставай','Спасибо, помогло'], 'ru', 'absurd');