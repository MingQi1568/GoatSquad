import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TeamPlayerSelector from '../components/TeamPlayerSelector';
import { usePreferences } from '../hooks/usePreferences';
import TranslatedText from '../components/TranslatedText';
import PageTransition from '../components/PageTransition';
import { fetchTeams } from '../services/dataService';

function Preferences() {
  const { preferences, followTeam, unfollowTeam, followPlayer, unfollowPlayer } = usePreferences();
  const [playerData, setPlayerData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch player data for followed players
  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!preferences?.players) return;

      const newPlayerData = { ...playerData };
      const playersToFetch = preferences.players.filter(p => !playerData[p.id]);

      for (const player of playersToFetch) {
        try {
          const response = await axios.get(`https://statsapi.mlb.com/api/v1/people/${player.id}`);
          newPlayerData[player.id] = response.data.people[0];
        } catch (error) {
          console.error(`Error fetching data for player ${player.id}:`, error);
        }
      }

      if (Object.keys(newPlayerData).length > Object.keys(playerData).length) {
        setPlayerData(newPlayerData);
      }
    };

    fetchPlayerData();
  }, [preferences?.players, playerData]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const teams = await fetchTeams();
        console.log('Teams loaded:', teams);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load teams:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  const handleSelection = ({ team, player }) => {
    if (team) {
      // Check if team is already followed before adding
      const isAlreadyFollowed = preferences?.teams?.some(t => t.id === team.id);
      if (!isAlreadyFollowed) {
        followTeam(team);
      }
    }
    if (player) {
      // Check if player is already followed before adding
      const isAlreadyFollowed = preferences?.players?.some(p => p.id === player.id);
      if (!isAlreadyFollowed) {
        followPlayer(player);
      }
    }
  };

  const handleUnfollowTeam = (teamId) => {
    unfollowTeam(teamId);
  };

  const handleUnfollowPlayer = (playerId) => {
    unfollowPlayer(playerId);
  };

  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400 p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          <TranslatedText text="Follow Teams & Players" />
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content - Team/Player selector */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <TeamPlayerSelector
                onSelect={handleSelection}
                followedTeams={preferences?.teams || []}
                followedPlayers={preferences?.players || []}
              />
            </div>
          </div>

          {/* Right sidebar - Selection summary */}
          <div className="lg:w-96">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
                {/* Followed Teams */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    <TranslatedText text="Followed Teams" />
                  </h3>
                  <div className="space-y-2">
                    {preferences?.teams?.filter(team => team.name).length > 0 ? (
                      preferences.teams.map(team => (
                        <div key={team.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <span className="text-gray-900 dark:text-gray-100">
                            <TranslatedText text={team.name} />
                          </span>
                          <button
                            onClick={() => handleUnfollowTeam(team.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <TranslatedText text="Unfollow" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        <TranslatedText text="No teams selected" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Followed Players */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    <TranslatedText text="Followed Players" />
                  </h3>
                  <div className="space-y-2">
                    {preferences?.players?.filter(player => player.fullName).length > 0 ? (
                      preferences.players.map(player => {
                        const fullPlayerData = playerData[player.id] || player;
                        return (
                          <div key={player.id} 
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                          >
                            <div className="flex flex-col">
                              <span className="text-gray-900 dark:text-gray-100">
                                <TranslatedText text={fullPlayerData.fullName} />
                              </span>
                              {fullPlayerData.primaryPosition && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  <TranslatedText text={fullPlayerData.primaryPosition.abbreviation} />
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleUnfollowPlayer(player.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <TranslatedText text="Unfollow" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        <TranslatedText text="No players selected" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-4 text-gray-600 dark:text-gray-400">
            <TranslatedText text="Loading..." />
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default Preferences; 