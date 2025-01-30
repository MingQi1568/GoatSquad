import React, { useState } from 'react';
import axios from 'axios';
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
  const [isLoading, setIsLoading] = useState(false);
  const [outputUri, setOutputUri] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const handleCompileShowcase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress('Starting compilation...');
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/showcase/compile`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );

      if (response.data.success) {
        setProgress('Compilation complete! Processing video...');
        setOutputUri(response.data.output_uri);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to compile showcase');
      console.error('Error:', err);
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
              <TranslatedText text="My Showcase Compilation" />
            </h1>

            <div className="space-y-6">
              <button
                onClick={handleCompileShowcase}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                  <TranslatedText text="Compile My Showcase" />
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
                    <TranslatedText text="Compilation Complete!" />
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
