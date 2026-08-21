import React, { useState } from 'react';
import {
  Copy,
  Check,
  Edit3,
  Trash2,
  Star,
  Sparkles,
  Camera,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
  Clock,
  Eye,
  Sliders,
  Maximize2
} from 'lucide-react';
import { HistoryItem } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface PromptResultCardProps {
  item: HistoryItem;
  onEdit: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRerun: (item: HistoryItem) => void;
}

export const PromptResultCard: React.FC<PromptResultCardProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
  onRerun,
}) => {
  const { t } = useLanguage();
  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopyPositive = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.positive_prompt);
    setCopiedPos(true);
    setTimeout(() => setCopiedPos(false), 1800);
  };

  const handleCopyNegative = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.negative_prompt);
    setCopiedNeg(true);
    setTimeout(() => setCopiedNeg(false), 1800);
  };

  const imageType = item.skill_result_json.skill_01_image_type?.image_type || 'General';
  const confidence = item.skill_result_json.skill_01_image_type?.confidence || 0.95;
  const styles = item.skill_result_json.skill_02_image_style?.style || [];
  const cameraLight = item.skill_result_json.skill_03_camera_param?.light;
  const cameraDevice = item.skill_result_json.skill_03_camera_param?.camera;
  const subject = item.skill_result_json.skill_04_scene_content?.subject;

  return (
    <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 group">
      <div className="p-4 flex flex-col md:flex-row gap-4">
        {/* Left Thumbnail */}
        <div className="relative w-full md:w-44 h-44 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group-hover:border-slate-300">
          <img
            src={item.thumb_path}
            alt={item.file_name}
            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Top Overlays */}
          <div className="absolute top-2 left-2 flex items-center space-x-1">
            <span className="px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono border border-slate-700/50">
              {imageType}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-xs text-slate-400 hover:text-amber-500 border border-slate-200 shadow-2xs transition"
            title={item.is_favorite ? t('card.unfavorite') : t('card.favorite')}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                item.is_favorite ? 'fill-amber-400 text-amber-500' : ''
              }`}
            />
          </button>

          {/* Bottom stats */}
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] text-slate-200 bg-slate-900/85 backdrop-blur-xs px-2 py-0.5 rounded">
            <span>{item.file_size_kb} KB</span>
            <span className="text-emerald-300 font-mono font-medium">{t('card.confidence', { value: (confidence * 100).toFixed(0) })}</span>
          </div>
        </div>

        {/* Right Info and Prompts */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
          {/* Header Row */}
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 truncate">
                <h4
                  onClick={() => onEdit(item)}
                  className="font-semibold text-sm text-slate-900 hover:text-blue-600 cursor-pointer truncate transition"
                  title={item.file_name}
                >
                  {item.file_name}
                </h4>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200/80">
                  {item.target_model}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onEdit(item)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition"
                  title={t('card.editBtn')}
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('card.editBtn')}</span>
                </button>

                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-slate-200 transition"
                  title={t('card.deleteBtn')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Badges: Styles & Camera */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {styles.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-medium border border-purple-200"
                >
                  🎨 {s}
                </span>
              ))}
              {cameraDevice && (
                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[11px] font-medium border border-sky-200 truncate max-w-[200px]">
                  📷 {cameraDevice}
                </span>
              )}
              {item.execution_time_ms && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono border border-slate-200/60">
                  ⏱️ {item.execution_time_ms}ms
                </span>
              )}
            </div>
          </div>

          {/* Prompts Section */}
          <div className="space-y-2">
            {/* Positive Prompt Box */}
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 relative shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span className="text-blue-300 font-semibold flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t('card.positivePrompt')}</span>
                </span>
                <button
                  onClick={handleCopyPositive}
                  className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-sans transition ${
                    copiedPos
                      ? 'bg-emerald-500/30 text-emerald-300 font-medium'
                      : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {copiedPos ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPos ? t('card.copied') : t('card.copy')}</span>
                </button>
              </div>
              <p className="text-xs text-slate-100 line-clamp-2 select-all font-mono leading-relaxed">
                {item.positive_prompt}
              </p>
            </div>

            {/* Negative Prompt Box (if present) */}
            {item.negative_prompt && (
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 relative">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                  <span className="font-semibold text-slate-600">{t('card.negativePrompt')}</span>
                  <button
                    onClick={handleCopyNegative}
                    className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] transition ${
                      copiedNeg ? 'text-emerald-600 font-medium' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {copiedNeg ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedNeg ? t('card.copied') : t('card.copy')}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-1 select-all font-mono">
                  {item.negative_prompt}
                </p>
              </div>
            )}
          </div>

          {/* Expandable SKILL 6-Stage Details Accordion */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              {t('card.createdAt')}: {item.create_at}
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition"
            >
              <span>{isExpanded ? t('card.collapseSkill') : t('card.expandSkill')}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded 6-Stage Breakdown Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 bg-slate-50/80 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Stage 1 & 2 */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="font-semibold text-slate-800 text-[11px] flex items-center space-x-1 text-sky-700">
              <span>{t('card.stage12Header')}</span>
            </div>
            <div className="text-slate-700 text-[11px]">
              <span className="text-slate-400">{t('card.subCategory')}:</span>{' '}
              {item.skill_result_json.skill_01_image_type?.sub_category || '标准'}
            </div>
            <div className="text-slate-700 text-[11px]">
              <span className="text-slate-400">{t('card.medium')}:</span>{' '}
              {item.skill_result_json.skill_02_image_style?.medium || '摄影/数字绘画'}
            </div>
            <div className="text-slate-700 text-[11px]">
              <span className="text-slate-400">{t('card.mood')}:</span>{' '}
              {item.skill_result_json.skill_02_image_style?.visual_mood || '无'}
            </div>
          </div>

          {/* Stage 3 & 4 */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="font-semibold text-slate-800 text-[11px] flex items-center space-x-1 text-purple-700">
              <span>{t('card.stage34Header')}</span>
            </div>
            <div className="text-slate-700 text-[11px] truncate">
              <span className="text-slate-400">{t('card.lighting')}:</span>{' '}
              {cameraLight || '自然漫射光'}
            </div>
            <div className="text-slate-700 text-[11px] truncate">
              <span className="text-slate-400">{t('card.subject')}:</span>{' '}
              {subject || '画面焦点'}
            </div>
            <div className="text-slate-700 text-[11px] truncate">
              <span className="text-slate-400">{t('card.background')}:</span>{' '}
              {item.skill_result_json.skill_04_scene_content?.background || '环境'}
            </div>
          </div>

          {/* Stage 5 & 6 */}
          <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="font-semibold text-slate-800 text-[11px] flex items-center space-x-1 text-emerald-700">
              <span>{t('card.stage56Header')}</span>
            </div>
            <div className="text-slate-700 text-[11px] line-clamp-2">
              <span className="text-slate-400">{t('card.texture')}:</span>{' '}
              {item.skill_result_json.skill_05_detail_desc?.detail || '精细肌理'}
            </div>
            {item.skill_result_json.skill_06_prompt_generate?.suggested_params && (
              <div className="text-slate-600 text-[10px] font-mono bg-slate-50 p-1 rounded border border-slate-100">
                CFG:{' '}
                {item.skill_result_json.skill_06_prompt_generate.suggested_params.cfg_scale ||
                  7.0}{' '}
                · Steps:{' '}
                {item.skill_result_json.skill_06_prompt_generate.suggested_params.steps || 30}{' '}
                · Sampler:{' '}
                {item.skill_result_json.skill_06_prompt_generate.suggested_params.sampler ||
                  'Euler'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


