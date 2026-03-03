// Components/SearchInput.jsx - Spotify Search with Add Track
import { useEffect, useState, useRef } from "react";

const SearchInput = ({ onTrackSelected }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrackFromList, setSelectedTrackFromList] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);

  useEffect(() => {
    console.log("Search query changed:", query);
    
    if (query.length < 2) {
      setResults([]);
      setHighlightedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      console.log("=== SEARCHING SPOTIFY ===");
      console.log("Query:", query);
      
      setLoading(true);
      try {
        const response = await fetch(`/api/spotify-search?q=${encodeURIComponent(query)}`);
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        console.log("Results received:", data);
        console.log("Number of tracks:", data.tracks?.length);

        setResults(data.tracks || []);
        setHighlightedIndex(-1);

      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAddTrack = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddMessage("");

    try {
      const response = await fetch('/api/add-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: addArtist,
          title: addTitle
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAddMessage("Track added! It will be processed soon. Try searching for it in a few minutes.");
        setAddArtist("");
        setAddTitle("");
      } else {
        setAddMessage("Error: " + (data.message || "Failed to add track"));
      }
    } catch (error) {
      setAddMessage("Error adding track");
    } finally {
      setAddLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (results.length === 0) {
      // If no dropdown but user has selected a track, allow Enter to submit
      if (e.key === "Enter" && selectedTrackFromList) {
        e.preventDefault();
        onTrackSelected(selectedTrackFromList);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectTrack(results[highlightedIndex]);
    }
  };

  const handleSelectTrack = (track) => {
    console.log("=== USER CLICKED TRACK ===");
    console.log("Track:", track);
    console.log("Duration (ms):", track.duration_ms);
    setSelectedTrackFromList(track);
    setQuery(`${track.title} – ${track.artist}`);
    setResults([]);
    setHighlightedIndex(-1);
    
    // Refocus input so Enter key works
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="min-h-full bg-linear-to-tl from-gray-950 from-15% via-black via-50% to-gray-950 to-85%">
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl relative z-10">
          <div className="bg-gray-950 rounded-3xl shadow-2xl p-8 border-gray-900 border">
            <div className="relative top-5 mb-1">

              {/* logo and title */}
              <svg width="450" height="120" viewBox="0 0 300 80" className="mx-auto" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="f2" x1="0%" x2="100%">
                    <stop offset="0%" stop-color="#93C5FD"/>
                    <stop offset="100%" stop-color="#8B5CF6"/>
                  </linearGradient>
                </defs>
                
                <circle cx="30" cy="40" r="24" fill="none" stroke="url(#f2)" stroke-width="2.5" opacity="0.2"/>
                <path d="M 12 40 L 18 40 L 21 30 L 24 50 L 27 33 L 30 47 L 33 37 L 38 43 L 40 40 L 48 30 L 56 20" stroke="url(#f2)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

                <text x="65" y="52" font-family="Arial" font-size="42" font-weight="700" letterSpacing={-1} fill="#FFFFFF">Sync</text>
                <text x="162" y="52" font-family="Arial" font-size="42" font-weight="700" letterSpacing={-1} fill="url(#f2)">Check</text>
              </svg>
            </div>
            <p className="text-blue-300 text-center text-xl md:text-2xl mb-3">
              Get Your Music into TV and Film
            </p>
            <p className="block mx-auto text-white leading-relaxed text-center mb-10 wrap-break-word max-w-lg">
            See how well your song fits TV, film, ads, and commercials — the higher your SyncCheck, the higher your chances of placement.
          </p>

            <div className="relative pb-10">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  console.log("User typing:", e.target.value);
                  setQuery(e.target.value);
                  setSelectedTrackFromList(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search any song or artist..."
                className="w-full sm:px-8 px-4 py-4 sm:text-xl bg-white/10 border border-blue-500/50 rounded-full text-white placeholder-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:border-blue-400 transition-all "
              />
              
              {/* Circular Send Button - inside the input */}
              <button
                onClick={() => {
                  if (selectedTrackFromList) {
                    onTrackSelected(selectedTrackFromList);
                  }
                }}
                disabled={!selectedTrackFromList}
                className="absolute right-2 top-2 w-11 h-11 flex items-center justify-center border border-blue-500 rounded-full bg-blue-600 hover:bg-blue-500 hover:scale-110 hover:shadow-blue-500/50 text-white transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-400/50"
              >
                <i className='bx bx-right-arrow-alt text-xl'></i>
              </button>

              {/* Dropdown */}
              {(loading || results.length > 0) && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-black/90 backdrop-blur-2xl rounded-2xl border border-blue-700/50 shadow-2xl overflow-hidden z-50">
                  {loading && (
                    <div className="p-6 text-blue-400 text-center">
                      <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-3">Searching Spotify...</span>
                    </div>
                  )}

                  {results.map((track, index) => (
                    <button
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className={`w-full px-6 py-3 flex items-center gap-4 hover:bg-blue-900/40 transition text-left ${
                        index === highlightedIndex ? 'bg-blue-900/40' : ''
                      }`}
                    >
                      {track.artwork ? (
                        <img src={track.artwork} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-blue-900/50 rounded-lg" />
                      )}
                      <div>
                        <div className="font-semibold text-white">{track.title}</div>
                        <div className="text-blue-300 text-sm">{track.artist}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              
            </div>
          </div>

        <div className="px-4 text-center flex items-center justify-center gap-2">
        </div>
          <a 
            href="https://musicatlas.ai"
            className="flex justify-center text-blue-400/60 text-sm mt-5 hover:text-blue-400/75 transition duration-300"
          >
            Powered by MusicAtlas.ai
          </a>
        </div>
      </div>
    </div>
  );
};

export default SearchInput;

// See how well your song fits TV, film, ads, and commercials — a high score means more placement chances.