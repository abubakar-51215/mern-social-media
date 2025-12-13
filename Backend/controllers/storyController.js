import Story from '../models/Story.js';
import User from '../models/User.js';

// Create a new story
export const createStory = async (req, res) => {
  try {
    let { type, text, backgroundColor, music, question, poll, mentions, isCloseFriendsOnly } = req.body;
    const userId = req.user?.id || req.user?._id || req.user;

    // Parse JSON fields if they come as strings (from FormData)
    if (typeof music === 'string') {
      try {
        music = JSON.parse(music);
      } catch (e) {
        console.error('Failed to parse music JSON:', e);
      }
    }
    if (typeof question === 'string') {
      try {
        question = JSON.parse(question);
      } catch (e) {
        console.error('Failed to parse question JSON:', e);
      }
    }
    if (typeof poll === 'string') {
      try {
        poll = JSON.parse(poll);
      } catch (e) {
        console.error('Failed to parse poll JSON:', e);
      }
    }

    // Get uploaded file path if exists
    const mediaUrl = req.file ? `/uploads/stories/${req.file.filename}` : null;

    // Validate story data
    if (!type) {
      return res.status(400).json({ message: 'Story type is required' });
    }

    // Build content object
    const content = {};
    if (type === 'text') {
      if (!text || !text.trim()) {
        return res.status(400).json({ message: 'Text is required for text stories' });
      }
      content.text = text;
      content.backgroundColor = backgroundColor || '#6366f1';
    } else if (type === 'image') {
      if (!mediaUrl) {
        return res.status(400).json({ message: 'Image file is required for image stories' });
      }
      content.mediaUrl = mediaUrl;
    } else if (type === 'question') {
      // Q&A story type
      if (!question || !question.text) {
        return res.status(400).json({ message: 'Question text is required for Q&A stories' });
      }
    } else if (type === 'poll') {
      // Poll story type
      if (!poll || !poll.question || !poll.options || poll.options.length < 2) {
        return res.status(400).json({ message: 'Poll question and at least 2 options are required' });
      }
    }

    // Set expiration time to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Build story object
    const storyData = {
      user: userId,
      type,
      content,
      expiresAt
    };

    // Add music if provided
    if (music) {
      storyData.music = {
        trackName: music.trackName,
        artistName: music.artistName,
        previewUrl: music.previewUrl,
        albumArt: music.albumArt,
        duration: music.duration,
        startTime: music.startTime || 0
      };
    }

    // Add question if Q&A type
    if (type === 'question' && question) {
      storyData.question = {
        text: question.text,
        answers: []
      };
    }

    // Add poll if poll type
    if (type === 'poll' && poll) {
      storyData.poll = {
        question: poll.question,
        options: poll.options.map(opt => ({
          text: opt,
          votes: []
        })),
        correctAnswer: poll.correctAnswer !== undefined ? poll.correctAnswer : null
      };
    }

    // Add mentions if provided
    if (mentions && Array.isArray(mentions)) {
      storyData.mentions = mentions.map(m => ({
        user: m.userId,
        position: m.position || { x: 50, y: 50 }
      }));
    }

    // Set close friends only flag
    if (isCloseFriendsOnly) {
      storyData.isCloseFriendsOnly = true;
    }

    const story = await Story.create(storyData);

    await story.populate('user', 'name email profilePicture');
    if (storyData.mentions && storyData.mentions.length > 0) {
      await story.populate('mentions.user', 'name profilePicture');
      
      // Send notifications to mentioned users
      const Notification = (await import('../models/Notification.js')).default;
      const storyUser = await User.findById(userId);
      for (const mention of storyData.mentions) {
        await Notification.create({
          recipient: mention.user,
          sender: userId,
          type: 'mention',
          message: `${storyUser.name} mentioned you in their story`
        });
      }
    }

    res.status(201).json(story);
  } catch (error) {
    console.error('Error creating story:', error);
    console.error('Error details:', error.message);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all active stories from friends
export const getStories = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;

    // Get current user to access friends list and close friends
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get stories from friends and self that haven't expired
    const stories = await Story.find({
      user: { $in: [...currentUser.friends, userId] },
      expiresAt: { $gt: new Date() }
    })
      .populate('user', 'name email profilePicture isVerified closeFriends')
      .populate('reactions.user', 'name profilePicture')
      .populate('replies.user', 'name profilePicture')
      .populate('mentions.user', 'name profilePicture')
      .populate('question.answers.user', 'name profilePicture')
      .sort({ createdAt: -1 });

    // Filter out close friends only stories where user is not in the list
    const filteredStories = stories.filter(story => {
      // If it's the user's own story, show it
      if (story.user._id.toString() === userId) return true;
      
      // If not close friends only, show it
      if (!story.isCloseFriendsOnly) return true;
      
      // Check if current user is in story owner's close friends list
      const storyOwner = story.user;
      if (storyOwner.closeFriends && storyOwner.closeFriends.some(cf => cf.toString() === userId)) {
        return true;
      }
      
      return false;
    });

    // Group stories by user
    const groupedStories = {};
    filteredStories.forEach(story => {
      const storyUserId = story.user._id.toString();
      if (!groupedStories[storyUserId]) {
        groupedStories[storyUserId] = {
          user: story.user,
          stories: []
        };
      }
      groupedStories[storyUserId].stories.push(story);
    });

    res.json(Object.values(groupedStories));
  } catch (error) {
    console.error('Error getting stories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's own stories
export const getMyStories = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user;

    const stories = await Story.find({
      user: userId,
      expiresAt: { $gt: new Date() }
    })
      .populate('reactions.user', 'name profilePicture')
      .populate('replies.user', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error('Error getting my stories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// View a story (add to views)
export const viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.id || req.user?._id || req.user;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if story is expired
    if (story.expiresAt < new Date()) {
      return res.status(410).json({ message: 'Story has expired' });
    }

    // Add view if user hasn't viewed already
    const hasViewed = story.views.some(view => view.user.toString() === userId);
    if (!hasViewed) {
      story.views.push({ user: userId });
      await story.save();
    }

    await story.populate('user', 'name email profilePicture');

    res.json(story);
  } catch (error) {
    console.error('Error viewing story:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add reaction to story
export const addReaction = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.id || req.user?._id || req.user;

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if story is expired
    if (story.expiresAt < new Date()) {
      return res.status(410).json({ message: 'Story has expired' });
    }

    // Remove previous reaction from same user if exists
    story.reactions = story.reactions.filter(
      reaction => reaction.user.toString() !== userId
    );

    // Add new reaction
    story.reactions.push({ user: userId, emoji });
    await story.save();

    await story.populate('reactions.user', 'name profilePicture');

    // Send real-time notification to story owner
    const io = global.io;
    const userSocketMap = global.userSocketMap;
    const reactionUser = await User.findById(userId);
    
    if (io && userSocketMap && story.user.toString() !== userId) {
      const storyOwnerId = story.user.toString();
      const storyOwnerSocketId = userSocketMap.get(storyOwnerId);
      
      if (storyOwnerSocketId) {
        io.to(storyOwnerSocketId).emit('storyLike', {
          storyId: storyId,
          userId: userId,
          userName: reactionUser.name,
          userProfilePicture: reactionUser.profilePicture,
          emoji: emoji,
          message: `${reactionUser.name} reacted with ${emoji} to your story`
        });
      }
    }

    res.json(story);
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reply to story
export const replyToStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { text } = req.body;
    const userId = req.user?.id || req.user?._id || req.user;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if story is expired
    if (story.expiresAt < new Date()) {
      return res.status(410).json({ message: 'Story has expired' });
    }

    // Add reply to story
    story.replies.push({ user: userId, text });
    await story.save();

    await story.populate('replies.user', 'name profilePicture');

    // Get story owner and reply user details
    const storyOwner = story.user;
    const Notification = (await import('../models/Notification.js')).default;
    const Conversation = (await import('../models/Conversation.js')).default;
    const Message = (await import('../models/Message.js')).default;
    const replyUser = await User.findById(userId);

    // Create or get conversation between reply user and story owner
    let conversation = await Conversation.findOne({
      $or: [
        { participants: { $all: [userId, storyOwner] } },
        { participants: { $all: [storyOwner, userId] } }
      ]
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, storyOwner]
      });
    }

    // Create message in conversation for the reply
    const message = await Message.create({
      sender: userId,
      text: text,
      conversationId: conversation._id,
      messageType: 'text',
      isStoryReply: true,
      storyId: storyId
    });

    // Update conversation with latest message
    conversation.lastMessage = message._id;
    conversation.lastMessageTime = new Date();
    await conversation.save();

    // Send notification to story owner
    await Notification.create({
      recipient: storyOwner,
      sender: userId,
      type: 'story_reply',
      message: `${replyUser.name} replied to your story: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
    });

    // Send real-time socket notification
    const io = global.io;
    const userSocketMap = global.userSocketMap;
    
    if (io && userSocketMap && storyOwner.toString() !== userId) {
      const storyOwnerId = storyOwner.toString();
      const storyOwnerSocketId = userSocketMap.get(storyOwnerId);
      
      if (storyOwnerSocketId) {
        io.to(storyOwnerSocketId).emit('storyReply', {
          storyId: storyId,
          userId: userId,
          userName: replyUser.name,
          userProfilePicture: replyUser.profilePicture,
          replyText: text,
          conversationId: conversation._id,
          message: `${replyUser.name} replied to your story in your chat`
        });
        
        // Also emit new message event for chat
        io.to(storyOwnerSocketId).emit('newMessage', {
          conversationId: conversation._id,
          message: {
            _id: message._id,
            sender: { _id: userId, name: replyUser.name, profilePicture: replyUser.profilePicture },
            text: text,
            messageType: 'text',
            isStoryReply: true,
            storyId: storyId,
            createdAt: message.createdAt
          }
        });
      }
    }

    res.json(story);
  } catch (error) {
    console.error('Error replying to story:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete story
export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.id || req.user?._id || req.user;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user owns the story
    if (story.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this story' });
    }

    await Story.findByIdAndDelete(storyId);

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get story views
export const getStoryViews = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.id || req.user?._id || req.user;

    const story = await Story.findById(storyId).populate('views.user', 'name profilePicture email');
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user owns the story
    if (story.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view story analytics' });
    }

    res.json(story.views);
  } catch (error) {
    console.error('Error getting story views:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Answer a Q&A story question
export const answerQuestion = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { answer } = req.body;
    const userId = req.user?.id || req.user?._id || req.user;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: 'Answer text is required' });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.type !== 'question') {
      return res.status(400).json({ message: 'This is not a Q&A story' });
    }

    if (story.expiresAt < new Date()) {
      return res.status(410).json({ message: 'Story has expired' });
    }

    // Check if user already answered
    const hasAnswered = story.question.answers.some(a => a.user.toString() === userId.toString());
    
    if (hasAnswered) {
      return res.status(400).json({ message: 'You have already answered this question' });
    }

    // Add answer to story
    story.question.answers.push({
      user: userId,
      text: answer.trim(),
      createdAt: new Date()
    });
    await story.save();

    await story.populate('question.answers.user', 'name profilePicture');

    // Get story owner and answer user details
    const storyOwner = story.user;
    const Notification = (await import('../models/Notification.js')).default;
    const Conversation = (await import('../models/Conversation.js')).default;
    const Message = (await import('../models/Message.js')).default;
    const answerUser = await User.findById(userId);

    // Create or get conversation between answer user and story owner
    let conversation = await Conversation.findOne({
      $or: [
        { participants: { $all: [userId, storyOwner] } },
        { participants: { $all: [storyOwner, userId] } }
      ]
    }).populate('participants', '_id name email profilePicture isOnline lastSeen activityStatus');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, storyOwner]
      });
      // Populate the newly created conversation
      conversation = await Conversation.findById(conversation._id).populate('participants', '_id name email profilePicture isOnline lastSeen activityStatus');
    }

    // Create message in conversation for the answer (like a story reply)
    const message = await Message.create({
      sender: userId,
      text: answer.trim(),
      conversationId: conversation._id,
      messageType: 'text',
      isStoryReply: true,
      storyId: storyId,
      questionText: story.question.text
    });

    // Update conversation with latest message
    conversation.lastMessage = message._id;
    conversation.lastMessageTime = new Date();
    await conversation.save();

    // Send notification to story owner
    await Notification.create({
      recipient: storyOwner,
      sender: userId,
      type: 'story_answer',
      message: `${answerUser.name} answered your question: "${answer.substring(0, 50)}${answer.length > 50 ? '...' : ''}"`
    });

    // Emit socket events to story owner
    const io = global.io;
    const userSocketMap = global.userSocketMap;
    
    if (io && userSocketMap && storyOwner.toString() !== userId) {
      const storyOwnerId = storyOwner.toString();
      const storyOwnerSocketId = userSocketMap.get(storyOwnerId);
      
      if (storyOwnerSocketId) {
        // Emit story answer event
        io.to(storyOwnerSocketId).emit('storyAnswer', {
          storyId: storyId,
          userId: userId,
          userName: answerUser.name,
          userProfilePicture: answerUser.profilePicture,
          answerText: answer,
          conversationId: conversation._id,
          message: `${answerUser.name} answered your question in your chat`
        });
        
        // Also emit new message event for chat so it appears in Messages tab
        io.to(storyOwnerSocketId).emit('newMessage', {
          conversationId: conversation._id,
          message: {
            _id: message._id,
            sender: { _id: userId, name: answerUser.name, profilePicture: answerUser.profilePicture },
            text: answer,
            messageType: 'text',
            isStoryReply: true,
            storyId: storyId,
            questionText: story.question.text,
            createdAt: message.createdAt
          }
        });
      }
    }

    res.json(story);
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Vote on a poll story
export const votePoll = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user?.id || req.user?._id || req.user;

    if (optionIndex === undefined || optionIndex === null) {
      return res.status(400).json({ message: 'Option index is required' });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.type !== 'poll') {
      return res.status(400).json({ message: 'This is not a poll story' });
    }

    if (story.expiresAt < new Date()) {
      return res.status(410).json({ message: 'Story has expired' });
    }

    if (optionIndex < 0 || optionIndex >= story.poll.options.length) {
      return res.status(400).json({ message: 'Invalid option index' });
    }

    // Check if user already voted and remove previous vote
    story.poll.options.forEach(option => {
      option.votes = option.votes.filter(vote => vote.toString() !== userId);
    });

    // Add vote to selected option
    story.poll.options[optionIndex].votes.push(userId);
    await story.save();

    // Populate for response
    await story.populate('user', 'name profilePicture');

    res.json(story);
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get question answers (for story owner)
export const getQuestionAnswers = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user?.id || req.user?._id || req.user;

    const story = await Story.findById(storyId)
      .populate('question.answers.user', 'name profilePicture email');
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (story.type !== 'question') {
      return res.status(400).json({ message: 'This is not a Q&A story' });
    }

    // Only story owner can see all answers
    if (story.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view answers' });
    }

    res.json(story.question.answers);
  } catch (error) {
    console.error('Error getting question answers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
