const AuthService = require('../lib/auth');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = AuthService.verifyToken(token);
    
    // Get user from database
    const user = await AuthService.getUserById(decoded.userId);
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

module.exports = authMiddleware; 