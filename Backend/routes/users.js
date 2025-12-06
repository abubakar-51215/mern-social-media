import express from "express";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import { protect } from "../middleware/auth.js";
import { upload, handleUploadError } from "../middleware/upload.js";
import { getUser, updateProfile, getUserById, searchUsers, getSuggestedUsers } from "../controllers/userController.js";

const router = express.Router();

// Create transporter function to ensure env vars are loaded
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Protected routes
router.get("/me", protect, getUser);
router.put("/profile", protect, updateProfile);
router.post("/upload-profile-picture", protect, async (req, res) => {
  upload.single('profilePicture')(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ message: err.message || 'Failed to upload file' });
    }

    try {
      const userId = req.user?.id || req.user?._id;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePicture: profilePicturePath },
        { new: true }
      ).select('-password');

      res.json({ 
        message: 'Profile picture updated successfully',
        user: updatedUser,
        profilePicture: profilePicturePath
      });
    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  });
});
router.get("/search", protect, searchUsers);
router.get("/suggestions", protect, getSuggestedUsers);
router.get("/profile/:userId", protect, getUserById);

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate('friends', 'name username email profilePicture')
      .populate('followers', 'name username email profilePicture')
      .populate('following', 'name username email profilePicture');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single user by email
router.get("/email/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update activity status
router.put("/activity-status", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.body;
    
    const validStatuses = ['online', 'offline', 'away', 'busy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        activityStatus: status, 
        isOnline: status !== 'offline',
        lastSeen: new Date()
      },
      { new: true }
    ).select('activityStatus isOnline lastSeen');
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user by ID
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    Object.assign(user, req.body);
    await user.save();
    
    const updatedUser = user.toObject();
    delete updatedUser.password;
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create test user
router.post("/create-test-user", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: 'abubakeramir95@gmail.com' });
    if (existingUser) {
      return res.json({ message: "User already exists", userId: existingUser._id });
    }
    const user = new User({
      name: 'Abubaker Amir',
      email: 'abubakeramir95@gmail.com',
      password: 'test123'
    });
    await user.save();
    res.json({ message: "Test user created", userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send OTP to current email for verification
router.post("/send-otp-current", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.pendingEmail = { otp, otpExpiry: Date.now() + 600000 };
    await user.save();

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"PingUp" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Verify Email Addition',
      text: `Your verification code is: ${otp}`
    });

    res.json({ message: "OTP sent to current email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify OTP from current email
router.post("/verify-otp-current", async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.pendingEmail?.otp || user.pendingEmail.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (Date.now() > user.pendingEmail.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send verification link to new email
router.post("/send-verification-link", async (req, res) => {
  try {
    const { userId, newEmail } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.pendingEmail = { address: newEmail, otp, otpExpiry: Date.now() + 600000 };
    await user.save();

    const ip = req.ip || req.connection.remoteAddress;
    const date = new Date().toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"PingUp" <${process.env.EMAIL_USER}>`,
      to: newEmail,
      subject: `[Development] ${otp} is your verification code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a; font-size: 24px; margin-bottom: 10px;">PingUp</h2>
          <h1 style="color: #1a1a1a; font-size: 28px; margin: 30px 0;">Verification code</h1>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">Enter the following verification code when prompted:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <h2 style="font-size: 36px; margin: 0; letter-spacing: 4px;">${otp}</h2>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.5;">To protect your account, do not share this code.</p>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #333; font-size: 14px; margin-bottom: 10px;"><strong>Didn't request this?</strong></p>
            <p style="color: #666; font-size: 13px; line-height: 1.5;">This code was requested from <strong>${ip}</strong> at <strong>${date}</strong>. If you didn't make this request, you can safely ignore this email.</p>
          </div>
        </div>
      `
    });

    res.json({ message: "Verification link sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove email
router.post("/remove-email", async (req, res) => {
  try {
    const { userId, emailAddress } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.emails = user.emails.filter(e => e.address !== emailAddress);
    await user.save();

    res.json({ message: "Email removed", emails: user.emails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify new email with OTP
router.post("/verify-new-email", async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.pendingEmail?.otp || user.pendingEmail.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (Date.now() > user.pendingEmail.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.emails.push({ address: user.pendingEmail.address, verified: true });
    user.pendingEmail = undefined;
    await user.save();

    res.json({ message: "Email verified and added", emails: user.emails });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
router.post("/change-password", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set password (for users who don't have one or want to reset)
router.post("/set-password", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { newPassword, signOutOtherDevices } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    
    // If signOutOtherDevices is true, you could implement session invalidation here
    // For now, we'll just save the password
    if (signOutOtherDevices) {
      // Clear any session tokens or implement your session management logic
      user.sessionVersion = (user.sessionVersion || 0) + 1;
    }
    
    await user.save();

    res.json({ message: "Password set successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set primary email
router.post('/set-primary-email', protect, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email exists in secondaryEmails
        const secondaryEmailIndex = user.secondaryEmails.findIndex(
            se => se.address === email
        );

        if (secondaryEmailIndex === -1) {
            return res.status(400).json({ message: 'Email not found in secondary emails' });
        }

        // Swap primary and secondary emails
        const oldPrimaryEmail = user.email;
        const newPrimaryEmail = email;

        user.email = newPrimaryEmail;
        user.secondaryEmails.splice(secondaryEmailIndex, 1);
        user.secondaryEmails.push({
            address: oldPrimaryEmail,
            verified: true,
            addedAt: new Date()
        });

        await user.save();

        res.json({ message: 'Primary email updated successfully', user });
    } catch (error) {
        console.error('Error setting primary email:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove email
router.delete('/remove-email', protect, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if trying to remove primary email
        if (user.email === email) {
            return res.status(400).json({ message: 'Cannot remove primary email. Set another email as primary first.' });
        }

        // Remove from secondaryEmails
        const initialLength = user.secondaryEmails.length;
        user.secondaryEmails = user.secondaryEmails.filter(se => se.address !== email);

        if (user.secondaryEmails.length === initialLength) {
            return res.status(404).json({ message: 'Email not found' });
        }

        await user.save();

        res.json({ message: 'Email removed successfully', user });
    } catch (error) {
        console.error('Error removing email:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete account
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    
    // Delete user and all associated data
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete user's posts, messages, and other related data
    // You can add more cleanup here based on your schema
    await Promise.all([
      User.findByIdAndDelete(userId),
      // Add other model deletions here
      // Post.deleteMany({ user: userId }),
      // Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }),
      // etc.
    ]);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send verification code to new email
router.post("/send-verification-code", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { email } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Verify email credentials are available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email credentials missing:', {
        EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Missing',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Set' : 'Missing'
      });
      return res.status(500).json({ error: "Email service not configured" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiry (10 minutes)
    user.pendingEmailVerification = {
      email: email,
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    await user.save();

    // Get request info for email
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
    const userAgent = req.headers['user-agent'] || '';
    const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : userAgent.includes('Safari') ? 'Safari' : 'Unknown';
    const date = new Date().toLocaleString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });

    // Send email with PingUp branding
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"PingUp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[Development] ${otp} is your verification code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #6366f1; font-size: 28px; margin: 0 0 30px 0; font-weight: 700;">PingUp</h2>
            
            <h1 style="color: #111827; font-size: 32px; font-weight: 700; margin: 0 0 16px 0;">Verification code</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
              Enter the following verification code when prompted:
            </p>
            
            <div style="background: #f3f4f6; padding: 24px; text-align: center; margin: 0 0 32px 0; border-radius: 12px;">
              <div style="font-size: 48px; font-weight: 700; letter-spacing: 8px; color: #111827; font-family: 'Courier New', monospace;">${otp}</div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 40px 0;">
              To protect your account, do not share this code.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
              <p style="color: #111827; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">Didn't request this?</p>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                This code was requested from <strong style="color: #111827;">${ip}</strong> at 
                <strong style="color: #111827;">${date}</strong>. If you didn't make this request, 
                you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    res.json({ message: "Verification code sent successfully" });
  } catch (err) {
    console.error('Error sending verification code:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify email with code
router.post("/verify-email", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { email, code } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if verification data exists
    if (!user.pendingEmailVerification) {
      return res.status(400).json({ message: "No pending email verification" });
    }

    // Verify email matches
    if (user.pendingEmailVerification.email !== email) {
      return res.status(400).json({ message: "Email mismatch" });
    }

    // Check if code is expired
    if (new Date() > user.pendingEmailVerification.expiresAt) {
      user.pendingEmailVerification = undefined;
      await user.save();
      return res.status(400).json({ message: "Verification code expired" });
    }

    // Verify code
    if (user.pendingEmailVerification.code !== code) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    // Add email to user's secondary emails array
    if (!user.secondaryEmails) {
      user.secondaryEmails = [];
    }
    user.secondaryEmails.push({
      address: email,
      verified: true,
      addedAt: new Date()
    });

    // Clear pending verification
    user.pendingEmailVerification = undefined;
    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({ 
      message: "Email verified successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error('Error verifying email:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update profile with image upload
router.put("/update-profile", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    // Handle profile picture upload if multer is configured
    if (req.file) {
      user.profilePicture = `/uploads/${req.file.filename}`;
    }

    await user.save();
    
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({ 
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove connected Google account
router.delete("/remove-google-account", protect, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    user.googleId = undefined;
    await user.save();

    res.json({ message: "Google account disconnected successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
