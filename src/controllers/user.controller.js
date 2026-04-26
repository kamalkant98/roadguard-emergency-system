import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import mysqlPool from "../database/index.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// Generate OTP (6 digits)
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT token
const generateAuthToken = (userId, role, connection) => {
    return jwt.sign(
        { 
            id: userId, 
            role: role,
            type: 'user'
        },
        process.env.JWT_SECRET || 'your-secret-key-change-this',
        { expiresIn: '30d' }
    );
};


// REGISTER USER (With Transaction)
const registerUser = asyncHandler(async (req, res) => {
    const {
        phone_number,
        email,
        full_name,
        password,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        home_address,
        home_latitude,
        home_longitude,
        work_address,
        work_latitude,
        work_longitude,
        language = 'en',
        notifications_enabled = true
    } = req.body;

    // Validation
    if (!phone_number) {
        throw new ApiError(400, "Phone number is required");
    }

    if (!full_name) {
        throw new ApiError(400, "Full name is required");
    }

    // Validate phone number format (India example)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone_number.replace(/^\+91/, ''))) {
        throw new ApiError(400, "Invalid phone number format");
    }

    // Validate email if provided
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ApiError(400, "Invalid email format");
        }
    }

    const connection = await mysqlPool.getConnection();

    try {
        // Start transaction
        await connection.beginTransaction();

        // Check if user already exists
        const [existingUsers] = await connection.query(
            `SELECT phone_number, email FROM users 
             WHERE phone_number = ? OR (email IS NOT NULL AND email = ?)`,
            [phone_number, email || null]
        );

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            if (existingUser.phone_number === phone_number) {
                return res.status(409).json(new ApiResponse(409, {}, "User with this phone number already exists."))
            }
            if (email && existingUser.email === email) {
                return res.status(409).json(new ApiResponse(409, {}, "User with this email already exists"))

            }
        }

        // Generate OTP and hash PIN
        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const pinHash = password ? await bcrypt.hash(password, 10) : null;
        const uuid = crypto.randomUUID();

        // Insert user
        const [result] = await connection.query(
            `INSERT INTO users (
                uuid, role_id, phone_number, email, full_name,
                pin_hash, otp_code, otp_expires_at, is_phone_verified,
                emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
                home_address, home_latitude, home_longitude,
                work_address, work_latitude, work_longitude,
                language, notifications_enabled,
                created_at, updated_at
            ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                uuid, phone_number, email || null, full_name,
                pinHash, otpCode, otpExpiresAt, false,
                emergency_contact_name || null,
                emergency_contact_phone || null,
                emergency_contact_relation || null,
                home_address || null,
                home_latitude || null,
                home_longitude || null,
                work_address || null,
                work_latitude || null,
                work_longitude || null,
                language,
                notifications_enabled ? 1 : 0
            ]
        );

        if (!result.affectedRows || result.affectedRows === 0) {
            throw new ApiError(500, "Failed to register user");
        }

        // Create welcome notification
        await connection.query(
            `INSERT INTO notifications (recipient_type, recipient_id, type, title, message, data, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                'user', result.insertId, 'welcome',
                'Welcome to Vichal!',
                'Thank you for registering. Please verify your phone number to get started.',
                JSON.stringify({ user_id: result.insertId })
            ]
        );

        // Commit transaction
        await connection.commit();

        // Get the created user data
        const [newUser] = await connection.query(
            `SELECT id, uuid, phone_number, email, full_name, 
                    is_phone_verified, language, notifications_enabled,
                    created_at
             FROM users 
             WHERE id = ?`,
            [result.insertId]
        );

        // In production, send OTP via SMS service
        console.log(`OTP for ${phone_number}: ${otpCode}`);

        return res.status(201).json(
            new ApiResponse(201, {
                user: newUser[0],
                otp_sent: true,
                otp_expires_in: 600
            }, "User registered successfully. Please verify your phone number.")
        );

    } catch (error) {
        await connection.rollback();
        console.error("Registration error:", error);
        throw error;
    } finally {
        connection.release();
    }
});

// VERIFY OTP (With Transaction)
const verifyOTP = asyncHandler(async (req, res) => {
    const { phone_number, otp_code, fcm_token } = req.body;

    if (!phone_number || !otp_code) {
        throw new ApiError(400, "Phone number and OTP are required");
    }

    const connection = await mysqlPool.getConnection();

    try {
        await connection.beginTransaction();

        // Find user with valid OTP
        const [users] = await connection.query(
            `SELECT id, phone_number, otp_code, otp_expires_at, is_phone_verified
             FROM users 
             WHERE phone_number = ? AND is_phone_verified = FALSE`,
            [phone_number]
        );

        if (users.length === 0) {
            throw new ApiError(404, "User not found or already verified");
        }

        const user = users[0];

        // Check if OTP matches
        if (user.otp_code !== otp_code) {
            throw new ApiError(400, "Invalid OTP");
        }

        // Check if OTP expired
        if (new Date() > new Date(user.otp_expires_at)) {
            throw new ApiError(400, "OTP has expired. Please request a new one");
        }

        // Mark phone as verified and update FCM token if provided
        let updateQuery = `UPDATE users 
                           SET is_phone_verified = TRUE, 
                               otp_code = NULL, 
                               otp_expires_at = NULL,
                               updated_at = NOW()`;
        
        const updateParams = [user.id];
        
        if (fcm_token) {
            updateQuery += `, fcm_token = ?`;
            updateParams.unshift(fcm_token);
        }
        
        updateQuery += ` WHERE id = ?`;
        
        const [result] = await connection.query(updateQuery, updateParams);

        if (result.affectedRows === 0) {
            throw new ApiError(500, "Failed to verify OTP");
        }

        // Update last login
        await connection.query(
            `UPDATE users SET last_login_at = NOW(), last_seen_at = NOW() WHERE id = ?`,
            [user.id]
        );

        // Create notification for successful verification
        await connection.query(
            `INSERT INTO notifications (recipient_type, recipient_id, type, title, message, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                'user', user.id, 'verification_success',
                'Phone Verified',
                'Your phone number has been verified successfully. You can now book roadside assistance.'
            ]
        );

        await connection.commit();

        // Generate authentication token
        const token = generateAuthToken(user.id, 'user');

        return res.status(200).json(
            new ApiResponse(200, {
                user_id: user.id,
                phone_number: user.phone_number,
                token: token,
                is_verified: true
            }, "Phone number verified successfully")
        );

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

// RESEND OTP (With Transaction)
const resendOTP = asyncHandler(async (req, res) => {
    const { phone_number } = req.body;

    if (!phone_number) {
        throw new ApiError(400, "Phone number is required");
    }

    const connection = await mysqlPool.getConnection();

    try {
        await connection.beginTransaction();

        // Find user
        const [users] = await connection.query(
            `SELECT id, phone_number, is_phone_verified
             FROM users 
             WHERE phone_number = ?`,
            [phone_number]
        );

        if (users.length === 0) {
            throw new ApiError(404, "User not found");
        }

        const user = users[0];

        if (user.is_phone_verified) {
            throw new ApiError(400, "Phone number already verified");
        }

        // Generate new OTP
        const newOTP = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Update OTP in database
        const [result] = await connection.query(
            `UPDATE users 
             SET otp_code = ?, 
                 otp_expires_at = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [newOTP, otpExpiresAt, user.id]
        );

        if (result.affectedRows === 0) {
            throw new ApiError(500, "Failed to resend OTP");
        }

        // Log OTP resend attempt
        await connection.query(
            `INSERT INTO audit_logs (action, entity_type, entity_id, new_values, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                'RESEND_OTP', 'user', user.id,
                JSON.stringify({ phone_number, otp_sent: true }),
                req.ip || null,
                req.headers['user-agent'] || null
            ]
        );

        await connection.commit();

        // Send new OTP via SMS
        console.log(`New OTP for ${phone_number}: ${newOTP}`);

        return res.status(200).json(
            new ApiResponse(200, {
                otp_sent: true,
                otp_expires_in: 600
            }, "OTP sent successfully")
        );

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

// LOGIN USER (With Transaction)
const loginUser = asyncHandler(async (req, res) => {
    const { phone_number, pin, fcm_token } = req.body;

    if (!phone_number) {
        throw new ApiError(400, "Phone number is required");
    }

    const connection = await mysqlPool.getConnection();

    try {
        await connection.beginTransaction();

        // Find user
        const [users] = await connection.query(
            `SELECT id, phone_number, full_name, email, pin_hash, 
                    is_phone_verified, is_active, is_blocked, fcm_token
             FROM users 
             WHERE phone_number = ?`,
            [phone_number]
        );

        if (users.length === 0) {
            throw new ApiError(404, "User not found");
        }

        const user = users[0];

        // Check if user is blocked
        if (user.is_blocked) {
            throw new ApiError(403, "Your account has been blocked. Please contact support");
        }

        // Check if user is active
        if (!user.is_active) {
            throw new ApiError(403, "Your account is inactive. Please contact support");
        }

        // Check if phone is verified
        if (!user.is_phone_verified) {
            // Send new OTP
            const newOTP = generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            
            await connection.query(
                `UPDATE users 
                 SET otp_code = ?, otp_expires_at = ?
                 WHERE id = ?`,
                [newOTP, otpExpiresAt, user.id]
            );
            
            await connection.commit();
            
            console.log(`New OTP sent to ${phone_number}: ${newOTP}`);
            
            throw new ApiError(401, "Phone number not verified. OTP sent to your number");
        }

        // Verify PIN if provided
        if (pin) {
            if (!user.pin_hash) {
                throw new ApiError(400, "PIN not set for this account. Please register or use OTP login");
            }
            
            const isValidPIN = await bcrypt.compare(pin, user.pin_hash);
            if (!isValidPIN) {
                // Log failed attempt
                await connection.query(
                    `INSERT INTO audit_logs (action, entity_type, entity_id, old_values, ip_address, created_at)
                     VALUES (?, ?, ?, ?, ?, NOW())`,
                    [
                        'FAILED_LOGIN', 'user', user.id,
                        JSON.stringify({ reason: 'Invalid PIN', phone_number }),
                        req.ip || null
                    ]
                );
                throw new ApiError(401, "Invalid PIN");
            }
        }

        // Update FCM token if provided
        if (fcm_token && fcm_token !== user.fcm_token) {
            await connection.query(
                `UPDATE users SET fcm_token = ? WHERE id = ?`,
                [fcm_token, user.id]
            );
        }

        // Update last login
        await connection.query(
            `UPDATE users 
             SET last_login_at = NOW(), last_seen_at = NOW()
             WHERE id = ?`,
            [user.id]
        );

        // Log successful login
        await connection.query(
            `INSERT INTO audit_logs (action, entity_type, entity_id, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                'USER_LOGIN', 'user', user.id,
                req.ip || null,
                req.headers['user-agent'] || null
            ]
        );

        await connection.commit();

        // Generate token
        const token = generateAuthToken(user.id, 'user');

        // Return user data (excluding sensitive info)
        const userData = {
            id: user.id,
            phone_number: user.phone_number,
            full_name: user.full_name,
            email: user.email,
            is_phone_verified: user.is_phone_verified
        };

        return res.status(200).json(
            new ApiResponse(200, {
                user: userData,
                token: token
            }, "Login successful")
        );

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

// GET USER PROFILE (No transaction needed, but use connection)
const getUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const connection = await mysqlPool.getConnection();

    try {
        // Get user details
        const [users] = await connection.query(
            `SELECT id, uuid, phone_number, email, full_name, profile_picture,
                    is_phone_verified, language, notifications_enabled,
                    emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
                    home_address, home_latitude, home_longitude,
                    work_address, work_latitude, work_longitude,
                    last_login_at, last_seen_at, created_at, updated_at
             FROM users 
             WHERE id = ? AND is_active = TRUE AND is_blocked = FALSE`,
            [userId]
        );

        if (users.length === 0) {
            throw new ApiError(404, "User not found");
        }

        // Get user vehicles
        const [vehicles] = await connection.query(
            `SELECT id, vehicle_number, vehicle_make, vehicle_model, 
                    vehicle_year, vehicle_type, fuel_type, color, is_default
             FROM user_vehicles 
             WHERE user_id = ?`,
            [userId]
        );

        // Get recent breakdown requests (last 5)
        const [recentRequests] = await connection.query(
            `SELECT id, request_number, issue_type, status, total_amount,
                    requested_at, completed_at
             FROM breakdown_requests 
             WHERE user_id = ?
             ORDER BY requested_at DESC
             LIMIT 5`,
            [userId]
        );

        const userProfile = {
            ...users[0],
            vehicles: vehicles,
            recent_requests: recentRequests
        };

        return res.status(200).json(
            new ApiResponse(200, userProfile, "Profile fetched successfully")
        );

    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
});

// UPDATE USER PROFILE (With Transaction)
const updateUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const {
        full_name,
        email,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relation,
        home_address,
        home_latitude,
        home_longitude,
        work_address,
        work_latitude,
        work_longitude,
        language,
        notifications_enabled
    } = req.body;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const connection = await mysqlPool.getConnection();

    try {
        await connection.beginTransaction();

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (full_name) {
            updates.push("full_name = ?");
            values.push(full_name);
        }
        if (email) {
            // Check if email is already taken
            const [existing] = await connection.query(
                `SELECT id FROM users WHERE email = ? AND id != ?`,
                [email, userId]
            );
            if (existing.length > 0) {
                throw new ApiError(409, "Email already in use");
            }
            updates.push("email = ?");
            values.push(email);
        }
        if (emergency_contact_name) {
            updates.push("emergency_contact_name = ?");
            values.push(emergency_contact_name);
        }
        if (emergency_contact_phone) {
            updates.push("emergency_contact_phone = ?");
            values.push(emergency_contact_phone);
        }
        if (emergency_contact_relation) {
            updates.push("emergency_contact_relation = ?");
            values.push(emergency_contact_relation);
        }
        if (home_address) {
            updates.push("home_address = ?");
            values.push(home_address);
        }
        if (home_latitude) {
            updates.push("home_latitude = ?");
            values.push(home_latitude);
        }
        if (home_longitude) {
            updates.push("home_longitude = ?");
            values.push(home_longitude);
        }
        if (work_address) {
            updates.push("work_address = ?");
            values.push(work_address);
        }
        if (work_latitude) {
            updates.push("work_latitude = ?");
            values.push(work_latitude);
        }
        if (work_longitude) {
            updates.push("work_longitude = ?");
            values.push(work_longitude);
        }
        if (language) {
            updates.push("language = ?");
            values.push(language);
        }
        if (notifications_enabled !== undefined) {
            updates.push("notifications_enabled = ?");
            values.push(notifications_enabled ? 1 : 0);
        }

        if (updates.length > 0) {
            updates.push("updated_at = NOW()");
            values.push(userId);
            
            const [result] = await connection.query(
                `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                throw new ApiError(404, "User not found");
            }
        }

        await connection.commit();

        // Get updated profile
        const [updatedUser] = await connection.query(
            `SELECT id, uuid, phone_number, email, full_name, profile_picture,
                    is_phone_verified, language, notifications_enabled,
                    emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
                    home_address, home_latitude, home_longitude,
                    work_address, work_latitude, work_longitude
             FROM users WHERE id = ?`,
            [userId]
        );

        return res.status(200).json(
            new ApiResponse(200, updatedUser[0], "Profile updated successfully")
        );

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

// UPDATE USER LOCATION (No transaction needed)
const updateUserLocation = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { latitude, longitude } = req.body;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (!latitude || !longitude) {
        throw new ApiError(400, "Latitude and longitude are required");
    }

    const connection = await mysqlPool.getConnection();

    try {
        const [result] = await connection.query(
            `UPDATE users 
             SET current_latitude = ?, 
                 current_longitude = ?, 
                 location_updated_at = NOW()
             WHERE id = ?`,
            [latitude, longitude, userId]
        );

        if (result.affectedRows === 0) {
            throw new ApiError(404, "User not found");
        }

        return res.status(200).json(
            new ApiResponse(200, {
                latitude,
                longitude,
                updated_at: new Date()
            }, "Location updated successfully")
        );

    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
});

// CHANGE PIN (With Transaction)
const changePin = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { old_pin, new_pin } = req.body;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (!old_pin || !new_pin) {
        throw new ApiError(400, "Old PIN and new PIN are required");
    }

    if (new_pin.length < 4 || new_pin.length > 6) {
        throw new ApiError(400, "PIN must be 4-6 digits");
    }

    const connection = await mysqlPool.getConnection();

    try {
        await connection.beginTransaction();

        // Get current user with PIN hash
        const [users] = await connection.query(
            `SELECT id, pin_hash FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            throw new ApiError(404, "User not found");
        }

        const user = users[0];

        // Verify old PIN
        if (!user.pin_hash) {
            throw new ApiError(400, "No PIN set for this account");
        }

        const isValidPIN = await bcrypt.compare(old_pin, user.pin_hash);
        if (!isValidPIN) {
            throw new ApiError(401, "Invalid old PIN");
        }

        // Hash new PIN
        const newPinHash = await bcrypt.hash(new_pin, 10);

        // Update PIN
        const [result] = await connection.query(
            `UPDATE users SET pin_hash = ?, updated_at = NOW() WHERE id = ?`,
            [newPinHash, userId]
        );

        if (result.affectedRows === 0) {
            throw new ApiError(500, "Failed to update PIN");
        }

        // Log PIN change
        await connection.query(
            `INSERT INTO audit_logs (action, entity_type, entity_id, ip_address, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            ['CHANGE_PIN', 'user', userId, req.ip || null]
        );

        await connection.commit();

        return res.status(200).json(
            new ApiResponse(200, {}, "PIN changed successfully")
        );

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

// DELETE USER ACCOUNT (With Transaction)
const deleteUserAccount = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { confirmation } = req.body;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    if (confirmation !== 'DELETE') {
        throw new ApiError(400, "Please type 'DELETE' to confirm account deletion");
    }

    const connection = await mysqlPool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if user has pending requests
        const [pendingRequests] = await connection.query(
            `SELECT COUNT(*) as count FROM breakdown_requests 
             WHERE user_id = ? AND status IN ('pending', 'searching', 'assigned', 'accepted', 'en_route', 'in_progress')`,
            [userId]
        );

        if (pendingRequests[0].count > 0) {
            throw new ApiError(400, "Cannot delete account with pending breakdown requests. Please complete or cancel them first.");
        }

        // Soft delete - deactivate account instead of hard delete
        const [result] = await connection.query(
            `UPDATE users 
             SET is_active = FALSE, 
                 is_blocked = TRUE, 
                 blocked_reason = 'Account deleted by user',
                 fcm_token = NULL,
                 updated_at = NOW()
             WHERE id = ?`,
            [userId]
        );

        if (result.affectedRows === 0) {
            throw new ApiError(404, "User not found");
        }

        // Log account deletion
        await connection.query(
            `INSERT INTO audit_logs (action, entity_type, entity_id, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            ['ACCOUNT_DELETED', 'user', userId, req.ip || null, req.headers['user-agent'] || null]
        );

        await connection.commit();

        return res.status(200).json(
            new ApiResponse(200, {}, "Account deleted successfully")
        );

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
});

export {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    getUserProfile,
    updateUserProfile,
    updateUserLocation,
    changePin,
    deleteUserAccount
};