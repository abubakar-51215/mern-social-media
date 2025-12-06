import React, { useState, useEffect } from 'react';
import { getUser } from '../utils/auth';
import PostCard from '../components/PostCard';
import './Discover.css';

const Discover = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const currentUser = getUser();

  const categories = ['All', 'Technology', 'Travel', 'Food', 'Fashion', 'Sports', 'Music', 'Art'];

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      // Sample posts with different categories (images and YouTube videos)
      const samplePosts = [
        { _id: '1', user: { _id: 'u1', name: 'Emma Watson', profilePicture: 'https://i.pravatar.cc/150?img=1' }, content: 'Just launched my new AI-powered app! Check it out 🚀', category: 'Technology', likes: ['u2', 'u3'], comments: [
          { _id: 'c1', user: { _id: 'u2', name: 'Alex Turner', profilePicture: 'https://i.pravatar.cc/150?img=12' }, text: 'This looks amazing! Can\'t wait to try it out! 🎉', createdAt: new Date(Date.now() - 3000000).toISOString() },
          { _id: 'c2', user: { _id: 'u3', name: 'Sophie Chen', profilePicture: 'https://i.pravatar.cc/150?img=5' }, text: 'Congratulations on the launch! 🚀', createdAt: new Date(Date.now() - 2800000).toISOString() }
        ], createdAt: new Date(Date.now() - 3600000).toISOString(), image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600' },
        { _id: '2', user: { _id: 'u2', name: 'Alex Turner', profilePicture: 'https://i.pravatar.cc/150?img=12' }, content: 'Beautiful sunset in Santorini 🌅 #Travel', category: 'Travel', likes: ['u1'], comments: [
          { _id: 'c3', user: { _id: 'u1', name: 'Emma Watson', profilePicture: 'https://i.pravatar.cc/150?img=1' }, text: 'Stunning view! Added to my bucket list 😍', createdAt: new Date(Date.now() - 6900000).toISOString() }
        ], createdAt: new Date(Date.now() - 7200000).toISOString(), image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600' },
        { _id: '3', user: { _id: 'u3', name: 'Sophie Chen', profilePicture: 'https://i.pravatar.cc/150?img=5' }, content: 'Made some homemade pasta today! Recipe in comments 🍝', category: 'Food', likes: [], comments: [
          { _id: 'c4', user: { _id: 'u4', name: 'James Wilson', profilePicture: 'https://i.pravatar.cc/150?img=13' }, text: 'Looks delicious! Can you share the recipe?', createdAt: new Date(Date.now() - 10500000).toISOString() },
          { _id: 'c5', user: { _id: 'u3', name: 'Sophie Chen', profilePicture: 'https://i.pravatar.cc/150?img=5' }, text: 'Sure! I used fresh eggs, flour, and a pinch of salt. Will post detailed recipe soon!', createdAt: new Date(Date.now() - 10200000).toISOString() }
        ], createdAt: new Date(Date.now() - 10800000).toISOString(), image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600' },
        { _id: '4', user: { _id: 'u4', name: 'James Wilson', profilePicture: 'https://i.pravatar.cc/150?img=13' }, content: 'New fashion collection dropping next week! Stay tuned ✨', category: 'Fashion', likes: ['u1', 'u2', 'u3'], comments: [
          { _id: 'c6', user: { _id: 'u1', name: 'Emma Watson', profilePicture: 'https://i.pravatar.cc/150?img=1' }, text: 'Love the aesthetic! Can\'t wait 💫', createdAt: new Date(Date.now() - 14100000).toISOString() },
          { _id: 'c7', user: { _id: 'u2', name: 'Alex Turner', profilePicture: 'https://i.pravatar.cc/150?img=12' }, text: 'This is fire! 🔥', createdAt: new Date(Date.now() - 13900000).toISOString() }
        ], createdAt: new Date(Date.now() - 14400000).toISOString(), image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600' },
        { _id: '5', user: { _id: 'u5', name: 'Maria Garcia', profilePicture: 'https://i.pravatar.cc/150?img=9' }, content: 'Amazing game last night! 🏀 Best performance of the season', category: 'Sports', likes: ['u4'], comments: [
          { _id: 'c8', user: { _id: 'u4', name: 'James Wilson', profilePicture: 'https://i.pravatar.cc/150?img=13' }, text: 'That final shot was incredible! 🏀', createdAt: new Date(Date.now() - 17700000).toISOString() }
        ], createdAt: new Date(Date.now() - 18000000).toISOString(), video: 'https://www.youtube.com/embed/NpEaa2P7qZI' },
        { _id: '6', user: { _id: 'u6', name: 'David Kim', profilePicture: 'https://i.pravatar.cc/150?img=14' }, content: 'Working on my latest track. Music is life 🎵', category: 'Music', likes: [], comments: [], createdAt: new Date(Date.now() - 21600000).toISOString(), video: 'https://www.youtube.com/embed/Zi_XLOBDo_Y' },
        { _id: '7', user: { _id: 'u7', name: 'Lisa Anderson', profilePicture: 'https://i.pravatar.cc/150?img=10' }, content: 'Finished my oil painting today! What do you think? 🎨', category: 'Art', likes: ['u1', 'u5'], comments: [], createdAt: new Date(Date.now() - 25200000).toISOString(), image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600' },
        { _id: '8', user: { _id: 'u8', name: 'Ryan Martinez', profilePicture: 'https://i.pravatar.cc/150?img=15' }, content: 'Excited about the new iPhone features! Apple did it again 📱', category: 'Technology', likes: ['u2'], comments: [], createdAt: new Date(Date.now() - 28800000).toISOString(), video: 'https://www.youtube.com/embed/6ZfuNTqbHE8' },
        { _id: '9', user: { _id: 'u9', name: 'Sarah Johnson', profilePicture: 'https://i.pravatar.cc/150?img=16' }, content: 'Hiking through the Swiss Alps. Nature is incredible! ⛰️', category: 'Travel', likes: ['u3', 'u4'], comments: [], createdAt: new Date(Date.now() - 32400000).toISOString(), video: 'https://www.youtube.com/embed/LXb3EKWsInQ' },
        { _id: '10', user: { _id: 'u10', name: 'Michael Brown', profilePicture: 'https://i.pravatar.cc/150?img=17' }, content: 'Best sushi I\'ve ever had! 🍣 Highly recommend this place', category: 'Food', likes: ['u1'], comments: [
          { _id: 'c9', user: { _id: 'u1', name: 'Emma Watson', profilePicture: 'https://i.pravatar.cc/150?img=1' }, text: 'Which restaurant is this? I need to go! 🍣', createdAt: new Date(Date.now() - 35700000).toISOString() },
          { _id: 'c10', user: { _id: 'u10', name: 'Michael Brown', profilePicture: 'https://i.pravatar.cc/150?img=17' }, text: 'It\'s Sushi Master downtown! Highly recommend the chef\'s special', createdAt: new Date(Date.now() - 35400000).toISOString() }
        ], createdAt: new Date(Date.now() - 36000000).toISOString(), image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=600' },
        { _id: '11', user: { _id: 'u11', name: 'Emily Davis', profilePicture: 'https://i.pravatar.cc/150?img=25' }, content: 'Summer vibes with my new outfit 👗☀️', category: 'Fashion', likes: ['u2', 'u3'], comments: [
          { _id: 'c11', user: { _id: 'u3', name: 'Sophie Chen', profilePicture: 'https://i.pravatar.cc/150?img=5' }, text: 'So stylish! Where did you get that dress?', createdAt: new Date(Date.now() - 39300000).toISOString() }
        ], createdAt: new Date(Date.now() - 39600000).toISOString(), video: 'https://www.youtube.com/embed/jNQXAC9IVRw' },
        { _id: '12', user: { _id: 'u12', name: 'Chris Evans', profilePicture: 'https://i.pravatar.cc/150?img=18' }, content: 'Training hard for the marathon! 🏃‍♂️ #FitnessGoals', category: 'Sports', likes: [], comments: [], createdAt: new Date(Date.now() - 43200000).toISOString(), image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600' },
        { _id: '13', user: { _id: 'u13', name: 'Jessica Taylor', profilePicture: 'https://i.pravatar.cc/150?img=26' }, content: 'Live concert tonight! Can\'t wait 🎤', category: 'Music', likes: ['u4', 'u5'], comments: [], createdAt: new Date(Date.now() - 46800000).toISOString(), video: 'https://www.youtube.com/embed/YQHsXMglC9A' },
        { _id: '14', user: { _id: 'u14', name: 'Daniel Lee', profilePicture: 'https://i.pravatar.cc/150?img=19' }, content: 'Abstract art exhibition opening this weekend 🖼️', category: 'Art', likes: ['u1'], comments: [], createdAt: new Date(Date.now() - 50400000).toISOString(), image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600' },
        { _id: '15', user: { _id: 'u15', name: 'Olivia White', profilePicture: 'https://i.pravatar.cc/150?img=27' }, content: 'Coding challenge completed! 100 days of code ✅', category: 'Technology', likes: ['u2', 'u3'], comments: [
          { _id: 'c12', user: { _id: 'u2', name: 'Alex Turner', profilePicture: 'https://i.pravatar.cc/150?img=12' }, text: 'Congratulations! That\'s dedication 💪', createdAt: new Date(Date.now() - 53700000).toISOString() },
          { _id: 'c13', user: { _id: 'u3', name: 'Sophie Chen', profilePicture: 'https://i.pravatar.cc/150?img=5' }, text: 'Amazing achievement! What did you learn?', createdAt: new Date(Date.now() - 53500000).toISOString() }
        ], createdAt: new Date(Date.now() - 54000000).toISOString(), video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { _id: '16', user: { _id: 'u16', name: 'William Harris', profilePicture: 'https://i.pravatar.cc/150?img=20' }, content: 'Exploring Tokyo! Amazing culture and food 🇯🇵', category: 'Travel', likes: ['u1', 'u4'], comments: [], createdAt: new Date(Date.now() - 57600000).toISOString(), video: 'https://www.youtube.com/embed/3nQNiWdeH2Q' },
        { _id: '17', user: { _id: 'u17', name: 'Sophia Martin', profilePicture: 'https://i.pravatar.cc/150?img=28' }, content: 'Homemade pizza night with friends! 🍕', category: 'Food', likes: [], comments: [], createdAt: new Date(Date.now() - 61200000).toISOString(), video: 'https://www.youtube.com/embed/vOqVdUHIRao' },
        { _id: '18', user: { _id: 'u18', name: 'Matthew Thompson', profilePicture: 'https://i.pravatar.cc/150?img=21' }, content: 'Fall fashion trends are here! 🍂', category: 'Fashion', likes: ['u2'], comments: [], createdAt: new Date(Date.now() - 64800000).toISOString(), image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600' },
        { _id: '19', user: { _id: 'u19', name: 'Isabella Moore', profilePicture: 'https://i.pravatar.cc/150?img=29' }, content: 'Basketball practice paying off! ⛹️‍♀️', category: 'Sports', likes: ['u3', 'u5'], comments: [], createdAt: new Date(Date.now() - 68400000).toISOString(), video: 'https://www.youtube.com/embed/V-OYKd8SVrI' },
        { _id: '20', user: { _id: 'u20', name: 'Joshua Jackson', profilePicture: 'https://i.pravatar.cc/150?img=22' }, content: 'New album dropping next month! Stay tuned 🎧', category: 'Music', likes: ['u1', 'u4'], comments: [
          { _id: 'c14', user: { _id: 'u1', name: 'Emma Watson', profilePicture: 'https://i.pravatar.cc/150?img=1' }, text: 'So excited for this! 🎵', createdAt: new Date(Date.now() - 71700000).toISOString() },
          { _id: 'c15', user: { _id: 'u4', name: 'James Wilson', profilePicture: 'https://i.pravatar.cc/150?img=13' }, text: 'Can\'t wait to hear it! Any sneak peeks?', createdAt: new Date(Date.now() - 71400000).toISOString() }
        ], createdAt: new Date(Date.now() - 72000000).toISOString(), video: 'https://www.youtube.com/embed/kXYiU_JCYtU' },
        { _id: '21', user: { _id: 'u21', name: 'Ava Robinson', profilePicture: 'https://i.pravatar.cc/150?img=30' }, content: 'Watercolor painting session 🎨💧', category: 'Art', likes: [], comments: [], createdAt: new Date(Date.now() - 75600000).toISOString(), image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600' },
        { _id: '22', user: { _id: 'u22', name: 'Ethan Clark', profilePicture: 'https://i.pravatar.cc/150?img=23' }, content: 'Building a smart home system with Raspberry Pi 🏠', category: 'Technology', likes: ['u2', 'u5'], comments: [], createdAt: new Date(Date.now() - 79200000).toISOString(), video: 'https://www.youtube.com/embed/iJmFMcyH3XY' },
        { _id: '23', user: { _id: 'u23', name: 'Mia Rodriguez', profilePicture: 'https://i.pravatar.cc/150?img=31' }, content: 'Beach vibes in Maldives 🏖️', category: 'Travel', likes: ['u1', 'u3'], comments: [], createdAt: new Date(Date.now() - 82800000).toISOString(), video: 'https://www.youtube.com/embed/v64KOxKVLVg' },
        { _id: '24', user: { _id: 'u24', name: 'Benjamin Lewis', profilePicture: 'https://i.pravatar.cc/150?img=24' }, content: 'Perfect espresso shot ☕✨', category: 'Food', likes: ['u2'], comments: [], createdAt: new Date(Date.now() - 86400000).toISOString(), image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600' },
        { _id: '25', user: { _id: 'u25', name: 'Charlotte Walker', profilePicture: 'https://i.pravatar.cc/150?img=32' }, content: 'Vintage fashion never goes out of style 👠', category: 'Fashion', likes: ['u1', 'u4'], comments: [], createdAt: new Date(Date.now() - 90000000).toISOString(), image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600' },
        { _id: '26', user: { _id: 'u26', name: 'Lucas Hall', profilePicture: 'https://i.pravatar.cc/150?img=33' }, content: 'Soccer match today! Let\'s go team! ⚽', category: 'Sports', likes: ['u3'], comments: [], createdAt: new Date(Date.now() - 93600000).toISOString(), video: 'https://www.youtube.com/embed/6JYIGclVQdw' },
        { _id: '27', user: { _id: 'u27', name: 'Amelia Allen', profilePicture: 'https://i.pravatar.cc/150?img=34' }, content: 'Jazz night at the club 🎺', category: 'Music', likes: [], comments: [], createdAt: new Date(Date.now() - 97200000).toISOString(), video: 'https://www.youtube.com/embed/vmDDOFXSgAs' },
        { _id: '28', user: { _id: 'u28', name: 'Henry Young', profilePicture: 'https://i.pravatar.cc/150?img=35' }, content: 'Digital art piece I created today 🖥️🎨', category: 'Art', likes: ['u1', 'u2'], comments: [], createdAt: new Date(Date.now() - 100800000).toISOString(), video: 'https://www.youtube.com/embed/pLqipJNItIo' },
        { _id: '29', user: { _id: 'u29', name: 'Harper King', profilePicture: 'https://i.pravatar.cc/150?img=36' }, content: 'Learning about blockchain technology 🔗', category: 'Technology', likes: ['u5'], comments: [], createdAt: new Date(Date.now() - 104400000).toISOString(), image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600' },
        { _id: '30', user: { _id: 'u30', name: 'Elijah Wright', profilePicture: 'https://i.pravatar.cc/150?img=37' }, content: 'Road trip across America! Day 5 🚗', category: 'Travel', likes: ['u2', 'u4'], comments: [], createdAt: new Date(Date.now() - 108000000).toISOString(), image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600' }
      ];
      
      // Shuffle posts randomly for each user
      const shuffledPosts = samplePosts.sort(() => Math.random() - 0.5);
      
      setPosts(shuffledPosts);
      setFilteredPosts(shuffledPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    if (category === 'All') {
      // Shuffle again when showing all
      const shuffled = [...posts].sort(() => Math.random() - 0.5);
      setFilteredPosts(shuffled);
    } else {
      // Filter and shuffle
      const filtered = posts.filter(post => post.category === category);
      const shuffled = filtered.sort(() => Math.random() - 0.5);
      setFilteredPosts(shuffled);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    // Update the specific post in the posts array
    const updatePostsArray = (postsArray) => {
      return postsArray.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      );
    };
    
    setPosts(prevPosts => updatePostsArray(prevPosts));
    setFilteredPosts(prevFiltered => updatePostsArray(prevFiltered));
  };

  return (
    <div className="discover-page">
      <div className="discover-header">
        <h1>Discover</h1>
        <p>Explore trending content from around the world</p>
      </div>

      <div className="category-filter">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="discover-posts">
          {filteredPosts.length === 0 ? (
            <div className="empty-state">
              <p>No posts found in this category</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard 
                key={post._id} 
                post={post} 
                currentUser={currentUser}
                onUpdate={() => handlePostUpdate(post)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Discover;
