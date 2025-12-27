import express from "express";
import { registerUser, loginUser, forgotPassword, verifyOTP, resetPassword } from "../controllers/authController.js";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:3000';

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: ${getClientUrl()}?error=auth_failed }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        const clientUrl = getClientUrl();
        res.redirect(${clientUrl}?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))});
    }
);

export default router;
