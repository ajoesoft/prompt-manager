import React from 'react';
import {
  X,
  Sparkles,
  Layers,
  ShieldCheck
} from 'lucide-react';

interface AboutDialogProps {
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                关于 prompt-manager 本地提示词反向生成器
              </h3>
              <p className="text-[11px] text-slate-500">
                Tauri 2.0 + TypeScript + SQLite + llama.cpp 离线多模态反推架构
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs bg-white">
          {/* Version Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">客户端版本</div>
              <div className="font-semibold text-blue-700 text-xs mt-0.5 font-mono">v1.2.0 (Release)</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">多模态主模型</div>
              <div className="font-semibold text-emerald-700 text-xs mt-0.5 font-mono">Qwen3.5-9B-Q4_K_M</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">视觉投影文件</div>
              <div className="font-semibold text-purple-700 text-xs mt-0.5 font-mono">mmproj-F16.gguf</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">桌面底层框架</div>
              <div className="font-semibold text-slate-800 text-xs mt-0.5 font-mono">Tauri 2.0 (Rust)</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">持久化数据库</div>
              <div className="font-semibold text-amber-700 text-xs mt-0.5 font-mono">SQLite 3 / Embedded</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">在线加速后端</div>
              <div className="font-semibold text-sky-700 text-xs mt-0.5 font-mono">Gemini 3.7 Multimodal</div>
            </div>
          </div>

          {/* Architecture Description */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-semibold text-slate-800 text-xs flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>6 阶段 SKILL 分解流水线机制</span>
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              本工具创新性采用独立 <code className="px-1 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[10px]">.skill</code> 规则文件管控每一个反推解析阶段，流水线串行执行，每阶段输入上一阶段输出 + 图像视觉编码：
            </p>
            <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 font-mono mt-1">
              <li className="p-1 rounded bg-white border border-slate-200/80">1. skill_01_image_type (图片类型识别)</li>
              <li className="p-1 rounded bg-white border border-slate-200/80">2. skill_02_image_style (美术流派风格)</li>
              <li className="p-1 rounded bg-white border border-slate-200/80">3. skill_03_camera_param (灯光摄影硬件)</li>
              <li className="p-1 rounded bg-white border border-slate-200/80">4. skill_04_scene_content (基础主体背景)</li>
              <li className="p-1 rounded bg-white border border-slate-200/80">5. skill_05_detail_desc (细粒度微观描述)</li>
              <li className="p-1 rounded bg-white border border-slate-200/80">6. skill_06_prompt_generate (提示词组装)</li>
            </ul>
          </div>

          {/* Copyright & License */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>开源许可: Apache-2.0 License · 本地零数据外流</span>
            </div>
            <span className="text-slate-400 font-mono font-medium">Build 2026.08</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};

