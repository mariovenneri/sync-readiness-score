import { useState } from "react";

const ScoreBreakdown = ({ track, musicAtlasRaw, onBack }) => {
  console.log("=== SCOREBREAKDOWN RECEIVED ===");
  console.log("Track:", track);
  console.log("MusicAtlas Raw:", musicAtlasRaw);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="bg-gray-100 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-4">
            {track.title} by {track.artist}
          </h1>
          
          <h2 className="text-xl font-semibold mb-2">MusicAtlas Data:</h2>
          <pre className="bg-white p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(musicAtlasRaw, null, 2)}
          </pre>

          <button
            onClick={onBack}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            ← Back to Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;