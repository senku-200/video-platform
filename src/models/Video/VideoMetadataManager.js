class VideoMetadataManager {
  constructor() {
    this.videos = new Map();
    this.categoryStats = new Map();
  }

  /**
   * Set metadata for a video
   * @param {string} videoId 
   * @param {Object} metadata 
   */
  async setVideoMetadata(videoId, metadata) {
    this.videos.set(videoId, metadata);
    
    // Update category statistics
    const category = metadata.category || 'uncategorized';
    const currentCount = this.categoryStats.get(category) || 0;
    this.categoryStats.set(category, currentCount + 1);
  }

  /**
   * Get metadata for a specific video
   * @param {string} videoId 
   * @returns {Object|null}
   */
  getVideoMetadata(videoId) {
    return this.videos.get(videoId) || null;
  }

  /**
   * Get all videos with optional filtering
   * @param {Object} filters 
   * @returns {Array}
   */
  getAllVideos(filters = {}) {
    let videos = Array.from(this.videos.values());

    // Apply filters
    if (filters.category) {
      videos = videos.filter(video => video.category === filters.category);
    }
    if (filters.uploaderId) {
      videos = videos.filter(video => video.uploaderId === filters.uploaderId);
    }

    // Sort by upload date (newest first)
    return videos.sort((a, b) => 
      new Date(b.uploadTimestamp) - new Date(a.uploadTimestamp)
    );
  }

  /**
   * Search videos by title or description
   * @param {string} query 
   * @returns {Array}
   */
  searchVideos(query) {
    const searchTerm = query.toLowerCase();
    return Array.from(this.videos.values()).filter(video => 
      video.title.toLowerCase().includes(searchTerm) ||
      video.description.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Update video metadata
   * @param {string} videoId 
   * @param {Object} updates 
   * @returns {Object}
   */
  updateVideoMetadata(videoId, updates) {
    const video = this.videos.get(videoId);
    if (!video) return null;

    // If category is being updated, update category stats
    if (updates.category && updates.category !== video.category) {
      const oldCount = this.categoryStats.get(video.category) || 0;
      const newCount = this.categoryStats.get(updates.category) || 0;
      
      this.categoryStats.set(video.category, Math.max(0, oldCount - 1));
      this.categoryStats.set(updates.category, newCount + 1);
    }

    const updatedMetadata = { ...video, ...updates };
    this.videos.set(videoId, updatedMetadata);
    return updatedMetadata;
  }

  /**
   * Delete video metadata
   * @param {string} videoId 
   */
  deleteVideoMetadata(videoId) {
    const video = this.videos.get(videoId);
    if (video) {
      // Update category stats
      const category = video.category || 'uncategorized';
      const currentCount = this.categoryStats.get(category) || 0;
      this.categoryStats.set(category, Math.max(0, currentCount - 1));

      this.videos.delete(videoId);
    }
  }

  /**
   * Get category statistics
   * @returns {Object}
   */
  getCategories() {
    const categories = {};
    for (const [category, count] of this.categoryStats) {
      categories[category] = count;
    }
    return categories;
  }

  /**
   * Get featured/recommended videos
   * @param {number} limit 
   * @returns {Array}
   */
  getFeaturedVideos(limit = 5) {
    return Array.from(this.videos.values())
      .sort((a, b) => (b.views + b.likes) - (a.views + a.likes))
      .slice(0, limit);
  }

  /**
   * Increment view count for a video
   * @param {string} videoId 
   */
  incrementViews(videoId) {
    const video = this.videos.get(videoId);
    if (video) {
      video.views += 1;
      this.videos.set(videoId, video);
    }
  }
}

export default VideoMetadataManager; 