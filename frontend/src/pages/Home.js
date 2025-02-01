import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import TranslatedText from '../components/TranslatedText';
import PageTransition from '../components/PageTransition';
import NewsDigest from '../components/NewsDigest';
import { usePreferences } from '../hooks/usePreferences';

function Home() {
  // Pull user preferences
  const { preferences, isLoading } = usePreferences();

  // Debug log whenever preferences update
  useEffect(() => {
    console.log('Current preferences:', preferences);
  }, [preferences]);

  // Loading state
  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-[80vh] flex items-center justify-center fade-in">
          <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            Loading...
          </div>
        </div>
      </PageTransition>
    );
  }

  // If user has no preferences set, show a prompt
  if (!preferences || (!preferences.teams.length && !preferences.players.length)) {
    return (
      <PageTransition>
        <div className="min-h-[80vh] flex items-center justify-center fade-in">
          <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="mb-6">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Set Your Preferences
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose your favorite team and player to get personalized MLB updates and highlights.
            </p>
            <Link
              to="/preferences"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
            >
              Choose Preferences
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Feature cards
  const features = [
    {
      name: 'Calendar',
      description: 'View your team\'s schedule and upcoming games',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      href: '/calendar',
    },
    {
      name: 'Preferences',
      description: 'Customize your experience and team selection',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      href: '/preferences',
    },
    {
      name: 'Showcase',
      description: 'Create highlight reels from your favorite moments',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
      href: '/showcase-compilation',
    }
  ];

  return (
    <PageTransition>
      {/* Hero / Welcome Section */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            <TranslatedText text="Welcome to GoatSquad" />
          </h2>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
            <TranslatedText text="Your personalized MLB experience starts here" />
          </p>
        </div>

        {/* Features Section */}
        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.name}
                to={feature.href}
                className="relative group"
              >
                <div className="h-full flex flex-col justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 shadow-sm transition-all duration-200 hover:shadow-lg">
                  <div>
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                      {feature.icon}
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                      <TranslatedText text={feature.name} />
                    </h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                      <TranslatedText text={feature.description} />
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400">
                    <span className="text-sm font-medium">
                      <TranslatedText text="Learn more" />
                    </span>
                    <svg 
                      className="ml-2 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* News Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Latest News
          </h2>
          <NewsDigest
            teams={preferences.teams || []}
            players={preferences.players || []}
          />
        </div>
      </div>
    </PageTransition>
  );
}

export default Home;
