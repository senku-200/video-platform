import VideoMetadataManager from '../models/Video/VideoMetadataManager.js';
import { FileProcessor, processingOptions } from '../models/Video/FileProcessor.js';
import path from 'path';
import fs from 'fs';

class VideoController {
  /**
   * Constructor for VideoController
   * @param {VideoMetadataManager} metadataManager - Instance of VideoMetadataManager
   * @param {FileProcessor} fileProcessor - Instance of FileProcessor
   * @param {Object} config - Configuration object
   */
  constructor(metadataManager, fileProcessor, config) {
    this.metadataManager = metadataManager;
    this.fileProcessor = fileProcessor;
    this.config = config;
  }

  /**
   * Handle video upload and processing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async uploadVideo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file uploaded' });
      }

      const uploadedFile = req.file;
      const fileExt = path.extname(uploadedFile.originalname).toLowerCase();
      
      // Check if the file is a video
      const supportedVideoFormats = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
      if (!supportedVideoFormats.includes(fileExt)) {
        fs.unlinkSync(uploadedFile.path); // Delete the invalid file
        return res.status(400).json({ error: 'Unsupported file format. Please upload a video file.' });
      }
      
      // Create a unique video ID from the filename without extension
      const videoId = path.parse(uploadedFile.filename).name;
      
      // Get video information and metadata from request
      const { 
        title = uploadedFile.originalname, 
        description = '', 
        category = 'uncategorized',
        uploaderId = req.userId, // Get from auth middleware
        quality = 'medium', // low, medium, high
        processingType = 'streaming' // streaming or convert
      } = req.body;
      
      // Setup paths and processing options
      let outputPath;
      let outputFormat;
      let processOptions;
      
      // Configure output based on processing type and quality
      if (processingType === 'streaming') {
        // For streaming, create HLS format
        const streamingDir = this.fileProcessor.setupStreamingDirectory(videoId);
        outputPath = path.join(streamingDir, 'playlist.m3u8');
        outputFormat = 'hls';
        processOptions = [...processingOptions.streaming.hls];
        // Add segment filename pattern
        processOptions.push(path.join(streamingDir, 'segment_%03d.ts'));
      } else {
        // For regular conversion
        const qualityMap = {
          'low': 'toMp4Low',
          'medium': 'toMp4Medium', 
          'high': 'toMp4High'
        };
        
        const format = qualityMap[quality] || 'toMp4Medium';
        outputPath = path.join(this.config.processedDir, `${videoId}.mp4`);
        outputFormat = format;
        processOptions = [...processingOptions.convert.video[format]];
      }
      
      // Start processing
      console.log(`Processing video ${videoId} with options:`, {
        processingType,
        quality,
        outputFormat
      });
      
      // Process the file
      await this.fileProcessor.processFile(uploadedFile.path, outputPath, processOptions);
      
      // Generate thumbnail
      let thumbnailPath = '';
      try {
        thumbnailPath = await this.fileProcessor.generateThumbnail(uploadedFile.path, videoId);
        console.log(`Thumbnail generated at ${thumbnailPath}`);
      } catch (err) {
        console.error('Thumbnail generation failed:', err);
      }
      
      // Calculate streaming URL
      let streamingUrl;
      if (processingType === 'streaming') {
        streamingUrl = `/api/v1/stream/${videoId}/playlist.m3u8`;
      } else {
        streamingUrl = `/api/v1/videos/${videoId}`;
      }
      
      // Create metadata
      const metadata = {
        videoId,
        title,
        description,
        category,
        uploaderId,
        uploadTimestamp: new Date().toISOString(),
        processingType,
        quality,
        duration: 0, // We'll extract this in a future enhancement
        fileSize: uploadedFile.size,
        originalFilename: uploadedFile.originalname,
        streamingUrl,
        thumbnailUrl: thumbnailPath ? `/api/v1/thumbnails/${videoId}.jpg` : null,
        views: 0,
        likes: 0,
        status: 'available'
      };
      
      // Save metadata
      await this.metadataManager.setVideoMetadata(videoId, metadata);
      
      // Optionally delete the original file to save space
      if (req.body.deleteOriginal === 'true') {
        fs.unlinkSync(uploadedFile.path);
      }
      
      res.json({
        success: true,
        message: 'Video processed successfully',
        videoId,
        metadata,
        streamingUrl
      });
    } catch (error) {
      console.error('Error processing video:', error);
      res.status(500).json({ error: 'Failed to process video', details: error.message });
    }
  }

  /**
   * Get video previews with thumbnails and streaming URLs
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getVideoPreviews(req, res) {
    try {
      const { 
        page = 1,
        limit = 12,
        category,
        sort = 'latest' // 'latest', 'popular', 'trending'
      } = req.query;

      // Get all videos and apply filters
      let videos = await this.metadataManager.getAllVideos();

      // Apply category filter if specified
      if (category) {
        videos = videos.filter(video => video.category === category);
      }

      // Apply sorting
      switch (sort) {
        case 'popular':
          videos.sort((a, b) => b.views - a.views);
          break;
        case 'trending':
          // Calculate trending score based on recent views and upload date
          const now = Date.now();
          const DAY_MS = 24 * 60 * 60 * 1000;
          videos.sort((a, b) => {
            const aAge = (now - new Date(a.uploadTimestamp).getTime()) / DAY_MS;
            const bAge = (now - new Date(b.uploadTimestamp).getTime()) / DAY_MS;
            // Score = (views + likes*2) / age^0.5
            const aScore = (a.views + a.likes * 2) / Math.sqrt(aAge + 1);
            const bScore = (b.views + b.likes * 2) / Math.sqrt(bAge + 1);
            return bScore - aScore;
          });
          break;
        case 'latest':
        default:
          videos.sort((a, b) => 
            new Date(b.uploadTimestamp) - new Date(a.uploadTimestamp)
          );
          break;
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const totalVideos = videos.length;
      const paginatedVideos = videos.slice(startIndex, endIndex);

      // Format preview data
      const previews = paginatedVideos.map(video => ({
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        thumbnailUrl: `/api/v1/thumbnails/${video.videoId}.jpg`,
        streamingUrl: video.processingType === 'streaming' 
          ? `/api/v1/stream/${video.videoId}/playlist.m3u8`
          : `/api/v1/videos/${video.videoId}`,
        duration: video.duration,
        views: video.views,
        likes: video.likes,
        uploaderId: video.uploaderId,
        uploaderName: video.uploaderName || 'Anonymous',
        uploadTimestamp: video.uploadTimestamp,
        category: video.category,
        quality: video.quality,
        format: video.processingType === 'streaming' ? 'HLS' : 'MP4'
      }));

      res.json({
        success: true,
        data: {
          videos: previews,
          pagination: {
            total: totalVideos,
            page: parseInt(page),
            totalPages: Math.ceil(totalVideos / limit),
            hasMore: endIndex < totalVideos
          }
        }
      });
    } catch (error) {
      console.error('Error getting video previews:', error);
      res.status(500).json({ 
        error: 'Failed to get video previews', 
        details: error.message 
      });
    }
  }

  // ... rest of the controller methods remain the same ...
}

export default VideoController; 