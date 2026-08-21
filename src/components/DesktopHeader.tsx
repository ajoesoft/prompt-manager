import React from 'react';
import {
  Sparkles,
  Cpu,
  Globe,
  Settings,
  Info,
  Download,
  RotateCcw,
  Layers,
  Database,
  Search,
  PlusCircle,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { ModelConfig } from '../types';

interface DesktopHeaderProps {
  modelConfig: ModelConfig;
  totalCount: number;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenExport: () => void;
  onOpenImportModal: () => void;
  onResetPresets: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  modelConfig,
  totalCount,
  onOpenSettings,
  onOpenAbout,
  onOpenExport,
  onOpenImportModal,
  onResetPresets,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 select-none shadow-xs">
      {/* Desktop Window Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-200">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 mr-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600 hover:opacity-80 transition cursor-pointer shadow-xs" />
            <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600 hover:opacity-80 transition cursor-pointer shadow-xs" />
            <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 hover:opacity-80 transition cursor-pointer shadow-xs" />
          </div>
          <div className="flex items-center space-x-1.5 text-slate-300 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-white tracking-tight">prompt-manager</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              v1.2.0 · Tauri+Qwen3.5
            </span>
          </div>
        </div>

        {/* Center Mode Indicator */}
        <div className="flex items-center space-x-2">
          {modelConfig.run_mode === 'local' ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>本地 llama.cpp 离线引擎 (Qwen3.5-9B-Q4_K_M + mmproj)</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium">
              <Globe className="w-3 h-3 text-blue-400" />
              <span>在线多模态 API 引擎 ({modelConfig.api_model || 'Gemini 3.7 Flash'})</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Right Status */}
        <div className="flex items-center space-x-3 text-slate-400">
          <span className="flex items-center space-x-1 text-[11px]">
            <HardDrive className="w-3 h-3 text-slate-400" />
            <span className="text-slate-300 font-mono">SQLite 已挂载 ({totalCount} 条)</span>
          </span>
        </div>
      </div>

      {/* Primary Toolbar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50/80 border-b border-slate-200/60">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenImportModal}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>导入图片反推 (Single / Batch)</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>导出数据集 (LoRA/CSV)</span>
          </button>

          <button
            onClick={onResetPresets}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-xs border border-slate-200 shadow-xs transition"
            title="加载精选多模态样例"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>重置预设样本</span>
          </button>
        </div>

        {/* Right Settings and Info */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 shadow-xs transition"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>系统配置 & SKILL 规则</span>
          </button>

          <button
            onClick={onOpenAbout}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-xs transition"
            title="关于本软件"
          >
            <Info className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    </header>
  );
};

