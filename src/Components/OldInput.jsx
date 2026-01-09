import { useState } from "react"

const Input = ({ onAnalyze }) => {

  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("audio/")){
      setFile(selectedFile)
    }
  }

  const handleAnalyze = () => {
    if (file) {
      onAnalyze(file)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 -mt-20">
      <h1 className="text-5xl md:text-7xl text-center font-bold tracking-tight">
        Sync Readiness Score
      </h1>
      <p className="text-xl md:text-2xl pt-1 mb-12 text-center max-w-3xl">
        Drop your track and discover in seconds if it's ready for TV, film & trailers.
      </p>
      <div className="w-full max-w-2xl space-y-10">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="block w-full text-md file:mr-6 file:py-4 file:px-8 file:rounded-full file:border-0 file:cursor-pointer file:bg-amber-600 hover:file:bg-amber-500 "
        />
        {file && (
          <div className="text-center">
            <p className="text-xl">Selected: <span className="font-bold text-white">{file.name}</span></p>
          </div>
        )}
        <div className="text-center">
          <button
            onClick={handleAnalyze}
            disabled={!file}
            className={`px-8 py-6 rounded-full text-xl transition-all transform hover:scale-105
              ${file 
                ? "bg-orange-600"
                : "bg-gray-600 opacity-50 cursor-not-allowed"
              }`}
          >
            Analyze My Track
          </button>
        </div>
      </div>
    </div>
  );
}

export default Input