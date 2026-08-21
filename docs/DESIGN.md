# Tauri + TypeScript + SQLite + llama.cpp 图片反推提示词工具设计文档
项目名称：prompt-manager 本地提示词反向生成器
目标：本地离线运行，支持图片上传，基于 Qwen3.5-9B-Q4_K_M.gguf + mmproj-F16.gguf 多模态模型解析图片，拆解多维度图像信息，自动生成适配主流文生图模型的提示词；同时兼容在线API模式，提供结构化可编辑结果面板，持久化存储历史记录。

## 1 技术栈清单
| 模块 | 技术选型 | 说明 |
|---|---|---|
| 桌面框架 | Tauri 2.0 | 跨平台桌面客户端，Rust后端 + Web前端，打包体积小 |
| 前端 | TypeScript + Vue3 / SolidJS | 可选Vue3，生态成熟；UI组件库：Naive UI / Element Plus |
| 本地数据库 | SQLite | 存储历史记录、模型配置、SKILL规则、模板、用户自定义提示词 |
| LLM/多模态推理 | llama.cpp | 加载 Qwen3.5-9B-Q4_K_M.gguf 主模型 + mmproj-F16.gguf 视觉投影文件 |
| 通信 | Tauri Command + IPC | TS前端 ↔ Rust后端 ↔ llama.cpp 服务调用 |
| 图片处理 | Sharp（Rust） | 图片压缩、缩略图生成、格式校验 |
| 配置管理 | TOML / JSON | 本地模型路径、API密钥、推理参数 |

> 模型文件：
> - 主模型：`Qwen3.5-9B-Q4_K_M.gguf`
> - 视觉投影：`mmproj-F16.gguf`（Qwen3.5 配套mmproj）

## 2 整体架构设计
采用分层架构：**前端视图层 → Tauri Rust 业务层 → llama.cpp 推理层 → SQLite 持久层**
```
【前端 TS】
├─ 侧边折叠分类导航
├─ 图片选择器（单图/文件夹批量导入）
├─ 结果列表面板（缩略图、适用模型、多维度解析文本）
├─ 单条编辑弹窗
├─ 设置面板（本地模型配置 / 在线API配置）
└─ 关于对话框

【Tauri Rust 后端】
├─ IPC 命令接口（供TS调用）
├─ SKILL 规则管理器（加载解析skill文件，管控推理阶段）
├─ 图片预处理模块（缩略图、转RGB、尺寸缩放）
├─ llama.cpp 子进程管理（启动/停止gguf推理服务）
├─ SQLite CRUD（历史、配置、模板存储）
└─ 在线API适配器（兼容OpenAI兼容接口）

【llama.cpp 推理层】
├─ 加载 qwen3.5 主模型 + mmproj
├─ 图像embedding 编码
├─ 按SKILL分阶段Prompt调用多模态模型
└─ 返回结构化JSON解析结果

【SQLite 数据库】
├─ img_history：图片反推历史
├─ model_config：本地模型路径、在线API配置
├─ skill_template：各阶段SKILL规则文件内容
└─ prompt_template：不同文生图模型提示词模板（Krea/Turbo/SDXL等）
```

## 3 核心业务流程（SKILL 分阶段流水线）
> 需求：使用独立 SKILL 文件管控每一个解析阶段，流水线串行执行，每阶段输入上一阶段输出 + 图片embedding。
> SKILL 文件格式：`.skill`，支持 YAML 结构，定义阶段名称、系统提示词、输出格式、校验规则、超时、重试次数。

### 流水线 5 个阶段（独立 SKILL 文件）
1. **skill_01_image_type.skill —— 图片类型识别**
    可选分类：人物、风景、电影截图、商业广告、游戏原画、UI界面、静物、插画、3D渲染、其他
    输出：`{ "image_type": string, "confidence": number }`

2. **skill_02_image_style.skill —— 美术风格识别**
    可选分类：PIXAR皮克斯、迪士尼、真人写实、胶片摄影、二次元、赛博朋克、水墨、油画、像素风、暗黑仙侠、科幻史诗等
    输出：`{ "style": string[], "style_weight": number[] }`

3. **skill_03_camera_param.skill —— 灯光/色彩/硬件拍摄参数解析**
    识别：主光类型、对比度、色调（冷色/暖色）、景深、镜头焦段、光圈、胶片配方、运镜（特写/全景/俯拍）、相机设备推测
    输出：`{ "light": string, "color_tone": string, "camera": string, "composition": string }`

4. **skill_04_scene_content.skill —— 基础画面内容拆解**
    主角主体、前景、背景、环境、动作、构图
    输出：`{ "subject": string, "background": string, "action": string }`

5. **skill_05_detail_desc.skill —— 细粒度人物/物体详细描述**
    人物：脸型、发型、服饰、表情、姿态、五官、情绪（隐忍/悲伤/冷怒）；物体材质、纹理、破损细节
    输出：`{ "detail": string, "emotion": string }`

6. **skill_06_prompt_generate.skill —— 最终提示词组装**
    输入前5阶段全部结构化数据，根据选择目标模型（SDXL / Krea2 Turbo / LTX 等）组装符合格式的正向/反向提示词
    输出：`{ "positive": string, "negative": string, "target_model": string }`

### 执行规则
- 用户可在设置界面启用/禁用任意SKILL阶段
- 支持自定义导入 `.skill` 文件，覆盖默认规则
- 每阶段输出做JSON校验，失败自动重试；超时报错中断流水线
- 全部阶段完成后，整条记录存入 SQLite

## 4 功能模块详细设计
### 4.1 图片导入模块
1. 两种导入模式
    - 单图选择：文件选择器，支持 png / jpg / webp
    - 文件夹批量导入：遍历目录下图片，批量排队反推
2. 预处理：自动生成缩略图存入本地缓存目录，限制长边最大 1024px，降低llama.cpp推理负载
3. 文件路径持久化：保存原图绝对路径，支持重新加载历史图片二次编辑

### 4.2 模型配置模块（支持双模式切换）
#### 模式A：本地 llama.cpp 离线模式
配置项存入 SQLite `model_config` 表：
- llama.cpp 可执行文件路径
- Qwen3.5-9B-Q4_K_M.gguf 模型路径
- mmproj-F16.gguf 投影文件路径
- 上下文长度、线程数、GPU显存分层（n_gpu_layers）、温度top_p等推理参数
> 程序自动拉起 llama.cpp 服务进程，内部加载视觉模型做图像编码

#### 模式B：Online API 在线模式
兼容 OpenAI 格式多模态接口（如 Qwen 在线API、GPT-4V 等）
配置项：API地址、API Key、模型名称、超时时间
> 流水线同样复用整套 SKILL 规则，仅推理后端切换为 HTTP 请求

### 4.3 左侧可折叠分类导航面板
树形折叠菜单，用于筛选SQLite历史记录：
```
📁 全部记录
├─ 📷 图片类型筛选
│   ├─ 人物
│   ├─ 风景
│   ├─ 电影截图
│   ├─ 广告
│   └─ 游戏原画
├─ 🎨 风格筛选
│   ├─ PIXAR
│   ├─ 真人写实
│   └─ 二次元
└─ 🤖 目标生成模型筛选
    ├─ Krea2 Turbo
    ├─ SDXL
    └─ LTX
```
交互：点击分类，右侧结果列表自动过滤匹配记录；支持多选筛选

### 4.4 主UI：反推结果列表
列表每一行卡片字段：
1. 图片缩略图
2. 原图文件名称
3. 目标适用模型（Krea2 Turbo / SDXL 等标签）
4. 图片类型、风格标签
5. 正向提示词预览（截断）
6. 操作按钮：编辑、复制提示词、重新反推、删除记录

交互：点击单条卡片 → 打开独立编辑弹窗
编辑弹窗内容：
- 原图预览
- 各SKILL阶段原始解析结果（可手动修改）
- 正向提示词输入框、反向提示词输入框
- 切换目标文生图模型，实时重新组装提示词
- 保存修改至SQLite

### 4.5 关于对话框
弹窗固定信息：
1. 软件版本号（语义化版本 vX.Y.Z）
2. 项目作者、开源协议
3. 开发日期
4. 依赖版本：Tauri版本、llama.cpp版本、Qwen3.5模型版本
5. 开源仓库地址、版权声明

### 4.6 SQLite 数据表设计
#### 表1：img_history（反推历史主表）
```sql
CREATE TABLE img_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  origin_path TEXT NOT NULL,
  thumb_path TEXT,
  create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  target_model TEXT,
  positive_prompt TEXT,
  negative_prompt TEXT,
  skill_result_json TEXT -- 完整6阶段SKILL输出JSON
);
```

#### 表2：model_config（全局配置）
```sql
CREATE TABLE model_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_mode TEXT CHECK(run_mode IN ('local','online')),
  -- 本地llama.cpp配置
  llama_bin TEXT,
  main_gguf TEXT,
  mmproj_gguf TEXT,
  n_gpu_layers INTEGER,
  threads INTEGER,
  temperature REAL,
  -- 在线API配置
  api_endpoint TEXT,
  api_key TEXT,
  api_model TEXT
);
```

#### 表3：skill_template（SKILL规则存储）
```sql
CREATE TABLE skill_template (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_name TEXT UNIQUE,
  file_content TEXT, -- .skill 文件完整yaml文本
  enable INTEGER DEFAULT 1,
  sort_index INTEGER
);
```

#### 表4：prompt_model_template（各文生图模型提示词模板）
```sql
CREATE TABLE prompt_model_template (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_name TEXT UNIQUE,
  template_pos TEXT,
  template_neg TEXT
);
```

## 5 前端 IPC 接口定义（TS ↔ Rust）
```typescript
// 伪代码 前端调用命令
interface IpcCommands {
  // 图片预处理
  createThumbnail(filePath: string): Promise<string>;
  // 启动完整SKILL流水线反推
  runImg2Prompt(filePath: string): Promise<HistoryItem>;
  // CRUD 历史记录
  getHistory(filter: FilterRule): Promise<HistoryItem[]>;
  saveHistoryEdit(data: HistoryItem): Promise<boolean>;
  deleteHistory(id: number): Promise<boolean>;
  // SKILL管理
  loadAllSkill(): Promise<SkillItem[]>;
  saveSkill(skill: SkillItem): Promise<boolean>;
  importSkillFile(path: string): Promise<SkillItem>;
  // 模型配置
  getModelConfig(): Promise<ModelConfig>;
  saveModelConfig(cfg: ModelConfig): Promise<boolean>;
  testLocalLlamaConnect(): Promise<boolean>;
  testOnlineApiConnect(): Promise<boolean>;
}
```

## 6 llama.cpp 集成方案
两种集成方案可选：
1. **方案1（推荐）：子进程独立启动 llama-server**
    Rust 调用 `llama-server`，加载 `--mmproj mmproj-F16.gguf -m Qwen3.5-9B-Q4_K_M.gguf`，本地HTTP接口调用，隔离进程，崩溃不影响主程序。
2. **方案2：rust-llama.cpp 绑定内嵌**
    编译绑定嵌入程序，适合打包分发；编译复杂度更高。

> 多模态调用流程：传入图片base64 → mmproj编码图像embedding → 拼接SKILL系统提示词，调用Qwen3.5，强制返回JSON结构化输出。

## 7 打包与分发
- Tauri 打包支持 Windows / macOS / Linux
- 模型文件不打包进安装包：用户自行放置gguf文件，在软件内手动选择路径
- 程序目录内置默认 `.skill` 模板，首次启动自动写入SQLite

## 8 扩展规划
1. 导出全部历史提示词：CSV / JSON / Markdown
2. 批量导出图片+提示词配对文件，用于AI训练数据集
3. 自定义SKILL编辑器（软件内可视化编辑yaml规则）
4. 支持更多mmproj多模态模型兼容
5. 提示词翻译、中英双语切换

## 9 默认 SKILL 文件示例（skill_01_image_type.skill）
```yaml
# skill_01_image_type.skill
stage_name: 图片类型识别
version: 1.0
system_prompt: >
  你是图像分类专家，基于传入图片，判断图片所属类型，仅输出严格JSON。
  可选枚举：人物、风景、电影截图、商业广告、游戏原画、UI界面、静物、插画、3D渲染、其他
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

---

# 附录：目录结构参考prompt-manager
```
prompt-manager/
├─ src-tauri/                 # Rust后端
│  ├─ src/
│  │  ├─ commands/            # IPC命令实现
│  │  ├─ llama_cpp/           # llama-server进程管理
│  │  ├─ skill_manager/       # skill文件加载解析器
│  │  ├─ db/                  # sqlite封装
│  │  └─ image_proc/          # 缩略图、图片预处理
├─ src/                       # TS前端
│  ├─ components/
│  │  ├─ SideCollapseTree     # 左侧折叠分类栏
│  │  ├─ PromptResultList     # 结果列表
│  │  ├─ EditPromptDialog     # 单条编辑弹窗
│  │  ├─ SettingPanel         # 模型配置面板
│  │  └─ AboutDialog          # 关于弹窗
│  ├─ skill/                  # 默认内置skill模板文件
│  ├─ api/                    # tauri ipc ts封装
│  └─ store/                  # 全局状态管理
└─ tauri.conf.json
```

如果你需要，我可以继续产出：
1. 全套 6 份完整可直接使用的 `.skill` YAML 规则文件
2. SQLite 初始化 SQL 脚本
3. Rust 基础 IPC + llama.cpp 调用示例代码
4. Vue3 前端页面组件伪代码
5. 项目 README、打包部署指南