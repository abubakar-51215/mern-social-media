import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import EnhancedChatBubble from '../components/EnhancedChatBubble';
import VoiceRecorder from '../components/VoiceRecorder';
import ForwardModal from '../components/ForwardModal';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupInfoModal from '../components/GroupInfoModal';
import UserProfileModal from '../components/UserProfileModal';
import { getConversations, getConversationMessages, sendMessage, getOrCreateConversation, sendVoiceMessage, sendVideoMessage, sendDocument, forwardMessage, getGroups, getGroupMessages, sendGroupMessage, getFriends } from '../api';
import './Messages.css';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatType, setChatType] = useState('direct'); // 'direct' or 'group'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [activeReactionId, setActiveReactionId] = useState(null); // Track which message has reaction picker open
  const [isTyping, setIsTyping] = useState(false); // Typing indicator state
  const [typingUser, setTypingUser] = useState(null); // Who is typing
  const [onlineUsers, setOnlineUsers] = useState({}); // Track online status { online, lastSeen, status }
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'direct', 'groups'
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');
  const emojiPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const history = useHistory();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const emojiCategories = {
    'Smileys & people': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
    'Animals & nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌼', '🌵', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀'],
    'Food & drink': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆'],
    'Activity': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🏽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚴', '🚵', '🎪'],
    'Travel & places': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁'],
    'Objects': ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶'],
    'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳'],
    'Flags': ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏴‍☠️', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇲', '🇧🇹', '🇧🇴', '🇧🇦', '🇧🇼', '🇧🇷', '🇮🇴', '🇻🇬', '🇧🇳', '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇦', '🇮🇨', '🇨🇻', '🇧🇶']
  };
  const [selectedCategory, setSelectedCategory] = useState('Smileys & people');
  const [emojiSearch, setEmojiSearch] = useState('');

  // Socket.io setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io('http://localhost:5000', {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('receiveMessage', (data) => {
      // data contains { conversationId, message }
      const message = data.message || data;
      setMessages(prev => [...prev, message]);
      loadConversations();
      scrollToBottom();
    });

    socketRef.current.on('reactionAdded', ({ messageId, reaction }) => {
      if (!reaction) return;
      const { emoji, user } = reaction;
      
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          const userId = user?._id || user;
          const existingReaction = msg.reactions?.find(r => {
            const rUserId = r.user?._id || r.user;
            return rUserId === userId;
          });
          
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.map(r => {
                const rUserId = r.user?._id || r.user;
                return rUserId === userId ? { ...r, emoji } : r;
              })
            };
          } else {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), { emoji, user }]
            };
          }
        }
        return msg;
      }));
    });

    socketRef.current.on('reactionRemoved', ({ messageId, userId }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          return {
            ...msg,
            reactions: (msg.reactions || []).filter(r => {
              const rUserId = r.user?._id || r.user;
              return rUserId !== userId;
            })
          };
        }
        return msg;
      }));
    });

    socketRef.current.on('messageDeleted', ({ messageId }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          return { ...msg, isDeleted: true, text: 'This message was deleted', image: null, video: null, audio: null, file: null, fileName: null, fileSize: null };
        }
        return msg;
      }));
    });

    socketRef.current.on('messageEdited', ({ messageId, text, editedAt }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId) {
          return { ...msg, text, isEdited: true, editedAt };
        }
        return msg;
      }));
    });

    // Group chat socket listeners
    socketRef.current.on('groupMessage', ({ groupId, message }) => {
      if (selectedChat?._id === groupId && chatType === 'group') {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      loadGroups();
    });

    socketRef.current.on('groupCreated', (group) => {
      setGroups(prev => [group, ...prev]);
    });

    socketRef.current.on('groupUpdated', (group) => {
      setGroups(prev => prev.map(g => g._id === group._id ? group : g));
      if (selectedChat?._id === group._id) {
        setSelectedChat(group);
      }
    });

    socketRef.current.on('groupMembersAdded', ({ groupId, newMembers }) => {
      setGroups(prev => prev.map(g => {
        if (g._id === groupId) {
          return { ...g, members: [...g.members, ...newMembers] };
        }
        return g;
      }));
    });

    socketRef.current.on('groupMemberRemoved', ({ groupId, memberId }) => {
      setGroups(prev => prev.map(g => {
        if (g._id === groupId) {
          return { ...g, members: g.members.filter(m => (m.user._id || m.user) !== memberId) };
        }
        return g;
      }));
    });

    socketRef.current.on('removedFromGroup', ({ groupId }) => {
      setGroups(prev => prev.filter(g => g._id !== groupId));
      if (selectedChat?._id === groupId) {
        setSelectedChat(null);
        setMessages([]);
      }
    });

    socketRef.current.on('groupDeleted', ({ groupId }) => {
      setGroups(prev => prev.filter(g => g._id !== groupId));
      if (selectedChat?._id === groupId) {
        setSelectedChat(null);
        setMessages([]);
      }
    });

    socketRef.current.on('userTyping', ({ conversationId, userId, userName }) => {
      if (selectedChat?._id === conversationId && userId !== currentUser._id) {
        setIsTyping(true);
        setTypingUser({ _id: userId, name: userName });
      }
    });

    socketRef.current.on('userStoppedTyping', ({ conversationId, userId }) => {
      if (selectedChat?._id === conversationId && userId !== currentUser._id) {
        setIsTyping(false);
        setTypingUser(null);
      }
    });

    // Online/Offline status listeners
    socketRef.current.on('userOnline', ({ userId, lastSeen }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: { isOnline: true, lastSeen, status: 'online' }
      }));
    });

    socketRef.current.on('userOffline', ({ userId, lastSeen }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: { isOnline: false, lastSeen, status: 'offline' }
      }));
    });

    socketRef.current.on('activityStatusChanged', ({ userId, status }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: { ...prev[userId], status, lastSeen: new Date() }
      }));
    });

    socketRef.current.on('messagesSeen', ({ conversationId }) => {
      if (selectedChat?._id === conversationId) {
        setMessages(prev => prev.map(msg => ({ ...msg, read: true, seenAt: new Date() })));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat]);

  // Auto-detect away status based on user inactivity
  useEffect(() => {
    let awayTimeout;
    let isAway = false;
    
    const setUserOnline = () => {
      if (isAway && socketRef.current) {
        socketRef.current.emit('updateActivityStatus', { 
          userId: currentUser._id, 
          status: 'online' 
        });
        isAway = false;
      }
      
      // Reset the timeout
      clearTimeout(awayTimeout);
      awayTimeout = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('updateActivityStatus', { 
            userId: currentUser._id, 
            status: 'away' 
          });
          isAway = true;
        }
      }, 5 * 60 * 1000); // 5 minutes
    };
    
    // Events that indicate user activity
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, setUserOnline));
    
    // Set initial online status
    setUserOnline();
    
    return () => {
      clearTimeout(awayTimeout);
      events.forEach(event => window.removeEventListener(event, setUserOnline));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser._id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getFilteredEmojis = () => {
    if (emojiSearch) {
      return Object.values(emojiCategories).flat().filter(emoji => emoji.includes(emojiSearch));
    }
    return emojiCategories[selectedCategory];
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage(newMessage + emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    loadConversations();
    loadGroups();
    loadFriends();
    
    // Check if coming with a friendId (from Connections page or UserProfileModal)
    if (location.state?.friendId) {
      openConversationWithFriend(location.state.friendId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore last selected chat when conversations/groups are loaded
  useEffect(() => {
    if (selectedChat || location.state?.friendId) return; // Don't restore if already selected
    
    const lastChat = localStorage.getItem('lastSelectedChat');
    if (!lastChat) return;
    
    if (conversations.length === 0 && groups.length === 0) return; // Wait for data to load
    
    try {
      const { chatId, type } = JSON.parse(lastChat);
      
      if (type === 'direct' && conversations.length > 0) {
        const conv = conversations.find(c => c._id === chatId);
        if (conv) {
          handleSelectChat(conv, 'direct');
        }
      } else if (type === 'group' && groups.length > 0) {
        const grp = groups.find(g => g._id === chatId);
        if (grp) {
          handleSelectChat(grp, 'group');
        }
      }
    } catch (error) {
      console.error('Error restoring last chat:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, groups]);

  const loadConversations = async () => {
    try {
      const response = await getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await getGroups();
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await getFriends();
      setFriends(response || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
    }
  };

  const openConversationWithFriend = async (friendId) => {
    try {
      const response = await getOrCreateConversation(friendId);
      const conversation = response.data;
      
      // Add to conversations if not already there
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });
      
      // Select the conversation
      handleSelectChat(conversation);
    } catch (error) {
      console.error('Error opening conversation:', error);
      alert(error.response?.data?.message || 'Failed to open conversation. Make sure you are friends with this user.');
    }
  };

  const handleSelectChat = async (chat, type = 'direct') => {
    setSelectedChat(chat);
    setChatType(type);
    setIsTyping(false);
    setTypingUser(null);
    
    // Save selected chat to localStorage
    localStorage.setItem('lastSelectedChat', JSON.stringify({ chatId: chat._id, type }));
    
    if (type === 'direct') {
      // Clear unread count for this conversation locally
      setConversations(prev => prev.map(conv => 
        conv._id === chat._id ? { ...conv, unreadCount: 0 } : conv
      ));
      
      try {
        const response = await getConversationMessages(chat._id);
        setMessages(response.data || []);
        
        // Emit messagesSeen to notify sender that messages are read
        if (socketRef.current && chat.participant?._id) {
          socketRef.current.emit('messagesSeen', {
            conversationId: chat._id,
            receiverId: chat.participant._id
          });
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    } else if (type === 'group') {
      try {
        const response = await getGroupMessages(chat._id);
        setMessages(response.data || []);
      } catch (error) {
        console.error('Error loading group messages:', error);
        setMessages([]);
      }
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!selectedChat || !socketRef.current) return;

    // Emit typing event
    socketRef.current.emit('typing', {
      conversationId: selectedChat._id,
      userId: currentUser._id,
      userName: currentUser.name
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && selectedChat) {
        socketRef.current.emit('stopTyping', {
          conversationId: selectedChat._id,
          userId: currentUser._id
        });
      }
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    // Stop typing indicator
    if (socketRef.current && selectedChat) {
      socketRef.current.emit('stopTyping', {
        conversationId: selectedChat._id,
        userId: currentUser._id
      });
    }

    try {
      let response;
      if (chatType === 'group') {
        response = await sendGroupMessage(selectedChat._id, newMessage);
      } else {
        response = await sendMessage(selectedChat._id, newMessage);
      }
      const sentMessage = response.data;
      
      setMessages([...messages, sentMessage]);
      setNewMessage('');
      
      // Update conversation/group list with new last message
      if (chatType === 'group') {
        loadGroups();
      } else {
        loadConversations();
      }
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.message || 'Failed to send message.');
    }
  };

  const handleSendVoice = async (audioBlob) => {
    if (!selectedChat) return;
    
    try {
      const response = await sendVoiceMessage(selectedChat._id, audioBlob);
      const sentMessage = response.data;
      
      setMessages([...messages, sentMessage]);
      setShowVoiceRecorder(false);
      loadConversations();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending voice message:', error);
      alert('Failed to send voice message');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat) return;

    const fileType = file.type.split('/')[0];
    if (fileType !== 'image' && fileType !== 'video') {
      alert('Please select an image or video file');
      return;
    }

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('media', file);

      const response = await sendVideoMessage(selectedChat._id, formData);
      const sentMessage = response.data;
      
      setMessages([...messages, sentMessage]);
      loadConversations();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending media:', error);
      alert('Failed to send media');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDocumentSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat) return;

    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 25MB limit');
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-rar-compressed',
      'application/vnd.rar'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, ZIP, RAR');
      return;
    }

    setUploadingMedia(true);
    try {
      const response = await sendDocument(selectedChat._id, file);
      const sentMessage = response.data;
      
      setMessages([...messages, sentMessage]);
      loadConversations();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending document:', error);
      alert('Failed to send document');
    } finally {
      setUploadingMedia(false);
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
    }
  };

  const handleForwardMessage = async (conversationIds) => {
    if (!forwardingMessage) return;

    try {
      await forwardMessage(forwardingMessage._id, conversationIds);
      alert(`Message forwarded to ${conversationIds.length} conversation(s)`);
      setForwardingMessage(null);
    } catch (error) {
      console.error('Error forwarding message:', error);
      alert('Failed to forward message');
    }
  };

  const handleDeleteMessage = (messageId) => {
    setMessages(prev => prev.map(msg => {
      if (msg._id === messageId) {
        return { ...msg, isDeleted: true, text: 'This message was deleted', image: null, video: null, audio: null, file: null, fileName: null, fileSize: null };
      }
      return msg;
    }));
  };

  const handleEditMessage = (messageId, newText) => {
    setMessages(prev => prev.map(msg => {
      if (msg._id === messageId) {
        return { ...msg, text: newText, isEdited: true, editedAt: new Date() };
      }
      return msg;
    }));
  };

  // Handle reaction updates (optimistic UI update)
  const handleReactionUpdate = (messageId, emoji, user, action) => {
    setMessages(prev => prev.map(msg => {
      if (msg._id === messageId) {
        const userId = user?._id || user?.id;
        
        if (action === 'remove') {
          // Remove the user's reaction
          return {
            ...msg,
            reactions: (msg.reactions || []).filter(r => {
              const rUserId = r.user?._id || r.user;
              return rUserId !== userId;
            })
          };
        } else if (action === 'add') {
          // Check if user already has a reaction
          const existingReaction = (msg.reactions || []).find(r => {
            const rUserId = r.user?._id || r.user;
            return rUserId === userId;
          });
          
          if (existingReaction) {
            // Update existing reaction
            return {
              ...msg,
              reactions: msg.reactions.map(r => {
                const rUserId = r.user?._id || r.user;
                return rUserId === userId ? { ...r, emoji } : r;
              })
            };
          } else {
            // Add new reaction
            return {
              ...msg,
              reactions: [...(msg.reactions || []), { emoji, user }]
            };
          }
        }
      }
      return msg;
    }));
  };

  // Handle group creation
  const handleGroupCreated = (group) => {
    setGroups(prev => [group, ...prev]);
    setShowCreateGroupModal(false);
    handleSelectChat(group, 'group');
  };

  // Handle group updates from GroupInfoModal
  const handleGroupUpdated = (updatedGroup) => {
    setGroups(prev => prev.map(g => g._id === updatedGroup._id ? updatedGroup : g));
    if (selectedChat?._id === updatedGroup._id) {
      setSelectedChat(updatedGroup);
    }
  };

  const handleGroupLeft = (groupId) => {
    setGroups(prev => prev.filter(g => g._id !== groupId));
    if (selectedChat?._id === groupId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  const handleGroupDeleted = (groupId) => {
    setGroups(prev => prev.filter(g => g._id !== groupId));
    if (selectedChat?._id === groupId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combined and sorted list for "All" tab
  const getCombinedChats = () => {
    const directChats = filteredConversations.map(conv => ({
      ...conv,
      type: 'direct',
      sortTime: new Date(conv.lastMessageTime || conv.updatedAt || 0).getTime()
    }));
    
    const groupChats = filteredGroups.map(group => ({
      ...group,
      type: 'group',
      sortTime: new Date(group.lastMessageTime || group.updatedAt || 0).getTime()
    }));
    
    return [...directChats, ...groupChats].sort((a, b) => b.sortTime - a.sortTime);
  };

  const formatTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return past.toLocaleDateString();
  };

  // Format last seen timestamp
  const formatLastSeen = (date) => {
    if (!date) return '';
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);
    
    if (seconds < 60) return 'last seen just now';
    if (seconds < 3600) return `last seen ${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `last seen ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (seconds < 172800) return 'last seen yesterday';
    return `last seen ${past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // Get user presence status
  const getUserPresence = (userId) => {
    const userStatus = onlineUsers[userId];
    if (userStatus?.isOnline) {
      return { status: userStatus.status || 'online', isOnline: true };
    }
    // Check from conversation participant data as fallback
    const conv = conversations.find(c => c.participant?._id === userId);
    if (conv?.participant) {
      return {
        status: conv.participant.activityStatus || 'offline',
        isOnline: conv.participant.isOnline || false,
        lastSeen: conv.participant.lastSeen
      };
    }
    return { status: 'offline', isOnline: false };
  };

  // Format date for separators (like WhatsApp)
  const formatDateSeparator = (date) => {
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time for comparison
    const msgDateOnly = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    
    if (msgDateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (msgDateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      // Check if same week
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (msgDate > weekAgo) {
        return msgDate.toLocaleDateString('en-US', { weekday: 'long' });
      }
      return msgDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  // Group messages by date
  const getMessagesWithDateSeparators = () => {
    const result = [];
    let lastDate = null;
    
    messages.forEach((msg, index) => {
      const msgDate = new Date(msg.createdAt);
      const msgDateStr = msgDate.toDateString();
      
      if (msgDateStr !== lastDate) {
        result.push({ type: 'date-separator', date: msg.createdAt, id: `date-${index}` });
        lastDate = msgDateStr;
      }
      result.push({ type: 'message', data: msg });
    });
    
    return result;
  };

  // Render conversation item
  const renderConversationItem = (item) => {
    if (item.type === 'group') {
      return (
        <div
          key={item._id}
          className={`conversation-item ${selectedChat?._id === item._id && chatType === 'group' ? 'active' : ''}`}
          onClick={() => handleSelectChat(item, 'group')}
        >
          <div className="conv-avatar group-avatar">
            {item.avatar ? (
              <img src={`http://localhost:5000${item.avatar}`} alt={item.name} />
            ) : (
              <span className="group-icon">👥</span>
            )}
          </div>
          <div className="conv-info">
            <div className="conv-header">
              <span className="conv-name">{item.name}</span>
              <span className="conv-time">{formatTime(item.lastMessageTime || item.updatedAt)}</span>
            </div>
            <div className="conv-preview">
              <span className="last-message">{item.lastMessage || `${item.members?.length || 0} members`}</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Direct conversation
    return (
      <div
        key={item._id}
        className={`conversation-item ${selectedChat?._id === item._id && chatType === 'direct' ? 'active' : ''} ${item.unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => handleSelectChat(item, 'direct')}
      >
        <div className="conv-avatar">
          {item.participant?.profilePicture ? (
            <img src={item.participant.profilePicture} alt={item.participant.name} />
          ) : (
            item.participant?.name?.charAt(0).toUpperCase()
          )}
          {(() => {
            const presence = getUserPresence(item.participant?._id);
            if (presence.isOnline) {
              return <span className={`online-indicator ${presence.status}`}></span>;
            }
            return null;
          })()}
        </div>
        <div className="conv-info">
          <div className="conv-header">
            <span className={`conv-name ${item.unreadCount > 0 ? 'unread' : ''}`}>{item.participant?.name}</span>
            <span className="conv-time">{formatTime(item.lastMessageTime)}</span>
          </div>
          <div className="conv-preview">
            <span className={`last-message ${item.unreadCount > 0 ? 'unread' : ''}`}>
              {item.lastMessage || 'No messages yet'}
            </span>
            {item.unreadCount > 0 && (
              <span className="unread-badge">{item.unreadCount > 99 ? '99+' : item.unreadCount}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Sidebar />
      <div className="messages-page">
      <div className="messages-sidebar">
        <div className="messages-header">
          <h2>Messages</h2>
          {!selectedChat && (
            <div className="header-actions">
              <button className="new-group-btn" onClick={() => setShowCreateGroupModal(true)} title="Create Group">👥+</button>
              <button className="new-message-btn" onClick={() => history.push('/connections')}>✏️</button>
            </div>
          )}
        </div>
        <div className="search-messages">
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="chat-tabs">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={`tab-btn ${activeTab === 'direct' ? 'active' : ''}`}
            onClick={() => setActiveTab('direct')}
          >
            Direct
          </button>
          <button 
            className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            Groups ({groups.length})
          </button>
        </div>
        <div className="conversations-list">
          {activeTab === 'all' && (
            getCombinedChats().length === 0 ? (
              <div className="empty-state">
                <p>No conversations yet</p>
                <button onClick={() => history.push('/connections')}>Start a conversation</button>
              </div>
            ) : (
              getCombinedChats().map(item => renderConversationItem(item))
            )
          )}
          {activeTab === 'direct' && (
            filteredConversations.length === 0 ? (
              <div className="empty-state">
                <p>No direct messages</p>
                <button onClick={() => history.push('/connections')}>Start a conversation</button>
              </div>
            ) : (
              filteredConversations.map(conv => renderConversationItem({ ...conv, type: 'direct' }))
            )
          )}
          {activeTab === 'groups' && (
            filteredGroups.length === 0 ? (
              <div className="empty-state">
                <p>No groups yet</p>
                <button onClick={() => setShowCreateGroupModal(true)}>Create a group</button>
              </div>
            ) : (
              filteredGroups.map(group => renderConversationItem({ ...group, type: 'group' }))
            )
          )}
        </div>
      </div>

      <div className="chat-area">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                {chatType === 'group' ? (
                  <>
                    <div className="chat-avatar group-chat-avatar">
                      {selectedChat.avatar ? (
                        <img src={`http://localhost:5000${selectedChat.avatar}`} alt={selectedChat.name} />
                      ) : (
                        <span className="group-icon">👥</span>
                      )}
                    </div>
                    <div className="chat-user-details">
                      <h3>{selectedChat.name}</h3>
                      <span className="chat-status group-members">
                        {selectedChat.members?.length} members
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div 
                      className="chat-avatar clickable"
                      onClick={() => {
                        const participantId = selectedChat.participant?._id;
                        if (participantId && /^[0-9a-fA-F]{24}$/.test(participantId)) {
                          setSelectedProfileUserId(participantId);
                          setShowUserProfileModal(true);
                        }
                      }}
                    >
                      {selectedChat.participant?.profilePicture ? (
                        <img src={selectedChat.participant.profilePicture} alt={selectedChat.participant.name} />
                      ) : (
                        selectedChat.participant?.name?.charAt(0).toUpperCase()
                      )}
                      {(() => {
                        const presence = getUserPresence(selectedChat.participant?._id);
                        return (
                          <span className={`avatar-status-indicator ${presence.status}`}></span>
                        );
                      })()}
                    </div>
                    <div 
                      className="chat-user-details clickable"
                      onClick={() => {
                        const participantId = selectedChat.participant?._id;
                        if (participantId && /^[0-9a-fA-F]{24}$/.test(participantId)) {
                          setSelectedProfileUserId(participantId);
                          setShowUserProfileModal(true);
                        }
                      }}
                    >
                      <h3>{selectedChat.participant?.name}</h3>
                      {(() => {
                        const presence = getUserPresence(selectedChat.participant?._id);
                        if (isTyping && typingUser) {
                          return <span className="chat-status typing">typing...</span>;
                        }
                        if (presence.isOnline) {
                          return <span className={`chat-status ${presence.status}`}>
                            {presence.status === 'away' ? '🌙 Away' : 
                             presence.status === 'busy' ? '🔴 Busy' : 'Online'}
                          </span>;
                        }
                        const lastSeen = onlineUsers[selectedChat.participant?._id]?.lastSeen || 
                                        selectedChat.participant?.lastSeen;
                        return <span className="chat-status offline">{formatLastSeen(lastSeen)}</span>;
                      })()}
                    </div>
                  </>
                )}
              </div>
              <div className="chat-actions">
                <div className="encryption-indicator" title="Messages are encrypted">
                  🔒 <span>Encrypted</span>
                </div>
                <button className="icon-btn" onClick={() => { setComingSoonFeature('Voice Call'); setShowComingSoonModal(true); }} title="Voice Call - Coming Soon">📞</button>
                <button className="icon-btn" onClick={() => { setComingSoonFeature('Video Call'); setShowComingSoonModal(true); }} title="Video Call - Coming Soon">🎥</button>
                {chatType === 'group' && (
                  <button className="icon-btn" onClick={() => setShowGroupInfoModal(true)} title="Group Info">ℹ️</button>
                )}
              </div>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                getMessagesWithDateSeparators().map((item) => {
                  if (item.type === 'date-separator') {
                    return (
                      <div key={item.id} className="date-separator">
                        <span className="date-separator-text">{formatDateSeparator(item.date)}</span>
                      </div>
                    );
                  }
                  const msg = item.data;
                  return (
                    <EnhancedChatBubble
                      key={msg._id}
                      message={msg}
                      isCurrentUser={msg.sender._id === currentUser._id}
                      currentUser={currentUser}
                      onDelete={handleDeleteMessage}
                      onEdit={handleEditMessage}
                      onForward={() => setForwardingMessage(msg)}
                      activeReactionId={activeReactionId}
                      setActiveReactionId={setActiveReactionId}
                      isGroupChat={chatType === 'group'}
                      showSenderName={chatType === 'group' && msg.sender._id !== currentUser._id}
                      onReactionUpdate={handleReactionUpdate}
                      onViewProfile={(userId) => {
                        if (userId && /^[0-9a-fA-F]{24}$/.test(userId)) {
                          setSelectedProfileUserId(userId);
                          setShowUserProfileModal(true);
                        }
                      }}
                    />
                  );
                })
              )}
              
              {/* Typing Indicator */}
              {isTyping && typingUser && (
                <div className="typing-indicator">
                  <div className="typing-avatar">
                    {chatType === 'group' ? (
                      <span>{typingUser.name?.charAt(0).toUpperCase()}</span>
                    ) : selectedChat?.participant?.profilePicture ? (
                      <img src={`http://localhost:5000${selectedChat.participant.profilePicture}`} alt="" />
                    ) : (
                      <span>{typingUser.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="typing-bubble">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input" onSubmit={handleSendMessage}>
              <div className="message-input-wrapper">
                <div className="emoji-picker-container-msg" ref={emojiPickerRef}>
                  <button type="button" className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
                  {showEmojiPicker && (
                    <div className="emoji-picker-msg">
                      <div className="emoji-search">
                        <input 
                          type="text" 
                          placeholder="Search emoji" 
                          value={emojiSearch}
                          onChange={(e) => setEmojiSearch(e.target.value)}
                        />
                      </div>
                      <div className="emoji-categories">
                        {Object.keys(emojiCategories).map(category => (
                          <button
                            key={category}
                            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => { setSelectedCategory(category); setEmojiSearch(''); }}
                            type="button"
                          >
                            {category === 'Smileys & people' && '😀'}
                            {category === 'Animals & nature' && '🐻'}
                            {category === 'Food & drink' && '🍔'}
                            {category === 'Activity' && '⚽'}
                            {category === 'Travel & places' && '🚗'}
                            {category === 'Objects' && '💡'}
                            {category === 'Symbols' && '❤️'}
                            {category === 'Flags' && '🏁'}
                          </button>
                        ))}
                      </div>
                      <div className="emoji-grid">
                        {getFilteredEmojis().map((emoji, index) => (
                          <button
                            key={index}
                            className="emoji-item"
                            onClick={() => handleEmojiClick(emoji)}
                            type="button"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  className="icon-btn" 
                  onClick={() => setShowVoiceRecorder(true)}
                  title="Send voice message"
                >
                  🎤
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleTyping}
                />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,video/*"
                onChange={handleFileSelect}
              />
              <input
                type="file"
                ref={documentInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                onChange={handleDocumentSelect}
              />
              <button 
                type="button" 
                className="media-btn" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                title="Send photo or video"
              >
                {uploadingMedia ? '⏳' : '📷'}
              </button>
              <button 
                type="button" 
                className="media-btn document-btn" 
                onClick={() => documentInputRef.current?.click()}
                disabled={uploadingMedia}
                title="Send document (PDF, DOC, XLS, etc.)"
              >
                📎
              </button>
              <button type="submit" className="send-btn" disabled={!newMessage.trim()}>Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <h3>Select a conversation</h3>
            <p>Choose from your existing conversations or start a new one</p>
            <button className="start-conversation-btn" onClick={() => history.push('/connections')}>
              Go to Connections
            </button>
          </div>
        )}
      </div>
    </div>

    {showVoiceRecorder && (
      <VoiceRecorder
        onSend={handleSendVoice}
        onCancel={() => setShowVoiceRecorder(false)}
      />
    )}

    {forwardingMessage && (
      <ForwardModal
        message={forwardingMessage}
        onForward={handleForwardMessage}
        onClose={() => setForwardingMessage(null)}
      />
    )}

    {showCreateGroupModal && (
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={handleGroupCreated}
        friends={friends}
      />
    )}

    {showGroupInfoModal && selectedChat && chatType === 'group' && (
      <GroupInfoModal
        isOpen={showGroupInfoModal}
        onClose={() => setShowGroupInfoModal(false)}
        group={selectedChat}
        friends={friends}
        currentUser={currentUser}
        onGroupUpdated={handleGroupUpdated}
        onGroupLeft={handleGroupLeft}
        onGroupDeleted={handleGroupDeleted}
      />
    )}

    {showUserProfileModal && selectedProfileUserId && (
      <UserProfileModal
        isOpen={showUserProfileModal}
        onClose={() => {
          setShowUserProfileModal(false);
          setSelectedProfileUserId(null);
        }}
        userId={selectedProfileUserId}
        currentUser={currentUser}
      />
    )}

    {showComingSoonModal && (
      <div className="modal-overlay" onClick={() => setShowComingSoonModal(false)}>
        <div className="coming-soon-modal" onClick={(e) => e.stopPropagation()}>
          <div className="coming-soon-content">
            <div className="coming-soon-icon">
              {comingSoonFeature === 'Voice Call' ? '📞' : '🎥'}
            </div>
            <h2>{comingSoonFeature}</h2>
            <p>This feature is coming soon! We're working hard to bring you the best {comingSoonFeature.toLowerCase()} experience.</p>
            <button className="coming-soon-btn" onClick={() => setShowComingSoonModal(false)}>
              Got it
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Messages;
