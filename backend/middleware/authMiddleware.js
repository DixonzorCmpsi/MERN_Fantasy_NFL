import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password'); // attach user
      next();
    } catch (err) {
      console.error("JWT verification failed:", err);
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }
  } else {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
};
