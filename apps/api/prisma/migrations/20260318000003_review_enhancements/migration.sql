-- CreateTable: review_edits (pending edits awaiting admin approval)
CREATE TABLE "review_edits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "body" TEXT NOT NULL,
    "photo_urls" TEXT[],
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_edits_pkey" PRIMARY KEY ("id")
);

-- CreateTable: review_reactions (helpful / unhelpful)
CREATE TABLE "review_reactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: review_updates (author follow-up additions)
CREATE TABLE "review_updates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_updates_pkey" PRIMARY KEY ("id")
);

-- Add new columns to reviews
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "unhelpful_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "original_body" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "original_rating" SMALLINT;

-- CreateIndex
CREATE INDEX "idx_review_edits_status" ON "review_edits"("status");
CREATE INDEX "idx_review_updates_review" ON "review_updates"("review_id");

-- Unique constraint: one reaction per user per review
CREATE UNIQUE INDEX "review_reactions_review_id_user_id_key" ON "review_reactions"("review_id", "user_id");

-- AddForeignKey
ALTER TABLE "review_edits" ADD CONSTRAINT "review_edits_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "review_edits" ADD CONSTRAINT "review_edits_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "review_updates" ADD CONSTRAINT "review_updates_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
