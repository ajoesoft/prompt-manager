import React from 'react';
import {
  X,
  Sparkles,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface AboutDialogProps {
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ onClose }) => {
  const { t } = useLanguage();

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
                {t('about.title')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t('about.subtitle')}
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
              <div className="text-slate-500 text-[10px]">{t('about.clientVersion')}</div>
              <div className="font-semibold text-blue-700 text-xs mt-0.5 font-mono">v1.2.0 (Release)</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">{t('about.mainModel')}</div>
              <div className="font-semibold text-emerald-700 text-xs mt-0.5 font-mono">Qwen3.5-9B-Q4_K_M</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">{t('about.visionProj')}</div>
              <div className="font-semibold text-purple-700 text-xs mt-0.5 font-mono">mmproj-F16.gguf</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">{t('about.framework')}</div>
              <div className="font-semibold text-slate-800 text-xs mt-0.5 font-mono">Tauri 2.0 (Rust)</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">{t('about.database')}</div>
              <div className="font-semibold text-amber-700 text-xs mt-0.5 font-mono">SQLite 3 / Embedded</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 text-[10px]">{t('about.cloudBackend')}</div>
              <div className="font-semibold text-sky-700 text-xs mt-0.5 font-mono">Gemini 3.7 Multimodal</div>
            </div>
          </div>

          {/* Architecture Description */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-semibold text-slate-800 text-xs flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>{t('about.skillPipelineTitle')}</span>
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {t('about.skillPipelineDesc')}
            </p>
            <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-700 font-mono mt-1">
              <li className="p-1 rounded bg-white border border-slate-200/80">1. skill_01_image_type (Type Classification)</li>
              <li className="p-1 rounded bg-white border border-slate-200/80">2. skill_02_image_style (Art Style)</li>
              <li className="p-1 rounded bg-white border border-slate-200/80">3. skill_03_camera_param (Lighting & Camera)</li>
              <li className="p-1 rounded bg-white border border-slate-200/80">4. skill_04_scene_content (Subject & Scene)</li>
              <li className="p-1 rounded bg-white border border-slate-200/80">5. skill_05_detail_desc (Micro Details)</li>
              <li className="p-1 rounded bg-white border border-slate-200/80">6. skill_06_prompt_generate (Prompt Assembly)</li>
            </ul>
          </div>

          {/* Copyright & License */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('about.licenseNote')}</span>
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
            {t('about.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
};


