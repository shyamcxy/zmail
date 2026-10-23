pub mod error;
pub mod models;
pub mod db;
pub mod auth;
pub mod unsubscribe;
pub mod ai;
pub mod sync;
pub mod state;
pub mod commands;

#[cfg(test)]
mod tests;

use std::sync::Arc;
use tauri::Manager;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Load .env if present
    dotenvy::dotenv().ok();

    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Resolve database path in user application data directory
            let app_dir = app.path().app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));
            std::fs::create_dir_all(&app_dir).ok();
            
            let db_path = app_dir.join("zmail.db");
            let db_path_str = db_path.to_string_lossy().to_string();

            // Initialize AppState and run initial DB migrations
            let app_state = Arc::new(AppState::new(&db_path_str));
            let conn = app_state.db.get_connection()
                .expect("Failed to initialize SQLite database");
            drop(conn);

            app.manage(app_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_accounts,
            commands::add_account,
            commands::remove_account,
            commands::start_gmail_oauth,
            commands::list_messages,
            commands::get_message_detail,
            commands::set_message_read,
            commands::set_message_starred,
            commands::set_message_archived,
            commands::set_message_trash,
            commands::search_messages,
            commands::sync_account,
            commands::triage_message,
            commands::generate_smart_replies,
            commands::execute_one_click_unsubscribe,
            commands::send_email,
            commands::check_ollama_status,
            commands::open_external_url,
            commands::copilot_chat,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                window.app_handle().exit(0);
            }
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
