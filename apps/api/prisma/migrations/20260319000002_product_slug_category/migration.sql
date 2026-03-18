-- CreateTable: product_categories
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name_en" VARCHAR(100) NOT NULL,
    "name_bn" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(10),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");

-- AlterTable: add slug, category_id, tags to products
ALTER TABLE "products"
    ADD COLUMN "slug" VARCHAR(220),
    ADD COLUMN "category_id" UUID,
    ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT '{}';

-- Backfill slugs for existing products using their id
UPDATE "products" SET "slug" = "id"::text WHERE "slug" IS NULL;

-- Make slug NOT NULL and add unique index
ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE INDEX "idx_products_slug" ON "products"("slug");

-- AddForeignKey: products -> product_categories
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "product_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed predefined product categories
INSERT INTO "product_categories" ("id", "name_en", "name_bn", "slug", "icon", "sort_order") VALUES
    (gen_random_uuid(), 'Electronics', 'ইলেকট্রনিক্স', 'electronics', '📱', 1),
    (gen_random_uuid(), 'Clothing & Fashion', 'পোশাক ও ফ্যাশন', 'clothing-fashion', '👗', 2),
    (gen_random_uuid(), 'Food & Grocery', 'খাদ্য ও মুদিখানা', 'food-grocery', '🛒', 3),
    (gen_random_uuid(), 'Home & Furniture', 'গৃহস্থালি ও আসবাব', 'home-furniture', '🛋️', 4),
    (gen_random_uuid(), 'Beauty & Personal Care', 'সৌন্দর্য ও ব্যক্তিগত যত্ন', 'beauty-personal-care', '💄', 5),
    (gen_random_uuid(), 'Books & Stationery', 'বই ও স্টেশনারি', 'books-stationery', '📚', 6),
    (gen_random_uuid(), 'Sports & Outdoors', 'খেলাধুলা ও আউটডোর', 'sports-outdoors', '⚽', 7),
    (gen_random_uuid(), 'Health & Medicine', 'স্বাস্থ্য ও ওষুধ', 'health-medicine', '💊', 8),
    (gen_random_uuid(), 'Toys & Baby', 'খেলনা ও শিশু', 'toys-baby', '🧸', 9),
    (gen_random_uuid(), 'Automotive', 'যানবাহন', 'automotive', '🚗', 10),
    (gen_random_uuid(), 'Services', 'সেবা', 'services', '🛠️', 11),
    (gen_random_uuid(), 'Other', 'অন্যান্য', 'other', '📦', 12);
