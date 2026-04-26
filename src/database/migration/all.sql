-- =============================================
-- SEPARATE TABLES DESIGN (Recommended)
-- Users, Mechanics, Admins with role-based access
-- =============================================

-- =============================================
-- 1. ROLES TABLE (Reference)
-- =============================================
CREATE TABLE `roles` (
    `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(20) NOT NULL UNIQUE,
    `slug` VARCHAR(20) NOT NULL UNIQUE,
    `level` TINYINT NOT NULL, -- 1=User, 2=Mechanic, 3=Admin
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `roles` (`name`, `slug`, `level`) VALUES
('User', 'user', 1),
('Mechanic', 'mechanic', 2),
('Admin', 'admin', 3);

-- =============================================
-- 2. USERS TABLE (Customers only)
-- =============================================
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL DEFAULT (UUID()),
    `role_id` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    
    -- Basic Info
    `phone_number` VARCHAR(15) NOT NULL,
    `email` VARCHAR(100) DEFAULT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `profile_picture` TEXT DEFAULT NULL,
    
    -- Authentication
    `otp_code` VARCHAR(6) DEFAULT NULL,
    `otp_expires_at` TIMESTAMP NULL DEFAULT NULL,
    `is_phone_verified` BOOLEAN DEFAULT FALSE,
    `pin_hash` VARCHAR(255) DEFAULT NULL, -- Optional 4-6 digit PIN
    
    -- Push Notifications
    `fcm_token` TEXT DEFAULT NULL,
    
    -- Emergency Contact
    `emergency_contact_name` VARCHAR(100) DEFAULT NULL,
    `emergency_contact_phone` VARCHAR(15) DEFAULT NULL,
    `emergency_contact_relation` VARCHAR(50) DEFAULT NULL,
    
    -- Saved Locations
    `home_address` TEXT DEFAULT NULL,
    `home_latitude` DECIMAL(10,8) DEFAULT NULL,
    `home_longitude` DECIMAL(11,8) DEFAULT NULL,
    `work_address` TEXT DEFAULT NULL,
    `work_latitude` DECIMAL(10,8) DEFAULT NULL,
    `work_longitude` DECIMAL(11,8) DEFAULT NULL,
    
    -- Current Location (for breakdown requests)
    `current_latitude` DECIMAL(10,8) DEFAULT NULL,
    `current_longitude` DECIMAL(11,8) DEFAULT NULL,
    `location_updated_at` TIMESTAMP NULL DEFAULT NULL,
    
    -- Account Status
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_blocked` BOOLEAN DEFAULT FALSE,
    `blocked_reason` TEXT DEFAULT NULL,
    
    -- Preferences
    `language` VARCHAR(10) DEFAULT 'en',
    `notifications_enabled` BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    `last_login_at` TIMESTAMP NULL DEFAULT NULL,
    `last_seen_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_phone` (`phone_number`),
    UNIQUE KEY `idx_uuid` (`uuid`),
    UNIQUE KEY `idx_email` (`email`),
    KEY `idx_role` (`role_id`),
    KEY `idx_location` (`current_latitude`, `current_longitude`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 3. MECHANICS TABLE (Service providers)
-- =============================================
CREATE TABLE `mechanics` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL DEFAULT (UUID()),
    `role_id` TINYINT UNSIGNED NOT NULL DEFAULT 2,
    
    -- Basic Info
    `phone_number` VARCHAR(15) NOT NULL,
    `email` VARCHAR(100) DEFAULT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `profile_picture` TEXT DEFAULT NULL,
    
    -- Authentication
    `otp_code` VARCHAR(6) DEFAULT NULL,
    `otp_expires_at` TIMESTAMP NULL DEFAULT NULL,
    `is_phone_verified` BOOLEAN DEFAULT FALSE,
    `password_hash` VARCHAR(255) DEFAULT NULL, -- For web dashboard login
    
    -- Professional Details
    `mechanic_license_number` VARCHAR(50) UNIQUE NOT NULL,
    `experience_years` INT DEFAULT 0,
    `specialization` VARCHAR(100) DEFAULT NULL, -- Engine, Electrical, Body, etc.
    `service_types` JSON DEFAULT NULL, -- ["towing", "flat_tire", "battery", "fuel"]
    
    -- Vehicle Info (Tow truck / Service van)
    `vehicle_number` VARCHAR(20) NOT NULL,
    `vehicle_model` VARCHAR(100) NOT NULL,
    `vehicle_type` ENUM('flatbed', 'crane', 'van', 'motorcycle') DEFAULT 'van',
    `vehicle_color` VARCHAR(30) DEFAULT NULL,
    
    -- Location & Availability
    `current_latitude` DECIMAL(10,8) DEFAULT NULL,
    `current_longitude` DECIMAL(11,8) DEFAULT NULL,
    `location_updated_at` TIMESTAMP NULL DEFAULT NULL,
    `is_available` BOOLEAN DEFAULT FALSE, -- On/Off duty
    `service_radius_km` INT DEFAULT 10, -- Max distance to accept jobs
    `base_location_latitude` DECIMAL(10,8) DEFAULT NULL, -- Home garage location
    `base_location_longitude` DECIMAL(11,8) DEFAULT NULL,
    
    -- KYC & Verification
    `is_kyc_verified` BOOLEAN DEFAULT FALSE,
    `kyc_verified_at` TIMESTAMP NULL DEFAULT NULL,
    `kyc_verified_by` BIGINT UNSIGNED DEFAULT NULL, -- Admin ID
    `aadhar_number` VARCHAR(20) DEFAULT NULL, -- Encrypted in production
    `pan_number` VARCHAR(10) DEFAULT NULL,
    `bank_account_number` VARCHAR(50) DEFAULT NULL,
    `ifsc_code` VARCHAR(15) DEFAULT NULL,
    `account_holder_name` VARCHAR(100) DEFAULT NULL,
    
    -- Document URLs
    `license_document_url` TEXT DEFAULT NULL,
    `aadhar_document_url` TEXT DEFAULT NULL,
    `vehicle_rc_url` TEXT DEFAULT NULL,
    `insurance_document_url` TEXT DEFAULT NULL,
    
    -- Performance Metrics
    `total_jobs_completed` INT DEFAULT 0,
    `total_jobs_cancelled` INT DEFAULT 0,
    `average_rating` DECIMAL(3,2) DEFAULT NULL, -- 1-5
    `total_ratings` INT DEFAULT 0,
    `average_response_time_minutes` INT DEFAULT NULL, -- Avg time to accept job
    `average_arrival_time_minutes` INT DEFAULT NULL, -- Avg time to reach customer
    `cancellation_rate` DECIMAL(5,2) DEFAULT NULL,
    
    -- Earnings
    `total_earnings` DECIMAL(12,2) DEFAULT 0.00,
    `pending_earnings` DECIMAL(12,2) DEFAULT 0.00,
    `last_payout_date` DATE DEFAULT NULL,
    
    -- Account Status
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_blocked` BOOLEAN DEFAULT FALSE,
    `blocked_reason` TEXT DEFAULT NULL,
    `is_online` BOOLEAN DEFAULT FALSE, -- Real-time online status
    
    -- Push Notifications
    `fcm_token` TEXT DEFAULT NULL,
    
    -- Preferences
    `auto_accept_enabled` BOOLEAN DEFAULT FALSE, -- Auto accept nearby jobs
    `language` VARCHAR(10) DEFAULT 'en',
    
    -- Timestamps
    `last_login_at` TIMESTAMP NULL DEFAULT NULL,
    `last_job_completed_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `created_by` BIGINT UNSIGNED DEFAULT NULL, -- Admin who added this mechanic
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_phone` (`phone_number`),
    UNIQUE KEY `idx_uuid` (`uuid`),
    UNIQUE KEY `idx_email` (`email`),
    UNIQUE KEY `idx_license` (`mechanic_license_number`),
    UNIQUE KEY `idx_vehicle_number` (`vehicle_number`),
    KEY `idx_role` (`role_id`),
    KEY `idx_availability` (`is_available`, `is_online`, `is_kyc_verified`),
    KEY `idx_location` (`current_latitude`, `current_longitude`),
    KEY `idx_rating` (`average_rating`),
    KEY `idx_completed_jobs` (`total_jobs_completed`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 4. ADMINS TABLE (System administrators)
-- =============================================
CREATE TABLE `admins` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL DEFAULT (UUID()),
    `role_id` TINYINT UNSIGNED NOT NULL DEFAULT 3,
    
    -- Basic Info
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone_number` VARCHAR(15) DEFAULT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `profile_picture` TEXT DEFAULT NULL,
    
    -- Authentication
    `password_hash` VARCHAR(255) NOT NULL, -- Strong password for web login
    `two_factor_secret` VARCHAR(255) DEFAULT NULL, -- For 2FA
    `is_2fa_enabled` BOOLEAN DEFAULT FALSE,
    
    -- Admin Level
    `admin_level` ENUM('super', 'manager', 'support', 'finance') DEFAULT 'support',
    
    -- Permissions (if fine-grained control needed)
    `permissions` JSON DEFAULT NULL, -- Custom permissions override
    
    -- Account Status
    `is_active` BOOLEAN DEFAULT TRUE,
    `is_blocked` BOOLEAN DEFAULT FALSE,
    `blocked_reason` TEXT DEFAULT NULL,
    `last_login_ip` VARCHAR(45) DEFAULT NULL,
    `last_login_at` TIMESTAMP NULL DEFAULT NULL,
    
    -- Audit
    `created_by` BIGINT UNSIGNED DEFAULT NULL, -- Super admin who created
    `last_password_change` TIMESTAMP NULL DEFAULT NULL,
    
    -- Timestamps
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_uuid` (`uuid`),
    UNIQUE KEY `idx_username` (`username`),
    KEY `idx_role` (`role_id`),
    KEY `idx_admin_level` (`admin_level`),
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 5. USER VEHICLES (Customer's cars)
-- =============================================
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

-- =============================================
-- 6. BREAKDOWN REQUESTS (Links users and mechanics)
-- =============================================
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

-- =============================================
-- 7. MECHANIC LOCATION HISTORY (For tracking)
-- =============================================
CREATE TABLE `mechanic_location_history` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `mechanic_id` BIGINT UNSIGNED NOT NULL,
    `latitude` DECIMAL(10,8) NOT NULL,
    `longitude` DECIMAL(11,8) NOT NULL,
    `speed_kmh` DECIMAL(5,2) DEFAULT NULL,
    `accuracy_meters` INT DEFAULT NULL,
    `recorded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_mechanic_time` (`mechanic_id`, `recorded_at`),
    FOREIGN KEY (`mechanic_id`) REFERENCES `mechanics`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 8. MECHANIC JOB ASSIGNMENT QUEUE
-- =============================================
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

-- =============================================
-- 9. PAYMENTS TABLE
-- =============================================
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

-- =============================================
-- 10. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `recipient_type` ENUM('user', 'mechanic', 'admin') NOT NULL,
    `recipient_id` BIGINT UNSIGNED NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `data` JSON DEFAULT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `read_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_recipient` (`recipient_type`, `recipient_id`, `is_read`),
    KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 11. AUDIT LOGS (For security & debugging)
-- =============================================
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `admin_id` BIGINT UNSIGNED DEFAULT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL, -- user, mechanic, breakdown, payment
    `entity_id` BIGINT UNSIGNED DEFAULT NULL,
    `old_values` JSON DEFAULT NULL,
    `new_values` JSON DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`id`),
    KEY `idx_admin` (`admin_id`),
    KEY `idx_entity` (`entity_type`, `entity_id`),
    KEY `idx_action_time` (`action`, `created_at`),
    FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- 12. HELPFUL VIEWS
-- =============================================

-- Active mechanics with distance calculation
CREATE VIEW `v_nearby_mechanics` AS
SELECT 
    m.id,
    m.full_name,
    m.phone_number,
    m.current_latitude,
    m.current_longitude,
    m.average_rating,
    m.total_jobs_completed,
    m.is_available,
    m.service_radius_km,
    m.vehicle_type,
    -- Distance calculation would be done in query
    m.current_latitude as lat,
    m.current_longitude as lng
FROM mechanics m
WHERE m.is_active = TRUE 
    AND m.is_available = TRUE 
    AND m.is_kyc_verified = TRUE
    AND m.is_online = TRUE;

-- Breakdown details with customer & mechanic info
CREATE VIEW `v_breakdown_details` AS
SELECT 
    br.*,
    u.full_name AS customer_name,
    u.phone_number AS customer_phone,
    u.email AS customer_email,
    uv.vehicle_number,
    uv.vehicle_make,
    uv.vehicle_model,
    m.full_name AS mechanic_name,
    m.phone_number AS mechanic_phone,
    m.average_rating AS mechanic_rating,
    m.vehicle_number AS mechanic_vehicle_number
FROM breakdown_requests br
LEFT JOIN users u ON br.user_id = u.id
LEFT JOIN user_vehicles uv ON br.vehicle_id = uv.id
LEFT JOIN mechanics m ON br.mechanic_id = m.id;

-- Mechanic performance dashboard
CREATE VIEW `v_mechanic_performance` AS
SELECT 
    m.id,
    m.full_name,
    m.total_jobs_completed,
    m.total_jobs_cancelled,
    m.average_rating,
    m.total_ratings,
    m.total_earnings,
    m.average_response_time_minutes,
    m.average_arrival_time_minutes,
    m.cancellation_rate,
    COUNT(br.id) as current_month_jobs,
    SUM(CASE WHEN br.status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
    AVG(TIMESTAMPDIFF(MINUTE, br.assigned_at, br.accepted_at)) as avg_acceptance_time
FROM mechanics m
LEFT JOIN breakdown_requests br ON m.id = br.mechanic_id 
    AND MONTH(br.requested_at) = MONTH(CURRENT_DATE())
    AND YEAR(br.requested_at) = YEAR(CURRENT_DATE())
GROUP BY m.id;

-- =============================================
-- 13. INDEXES FOR PERFORMANCE
-- =============================================

-- For real-time mechanic search
CREATE INDEX idx_mechanics_geo ON mechanics(current_latitude, current_longitude, is_available, is_online);

-- For breakdown status queries
CREATE INDEX idx_breakdowns_user_status ON breakdown_requests(user_id, status, requested_at DESC);
CREATE INDEX idx_breakdowns_mechanic_status ON breakdown_requests(mechanic_id, status, requested_at DESC);

-- For admin reports
CREATE INDEX idx_breakdowns_date ON breakdown_requests(requested_at, status);
CREATE INDEX idx_payments_date ON payments(created_at, payment_status);

-- =============================================
-- 14. SAMPLE DATA INSERTION
-- =============================================

-- Sample User (Customer)
INSERT INTO `users` (
    `phone_number`, `full_name`, `email`, 
    `emergency_contact_name`, `emergency_contact_phone`,
    `home_address`, `home_latitude`, `home_longitude`
) VALUES (
    '+919876543210', 'Rajesh Kumar', 'rajesh@example.com',
    'Priya Kumar', '+919876543211',
    '123 Main Street, Andheri East, Mumbai', 19.1136, 72.8697
);

-- Sample Mechanic
INSERT INTO `mechanics` (
    `phone_number`, `full_name`, `email`,
    `mechanic_license_number`, `experience_years`,
    `vehicle_number`, `vehicle_model`, `vehicle_type`,
    `current_latitude`, `current_longitude`, `is_available`,
    `is_kyc_verified`, `average_rating`, `service_radius_km`
) VALUES (
    '+919876543212', 'Suresh Patel', 'suresh@example.com',
    'MH-2024-00123', 5,
    'MH-01-AB-1234', 'Mahindra Bolero', 'flatbed',
    19.1150, 72.8700, TRUE,
    TRUE, 4.8, 15
);

-- Sample Admin
INSERT INTO `admins` (
    `username`, `email`, `full_name`, `password_hash`, `admin_level`
) VALUES (
    'admin', 'admin@vichal.com', 'Admin User', 
    '$2y$10$YourHashedPasswordHere', 'super'
);

-- Sample User Vehicle
INSERT INTO `user_vehicles` (
    `user_id`, `vehicle_number`, `vehicle_make`, `vehicle_model`, `vehicle_year`, `is_default`
) VALUES (
    1, 'MH-01-XY-5678', 'Hyundai', 'i20', 2022, TRUE
);

-- Sample Breakdown Request
INSERT INTO `breakdown_requests` (
    `request_number`, `user_id`, `vehicle_id`, `issue_type`, 
    `issue_description`, `pickup_latitude`, `pickup_longitude`, 
    `pickup_address`, `priority`
) VALUES (
    'BRK-20241201-001', 1, 1, 'Flat Tire',
    'Puncture on rear left tire, need replacement or repair',
    19.1136, 72.8697, '123 Main Street, Andheri East, Mumbai',
    'normal'
);

-- =============================================
-- 15. STORED PROCEDURES
-- =============================================

DELIMITER //

-- Find nearest available mechanics
-- CREATE PROCEDURE `FindNearestMechanics`(
--     IN p_latitude DECIMAL(10,8),
--     IN p_longitude DECIMAL(11,8),
--     IN p_limit INT
-- )
-- BEGIN
--     SELECT 
--         m.id,
--         m.full_name,
--         m.phone_number,
--         m.average_rating,
--         m.total_jobs_completed,
--         m.current_latitude,
--         m.current_longitude,
--         m.vehicle_type,
--         (
--             6371 * ACOS(
--                 COS(RADIANS(p_latitude)) * 
--                 COS(RADIANS(m.current_latitude)) * 
--                 COS(RADIANS(m.current_longitude) - RADIANS(p_longitude)) + 
--                 SIN(RADIANS(p_latitude)) * 
--                 SIN(RADIANS(m.current_latitude))
--             )
--         ) AS distance_km,
--         (SELECT COUNT(*) FROM breakdown_requests 
--          WHERE mechanic_id = m.id AND status IN ('assigned', 'accepted', 'en_route', 'in_progress')) as active_jobs
--     FROM mechanics m
--     WHERE m.is_active = TRUE 
--         AND m.is_available = TRUE
--         AND m.is_online = TRUE
--         AND m.is_kyc_verified = TRUE
--     HAVING distance_km <= m.service_radius_km
--     ORDER BY active_jobs ASC, distance_km ASC, m.average_rating DESC
--     LIMIT p_limit;
-- END //

-- Assign mechanic to breakdown
-- CREATE PROCEDURE `AssignMechanic`(
--     IN p_breakdown_id BIGINT UNSIGNED,
--     IN p_mechanic_id BIGINT UNSIGNED,
--     IN p_assigned_by VARCHAR(20) -- 'system', 'admin', 'dispatcher'
-- )
-- BEGIN
--     DECLARE EXIT HANDLER FOR SQLEXCEPTION
--     BEGIN
--         ROLLBACK;
--         RESIGNAL;
--     END;
    
--     START TRANSACTION;
    
--     -- Check if mechanic is available
--     IF NOT EXISTS (
--         SELECT 1 FROM mechanics 
--         WHERE id = p_mechanic_id AND is_available = TRUE AND is_online = TRUE
--     ) THEN
--         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mechanic not available';
--     END IF;
    
--     -- Update breakdown request
--     UPDATE breakdown_requests 
--     SET mechanic_id = p_mechanic_id,
--         status = 'assigned',
--         assigned_at = NOW(),
--         assigned_by = p_assigned_by
--     WHERE id = p_breakdown_id;
    
--     -- Mark mechanic as busy
--     UPDATE mechanics 
--     SET is_available = FALSE,
--         is_online = FALSE
--     WHERE id = p_mechanic_id;
    
--     -- Create notification for mechanic
--     INSERT INTO notifications (recipient_type, recipient_id, type, title, message, data)
--     VALUES ('mechanic', p_mechanic_id, 'new_job', 'New Breakdown Assignment',
--             'You have been assigned a new breakdown request. Please check and accept.',
--             JSON_OBJECT('breakdown_id', p_breakdown_id));
    
--     -- Log assignment
--     INSERT INTO audit_logs (action, entity_type, entity_id, new_values)
--     VALUES ('ASSIGN_MECHANIC', 'breakdown', p_breakdown_id,
--             JSON_OBJECT('mechanic_id', p_mechanic_id, 'assigned_by', p_assigned_by));
    
--     COMMIT;
-- END //

-- Get dashboard stats
-- CREATE PROCEDURE `GetDashboardStats`()
-- BEGIN
--     -- Today's stats
--     SELECT 
--         (SELECT COUNT(*) FROM breakdown_requests WHERE DATE(requested_at) = CURDATE()) AS today_requests,
--         (SELECT COUNT(*) FROM breakdown_requests WHERE DATE(requested_at) = CURDATE() AND status = 'completed') AS today_completed,
--         (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) AS new_users_today,
--         (SELECT COUNT(*) FROM mechanics WHERE DATE(created_at) = CURDATE()) AS new_mechanics_today,
--         (SELECT IFNULL(SUM(total_amount), 0) FROM breakdown_requests WHERE DATE(completed_at) = CURDATE()) AS today_revenue;
    
--     -- Active mechanics
--     SELECT COUNT(*) as active_mechanics, COUNT(CASE WHEN is_available THEN 1 END) as available_mechanics
--     FROM mechanics WHERE is_active = TRUE AND is_kyc_verified = TRUE;
    
--     -- Pending requests
--     SELECT COUNT(*) as pending_requests, 
--            AVG(TIMESTAMPDIFF(MINUTE, requested_at, NOW())) as avg_waiting_time
--     FROM breakdown_requests 
--     WHERE status IN ('pending', 'searching', 'assigned');
-- END //

-- DELIMITER ;