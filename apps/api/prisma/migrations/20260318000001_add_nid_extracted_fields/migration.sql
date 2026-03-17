-- AlterTable
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "nid_extracted_name"    TEXT,
  ADD COLUMN IF NOT EXISTS "nid_extracted_dob"     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "nid_extracted_address" TEXT,
  ADD COLUMN IF NOT EXISTS "nid_extracted_father"  TEXT,
  ADD COLUMN IF NOT EXISTS "nid_extracted_mother"  TEXT;
