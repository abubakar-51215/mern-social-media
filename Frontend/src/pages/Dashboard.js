import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';
import StoryViewer from '../components/StoryViewer';
import NotificationCenter from '../components/NotificationCenter';
import { searchUsers, getUnreadNotificationsCount } from '../api';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);
  const history = useHistory();

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const sliderImages = [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDiscoverPosts = () => {
    // Import sample posts from Discover page
    const discoverPosts = [
      { _id: 'd1', user: { _id: 'u1', name: 'Emma Watson', profilePicture: 'https://i.pravatar.cc/150?img=1' }, content: 'Just launched my new AI-powered app! Check it out 🚀', category: 'Technology', likes: [{ _id: 'u2', name: 'Alex Turner', profilePicture: 'https://i.pravatar.cc/150?img=12' }, { _id: 'u3', name: 'Sophie Chen', profilePicture: 'https://i.pravatar.cc/150?img=5' }], comments: [], createdAt: new Date(Date.now() - 3600000).toISOString(), image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600' },
      { _id: 'd2', user: { _id: 'u2', name: 'Alex Turner', profilePicture: 'https://i.pravatar.cc/150?img=12' }, content: 'Beautiful sunset in Santorini 🌅 #Travel', category: 'Travel', likes: [{ _id: 'u1', name: 'Emma Watson', profilePicture: 'https://i.pravatar.cc/150?img=1' }], comments: [], createdAt: new Date(Date.now() - 7200000).toISOString(), image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600' },
      { _id: 'd3', user: { _id: 'u3', name: 'Sophie Chen', profilePicture: 'https://i.pravatar.cc/150?img=5' }, content: 'Made some homemade pasta today! Recipe in comments 🍝', category: 'Food', likes: [], comments: [], createdAt: new Date(Date.now() - 10800000).toISOString(), image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600' },
      { _id: 'd4', user: { _id: 'u5', name: 'Maria Garcia', profilePicture: 'https://i.pravatar.cc/150?img=9' }, content: 'Amazing game last night! 🏀 Best performance of the season', category: 'Sports', likes: [{ _id: 'u4', name: 'James Wilson', profilePicture: 'https://i.pravatar.cc/150?img=8' }], comments: [], createdAt: new Date(Date.now() - 18000000).toISOString(), video: 'https://www.youtube.com/embed/NpEaa2P7qZI' },
      { _id: 'd5', user: { _id: 'u6', name: 'David Kim', profilePicture: 'https://i.pravatar.cc/150?img=14' }, content: 'Working on my latest track. Music is life 🎵', category: 'Music', likes: [], comments: [], createdAt: new Date(Date.now() - 21600000).toISOString(), video: 'https://www.youtube.com/embed/Zi_XLOBDo_Y' },
      { _id: 'd6', user: { _id: 'u7', name: 'Lisa Anderson', profilePicture: 'https://i.pravatar.cc/150?img=10' }, content: 'Finished my oil painting today! What do you think? 🎨', category: 'Art', likes: [{ _id: 'u1', name: 'Emma Watson', profilePicture: 'https://i.pravatar.cc/150?img=1' }, { _id: 'u5', name: 'Maria Garcia', profilePicture: 'https://i.pravatar.cc/150?img=9' }], comments: [], createdAt: new Date(Date.now() - 25200000).toISOString(), image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600' },
      { _id: 'd7', user: { _id: 'u9', name: 'Sarah Johnson', profilePicture: 'https://i.pravatar.cc/150?img=16' }, content: 'Hiking through the Swiss Alps. Nature is incredible! ⛰️', category: 'Travel', likes: [{ _id: 'u3', name: 'Sophie Chen', profilePicture: 'https://i.pravatar.cc/150?img=5' }, { _id: 'u4', name: 'James Wilson', profilePicture: 'https://i.pravatar.cc/150?img=8' }], comments: [], createdAt: new Date(Date.now() - 32400000).toISOString(), video: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
      { _id: 'd8', user: { _id: 'u11', name: 'Emily Davis', profilePicture: 'https://i.pravatar.cc/150?img=25' }, content: 'Summer vibes with my new outfit 👗☀️', category: 'Fashion', likes: [{ _id: 'u2', name: 'Alex Turner', profilePicture: 'https://i.pravatar.cc/150?img=12' }, { _id: 'u3', name: 'Sophie Chen', profilePicture: 'https://i.pravatar.cc/150?img=5' }], comments: [], createdAt: new Date(Date.now() - 39600000).toISOString(), video: 'https://www.youtube.com/embed/jNQXAC9IVRw' },
    ];
    return discoverPosts;
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load real posts from API
      const { getAllPosts } = await import('../api');
      const postsData = await getAllPosts();
      
      // Get sample posts from Discover
      const discoverPosts = getDiscoverPosts();
      
      // Mix API posts with sample posts for better feed
      const samplePosts = [
        {
          _id: '1',
          user: { 
            _id: '1',
            name: 'Abubaker Amir', 
            email: 'abubakeramir95@gmail.com'
          },
          content: 'Hello World',
          likes: [{ _id: 'like1', name: 'John Doe', profilePicture: 'https://i.pravatar.cc/150?img=11' }],
          comments: [
            { _id: 'c1', user: { _id: 'u1', name: 'John Doe', profilePicture: 'https://i.pravatar.cc/150?img=11' }, text: 'Welcome to PingUp!', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '2',
          user: { 
            _id: '2',
            name: 'Sarah Johnson', 
            email: 'sarahjohnson@example.com'
          },
          content: 'Just finished building my first full-stack application! 🎉 So excited to share it with you all. Learning never stops!',
          image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
          likes: [
            { _id: 'l1', name: 'John Doe', profilePicture: 'https://i.pravatar.cc/150?img=11' },
            { _id: 'l2', name: 'Sarah Lee', profilePicture: 'https://i.pravatar.cc/150?img=9' },
            { _id: 'l3', name: 'Tom Brown', profilePicture: 'https://i.pravatar.cc/150?img=13' },
            { _id: 'l4', name: 'Alex Chen', profilePicture: 'https://i.pravatar.cc/150?img=7' },
            { _id: 'l5', name: 'Emma Davis', profilePicture: 'https://i.pravatar.cc/150?img=1' }
          ],
          likesCount: 234,
          comments: [
            { _id: 'c4', user: { _id: 'u4', name: 'Sarah Lee', profilePicture: 'https://i.pravatar.cc/150?img=9' }, text: 'Congratulations! 🎊', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
            { _id: 'c5', user: { _id: 'u5', name: 'Tom Brown', profilePicture: 'https://i.pravatar.cc/150?img=13' }, text: 'Awesome work!', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
          ],
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '3',
          user: { 
            _id: '3',
            name: 'Tech News Daily', 
            email: 'technews@example.com'
          },
          content: 'The future of web development is here! Check out the latest trends in AI-powered coding assistants and how they are revolutionizing the industry. What are your thoughts?',
          likes: [
            { _id: 'l6', name: 'Chris Taylor', profilePicture: 'https://i.pravatar.cc/150?img=8' },
            { _id: 'l7', name: 'Lisa Wang', profilePicture: 'https://i.pravatar.cc/150?img=10' },
            { _id: 'l8', name: 'David Kim', profilePicture: 'https://i.pravatar.cc/150?img=14' },
            { _id: 'l9', name: 'Rachel Green', profilePicture: 'https://i.pravatar.cc/150?img=25' }
          ],
          likesCount: 892,
          comments: [
            { _id: 'c6', user: { _id: 'u6', name: 'Alex Chen', profilePicture: 'https://i.pravatar.cc/150?img=7' }, text: 'AI is changing everything!', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
            { _id: 'c7', user: { _id: 'u7', name: 'Lisa Wang', profilePicture: 'https://i.pravatar.cc/150?img=10' }, text: 'Great insights!', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() }
          ],
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '4',
          user: { 
            _id: '4',
            name: 'Design Inspiration', 
            email: 'design@example.com'
          },
          content: 'Beautiful gradient designs for your next project! 🎨✨',
          image: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=600',
          likes: [
            { _id: 'l10', name: 'Monica Geller', profilePicture: 'https://i.pravatar.cc/150?img=26' },
            { _id: 'l11', name: 'Ross Taylor', profilePicture: 'https://i.pravatar.cc/150?img=19' },
            { _id: 'l12', name: 'Emma Davis', profilePicture: 'https://i.pravatar.cc/150?img=1' }
          ],
          likesCount: 1247,
          comments: [
            { _id: 'c8', user: { _id: 'u8', name: 'Emma Davis', profilePicture: 'https://i.pravatar.cc/150?img=1' }, text: 'Love these colors! 😍', createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString() },
            { _id: 'c9', user: { _id: 'u9', name: 'David Kim', profilePicture: 'https://i.pravatar.cc/150?img=14' }, text: 'Can I use this in my project?', createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() }
          ],
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '5',
          user: { 
            _id: '5',
            name: 'Code Warriors', 
            email: 'codewarriors@example.com'
          },
          content: `10 JavaScript tips that will blow your mind! 🚀

1. Use optional chaining
2. Nullish coalescing
3. Array.flat()
4. Object.fromEntries()
5. Promise.allSettled()

What's your favorite JS feature?`,
          likes: [
            { _id: 'l13', name: 'Chris Taylor', profilePicture: 'https://i.pravatar.cc/150?img=8' },
            { _id: 'l14', name: 'Sarah Lee', profilePicture: 'https://i.pravatar.cc/150?img=9' }
          ],
          likesCount: 456,
          comments: [
            { _id: 'c10', user: { _id: 'u10', name: 'Chris Taylor', profilePicture: 'https://i.pravatar.cc/150?img=8' }, text: 'Optional chaining is a game changer!', createdAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString() },
            { _id: 'c11', user: { _id: 'u11', name: 'Rachel Green', profilePicture: 'https://i.pravatar.cc/150?img=25' }, text: 'Promise.allSettled() is so useful', createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString() }
          ],
          createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '6',
          user: { 
            _id: '6',
            name: 'Coffee & Code', 
            email: 'coffeeandcode@example.com'
          },
          content: "Morning motivation: Your code doesn't have to be perfect, it just has to work. Refactor later! ☕💻",
          image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
          likes: [
            { _id: 'l15', name: 'Monica Geller', profilePicture: 'https://i.pravatar.cc/150?img=26' },
            { _id: 'l16', name: 'John Doe', profilePicture: 'https://i.pravatar.cc/150?img=11' },
            { _id: 'l17', name: 'Tom Brown', profilePicture: 'https://i.pravatar.cc/150?img=13' }
          ],
          likesCount: 678,
          comments: [
            { _id: 'c12', user: { _id: 'u12', name: 'Monica Geller', profilePicture: 'https://i.pravatar.cc/150?img=26' }, text: 'So true! Progress over perfection', createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() },
            { _id: 'c13', user: { _id: 'u13', name: 'Ross Taylor', profilePicture: 'https://i.pravatar.cc/150?img=19' }, text: 'Needed to hear this today!', createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString() }
          ],
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // Merge API posts with sample posts and Discover posts
      if (postsData && postsData.length > 0) {
        // Combine all posts and shuffle randomly
        const allPosts = [...postsData, ...samplePosts, ...discoverPosts];
        const shuffled = allPosts.sort(() => Math.random() - 0.5);
        setPosts(shuffled);
      } else {
        // If no API posts, combine sample and discover posts
        const allPosts = [...samplePosts, ...discoverPosts];
        const shuffled = allPosts.sort(() => Math.random() - 0.5);
        setPosts(shuffled);
      }

      // Load stories from backend
      const { getStories } = await import('../api');
      let transformedStories = [];
      
      try {
        const storiesData = await getStories();
        console.log('Stories API response:', storiesData.data);
        
        // Transform stories data for display
        if (storiesData.data && Array.isArray(storiesData.data)) {
          transformedStories = storiesData.data.flatMap(group => 
            group.stories.map(story => ({
              id: story._id,
              user: group.user.name,
              userId: group.user._id,
              avatar: group.user.profilePicture,
              image: story.content?.mediaUrl ? 
                (story.content.mediaUrl.startsWith('/uploads') 
                  ? `http://localhost:5000${story.content.mediaUrl}` 
                  : story.content.mediaUrl) 
                : null,
              text: story.content?.text || story.question?.text || story.poll?.question || null,
              backgroundColor: story.content?.backgroundColor || '#6366f1',
              time: getTimeAgo(story.createdAt),
              type: story.type,
              question: story.question || null,
              poll: story.poll || null,
              views: story.views?.length || 0,
              reactions: story.reactions || [],
              replies: story.replies || []
            }))
          );
        }
      } catch (error) {
        console.error('Error loading stories from API:', error);
      }

      // Hardcoded sample stories for display
      const sampleStories = [
        {
          id: 'sample-1',
          user: 'Abubaker Amir',
          userId: 'sample-user-1',
          avatar: null,
          image: null,
          text: '"The greatest glory in living lies not in never falling, but in rising every time we fall."',
          backgroundColor: '#6366f1',
          time: '2h ago',
          type: 'text',
          views: 24,
          reactions: [],
          replies: []
        },
        {
          id: 'sample-2',
          user: 'Sara Khan',
          userId: 'sample-user-2',
          avatar: null,
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
          text: null,
          backgroundColor: null,
          time: '4h ago',
          type: 'image',
          views: 56,
          reactions: [],
          replies: []
        },
        {
          id: 'sample-3',
          user: 'Danish Ali',
          userId: 'sample-user-3',
          avatar: null,
          image: null,
          text: '🚀 Just launched my first project! So excited to share this journey with you all.',
          backgroundColor: '#8b5cf6',
          time: '6h ago',
          type: 'text',
          views: 89,
          reactions: [],
          replies: []
        },
        {
          id: 'sample-4',
          user: 'Fatima Khan',
          userId: 'sample-user-4',
          avatar: null,
          image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
          text: null,
          backgroundColor: null,
          time: '8h ago',
          type: 'image',
          views: 112,
          reactions: [],
          replies: []
        }
      ];

      // Combine API stories with sample stories
      const allStories = [...transformedStories, ...sampleStories];
      setStories(allStories);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      history.push('/');
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);
    loadDashboardData();
    loadNotifications();
    loadUnreadCount();

    // Refresh unread count every 30 seconds
    const intervalId = setInterval(loadUnreadCount, 30000);

    // Listen for real-time notifications and post updates
    const initSocket = async () => {
      const io = (await import('socket.io-client')).default;
      const socket = io('http://localhost:5000');
      socket.emit('join', userData._id);

      socket.on('newNotification', (data) => {
        // Reload notifications when a new one arrives
        loadNotifications();
        loadUnreadCount();
      });

      // Real-time post updates
      socket.on('postLiked', (data) => {
        setPosts(prevPosts => prevPosts.map(post => 
          post._id === data.postId 
            ? { ...post, likes: data.likes, likesCount: data.likesCount }
            : post
        ));
      });

      socket.on('postCommented', (data) => {
        setPosts(prevPosts => prevPosts.map(post => 
          post._id === data.postId 
            ? { ...post, comments: data.comments, commentsCount: data.commentsCount }
            : post
        ));
      });

      socket.on('newPost', (data) => {
        // Add new post to the feed
        setPosts(prevPosts => [data.post, ...prevPosts]);
      });

      return () => {
        socket.disconnect();
      };
    };

    initSocket();

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setShowSearchResults(true);
    debounceTimer.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;

    setSearchLoading(true);
    try {
      const response = await searchUsers(query);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const handleUserClick = (userId) => {
    setShowSearchResults(false);
    setSearchQuery('');
    history.push(`/profile/${userId}`);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationsCount();
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotifications([]);
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        // Fallback to empty array if error
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👥';
      case 'story_like': return '⭐';
      default: return '🔔';
    }
  };

  const formatNotificationTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-header">
        <div className="search-bar" ref={searchRef}>
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
          {showSearchResults && (
            <div className="search-dropdown">
              {searchLoading ? (
                <div className="search-loading">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="search-results">
                  {searchResults.map(user => (
                    <div 
                      key={user._id} 
                      className="search-result-item"
                      onClick={() => handleUserClick(user._id)}
                    >
                      <img 
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                        alt={user.name}
                        className="search-result-avatar"
                      />
                      <div className="search-result-info">
                        <div className="search-result-name">{user.name}</div>
                        <div className="search-result-email">{user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="search-no-results">No users found</div>
              ) : null}
            </div>
          )}
        </div>
        <div className="header-actions">
          <button className="icon-button" onClick={() => history.push('/connections')}>👥</button>
          <div className="notification-container">
            <button 
              className="icon-button notification-btn" 
              onClick={() => setShowNotificationCenter(true)}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-count-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3>Notifications</h3>
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="no-notifications">
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif._id} className="notification-item">
                        <div className="notification-avatar">
                          {notif.sender?.profilePicture ? (
                            <img src={notif.sender.profilePicture} alt={notif.sender.name} />
                          ) : (
                            getNotificationIcon(notif.type)
                          )}
                        </div>
                        <div className="notification-content">
                          <p>{notif.message}</p>
                          <span className="notification-time">{formatNotificationTime(notif.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="main-wrapper">
        <div className="feed-container">
          {/* Stories Section */}
          <div className="stories-section">
            <div className="story-card create-story" onClick={() => history.push('/create-story')}>
              <div className="story-plus">+</div>
              <span>Create Story</span>
            </div>
            {stories.map((story, index) => (
              <div 
                key={story.id} 
                className="story-card"
                onClick={() => {
                  setSelectedStoryIndex(index);
                  setShowStoryViewer(true);
                }}
              >
                {story.type === 'text' ? (
                  <div className="story-text-preview" style={{ backgroundColor: story.backgroundColor || '#6366f1' }}>
                    <span>{story.text?.substring(0, 50)}{story.text?.length > 50 ? '...' : ''}</span>
                  </div>
                ) : story.type === 'question' ? (
                  <div className="story-text-preview story-question-preview" style={{ backgroundColor: story.backgroundColor || '#6366f1' }}>
                    <span className="story-type-icon">❓</span>
                    <span>{story.question?.text?.substring(0, 40) || story.text?.substring(0, 40) || 'Question'}...</span>
                  </div>
                ) : story.type === 'poll' ? (
                  <div className="story-text-preview story-poll-preview" style={{ backgroundColor: story.backgroundColor || '#8b5cf6' }}>
                    <span className="story-type-icon">📊</span>
                    <span>{story.poll?.question?.substring(0, 40) || story.text?.substring(0, 40) || 'Poll'}...</span>
                  </div>
                ) : story.image || story.media ? (
                  <img src={story.image || story.media} alt="Story" />
                ) : (
                  <div className="story-text-preview" style={{ backgroundColor: story.backgroundColor || '#6366f1' }}>
                    <span>{story.text?.substring(0, 50) || 'Story'}</span>
                  </div>
                )}
                <div className="story-user-avatar">
                  {story.avatar ? (
                    <img src={story.avatar} alt={story.user} />
                  ) : (
                    <div className="avatar-circle-small">
                      {story.user?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="story-username">{story.user}</span>
              </div>
            ))}
          </div>

          {/* Posts Feed */}
          <div className="posts-feed">
            {loading ? (
              <div className="loading">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="empty-feed">
                <p>No posts yet. Be the first to share something!</p>
                <button onClick={() => history.push('/create-post')}>Create Post</button>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} currentUser={user} onUpdate={handlePostUpdate} />
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="right-sidebar">
          <div className="widget">
            <h3>Email marketing</h3>
            <div className="image-slider">
              {sliderImages.map((img, index) => (
                <img 
                  key={index}
                  src={img} 
                  alt="Marketing" 
                  className={`slider-image ${index === currentSlide ? 'active' : ''}`}
                />
              ))}
              <div className="slider-dots">
                {sliderImages.map((_, index) => (
                  <span 
                    key={index} 
                    className={`dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
            <p>Supercharge your marketing with a powerful, easy-to-use platform built for results.</p>
          </div>
          
          <div className="widget">
            <h3>Recent Messages</h3>
            <p className="widget-empty">No recent messages</p>
            <button onClick={() => history.push('/messages')}>View All Messages</button>
          </div>
        </div>
      </div>

      {/* Story Viewer */}
      {showStoryViewer && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedStoryIndex}
          onClose={() => {
            setShowStoryViewer(false);
            loadDashboardData(); // Reload to reflect any deleted stories
          }}
          onDelete={(storyId) => {
            setStories(stories.filter(s => s.id !== storyId));
          }}
        />
      )}

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotificationCenter}
        onClose={() => {
          setShowNotificationCenter(false);
          loadUnreadCount(); // Refresh count when closing
        }}
      />
    </div>
  );
};

export default Dashboard;
