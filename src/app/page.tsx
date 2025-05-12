'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { 
  isAuthenticated, 
  authenticatedFetch, 
  transformApiUrl 
} from '@/utils/auth';
import { useRouter } from 'next/navigation';

interface VideoPreview {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  streamingUrl: string;
  duration: number;
  views: number;
  uploadTimestamp: string;
}

interface PreviewResponse {
  total: number;
  offset: number;
  limit: number;
  previews: VideoPreview[];
}

export default function Home() {
  const [videos, setVideos] = useState<VideoPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await authenticatedFetch('/api/v1/previews');
        
        if (response.status === 401) {
          // If unauthorized, redirect to login
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }

        const data: PreviewResponse = await response.json();
        // Transform URLs to include base URL
        const updatedPreviews = data.previews.map(preview => ({
          ...preview,
          thumbnailUrl: transformApiUrl(preview.thumbnailUrl),
          streamingUrl: transformApiUrl(preview.streamingUrl)
        }));
        setVideos(updatedPreviews);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.refresh();
    router.push('/login');
  };

  return (
    <main>
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid px-4">
          <Link href="/" className="navbar-brand">Video Platform</Link>
          <div className="d-flex">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link href="/upload" className="nav-link">Upload</Link>
              </li>
              <li className="nav-item">
                <Link href="/video-chat" className="nav-link">Video Chat</Link>
              </li>
              {isAuthenticated() ? (
                <li className="nav-item">
                  <button 
                    className="nav-link border-0 bg-transparent" 
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              ) : (
                <li className="nav-item">
                  <Link href="/login" className="nav-link">Login</Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <div className="container-fluid px-4">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4">Share Your Videos</h1>
              <p className="lead">Upload, share, and discover amazing videos from creators around the world.</p>
              <Link href="/upload" className="btn btn-light btn-lg">Start Uploading</Link>
            </div>
            <div className="col-lg-6">
              {videos[0] && (
                <div className="video-preview rounded overflow-hidden">
                  <Link href={`/watch/${videos[0].videoId}`}>
                    <img
                      src={videos[0].thumbnailUrl}
                      alt={videos[0].title}
                      className="w-100 h-auto"
                    />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Videos Section */}
      <div className="container-fluid px-4 py-5">
        <h2 className="mb-4">Featured Videos</h2>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="row g-4">
          {videos.map((video) => (
            <div key={video.videoId} className="col-md-3">
              <div className="card h-100">
                <Link href={`/watch/${video.videoId}`} className="position-relative">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="card-img-top"
                    style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                  />
                  {video.duration > 0 && (
                    <span className="position-absolute bottom-0 end-0 bg-dark text-white px-2 py-1 m-2 rounded small">
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </Link>
                <div className="card-body">
                  <h5 className="card-title line-clamp-2">
                    <Link href={`/watch/${video.videoId}`} className="text-decoration-none text-dark">
                      {video.title}
                    </Link>
                  </h5>
                  <div className="d-flex justify-content-between text-muted small">
                    <span>{video.views} views</span>
                    <span>{formatDistanceToNow(new Date(video.uploadTimestamp))} ago</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {videos.length === 0 && !loading && !error && (
          <div className="text-center py-5">
            <p className="text-muted">No videos found</p>
          </div>
        )}
      </div>
    </main>
  );
}
