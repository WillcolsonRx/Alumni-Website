CREATE TABLE registrations_fee_update (
  reference TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  programme TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise IN (590000, 600000)),
  transaction_reference TEXT NOT NULL UNIQUE,
  screenshot_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'declined')),
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  phone TEXT,
  city TEXT,
  country TEXT,
  employer TEXT,
  job_title TEXT,
  linkedin_url TEXT,
  industry TEXT,
  gender TEXT,
  profile_photo_key TEXT,
  department TEXT,
  enrollment_number TEXT,
  admission_year INTEGER,
  thesis_title TEXT
) STRICT;

INSERT INTO registrations_fee_update (
  reference, name, email, programme, graduation_year, amount_paise, transaction_reference, screenshot_key, status, submitted_at, reviewed_at,
  phone, city, country, employer, job_title, linkedin_url, industry, gender, profile_photo_key, department, enrollment_number, admission_year, thesis_title
)
SELECT reference, name, email, programme, graduation_year, amount_paise, transaction_reference, screenshot_key, status, submitted_at, reviewed_at,
  phone, city, country, employer, job_title, linkedin_url, industry, gender, profile_photo_key, department, enrollment_number, admission_year, thesis_title
FROM registrations;

DROP TABLE registrations;
ALTER TABLE registrations_fee_update RENAME TO registrations;
