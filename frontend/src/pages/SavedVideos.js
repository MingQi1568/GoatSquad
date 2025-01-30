import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import PageTransition from '../components/PageTransition';
import { toast } from 'react-hot-toast';
import TranslatedText from '../components/TranslatedText';

function SavedVideos() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadSavedVideos();
  }, []);

  const loadSavedVideos = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getSavedVideos();
      if (response.success) {
        setVideos(response.videos);
      }
    } catch (error) {
      console.error('Error loading saved videos:', error);
      toast.error('Failed to load saved videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    try {
      const response = await userService.removeSavedVideo(videoId);
      if (response.success) {
        setVideos(videos.filter(video => video.id !== videoId));
        toast.success('Video removed successfully');
      }
    } catch (error) {
      console.error('Error removing video:', error);
      toast.error('Failed to remove video');
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            <TranslatedText text="Saved Videos" />
          </h1>
          <span className="text-gray-600 dark:text-gray-400">
            {videos.length} <TranslatedText text="videos" />
          </span>
        </div>

        {videos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              <TranslatedText text="No saved videos yet." />
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden
                         transition-transform hover:-translate-y-1 duration-200"
              >
                <div className="relative">
                  <video
                    className="w-full h-48 object-cover"
                    poster="https://via.placeholder.com/768x432.png?text=Video+Thumbnail"
                  >
                    <source src={video.videoUrl} type="video/mp4" />
                  </video>
                  <button
                    onClick={() => handleRemoveVideo(video.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full
                             hover:bg-red-600 transition-colors"
                    title="Remove video"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => window.open(video.videoUrl, '_blank')}
                    className="mt-3 w-full bg-blue-500 text-white py-2 px-4 rounded
                             hover:bg-blue-600 transition-colors"
                  >
                    <TranslatedText text="Watch Video" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default SavedVideos; 