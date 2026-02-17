// Components/Processing.jsx
const Processing = ({ track, onBack }) => {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="relative bg-gray-800 rounded-3xl shadow-2xl overflow-hidden p-10 sm:p-14 text-center">
          
          {/* Bottom angled color layer */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 bg-blue-900/40"
            style={{ clipPath: "polygon(0 15%, 100% 0%, 100% 100%, 0% 100%)" }}
          />

          <div className="relative z-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 text-yellow-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>

            {/* Track info */}
            <p className="text-blue-300 text-sm mb-1">Currently being analyzed:</p>
            <div className="flex justify-center items-center flex-wrap gap-2 mb-6">
              <p className="text-white text-2xl sm:text-3xl tracking-tight leading-tight font-bold">"{track.title}"</p>
              <span className="text-blue-400 text-xl sm:text-2xl">by {track.artist}</span>
            </div>

            {/* Message */}
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-6 mb-8">
              <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                We've submitted this track to our database and it's currently being analyzed.{" "}
                <strong className="text-white">This usually takes a few minutes</strong> — try searching another song in the meantime and come back to this one shortly!
              </p>
            </div>

            {/* Back button */}
            <button
              onClick={onBack}
              className="inline-block bg-blue-600 hover:bg-blue-500 hover:scale-105 text-white font-bold py-3 px-8 sm:py-4 sm:px-10 rounded-full text-base sm:text-lg shadow-2xl transition-all duration-300"
            >
              ← Search Another Track
            </button>

            <p className="text-gray-500 text-xs mt-6 italic">
              Powered by MusicAtlas.ai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Processing;