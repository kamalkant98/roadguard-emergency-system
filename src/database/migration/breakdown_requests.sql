CREATE TABLE `breakdown_requests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `request_number` VARCHAR(20) NOT NULL UNIQUE,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `mechanic_id` BIGINT UNSIGNED DEFAULT NULL,
    `vehicle_id` BIGINT UNSIGNED DEFAULT NULL,
    
    -- Issue Details
    `issue_type` VARCHAR(50) NOT NULL,
    `issue_description` TEXT,
    `issue_images` JSON DEFAULT NULL, -- Array of image URLs
    
    -- Status Flow
    `status` ENUM(
        'pending',           -- Waiting for assignment
        'searching',         -- Looking for mechanics
        'assigned',          -- Mechanic assigned
        'accepted',          -- Mechanic accepted
        'en_route',          -- Mechanic on the way
        'arrived',           -- Mechanic reached location
        'in_progress',       -- Service in progress
        'completed',         -- Job completed
        'cancelled_by_user', -- Cancelled by customer
        'cancelled_by_mechanic', -- Cancelled by mechanic
        'cancelled_by_system' -- Auto-cancelled
    ) DEFAULT 'pending',
    
    -- Location Info
    `pickup_latitude` DECIMAL(10,8) NOT NULL,
    `pickup_longitude` DECIMAL(11,8) NOT NULL,
    `pickup_address` TEXT,
    `destination_latitude` DECIMAL(10,8) DEFAULT NULL, -- For tow to garage
    `destination_longitude` DECIMAL(11,8) DEFAULT NULL,
    `destination_address` TEXT DEFAULT NULL,
    
    -- Distance & Time
    `distance_km` DECIMAL(10,2) DEFAULT NULL,
    `estimated_travel_time_minutes` INT DEFAULT NULL,
    `actual_travel_time_minutes` INT DEFAULT NULL,
    `service_duration_minutes` INT DEFAULT NULL,
    
    -- Pricing
    `base_fee` DECIMAL(10,2) DEFAULT 0.00,
    `distance_fee` DECIMAL(10,2) DEFAULT 0.00,
    `service_fee` DECIMAL(10,2) DEFAULT 0.00,
    `tax_amount` DECIMAL(10,2) DEFAULT 0.00,
    `discount_amount` DECIMAL(10,2) DEFAULT 0.00,
    `total_amount` DECIMAL(10,2) DEFAULT 0.00,
    
    -- Payment
    `payment_method` ENUM('cash', 'card', 'wallet', 'upi') DEFAULT 'cash',
    `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    `payment_id` VARCHAR(100) DEFAULT NULL,
    `razorpay_order_id` VARCHAR(100) DEFAULT NULL,
    `razorpay_payment_id` VARCHAR(100) DEFAULT NULL,
    
    -- Feedback
    `customer_rating` TINYINT DEFAULT NULL CHECK (customer_rating BETWEEN 1 AND 5),
    `customer_review` TEXT DEFAULT NULL,
    `mechanic_notes` TEXT DEFAULT NULL,
    `customer_complaint` TEXT DEFAULT NULL,
    
    -- Timestamps (Journey)
    `requested_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `assigned_at` TIMESTAMP NULL DEFAULT NULL,
    `accepted_at` TIMESTAMP NULL DEFAULT NULL,
    `en_route_at` TIMESTAMP NULL DEFAULT NULL,
    `arrived_at` TIMESTAMP NULL DEFAULT NULL,
    `started_at` TIMESTAMP NULL DEFAULT NULL,
    `completed_at` TIMESTAMP NULL DEFAULT NULL,
    `cancelled_at` TIMESTAMP NULL DEFAULT NULL,
    `cancelled_reason` TEXT DEFAULT NULL,
    
    -- System Fields
    `assigned_by` ENUM('system', 'admin', 'dispatcher') DEFAULT 'system',
    `priority` ENUM('low', 'normal', 'high', 'emergency') DEFAULT 'normal',
    `is_emergency` BOOLEAN DEFAULT FALSE,
    
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_mechanic` (`mechanic_id`),
    KEY `idx_status` (`status`),
    KEY `idx_request_number` (`request_number`),
    KEY `idx_pickup_location` (`pickup_latitude`, `pickup_longitude`),
    KEY `idx_priority_status` (`priority`, `status`),
    KEY `idx_requested_at` (`requested_at`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`mechanic_id`) REFERENCES `mechanics`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`vehicle_id`) REFERENCES `user_vehicles`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;