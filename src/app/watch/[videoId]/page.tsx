"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authenticatedFetch, transformApiUrl } from "@/utils/auth";

interface VideoDetail {
  videoId: string;
  title: string;
  description: string;
  category: string;
  uploaderId: string;
  uploadTimestamp: string;
  processingType: string;
  quality: string;
  duration: number;
  fileSize: number;
  originalFilename: string;
  streamingUrl: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  status: string;
  lastUpdated: string;
}

export default function VideoDetailPage() {
  const params = useParams() || {};
  const videoId = typeof params.videoId === 'string' ? params.videoId : Array.isArray(params.videoId) ? params.videoId[0] : '';
  const router = useRouter();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;
    const fetchVideo = async () => {
      try {
        const response = await authenticatedFetch(`/api/v1/videos/${videoId}`);
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch video details");
        }
        const data = await response.json();
        setVideo({
          ...data,
          streamingUrl: transformApiUrl(data.streamingUrl),
          thumbnailUrl: transformApiUrl(data.thumbnailUrl),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [videoId, router]);

  if (loading) {
    return <div className="container py-5 text-center">Loading...</div>;
  }
  if (error) {
    return <div className="container py-5 text-danger">{error}</div>;
  }
  if (!video) {
    return <div className="container py-5 text-muted">Video not found</div>;
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8">
          <div className="ratio ratio-16x9 mb-3">
            <video controls poster={video.thumbnailUrl} width="100%" src={video.streamingUrl} />
          </div>
          <h2>{video.title}</h2>
          <p className="text-muted">{video.views} views • Uploaded {new Date(video.uploadTimestamp).toLocaleString()}</p>
          <p>{video.description || <span className="text-muted">No description</span>}</p>
        </div>
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Video Info</h5>
              <ul className="list-unstyled mb-0">
                <li><strong>Category:</strong> {video.category}</li>
                <li><strong>Uploader:</strong> {video.uploaderId}</li>
                <li><strong>Quality:</strong> {video.quality}</li>
                <li><strong>Duration:</strong> {video.duration}s</li>
                <li><strong>File Size:</strong> {video.fileSize} bytes</li>
                <li><strong>Status:</strong> {video.status}</li>
                <li><strong>Last Updated:</strong> {new Date(video.lastUpdated).toLocaleString()}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 