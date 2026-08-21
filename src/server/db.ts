import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'prompt_manager.db');

let dbInstance: Database | null = null;
let SQL: any = null;

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
      console.log(`[SQLite3] Loaded existing database from ${DB_FILE}`);
    } catch (e) {
      console.warn(`[SQLite3] Failed to read ${DB_FILE}, initializing fresh database.`, e);
      dbInstance = new SQL.Database();
    }
  } else {
    console.log(`[SQLite3] Creating new SQLite3 database at ${DB_FILE}`);
    dbInstance = new SQL.Database();
  }

  initTables(dbInstance);
  saveDatabase();
  return dbInstance;
}

export function saveDatabase() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('[SQLite3] Error writing database to disk:', err);
  }
}

function initTables(db: Database) {
  // 1. Model & API configuration table
  db.run(`
    CREATE TABLE IF NOT EXISTS model_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      run_mode TEXT NOT NULL DEFAULT 'online',
      llama_bin TEXT DEFAULT '/usr/local/bin/llama-server',
      llama_host TEXT DEFAULT '127.0.0.1',
      llama_port INTEGER DEFAULT 8080,
      main_gguf TEXT DEFAULT './models/Qwen3.5-9B-Q4_K_M.gguf',
      mmproj_gguf TEXT DEFAULT './models/mmproj-F16.gguf',
      n_gpu_layers INTEGER DEFAULT 33,
      threads INTEGER DEFAULT 8,
      temperature REAL DEFAULT 0.2,
      top_p REAL DEFAULT 0.9,
      context_length INTEGER DEFAULT 8192,
      batch_size INTEGER DEFAULT 512,
      flash_attn INTEGER DEFAULT 1,
      api_provider TEXT DEFAULT 'gemini',
      api_endpoint TEXT DEFAULT 'https://generativelanguage.googleapis.com/v1beta',
      api_key TEXT DEFAULT '',
      api_model TEXT DEFAULT 'gemini-3.7-flash',
      timeout_seconds INTEGER DEFAULT 45,
      custom_headers TEXT DEFAULT '{\\n  "User-Agent": "PromptManager/1.2.0"\\n}',
      system_prompt_override TEXT DEFAULT 'You are an expert AI vision analysis and prompt deconstruction engine.',
      max_tokens INTEGER DEFAULT 2048,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Seed default model_config if empty
  const res = db.exec("SELECT COUNT(*) as cnt FROM model_config WHERE id = 1;");
  const count = res.length > 0 && res[0].values.length > 0 ? res[0].values[0][0] : 0;
  if (count === 0) {
    db.run(`
      INSERT INTO model_config (
        id, run_mode, llama_bin, llama_host, llama_port, main_gguf, mmproj_gguf,
        n_gpu_layers, threads, temperature, top_p, context_length, batch_size, flash_attn,
        api_provider, api_endpoint, api_key, api_model, timeout_seconds, custom_headers,
        system_prompt_override, max_tokens, updated_at
      ) VALUES (
        1, 'online', '/usr/local/bin/llama-server', '127.0.0.1', 8080, './models/Qwen3.5-9B-Q4_K_M.gguf', './models/mmproj-F16.gguf',
        33, 8, 0.2, 0.9, 8192, 512, 1,
        'gemini', 'https://generativelanguage.googleapis.com/v1beta', '', 'gemini-3.7-flash', 45, '{\\n  "User-Agent": "PromptManager/1.2.0"\\n}',
        'You are an expert AI vision analysis and prompt deconstruction engine. Analyze the input image and output a structured 6-stage reverse prompt breakdown.', 2048, datetime('now', 'localtime')
      );
    `);
  }

  // 2. Saved API Profiles table
  db.run(`
    CREATE TABLE IF NOT EXISTS api_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'gemini',
      endpoint TEXT NOT NULL,
      api_key TEXT DEFAULT '',
      model_name TEXT NOT NULL,
      timeout_seconds INTEGER DEFAULT 45,
      description TEXT DEFAULT '',
      custom_headers TEXT DEFAULT '',
      is_active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Seed default API profiles if empty
  const profilesRes = db.exec("SELECT COUNT(*) as cnt FROM api_profiles;");
  const profileCount = profilesRes.length > 0 && profilesRes[0].values.length > 0 ? profilesRes[0].values[0][0] : 0;
  if (profileCount === 0) {
    const defaultProfiles = [
      ['profile_gemini_flash', 'Google Gemini 3.7 Flash (官方推荐 / 极速)', 'gemini', 'https://generativelanguage.googleapis.com/v1beta', '', 'gemini-3.7-flash', 30, 'Google 最新一代多模态旗舰，图像细节解析敏锐，速度极快。', '', 1],
      ['profile_openai_gpt4o', 'OpenAI GPT-4o Vision (标准格式)', 'openai_compatible', 'https://api.openai.com/v1/chat/completions', '', 'gpt-4o', 45, '标准 OpenAI 兼容 Chat Completions 多模态反推端点。', '', 0],
      ['profile_qwen_vl', '通义千问 Qwen2.5-VL-72B (百炼云端)', 'qwen_vl', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', '', 'qwen2.5-vl-72b-instruct', 40, '顶级中文与中西结合视觉理解模型，对国风与二次元极佳。', '', 0],
      ['profile_ollama_local', 'Ollama 本地视觉服务 (Llama-Vision)', 'ollama', 'http://localhost:11434/v1/chat/completions', 'ollama', 'llama3.2-vision:11b', 60, '通过本地 Ollama 提供的兼容接口调用本地多模态模型。', '', 0]
    ];

    for (const p of defaultProfiles) {
      db.run(
        `INSERT INTO api_profiles (id, name, provider, endpoint, api_key, model_name, timeout_seconds, description, custom_headers, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
        p
      );
    }
  }

  // 3. Execution telemetry log table
  db.run(`
    CREATE TABLE IF NOT EXISTS execution_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      run_mode TEXT,
      target_model TEXT,
      duration_ms INTEGER,
      success INTEGER,
      error_msg TEXT
    );
  `);
}

// Model Config Helpers
export async function getModelConfig(): Promise<any> {
  const db = await getDatabase();
  const res = db.exec("SELECT * FROM model_config WHERE id = 1;");
  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    const vals = res[0].values[0];
    const obj: any = {};
    cols.forEach((col, idx) => {
      obj[col] = vals[idx];
    });
    // Convert boolean numbers
    obj.flash_attn = Boolean(obj.flash_attn);
    return obj;
  }
  return null;
}

export async function updateModelConfig(config: any): Promise<any> {
  const db = await getDatabase();
  const sql = `
    INSERT OR REPLACE INTO model_config (
      id, run_mode, llama_bin, llama_host, llama_port, main_gguf, mmproj_gguf,
      n_gpu_layers, threads, temperature, top_p, context_length, batch_size, flash_attn,
      api_provider, api_endpoint, api_key, api_model, timeout_seconds, custom_headers,
      system_prompt_override, max_tokens, updated_at
    ) VALUES (
      1, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, datetime('now', 'localtime')
    )
  `;

  db.run(sql, [
    config.run_mode || 'online',
    config.llama_bin || '/usr/local/bin/llama-server',
    config.llama_host || '127.0.0.1',
    Number(config.llama_port) || 8080,
    config.main_gguf || './models/Qwen3.5-9B-Q4_K_M.gguf',
    config.mmproj_gguf || './models/mmproj-F16.gguf',
    Number(config.n_gpu_layers) ?? 33,
    Number(config.threads) ?? 8,
    Number(config.temperature) ?? 0.2,
    Number(config.top_p) ?? 0.9,
    Number(config.context_length) ?? 8192,
    Number(config.batch_size) ?? 512,
    config.flash_attn ? 1 : 0,
    config.api_provider || 'gemini',
    config.api_endpoint || 'https://generativelanguage.googleapis.com/v1beta',
    config.api_key ?? '',
    config.api_model || 'gemini-3.7-flash',
    Number(config.timeout_seconds) ?? 45,
    config.custom_headers || '',
    config.system_prompt_override || '',
    Number(config.max_tokens) ?? 2048
  ]);

  saveDatabase();
  return getModelConfig();
}

// API Profiles Helpers
export async function getApiProfiles(): Promise<any[]> {
  const db = await getDatabase();
  const res = db.exec("SELECT * FROM api_profiles ORDER BY created_at ASC;");
  if (res.length > 0) {
    const cols = res[0].columns;
    return res[0].values.map(row => {
      const obj: any = {};
      cols.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      obj.is_active = Boolean(obj.is_active);
      return obj;
    });
  }
  return [];
}

export async function upsertApiProfile(profile: any): Promise<any> {
  const db = await getDatabase();
  const id = profile.id || `profile_${Date.now()}`;
  db.run(
    `INSERT OR REPLACE INTO api_profiles (
      id, name, provider, endpoint, api_key, model_name, timeout_seconds, description, custom_headers, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
    [
      id,
      profile.name,
      profile.provider || 'openai_compatible',
      profile.endpoint,
      profile.api_key || '',
      profile.model_name,
      Number(profile.timeout_seconds) || 45,
      profile.description || '',
      profile.custom_headers || '',
      profile.is_active ? 1 : 0
    ]
  );
  saveDatabase();
  return { ...profile, id };
}

export async function deleteApiProfile(id: string): Promise<boolean> {
  const db = await getDatabase();
  db.run("DELETE FROM api_profiles WHERE id = ?", [id]);
  saveDatabase();
  return true;
}

export async function activateApiProfile(id: string): Promise<any> {
  const db = await getDatabase();
  db.run("UPDATE api_profiles SET is_active = 0");
  db.run("UPDATE api_profiles SET is_active = 1 WHERE id = ?", [id]);

  // Sync profile into active model_config
  const res = db.exec("SELECT * FROM api_profiles WHERE id = ?", [id]);
  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    const row = res[0].values[0];
    const profile: any = {};
    cols.forEach((col, idx) => { profile[col] = row[idx]; });

    db.run(
      `UPDATE model_config SET
        api_provider = ?,
        api_endpoint = ?,
        api_key = ?,
        api_model = ?,
        timeout_seconds = ?,
        updated_at = datetime('now', 'localtime')
       WHERE id = 1`,
      [profile.provider, profile.endpoint, profile.api_key, profile.model_name, profile.timeout_seconds]
    );
  }

  saveDatabase();
  return getModelConfig();
}

export async function logExecution(runMode: string, targetModel: string, durationMs: number, success: boolean, errorMsg: string = '') {
  const db = await getDatabase();
  db.run(
    "INSERT INTO execution_logs (run_mode, target_model, duration_ms, success, error_msg, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))",
    [runMode, targetModel, durationMs, success ? 1 : 0, errorMsg]
  );
  saveDatabase();
}

export async function getDatabaseStats(): Promise<any> {
  const db = await getDatabase();
  let fileSize = 0;
  if (fs.existsSync(DB_FILE)) {
    fileSize = fs.statSync(DB_FILE).size;
  }

  const tables: Array<{ name: string; count: number; description: string }> = [];

  const tableDefs = [
    { name: 'model_config', description: 'llama.cpp 与在线多模态 API 运行时配置表' },
    { name: 'api_profiles', description: '已保存的多服务商 API 反推端点预设表' },
    { name: 'execution_logs', description: '多模态反推流水线执行历史与性能遥测日志' },
  ];

  for (const def of tableDefs) {
    try {
      const res = db.exec(`SELECT COUNT(*) FROM ${def.name};`);
      const count = res.length > 0 && res[0].values.length > 0 ? Number(res[0].values[0][0]) : 0;
      tables.push({ name: def.name, count, description: def.description });
    } catch (e) {
      tables.push({ name: def.name, count: 0, description: def.description });
    }
  }

  return {
    db_file: DB_FILE,
    db_size_bytes: fileSize,
    sqlite_version: '3.45.0 (WebAssembly Embedded)',
    tables,
    last_sync: new Date().toISOString(),
    status: 'connected'
  };
}

export async function resetDatabaseTables(): Promise<void> {
  const db = await getDatabase();
  db.run("DROP TABLE IF EXISTS model_config;");
  db.run("DROP TABLE IF EXISTS api_profiles;");
  db.run("DROP TABLE IF EXISTS execution_logs;");
  initTables(db);
  saveDatabase();
}
