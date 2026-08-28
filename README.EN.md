<div align="center">

# 🎨 Prompt Manager

**High-Performance Vision-to-Prompt Reverse Engineering & LoRA Dataset Toolkit Powered by Multimodal LLMs and 6-Stage SKILL Pipeline.**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Storage-SQLite3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![llama.cpp](https://img.shields.io/badge/Offline_LLM-llama.cpp-orange.svg)](https://github.com/ggerganov/llama.cpp)

[中文文档](./README.CN.md) • [Project Home](./README.md)

---

</div>

## 📖 Table of Contents

- [💡 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🖼️ Screenshots & Feature Preview](#️-screenshots--feature-preview)
  - [1. Main Workspace & Deconstruction Cards](#1-main-workspace--deconstruction-cards)
  - [2. Image Import & Batch Reverse Inference](#2-image-import--batch-reverse-inference)
  - [3. Multi-Dimensional Navigation & Filter System](#3-multi-dimensional-navigation--filter-system)
  - [4. LoRA Training Set & Multi-Format Batch Export](#4-lora-training-set--multi-format-batch-export)
  - [5. llama-server Local Acceleration Settings](#5-llama-server-local-acceleration-settings)
  - [6. Online API Profile Presets & SQLite3 Database Management](#6-online-api-profile-presets--sqlite3-database-management)
  - [7. 6-Stage Skill Template Editor & Prompt Assembly](#7-6-stage-skill-template-editor--prompt-assembly)
- [🧩 6-Stage SKILL Pipeline](#-6-stage-skill-pipeline)
- [🎯 Multi-Engine Syntax Templates](#-multi-engine-syntax-templates)
- [📦 Batch Dataset & LoRA Training Set Export](#-batch-dataset--lora-training-set-export)
- [🚀 Getting Started](#-getting-started)
  - [1. Prerequisites](#1-prerequisites)
  - [2. Installation & Run](#2-installation--run)
  - [3. Build & Deployment](#3-build--deployment)
- [⚙️ Configuration & Architecture](#️-configuration--architecture)
  - [Environment Variables](#environment-variables-env)
  - [Tech Stack](#tech-stack)
- [📄 License](#-license)

---

## 💡 Overview

**Prompt Manager** is an engineering-grade **multimodal image-to-prompt reverse engineering and LoRA dataset crafting toolkit** tailored for AI creators, LoRA model trainers, and prompt engineers.

Traditional single-pass image-to-prompt models often suffer from hallucination, style mixing, and missing tactile details. **Prompt Manager** breaks down visual cognition into a **6-Stage Modular SKILL Pipeline**, deconstructing image inputs into medium type, art movements, camera optics, scene composition, and microscopic textures before compiling them into native syntaxes for **SDXL, Flux.1, Krea2, and Midjourney v6**.

---

## ✨ Key Features

- 🔬 **6-Stage Modular SKILL Pipeline**: Deconstructs every image across 6 dedicated `.skill` rule files with real-time visual progress, execution timings, and structured JSON validation.
- 🔄 **Dual-Mode Multimodal Backend**:
  - **Mode A (Offline / Privacy-First)**: Powered by local `llama.cpp` + `Qwen3.5-9B-Q4_K_M.gguf` + `mmproj-F16.gguf` projection with full GPU offloading.
  - **Mode B (Online High-Speed)**: Direct integration with Google Gemini 3.7 Multimodal / OpenAI-compatible vision endpoints.
- 🎯 **Multi-Engine Syntax Assembly**:
  - **SDXL Tagged Weights**: Quality boosters, weighted tokens, and negative embeddings.
  - **Flux.1 Natural Language**: Coherent scene descriptions with lighting and spatial relations.
  - **Krea2 Compact Tags**: High-density descriptive keywords.
  - **Midjourney v6 Parameterized**: Native CLI flags (`--ar 16:9 --v 6.0 --style raw`).
- 💾 **SQLite Local Persistence**: Auto-saves prompt history, custom `.skill` rules, and template configurations locally with instant search, categorisation, and tree navigation.
- 📦 **One-Click LoRA Dataset Packaging**: Exports selected records into paired `.png` + `.txt` ZIP archives ready for Kohya_ss / LoRA training, alongside JSON, CSV, and Markdown exports.
- 🖥️ **Modern Desktop UI**: Polished neutral light aesthetic with collapsible sidebar trees, interactive stage inspectors, and one-click clipboard helpers.

---

## 🖼️ Screenshots & Feature Preview

### 1. Main Workspace & Deconstruction Cards
Intuitive overview of high-confidence prompts, negative filter tokens, art style badges, camera hardware parameters, and expandable 6-stage deconstruction pipelines.
<div align="center">
  <img src="./snapshot/main-ui.png" alt="Main Workspace UI" width="95%" />
</div>

<br/>

### 2. Image Import & Batch Reverse Inference
Supports drag-and-drop uploads, single-image fine-grained breakdown, multi-image batch queues, and instant generation target syntax switching.
<div align="center">
  <img src="./snapshot/import-image.png" alt="Image Import & Multimodal Reverse Inference" width="95%" />
</div>

<br/>

### 3. Multi-Dimensional Navigation & Filter System
Composite classification and filtering based on image categories (3D Render, Film Stills, Illustration), art styles (Cyberpunk, Ink Wash, Neo-Noir), and generation models.
<div align="center">
  <img src="./snapshot/main-image-filter.png" alt="Multi-Dimensional Filtering" width="95%" />
</div>

<div align="center">
  <img src="./snapshot/main-style-list.png" alt="Style List Filtering & Multi-Filter States" width="95%" />
</div>

<br/>

### 4. LoRA Training Set & Multi-Format Batch Export
One-click export of paired `.png` + `.txt` LoRA training archives (ZIP), structured JSON datasets, CSV tables, and Markdown reports.
<div align="center">
  <img src="./snapshot/main-import-prompt.png" alt="Batch Dataset Export" width="95%" />
</div>

<br/>

### 5. llama-server Local Acceleration Settings
Configure local `llama.cpp` daemon paths, host/port, GPU offloading layers (`n_gpu_layers`), CPU threads, context window, and perform live connection tests.
<div align="center">
  <img src="./snapshot/setting-llama-server.png" alt="llama-server Local Settings & GPU Offload" width="95%" />
</div>

> **💡 Recommended Qwen3.5-9B-Q4_K_M + llama-server Launch Command (Pattern Mismatch Fix & Memory Optimization):**
> ```bash
> llama-server \
>   -m ./Qwen3.5-9B-Q4_K_M.gguf \
>   --mmproj ./mmproj-F16.gguf \
>   --jinja \
>   --chat-template-kwargs '{"enable_thinking":false}' \
>   -ngl 99 \
>   -c 32768 \
>   -fa on \
>   --cache-type-k q8_0 \
>   --cache-type-v q8_0 \
>   --port 8080 \
>   --host 0.0.0.0 \
>   --parallel 1 \
>   --temp 0.7 \
>   --top-p 0.95 \
>   --top-k 20 \
>   --min-p 0.0
> ```
> *Note: `--chat-template-kwargs '{"enable_thinking":false}'` disables thinking tokens to eliminate pattern mismatch errors in structured JSON output; `--cache-type-k/v q8_0` with `-fa on` reduces 32k context VRAM footprint by 50%.*

<br/>

### 6. Online API Profile Presets & SQLite3 Database Management
Manage and switch multiple cloud API endpoints (Gemini 3.7, OpenAI GPT-4o, Qwen2.5-VL, Ollama) with SQLite3 storage, masked keys, and real-time database health metrics.
<div align="center">
  <img src="./snapshot/setting-online-api.png" alt="Online Vision API Profile Management" width="95%" />
</div>

<div align="center">
  <img src="./snapshot/setting-sqlite.png" alt="SQLite3 Database Engine Status" width="95%" />
</div>

<br/>

### 7. 6-Stage Skill Template Editor & Prompt Assembly
Visual editor for 6-stage modular `.skill` YAML rules with live stage toggles, import/export capabilities, and syntax assembly template managers.
<div align="center">
  <img src="./snapshot/setting-skill.png" alt="6-Stage Skill YAML Editor" width="95%" />
</div>

<div align="center">
  <img src="./snapshot/setting-prompt-type.png" alt="Prompt Assembly Template Settings" width="95%" />
</div>

---

## 🧩 6-Stage SKILL Pipeline

| Stage | Identifier | Stage Name | Core Functionality | Example Output |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 01** | `skill_01_image_type` | Image Type Identification | Medium & format categorization | Documentary Photography, 3D Octane Render, Cyberpunk Illustration |
| **Stage 02** | `skill_02_image_style` | Artistic Style & Movement | Art movements, palettes & visual moods | Cyberpunk, Impressionism, Neo-Expressionism, Film Grain Tones |
| **Stage 03** | `skill_03_camera_param` | Camera Optics & Lighting | Focal length, aperture, lighting rigs | 85mm f/1.4 lens, Volumetric Tyndall rays, Rim lighting, Rembrandt setup |
| **Stage 04** | `skill_04_scene_content` | Scene Content & Composition | Spatial layout, subjects, and framing | Rule of thirds, neon street in heavy rain, glowing holographic mask |
| **Stage 05** | `skill_05_detail_desc` | Microscopic Details | Fine textures, reflections & atmospherics | Skin pores micro-texture, carbon fiber weave reflections, puddle ripples |
| **Stage 06** | `skill_06_prompt_generate` | Prompt Assembly | Syntax assembly across target engines | Synthesizes positive prompt tokens and negative filter embeddings |

---

## 🎯 Multi-Engine Syntax Templates

Prompt Manager comes pre-configured with customizable syntax templates for top generation models:

```yaml
# SDXL Syntax Template
positive: "masterpiece, best quality, ultra-detailed, {type}, {style}, {camera}, {scene}, {details}, cinematic lighting, 8k resolution"
negative: "lowres, bad anatomy, bad hands, text, error, missing fingers, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"

# Midjourney v6 Syntax Template
positive: "{type}, {style}, {scene}, detailed textures: {details}, shot on {camera} --ar 16:9 --v 6.0 --style raw"

# Flux.1 Natural Narrative Template
positive: "A photograph of {scene}, captured in {style} style. The lighting is {camera}. Key details include {details}. High fidelity, natural textures."
```

---

## 📦 Batch Dataset & LoRA Training Set Export

Select multiple items in the history panel and click **Batch Export** to generate:

1. **LoRA Training Dataset (ZIP)**: Automatically packages paired `001.png` + `001.txt` files for instant use in Kohya_ss / SD WebUI.
2. **JSON Dataset**: Complete structured output including all 6-stage intermediate reasoning results.
3. **CSV Spreadsheets**: For tabular data inspection and spreadsheet filtering.
4. **Markdown Documentation**: Formatted documentation for team archiving and sharing.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.0+ / Bun / pnpm
- (Optional) Local llama.cpp binaries and GGUF models for offline mode

### 2. Installation & Run
```bash
# 1. Clone the repository
git clone https://github.com/your-username/prompt-manager.git
cd prompt-manager

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start the development server
npm run dev
```
Navigate to `http://localhost:3000` in your browser.

### 3. Build & Deployment
```bash
npm run build
npm start
```

---

## ⚙️ Configuration & Architecture

### Environment Variables (`.env`)
```env
# Gemini Multimodal API Key (for online inference mode)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, JSZip
- **Backend Service**: Express.js (Vite middleware with secure API proxying and SQLite integration)
- **Multimodal Engines**: @google/genai (Online) / llama-server (Offline Qwen-VL GGUF)
- **Persistence**: Embedded local SQLite3 database

---

## 📄 License

Distributed under the [Apache-2.0 License](https://opensource.org/licenses/Apache-2.0).

---

<div align="center">
  <sub>Built with ❤️ for AI creators, LoRA trainers, and prompt engineers worldwide.</sub>
</div>
