CREATE TABLE `user_vehicles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `vehicle_number` VARCHAR(20) NOT NULL,
    `vehicle_make` VARCHAR(50) NOT NULL,
    `vehicle_model` VARCHAR(100) NOT NULL,
    `vehicle_year` YEAR DEFAULT NULL,
    `vehicle_type` ENUM('car', 'bike', 'truck', 'auto', 'bus') DEFAULT 'car',
    `fuel_type` ENUM('petrol', 'diesel', 'electric', 'cng', 'lpg') DEFAULT NULL,
    `color` VARCHAR(30) DEFAULT NULL,
    `is_default` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;