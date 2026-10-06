ALTER TABLE profiles
  ADD COLUMN calendar_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE;
