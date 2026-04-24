/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Listing` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Category` ADD COLUMN `slug` VARCHAR(191) NOT NULL DEFAULT 'furniture';

-- AlterTable
ALTER TABLE `Listing` ADD COLUMN `slug` VARCHAR(191) NOT NULL DEFAULT 'chrome-legged-teak-wooden-table';

-- CreateIndex
CREATE UNIQUE INDEX `Category_slug_key` ON `Category`(`slug`);

-- CreateIndex
CREATE UNIQUE INDEX `Listing_slug_key` ON `Listing`(`slug`);
