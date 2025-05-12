import express from 'express';
import VideoController from '../../controllers/VideoController.js';
import VideoMetadataManager from '../../models/Video/VideoMetadataManager.js';
import { FileProcessor } from '../../models/Video/FileProcessor.js';

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
 * @route GET /api/previews
 * @description Get video previews with thumbnails and streaming URLs
 * @access Public
 */
router.get('/', async (req, res) => {
  await videoController.getVideoPreviews(req, res);
});

export default router; 