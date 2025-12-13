import axios from 'axios';
import { getToken } from './utils/auth';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Add token to requests
API.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (token expired)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch custom event for React Router navigation (prevents full reload)
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const registerUser = async (userData) => {
  return await API.post('/auth/register', userData);
};

export const loginUser = async (credentials) => {
  return await API.post('/auth/login', credentials);
};

export const forgotPassword = async (email) => {
  return await API.post('/auth/forgot-password', { email });
};

export const verifyOTP = async (email, otp) => {
  return await API.post('/auth/verify-otp', { email, otp });
};

export const resetPassword = async (email, otp, newPassword) => {
  return await API.post('/auth/reset-password', { email, otp, newPassword });
};

// User API functions
export const getUserProfile = async (userId) => {
  const response = await API.get(`/users/profile/${userId}`);
  return response.data;
};

export const updateUserProfile = async (userId, updates) => {
  return await API.put(`/users/profile`, updates);
};

export const updateActivityStatus = async (status) => {
  return await API.put('/users/activity-status', { status });
};

export const getSuggestedUsers = async () => {
  try {
    const response = await API.get('/users/suggestions');
    return response.data;
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
};

export const searchUsers = async (query) => {
  return await API.get(`/users/search?query=${query}`);
};

export const uploadProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  return await API.post('/users/upload-profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Friend API functions
export const sendFriendRequest = async (userId) => {
  return await API.post(`/friends/request/${userId}`);
};

export const acceptFriendRequest = async (userId) => {
  return await API.put(`/friends/accept/${userId}`);
};

export const rejectFriendRequest = async (userId) => {
  return await API.put(`/friends/reject/${userId}`);
};

export const getFriendRequests = async () => {
  try {
    const response = await API.get('/friends/requests');
    return response.data;
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return [];
  }
};

export const getFriends = async () => {
  try {
    const response = await API.get('/friends');
    return response.data;
  } catch (error) {
    console.error('Error fetching friends:', error);
    return [];
  }
};

export const removeFriend = async (userId) => {
  return await API.delete(`/friends/remove/${userId}`);
};

export const getFriendshipStatus = async (userId) => {
  try {
    const response = await API.get(`/friends/status/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching friendship status:', error);
    return { status: 'none' };
  }
};

export const getPendingRequests = async () => {
  try {
    const response = await API.get('/friends/pending');
    return response.data;
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return [];
  }
};

// Message API functions
export const getConversations = async () => {
  return await API.get('/messages/conversations');
};

export const getOrCreateConversation = async (participantId) => {
  return await API.get(`/messages/conversation/${participantId}`);
};

export const getConversationMessages = async (conversationId) => {
  return await API.get(`/messages/${conversationId}/messages`);
};

export const sendMessage = async (conversationId, text) => {
  return await API.post(`/messages/${conversationId}/send`, { text });
};

export const sendImageMessage = async (conversationId, formData) => {
  return await API.post(`/messages/${conversationId}/send-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const markMessagesAsSeen = async (conversationId) => {
  return await API.put(`/messages/${conversationId}/seen`);
};

export const deleteConversation = async (conversationId) => {
  return await API.delete(`/messages/${conversationId}`);
};

export const deleteMessage = async (messageId) => {
  return await API.delete(`/messages/message/${messageId}`);
};

export const editMessage = async (messageId, text) => {
  return await API.put(`/messages/message/${messageId}`, { text });
};

export const addReaction = async (messageId, emoji) => {
  return await API.post(`/messages/message/${messageId}/reaction`, { emoji });
};

export const removeReaction = async (messageId) => {
  return await API.delete(`/messages/message/${messageId}/reaction`);
};

export const sendVoiceMessage = async (conversationId, audioBlob) => {
  const formData = new FormData();
  // Use the blob's MIME type or default to webm
  const mimeType = audioBlob.type || 'audio/webm';
  const fileExtension = mimeType.includes('webm') ? 'webm' : 
                        mimeType.includes('wav') ? 'wav' : 
                        mimeType.includes('ogg') ? 'ogg' : 'webm';
  formData.append('audio', audioBlob, `voice-message.${fileExtension}`);
  return await API.post(`/messages/${conversationId}/send-voice`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const sendVideoMessage = async (conversationId, formData) => {
  return await API.post(`/messages/${conversationId}/send-video`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const sendDocument = async (conversationId, file) => {
  const formData = new FormData();
  formData.append('document', file);
  return await API.post(`/messages/${conversationId}/send-document`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const forwardMessage = async (messageId, conversationIds) => {
  return await API.post(`/messages/message/${messageId}/forward`, { conversationIds });
};

export const getUnreadMessagesCount = async () => {
  return await API.get('/messages/unread/count');
};

// Post API functions
export const getAllPosts = async () => {
  try {
    const response = await API.get('/posts');
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

export const getUserPosts = async (userId) => {
  try {
    const response = await API.get(`/posts/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
};

export const createPost = async (postData) => {
  return await API.post('/posts', postData);
};

export const likePost = async (postId) => {
  return await API.put(`/posts/${postId}/like`);
};

export const getPostLikes = async (postId) => {
  return await API.get(`/posts/${postId}/likes`);
};

export const getPostById = async (postId) => {
  return await API.get(`/posts/${postId}`);
};

export const deletePost = async (postId) => {
  return await API.delete(`/posts/${postId}`);
};

export const updatePost = async (postId, updates) => {
  try {
    const response = await API.put(`/posts/${postId}`, updates);
    return response;
  } catch (error) {
    console.error('Update post error:', error.response?.data || error.message);
    throw error;
  }
};

export const addComment = async (postId, text) => {
  return await API.post(`/posts/${postId}/comment`, { text });
};

export const getComments = async (postId) => {
  return await API.get(`/posts/${postId}/comments`);
};

export const likeComment = async (postId, commentId) => {
  return await API.put(`/posts/${postId}/comment/${commentId}/like`);
};

export const replyToComment = async (postId, commentId, text) => {
  return await API.post(`/posts/${postId}/comment/${commentId}/reply`, { text });
};

export const deleteComment = async (postId, commentId) => {
  return await API.delete(`/posts/${postId}/comment/${commentId}`);
};

// Save/Bookmark posts
export const savePost = async (postId) => {
  try {
    const response = await API.put(`/posts/${postId}/save`);
    return response;
  } catch (error) {
    console.error('Save post error:', error.response?.data || error.message);
    throw error;
  }
};

export const getLikedPosts = async () => {
  try {
    const response = await API.get('/posts/liked/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching liked posts:', error);
    return [];
  }
};

export const getSavedPosts = async () => {
  try {
    const response = await API.get('/posts/saved/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    return [];
  }
};

// Share post to story
export const sharePostToStory = async (postId) => {
  return await API.post(`/posts/${postId}/share-to-story`);
};

// Get posts by hashtag
export const getPostsByHashtag = async (hashtag) => {
  try {
    const response = await API.get(`/posts/hashtag/${hashtag}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts by hashtag:', error);
    return [];
  }
};

// Story API functions
export const createStory = async (storyData) => {
  const config = {};
  
  // If it's FormData, let browser set Content-Type with boundary
  if (storyData instanceof FormData) {
    config.headers = {
      'Content-Type': 'multipart/form-data'
    };
  }
  
  return await API.post('/stories', storyData, config);
};

export const getStories = async () => {
  return await API.get('/stories');
};

export const getMyStories = async () => {
  return await API.get('/stories/my');
};

export const viewStory = async (storyId) => {
  return await API.put(`/stories/${storyId}/view`);
};

export const addStoryReaction = async (storyId, emoji) => {
  return await API.post(`/stories/${storyId}/reaction`, { emoji });
};

export const replyToStory = async (storyId, text) => {
  return await API.post(`/stories/${storyId}/reply`, { text });
};

export const deleteStory = async (storyId) => {
  return await API.delete(`/stories/${storyId}`);
};

export const getStoryViews = async (storyId) => {
  return await API.get(`/stories/${storyId}/views`);
};

export const votePoll = async (storyId, optionIndex) => {
  return await API.post(`/stories/${storyId}/vote`, { optionIndex });
};

export const answerQuestion = async (storyId, answer) => {
  return await API.post(`/stories/${storyId}/answer`, { answer });
};

// Notification API functions
export const getNotifications = async () => {
  return await API.get('/notifications');
};

export const getUnreadNotificationsCount = async () => {
  return await API.get('/notifications/unread/count');
};

export const markAsRead = async (notificationId) => {
  return await API.put(`/notifications/${notificationId}/read`);
};

export const markAllAsRead = async () => {
  return await API.put('/notifications/read-all');
};

export const deleteNotification = async (notificationId) => {
  return await API.delete(`/notifications/${notificationId}`);
};

// =====================
// Group API functions
// =====================

export const createGroup = async (name, description, memberIds) => {
  return await API.post('/groups', { name, description, memberIds });
};

export const getGroups = async () => {
  return await API.get('/groups');
};

export const getGroup = async (groupId) => {
  return await API.get(`/groups/${groupId}`);
};

export const updateGroup = async (groupId, data) => {
  return await API.put(`/groups/${groupId}`, data);
};

export const deleteGroup = async (groupId) => {
  return await API.delete(`/groups/${groupId}`);
};

export const updateGroupAvatar = async (groupId, file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return await API.post(`/groups/${groupId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateGroupSettings = async (groupId, settings) => {
  return await API.put(`/groups/${groupId}/settings`, { settings });
};

export const getGroupMessages = async (groupId) => {
  return await API.get(`/groups/${groupId}/messages`);
};

export const sendGroupMessage = async (groupId, text) => {
  return await API.post(`/groups/${groupId}/messages`, { text });
};

export const addGroupMembers = async (groupId, memberIds) => {
  return await API.post(`/groups/${groupId}/members`, { memberIds });
};

export const removeGroupMember = async (groupId, memberId) => {
  return await API.delete(`/groups/${groupId}/members/${memberId}`);
};

export const leaveGroup = async (groupId) => {
  return await API.post(`/groups/${groupId}/leave`);
};

export const makeGroupAdmin = async (groupId, memberId) => {
  return await API.post(`/groups/${groupId}/admins/${memberId}`);
};

export const removeGroupAdmin = async (groupId, memberId) => {
  return await API.delete(`/groups/${groupId}/admins/${memberId}`);
};

// Block/Unblock API functions
export const blockUser = async (userId) => {
  return await API.post(`/block/${userId}`);
};

export const unblockUser = async (userId) => {
  return await API.delete(`/block/${userId}`);
};

export const getBlockedUsers = async () => {
  return await API.get('/block/blocked');
};

export const isUserBlocked = async (userId) => {
  return await API.get(`/block/blocked/${userId}`);
};

// Settings API functions
export const getSettings = async () => {
  const response = await API.get('/settings');
  return response.data;
};

export const updatePrivacySettings = async (settings) => {
  const response = await API.put('/settings/privacy', settings);
  return response.data;
};

export const updateNotificationSettings = async (settings) => {
  const response = await API.put('/settings/notifications', settings);
  return response.data;
};

export const setup2FA = async () => {
  const response = await API.post('/settings/2fa/setup');
  return response.data;
};

export const verify2FA = async (token) => {
  const response = await API.post('/settings/2fa/verify', { token });
  return response.data;
};

export const disable2FA = async (password, token) => {
  const response = await API.post('/settings/2fa/disable', { password, token });
  return response.data;
};

export const validate2FALogin = async (email, token) => {
  const response = await API.post('/settings/2fa/validate', { email, token });
  return response.data;
};

export const getBackupCodes = async (password) => {
  const response = await API.post('/settings/2fa/backup-codes', { password });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await API.put('/settings/password', { currentPassword, newPassword });
  return response.data;
};

export const deleteAccount = async (password, confirmation) => {
  const response = await API.delete('/settings/account', { data: { password, confirmation } });
  return response.data;
};

export default API;
