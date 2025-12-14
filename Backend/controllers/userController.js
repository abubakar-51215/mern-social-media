// controllers/userController.js
import User from '../models/User.js';

export const getUser = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;
    const { name, username, bio, location, website, profilePicture, coverPhoto } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        return res.status(400).json({ message: "Username already taken" });
      }
      user.username = username;
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (coverPhoto !== undefined) user.coverPhoto = coverPhoto;

    await user.save();

    const updatedUser = await User.findById(userId).select('-password');
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: "Error updating profile" });
  }
};

// Get user by ID (public profile view)
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate ObjectId format
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('friends', 'name username email profilePicture')
      .populate('followers', 'name username email profilePicture')
      .populate('following', 'name username email profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: "Error fetching user" });
  }
};

// Search users (for finding people to add as friends)
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user?.id || req.user?._id || req.user;
    
    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name username email profilePicture bio')
    .limit(20);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: "Error searching users" });
  }
};

// Get suggested users (people you might know)
export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.user?._id || req.user;

    if (!currentUserId || typeof currentUserId !== 'string' || currentUserId.length !== 24) {
      return res.status(403).json({ message: 'Admin users cannot fetch suggested users' });
    }
    
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure arrays exist
    const friends = currentUser.friends || [];
    const friendRequests = currentUser.friendRequests || [];
    const sentFriendRequests = currentUser.sentFriendRequests || [];

    // Find users who are not friends and have no pending requests
    // Sort by most recently created first so new users appear in suggestions
    const suggestedUsers = await User.find({
      _id: { 
        $ne: currentUserId,
        $nin: [...friends, ...friendRequests, ...sentFriendRequests]
      }
    })
    .select('name username email profilePicture bio')
    .sort({ createdAt: -1 }) // Most recent users first
    .limit(20); // Increased limit to show more users

    res.json(suggestedUsers);
  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(500).json({ message: "Error fetching suggested users" });
  }
};
