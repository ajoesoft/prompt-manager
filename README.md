<div align="center">

# 🎨 Prompt Manager (提示词反推与数据集工坊)

**基于多模态大模型与 6 阶段 SKILL 分解流水线的高性能图片反推提示词与 LoRA 训练集制作工具**  
*High-performance Vision-to-Prompt Reverse Engineering & LoRA Dataset Toolkit Powered by Multimodal LLMs and 6-Stage SKILL Pipeline.*

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Storage-SQLite3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![llama.cpp](https://img.shields.io/badge/Offline_LLM-llama.cpp-orange.svg)](https://github.com/ggerganov/llama.cpp)

[中文文档](#-中文文档) • [English Documentation](#-english-documentation)

---

</div>

## 📖 目录 / Table of Contents

- [🇨🇳 中文文档](#-中文文档)
  - [✨ 项目亮点](#-项目亮点)
  - [🧩 6 阶段 SKILL 分解流水线](#-6-阶段-skill-分解流水线)
  - [🎯 多引擎语法模板支持](#-多引擎语法模板支持)
  - [📦 批量数据集导出](#-批量数据集导出)
  - [🚀 快速上手](#-快速上手)
  - [⚙️ 配置与架构说明](#️-配置与架构说明)
- [🇺🇸 English Documentation](#-english-documentation)
  - [✨ Key Features](#-key-features)
  - [🧩 6-Stage SKILL Pipeline](#-6-stage-skill-pipeline)
  - [🎯 Multi-Engine Syntax Templates](#-multi-engine-syntax-templates)
  - [📦 Batch Dataset Export](#-batch-dataset-export)
  - [🚀 Getting Started](#-getting-started)
  - [⚙️ Configuration & Architecture](#️-configuration--architecture)

---

# 🇨🇳 中文文档

## 💡 项目简介

**Prompt Manager** 是一款专为 AI 创作者、LoRA 模型训练师和数字艺术家设计的**多模态图片反推提示词与数据集工坊**。传统单次提示词反推往往存在细节丢失、风格混杂、语法混乱等问题。本项目创新性地采用了 **6 阶段模块化 SKILL 规则流水线**，对输入图像进行层层分解，精确解析类型、流派、相机摄影参数、场景主体与微观质感，并自动适配 **SDXL、Flux.1、Krea2、Midjourney v6** 等主流生图引擎的语法规则。

---

## ✨ 项目亮点

- 🔬 **6 阶段模块化分解流水线**：摒弃单一模糊推理，采用 6 个独立 `.skill` 规则文件管控每一阶段，支持实时可视化执行状态与耗时。
- 🔄 **双模式多模态推理后端**：
  - **模式 A (离线隐私)**：本地运行 `llama.cpp` + `Qwen3.5-9B-Q4_K_M.gguf` + `mmproj-F16.gguf` 视觉投影，100% 离线、数据零外流、支持 GPU Offload。
  - **模式 B (在线加速)**：无缝直连 Gemini 3.7 Multimodal / OpenAI 兼容多模态 API，提供毫秒级极速反推。
- 🎯 **主流生图引擎语法模板引擎**：
  - **SDXL 经典权重语法**：`masterpiece, best quality, (photorealistic:1.3), ...`
  - **Flux.1 自然语言长叙述**：精准物理光影、材质交互与构图关系。
  - **Krea2 紧凑标签流**：高信息密度视觉关键词。
  - **Midjourney v6 参数化命令**：`--ar 16:9 --v 6.0 --style raw --q 2`
- 💾 **SQLite 本地持久化**：历史反推记录、自定义 SKILL 规则、模型配置与生图模板全部存储于本地数据库，支持模糊搜索、分类筛选与快速复制。
- 📦 **一键批量 LoRA 数据集打包**：支持将选中的反推结果一键导出为标准的 **LoRA 训练集压缩包 (`image.png` + `image.txt` 配对)**、JSON 结构体、CSV 表格或 Markdown 文档。
- 🖥️ **现代化工作台 UI**：采用专业中性灰/深海蓝设计语言，内置可折叠侧边树形目录、实时阶段流水线监视器与多格式即时拷贝工具。

---

## 🧩 6 阶段 SKILL 分解流水线

| 阶段编号 | 阶段名称 | 核心职责 | 输出示例 |
| :--- | :--- | :--- | :--- |
| **Stage 01** | `skill_01_image_type` | 图像大类与载体类型识别 | 纪实摄影 (Documentary Photography), 3D 渲染, 赛博朋克插画 |
| **Stage 02** | `skill_02_image_style` | 艺术流派、色调与视觉风格 | 赛博朋克 (Cyberpunk), 印象派, 新表现主义, 胶片颗粒色调 |
| **Stage 03** | `skill_03_camera_param` | 摄影硬件、镜头焦段与光影 | 85mm f/1.4 大光圈, 丁达尔体积光, 边缘轮廓光, 伦勃朗光 |
| **Stage 04** | `skill_04_scene_content` | 空间构图、主体位置与环境 | 三分法则构图, 雨夜霓虹街头, 佩戴发光全息面具的主体 |
| **Stage 05** | `skill_05_detail_desc` | 微观质感、材质反光与细节 | 皮肤毛孔微距纹理, 碳纤维编织反光, 潮湿路面积水倒影 |
| **Stage 06** | `skill_06_prompt_generate` | 多引擎格式化正/负向提示词组装 | 格式化组装正向英文 Prompt 与 Negative 过滤词 |

---

## 🎯 多引擎语法模板支持

系统内置了针对不同生图引擎的语法注入模板，并支持在设置面板中自由添加和编辑：

```yaml
# SDXL 语法模板示例
positive: "masterpiece, best quality, ultra-detailed, {type}, {style}, {camera}, {scene}, {details}, cinematic lighting, 8k resolution"
negative: "lowres, bad anatomy, bad hands, text, error, missing fingers, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"

# Midjourney v6 语法模板示例
positive: "{type}, {style}, {scene}, detailed textures: {details}, shot on {camera} --ar 16:9 --v 6.0 --style raw"
```

---

## 📦 批量数据集导出

在主界面批量勾选图片记录后，点击 **批量导出**，即可选择：
1. **LoRA 训练集 ZIP**：自动解压后为成对的 `001.png` + `001.txt`，txt 内为反推的正向提示词，开箱即用投入 Kohya_ss / WebUI 训练。
2. **JSON 数据包**：包含 6 阶段全量分解参数、模型配置、时间戳与标签元数据。
3. **CSV 表格**：适合数据分析与批量比对。
4. **Markdown 格式文档**：排版清晰，便于团队文档分享与归档。

---

## 🚀 快速上手

### 1. 环境要求
- Node.js 18.0+ / Bun / pnpm
- (可选) 本地 llama.cpp 二进制文件与 GGUF 模型（若使用离线模式）

### 2. 安装与运行
```bash
# 1. 克隆项目
git clone https://github.com/ajoesoft/prompt-manager
cd prompt-manager

# 2. 安装依赖
npm install

# 3. 复制环境变量配置
cp .env.example .env

# 4. 启动开发服务器
npm run dev
```
打开浏览器访问 `http://localhost:3000` 即可开始使用。

### 3. 构建生产版本
```bash
npm run build
npm start
```

---

## ⚙️ 配置与架构说明

### 环境变量 (`.env`)
```env
# Gemini 多模态 API Key (若使用在线模式)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 技术栈选型
- **前端核心**：React 18, TypeScript, Tailwind CSS, Lucide React, JSZip
- **后端路由**：Express.js (Vite Middleware 驱动，支持服务端安全 API 代理与 SQLite 交互)
- **多模态引擎**：@google/genai (Online) / llama-server (Offline Qwen-VL GGUF)
- **数据库**：本地嵌入式 SQLite3 持久化表结构

---

<br />

# 🇺🇸 English Documentation

## 💡 Overview

**Prompt Manager** is a professional-grade **multimodal image-to-prompt reverse engineering and LoRA dataset crafting toolkit** tailored for AI digital artists, model trainers, and prompt engineers. Unlike conventional single-pass captioning tools that suffer from hallucination and missed details, this system introduces a **6-Stage Modular SKILL Pipeline** to systematically dissect visual attributes—from macroscopic medium type to microscopic specular highlights—and compiles them into syntax optimized for **SDXL, Flux.1, Krea2, and Midjourney v6**.

---

## ✨ Key Features

- 🔬 **6-Stage Modular SKILL Pipeline**: Deconstructs every image across 6 dedicated `.skill` rule files with real-time visual progress and latency indicators.
- 🔄 **Dual-Mode Multimodal Backend**:
  - **Mode A (Offline / Privacy-First)**: Powered by local `llama.cpp` + `Qwen3.5-9B-Q4_K_M.gguf` + `mmproj-F16.gguf` projection with full GPU offloading.
  - **Mode B (Online High-Speed)**: Native integration with Gemini 3.7 Multimodal / OpenAI-compatible endpoints.
- 🎯 **Multi-Engine Syntax Assembly**:
  - **SDXL Tagged Weights**: Quality boosters, weighted tokens, and negative embeddings.
  - **Flux.1 Natural Language**: Coherent scene descriptions with lighting and spatial relations.
  - **Krea2 Compact Tags**: High-density descriptive keywords.
  - **Midjourney v6 Parameterized**: Native CLI flags (`--ar 16:9 --v 6.0 --style raw`).
- 💾 **SQLite Local Persistence**: Auto-saves prompt history, custom `.skill` rules, and template configurations locally with instant search and filtering.
- 📦 **One-Click LoRA Dataset Packaging**: Exports selected records into paired `.png` + `.txt` ZIP archives ready for Kohya_ss / LoRA training, alongside JSON, CSV, and Markdown exports.
- 🖥️ **Modern Desktop UI**: Polished neutral light aesthetic with collapsible sidebar trees, interactive stage inspectors, and one-click clipboard helpers.

---

## 🧩 6-Stage SKILL Pipeline

| Stage | Identifier | Functionality |
| :--- | :--- | :--- |
| **Stage 01** | `skill_01_image_type` | Categorizes image medium (Photography, 3D Render, Oil Painting, Anime, etc.) |
| **Stage 02** | `skill_02_image_style` | Identifies artistic movement, color palette, and visual mood (Cyberpunk, Film Grain, etc.) |
| **Stage 03** | `skill_03_camera_param` | Detects focal length, aperture, volumetric lighting, and studio setup |
| **Stage 04** | `skill_04_scene_content` | Analyzes primary subject, poses, foreground/background, and composition rule |
| **Stage 05** | `skill_05_detail_desc` | Captures micro-textures, skin pores, cloth folds, specular reflections, and atmospherics |
| **Stage 06** | `skill_06_prompt_generate` | Synthesizes target-engine positive prompts and negative filter tags |

---

## 📦 Batch Dataset Export

Select multiple items in the history panel and click **Batch Export** to produce:
- **LoRA Dataset (ZIP)**: Paired `001.png` and `001.txt` files matching standard diffusion training layouts.
- **JSON Dataset**: Complete structured output including all 6-stage intermediate reasoning results.
- **CSV Spreadsheets**: For tabular data inspection and spreadsheet filtering.
- **Markdown Docs**: Formatted documentation for archiving and sharing.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.0+ or Bun
- (Optional) Local llama.cpp binaries and GGUF models for offline mode

### 2. Quick Setup
```bash
# Clone the repository
git clone https://github.com/ajoesoft/prompt-manager
cd prompt-manager

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run development server
npm run dev
```
Navigate to `http://localhost:3000` in your browser.

---

## 📄 License

Distributed under the **Apache-2.0 License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ for AI creators, LoRA trainers, and prompt engineers worldwide.</sub>
</div>
