export interface MultiDimClassificationResult {
  subject_content: string; // 维度1：主体内容 (如: 单人/虚拟人形, 景物环境, 物品产品, 幻想生物等)
  visual_medium: string; // 维度2：视觉媒介/画风 (如: 照片写实, 2D手绘-插画, 3D渲染, 赛璐璐/水墨等)
  genre_worldview: string; // 维度3：题材世界观 (如: 修仙/仙侠, 现代都市, 科幻/赛博朋克, 西幻魔法等)
  commercial_use: string; // 维度4：商业用途 (如: 游戏原画, 影视剧海报, 广告商业图, 小说封面等)
  composition_camera: string; // 维度5：构图镜头 (如: 中景仰拍, 三分构图, 动态抓拍等)
  lighting_color: string; // 维度6：光影色彩 (如: 逆光丁达尔光, 暖调低饱和, 8K胶片质感等)
  mood_atmosphere: string; // 维度7：情绪氛围 (如: 宏大史诗, 治愈清新, 阴郁暗黑, 孤寂荒凉等)
  confidence: number;
  tags?: string[];
  raw_dimension_map?: {
    主体内容?: string;
    媒介画风?: string;
    题材世界观?: string;
    商业用途?: string;
    镜头构图?: string;
    光影色彩?: string;
    氛围情绪?: string;
  };
}

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

export interface GameAssetResult {
  asset_type: 'character_concept' | '3d_prop' | '2d_sprite' | 'isometric_tile' | 'game_ui' | 'vfx_texture' | 'pixel_art' | 'other';
  asset_category_zh: string; // e.g. "3D武器道具 / 装备模型", "角色正交三视图 / 概念原画", "等轴等距瓦片地图 / 地牢网格", "游戏技能UI图标 / 徽章套件", "像素风动作精灵图"
  engine_target: string; // e.g. "Unreal Engine 5", "Unity 6", "Godot 4", "2D Sprite Engine"
  perspective_view: string; // e.g. "正交三视图 (Orthographic Front/Side/Back / T-Pose)", "等轴测斜45度 (Isometric 2.5D)", "纯色隔离背景道具视角 (Isolated Clean Background)", "UI平面正交 (Flat Orthographic HUD)", "顶视网格 (Top-Down Tilemap)"
  texture_pbr_maps: string[]; // e.g. ["Albedo/BaseColor", "Normal Map", "Roughness", "Metallic", "Ambient Occlusion", "Emissive"]
  art_style: string; // e.g. "AAA次世代PBR写实", "二次元手绘赛璐璐", "复古16-bit像素", "暗黑哥特魔幻", "科幻机能UI", "低多边形Low-Poly"
  background_treatment: string; // e.g. "纯白/中性灰独立隔离背景 (Isolated on Clean Solid Background)", "透明通道优化", "网格对齐无缝拼接"
  game_genre_fit: string; // e.g. "ARPG / MMORPG", "俯视角策略SLG", "横版动作像素闯关", "卡牌战术手游"
  prompt_modifiers: string; // e.g. "game asset, 3d weapon prop, isolated on white background, PBR materials, unreal engine 5 render, clean studio lighting, 8k, asset store quality"
  sprite_sheet_spec?: string;
}

export interface ModelPromptEntry {
  model_id: string;
  model_name: string;
  display_name: string;
  positive: string;
  negative: string;
  suggested_params: {
    cfg_scale: number;
    steps: number;
    sampler: string;
    aspect_ratio?: string;
  };
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
  all_model_prompts?: Record<string, ModelPromptEntry>;
}

export interface SkillResultJson {
  skill_01_multidim_classification?: MultiDimClassificationResult;
  skill_01_image_type?: ImageTypeResult;
  skill_02_image_style?: ImageStyleResult;
  skill_03_camera_param?: CameraParamResult;
  skill_04_scene_content?: SceneContentResult;
  skill_05_detail_desc?: DetailDescResult;
  skill_06_prompt_generate?: PromptGenerateResult;
  skill_07_game_asset?: GameAssetResult;
  [key: string]: any;
}

export interface GenerationParams {
  cfg_scale: number;
  steps: number;
  sampler: string;
  scheduler?: string;
  seed?: number;
  denoise?: number;
  batch_size?: number;
  ckpt_name?: string;
}

export interface ComfyUiExecutionResult {
  prompt_id?: string;
  output_images?: string[];
  executed_at?: string;
  duration_ms?: number;
  error?: string;
}

export type ExecutionStatus = 'unexecuted' | 'queued' | 'running' | 'executed' | 'failed';

export interface HistoryItem {
  id: string;
  project_uuid?: string;
  origin_path: string;
  thumb_path: string;
  file_name: string;
  file_size_kb: number;
  dimensions?: { width: number; height: number };
  aspect_ratio?: string;
  create_at: string;
  target_model: string;
  positive_prompt: string;
  negative_prompt: string;
  generation_params?: GenerationParams;
  execution_status?: ExecutionStatus;
  execution_progress?: number;
  execution_result?: ComfyUiExecutionResult;
  skill_result_json: SkillResultJson;
  formatted_report?: string;
  is_favorite?: boolean;
  notes?: string;
  execution_time_ms?: number;
  output_language?: 'zh' | 'en';
}

export interface ComfyUiNodeMapping {
  positive_prompt_node?: string; // Node ID for positive prompt (e.g. "6")
  positive_prompt_field?: string; // default "text"
  negative_prompt_node?: string; // Node ID for negative prompt (e.g. "7")
  negative_prompt_field?: string; // default "text"
  latent_image_node?: string; // Node ID for EmptyLatentImage (e.g. "5")
  width_field?: string; // default "width"
  height_field?: string; // default "height"
  sampler_node?: string; // Node ID for KSampler (e.g. "3")
  seed_field?: string; // default "seed"
  steps_field?: string; // default "steps"
  cfg_field?: string; // default "cfg"
  sampler_field?: string; // default "sampler_name"
  scheduler_field?: string; // default "scheduler"
  denoise_field?: string; // default "denoise"
  checkpoint_node?: string; // Node ID for CheckpointLoader (e.g. "4")
  ckpt_name_field?: string; // default "ckpt_name"
  save_image_node?: string; // Node ID for SaveImage (e.g. "9")
  filename_prefix_field?: string; // default "filename_prefix"
}

export interface ComfyUiWorkflowTemplate {
  id: string; // e.g. "z-image-turbo", "standard-sdxl", "flux1-turbo", "qwen-image"
  name: string; // e.g. "Z-Image Turbo 极致加速工作流"
  display_name?: string;
  badge_color?: string;
  description: string;
  author?: string;
  target_model?: string;
  workflow_type?: 'turbo' | 'sdxl' | 'flux' | 'sd3' | 'qwen' | 'krea' | 'ideogram' | 'custom';
  workflow_json: string; // JSON string of ComfyUI API prompt graph
  node_mappings?: ComfyUiNodeMapping;
  is_builtin?: boolean;
  is_default?: boolean;
  updated_at?: string;
}

export interface ComfyUiProjectConfig {
  endpoint: string; // e.g. "http://127.0.0.1:8188"
  cfg_scale: number;
  steps: number;
  sampler: string;
  scheduler: string;
  seed: number;
  denoise: number;
  batch_size: number;
  ckpt_name?: string;
  workflow_id?: string;
  workflow_type?: 'default' | 'flux' | 'sd3' | 'sdxl' | 'z-image-turbo' | 'krea2-turbo' | 'qwen-image-2512' | 'flux2' | 'ideogram-v4' | 'stable-diffusion-3' | 'custom';
}

export interface Project {
  uuid: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  scheduled_time?: string; // 定时执行时间 e.g. "2026-08-28 14:00" or Cron
  output_dir: string; // 输出目录 e.g. "./outputs/project_xxx"
  status: 'idle' | 'scheduled' | 'running' | 'completed' | 'error';
  target_model: string;
  dimensions: { width: number; height: number };
  aspect_ratio: string;
  comfyui_config: ComfyUiProjectConfig;
  tags?: string[];
}

export type ProjectExportFilter = 'executed' | 'unexecuted' | 'all';

export interface ProjectPromptExportItem {
  id: string;
  file_name: string;
  target_model: string;
  positive_prompt: string;
  negative_prompt: string;
  dimensions: { width: number; height: number };
  aspect_ratio: string;
  generation_params: GenerationParams;
  execution_status: ExecutionStatus;
  executed_at?: string;
  output_images?: string[];
  skill_classification?: MultiDimClassificationResult;
}

export interface ProjectExportJson {
  export_version: string;
  exported_at: string;
  export_filter: ProjectExportFilter;
  filter_description: string;
  project: {
    uuid: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    scheduled_time?: string;
    output_dir: string;
    status: string;
    default_model: string;
    default_dimensions: { width: number; height: number };
    default_aspect_ratio: string;
    comfyui_endpoint: string;
  };
  statistics: {
    total_prompts: number;
    executed_count: number;
    unexecuted_count: number;
    failed_count: number;
  };
  prompts: ProjectPromptExportItem[];
}

export type QuantizationType = 'Q2_K' | 'Q4_K_M' | 'Q5_K_M' | 'Q6_K' | 'Q8_0' | 'F16' | 'BF16' | 'Q3_K_M';

export type DownloadSourceProvider = 'modelscope' | 'huggingface';

export interface QuantizationOption {
  quant: QuantizationType;
  file_name: string;
  size_gb: number;
  recommended?: boolean;
  vram_requirement_gb: number;
  description_zh: string;
  description_en: string;
  download_urls: {
    modelscope: string; // 🇨🇳 国内 ModelScope 镜像直链
    huggingface: string; // 🌐 国外 Hugging Face 直链
  };
}

export interface GgufModelInfo {
  id: string;
  name: string;
  family: 'qwen_vl' | 'qwen_3_5' | 'qwen_3_6' | 'qwen_3_8' | 'mmproj' | 'custom';
  family_display: string;
  author: string;
  model_type: 'main_model' | 'mmproj';
  parameters: string; // e.g. '3B', '7B', '8B', '9B', '14B', '72B', 'CLIP/ViT'
  context_length: number;
  recommended_for_reverse: boolean;
  description_zh: string;
  description_en: string;
  hf_repo: string;
  ms_repo: string;
  quantizations: QuantizationOption[];
  tags: string[];
  local_path?: string;
  is_downloaded?: boolean;
}

export interface ModelDownloadRegistry {
  version: string;
  updated_at: string;
  default_download_directory: string;
  models: GgufModelInfo[];
}

export interface ModelConfig {
  id?: number;
  run_mode: 'local';
  // Local llama.cpp / llama-server config
  llama_bin: string;
  llama_host?: string;
  llama_port?: number;
  main_gguf: string;
  mmproj_gguf: string;
  models_dir?: string;
  n_gpu_layers: number;
  threads: number;
  temperature: number;
  top_p: number;
  context_length: number;
  batch_size?: number;
  flash_attn?: boolean;
  timeout_seconds?: number;
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
  formattedText?: string;
  previousContext?: string;
  error?: string;
}
