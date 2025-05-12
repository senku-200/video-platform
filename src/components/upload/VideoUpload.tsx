'use client';

import { useState, useRef, DragEvent, ChangeEvent, FormEvent } from 'react';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface UploadFormData {
  title: string;
  description: string;
  category: string;
  quality: 'low' | 'medium' | 'high';
  processingType: 'streaming' | 'convert';
}

export default function VideoUpload() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    category: 'uncategorized',
    quality: 'medium',
    processingType: 'streaming'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, title: file.name }));
      setError(null);
    } else {
      setError('Please upload a valid video file');
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      setFormData(prev => ({ ...prev, title: file.name }));
      setError(null);
    } else {
      setError('Please upload a valid video file');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to upload videos');
      router.push('/login');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formDataToSend = new FormData();
    formDataToSend.append('videoFile', selectedFile);
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });

    try {
      const response = await fetch('http://localhost:3000/api/v1/upload', {
        method: 'POST',
        headers: {
          'Authorization': token, // Send token directly as the backend expects
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token'); // Clear invalid token
          router.push('/login');
          throw new Error('Please log in to upload videos');
        }
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess('Video uploaded successfully!');
      handleRemoveFile();
      setFormData({
        title: '',
        description: '',
        category: 'uncategorized',
        quality: 'medium',
        processingType: 'streaming'
      });

      // Redirect to home page after successful upload
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upload Video</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${selectedFile ? 'bg-gray-50' : 'hover:bg-gray-50'}
            transition-colors duration-200
            cursor-pointer
            relative
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="video/*"
            className="hidden"
          />
          
          <div className="text-center">
            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-900">Drag and drop your video here or click to browse</p>
                <p className="text-sm text-gray-500">Supported formats: MP4, AVI, MOV, MKV, WEBM</p>
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="uncategorized">Uncategorized</option>
                <option value="education">Education</option>
                <option value="entertainment">Entertainment</option>
                <option value="gaming">Gaming</option>
                <option value="music">Music</option>
                <option value="tech">Tech</option>
              </select>
            </div>

            <div>
              <label htmlFor="quality" className="block text-sm font-medium text-gray-700">
                Quality
              </label>
              <select
                id="quality"
                name="quality"
                value={formData.quality}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="processingType" className="block text-sm font-medium text-gray-700">
                Processing Type
              </label>
              <select
                id="processingType"
                name="processingType"
                value={formData.processingType}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="streaming">Streaming (HLS)</option>
                <option value="convert">Convert (MP4)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 text-center">{uploadProgress}% uploaded</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedFile || isUploading}
          className={`
            w-full py-3 px-4 rounded-md text-white font-medium
            ${!selectedFile || isUploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'}
            transition-colors duration-200
          `}
        >
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
    </div>
  );
} 