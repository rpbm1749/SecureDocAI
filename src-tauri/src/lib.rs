use std::process::Command;
use serde::Serialize;

#[tauri::command]
async fn process_file(file_path: String, user_id: String) -> Result<String, String> {
    println!("User ID: {}", &user_id);
    println!("File path: {}", &file_path);

    // Validate inputs
    if file_path.is_empty() || user_id.is_empty() {
        return Err("File path and user ID cannot be empty".into());
    }

    let output = Command::new("C:\\Users\\ragha\\AppData\\Local\\Programs\\Python\\Python312\\python.exe")
        .arg("D:/Projects_final/SecureDocAI/backend/main.py")
        .arg(&file_path)
        .arg(&user_id)
        .output()
        .map_err(|e| format!("Failed to execute Python: {}", e))?;

    println!("PYTHON STDOUT: {}", String::from_utf8_lossy(&output.stdout));
    println!("PYTHON STDERR: {}", String::from_utf8_lossy(&output.stderr));

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python process failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.to_string())
}

#[derive(Serialize)]
struct ShareResponse {
    success: bool,
    message: String,
    details: String,
}

#[tauri::command]
async fn share_file(
    user_id: String,
    filename: String,
    recipient_email: String,
) -> Result<ShareResponse, String> {
    // Validate inputs
    if user_id.is_empty() || filename.is_empty() || recipient_email.is_empty() {
        return Err("User ID, filename, and recipient email cannot be empty".into());
    }

    let output = tauri::async_runtime::spawn_blocking(move || {
        Command::new("python")
            .arg("D:/Projects_final/SecureDocAI/backend/sharing.py")
            .arg(&user_id)
            .arg(&filename)
            .output()
    })
    .await
    .map_err(|e| format!("Task execution failed: {}", e))?
    .map_err(|e| format!("Failed to execute Python: {}", e))?;

    if output.status.success() {
        Ok(ShareResponse {
            success: true,
            message: format!("File shared successfully with {}", recipient_email),
            details: String::from_utf8_lossy(&output.stdout).to_string(),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        println!("Share failed: {}", stderr);
        Err(stderr)
    }
}

#[tauri::command]
async fn list_shared_metadata(user_id: String) -> Result<String, String> {
    println!("User ID: {}", &user_id);

    // Validate input
    if user_id.is_empty() {
        return Err("User ID cannot be empty".into());
    }

    let output = std::process::Command::new("python")
        .arg("D:/Projects_final/SecureDocAI/backend/list_shared_metadata.py")
        .arg(&user_id)
        .output()
        .map_err(|e| format!("Failed to execute Python: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to list metadata: {}", stderr));
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
async fn list_user_metadata(user_id: String) -> Result<String, String> {
    if user_id.is_empty() {
        return Err("User ID cannot be empty".into());
    }

    let output = tauri::async_runtime::spawn_blocking(move || {
        std::process::Command::new(
            "C:\\Users\\ragha\\AppData\\Local\\Programs\\Python\\Python312\\python.exe"
        )
        .arg("D:/Projects_final/SecureDocAI/backend/list_metadat.py")
        .arg(&user_id)
        .output()
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| format!("Failed to execute Python: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to list metadata: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

use tauri_plugin_dialog::DialogExt;

#[tauri::command]
async fn download_user_file(app: tauri::AppHandle, user_id: String, filename: String) -> Result<String, String> {
    // Validate inputs
    if user_id.is_empty() || filename.is_empty() {
        return Err("User ID and filename cannot be empty".into());
    }

    let file_path = app
        .dialog()
        .file()
        .set_file_name(&filename)
        .blocking_save_file()
        .ok_or("Save cancelled")?;

    // Convert FilePath to PathBuf
    let save_path = file_path.as_path().ok_or("Invalid file path")?;

    let output = std::process::Command::new("python")
        .arg("D:/Projects_final/SecureDocAI/backend/download_user_file.py")
        .arg(&user_id)
        .arg(&filename)
        .arg(save_path.to_str().ok_or("Path contains invalid characters")?)
        .output()
        .map_err(|e| format!("Failed to execute Python: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python download failed: {}", stderr));
    }

    Ok(format!("File downloaded successfully to: {}", save_path.display()))
}

#[tauri::command]
async fn download_shared_file(app: tauri::AppHandle, user_id: String, filename: String) -> Result<String, String> {
    // Validate inputs
    if user_id.is_empty() || filename.is_empty() {
        return Err("User ID and filename cannot be empty".into());
    }

    let file_path = app
        .dialog()
        .file()
        .set_file_name(&filename)
        .blocking_save_file()
        .ok_or("Save cancelled")?;

    // Convert FilePath to PathBuf
    let save_path = file_path.as_path().ok_or("Invalid file path")?;

    let output = std::process::Command::new("python")
        .arg("D:/Projects_final/SecureDocAI/backend/download_shared_data.py")
        .arg(&user_id)
        .arg(&filename)
        .arg(save_path.to_str().ok_or("Path contains invalid characters")?)
        .output()
        .map_err(|e| format!("Failed to execute Python: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python download failed: {}", stderr));
    }

    Ok(format!("File downloaded successfully to: {}", save_path.display()))
}

#[tauri::command]
async fn redact_user_file(app: tauri::AppHandle, user_id: String, filename: String) -> Result<String, String> {
    // Validate inputs
    if user_id.is_empty() || filename.is_empty() {
        return Err("User ID and filename cannot be empty".into());
    }

    // Show save dialog
    let base_name = filename.split('.').next().unwrap_or(&filename);
    let default_filename = format!("{}_redacted.pdf", base_name);
    
    let file_path = app
        .dialog()
        .file()
        .set_file_name(&default_filename)
        .blocking_save_file()
        .ok_or("Save cancelled")?;

    // Convert FilePath to PathBuf
    let save_path = file_path.as_path().ok_or("Invalid file path")?;

    let output = std::process::Command::new("python")
        .arg("D:/Projects_final/SecureDocAI/backend/redact_user_file.py")
        .arg(&user_id)
        .arg(&filename)
        .arg(save_path.to_str().ok_or("Path contains invalid characters")?)
        .output()
        .map_err(|e| format!("Failed to execute Python: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python redaction failed: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
async fn get_document_summary(user_id: String, filename: String) -> Result<String, String> {
    // Validate inputs
    if user_id.is_empty() || filename.is_empty() {
        return Err("User ID and filename cannot be empty".into());
    }

    let output = std::process::Command::new("python")
        .arg("D:/Projects_final/SecureDocAI/backend/get_summary.py")
        .arg(&user_id)
        .arg(&filename)
        .output()
        .map_err(|e| format!("Failed to execute Python: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python summary failed: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
async fn delete_user_file(user_id: String, filename: String) -> Result<String, String> {
    // Validate inputs
    if user_id.is_empty() || filename.is_empty() {
        return Err("User ID and filename cannot be empty".into());
    }

    let output = std::process::Command::new("python")
        .arg("D:/Projects_final/SecureDocAI/backend/delete_user_file.py")
        .arg(&user_id)
        .arg(&filename)
        .output()
        .map_err(|e| format!("Failed to execute Python: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python deletion failed: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            process_file,
            list_user_metadata,
            download_user_file,
            redact_user_file,
            get_document_summary,
            delete_user_file,
            share_file,
            list_shared_metadata,
            download_shared_file
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
