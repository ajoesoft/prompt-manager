import React from 'react';
import {
  Sparkles,
  Cpu,
  Globe,
  Settings,
  Info,
  Download,
  PlusCircle,
  HardDrive,
  Languages
} from 'lucide-react';
import { ModelConfig } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface DesktopHeaderProps {
  modelConfig: ModelConfig;
  totalCount: number;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenExport: () => void;
  onOpenImportModal: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  modelConfig,
  totalCount,
  onOpenSettings,
  onOpenAbout,
  onOpenExport,
  onOpenImportModal,
}) => {
  const { lang, setLang, toggleLang, t } = useLanguage();

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

        {/* Center Mode Indicator */}
        <div className="flex items-center space-x-2">
          {modelConfig.run_mode === 'local' ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>{t('header.localModeBadge')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium">
              <Globe className="w-3 h-3 text-blue-400" />
              <span>{t('header.onlineModeBadge')} ({modelConfig.api_model || 'Gemini 3.7 Flash'})</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            </div>
          )}
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
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenImportModal}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('header.importBtn')}</span>
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


