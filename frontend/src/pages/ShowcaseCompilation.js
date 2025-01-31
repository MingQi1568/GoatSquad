import React, { useState, useEffect, useRef } from 'react';
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
  const [playingPreview, setPlayingPreview] = useState(null);
  const [customTracks, setCustomTracks] = useState([]);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const [videoQuality, setVideoQuality] = useState('standard');
  const [originalVolume, setOriginalVolume] = useState(70); // Default 70%
  const [musicVolume, setMusicVolume] = useState(30); // Default 30%
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  const BACKGROUND_TRACKS = [
    {
      category: 'Energetic',
      tracks: [
        { 
          id: 'rock_anthem',
          label: 'Rock Anthem',
          description: 'High-energy rock track perfect for intense moments',
          previewUrl: `${process.env.REACT_APP_BACKEND_URL}/audio/previews/rock_anthem_preview.mp3`
        },
        { 
          id: 'hiphop_vibes',
          label: 'Hip-Hop Vibes',
          description: 'Modern hip-hop beat with dynamic rhythm',
          previewUrl: `${process.env.REACT_APP_BACKEND_URL}/audio/previews/hiphop_vibes_preview.mp3`
        }
      ]
    },
    {
      category: 'Dramatic',
      tracks: [
        { 
          id: 'cinematic_theme',
          label: 'Cinematic Theme',
          description: 'Epic orchestral track for dramatic highlights',
          previewUrl: `${process.env.REACT_APP_BACKEND_URL}/audio/previews/cinematic_preview.mp3`
        }
      ]
    },
    {
      category: 'Fun',
      tracks: [
        { 
          id: 'funky_groove',
          label: 'Funky Groove',
          description: 'Upbeat funky track for lighthearted moments',
          previewUrl: `${process.env.REACT_APP_BACKEND_URL}/audio/previews/funky_preview.mp3`
        }
      ]
    }
  ];

  useEffect(() => {
    loadSavedVideos();
    loadCustomTracks();
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
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

  const loadCustomTracks = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/custom-music`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      if (response.data.success) {
        setCustomTracks(response.data.tracks);
      }
    } catch (error) {
      console.error('Error loading custom tracks:', error);
      toast.error('Failed to load custom music tracks');
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/aac'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload MP3, WAV, M4A, or AAC files.');
      return;
    }

    // Validate file size (16MB max)
    if (file.size > 16 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 16MB.');
      return;
    }

    try {
      setIsUploadingMusic(true);
      const formData = new FormData();
      formData.append('music', file);

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/custom-music`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Music uploaded successfully!');
        loadCustomTracks(); // Reload the list of custom tracks
      }
    } catch (error) {
      console.error('Error uploading music:', error);
      toast.error(error.response?.data?.message || 'Failed to upload music');
    } finally {
      setIsUploadingMusic(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const handleTrackSelect = (trackId) => {
    setSelectedTrack(trackId);
    // Stop any playing preview when selecting a track
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingPreview(null);
    }
  };

  const handlePreviewPlay = (track) => {
    if (playingPreview === track.id) {
      // If clicking the same track, stop the preview
      audioRef.current?.pause();
      setPlayingPreview(null);
      return;
    }

    // Stop current preview if any
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Create new audio element for the preview
    const audio = new Audio(track.previewUrl);
    audio.addEventListener('ended', () => setPlayingPreview(null));
    audio.play().catch(error => {
      console.error('Error playing preview:', error);
      toast.error('Failed to play music preview');
    });

    audioRef.current = audio;
    setPlayingPreview(track.id);
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
      setOutputUri(null);
      
      const selectedVideoUrls = savedVideos
        .filter(video => selectedVideos.includes(video.id))
        .map(video => video.videoUrl);

      console.log('Selected video URLs:', selectedVideoUrls);

      if (selectedVideoUrls.some(url => !url)) {
        throw new Error('Some selected videos have invalid URLs');
      }

      setProgress('Uploading videos...');
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/showcase/compile`,
        {
          videoUrls: selectedVideoUrls,
          audioTrack: selectedTrack,
          quality: videoQuality,
          originalVolume: originalVolume / 100, // Convert to decimal
          musicVolume: musicVolume / 100 // Convert to decimal
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );

      console.log('Compilation response:', response.data);

      if (response.data.success) {
        setProgress('Compilation complete! Processing video...');
        setOutputUri(response.data.output_uri);
        toast.success('Showcase compilation completed successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to compile showcase');
      }
    } catch (err) {
      console.error('Compilation error:', err);
      setError(err.message || 'Failed to compile showcase');
      toast.error(err.message || 'Failed to compile showcase');
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  };

  const handleDownload = async () => {
    try {
      // Extract just the user ID from the URI
      // From format: https://storage.googleapis.com/goatbucket1/completeHighlights/1_1738349227.mp4
      const userId = outputUri.split('/completeHighlights/')[1].split('_')[0];
      console.log('Downloading for user ID:', userId);
      console.log('Full output URI:', outputUri);
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/showcase/download/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Download failed with status: ${response.status}`);
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('video/mp4')) {
        console.error('Unexpected content type:', contentType);
      }
      
      // Get the blob from response
      const blob = await response.blob();
      console.log('Downloaded blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Set filename
      const filename = `highlight-reel-${new Date().toISOString().split('T')[0]}.mp4`;
      link.setAttribute('download', filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download video: ${error.message}`);
    }
  };

  const handleVideoPreview = (videoId) => {
    if (playingVideo === videoId) {
      setPlayingVideo(null);
    } else {
      setPlayingVideo(videoId);
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
                      className={`relative p-4 border rounded-lg transition-all
                        ${selectedVideos.includes(video.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
                    >
                      <div className="aspect-video mb-2 relative group">
                        <video
                          className="w-full h-full object-cover rounded"
                          src={video.videoUrl}
                          poster="https://via.placeholder.com/640x360.png?text=Video+Thumbnail"
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
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {video.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoSelect(video.id);
                          }}
                          className={`ml-2 p-1.5 rounded-full transition-colors
                            ${selectedVideos.includes(video.id)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                          {selectedVideos.includes(video.id) ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Background Music Selection */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    <TranslatedText text="Select Background Music" />
                  </h2>
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".mp3,.wav,.m4a,.aac"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingMusic}
                      className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isUploadingMusic ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <TranslatedText text="Uploading..." />
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <TranslatedText text="Upload Music" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Custom Music Section */}
                {customTracks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      <TranslatedText text="Your Music" />
                    </h3>
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {customTracks.map((track) => (
                        <div
                          key={track.id}
                          className={`p-4 rounded-lg border transition-all cursor-pointer
                            ${selectedTrack === `custom_${track.id}`
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {track.originalName}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <TranslatedText text="Custom Track" />
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePreviewPlay({
                                  id: `custom_${track.id}`,
                                  previewUrl: `${process.env.REACT_APP_BACKEND_URL}${track.url}`
                                });
                              }}
                              className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              title={playingPreview === `custom_${track.id}` ? "Stop Preview" : "Play Preview"}
                            >
                              {playingPreview === `custom_${track.id}` ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          </div>
                          <button
                            onClick={() => handleTrackSelect(`custom_${track.id}`)}
                            className={`w-full py-2 px-3 text-sm font-medium rounded-md transition-colors
                              ${selectedTrack === `custom_${track.id}`
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                          >
                            {selectedTrack === `custom_${track.id}` ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Default Tracks Section */}
                <div className="space-y-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <TranslatedText text="Default Tracks" />
                  </h3>
                  {BACKGROUND_TRACKS.map((category) => (
                    <div key={category.category} className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {category.category}
                      </h4>
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                        {category.tracks.map((track) => (
                          <div
                            key={track.id}
                            className={`p-4 rounded-lg border transition-all cursor-pointer
                              ${selectedTrack === track.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                              }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  {track.label}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {track.description}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewPlay(track);
                                }}
                                className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                title={playingPreview === track.id ? "Stop Preview" : "Play Preview"}
                              >
                                {playingPreview === track.id ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            <button
                              onClick={() => handleTrackSelect(track.id)}
                              className={`w-full py-2 px-3 text-sm font-medium rounded-md transition-colors
                                ${selectedTrack === track.id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                              {selectedTrack === track.id ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Quality Selection */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  <TranslatedText text="Video Quality" />
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setVideoQuality('fast')}
                    className={`p-4 rounded-lg border transition-all text-center ${
                      videoQuality === 'fast'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Fast</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lower quality, faster processing</p>
                  </button>
                  <button
                    onClick={() => setVideoQuality('standard')}
                    className={`p-4 rounded-lg border transition-all text-center ${
                      videoQuality === 'standard'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">Standard</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Balanced quality and speed</p>
                  </button>
                  <button
                    onClick={() => setVideoQuality('high')}
                    className={`p-4 rounded-lg border transition-all text-center ${
                      videoQuality === 'high'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">High</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Best quality, slower processing</p>
                  </button>
                </div>
              </div>

              {/* Audio Volume Control */}
              {selectedTrack && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    <TranslatedText text="Audio Mix" />
                  </h2>
                  <div className="space-y-6">
                    {/* Original Audio Volume */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          <TranslatedText text="Original Video Volume" />
                        </label>
                        <span className="text-sm text-gray-500">{originalVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={originalVolume}
                        onChange={(e) => setOriginalVolume(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                    </div>

                    {/* Background Music Volume */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          <TranslatedText text="Background Music Volume" />
                        </label>
                        <span className="text-sm text-gray-500">{musicVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                  
                  {/* Add download button */}
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={handleDownload}
                      className="inline-flex items-center px-4 py-2 border border-transparent 
                                 rounded-md shadow-sm text-sm font-medium text-white 
                                 bg-blue-600 hover:bg-blue-700 focus:outline-none 
                                 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg 
                        className="mr-2 -ml-1 h-5 w-5" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <TranslatedText text="Download Highlight Reel" />
                    </button>
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
