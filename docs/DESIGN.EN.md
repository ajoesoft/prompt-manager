# Img2Prompt Offline Reverse Prompt Generator – Design Document
Tech Stack: Tauri + TypeScript + SQLite + llama.cpp + Qwen3.5-9B-Q4_K_M.gguf + mmproj-F16.gguf

## 1. Project Overview
This desktop application performs offline image-to-prompt reverse engineering. It uses the Qwen3.5 multimodal model via llama.cpp to parse images in multiple dimensions through configurable staged pipelines defined by independent SKILL files. The tool supports both local GGUF inference and online OpenAI-compatible API endpoints. All analysis history, model configurations and pipeline rules are persisted in local SQLite.

Core capabilities:
- Single image / folder batch import
- Multi-dimensional image analysis controlled by SKILL pipeline files
- Editable structured reverse prompt results
- Collapsible sidebar category filtering
- Local GGUF inference or remote online API mode
- Built-in About dialog for version and author information

## 2. Technology Stack
| Layer | Technology | Description |
|---|---|---|
| Desktop Runtime | Tauri 2.0 | Cross-platform desktop framework (Rust backend + web frontend) |
| Frontend | TypeScript | UI layer, IPC invocation, state management |
| Local Database | SQLite | Persist history, model settings, SKILL templates and prompt templates |
| Local Inference Engine | llama.cpp | Load Qwen3.5-9B-Q4_K_M.gguf + mmproj-F16.gguf for multimodal vision-language reasoning |
| Image Processing | Rust Sharp Binding | Resize images, generate thumbnails, format validation |
| Pipeline Definition | Custom `.skill` YAML files | Define each analysis stage, system prompts, JSON schema, retry and timeout rules |

Model assets:
- Main LLM: `Qwen3.5-9B-Q4_K_M.gguf`
- Vision projection: `mmproj-F16.gguf`

## 3. System Architecture
Layered architecture: Frontend View Layer → Tauri Rust Business Layer → llama.cpp Inference Layer → SQLite Persistence Layer
```
[Frontend - TypeScript]
├─ Collapsible sidebar category tree
├─ Image selector (single file / directory batch)
├─ Result list panel (thumbnail, target model, structured analysis text)
├─ Single record edit modal
├─ Settings panel (local GGUF config / online API config)
└─ About dialog

[Tauri Rust Backend]
├─ IPC command interface for frontend calls
├─ SKILL manager: load, parse, validate and execute staged pipeline files
├─ Image preprocessing module
├─ llama-server subprocess lifecycle manager
├─ SQLite CRUD repository
└─ Online API adapter for OpenAI-compatible multimodal endpoints

[llama.cpp Inference Layer]
├─ Load Qwen main GGUF and mmproj vision projector
├─ Encode image embeddings
├─ Run staged multimodal inference following SKILL definitions
└─ Return strictly structured JSON analysis results

[SQLite Database]
├─ img_history: image reverse prompt records
├─ model_config: local and online inference settings
├─ skill_template: stored YAML content of each pipeline stage
└─ prompt_model_template:正向/negative prompt templates for different generative models
```

## 4. Core Business Pipeline (SKILL Staged Workflow)
Independent `.skill` YAML files govern each pipeline stage. Each stage consumes the output from the prior stage plus image embedding. The pipeline executes sequentially. Users can enable, disable, import or override custom SKILL files in settings.

### Stage List & Built-in SKILL Files
1. `skill_01_image_type.skill` – Image Category Classification
   Enumerated options: Person, Landscape, Movie Screenshot, Commercial Advertisement, Game Artwork, UI, Still Life, Illustration, 3D Render, Other
   Output: `{ "image_type": string, "confidence": number }`

2. `skill_02_image_style.skill` – Art Style Recognition
   Enumerated options: PIXAR, Disney, Photorealistic, Film Photography, Anime, Cyberpunk, Ink Wash, Oil Painting, Pixel Art, Dark Xianxia, Sci-Fi Epic, etc.
   Output: `{ "style": string[], "style_weight": number[] }`

3. `skill_03_camera_param.skill` – Lighting, Color & Shooting Metadata Analysis
   Recognize: key light type, contrast, warm/cold tone, depth of field, focal length, aperture, film recipe, shot framing, estimated camera gear
   Output: `{ "light": string, "color_tone": string, "camera": string, "composition": string }`

4. `skill_04_scene_content.skill` – Scene & Subject Decomposition
   Parse main subject, foreground, background, environment, action and composition
   Output: `{ "subject": string, "background": string, "action": string }`

5. `skill_05_detail_desc.skill` – Fine-grained Object & Character Description
   Character details: face shape, hairstyle, outfit, facial expression, posture, emotion; object material, texture and wear details
   Output: `{ "detail": string, "emotion": string }`

6. `skill_06_prompt_generate.skill` – Final Prompt Assembly
   Consume structured outputs from previous stages, assemble positive and negative prompts matching target generative model format (SDXL, Krea2 Turbo, LTX, etc.)
   Output: `{ "positive": string, "negative": string, "target_model": string }`

### Pipeline Execution Rules
- Each stage supports retry count, timeout and JSON schema validation
- Pipeline aborts on repeated validation failures or timeout
- Completed full records are saved into SQLite

## 5. Functional Module Specification
### 5.1 Image Import Module
Two import modes:
1. Single image selection: support PNG / JPG / WebP
2. Batch folder import: traverse valid image files and queue jobs
Preprocessing: auto-generate cached thumbnails, limit max edge to 1024px to reduce multimodal inference load. Store absolute original file path for history reloading.

### 5.2 Model Configuration Module (Dual Mode Switch)
#### Mode A: Local Offline llama.cpp
Persisted in `model_config` table:
- Path to llama-server binary
- Path to Qwen3.5 main GGUF
- Path to mmproj-F16.gguf
- Context window, thread count, GPU offload layers, temperature, top_p and other generation parameters
The backend spawns an independent llama-server subprocess to host the multimodal model.

#### Mode B: Online API
Compatible with OpenAI multimodal API schema:
- API endpoint
- API key
- Remote model identifier
- Request timeout
The identical SKILL pipeline is reused; only the inference transport layer switches to HTTP.

### 5.3 Left Collapsible Category Navigation Tree
Tree filter sidebar to query SQLite history records:
```
All Records
├─ Image Type Filter
│  ├─ Person
│  ├─ Landscape
│  ├─ Movie Screenshot
│  ├─ Advertisement
│  └─ Game Artwork
├─ Style Filter
│  ├─ PIXAR
│  ├─ Photorealistic
│  └─ Anime
└─ Target Model Filter
    ├─ Krea2 Turbo
    ├─ SDXL
    └─ LTX
```
Interaction: click nodes to filter the main result list; multi-select is supported.

### 5.4 Main UI: Reverse Prompt Result List
Each list card contains:
- Image thumbnail
- Original filename
- Target generative model tag
- Image type and style tags
- Truncated preview of positive prompt
- Action buttons: Edit, Copy Prompt, Rerun Analysis, Delete Record

Interaction: click one card → open dedicated edit modal
Edit modal fields:
- Full original image preview
- Raw parsed JSON output from every SKILL stage (editable manually)
- Positive prompt input box, negative prompt input box
- Switch target generative model to re-assemble prompts in real time
- Save edits back to SQLite

### 5.5 About Dialog
Static information displayed in modal:
- Semantic software version (vX.Y.Z)
- Author name, open-source license
- Development date
- Dependency versions: Tauri, llama.cpp, Qwen model version
- Repository URL and copyright notice

## 6. SQLite Table Schema
```sql
CREATE TABLE img_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  origin_path TEXT NOT NULL,
  thumb_path TEXT,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  target_model TEXT,
  positive_prompt TEXT,
  negative_prompt TEXT,
  skill_result_json TEXT
);

CREATE TABLE model_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_mode TEXT CHECK(run_mode IN ('local','online')),
  llama_bin TEXT,
  main_gguf TEXT,
  mmproj_gguf TEXT,
  n_gpu_layers INTEGER,
  threads INTEGER,
  temperature REAL,
  api_endpoint TEXT,
  api_key TEXT,
  api_model TEXT
);

CREATE TABLE skill_template (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_name TEXT UNIQUE,
  file_content TEXT,
  enable INTEGER DEFAULT 1,
  sort_index INTEGER
);

CREATE TABLE prompt_model_template (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_name TEXT UNIQUE,
  template_pos TEXT,
  template_neg TEXT
);
```

## 7. Frontend IPC Type Definition (TypeScript)
```typescript
interface FilterRule {
  image_type?: string[];
  style?: string[];
  target_model?: string[];
}

interface HistoryItem {
  id?: number;
  origin_path: string;
  thumb_path: string;
  create_at: string;
  target_model: string;
  positive_prompt: string;
  negative_prompt: string;
  skill_result_json: string;
}

interface SkillItem {
  skill_name: string;
  file_content: string;
  enable: number;
  sort_index: number;
}

interface ModelConfig {
  run_mode: 'local' | 'online';
  llama_bin: string;
  main_gguf: string;
  mmproj_gguf: string;
  n_gpu_layers: number;
  threads: number;
  temperature: number;
  api_endpoint: string;
  api_key: string;
  api_model: string;
}

interface IpcCommands {
  createThumbnail(filePath: string): Promise<string>;
  runImg2Prompt(filePath: string): Promise<HistoryItem>;
  getHistory(filter: FilterRule): Promise<HistoryItem[]>;
  saveHistoryEdit(data: HistoryItem): Promise<boolean>;
  deleteHistory(id: number): Promise<boolean>;
  loadAllSkill(): Promise<SkillItem[]>;
  saveSkill(skill: SkillItem): Promise<boolean>;
  importSkillFile(path: string): Promise<SkillItem>;
  getModelConfig(): Promise<ModelConfig>;
  saveModelConfig(cfg: ModelConfig): Promise<boolean>;
  testLocalLlamaConnect(): Promise<boolean>;
  testOnlineApiConnect(): Promise<boolean>;
}
```

## 8. llama.cpp Integration
Recommended approach: launch independent `llama-server` subprocess managed by Rust.
Startup arguments sample:
```
llama-server -m Qwen3.5-9B-Q4_K_M.gguf --mmproj mmproj-F16.gguf
```
Multimodal workflow: encode image into embedding via mmproj, inject staged SKILL system prompts, enforce JSON output schema.

Alternative approach: embed llama.cpp via Rust bindings, suitable for full static packaging with higher compilation complexity.

## 9. Build & Distribution
- Cross-platform build target: Windows / macOS / Linux via Tauri bundler
- GGUF model files are NOT embedded into installers; users select local model paths inside the application
- Default built-in `.skill` templates are shipped in the app directory and seeded into SQLite on first launch

## 10. Roadmap & Future Extensions
- Export history to CSV / JSON / Markdown
- Batch export image-prompt pairs for AI fine-tuning datasets
- Built-in visual SKILL editor for YAML rule modification
- Support additional multimodal mmproj model families
- Bilingual prompt translation (Chinese / English)

## 11. Sample Built-in .skill Template
`skill_01_image_type.skill`
```yaml
stage_name: Image Category Classification
version: 1.0
system_prompt: >
  You are an image classification specialist. Analyze the input image and return only strict JSON.
  Allowed enum values: Person, Landscape, Movie Screenshot, Commercial Advertisement, Game Artwork, UI, Still Life, Illustration, 3D Render, Other
output_schema:
  type: object
  properties:
    image_type:
      type: string
    confidence:
      type: number
  required: ["image_type","confidence"]
retry: 2
timeout: 15
```

## 12. Project Directory Layout
```
img2prompt-tauri/
├─ src-tauri/
│  └─ src/
│     ├─ commands/
│     ├─ llama_cpp/
│     ├─ skill_manager/
│     ├─ db/
│     └─ image_proc/
├─ src/
│  ├─ components/
│  │  ├─ SideCollapseTree
│  │  ├─ PromptResultList
│  │  ├─ EditPromptDialog
│  │  ├─ SettingPanel
│  │  └─ AboutDialog
│  ├─ skill/
│  ├─ api/
│  └─ store/
└─ tauri.conf.json
```

If you require follow-up deliverables:
1. Full set of 6 official `.skill` YAML pipeline definitions
2. SQLite initialization SQL script
3. Minimal Rust IPC + llama-server calling sample
4. Vue3 frontend component skeleton code
5. README and production build guide

Do you want me to also split this document into separate files: `SRS.md`, `ARCH.md`, `API_SPEC.md` for formal engineering management?