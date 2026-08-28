pub mod llama;
pub mod db;

use llama::{call_llama_server, check_llama_health, test_connection, get_system_info, read_image_files};
use db::{get_sqlite_stats, DbState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_state = DbState::new();
    let _ = db_state.init_db();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![
            call_llama_server,
            check_llama_health,
            test_connection,
            get_system_info,
            get_sqlite_stats,
            read_image_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
