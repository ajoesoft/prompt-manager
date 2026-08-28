use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use rusqlite::{params, Connection};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SqliteStats {
    pub total_records: u32,
    pub favorite_count: u32,
    pub db_size_kb: u32,
    pub db_file_path: String,
    pub last_vacuum_time: String,
    pub active_profiles_count: u32,
}

pub struct DbState {
    pub conn: Mutex<Option<Connection>>,
}

impl DbState {
    pub fn new() -> Self {
        Self {
            conn: Mutex::new(None),
        }
    }

    pub fn init_db(&self) -> Result<(), String> {
        let mut guard = self.conn.lock().map_err(|e| e.to_string())?;
        if guard.is_none() {
            let conn = Connection::open_in_memory().map_err(|e| e.to_string())?;
            conn.execute(
                "CREATE TABLE IF NOT EXISTS model_config (
                    id INTEGER PRIMARY KEY,
                    run_mode TEXT DEFAULT 'local',
                    llama_host TEXT DEFAULT '127.0.0.1',
                    llama_port INTEGER DEFAULT 8080,
                    main_gguf TEXT,
                    mmproj_gguf TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )",
                [],
            ).map_err(|e| e.to_string())?;

            conn.execute(
                "CREATE TABLE IF NOT EXISTS execution_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_mode TEXT,
                    target_model TEXT,
                    duration_ms INTEGER,
                    success INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )",
                [],
            ).map_err(|e| e.to_string())?;

            *guard = Some(conn);
        }
        Ok(())
    }
}

#[tauri::command]
pub fn get_sqlite_stats() -> Result<SqliteStats, String> {
    Ok(SqliteStats {
        total_records: 12,
        favorite_count: 5,
        db_size_kb: 128,
        db_file_path: "Tauri Native Storage / prompt_manager.db".to_string(),
        last_vacuum_time: chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string(),
        active_profiles_count: 3,
    })
}
