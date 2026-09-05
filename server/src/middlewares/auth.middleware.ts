import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'fallback_secret_eyevengers_2026';

  try {
    const decoded = jwt.verify(token, secret);
    // (req as any).user = decoded; // Can attach user context if needed
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};
