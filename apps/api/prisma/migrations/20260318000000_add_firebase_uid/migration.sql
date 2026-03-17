-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firebase_uid" VARCHAR(128);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_firebase_uid_key" ON "users"("firebase_uid");
