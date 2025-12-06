import User from '../models/User.js';
import Connection from '../models/Connection.js';
import Conversation from '../models/Conversation.js';

// Block a user
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user.id;

    if (userId === blockerId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({ message: 'User not found' });
    }

    const blocker = await User.findById(blockerId);

    // Check if already blocked
    if (blocker.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: 'User already blocked' });
    }

    // Add to blocked list
    blocker.blockedUsers.push(userId);
    userToBlock.blockedBy.push(blockerId);

    // Remove from friends if they are friends
    blocker.friends = blocker.friends.filter(id => id.toString() !== userId);
    userToBlock.friends = userToBlock.friends.filter(id => id.toString() !== blockerId);

    // Remove from followers/following
    blocker.followers = blocker.followers.filter(id => id.toString() !== userId);
    blocker.following = blocker.following.filter(id => id.toString() !== userId);
    userToBlock.followers = userToBlock.followers.filter(id => id.toString() !== blockerId);
    userToBlock.following = userToBlock.following.filter(id => id.toString() !== blockerId);

    // Remove any pending friend requests
    blocker.friendRequests = blocker.friendRequests.filter(id => id.toString() !== userId);
    blocker.sentFriendRequests = blocker.sentFriendRequests.filter(id => id.toString() !== userId);
    userToBlock.friendRequests = userToBlock.friendRequests.filter(id => id.toString() !== blockerId);
    userToBlock.sentFriendRequests = userToBlock.sentFriendRequests.filter(id => id.toString() !== blockerId);

    await blocker.save();
    await userToBlock.save();

    // Remove connection record if exists
    await Connection.deleteMany({
      $or: [
        { requester: blockerId, recipient: userId },
        { requester: userId, recipient: blockerId }
      ]
    });

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unblock a user
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const unblockerId = req.user.id;

    const userToUnblock = await User.findById(userId);
    if (!userToUnblock) {
      return res.status(404).json({ message: 'User not found' });
    }

    const unblocker = await User.findById(unblockerId);

    // Check if user is blocked
    if (!unblocker.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: 'User is not blocked' });
    }

    // Remove from blocked lists
    unblocker.blockedUsers = unblocker.blockedUsers.filter(id => id.toString() !== userId);
    userToUnblock.blockedBy = userToUnblock.blockedBy.filter(id => id.toString() !== unblockerId);

    await unblocker.save();
    await userToUnblock.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get blocked users list
export const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('blockedUsers', 'name email profilePicture bio');
    
    res.json(user.blockedUsers || []);
  } catch (error) {
    console.error('Error getting blocked users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if a user is blocked
export const isUserBlocked = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    
    const isBlocked = currentUser.blockedUsers.includes(userId);
    const isBlockedBy = currentUser.blockedBy.includes(userId);

    res.json({ 
      isBlocked, 
      isBlockedBy,
      canInteract: !isBlocked && !isBlockedBy
    });
  } catch (error) {
    console.error('Error checking block status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
