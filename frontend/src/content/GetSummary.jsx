import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function GetSummary() {
  const [filesByCategory, setFilesByCategory] = useState({});
  const [openCategory, setOpenCategory] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) throw new Error("User not authenticated");

        const result = await invoke("list_user_metadata", { userId });
        const metadataList = JSON.parse(result);
        
        const grouped = {};
        metadataList.forEach(file => {
          const category = file.category || "Uncategorized";
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push(file.filename);
        });
        
        setFilesByCategory(grouped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleGetSummary = async (filename) => {
    setSummaryLoading(true);
    try {
      const userId = localStorage.getItem("userId");
      const result = await invoke("summarize_file", { userId, filename });
      setSummary(result);
      setSelectedFile(filename);
    } catch (err) {
      alert("Summary generation failed: " + err);
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-lg">Loading your files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-gradient-to-br from-red-900/20 to-red-800/20 border-2 border-red-600 rounded-lg p-8">
        <p className="text-4xl">⚠️</p>
        <p className="text-red-300 text-lg text-center">{error}</p>
      </div>
    );
  }

  if (summary !== null) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <button
          onClick={() => setSummary(null)}
          className="mb-6 px-4 py-3 bg-gradient-to-r from-yellow-600 to-amber-700 text-white font-medium rounded-lg border border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-200"
        >
          ← Back to Files
        </button>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-500 rounded-lg p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 mb-2">
            📝 Summary
          </h2>
          <p className="text-gray-400 text-sm mb-6">File: <span className="font-semibold text-gray-300">{selectedFile}</span></p>
          
          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6 mb-6">
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{summary}</p>
          </div>

          <button
            onClick={() => setSummary(null)}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 font-semibold rounded-lg hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-200 border border-gray-500"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!openCategory) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-white mb-8 pb-8">📝 Get Summary</h1>
        
        {Object.keys(filesByCategory).length === 0 ? (
          <div className="text-center py-16 px-8 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-gray-600 rounded-lg">
            <p className="text-gray-400 text-xl mb-2">No files yet</p>
            <p className="text-gray-500">Upload files to generate summaries</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(filesByCategory).map(([category, files]) => (
              <div
                key={category}
                onClick={() => setOpenCategory(category)}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-yellow-500 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20 hover:scale-105 transform"
              >
                <div className="text-4xl mb-3 pb-4">📂</div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2 pb-3">{category}</h3>
                <span className="inline-block px-3 py-1 bg-yellow-600/20 border border-yellow-500 text-yellow-300 text-sm rounded-full font-medium">
                  {files.length} file{files.length !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const files = filesByCategory[openCategory] || [];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <button
        onClick={() => setOpenCategory(null)}
        className="mb-6 px-4 py-3 bg-gradient-to-r from-yellow-600 to-amber-700 text-white font-medium rounded-lg border border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-200"
      >
        ← Back to Categories
      </button>

      <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 mb-8">
        📝 {openCategory}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map(filename => (
          <div
            key={filename}
            className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-yellow-500 rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20 hover:scale-105"
          >
            <div className="text-4xl mb-3 text-center">📄</div>
            <p className="text-gray-200 font-medium text-center mb-4 break-words text-sm">{filename}</p>
            <button
              onClick={() => handleGetSummary(filename)}
              disabled={summaryLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-amber-700 text-yellow-100 font-semibold rounded-lg hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-200 border border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {summaryLoading ? '⏳ Generating...' : '📝 Summarize'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GetSummary;
