import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * This script syncs existing friendships to ensure followers/following arrays are populated
 * Run this once to fix existing friend connections
 */

const syncFriendships = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/test", {
    });
    console.log('MongoDB Connected for sync');

    // Get all users with friends
    const users = await User.find({ friends: { $exists: true, $ne: [] } });
    
    console.log(`Found ${users.length} users with friends`);
    
    let syncedCount = 0;
    
    for (const user of users) {
      let updated = false;
      
      // For each friend, ensure mutual follower/following relationship
      for (const friendId of user.friends) {
        // Add friend to user's following if not already there
        if (!user.following.includes(friendId)) {
          user.following.push(friendId);
          updated = true;
        }
        
        // Add friend to user's followers if not already there
        if (!user.followers.includes(friendId)) {
          user.followers.push(friendId);
          updated = true;
        }
        
        // Update the friend's arrays as well
        const friend = await User.findById(friendId);
        if (friend) {
          let friendUpdated = false;
          
          if (!friend.following.includes(user._id)) {
            friend.following.push(user._id);
            friendUpdated = true;
          }
          
          if (!friend.followers.includes(user._id)) {
            friend.followers.push(user._id);
            friendUpdated = true;
          }
          
          if (friendUpdated) {
            await friend.save();
          }
        }
      }
      
      if (updated) {
        await user.save();
        syncedCount++;
        console.log(`✓ Synced followers/following for user: ${user.name} (${user.email})`);
      }
    }
    
    console.log(`\n✅ Sync complete! Updated ${syncedCount} users.`);
    
    // Show final stats
    const allUsers = await User.find().select('name email friends followers following');
    console.log('\n📊 Current Stats:');
    allUsers.forEach(u => {
      console.log(`- ${u.name}: ${u.friends.length} friends, ${u.followers.length} followers, ${u.following.length} following`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing friendships:', error);
    process.exit(1);
  }
};

syncFriendships();
