import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js";
const router = Router();

import {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    getUserProfile,
    updateUserProfile,
    updateUserLocation,
    changePin,
    deleteUserAccount
} from '../controllers/user.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';


// Public routes
router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.get('/profile', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, updateUserProfile);
router.put('/location', authenticateUser, updateUserLocation);
router.post('/change-pin', authenticateUser, changePin);
router.delete('/account', authenticateUser, deleteUserAccount);

export default router;
