import mongoose from 'mongoose';
import Report from '../models/Report.js';
import ModerationAction from '../models/ModerationAction.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

// Create a new report
export const createReport = async (req, res) => {
  try {
    const { reportType, reportedItemId, reason, description } = req.body;
    const reporterIdRaw = req.user?.id || req.user?._id;

    // Allow admins to file reports by mapping to a real admin user ObjectId if provided
    let reporterId = reporterIdRaw;
    if (!mongoose.Types.ObjectId.isValid(reporterIdRaw)) {
      if (req.user?.isAdmin && process.env.ADMIN_USER_ID && mongoose.Types.ObjectId.isValid(process.env.ADMIN_USER_ID)) {
        reporterId = process.env.ADMIN_USER_ID;
      } else {
        const message = req.user?.isAdmin
          ? 'Admin accounts must use a real admin user ID (set ADMIN_USER_ID) to submit reports.'
          : 'Invalid reporter id';
        return res.status(403).json({ message });
      }
    }

    // Validate reported item id
    if (!mongoose.Types.ObjectId.isValid(reportedItemId)) {
      return res.status(400).json({ message: 'Invalid target id' });
    }

    // Validate report type
    if (!['post', 'user'].includes(reportType)) {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    // Check if item exists
    if (reportType === 'post') {
      const post = await Post.findById(reportedItemId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
    } else if (reportType === 'user') {
      const user = await User.findById(reportedItemId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Check if user has already reported this item
    const existingReport = await Report.findOne({
      reporterId,
      reportType,
      reportedItemId,
      status: { $in: ['pending', 'under_review'] }
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this item' });
    }

    // Set priority based on reason
    let priority = 'medium';
    if (['violence', 'self_harm', 'terrorism', 'hate_speech'].includes(reason)) {
      priority = 'critical';
    } else if (['harassment', 'nudity'].includes(reason)) {
      priority = 'high';
    }

    const report = await Report.create({
      reportType,
      reportedItemId,
      reporterId,
      reason,
      description,
      priority
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all reports (admin only)
export const getAllReports = async (req, res) => {
  try {
    const { status, reportType, priority, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (reportType) query.reportType = reportType;
    if (priority) query.priority = priority;

    const totalReports = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('reporterId', 'name email profilePicture')
      .populate('reviewedBy', 'name email')
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Fetch reported items details
    const reportsWithDetails = await Promise.all(reports.map(async (report) => {
      if (report.reportType === 'post') {
        const post = await Post.findById(report.reportedItemId)
          .populate('user', 'name email profilePicture')
          .lean();
        report.reportedItem = post;
      } else if (report.reportType === 'user') {
        const user = await User.findById(report.reportedItemId)
          .select('name email profilePicture isActive createdAt')
          .lean();
        report.reportedItem = user;
      }
      return report;
    }));

    res.json({
      reports: reportsWithDetails,
      totalReports,
      totalPages: Math.ceil(totalReports / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single report details
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate('reporterId', 'name email profilePicture')
      .populate('reviewedBy', 'name email')
      .lean();

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Fetch reported item details
    if (report.reportType === 'post') {
      const post = await Post.findById(report.reportedItemId)
        .populate('user', 'name email profilePicture')
        .lean();
      report.reportedItem = post;
    } else if (report.reportType === 'user') {
      const user = await User.findById(report.reportedItemId)
        .select('name email profilePicture isActive createdAt')
        .lean();
      report.reportedItem = user;
    }

    // Fetch related moderation actions
    const moderationActions = await ModerationAction.find({ reportId: id })
      .populate('moderatorId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    report.moderationActions = moderationActions;

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to get valid admin ID
const getValidAdminId = async (adminIdRaw) => {
  // Accept hardcoded admin-001 from admin tokens
  if (adminIdRaw === 'admin-001') {
    return adminIdRaw;
  }
  
  // If already a valid ObjectId, return it
  if (mongoose.Types.ObjectId.isValid(adminIdRaw)) {
    return adminIdRaw;
  }
  
  // If ADMIN_USER_ID is set in env, use it
  if (process.env.ADMIN_USER_ID && mongoose.Types.ObjectId.isValid(process.env.ADMIN_USER_ID)) {
    return process.env.ADMIN_USER_ID;
  }
  
  // If no valid admin ID found, return null
  return null;
};

// Update report status
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    const adminIdRaw = req.user.id;

    // Get valid admin ID (from token, env, or database)
    const adminId = await getValidAdminId(adminIdRaw);
    if (!adminId) {
      return res.status(403).json({ message: 'No admin user found. Please create an admin account first.' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    if (resolution) report.resolution = resolution;
    
    if (['under_review', 'resolved', 'dismissed'].includes(status)) {
      // Only set reviewedBy if adminId is a valid ObjectId (not hardcoded admin-001)
      if (mongoose.Types.ObjectId.isValid(adminId)) {
        report.reviewedBy = adminId;
      }
      report.reviewedAt = new Date();
    }

    await report.save();

    res.json({
      message: 'Report status updated successfully',
      report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Take moderation action
export const takeModerationAction = async (req, res) => {
  try {
    const { reportId, actionType, targetType, targetId, reason, duration } = req.body;
    const moderatorIdRaw = req.user.id;
    const Notification = (await import('../models/Notification.js')).default;

    // Get valid moderator ID (from token, env, or database)
    const moderatorId = await getValidAdminId(moderatorIdRaw);
    if (!moderatorId) {
      return res.status(403).json({ message: 'No admin user found. Please create an admin account first.' });
    }

    // Check if action already taken on this report
    if (reportId) {
      const existingActions = await ModerationAction.find({ reportId }).sort({ createdAt: -1 });
      if (existingActions.length > 0) {
        return res.status(400).json({ 
          message: 'A moderation action has already been taken on this report. Cannot take multiple actions on the same report.' 
        });
      }
    }

    // Calculate expiration date if duration is provided
    let expiresAt = null;
    if (duration) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(duration));
    }

    // Store metadata for context
    let metadata = {};
    let notificationMessage = '';
    let affectedUserId = null;

    // Perform the action
    switch (actionType) {
      case 'delete_post':
        const post = await Post.findById(targetId);
        if (post) {
          affectedUserId = post.user; // post.user is the author's ObjectId
          metadata = {
            content: post.content,
            user: post.user,
            createdAt: post.createdAt
          };
          notificationMessage = `Your post was removed by our moderation team. Reason: ${reason}`;
          await Post.findByIdAndDelete(targetId);
        }
        break;

      case 'warn_user':
        const warnedUser = await User.findById(targetId);
        if (warnedUser) {
          affectedUserId = targetId;
          metadata = {
            name: warnedUser.name,
            email: warnedUser.email
          };
          notificationMessage = `You've received a warning from our moderation team. Reason: ${reason}. Please review our community guidelines.`;
        }
        break;

      case 'suspend_user':
        const suspendedUser = await User.findById(targetId);
        if (suspendedUser) {
          affectedUserId = targetId;
          metadata = {
            name: suspendedUser.name,
            email: suspendedUser.email,
            previousStatus: suspendedUser.isActive
          };
          notificationMessage = `Your account has been suspended. Reason: ${reason}. Duration: ${duration} days.`;
          suspendedUser.isActive = false;
          await suspendedUser.save();
        }
        break;

      case 'ban_user':
        const bannedUser = await User.findById(targetId);
        if (bannedUser) {
          affectedUserId = targetId;
          metadata = {
            name: bannedUser.name,
            email: bannedUser.email,
            previousStatus: bannedUser.isActive
          };
          notificationMessage = `Your account has been permanently banned. Reason: ${reason}. If you believe this is a mistake, please contact our support team.`;
          bannedUser.isActive = false;
          await bannedUser.save();
        }
        break;

      case 'unban_user':
        const unbannedUser = await User.findById(targetId);
        if (unbannedUser) {
          affectedUserId = targetId;
          metadata = {
            name: unbannedUser.name,
            email: unbannedUser.email
          };
          notificationMessage = `Your account ban has been lifted. Welcome back!`;
          unbannedUser.isActive = true;
          await unbannedUser.save();
        }
        break;

      case 'unrestrict_posting':
        const unrestrictedUser = await User.findById(targetId);
        if (unrestrictedUser) {
          affectedUserId = targetId;
          metadata = {
            name: unrestrictedUser.name,
            email: unrestrictedUser.email
          };
          notificationMessage = `Your posting restrictions have been removed. You can now post again.`;
          unrestrictedUser.isActive = true;
          await unrestrictedUser.save();
        }
        break;
    }

    // Create moderation action record
    const moderationAction = await ModerationAction.create({
      actionType,
      targetType,
      targetId,
      // Only set moderatorId if it's a valid ObjectId (not hardcoded admin-001)
      moderatorId: mongoose.Types.ObjectId.isValid(moderatorId) ? moderatorId : null,
      reportId: reportId || null,
      reason,
      duration: duration || null,
      expiresAt,
      metadata
    });

    // Send notification to affected user
    if (affectedUserId && notificationMessage) {
      await Notification.create({
        recipient: affectedUserId,
        sender: moderatorId && mongoose.Types.ObjectId.isValid(moderatorId) ? moderatorId : new mongoose.Types.ObjectId(),
        type: 'moderation_action',
        message: notificationMessage,
        read: false
      });
    }

    // Update report status if this action is related to a report
    if (reportId) {
      const updateData = {
        status: 'resolved',
        reviewedAt: new Date(),
        resolution: `Action taken: ${actionType}`
      };
      
      // Only set reviewedBy if moderatorId is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(moderatorId)) {
        updateData.reviewedBy = moderatorId;
      }
      
      await Report.findByIdAndUpdate(reportId, updateData);
    }

    res.json({
      message: 'Moderation action completed successfully',
      action: moderationAction
    });
  } catch (error) {
    console.error('Error taking moderation action:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get moderation history
export const getModerationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, actionType, targetType } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (actionType) query.actionType = actionType;
    if (targetType) query.targetType = targetType;

    const totalActions = await ModerationAction.countDocuments(query);
    const actions = await ModerationAction.find(query)
      .populate('moderatorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    res.json({
      actions,
      totalActions,
      totalPages: Math.ceil(totalActions / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching moderation history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get report statistics
export const getReportStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const underReviewReports = await Report.countDocuments({ status: 'under_review' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const dismissedReports = await Report.countDocuments({ status: 'dismissed' });

    const postReports = await Report.countDocuments({ reportType: 'post' });
    const userReports = await Report.countDocuments({ reportType: 'user' });

    const criticalReports = await Report.countDocuments({ priority: 'critical', status: 'pending' });
    const highPriorityReports = await Report.countDocuments({ priority: 'high', status: 'pending' });

    // Reports in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const reportsLast24h = await Report.countDocuments({
      createdAt: { $gte: yesterday }
    });

    res.json({
      totalReports,
      pendingReports,
      underReviewReports,
      resolvedReports,
      dismissedReports,
      postReports,
      userReports,
      criticalReports,
      highPriorityReports,
      reportsLast24h
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Cleanup duplicate moderation actions - keep only latest for each report
export const cleanupDuplicateActions = async (req, res) => {
  try {
    // Find all reports that have moderation actions
    const reports = await Report.find();
    let deletedCount = 0;

    for (const report of reports) {
      const actions = await ModerationAction.find({ reportId: report._id }).sort({ createdAt: -1 });
      
      // If more than 1 action for this report, delete all but the latest
      if (actions.length > 1) {
        const latestAction = actions[0];
        const oldActions = actions.slice(1);
        
        for (const oldAction of oldActions) {
          await ModerationAction.findByIdAndDelete(oldAction._id);
          deletedCount++;
        }
      }
    }

    res.json({
      message: `Cleanup complete. Deleted ${deletedCount} duplicate moderation actions.`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up duplicate actions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};