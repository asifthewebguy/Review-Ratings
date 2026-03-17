-- DropIndex
DROP INDEX "idx_users_nid_status";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_nid_reviewed_by_fkey" FOREIGN KEY ("nid_reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
