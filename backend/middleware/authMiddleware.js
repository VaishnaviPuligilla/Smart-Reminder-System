import { verifyToken } from '../utils/tokenService.js';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};
