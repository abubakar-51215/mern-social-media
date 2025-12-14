import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

dotenv.config();

function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

async function fixCollectionCreatedAt(Model, modelName) {
  const session = await mongoose.startSession();
  let fixedCount = 0;
  try {
    session.startTransaction();

    const docs = await Model.find({}, '_id createdAt').lean();
    for (const doc of docs) {
      const hasCreatedAt = typeof doc.createdAt !== 'undefined' && doc.createdAt !== null;
      const createdAtDate = hasCreatedAt ? new Date(doc.createdAt) : null;
      const valid = hasCreatedAt && isValidDate(createdAtDate);

      if (!valid) {
        const fallbackDate = new mongoose.Types.ObjectId(doc._id).getTimestamp();
        await Model.updateOne({ _id: doc._id }, { $set: { createdAt: fallbackDate } }, { session });
        fixedCount += 1;
      }
    }

    await session.commitTransaction();
    console.log(`✅ ${modelName}: Fixed createdAt for ${fixedCount} document(s).`);
  } catch (err) {
    await session.abortTransaction();
    console.error(`❌ ${modelName}: Failed to fix createdAt`, err);
  } finally {
    session.endSession();
  }
}

async function main() {
  try {
    await connectDB();
    // Fix Users
    await fixCollectionCreatedAt(User, 'User');
    // Optionally fix Posts as well
    await fixCollectionCreatedAt(Post, 'Post');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.connection.close();
    console.log('🔚 Migration complete, connection closed.');
  }
}

main();
