CREATE TABLE IF NOT EXISTS stocks (
  edinet_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  corporate_number TEXT NOT NULL,
  corporate_number_last_digit INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stocks_industry
  ON stocks (industry);

CREATE INDEX IF NOT EXISTS idx_stocks_industry_last_digit
  ON stocks (industry, corporate_number_last_digit);
