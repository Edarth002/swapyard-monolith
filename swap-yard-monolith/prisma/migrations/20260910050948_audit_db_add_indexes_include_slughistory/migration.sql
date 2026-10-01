-- CreateTable
CREATE TABLE `ListingSlugHistory` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `listingId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ListingSlugHistory_slug_idx`(`slug`),
    INDEX `ListingSlugHistory_listingId_idx`(`listingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Category_name_idx` ON `Category`(`name`);

-- AddForeignKey
ALTER TABLE `ListingSlugHistory` ADD CONSTRAINT `ListingSlugHistory_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `CartItem` RENAME INDEX `CartItem_listingId_fkey` TO `CartItem_listingId_idx`;

-- RenameIndex
ALTER TABLE `Image` RENAME INDEX `Image_listingId_fkey` TO `Image_listingId_idx`;

-- RenameIndex
ALTER TABLE `Order` RENAME INDEX `Order_buyerId_fkey` TO `Order_buyerId_idx`;

-- RenameIndex
ALTER TABLE `OrderItem` RENAME INDEX `OrderItem_listingId_fkey` TO `OrderItem_listingId_idx`;

-- RenameIndex
ALTER TABLE `OrderItem` RENAME INDEX `OrderItem_orderId_fkey` TO `OrderItem_orderId_idx`;

-- RenameIndex
ALTER TABLE `OrderItem` RENAME INDEX `OrderItem_sellerId_fkey` TO `OrderItem_sellerId_idx`;

-- RenameIndex
ALTER TABLE `Payment` RENAME INDEX `Payment_buyerId_fkey` TO `Payment_buyerId_idx`;

-- RenameIndex
ALTER TABLE `Report` RENAME INDEX `Report_listingId_fkey` TO `Report_listingId_idx`;

-- RenameIndex
ALTER TABLE `Report` RENAME INDEX `Report_reporterId_fkey` TO `Report_reporterId_idx`;

-- RenameIndex
ALTER TABLE `Review` RENAME INDEX `Review_sellerId_fkey` TO `Review_sellerId_idx`;

-- RenameIndex
ALTER TABLE `notification` RENAME INDEX `notification_userId_fkey` TO `notification_userId_idx`;
