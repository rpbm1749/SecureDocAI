import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { auth } from "../firebase";
import "../styles/AddFile.css";

function AddFile() {
  const [isDragging, setIsDragging] = useState(false);
  const [filePath, setFilePath] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileSize, setFileSize] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ---------- DRAG UI ONLY (no path extraction here) ----------
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    alert("Drag & drop is not supported yet. Please click to browse.");
  };

  // ---------- TAURI FILE PICKER ----------
  const handleBrowse = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        { name: "Documents", extensions: ["pdf", "png", "jpg", "jpeg"] }
      ]
    });

    if (!selected) return;

    // Tauri returns absolute path
    setFilePath(selected);
    setFileName(selected.split(/[/\\]/).pop());

    // Size is optional; only for UI
    try {
      const stat = await window.__TAURI__.fs.stat(selected);
      setFileSize(stat.size);
    } catch {
      setFileSize(null);
    }
  };

  // ---------- UPLOAD ----------
    const handleUpload = async () => {
    if (!filePath) {
        alert("Please select a file first");
        return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Please login again");
        return;
    }

    setUploading(true);

    try {
        await invoke("process_file", {
            filePath: filePath,
            userId: userId
        });

        alert("File processed successfully");

        setFilePath(null);
        setFileName(null);
        setFileSize(null);
    } catch (err) {
        console.error(err);
        alert("Upload failed");
    } finally {
        setUploading(false);
    }
    };

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="uploadContainer">
        {!filePath ? (
          <div
            className={`uploadBox ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="uploadIcon">📄</div>
            <h2 className="uploadTitle">Drag & Drop Your Document</h2>
            <p className="uploadSubtitle">or</p>
            <button className="uploadButton" onClick={handleBrowse}>
              Click to Browse
            </button>
          </div>
        ) : (
          <div className="uploadBox">
            <div className="uploadSuccess">✓</div>
            <h2 className="uploadTitle">{fileName}</h2>
            {fileSize && (
              <p className="uploadSubtitle">
                {(fileSize / 1024).toFixed(2)} KB
              </p>
            )}
            <div className="uploadActions">
              <button
                className="uploadButtonSubmit"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "Processing..." : "Upload File"}
              </button>
              <button
                className="uploadButtonCancel"
                onClick={() => {
                  setFilePath(null);
                  setFileName(null);
                  setFileSize(null);
                }}
                disabled={uploading}
              >
                Choose Different
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddFile;
