import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import Story from '../models/Story.js';
import Conversation from '../models/Conversation.js';
import GroupConversation from '../models/GroupConversation.js';
// Note: Connection.js is a DB connector, not a Mongoose model. Do not import here.
import Notification from '../models/Notification.js';
import AdminSettings from '../models/AdminSettings.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export database to JSON
export const exportDatabase = async (req, res) => {
  try {
    const data = {
      users: await User.find({}).select('-password'),
      posts: await Post.find({}),
      messages: await Message.find({}),
      stories: await Story.find({}),
      conversations: await Conversation.find({}),
      groupConversations: await GroupConversation.find({}),
      // connections: not a collection in this codebase
      notifications: await Notification.find({}),
      adminSettings: await AdminSettings.find({}),
      exportDate: new Date(),
      version: '1.0'
    };

    // Set headers for file download (pretty-printed JSON)
    const filename = `database-export-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    // Send pretty-printed JSON for readability
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error exporting database:', error);
    res.status(500).json({ message: 'Failed to export database', error: error.message });
  }
};

// Create backup
export const createBackup = async (req, res) => {
  const backupDir = path.join(__dirname, '..', 'backups');
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  
  // On Windows, use JSON backup by default (mongodump not typically installed)
  const isWindows = process.platform === 'win32';
  const useMongoTools = process.env.ENABLE_MONGOTOOLS === 'true';

  if (!isWindows && useMongoTools) {
    // Try mongodump on non-Windows systems when explicitly enabled
    try {
      const backupPath = path.join(backupDir, `backup-${timestamp}`);
      const dbName = process.env.MONGODB_URI?.split('/').pop()?.split('?')[0] || 'mern-social';
      
      const command = process.env.MONGODB_URI 
        ? `mongodump --uri="${process.env.MONGODB_URI}" --out="${backupPath}"`
        : `mongodump --db=${dbName} --out="${backupPath}"`;

      await execAsync(command);

      // Get backup size (directory)
      const getDirSize = (dir) => {
        let total = 0;
        const entries = fs.readdirSync(dir);
        entries.forEach((entry) => {
          const full = path.join(dir, entry);
          const stat = fs.statSync(full);
          if (stat.isDirectory()) total += getDirSize(full);
          else total += stat.size;
        });
        return total;
      };

      return res.json({ 
        message: 'Backup created successfully', 
        backup: {
          path: backupPath,
          timestamp: new Date(),
          size: getDirSize(backupPath),
          name: `backup-${timestamp}`
        }
      });
    } catch (error) {
      console.error('Mongodump failed, falling back to JSON:', error);
    }
  }

  // Default: Create JSON backup (works everywhere, no external tools needed)
  try {
    const data = {
      users: await User.find({}).select('-password'),
      posts: await Post.find({}),
      messages: await Message.find({}),
      stories: await Story.find({}),
      conversations: await Conversation.find({}),
      groupConversations: await GroupConversation.find({}),
      // connections: not a collection in this codebase
      notifications: await Notification.find({}),
      adminSettings: await AdminSettings.find({}),
      backupDate: new Date(),
      version: '1.0'
    };

    const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
    
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

    res.json({ 
      message: 'Backup created successfully (JSON format)', 
      backup: { 
        path: backupPath, 
        timestamp: new Date(),
        size: fs.statSync(backupPath).size,
        name: `backup-${timestamp}.json`
      } 
    });
  } catch (error) {
    console.error('Failed to create backup:', error);
    res.status(500).json({ message: 'Failed to create backup', error: error.message });
  }
};

// List all backups
export const listBackups = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      return res.json({ backups: [] });
    }

    const files = fs.readdirSync(backupDir);
    const backups = files.map(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        name: file,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    }).sort((a, b) => b.created - a.created);

    res.json({ backups });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ message: 'Failed to list backups', error: error.message });
  }
};

// Restore backup
export const restoreBackup = async (req, res) => {
  try {
    const { backupName } = req.body;
    
    if (!backupName) {
      return res.status(400).json({ message: 'Backup name is required' });
    }

    const backupDir = path.join(__dirname, '..', 'backups');
    const backupPath = path.join(backupDir, backupName);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    // Check if it's a JSON backup
    if (backupName.endsWith('.json')) {
      const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      // Clear existing data
      await Promise.all([
        User.deleteMany({}),
        Post.deleteMany({}),
        Story.deleteMany({}),
        Conversation.deleteMany({}),
        GroupConversation.deleteMany({}),
        Notification.deleteMany({}),
        AdminSettings.deleteMany({})
      ]);

      // Restore data
      if (data.users?.length) await User.insertMany(data.users);
      if (data.posts?.length) await Post.insertMany(data.posts);
      if (data.messages?.length) await Message.insertMany(data.messages);
      if (data.stories?.length) await Story.insertMany(data.stories);
      if (data.conversations?.length) await Conversation.insertMany(data.conversations);
      if (data.groupConversations?.length) await GroupConversation.insertMany(data.groupConversations);
      // No connections collection to restore
      if (data.notifications?.length) await Notification.insertMany(data.notifications);
      if (data.adminSettings?.length) await AdminSettings.insertMany(data.adminSettings);

      res.json({ message: 'Backup restored successfully from JSON' });
    } else {
      // Use mongorestore for directory backups
      const dbName = process.env.MONGODB_URI?.split('/').pop()?.split('?')[0] || 'mern-social';
      const command = process.env.MONGODB_URI 
        ? `mongorestore --uri="${process.env.MONGODB_URI}" --drop "${backupPath}/${dbName}"`
        : `mongorestore --db=${dbName} --drop "${backupPath}/${dbName}"`;

      await execAsync(command);
      res.json({ message: 'Backup restored successfully' });
    }
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ message: 'Failed to restore backup', error: error.message });
  }
};

// Delete backup
export const deleteBackup = async (req, res) => {
  try {
    const { backupName } = req.body;
    
    if (!backupName) {
      return res.status(400).json({ message: 'Backup name is required' });
    }

    const backupDir = path.join(__dirname, '..', 'backups');
    const backupPath = path.join(backupDir, backupName);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ message: 'Backup not found' });
    }

    // Delete file or directory
    if (fs.lstatSync(backupPath).isDirectory()) {
      fs.rmSync(backupPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(backupPath);
    }

    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ message: 'Failed to delete backup', error: error.message });
  }
};
