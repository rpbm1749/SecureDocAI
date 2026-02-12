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

function ViewFiles() {
  const [filesByCategory, setFilesByCategory] = useState({});
  const [openCategory, setOpenCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [sharingFile, setSharingFile] = useState(null);
  const [shareEmail, setShareEmail] = useState("");

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

  const handleDownload = async (filename) => {
    try {
      const userId = localStorage.getItem("userId");
      await invoke("download_file", { userId, filename });
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
      await invoke("delete_user_file", { userId, filename });
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

  const handleShare = async (filename, e) => {
    e.stopPropagation();
    setSharingFile(filename);
    setShareEmail("");
  };

  const handleShareSubmit = async (filename) => {
    if (!shareEmail) {
      alert("Please enter an email");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      await invoke("share_file", { userId, filename, recipientEmail: shareEmail });
      alert("File shared successfully!");
      setSharingFile(null);
      setShareEmail("");
    } catch (err) {
      alert("Share failed: " + err);
    }
  };

  const handleCancelShare = () => {
    setSharingFile(null);
    setShareEmail("");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8">
        <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-lg font-medium">Loading your files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 bg-gradient-to-br from-red-900/20 to-red-800/20 border-2 border-red-600 rounded-xl p-12 m-8">
        <p className="text-5xl">⚠️</p>
        <p className="text-red-300 text-lg text-center font-medium">{error}</p>
      </div>
    );
  }

  if (!openCategory) {
    return (
      <div className="w-full max-w-6xl mx-auto px-6 py-12">
        <div className="pb-15">
          <h1 className="text-4xl font-bold text-center text-white mb-2">📁 My Files</h1>
          <p className="text-center text-gray-400">Manage and organize your documents</p>
        </div>
        
        {Object.keys(filesByCategory).length === 0 ? (
          <div className="text-center py-24 px-12 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-gray-600 rounded-2xl">
            <p className="text-gray-400 text-2xl mb-4 font-semibold">No files yet</p>
            <p className="text-gray-500 text-lg">Upload your first file to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(filesByCategory).map(([category, files]) => (
              <div
                key={category}
                onClick={() => setOpenCategory(category)}
                className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-blue-500 rounded-xl p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transform"
              >
                <div className="text-5xl mb-4 pb-4">📂</div>
                <h3 className="text-xl font-semibold text-gray-200 pb-3 mb-4">{category}</h3>
                <span className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-500 text-blue-300 text-sm rounded-full font-medium">
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
    <div className="w-full max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <button
          onClick={() => setOpenCategory(null)}
          className="mb-8 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-lg border border-blue-500 hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200"
        >
          ← Back to Categories
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
            📁 {openCategory}
          </h1>
          <p className="text-center text-gray-400 text-lg">{files.length} file{files.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-24 px-12 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-gray-600 rounded-2xl">
          <p className="text-gray-400 text-xl font-semibold">No files in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map(filename => (
            <div
              key={filename}
              className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 hover:border-blue-500 rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-105"
            >
              <div className="text-5xl mb-4 text-center">📄</div>
              <p className="text-gray-200 font-medium text-center mb-6 break-words text-sm min-h-12 flex items-center justify-center">{filename}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDownload(filename)}
                  className="flex-1 px-3 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-blue-100 text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-105"
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  onClick={(e) => handleShare(filename, e)}
                  className="flex-1 px-3 py-3 bg-gradient-to-r from-green-600 to-green-700 text-green-100 text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-green-500/40 transition-all duration-200 transform hover:scale-105"
                  title="Share"
                >
                  🤝
                </button>
                <button
                  onClick={(e) => handleDelete(filename, e)}
                  disabled={deleting === filename}
                  className="flex-1 px-3 py-3 bg-gradient-to-r from-red-600 to-red-700 text-red-100 text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-red-500/40 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                  title="Delete"
                >
                  {deleting === filename ? '⏳' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sharingFile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-blue-500 rounded-xl p-10 max-w-md w-full shadow-2xl transform transition-all">
            <h3 className="text-2xl font-bold text-white mb-6">Share File</h3>
            <p className="text-gray-300 text-sm mb-6">Sharing: <span className="font-semibold text-blue-300 block mt-2">{sharingFile}</span></p>
            <input
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="recipient@email.com"
              className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 mb-8 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/30 transition-all"
            />
            <div className="flex gap-4">
              <button
                onClick={() => handleShareSubmit(sharingFile)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-green-500/40 transition-all duration-200 border border-green-500"
              >
                Share
              </button>
              <button
                onClick={handleCancelShare}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 font-semibold rounded-lg hover:shadow-lg hover:shadow-gray-500/30 transition-all duration-200 border border-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewFiles;
