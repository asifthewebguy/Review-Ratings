-- CreateTable: products
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "business_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "name_bn" VARCHAR(200),
    "description" TEXT,
    "image_url" TEXT,
    "avg_rating" DECIMAL(3,2),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add product_id to reviews
ALTER TABLE "reviews" ADD COLUMN "product_id" UUID;

-- Drop old unique index (one review per business per user)
-- Prisma creates @@unique as an index, not a constraint — must use DROP INDEX
-- Now enforced at app level for business reviews; product reviews use the new constraint below
DROP INDEX IF EXISTS "reviews_business_id_user_id_key";

-- CreateIndex
CREATE INDEX "idx_products_business" ON "products"("business_id", "is_active");
CREATE INDEX "idx_reviews_product" ON "reviews"("product_id", "status", "created_at" DESC);

-- AddForeignKey: products -> businesses
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_fkey"
    FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: products -> users (created_by)
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: reviews -> products
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- UniqueConstraint: one review per product per user
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_user_id_key"
    UNIQUE ("product_id", "user_id");
