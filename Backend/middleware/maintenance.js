import AdminSettings from '../models/AdminSettings.js';

// Middleware to check if platform is in maintenance mode
export const checkMaintenance = async (req, res, next) => {
  try {
    // Get admin settings
    const settings = await AdminSettings.findOne();
    
    // If no settings or maintenance mode is off, continue
    if (!settings || !settings.maintenanceMode) {
      return next();
    }

    // If maintenance mode is ON, check if user is admin
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
      // Admin can access during maintenance
      return next();
    }

    // Regular users are blocked during maintenance
    return res.status(503).json({ 
      message: 'Platform is currently under maintenance. Please try again later.',
      maintenanceMode: true
    });
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    // If error checking maintenance, allow access
    next();
  }
};
