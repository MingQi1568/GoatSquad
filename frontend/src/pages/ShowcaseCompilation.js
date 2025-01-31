import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { userService } from '../services/userService';
import PageTransition from '../components/PageTransition';
import TranslatedText from '../components/TranslatedText';
import { toast } from 'react-hot-toast';

function ShowcaseCompilation() {
  const [isLoading, setIsLoading] = useState(false);
  const [outputUri, setOutputUri] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');
  const [savedVideos, setSavedVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('');

  const BACKGROUND_TRACKS = [
    { id: 'rock_anthem', label: 'Rock Anthem' },
    { id: 'cinematic_theme', label: 'Cinematic Theme' },
    { id: 'funky_groove', label: 'Funky Groove' },
    { id: 'hiphop_vibes', label: 'Hip-Hop Vibes' },
  ];

  useEffect(() => {
    loadSavedVideos();
  }, []);

  const loadSavedVideos = async () => {
    try {
      const response = await userService.getSavedVideos();
      if (response.success) {
        setSavedVideos(response.videos);
      }
    } catch (error) {
      console.error('Error loading saved videos:', error);
      toast.error('Failed to load saved videos');
    }
  };

  const handleVideoSelect = (videoId) => {
    setSelectedVideos(prev => {
      if (prev.includes(videoId)) {
        return prev.filter(id => id !== videoId);
      } else {
        return [...prev, videoId];
      }
    });
  };

  const handleCompileShowcase = async () => {
    if (selectedVideos.length === 0) {
      toast.error('Please select at least one video');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setProgress('Starting compilation...');
      
      const selectedVideoUrls = savedVideos
        .filter(video => selectedVideos.includes(video.id))
        .map(video => video.videoUrl);

      console.log('Selected video URLs:', selectedVideoUrls); // Debug log

      if (selectedVideoUrls.some(url => !url)) {
        throw new Error('Some selected videos have invalid URLs');
      }

      setProgress('Uploading videos...');
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/showcase/compile`,
        {
          videoUrls: selectedVideoUrls,
          audioTrack: selectedTrack
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );

      console.log('Compilation response:', response.data); // Debug log

      if (response.data.success) {
        setProgress('Compilation complete! Processing video...');
        setOutputUri(response.data.output_uri);
        toast.success('Showcase compilation completed successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to compile showcase');
      }
    } catch (err) {
      console.error('Compilation error:', err); // Detailed error logging
      setError(err.message || 'Failed to compile showcase');
      toast.error(err.message || 'Failed to compile showcase');
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              <TranslatedText text="Create Your Highlight Reel" />
            </h1>

            <div className="space-y-6">
              {/* Video Selection */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  <TranslatedText text="Select Videos" />
                </h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {savedVideos.map((video) => (
                    <div
                      key={video.id}
                      className={`relative p-4 border rounded-lg cursor-pointer transition-all
                        ${selectedVideos.includes(video.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
                      onClick={() => handleVideoSelect(video.id)}
                    >
                      <div className="aspect-video mb-2">
                        <video
                          className="w-full h-full object-cover rounded"
                          poster="https://via.placeholder.com/640x360.png?text=Video+Thumbnail"
                        >
                          <source src={video.videoUrl} type="video/mp4" />
                        </video>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {video.title}
                      </p>
                      {selectedVideos.includes(video.id) && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Background Music Selection */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  <TranslatedText text="Select Background Music" />
                </h2>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                  {BACKGROUND_TRACKS.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => setSelectedTrack(track.id)}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors
                        ${selectedTrack === track.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compile Button */}
              <button
                onClick={handleCompileShowcase}
                disabled={isLoading || selectedVideos.length === 0}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span><TranslatedText text="Compiling..." /></span>
                  </div>
                ) : (
                  <TranslatedText text="Create Highlight Reel" />
                )}
              </button>

              {progress && (
                <div className="text-center text-gray-600 dark:text-gray-400">
                  {progress}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-md">
                  {error}
                </div>
              )}

              {outputUri && (
                <div className="p-4 bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-200 rounded-md">
                  <h2 className="font-semibold mb-2">
                    <TranslatedText text="Your Highlight Reel is Ready!" />
                  </h2>
                  <div className="mt-4">
                    <video 
                      controls 
                      className="w-full rounded-lg shadow-lg"
                      poster="/images/video-placeholder.png"
                    >
                      <source src={outputUri} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <p className="mt-4 text-sm">
                    <TranslatedText text="Note: The video may take a few minutes to be fully processed and available for viewing." />
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default ShowcaseCompilation;
