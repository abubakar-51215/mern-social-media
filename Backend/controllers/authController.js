import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOTPEmail } from "../config/email.js";

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const newUser = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json({
      message: "Account created successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Track login session
    const deviceInfo = parseUserAgent(userAgent);
    const loginSession = {
      deviceInfo: {
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os
      },
      ip: ip.replace('::ffff:', ''),
      location: 'Unknown', // In production, use IP geolocation service
      loginAt: new Date(),
      lastActive: new Date(),
      isActive: true,
      sessionToken: token
    };

    // Add to login sessions (keep last 10)
    user.loginSessions = user.loginSessions || [];
    user.loginSessions.unshift(loginSession);
    if (user.loginSessions.length > 10) {
      user.loginSessions = user.loginSessions.slice(0, 10);
    }
    
    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    
    await user.save();

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Parse user agent to get device info
const parseUserAgent = (userAgent) => {
  const result = {
    device: 'Unknown Device',
    browser: 'Unknown Browser',
    os: 'Unknown OS'
  };

  // Detect OS
  if (userAgent.includes('Windows')) result.os = 'Windows';
  else if (userAgent.includes('Mac')) result.os = 'macOS';
  else if (userAgent.includes('Linux')) result.os = 'Linux';
  else if (userAgent.includes('Android')) result.os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) result.os = 'iOS';

  // Detect Browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) result.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) result.browser = 'Safari';
  else if (userAgent.includes('Edg')) result.browser = 'Edge';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) result.browser = 'Opera';

  // Detect Device
  if (userAgent.includes('Mobile')) result.device = 'Mobile';
  else if (userAgent.includes('Tablet')) result.device = 'Tablet';
  else result.device = 'Desktop';

  result.device = `${result.device} - ${result.browser} on ${result.os}`;

  return result;
};

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// FORGOT PASSWORD - Send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with 10 minutes expiry
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp);
      console.log(`OTP sent to ${email}: ${otp}`);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Still return success with OTP in development mode if email fails
      return res.json({
        message: "OTP generated (email service unavailable)",
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      });
    }

    res.json({
      message: "OTP sent to your email",
      // In development, you can return OTP for testing
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// VERIFY OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const storedData = otpStore.get(email);
    
    if (!storedData) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    res.json({ message: "OTP verified successfully" });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Verify OTP again
    const storedData = otpStore.get(email);
    
    if (!storedData || storedData.otp !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }

    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Clear OTP from store
    otpStore.delete(email);

    res.json({ message: "Password reset successfully" });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};