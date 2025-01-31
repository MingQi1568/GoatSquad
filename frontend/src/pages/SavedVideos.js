import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import PageTransition from '../components/PageTransition';
import { toast } from 'react-hot-toast';
import TranslatedText from '../components/TranslatedText';

function SavedVideos() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);
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

  const handleVideoPreview = (videoId) => {
    if (playingVideo === videoId) {
      setPlayingVideo(null);
    } else {
      setPlayingVideo(videoId);
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
                <div className="relative aspect-video group">
                  <video
                    className="w-full h-full object-cover"
                    src={video.videoUrl}
                    poster="https://via.placeholder.com/768x432.png?text=Video+Thumbnail"
                    controls={playingVideo === video.id}
                    autoPlay={playingVideo === video.id}
                    onEnded={() => setPlayingVideo(null)}
                  />
                  <div 
                    className={`absolute inset-0 flex items-center justify-center 
                      ${playingVideo === video.id ? 'hidden' : 'group-hover:bg-black/50'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoPreview(video.id);
                    }}
                  >
                    <button
                      className={`p-3 rounded-full bg-white/90 text-gray-900 
                        opacity-0 group-hover:opacity-100 transition-opacity
                        hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {playingVideo === video.id ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveVideo(video.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full
                             hover:bg-red-600 transition-colors z-10"
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