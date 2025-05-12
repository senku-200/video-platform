import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

// Video processing options for different quality levels and formats
export const processingOptions = {
  streaming: {
    hls: [
      '-c:v', 'libx264',      // Video codec
      '-c:a', 'aac',          // Audio codec
      '-hls_time', '10',      // Duration of each segment
      '-hls_list_size', '0',  // Keep all segments
      '-f', 'hls',            // HLS format
      '-hls_segment_filename', // Segment naming pattern
    ]
  },
  convert: {
    video: {
      toMp4Low: [
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '28',         // Lower quality
        '-vf', 'scale=-2:480',// 480p
        '-c:a', 'aac',
        '-b:a', '128k'
      ],
      toMp4Medium: [
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',         // Medium quality
        '-vf', 'scale=-2:720',// 720p
        '-c:a', 'aac',
        '-b:a', '192k'
      ],
      toMp4High: [
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '18',         // High quality
        '-vf', 'scale=-2:1080',// 1080p
        '-c:a', 'aac',
        '-b:a', '256k'
      ]
    }
  }
};

export class FileProcessor {
  constructor(config) {
    this.config = config;
  }

  /**
   * Set up directory for streaming files
   * @param {string} videoId 
   * @returns {string} Directory path
   */
  setupStreamingDirectory(videoId) {
    const streamingDir = path.join(this.config.processedDir, videoId);
    if (!fs.existsSync(streamingDir)) {
      fs.mkdirSync(streamingDir, { recursive: true });
    }
    return streamingDir;
  }

  /**
   * Process video file with given options
   * @param {string} inputPath 
   * @param {string} outputPath 
   * @param {Array} options 
   * @returns {Promise}
   */
  processFile(inputPath, outputPath, options) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath);
      
      // Add all processing options
      if (options && options.length > 0) {
        command.outputOptions(options);
      }

      command
        .on('start', (commandLine) => {
          console.log('Started processing:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing:', Math.floor(progress.percent), '% done');
        })
        .on('end', () => {
          console.log('Processing finished');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error:', err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  /**
   * Generate thumbnail from video
   * @param {string} videoPath 
   * @param {string} videoId 
   * @returns {Promise<string>} Thumbnail path
   */
  async generateThumbnail(videoPath, videoId) {
    const thumbnailPath = path.join(this.config.thumbnailsDir, `${videoId}.jpg`);
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['10%'],
          filename: `${videoId}.jpg`,
          folder: this.config.thumbnailsDir,
          size: '640x360'
        })
        .on('end', () => resolve(thumbnailPath))
        .on('error', (err) => reject(err));
    });
  }

  /**
   * Delete processed files for a video
   * @param {string} videoId 
   * @param {Object} metadata 
   */
  deleteProcessedFiles(videoId, metadata) {
    // Delete streaming directory if exists
    const streamingDir = path.join(this.config.processedDir, videoId);
    if (fs.existsSync(streamingDir)) {
      fs.rmSync(streamingDir, { recursive: true, force: true });
    }

    // Delete MP4 file if exists
    const mp4Path = path.join(this.config.processedDir, `${videoId}.mp4`);
    if (fs.existsSync(mp4Path)) {
      fs.unlinkSync(mp4Path);
    }

    // Delete thumbnail if exists
    const thumbnailPath = path.join(this.config.thumbnailsDir, `${videoId}.jpg`);
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
  }
}

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
  // For all other API calls, prefix with /api/v1/
  return `http://localhost:3000/api/v1${url.startsWith('/') ? url : '/' + url}`;
}; 