CREATE TABLE `mechanic_assignment_queue` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `breakdown_id` BIGINT UNSIGNED NOT NULL,
    `mechanic_id` BIGINT UNSIGNED NOT NULL,
    `distance_km` DECIMAL(10,2) NOT NULL,
    `estimated_time_minutes` INT NOT NULL,
    `priority_score` INT NOT NULL, -- Calculated score for assignment
    `status` ENUM('pending', 'notified', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
    `notified_at` TIMESTAMP NULL DEFAULT NULL,
    `responded_at` TIMESTAMP NULL DEFAULT NULL,
    `expires_at` TIMESTAMP NOT NULL,
    
    PRIMARY KEY (`id`),
    KEY `idx_breakdown` (`breakdown_id`),
    KEY `idx_mechanic_status` (`mechanic_id`, `status`),
    FOREIGN KEY (`breakdown_id`) REFERENCES `breakdown_requests`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`mechanic_id`) REFERENCES `mechanics`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;