export interface ImageTypeResult {
  image_type: string;
  confidence: number;
  sub_category?: string;
  tags?: string[];
}

export interface ImageStyleResult {
  style: string[];
  style_weight: number[];
  visual_mood?: string;
  medium?: string;
}

export interface CameraParamResult {
  light: string;
  color_tone: string;
  camera: string;
  composition: string;
  lens_focal?: string;
  aperture?: string;
  film_recipe?: string;
}

export interface SceneContentResult {
  subject: string;
  background: string;
  action: string;
  foreground?: string;
  environment?: string;
}

export interface DetailDescResult {
  detail: string;
  emotion: string;
  textures?: string;
  attire_or_props?: string;
}

export interface PromptGenerateResult {
  positive: string;
  negative: string;
  target_model: string;
  suggested_params?: {
    cfg_scale?: number;
    steps?: number;
    sampler?: string;
    aspect_ratio?: string;
  };
}

export interface SkillResultJson {
  skill_01_image_type?: ImageTypeResult;
  skill_02_image_style?: ImageStyleResult;
  skill_03_camera_param?: CameraParamResult;
  skill_04_scene_content?: SceneContentResult;
  skill_05_detail_desc?: DetailDescResult;
  skill_06_prompt_generate?: PromptGenerateResult;
  [key: string]: any;
}

export interface HistoryItem {
  id: string;
  origin_path: string;
  thumb_path: string;
  file_name: string;
  file_size_kb: number;
  dimensions?: { width: number; height: number };
  create_at: string;
  target_model: string;
  positive_prompt: string;
  negative_prompt: string;
  skill_result_json: SkillResultJson;
  is_favorite?: boolean;
  notes?: string;
  execution_time_ms?: number;
}

export interface ApiProfile {
  id: string;
  name: string;
  provider: 'gemini' | 'openai_compatible' | 'ollama' | 'deepseek' | 'qwen_vl' | 'custom';
  endpoint: string;
  api_key: string;
  model_name: string;
  timeout_seconds: number;
  description?: string;
  custom_headers?: string;
  is_active?: boolean;
}

export interface ModelConfig {
  id?: number;
  run_mode: 'local' | 'online';
  // Local llama.cpp / llama-server config
  llama_bin: string;
  llama_host?: string;
  llama_port?: number;
  main_gguf: string;
  mmproj_gguf: string;
  n_gpu_layers: number;
  threads: number;
  temperature: number;
  top_p: number;
  context_length: number;
  batch_size?: number;
  flash_attn?: boolean;
  // Online API config
  api_provider?: 'gemini' | 'openai_compatible' | 'ollama' | 'deepseek' | 'qwen_vl' | 'custom';
  api_endpoint: string;
  api_key: string;
  api_model: string;
  timeout_seconds: number;
  custom_headers?: string;
  system_prompt_override?: string;
  max_tokens?: number;
  updated_at?: string;
}

export interface SqliteTableInfo {
  name: string;
  count: number;
  description: string;
}

export interface SqliteDatabaseInfo {
  db_file: string;
  db_size_bytes: number;
  sqlite_version: string;
  tables: SqliteTableInfo[];
  last_sync: string;
  status: 'online' | 'connected' | 'syncing';
}

export interface SkillTemplate {
  id: string;
  skill_name: string;
  stage_number: number;
  display_title: string;
  file_content: string; // YAML text
  enable: boolean;
  sort_index: number;
  timeout: number;
  retry: number;
}

export interface PromptModelTemplate {
  id: string;
  model_name: string;
  display_name: string;
  badge_color: string;
  template_pos: string;
  template_neg: string;
  syntax_guide: string;
  default_params: {
    cfg_scale: number;
    steps: number;
    sampler: string;
  };
}

export interface FilterRule {
  searchQuery: string;
  imageType: string | null;
  style: string | null;
  targetModel: string | null;
  onlyFavorites: boolean;
  sortBy: 'date_desc' | 'date_asc' | 'name';
}

export interface PipelineStageProgress {
  stageNumber: number;
  skillName: string;
  stageTitle: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  durationMs?: number;
  outputJson?: any;
  error?: string;
}
