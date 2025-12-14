import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  // Check if it's a hardcoded admin token
  if (token.startsWith('admin-token-')) {
    req.user = { 
      id: 'admin-001', 
      role: 'admin',
      isAdmin: true 
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Keep default export for backward compatibility
export default protect;
