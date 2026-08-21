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

---

### 🌐 语言选择 / Language Selection

[🇨🇳 **简体中文完整文档 (README.CN.md)**](./README.CN.md) • [🇺🇸 **English Full Documentation (README.EN.md)**](./README.EN.md)

---

</div>

## 📌 Executive Summary / 核心概述

| 特性 / Feature | 说明 / Description |
| :--- | :--- |
| **🔬 6-Stage SKILL Pipeline** | 6 阶段模块化分解流水线：类型识别 ➔ 美术流派 ➔ 摄影参数 ➔ 场景主体 ➔ 微观质感 ➔ 提示词组装 |
| **🔄 Dual-Mode Inference** | **离线模式** (`llama.cpp` + `Qwen3.5-9B-Q4_K_M.gguf`) & **在线模式** (Gemini 3.7 Multimodal / OpenAI API) |
| **🎯 Multi-Engine Syntaxes** | 原生支持 **SDXL、Flux.1、Krea2、Midjourney v6** 等主流生图语法与负向词过滤 |
| **💾 SQLite Persistence** | 本地嵌入式 SQLite3 持久化存储历史记录、自定义 SKILL 规则与模型配置 |
| **📦 LoRA Dataset Packaging** | 一键打包输出配对的 `.png` + `.txt` LoRA 训练集压缩包 (ZIP)、JSON、CSV 与 Markdown |

---

## 🖼️ UI Preview / 界面截图预览

<div align="center">
  <img src="./snapshot/main-ui.png" alt="Main UI" width="95%" />
  <p><em>主工作台：多阶段反推卡片流与分类树形导航</em></p>
</div>

<br/>

<div align="center">
  <img src="./snapshot/setting-llama-server.png" alt="llama-server Settings" width="48%" />
  <img src="./snapshot/setting-online-api.png" alt="Online API Settings" width="48%" />
  <p><em>左：llama.cpp 本地硬件加速设置 ｜ 右：在线多模态 API 多端点管理</em></p>
</div>

<br/>

<div align="center">
  <img src="./snapshot/import-image.png" alt="Import Modal" width="48%" />
  <img src="./snapshot/main-import-prompt.png" alt="Export Modal" width="48%" />
  <p><em>左：图片拖拽导入与反推 ｜ 右：批量导出 LoRA 训练集 (ZIP/JSON/CSV)</em></p>
</div>

---

## ⚡ Quick Start / 快速上手

```bash
# 1. Clone the repository / 克隆项目
git clone https://github.com/ajoesoft/prompt-manager
cd prompt-manager

# 2. Install dependencies / 安装依赖
npm install

# 3. Configure environment variables / 配置环境变量
cp .env.example .env

# 4. Start the development server / 启动开发环境
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 📚 Detailed Documentation / 完整详细文档

- 🇨🇳 **中文文档**：查看 [README.CN.md](./README.CN.md) 获取完整的 6 阶段规则定义、语法模板配置及数据导出说明。
- 🇺🇸 **English Documentation**: See [README.EN.md](./README.EN.md) for full pipeline specs, multi-model template guides, and technical architecture.

---

## 📄 License

Distributed under the [Apache-2.0 License](https://opensource.org/licenses/Apache-2.0).
