-- CreateTable
CREATE TABLE `alerts` (
    `id` VARCHAR(191) NOT NULL,
    `country` ENUM('BR', 'EC', 'CO') NOT NULL,
    `type` ENUM('TEMPERATURE_OUT_OF_RANGE', 'HUMIDITY_OUT_OF_RANGE', 'LOT_EXPIRED') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `lotId` VARCHAR(191) NULL,
    `warehouse` VARCHAR(191) NULL,
    `triggeredAt` DATETIME(3) NOT NULL,
    `acknowledged` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `alerts_type_triggeredAt_idx`(`type`, `triggeredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
