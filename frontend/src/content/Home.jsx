import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function Home() {
  const [userInfo, setUserInfo] = useState(null);
  const [fileStats, setFileStats] = useState({
    totalFiles: 0,
    categories: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        
        // Get email from Firebase Auth
        let userEmail = "No email";
        onAuthStateChanged(auth, (user) => {
          if (user) {
            userEmail = user.email;
          }
        });
        
        if (userId) {
          setUserInfo({
            email: userEmail
          });

          // Fetch file metadata to get category stats
          const result = await invoke("list_user_metadata", {
            userId
          });

          const metadataList = JSON.parse(result);
          
          // Count files by category
          const categories = {};
          metadataList.forEach(file => {
            const category = file.category || "Uncategorized";
            categories[category] = (categories[category] || 0) + 1;
          });

          setFileStats({
            totalFiles: metadataList.length,
            categories
          });
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const colors = {
    "bill": "#FF6B6B",
    "invoice": "#4ECDC4",
    "receipt": "#45B7D1",
    "contract": "#FFA07A",
    "report": "#98D8C8",
    "general document": "#F7DC6F",
    "Uncategorized": "#BDC3C7"
  };

  const getCategoryColor = (category) => colors[category] || "#95A5A6";

  return (
    <div className="flex items-center justify-center h-full w-full bg-gray-900">
      <div className="w-full max-w-6xl px-8 py-12 space-y-10">
        {/* User Info Section */}
        {userInfo && (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-xl text-white border border-blue-500">
            <div className="p-100 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3">Welcome back! 👋</h1>
                <p className="text-blue-100 text-lg">
                  <span className="font-semibold">Email:</span> {userInfo.email}
                </p>
              </div>
              <div className="text-7xl opacity-20">📄</div>
            </div>
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-3 gap-6 m-6 p-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-8 border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Documents</p>
                <p className="text-5xl font-bold text-white mt-3">{fileStats.totalFiles}</p>
              </div>
              <div className="text-6xl opacity-30">📁</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-8 border border-gray-700 hover:border-green-500 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Categories</p>
                <p className="text-5xl font-bold text-white mt-3">{Object.keys(fileStats.categories).length}</p>
              </div>
              <div className="text-6xl opacity-30">🏷️</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-8 border border-gray-700 hover:border-emerald-500 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Status</p>
                <p className="text-3xl font-bold text-green-400 mt-3">✓ Active</p>
              </div>
              <div className="text-6xl opacity-30">⚡</div>
            </div>
          </div>
        </div>

        {/* Main Statistics Section */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-10 border border-gray-700">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8 pb-8">📊 Your Document Statistics</h2>
          
          {/* Total Files Display */}
          <div className="mb-10 p-8 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl border border-blue-700 shadow-lg">
            <p className="text-gray-300 text-sm font-medium mb-2">Total Documents Uploaded</p>
            <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">{fileStats.totalFiles}</p>
          </div>

          {/* Category Distribution */}
          {fileStats.totalFiles > 0 && (
            <div className="mt-10">
              <h3 className="text-2xl font-semibold text-gray-200 mb-8 p-6">Document Types Breakdown</h3>
              <div className="space-y-6">
                {Object.entries(fileStats.categories).map(([category, count]) => {
                  const percentage = ((count / fileStats.totalFiles) * 100).toFixed(1);
                  return (
                    <div key={category} className="group">
                      <div className="flex items-center gap-6 p-6 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all duration-200 transform hover:scale-102 cursor-pointer">
                        <div 
                          className="w-5 h-5 rounded-full shadow-md flex-shrink-0" 
                          style={{ backgroundColor: getCategoryColor(category) }}
                        ></div>
                        <span className="font-medium text-gray-200 w-48">{category}</span>
                        <div className="flex-1 bg-gray-600 rounded-full h-8 overflow-hidden shadow-sm">
                          <div 
                            className="h-full rounded-full transition-all shadow-md"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: getCategoryColor(category)
                            }}
                          ></div>
                        </div>
                        <span className="text-base text-gray-300 w-24 text-right font-semibold">
                          {count} ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {fileStats.totalFiles === 0 && (
            <div className="text-center py-16 px-8 bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl border-2 border-dashed border-gray-600">
              <p className="text-gray-400 text-lg mb-4">No documents yet. Start by uploading your first file! 📄</p>
              <p className="text-gray-500 text-base">Upload documents to organize and manage them securely</p>
            </div>
          )}
        </div>

        {/* Activity Timeline Section */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl p-10 border border-gray-700">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-8 pb-6">🎯 Getting Started Guide</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-6 items-start pb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-lg">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-xl font-semibold text-white mb-2">Upload Documents</h3>
                <p className="text-gray-400 text-base">Start by uploading your important documents. Our system will automatically encrypt and securely store them in the cloud.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start pb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center border-2 border-green-500 shadow-lg">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-xl font-semibold text-white mb-2">Organize & Manage</h3>
                <p className="text-gray-400 text-base">View your files organized by category, download them anytime, and keep everything organized in one secure location.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start pb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-700 rounded-full flex items-center justify-center border-2 border-purple-500 shadow-lg">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-xl font-semibold text-white mb-2">Share & Collaborate</h3>
                <p className="text-gray-400 text-base">Share your documents with others via email. They can access shared files securely while you maintain full control.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-600 to-amber-700 rounded-full flex items-center justify-center border-2 border-yellow-500 shadow-lg">
                <span className="text-white font-bold text-lg">4</span>
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-xl font-semibold text-white mb-2">Advanced Features</h3>
                <p className="text-gray-400 text-base">Redact sensitive information from PDFs, generate AI-powered summaries, and unlock powerful document management tools.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-2 gap-6 pt-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-8 border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
            <div className="flex items-start gap-5">
              <div className="text-4xl flex-shrink-0">🔐</div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Secure Storage</h3>
                <p className="text-gray-400 text-base leading-relaxed">Your documents are encrypted and stored securely in the cloud with enterprise-grade security</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-8 border border-gray-700 hover:border-green-500 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
            <div className="flex items-start gap-5">
              <div className="text-4xl flex-shrink-0">🤝</div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Easy Sharing</h3>
                <p className="text-gray-400 text-base leading-relaxed">Share your documents with others while maintaining control over who has access</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-8 border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20">
            <div className="flex items-start gap-5">
              <div className="text-4xl flex-shrink-0">📝</div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Smart Redaction</h3>
                <p className="text-gray-400 text-base leading-relaxed">Redact sensitive information from your documents easily and securely</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-8 border border-gray-700 hover:border-yellow-500 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20">
            <div className="flex items-start gap-5">
              <div className="text-4xl flex-shrink-0">✨</div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">AI Summaries</h3>
                <p className="text-gray-400 text-base leading-relaxed">Get instant summaries of your documents with AI technology</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;