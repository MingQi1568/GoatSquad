// File: frontend/src/pages/RecommendationsPage.js

import React, { useState, useEffect, useRef, useMemo } from "react";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../contexts/AuthContext";
import TranslatedText from "../components/TranslatedText";
import { userService } from "../services/userService";
import { videoService } from "../services/videoService";
import { toast } from "react-hot-toast";
import { usePreferences } from "../hooks/usePreferences";
import { format } from "date-fns";
import axios from "axios";

function RecommendationsPage() {
  // Replace the dummy data with user data from AuthContext
  const { user } = useAuth();
  const { preferences, isLoading: preferencesLoading } = usePreferences();

  // Get followed teams and players from preferences
  const followedTeams = preferences?.teams || [];
  const followedPlayers = preferences?.players || [];

  // Replace dummy upcomingEvents with real state
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // ---------- Search-related state ----------
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // -------------- Recommendations state ---------------
  const [followRecommendations, setFollowRecommendations] = useState([]);
  const [modelRecommendations, setModelRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // Pagination tracking
  const [currentPage, setCurrentPage] = useState(1); // Only declared once
  const [followHasMore, setFollowHasMore] = useState(true);
  const [modelHasMore, setModelHasMore] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // -----------------------------------------
  // Dummy functions to fetch data with search
  // -----------------------------------------
  const fetchFollowRecommendations = async (pageNum, theSearchTerm) => {
    try {
      setIsLoadingMore(true);
      const token = localStorage.getItem("auth_token") || "";
      const response = await fetch(
        `${
          process.env.REACT_APP_BACKEND_URL
        }/recommend/follow?page=${pageNum}&search=${encodeURIComponent(
          theSearchTerm
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success && Array.isArray(data.recommendations)) {
        const newRecs = await Promise.all(
          data.recommendations.map(async (rec) => {
            // For each reel, fetch its video data
            const videoRes = await fetch(
              `${process.env.REACT_APP_BACKEND_URL}/api/mlb/video?play_id=${rec.reel_id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            const videoData = await videoRes.json();

            // For demonstration, generate the description with Gemini
            const generated = await fetchDescriptionFromGemini(
              videoData.title || "MLB Highlight"
            );

            return {
              id: rec.reel_id,
              type: "video",
              title: videoData.success
                ? `${videoData.title}`
                : "Followed Team/Player Highlight",
              description: videoData.success
                ? generated
                : "Highlight from your followed teams/players",
              videoUrl: videoData.success ? videoData.video_url : null,
              upvotes: 0,
              downvotes: 0,
              comments: [],
            };
          })
        );

        // If pageNum=1 and user is searching, we replace old recs
        setFollowRecommendations((prev) =>
          pageNum === 1 ? newRecs : [...prev, ...newRecs]
        );
        setFollowHasMore(data.has_more);
      }
    } catch (err) {
      console.error("Error fetching follow-based recs:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const fetchModelRecommendations = async (pageNum, theSearchTerm) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");

      const start = (pageNum - 1) * 5;
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/recommend/vector?start=${start}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (data.success && Array.isArray(data.recommendations)) {
        const newRecs = await Promise.all(
          data.recommendations.map(async (id) => {
            try {
              // Fetch video data using the same endpoint as fetchFollowRecommendations
              const videoRes = await fetch(
                `${process.env.REACT_APP_BACKEND_URL}/api/mlb/video?play_id=${id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const videoData = await videoRes.json();

              // Generate description like fetchFollowRecommendations
              const generated = await fetchDescriptionFromGemini(
                videoData.title || "MLB Highlight"
              );

              return {
                id,
                type: "video",
                title: videoData.success
                  ? `${videoData.title}`
                  : "Model Recommendation",
                description: videoData.success ? generated : "",
                videoUrl: videoData.success ? videoData.video_url : null,
                upvotes: 0,
                downvotes: 0,
                comments: [],
              };
            } catch (error) {
              console.error(`Error fetching video ${id}:`, error);
              return null;
            }
          })
        );
        const valid = newRecs.filter((r) => r);

        if (pageNum === 1) {
          setModelRecommendations(valid);
        } else {
          setModelRecommendations((prev) => [...prev, ...valid]);
        }

        setModelHasMore(data.has_more);
        setIsModelLoaded(true);
      } else {
        setModelHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching model recommendations:", error);
      setModelHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Example "Gemini" fetch for the description
  const fetchDescriptionFromGemini = async (title) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/generate-blurb`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }
      );
      const data = await res.json();
      return data.success ? data.description : title;
    } catch (error) {
      console.error("Error fetching description:", error);
      return "Description unavailable.";
    }
  };

  // -------------- load initial data on mount --------------
  useEffect(() => {
    fetchFollowRecommendations(1, "");
    fetchModelRecommendations(1, "");
  }, [user?.id]);

  // Combine the two sets of recs in an interleaved manner
  const combinedRecommendations = useMemo(() => {
    const combined = [];
    const maxLength = Math.max(
      followRecommendations.length,
      modelRecommendations.length
    );

    for (let i = 0; i < maxLength; i++) {
      if (i < followRecommendations.length) {
        combined.push(followRecommendations[i]);
      }
      if (i < modelRecommendations.length) {
        combined.push(modelRecommendations[i]);
      }
    }

    return combined;
  }, [followRecommendations, modelRecommendations]);

  // Infinity scroll logic
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore && hasMore) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);

          // Alternate between follow and model recommendations
          const isEven = nextPage % 2 === 0;
          const pageForRequest = Math.ceil(nextPage / 2);

          setIsLoadingMore(true);
          try {
            if (isEven) {
              await fetchFollowRecommendations(pageForRequest, searchTerm);
            } else {
              await fetchModelRecommendations(pageForRequest, searchTerm);
            }
          } finally {
            setIsLoadingMore(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [currentPage, isLoadingMore, hasMore, searchTerm]);

  // Check if we have more data to load:
  useEffect(() => {
    setHasMore(followHasMore || modelHasMore);
  }, [followHasMore, modelHasMore]);

  // Search logic
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setCurrentPage(1);
    const token = localStorage.getItem("auth_token");

    try {
      // Get search results from vector search endpoint
      const searchResponse = await fetch(
        `${
          process.env.REACT_APP_BACKEND_URL
        }/recommend/search?search=${encodeURIComponent(searchTerm)}&amount=30`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const searchData = await searchResponse.json();

      if (searchData.success && Array.isArray(searchData.recommendations)) {
        // Get video details for each recommendation
        const videoPromises = searchData.recommendations.map(async (id) => {
          const videoRes = await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/api/mlb/video?play_id=${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const videoData = await videoRes.json();

          // Generate description
          const generated = await fetchDescriptionFromGemini(
            videoData.title || "MLB Highlight"
          );

          return {
            id,
            type: "video",
            title: videoData.success ? videoData.title : "Search Result",
            description: videoData.success ? generated : "",
            videoUrl: videoData.success ? videoData.video_url : null,
            upvotes: 0,
            downvotes: 0,
            comments: [],
          };
        });

        const videos = await Promise.all(videoPromises);
        const validVideos = videos.filter((v) => v.videoUrl);

        // Split results between follow and model recommendations
        const halfLength = Math.ceil(validVideos.length / 2);
        setFollowRecommendations(validVideos.slice(0, halfLength));
        setModelRecommendations(validVideos.slice(halfLength));

        // Update pagination state
        setHasMore(searchData.has_more);
        setFollowHasMore(searchData.has_more);
        setModelHasMore(searchData.has_more);
      } else {
        setFollowRecommendations([]);
        setModelRecommendations([]);
        setHasMore(false);
        toast.error("No results found");
      }
    } catch (error) {
      console.error("Error searching videos:", error);
      toast.error("Error searching videos");
    } finally {
      setIsSearching(false);
    }
  };

  // For expansions, new comment, etc. (omitted for brevity)
  const [expandedPost, setExpandedPost] = useState(null);
  const [newComment, setNewComment] = useState("");

  const [savedVideos, setSavedVideos] = useState(new Set());

  // Load saved videos on mount
  useEffect(() => {
    const loadSavedVideos = async () => {
      try {
        const response = await userService.getSavedVideos();
        if (response.success) {
          setSavedVideos(new Set(response.videos.map((v) => v.videoUrl)));
        }
      } catch (error) {
        console.error("Error loading saved videos:", error);
      }
    };

    if (user) {
      loadSavedVideos();
    }
  }, [user]);

  const handleSaveVideo = async (video) => {
    try {
      if (savedVideos.has(video.videoUrl)) {
        toast.error("Video already saved!");
        return;
      }

      const response = await userService.saveVideo(video.videoUrl, video.title);
      if (response.success) {
        setSavedVideos((prev) => new Set([...prev, video.videoUrl]));
        toast.success("Video saved successfully!");
      }
    } catch (error) {
      console.error("Error saving video:", error);
      toast.error(error.response?.data?.message || "Error saving video");
    }
  };

  const [votes, setVotes] = useState({}); // Track votes for each video
  const [userVotes, setUserVotes] = useState({}); // Track user's votes

  // Handle voting
  const handleVote = async (videoId, voteType) => {
    try {
      // If user is trying to vote the same way again, remove their vote
      if (userVotes[videoId] === voteType) {
        await videoService.vote(videoId, "none");
        setUserVotes((prev) => {
          const newVotes = { ...prev };
          delete newVotes[videoId];
          return newVotes;
        });
        setVotes((prev) => ({
          ...prev,
          [videoId]: {
            ...prev[videoId],
            score: prev[videoId].score + (voteType === "up" ? -1 : 1),
          },
        }));
      } else {
        // Calculate score change
        let scoreChange = voteType === "up" ? 1 : -1;
        if (userVotes[videoId]) {
          // If changing vote, double the effect
          scoreChange *= 2;
        }

        await videoService.vote(videoId, voteType);
        setUserVotes((prev) => ({
          ...prev,
          [videoId]: voteType,
        }));
        setVotes((prev) => ({
          ...prev,
          [videoId]: {
            ...prev[videoId],
            score: (prev[videoId]?.score || 0) + scoreChange,
          },
        }));
      }
    } catch (error) {
      toast.error("Failed to vote. Please try again.");
    }
  };

  // Load votes for videos
  const loadVotes = async (videoIds) => {
    try {
      const votePromises = videoIds.map((id) => videoService.getVotes(id));
      const voteResults = await Promise.all(votePromises);
      const newVotes = {};
      const newUserVotes = {};

      voteResults.forEach((result, index) => {
        if (result.success) {
          const videoId = videoIds[index];
          newVotes[videoId] = {
            score: result.score,
            total: result.total,
          };
          if (result.userVote) {
            newUserVotes[videoId] = result.userVote;
          }
        }
      });

      setVotes((prev) => ({ ...prev, ...newVotes }));
      setUserVotes((prev) => ({ ...prev, ...newUserVotes }));
    } catch (error) {
      console.error("Error loading votes:", error);
    }
  };

  // Load votes when recommendations change
  useEffect(() => {
    if (combinedRecommendations.length > 0) {
      const videoIds = combinedRecommendations.map((rec) => rec.id);
      loadVotes(videoIds);
    }
  }, [combinedRecommendations]);

  const [comments, setComments] = useState({}); // Store comments for each video
  const [newComments, setNewComments] = useState({}); // Store new comment text for each video
  const [editingComment, setEditingComment] = useState(null); // Track which comment is being edited
  const [editText, setEditText] = useState(""); // Store edited comment text

  // Load comments for a video
  const loadComments = async (videoId) => {
    try {
      const response = await videoService.getComments(videoId);
      if (response.success) {
        setComments((prev) => ({
          ...prev,
          [videoId]: response.comments,
        }));
      }
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Failed to load comments");
    }
  };

  // Handle adding a new comment
  const handleAddComment = async (videoId) => {
    try {
      const content = newComments[videoId]?.trim();
      if (!content) return;

      const response = await videoService.addComment(videoId, content);
      if (response.success) {
        setComments((prev) => ({
          ...prev,
          [videoId]: [response.comment, ...(prev[videoId] || [])],
        }));
        setNewComments((prev) => ({
          ...prev,
          [videoId]: "",
        }));
        toast.success("Comment added successfully");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  // Handle updating a comment
  const handleUpdateComment = async (commentId, videoId) => {
    try {
      const response = await videoService.updateComment(commentId, editText);
      if (response.success) {
        setComments((prev) => ({
          ...prev,
          [videoId]: prev[videoId].map((comment) =>
            comment.id === commentId ? response.comment : comment
          ),
        }));
        setEditingComment(null);
        setEditText("");
        toast.success("Comment updated successfully");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId, videoId) => {
    try {
      const response = await videoService.deleteComment(commentId);
      if (response.success) {
        setComments((prev) => ({
          ...prev,
          [videoId]: prev[videoId].filter(
            (comment) => comment.id !== commentId
          ),
        }));
        toast.success("Comment deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  // Load comments when recommendations change
  useEffect(() => {
    if (combinedRecommendations.length > 0) {
      combinedRecommendations.forEach((rec) => {
        loadComments(rec.id);
      });
    }
  }, [combinedRecommendations]);

  // Add useEffect to fetch upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      if (!preferences?.teams?.length) {
        setEventsLoading(false);
        return;
      }

      try {
        setEventsLoading(true);
        const startDate = format(new Date(), "yyyy-MM-dd");
        const endDate = format(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          "yyyy-MM-dd"
        ); // 30 days ahead

        // Fetch games for all followed teams
        const gamePromises = preferences.teams.map((team) =>
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/mlb/schedule`, {
            params: {
              teamId: team.id,
              startDate,
              endDate,
            },
          })
        );

        const responses = await Promise.all(gamePromises);

        // Process and combine all games
        const allEvents = responses.flatMap((response) => {
          if (!response.data || !response.data.dates) return [];

          const teamId = parseInt(response.config.params.teamId);
          const team = preferences.teams.find((t) => t.id === teamId);

          return response.data.dates.flatMap((date) => {
            if (!date.games) return [];

            return date.games.map((game) => ({
              id: game.gamePk,
              date: format(new Date(game.gameDate), "MMM d"),
              event: `${game.teams.away.team.name} @ ${game.teams.home.team.name}`,
              teamName: team.name,
              isHome: game.teams.home.team.id === team.id,
              fullDate: new Date(game.gameDate),
            }));
          });
        });

        // Sort by date and take first 5
        const sortedEvents = allEvents
          .sort((a, b) => a.fullDate - b.fullDate)
          .slice(0, 5);

        setUpcomingEvents(sortedEvents);
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, [preferences?.teams]);

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Search Bar */}
        <div className="mb-8">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center space-x-2"
          >
            <input
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                         disabled:opacity-50 transition-colors"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          {/* LEFT SIDEBAR */}
          <aside className="col-span-3 hidden lg:block space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Followed Teams */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  <TranslatedText text="Followed Teams" />
                </h2>
                {followedTeams.length > 0 ? (
                  followedTeams.map((team) => (
                    <div
                      key={team.id}
                      className="py-2.5 border-b last:border-b-0 border-gray-200 dark:border-gray-700"
                    >
                      <span className="text-gray-800 dark:text-gray-200">
                        {team.name}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    <TranslatedText text="No teams followed." />
                  </p>
                )}
              </div>

              {/* Followed Players */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  <TranslatedText text="Followed Players" />
                </h2>
                {followedPlayers.length > 0 ? (
                  followedPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="py-2.5 border-b last:border-b-0 border-gray-200 dark:border-gray-700"
                    >
                      <span className="text-gray-800 dark:text-gray-200">
                        {player.fullName}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    <TranslatedText text="No players followed." />
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* MAIN FEED */}
          <main className="col-span-12 lg:col-span-6 space-y-6">
            {!isModelLoaded && (
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
                <p className="text-blue-700 dark:text-blue-200">
                  Loading personalized recommendations...
                </p>
              </div>
            )}

            {combinedRecommendations.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 shadow rounded-lg p-4
                           transition-transform hover:-translate-y-0.5
                           hover:shadow-lg duration-300 ease-in-out"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {item.title}
                  </h3>
                  <div className="flex items-center space-x-4">
                    {/* Voting buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVote(item.id, "up")}
                        className={`p-1 rounded-md transition-colors ${
                          userVotes[item.id] === "up"
                            ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {votes[item.id]?.score || 0}
                      </span>
                      <button
                        onClick={() => handleVote(item.id, "down")}
                        className={`p-1 rounded-md transition-colors ${
                          userVotes[item.id] === "down"
                            ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                    {/* Save video button */}
                    {item.type === "video" && item.videoUrl && (
                      <button
                        onClick={() => handleSaveVideo(item)}
                        disabled={savedVideos.has(item.videoUrl)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
                          ${
                            savedVideos.has(item.videoUrl)
                              ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                              : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
                          }`}
                      >
                        {savedVideos.has(item.videoUrl)
                          ? "Saved"
                          : "Save Video"}
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  {item.description}
                </p>

                {/* If it's a video, show the video player */}
                {item.type === "video" && item.videoUrl && (
                  <div className="mt-4">
                    <video
                      controls
                      className="w-full rounded-lg"
                      poster="https://via.placeholder.com/768x432.png?text=Video+Placeholder"
                    >
                      <source src={item.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* Comments section */}
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Comments ({comments[item.id]?.length || 0})
                  </h4>

                  {/* Add comment form */}
                  <div className="flex items-start space-x-2 mb-6">
                    <textarea
                      value={newComments[item.id] || ""}
                      onChange={(e) =>
                        setNewComments((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="Add a comment..."
                      className="flex-1 min-h-[80px] p-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleAddComment(item.id)}
                      disabled={!newComments[item.id]?.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Post
                    </button>
                  </div>

                  {/* Comments list */}
                  <div className="space-y-4">
                    {comments[item.id]?.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <img
                          src={
                            comment.user.avatarUrl ||
                            "/images/default-avatar.jpg"
                          }
                          alt={comment.user.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {comment.user.username}
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {new Date(
                                    comment.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {comment.user_id === user?.id && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingComment(comment.id);
                                      setEditText(comment.content);
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(comment.id, item.id)
                                    }
                                    className="text-red-600 dark:text-red-400 hover:text-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            {editingComment === comment.id ? (
                              <div className="mt-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                                <div className="mt-2 flex justify-end space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingComment(null);
                                      setEditText("");
                                    }}
                                    className="px-3 py-1 text-gray-600 dark:text-gray-400
                                             hover:text-gray-700 dark:hover:text-gray-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateComment(comment.id, item.id)
                                    }
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg
                                             hover:bg-blue-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-1 text-gray-800 dark:text-gray-200">
                                {comment.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Infinity scroll sentinel */}
            <div ref={sentinelRef} className="h-10" />
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="col-span-3 hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  <TranslatedText text="Upcoming Games" />
                </h2>
                {eventsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`py-3 px-3 border-b last:border-b-0 border-gray-200 dark:border-gray-700 
                        ${
                          event.isHome ? "bg-green-50 dark:bg-green-900/20" : ""
                        } 
                        rounded-md transition-colors duration-200`}
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100 mr-2">
                        {event.date}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        <TranslatedText text={event.event} />
                      </span>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                        {event.teamName} {event.isHome ? "(Home)" : "(Away)"}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    <TranslatedText text="No upcoming games scheduled." />
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

export default RecommendationsPage;
