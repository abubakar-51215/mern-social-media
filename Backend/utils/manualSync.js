import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * This script manually updates a user to add followers/following based on friends
 * Usage: node utils/manualSync.js <user_email>
 * Or run without arguments to sync all users
 */

const manualSync = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/test", {
    });
    console.log('MongoDB Connected\n');

    const userEmail = process.argv[2];
    
    let usersToSync;
    if (userEmail) {
      const user = await User.findOne({ email: userEmail });
      if (!user) {
        console.log(`❌ User not found: ${userEmail}`);
        process.exit(1);
      }
      usersToSync = [user];
      console.log(`Syncing user: ${user.name} (${user.email})\n`);
    } else {
      usersToSync = await User.find();
      console.log(`Syncing all users (${usersToSync.length} total)\n`);
    }

    let totalUpdated = 0;

    for (const user of usersToSync) {
      console.log(`\n📋 Processing: ${user.name} (${user.email})`);
      console.log(`Current state:`);
      console.log(`  - Friends: ${user.friends.length}`);
      console.log(`  - Followers: ${user.followers.length}`);
      console.log(`  - Following: ${user.following.length}`);

      if (user.friends.length === 0) {
        console.log(`⏭️  No friends to sync`);
        continue;
      }

      let updated = false;

      // Ensure followers and following arrays exist
      if (!user.followers) user.followers = [];
      if (!user.following) user.following = [];

      // For each friend, add to followers and following if not already there
      for (const friendId of user.friends) {
        // Check if friend exists
        const friend = await User.findById(friendId);
        if (!friend) {
          console.log(`  ⚠️  Friend ID ${friendId} not found in database`);
          continue;
        }

        // Add friend to user's following
        if (!user.following.some(id => id.toString() === friendId.toString())) {
          user.following.push(friendId);
          updated = true;
          console.log(`  ✓ Added ${friend.name} to following`);
        }

        // Add friend to user's followers
        if (!user.followers.some(id => id.toString() === friendId.toString())) {
          user.followers.push(friendId);
          updated = true;
          console.log(`  ✓ Added ${friend.name} to followers`);
        }

        // Ensure mutual relationship - update friend's arrays
        let friendUpdated = false;
        if (!friend.followers) friend.followers = [];
        if (!friend.following) friend.following = [];

        if (!friend.following.some(id => id.toString() === user._id.toString())) {
          friend.following.push(user._id);
          friendUpdated = true;
        }

        if (!friend.followers.some(id => id.toString() === user._id.toString())) {
          friend.followers.push(user._id);
          friendUpdated = true;
        }

        if (friendUpdated) {
          await friend.save();
          console.log(`  ✓ Updated ${friend.name}'s followers/following`);
        }
      }

      if (updated) {
        await user.save();
        totalUpdated++;
        console.log(`✅ Saved changes for ${user.name}`);
      } else {
        console.log(`✓ Already in sync`);
      }
    }

    console.log(`\n\n═══════════════════════════════════════`);
    console.log(`✅ Sync Complete!`);
    console.log(`Updated ${totalUpdated} user(s)`);
    console.log(`═══════════════════════════════════════\n`);

    // Show final status
    const allUsers = await User.find().select('name email friends followers following');
    console.log('📊 Final Status:\n');
    allUsers.forEach(u => {
      console.log(`${u.name}:`);
      console.log(`  • ${u.friends.length} friends`);
      console.log(`  • ${u.followers.length} followers`);
      console.log(`  • ${u.following.length} following\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

manualSync();
