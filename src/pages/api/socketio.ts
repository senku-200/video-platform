import { NextApiRequest } from 'next';
import { initSocket, NextApiResponseWithSocket } from '@/lib/socket';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket,
) {
  if (req.method === 'GET') {
    initSocket(req, res);
    res.end();
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 