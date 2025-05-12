import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { AuthenticatedRequest } from '@/middleware/auth';
import auth from '@/middleware/auth';
import videoController from '@/controllers/videoController';

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept video files only
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Only video files are allowed'));
    }
    cb(null, true);
  }
});

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser
  },
};

// Helper to run middleware
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: Function) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Run authentication middleware
    await runMiddleware(req, res, auth);

    // Run multer middleware
    await runMiddleware(req, res, upload.single('videoFile'));

    // Handle the upload
    return videoController.uploadVideo(req, res);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Error processing upload' });
  }
} 