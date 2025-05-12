import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    // Add other user properties as needed
  };
}

const auth = async (
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const decoded = verify(token, jwtSecret);
    req.user = decoded as { id: string };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export default auth; 