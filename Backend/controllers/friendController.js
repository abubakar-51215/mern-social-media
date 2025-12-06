import User from '../models/User.js';

let io, userSocketMap;

// Function to set io and userSocketMap from index.js
export const setSocketInstances = (ioInstance, socketMap) => {
  io = ioInstance;
  userSocketMap = socketMap;
};

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const senderId = req.user.id;

    if (userId === senderId.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    const receiver = await User.findById(userId);
    if (!receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sender = await User.findById(senderId);

    // Check if already friends
    if (sender.friends.includes(userId)) {
      return res.status(400).json({ message: 'Already friends with this user' });
    }

    // Check if request already sent
    if (sender.sentFriendRequests.includes(userId)) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Check if request already received from this user
    if (receiver.sentFriendRequests.includes(senderId)) {
      return res.status(400).json({ message: 'This user has already sent you a request' });
    }

    // Add to sent requests and friend requests
    sender.sentFriendRequests.push(userId);
    receiver.friendRequests.push(senderId);

    await sender.save();
    await receiver.save();

    // Create notification for friend request
    const Notification = (await import('../models/Notification.js')).default;
    await Notification.create({
      recipient: userId,
      sender: senderId,
      type: 'follow',
      message: `${sender.name} sent you a friend request`
    });

    // Send real-time notification via Socket.io
    if (io && userSocketMap) {
      const receiverSocketId = userSocketMap.get(userId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('friendRequestReceived', {
          from: {
            _id: sender._id,
            name: sender.name,
            profilePicture: sender.profilePicture
          }
        });
        io.to(receiverSocketId).emit('newNotification', {
          type: 'follow',
          message: `${sender.name} sent you a friend request`
        });
      }
    }

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const accepterId = req.user.id;

    const accepter = await User.findById(accepterId);
    const requester = await User.findById(userId);

    if (!requester) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if friend request exists
    if (!accepter.friendRequests.includes(userId)) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    // Add to friends list (mutual)
    accepter.friends.push(userId);
    requester.friends.push(accepterId);

    // Add to followers/following (mutual - like Instagram when both follow each other)
    // Accepter follows Requester
    if (!accepter.following.includes(userId)) {
      accepter.following.push(userId);
    }
    if (!requester.followers.includes(accepterId)) {
      requester.followers.push(accepterId);
    }
    
    // Requester follows Accepter
    if (!requester.following.includes(accepterId)) {
      requester.following.push(accepterId);
    }
    if (!accepter.followers.includes(userId)) {
      accepter.followers.push(userId);
    }

    // Remove from friend requests and sent requests
    accepter.friendRequests = accepter.friendRequests.filter(
      id => id.toString() !== userId
    );
    requester.sentFriendRequests = requester.sentFriendRequests.filter(
      id => id.toString() !== accepterId.toString()
    );

    await accepter.save();
    await requester.save();

    // Create notification for friend request acceptance
    const Notification = (await import('../models/Notification.js')).default;
    await Notification.create({
      recipient: userId,
      sender: accepterId,
      type: 'follow',
      message: `${accepter.name} accepted your friend request`
    });

    // Send real-time notification via Socket.io
    if (io && userSocketMap) {
      const requesterSocketId = userSocketMap.get(userId);
      if (requesterSocketId) {
        io.to(requesterSocketId).emit('friendRequestAccepted', {
          from: {
            _id: accepter._id,
            name: accepter.name,
            profilePicture: accepter.profilePicture
          }
        });
        io.to(requesterSocketId).emit('newNotification', {
          type: 'follow',
          message: `${accepter.name} accepted your friend request`
        });
      }
    }

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;
    const rejecterId = req.user.id;

    const rejecter = await User.findById(rejecterId);
    const requester = await User.findById(userId);

    if (!requester) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from friend requests and sent requests
    rejecter.friendRequests = rejecter.friendRequests.filter(
      id => id.toString() !== userId
    );
    requester.sentFriendRequests = requester.sentFriendRequests.filter(
      id => id.toString() !== rejecterId.toString()
    );

    await rejecter.save();
    await requester.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get friend requests
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('friendRequests', 'name email profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.friendRequests || []);
  } catch (error) {
    console.error('Error getting friend requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get friends list
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('friends', 'name email profilePicture bio');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.friends || []);
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const { userId } = req.params;
    const removerId = req.user.id;

    const remover = await User.findById(removerId);
    const friend = await User.findById(userId);

    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from friends list
    remover.friends = remover.friends.filter(id => id.toString() !== userId);
    friend.friends = friend.friends.filter(id => id.toString() !== removerId.toString());

    // Also remove from followers/following
    remover.followers = remover.followers.filter(id => id.toString() !== userId);
    remover.following = remover.following.filter(id => id.toString() !== userId);
    friend.followers = friend.followers.filter(id => id.toString() !== removerId.toString());
    friend.following = friend.following.filter(id => id.toString() !== removerId.toString());

    await remover.save();
    await friend.save();

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
