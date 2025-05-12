import express from 'express';
import VideoController from '../../../controllers/VideoController.js';
import VideoMetadataManager from '../../../models/Video/VideoMetadataManager.js';
import { FileProcessor } from '../../../models/Video/FileProcessor.js';

const router = express.Router();

// Initialize components
const config = {
  processedDir: './public/processed',
  thumbnailsDir: './public/thumbnails'
};

const metadataManager = new VideoMetadataManager();
const fileProcessor = new FileProcessor(config);
const videoController = new VideoController(metadataManager, fileProcessor, config);

/**
 * @route GET /api/v1/previews
 * @description Get video previews with pagination and filtering
 * @access Public
 */
router.get('/', async (req, res) => {
  await videoController.getVideoPreviews(req, res);
});

export const transformApiUrl = (url: string): string => {
  if (url.startsWith('http')) {
    return url;
  }
  // Login and Register go to /api/login and /api/register
  if (url === '/login' || url === '/register') {
    return `http://localhost:3000/api${url}`;
  }
  // If already starts with /api/v1, just prepend host
  if (url.startsWith('/api/v1/')) {
    return `http://localhost:3000${url}`;
  }
  // If starts with /api/, replace with /api/v1/
  if (url.startsWith('/api/')) {
    return `http://localhost:3000/api/v1${url.substring(4)}`;
  }
  // For all other API calls, prefix with /api/v1/
  return `http://localhost:3000/api/v1${url.startsWith('/') ? url : '/' + url}`;
};

export default router; 