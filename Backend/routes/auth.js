import express from "express";
import { registerUser, loginUser, forgotPassword, verifyOTP, resetPassword } from "../controllers/authController.js";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

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
    passport.authenticate('google', { failureRedirect: 'http://localhost:3000?error=auth_failed' }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.redirect(`http://localhost:3000?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
    }
);

export default router;
