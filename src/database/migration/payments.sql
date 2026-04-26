CREATE TABLE `payments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `breakdown_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `mechanic_id` BIGINT UNSIGNED NOT NULL,
    
    `amount` DECIMAL(10,2) NOT NULL,
    `platform_fee` DECIMAL(10,2) DEFAULT 0.00,
    `mechanic_earning` DECIMAL(10,2) NOT NULL,
    `tax` DECIMAL(10,2) DEFAULT 0.00,
    
    `payment_method` VARCHAR(50) NOT NULL,
    `payment_status` VARCHAR(50) NOT NULL,
    `transaction_id` VARCHAR(100) UNIQUE,
    `razorpay_order_id` VARCHAR(100),
    `razorpay_payment_id` VARCHAR(100),
    `refund_id` VARCHAR(100) DEFAULT NULL,
    `refund_amount` DECIMAL(10,2) DEFAULT NULL,
    
    `paid_at` TIMESTAMP NULL DEFAULT NULL,
    `settled_to_mechanic_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_breakdown` (`breakdown_id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_mechanic` (`mechanic_id`),
    KEY `idx_transaction` (`transaction_id`),
    FOREIGN KEY (`breakdown_id`) REFERENCES `breakdown_requests`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`mechanic_id`) REFERENCES `mechanics`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;