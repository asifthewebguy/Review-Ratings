-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_nid_reviewed_by_fkey";

-- DropIndex
DROP INDEX IF EXISTS "idx_users_nid_status";

-- AlterTable
ALTER TABLE "users"
  DROP COLUMN IF EXISTS "nid_number",
  DROP COLUMN IF EXISTS "nid_doc_url",
  DROP COLUMN IF EXISTS "nid_doc_url_back",
  DROP COLUMN IF EXISTS "nid_status",
  DROP COLUMN IF EXISTS "nid_verified_at",
  DROP COLUMN IF EXISTS "nid_rejected_reason",
  DROP COLUMN IF EXISTS "nid_reviewed_by",
  DROP COLUMN IF EXISTS "nid_reviewed_at",
  DROP COLUMN IF EXISTS "nid_extracted_name",
  DROP COLUMN IF EXISTS "nid_extracted_dob",
  DROP COLUMN IF EXISTS "nid_extracted_address",
  DROP COLUMN IF EXISTS "nid_extracted_father",
  DROP COLUMN IF EXISTS "nid_extracted_mother";
