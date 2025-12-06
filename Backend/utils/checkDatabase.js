import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * This script checks the current database state
 */

const checkDatabase = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/test", {
    });
    console.log('MongoDB Connected\n');

    // Get all users
    const users = await User.find().select('name email friends followers following friendRequests sentFriendRequests');
    
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   - Friends: ${user.friends.length}`);
      console.log(`   - Followers: ${user.followers.length}`);
      console.log(`   - Following: ${user.following.length}`);
      console.log(`   - Friend Requests: ${user.friendRequests.length}`);
      console.log(`   - Sent Requests: ${user.sentFriendRequests.length}`);
      
      if (user.friends.length > 0) {
        console.log(`   - Friend IDs: ${user.friends.map(id => id.toString()).join(', ')}`);
      }
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkDatabase();
