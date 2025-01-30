import React, { useState } from 'react';
import PageTransition from '../components/PageTransition';
import TranslatedText from '../components/TranslatedText';

/**
 * Mock data that simulates previously liked videos
 * (In real usage, fetch from your actual data source).
 */
const MOCK_LIKED_VIDEOS = [
  { id: 101, title: "Epic Home Run" },
  { id: 102, title: "Pitching Masterclass" },
  { id: 103, title: "Grand Slam Crowd Goes Wild" },
  { id: 104, title: "Incredible Diving Catch" },
  { id: 105, title: "Last-Minute Comeback" },
  { id: 106, title: "Amazing Double Play" },
  { id: 107, title: "Walk-off Victory" },
  { id: 108, title: "Historic 3000th Hit" },
  { id: 109, title: "Pitcher's Duel Showcase" },
  { id: 110, title: "All-Star MVP Highlights" },
  { id: 111, title: "Fun Dugout Moments" },
  { id: 112, title: "Legendary Bat Flip" },
];

/**
 * Simple list of background music tracks.
 * Could be expanded or replaced with real data.
 */
const MOCK_BACKGROUND_TRACKS = [
  { id: 'rock_anthem', label: 'Rock Anthem' },
  { id: 'cinematic_theme', label: 'Cinematic Theme' },
  { id: 'funky_groove', label: 'Funky Groove' },
  { id: 'hiphop_vibes', label: 'Hip-Hop Vibes' },
];

function ShowcaseCompilation() {
  // State for selected video IDs (checkboxes)
  const [selectedVideos, setSelectedVideos] = useState([]);

  // State for chosen background music
  const [selectedTrack, setSelectedTrack] = useState('');

  // State for success message (i.e., the "compiled" video link or embed)
  const [isCompiled, setIsCompiled] = useState(false);

  // When user toggles a checkbox
  const handleToggleVideo = (videoId) => {
    setSelectedVideos((prev) => {
      if (prev.includes(videoId)) {
        // Remove if already selected
        return prev.filter((id) => id !== videoId);
      } else {
        // Add if not selected, max 10
        if (prev.length >= 10) {
          alert('You can only select up to 10 videos.');
          return prev;
        }
        return [...prev, videoId];
      }
    });
  };

  // When user picks background track from dropdown
  const handleTrackChange = (event) => {
    setSelectedTrack(event.target.value);
  };

  // "Compile" button click
  const handleCompile = () => {
    // For concept only:
    // you would normally send a request to your backend
    // with the selectedVideos and selectedTrack
    setIsCompiled(true);
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          <TranslatedText text="My Showcase Compilation" />
        </h1>

        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          <TranslatedText text="Select up to 10 of your favorite (previously liked) videos and optionally choose a background track for a combined highlight reel." />
        </p>

        {!isCompiled ? (
          <>
            {/* Video Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                <TranslatedText text="Select Your Liked Videos" />
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {MOCK_LIKED_VIDEOS.map((video) => (
                  <label
                    key={video.id}
                    className="relative flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg
                              hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer
                              group"
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={selectedVideos.includes(video.id)}
                      onChange={() => handleToggleVideo(video.id)}
                    />
                    <div className="w-5 h-5 mr-3 border-2 rounded 
                                  border-gray-300 dark:border-gray-600
                                  group-hover:border-blue-500 dark:group-hover:border-blue-400
                                  peer-checked:bg-blue-500 dark:peer-checked:bg-blue-600
                                  peer-checked:border-blue-500 dark:peer-checked:border-blue-600
                                  transition-colors">
                      <svg 
                        className="w-3 h-3 mx-auto mt-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={3} 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    </div>
                    <span className="text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                <TranslatedText text={`Selected ${selectedVideos.length} / 10`} />
              </p>
            </div>

            {/* Background Music Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                <TranslatedText text="Optional Background Music" />
              </h2>
              <select
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700
                           text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                value={selectedTrack}
                onChange={handleTrackChange}
              >
                <option value="">
                  -- No Music --
                </option>
                {MOCK_BACKGROUND_TRACKS.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit / Compile Button */}
            <button
              onClick={handleCompile}
              disabled={selectedVideos.length === 0}
              className={`px-6 py-3 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 
                          disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              <TranslatedText text="Compile My Showcase" />
            </button>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              <TranslatedText text="Success!" />
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              <TranslatedText text="Your videos have been successfully compiled into a highlight reel. Here's a preview:" />
            </p>

            {/* Fake video embed or link here */}
            <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 rounded mb-4 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-300">
                <TranslatedText text="(Final compiled video preview)" />
              </span>
            </div>

            <button
              onClick={() => setIsCompiled(false)}
              className="px-4 py-2 rounded-md font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <TranslatedText text="Compile Another Showcase" />
            </button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default ShowcaseCompilation;
