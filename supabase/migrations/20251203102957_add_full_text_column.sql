/*
  # Add full_text column for efficient processing

  1. Changes
    - Add `full_text` column to store extracted PDF text
    - Add `text_length` column to track document size
    - Update existing records to have default values
  
  2. Purpose
    - Separate PDF extraction from summarization
    - Store extracted text for faster reprocessing
    - Enable server-side extraction via Edge Functions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'full_text'
  ) THEN
    ALTER TABLE documents ADD COLUMN full_text text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'text_length'
  ) THEN
    ALTER TABLE documents ADD COLUMN text_length integer DEFAULT 0;
  END IF;
END $$;
