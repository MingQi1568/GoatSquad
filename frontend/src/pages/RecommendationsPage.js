// File: frontend/src/pages/RecommendationsPage.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../contexts/AuthContext";
import TranslatedText from "../components/TranslatedText";

function RecommendationsPage() {
  // Replace the dummy data with user data from AuthContext
  const { user } = useAuth();

  // Get followed teams and players from user data
  const followedTeams = user?.preferences?.teams || [];
  const followedPlayers = user?.preferences?.players || [];

  // For upcoming events in the right sidebar
  const upcomingEvents = [
    { id: 1, date: "Jan 20", event: "Spring Training Begins" },
    { id: 2, date: "Feb 14", event: "First Preseason Game" },
    { id: 3, date: "Mar 27", event: "Opening Day" },
  ];

  // ---------- Search-related state ----------
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // -------------- Recommendations state ---------------
  const [followRecommendations, setFollowRecommendations] = useState([]);
  const [modelRecommendations, setModelRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [followHasMore, setFollowHasMore] = useState(true);
  const [modelHasMore, setModelHasMore] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // ------------- Functions to fetch data -------------
  const fetchFollowRecommendations = async (pageNum, theSearchTerm) => {
    try {
      setIsLoadingMore(true);
      const token = localStorage.getItem("auth_token") || "";
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/recommend/follow?page=${pageNum}&search=${encodeURIComponent(
          theSearchTerm
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

            // Example: generate the description with Gemini
            const generated = await fetchDescriptionFromGemini(
              videoData.title || "MLB Highlight"
            );

            return {
              id: rec.reel_id,
              type: "video",
              title: videoData.success
                ? `${videoData.title} (follow)`
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
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/recommend/predict?user_id=${user.id}&page=${pageNum}&per_page=5&search=${encodeURIComponent(
          theSearchTerm
        )}`
      );
      const data = await response.json();

      if (data.success && Array.isArray(data.recommendations)) {
        const newRecs = await Promise.all(
          data.recommendations.map(async (rec) => {
            if (!rec.reel_id) return null;
            try {
              const videoRes = await fetch(
                `${process.env.REACT_APP_BACKEND_URL}/api/mlb/video?play_id=${rec.reel_id}`
              );
              const videoData = await videoRes.json();

              const generated = await fetchDescriptionFromGemini(
                videoData.title || "Baseball highlight"
              );

              if (!videoData.success) return null;

              return {
                id: rec.reel_id,
                type: "video",
                title: `${videoData.title} (model)`,
                description: generated,
                videoUrl: videoData.video_url,
                upvotes: Math.floor(rec.predicted_score || 0),
                downvotes: 0,
                comments: [],
              };
            } catch (err) {
              console.error("Error fetching single video data:", err);
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
    } catch (err) {
      console.error("Error fetching model recs:", err);
      setModelHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Example “Gemini” fetch for the description
  const fetchDescriptionFromGemini = async (title) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/generate-blurb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
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
    // If model not loaded yet, just show follow recs
    if (!isModelLoaded) return followRecommendations;

    // Otherwise, we interleave them. For simplicity, we just put follow recs first
    // and then model recs.
    return [...followRecommendations, ...modelRecommendations];
  }, [followRecommendations, modelRecommendations, isModelLoaded]);

  // Infinity scroll logic via IntersectionObserver
  const sentinelRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore && hasMore) {
          // load next page
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);

          // alternate calls
          const isEven = nextPage % 2 === 0;
          if (isEven) {
            fetchFollowRecommendations(Math.ceil(nextPage / 2), searchTerm);
          } else {
            fetchModelRecommendations(Math.ceil(nextPage / 2), searchTerm);
          }
        }
      },
      { rootMargin: "200px" }
    );
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [currentPage, hasMore, isLoadingMore, searchTerm]);

  // Check if we have more data to load:
  useEffect(() => {
    setHasMore(followHasMore || modelHasMore);
  }, [followHasMore, modelHasMore]);

  // Search logic: hitting 'Search' or 'Enter' resets page to 1 and re-fetches
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearching(true);
    setCurrentPage(1);
    // Clear existing recs so they get replaced
    setFollowRecommendations([]);
    setModelRecommendations([]);
    fetchFollowRecommendations(1, searchTerm).then(() => {
      fetchModelRecommendations(1, searchTerm).then(() => {
        setIsSearching(false);
      });
    });
  };

  // For expansions, new comment, etc. (omitted for brevity here)
  const [expandedPost, setExpandedPost] = useState(null);
  const [newComment, setNewComment] = useState("");

  // The rest of your upvote/downvote logic or handleTimeUpdate, etc. omitted for brevity

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <input
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                         disabled:opacity-50 transition-colors"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* LEFT SIDEBAR */}
          <aside className="col-span-3 hidden lg:block relative">
            <div className="fixed w-[280px] left-[calc((100vw-80rem)/2+1.5rem)] space-y-6 top-24">
              {/* Followed Teams */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  <TranslatedText text="Followed Teams" />
                </h2>
                {followedTeams.length > 0 ? (
                  followedTeams.map((team) => (
                    <div
                      key={team.id}
                      className="py-2 border-b last:border-b-0 border-gray-200 dark:border-gray-700"
                    >
                      <span className="text-gray-800 dark:text-gray-200">{team.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    <TranslatedText text="No teams followed." />
                  </p>
                )}
              </div>

              {/* Followed Players */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  <TranslatedText text="Followed Players" />
                </h2>
                {followedPlayers.length > 0 ? (
                  followedPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="py-2 border-b last:border-b-0 border-gray-200 dark:border-gray-700"
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
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-4">
                <p className="text-blue-700 dark:text-blue-200">
                  Loading personalized recommendations... Meanwhile, enjoy highlights from your favorites!
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
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-gray-700 dark:text-gray-300">{item.description}</p>

                {/* Example: show video if item.type==="video" */}
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

                {/* Example buttons, up/downvote, etc. omitted */}
              </div>
            ))}

            {/* Infinity scrolling sentinel */}
            <div ref={sentinelRef} className="h-10" />
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="col-span-3 hidden lg:block relative">
            <div className="fixed w-[280px] right-[calc((100vw-80rem)/2+1.5rem)] top-24">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  <TranslatedText text="Upcoming Events" />
                </h2>
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="py-2 border-b last:border-b-0 border-gray-200 dark:border-gray-700"
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100 mr-2">
                      {event.date}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      <TranslatedText text={event.event} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* You can put your modal markup here if needed */}
    </PageTransition>
  );
}

export default RecommendationsPage;
