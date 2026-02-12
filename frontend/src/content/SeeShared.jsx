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

function SeeSharedFiles() {
  const [filesByCategory, setFilesByCategory] = useState({});
  const [openCategory, setOpenCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) throw new Error("User not authenticated");

        const result = await invoke("list_shared_metadata", { userId });
        const metadataList = JSON.parse(result);
        
        const grouped = {};
        metadataList.forEach(file => {
          const category = file.category || "Shared";
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

  const handleDownload = async (filename) => {
    try {
      const userId = localStorage.getItem("userId");
      await invoke("download_shared_file", { userId, filename });
      alert("File downloaded successfully!");
    } catch (err) {
      alert("Download failed: " + err);
    }
  };

  const handleDelete = async (filename, e) => {
    e.stopPropagation();
    if (!confirm(`Delete ${filename}?`)) return;

    setDeleting(filename);
    try {
      const userId = localStorage.getItem("userId");
      await invoke("delete_shared_file", { userId, filename });
      setFilesByCategory(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(cat => {
          updated[cat] = updated[cat].filter(f => f !== filename);
          if (updated[cat].length === 0) delete updated[cat];
        });
        return updated;
      });
    } catch (err) {
      alert("Delete failed: " + err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-lg">Loading shared files...</p>
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

  if (!openCategory) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-white mb-8">🤝 Shared Files</h1>
        
        {Object.keys(filesByCategory).length === 0 ? (
          <div className="text-center py-16 px-8 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-gray-600 rounded-lg">
            <p className="text-gray-400 text-xl mb-2">No shared files yet</p>
            <p className="text-gray-500">Files shared with you will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(filesByCategory).map(([category, files]) => (
              <div
                key={category}
                onClick={() => setOpenCategory(category)}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-green-500 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:scale-105 transform"
              >
                <div className="text-4xl mb-3">📂</div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2">{category}</h3>
                <span className="inline-block px-3 py-1 bg-green-600/20 border border-green-500 text-green-300 text-sm rounded-full font-medium">
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
        className="mb-6 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-medium rounded-lg border border-green-500 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200"
      >
        ← Back to Categories
      </button>

      <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-8">
        🤝 {openCategory}
      </h1>

      {files.length === 0 ? (
        <div className="text-center py-16 px-8 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-gray-600 rounded-lg">
          <p className="text-gray-400 text-xl">No files in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map(filename => (
            <div
              key={filename}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-green-500 rounded-lg p-6 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 hover:scale-105"
            >
              <div className="text-4xl mb-3 text-center">📄</div>
              <p className="text-gray-200 font-medium text-center mb-4 break-words text-sm">{filename}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(filename)}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-green-100 text-sm font-medium rounded hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200"
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  onClick={(e) => handleDelete(filename, e)}
                  disabled={deleting === filename}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-red-100 text-sm font-medium rounded hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200 disabled:opacity-50"
                  title="Delete"
                >
                  {deleting === filename ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SeeSharedFiles;