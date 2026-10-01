/*
  Warnings:

  - You are about to alter the column `currency` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(10)`.
  - You are about to alter the column `type` on the `Report` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `rating` on the `Review` table. The data in that column could be lost. The data in that column will be cast from `Int` to `TinyInt`.
  - You are about to alter the column `accountNumber` on the `SellerAccount` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.
  - You are about to alter the column `bankName` on the `SellerAccount` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `bankCode` on the `SellerAccount` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(10)`.
  - You are about to alter the column `accountType` on the `SellerAccount` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `vatNumber` on the `SellerVerification` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `nin` on the `SellerVerification` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.
  - You are about to alter the column `status` on the `idempotencyKey` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(30)`.
  - You are about to drop the `notification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `notification_userId_fkey`;

-- AlterTable
ALTER TABLE `Category` MODIFY `image` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `Image` MODIFY `url` VARCHAR(500) NOT NULL;

-- AlterTable
ALTER TABLE `Listing` MODIFY `price` DECIMAL(12, 2) NOT NULL;

-- AlterTable
ALTER TABLE `Order` MODIFY `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `deliveryFee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `platformCommission` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `pickupNote` TEXT NULL;

-- AlterTable
ALTER TABLE `OrderItem` MODIFY `unitPrice` DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE `Payment` MODIFY `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `currency` VARCHAR(10) NOT NULL DEFAULT 'NGN';

-- AlterTable
ALTER TABLE `Payout` MODIFY `grossAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `commissionAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    MODIFY `netAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE `Report` MODIFY `type` VARCHAR(50) NOT NULL,
    MODIFY `reason` TEXT NOT NULL,
    MODIFY `comment` TEXT NULL,
    MODIFY `imageUrl1` VARCHAR(500) NULL,
    MODIFY `imageUrl2` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `Review` MODIFY `rating` TINYINT NOT NULL,
    MODIFY `comment` TEXT NULL;

-- AlterTable
ALTER TABLE `SellerAccount` MODIFY `accountNumber` VARCHAR(20) NOT NULL DEFAULT '',
    MODIFY `bankName` VARCHAR(100) NOT NULL DEFAULT '',
    MODIFY `bankCode` VARCHAR(10) NULL,
    MODIFY `accountType` VARCHAR(50) NOT NULL,
    MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `SellerVerification` MODIFY `vatNumber` VARCHAR(50) NULL,
    MODIFY `nin` VARCHAR(20) NULL,
    MODIFY `businessLicenseUrl` VARCHAR(500) NULL,
    MODIFY `idDocumentUrl` VARCHAR(500) NULL,
    MODIFY `reviewNote` TEXT NULL;

-- AlterTable
ALTER TABLE `idempotencyKey` MODIFY `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE `notification`;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Notification_userId_read_idx`(`userId`, `read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Listing_categoryId_status_createdAt_idx` ON `Listing`(`categoryId`, `status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Listing_status_createdAt_idx` ON `Listing`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Order_buyerId_status_idx` ON `Order`(`buyerId`, `status`);

-- CreateIndex
CREATE INDEX `Order_status_createdAt_idx` ON `Order`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `Payment_buyerId_status_idx` ON `Payment`(`buyerId`, `status`);

-- CreateIndex
CREATE INDEX `Payout_sellerId_status_idx` ON `Payout`(`sellerId`, `status`);

-- CreateIndex
CREATE INDEX `Report_status_idx` ON `Report`(`status`);

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Listing` RENAME INDEX `Listing_sellerId_fkey` TO `Listing_sellerId_idx`;
