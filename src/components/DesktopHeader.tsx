import React from 'react';
import {
  Sparkles,
  Cpu,
  Settings,
  Info,
  Download,
  PlusCircle,
  HardDrive,
  FolderKanban,
  PenTool,
  Wand2,
} from 'lucide-react';
import { ModelConfig, Project } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface DesktopHeaderProps {
  modelConfig: ModelConfig;
  totalCount: number;
  projects: Project[];
  activeProject: Project | null;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenExport: () => void;
  onOpenImportModal: () => void;
  onOpenProjectModal: () => void;
  onOpenManualPromptModal?: () => void;
  onOpenElementReplacerModal?: () => void;
  onSelectProject: (uuid: string) => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  modelConfig,
  totalCount,
  projects,
  activeProject,
  onOpenSettings,
  onOpenAbout,
  onOpenExport,
  onOpenImportModal,
  onOpenProjectModal,
  onOpenManualPromptModal,
  onOpenElementReplacerModal,
}) => {
  const { lang, setLang, t } = useLanguage();

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
            <span className="font-semibold text-white tracking-tight">{t('app.title')}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {t('app.versionBadge')}
            </span>
          </div>
        </div>

        {/* Center Mode & Active Project Indicator */}
        <div className="flex items-center space-x-2">
          {/* Active Project Pill */}
          <div
            onClick={onOpenProjectModal}
            className="flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium cursor-pointer hover:bg-blue-500/30 transition"
            title="点击打开项目管理与 ComfyUI 调度"
          >
            <FolderKanban className="w-3 h-3 text-blue-400" />
            <span className="font-semibold text-blue-200">当前项目:</span>
            <span className="font-mono text-white font-bold truncate max-w-[150px]">
              {activeProject?.name || '默认项目'}
            </span>
            <span className="text-[10px] bg-blue-500/40 text-blue-200 px-1.5 py-0.2 rounded font-mono">
              {activeProject?.target_model || 'Krea2'}
            </span>
          </div>

          <div
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium cursor-pointer hover:bg-emerald-500/30 transition"
            title="点击打开模型管理与下载中心"
          >
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold">本地视觉模型:</span>
            <span className="font-mono text-emerald-200 truncate max-w-[160px]">
              {modelConfig.main_gguf ? modelConfig.main_gguf.split(/[\\/]/).pop() : 'Qwen2.5-VL-7B'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Right Status */}
        <div className="flex items-center space-x-3 text-slate-400">
          <span className="flex items-center space-x-1 text-[11px]">
            <HardDrive className="w-3 h-3 text-slate-400" />
            <span className="text-slate-300 font-mono">{t('header.sqliteStatus', { count: totalCount })}</span>
          </span>
        </div>
      </div>

      {/* Primary Toolbar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50/80 border-b border-slate-200/60">
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
          <button
            onClick={onOpenImportModal}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('header.importBtn')}</span>
          </button>

          {/* Manual Write Prompt Button */}
          {onOpenManualPromptModal && (
            <button
              onClick={onOpenManualPromptModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:from-indigo-700 active:to-purple-800 text-white text-xs font-semibold shadow-xs transition"
              title="手动编写正负提示词与参数并加入当前项目"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>手写提示词</span>
            </button>
          )}

          {/* Prompt Elements Replacement / Style Transformer Button */}
          {onOpenElementReplacerModal && (
            <button
              onClick={onOpenElementReplacerModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 text-xs font-semibold border border-purple-200 shadow-2xs transition"
              title="对提示词要素（风格、类型、人物IP、背景、灯光、镜头等）进行拆解替换与风格重塑"
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-600" />
              <span>要素替换重塑</span>
            </button>
          )}

          {/* Project Management Button */}
          <button
            onClick={onOpenProjectModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition"
          >
            <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
            <span>项目管理与调度</span>
            {projects.length > 0 && (
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-full font-mono font-bold">
                {projects.length}
              </span>
            )}
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('header.exportBtn')}</span>
          </button>
        </div>

        {/* Right Settings, Language Switcher and Info */}
        <div className="flex items-center space-x-2">
          {/* Language Switcher Button */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
            <button
              onClick={() => setLang('zh')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                lang === 'zh'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="切换为中文"
            >
              中
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                lang === 'en'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Switch to English"
            >
              EN
            </button>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 shadow-xs transition"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('header.settingsBtn')}</span>
          </button>

          <button
            onClick={onOpenAbout}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-xs transition"
            title={t('header.aboutBtn')}
          >
            <Info className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    </header>
  );
};
