-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "email"               VARCHAR(255),
  ADD COLUMN "email_verified_at"   TIMESTAMPTZ,
  ADD COLUMN "nid_number"          VARCHAR(20),
  ADD COLUMN "nid_doc_url"         TEXT,
  ADD COLUMN "nid_doc_url_back"    TEXT,
  ADD COLUMN "nid_status"          VARCHAR(20) NOT NULL DEFAULT 'none',
  ADD COLUMN "nid_verified_at"     TIMESTAMPTZ,
  ADD COLUMN "nid_rejected_reason" TEXT,
  ADD COLUMN "nid_reviewed_by"     UUID,
  ADD COLUMN "nid_reviewed_at"     TIMESTAMPTZ;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_nid_status" ON "users"("nid_status");
