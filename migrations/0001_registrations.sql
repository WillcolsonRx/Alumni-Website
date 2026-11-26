CREATE TABLE registrations (
  reference TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  programme TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise = 600000),
  transaction_reference TEXT NOT NULL UNIQUE,
  screenshot_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'declined')),
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT
) STRICT;
