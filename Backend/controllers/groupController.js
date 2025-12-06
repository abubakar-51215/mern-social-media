import GroupConversation from "../models/GroupConversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { encryptMessage, decryptMessage } from "../utils/encryption.js";

// Helper function to decrypt messages
const decryptMessages = (messages) => {
  return messages.map(msg => {
    if (msg.isEncrypted && msg.text) {
      const decryptedText = decryptMessage(msg.text);
      return {
        ...msg.toObject ? msg.toObject() : msg,
        text: decryptedText
      };
    }
    return msg.toObject ? msg.toObject() : msg;
  });
};

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, memberIds } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!memberIds || memberIds.length < 1) {
      return res.status(400).json({ message: "At least one member is required" });
    }

    // Create members array with creator as admin
    const members = [
      { user: userId, role: 'admin', addedBy: userId }
    ];

    // Add other members
    for (const memberId of memberIds) {
      if (memberId !== userId) {
        members.push({ user: memberId, role: 'member', addedBy: userId });
      }
    }

    const group = await GroupConversation.create({
      name: name.trim(),
      description: description || '',
      members,
      createdBy: userId
    });

    // Populate members
    await group.populate('members.user', 'name email profilePicture');
    await group.populate('createdBy', 'name email profilePicture');

    // Emit socket event to all members
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (io && onlineUsers) {
      memberIds.forEach(memberId => {
        const socketId = onlineUsers.get(memberId);
        if (socketId) {
          io.to(socketId).emit('groupCreated', { group });
        }
      });
    }

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all groups for a user
export const getGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await GroupConversation.find({
      'members.user': userId
    })
      .populate('members.user', 'name email profilePicture isOnline lastSeen activityStatus')
      .populate('createdBy', 'name email profilePicture')
      .populate('lastMessageSender', 'name')
      .sort({ lastMessageTime: -1 });

    // Add unread count for each group
    const groupsWithUnread = await Promise.all(groups.map(async (group) => {
      const unreadCount = await Message.countDocuments({
        groupId: group._id,
        sender: { $ne: userId },
        read: false
      });
      
      return {
        ...group.toObject(),
        unreadCount
      };
    }));

    res.json(groupsWithUnread);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single group by ID
export const getGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const group = await GroupConversation.findById(groupId)
      .populate('members.user', 'name email profilePicture isOnline lastSeen activityStatus')
      .populate('createdBy', 'name email profilePicture');

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const group = await GroupConversation.findById(groupId);
    if (!group || !group.isMember(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ groupId })
      .populate('sender', 'name email profilePicture')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { groupId, sender: { $ne: userId }, read: false },
      { read: true }
    );

    // Decrypt messages before sending
    const decryptedMessages = decryptMessages(messages);

    res.json(decryptedMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send message to group
export const sendGroupMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const { text, encrypted = true } = req.body;

    const group = await GroupConversation.findById(groupId);
    if (!group || !group.isMember(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if only admins can send
    if (group.settings.onlyAdminsCanSend && !group.isAdmin(userId)) {
      return res.status(403).json({ message: "Only admins can send messages in this group" });
    }

    // Encrypt message if enabled
    const encryptedText = encrypted && text ? encryptMessage(text) : text;

    const message = await Message.create({
      groupId,
      sender: userId,
      text: encryptedText,
      messageType: 'text',
      isEncrypted: encrypted && !!text
    });

    // Update group's last message (store preview as truncated plain text)
    const messagePreview = text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : '';
    group.lastMessage = messagePreview;
    group.lastMessageTime = new Date();
    group.lastMessageSender = userId;
    await group.save();

    // Populate sender info
    await message.populate('sender', 'name email profilePicture');

    // Prepare decrypted message for socket emission
    const messageForSocket = {
      ...message.toObject(),
      text: text // Send original text through socket for real-time display
    };

    // Emit socket event to all group members
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (io && onlineUsers) {
      group.members.forEach(member => {
        if (member.user.toString() !== userId) {
          const socketId = onlineUsers.get(member.user.toString());
          if (socketId) {
            io.to(socketId).emit('groupMessage', {
              groupId,
              message: messageForSocket
            });
          }
        }
      });
    }

    res.status(201).json(messageForSocket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update group info (name, description, avatar)
export const updateGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const { name, description } = req.body;

    const group = await GroupConversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if only admins can edit info
    if (group.settings.onlyAdminsCanEditInfo && !group.isAdmin(userId)) {
      return res.status(403).json({ message: "Only admins can edit group info" });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description;

    await group.save();

    await group.populate('members.user', 'name email profilePicture');
    await group.populate('createdBy', 'name email profilePicture');

    // Notify all members
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (io && onlineUsers) {
      group.members.forEach(member => {
        const socketId = onlineUsers.get(member.user._id.toString());
        if (socketId) {
          io.to(socketId).emit('groupUpdated', { group });
        }
      });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update group avatar
export const updateGroupAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const group = await GroupConversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (group.settings.onlyAdminsCanEditInfo && !group.isAdmin(userId)) {
      return res.status(403).json({ message: "Only admins can edit group info" });
    }

    group.avatar = `/uploads/groups/${req.file.filename}`;
    await group.save();

    await group.populate('members.user', 'name email profilePicture');

    // Notify all members
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (io && onlineUsers) {
      group.members.forEach(member => {
        const socketId = onlineUsers.get(member.user._id.toString());
        if (socketId) {
          io.to(socketId).emit('groupUpdated', { group });
        }
      });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update group settings
export const updateGroupSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const { settings } = req.body;

    const group = await GroupConversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isAdmin(userId)) {
      return res.status(403).json({ message: "Only admins can update group settings" });
    }

    if (settings) {
      group.settings = { ...group.settings, ...settings };
    }

    await group.save();

    await group.populate('members.user', 'name email profilePicture');

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add members to group
export const addMembers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const { memberIds } = req.body;

    const group = await GroupConversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (group.settings.onlyAdminsCanAddMembers && !group.isAdmin(userId)) {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    const newMembers = [];
    for (const memberId of memberIds) {
      if (!group.isMember(memberId)) {
        group.members.push({
          user: memberId,
          role: 'member',
          addedBy: userId
        });
        newMembers.push(memberId);
      }
    }

    await group.save();
    await group.populate('members.user', 'name email profilePicture');
    await group.populate('createdBy', 'name email profilePicture');

    // Notify all members including new ones
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (io && onlineUsers) {
      // Notify existing members
      group.members.forEach(member => {
        const socketId = onlineUsers.get(member.user._id.toString());
        if (socketId) {
          io.to(socketId).emit('groupMembersAdded', { 
            groupId, 
            newMembers: newMembers,
            group 
          });
        }
      });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove member from group
export const removeMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId, memberId } = req.params;

    const group = await GroupConversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only admins can remove members (unless removing self)
    if (memberId !== userId && !group.isAdmin(userId)) {
      return res.status(403).json({ message: "Only admins can remove members" });
    }

    // Can't remove the creator
    if (memberId === group.createdBy.toString() && memberId !== userId) {
      return res.status(403).json({ message: "Cannot remove the group creator" });
    }

    // If removing an admin, only creator can do it
    const memberToRemove = group.members.find(m => m.user.toString() === memberId);
    if (memberToRemove && memberToRemove.role === 'admin' && 
        group.createdBy.toString() !== userId && memberId !== userId) {
      return res.status(403).json({ message: "Only the group creator can remove admins" });
    }

    group.members = group.members.filter(m => m.user.toString() !== memberId);

    // If no members left, delete the group
    if (group.members.length === 0) {
      await GroupConversation.findByIdAndDelete(groupId);
      return res.json({ message: "Group deleted as no members remain" });
    }

    // If no admins left, make the oldest member an admin
    if (group.getAdmins().length === 0) {
      group.members[0].role = 'admin';
    }

    await group.save();
    await group.populate('members.user', 'name email profilePicture');

    // Notify all members
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (io && onlineUsers) {
      // Notify removed member
      const removedSocketId = onlineUsers.get(memberId);
      if (removedSocketId) {
        io.to(removedSocketId).emit('removedFromGroup', { groupId });
      }

      // Notify remaining members
      group.members.forEach(member => {
        const socketId = onlineUsers.get(member.user._id.toString());
        if (socketId) {
          io.to(socketId).emit('groupMemberRemoved', { groupId, removedMemberId: memberId, group });
        }
      });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const group = await GroupConversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isMember(userId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    group.members = group.members.filter(m => m.user.toString() !== userId);

    // If no members left, delete the group
    if (group.members.length === 0) {
      await GroupConversation.findByIdAndDelete(groupId);
      return res.json({ message: "Group deleted as no members remain" });
    }

    // If leaving member was the only admin, make the oldest member an admin
    if (group.getAdmins().length === 0) {
      group.members[0].role = 'admin';
    }

    await group.save();
    await group.populate('members.user', 'name email profilePicture');

    // Notify remaining members
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (io && onlineUsers) {
      group.members.forEach(member => {
        const socketId = onlineUsers.get(member.user._id.toString());
        if (socketId) {
          io.to(socketId).emit('groupMemberLeft', { groupId, leftMemberId: userId, group });
        }
      });
    }

    res.json({ message: "Left group successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Make member an admin
export const makeAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId, memberId } = req.params;

    const group = await GroupConversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isAdmin(userId)) {
      return res.status(403).json({ message: "Only admins can promote members" });
    }

    const member = group.members.find(m => m.user.toString() === memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.role = 'admin';
    await group.save();

    await group.populate('members.user', 'name email profilePicture');

    // Notify all members
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (io && onlineUsers) {
      group.members.forEach(m => {
        const socketId = onlineUsers.get(m.user._id.toString());
        if (socketId) {
          io.to(socketId).emit('groupAdminChanged', { groupId, memberId, role: 'admin', group });
        }
      });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove admin privileges
export const removeAdmin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId, memberId } = req.params;

    const group = await GroupConversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only creator can remove admin privileges
    if (group.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Only the group creator can remove admin privileges" });
    }

    // Can't remove creator's admin status
    if (memberId === group.createdBy.toString()) {
      return res.status(403).json({ message: "Cannot remove admin privileges from the creator" });
    }

    const member = group.members.find(m => m.user.toString() === memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member.role = 'member';
    await group.save();

    await group.populate('members.user', 'name email profilePicture');

    // Notify all members
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (io && onlineUsers) {
      group.members.forEach(m => {
        const socketId = onlineUsers.get(m.user._id.toString());
        if (socketId) {
          io.to(socketId).emit('groupAdminChanged', { groupId, memberId, role: 'member', group });
        }
      });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete group (only creator)
export const deleteGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;

    const group = await GroupConversation.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() !== userId) {
      return res.status(403).json({ message: "Only the group creator can delete the group" });
    }

    // Notify all members before deletion
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    
    if (io && onlineUsers) {
      group.members.forEach(member => {
        const socketId = onlineUsers.get(member.user.toString());
        if (socketId) {
          io.to(socketId).emit('groupDeleted', { groupId, groupName: group.name });
        }
      });
    }

    // Delete all messages in the group
    await Message.deleteMany({ groupId });

    // Delete the group
    await GroupConversation.findByIdAndDelete(groupId);

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
