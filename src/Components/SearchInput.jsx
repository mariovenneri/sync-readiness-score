import { useEffect, useState } from "react";

const SearchInput = ({ onTrackSelected }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  console.log("User typed:", query);

  if (query.length < 2) {
    setResults([]);
    return;
  }

  const timer = setTimeout(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      const tracks = data.map(item => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        artwork: item.artwork || null
      }));

      setResults(tracks.slice(0, 8));
    } catch (error) {
      console.log("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  return () => clearTimeout(timer);
}, [query]);;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-8">
          <h1 className="text-5xl text-white font-bold text-center mb-2 tracking-tighter">
            Sync Readiness Score FRESH
          </h1>
          <p className="text-blue-300 text-center mb-10 text-lg tracking-tight">
            Search any song to see how sync-ready it is
          </p>

          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any song or artist..."
              className="w-full px-8 py-4 text-xl bg-white/10 border border-blue-500/50 rounded-full text-white placeholder-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:border-blue-400 transition-all"
            />

            {/* Analyze Button */}
            {query.includes(" – ") && (
              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    const [title, artist] = query.split(" – ");
                    onTrackSelected({ title, artist });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-14 rounded-full text-xl cursor-pointer shadow-lg transition"
                >
                  Analyze My Track
                </button>
              </div>
            )}

            {/* Dropdown */}
            {(loading || results.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-black/90 backdrop-blur-2xl rounded-2xl border border-blue-700/50 shadow-2xl overflow-hidden z-50">
                {loading && (
                  <div className="p-6 text-blue-400 text-center">
                    <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3">Searching MusicAtlas catalog...</span>
                  </div>
                )}

                {results.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      onTrackSelected(track);
                      setQuery(`${track.title} – ${track.artist}`);
                      setResults([]);
                    }}
                    className="w-full px-6 py-3 flex items-center gap-4 hover:bg-blue-900/40 transition text-left"
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

        <p className="text-center text-blue-400/60 text-sm mt-8">
          Powered by MusicAtlas.ai
        </p>
      </div>
    </div>
  );
};

export default SearchInput;