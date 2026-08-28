import React, { useState } from 'react';
import {
  Copy,
  Check,
  Edit3,
  Trash2,
  Star,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  LayoutGrid
} from 'lucide-react';
import { HistoryItem } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface PromptResultCardProps {
  item: HistoryItem;
  layoutMode?: 'list' | 'grid' | 'flow';
  onEdit: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRerun: (item: HistoryItem) => void;
}

export const PromptResultCard: React.FC<PromptResultCardProps> = ({
  item,
  layoutMode = 'list',
  onEdit,
  onDelete,
  onToggleFavorite,
  onRerun,
}) => {
  const { t } = useLanguage();
  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'report' | 'cards'>('report');

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

  const handleCopyReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = item.formatted_report || generateReportFromItem(item);
    navigator.clipboard.writeText(textToCopy);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 1800);
  };

  const generateReportFromItem = (it: HistoryItem): string => {
    const s1 = it.skill_result_json.skill_01_image_type;
    const s3 = it.skill_result_json.skill_03_camera_param;
    const s4 = it.skill_result_json.skill_04_scene_content;

    const mainType = s1?.image_type || '人物';
    const subType = s1?.sub_category || '真人写实（艺术化方向） / 新古典主义肖像摄影（风格归属）';

    const light = s3?.light || '柔和漫射面光 + 微弱填充光 + 极轻轮廓光';
    const tone = s3?.color_tone || '暖奶油主调 + 冷蓝点缀 / 莫兰迪低饱和暖灰';
    const cam = s3?.camera || 'ARRI Alexa Mini LF / Kodak Portra 800';
    const comp = s3?.composition || '三分法 + 平视微仰角 + 前景虚化引导';
    const focal = s3?.lens_focal || '85mm 人像大光圈';
    const ap = s3?.aperture || 'f/1.4 极致浅景深';

    const sub = s4?.subject || '一位年轻女性，金发盘起，浅蓝眼眸，面部表情沉静而略带忧郁，嘴唇微启，正凝视画面右侧人物。她身穿米色露肩上衣，颈部线条清晰，皮肤质感细腻，是画面绝对视觉焦点。';
    const bg = s4?.background || '背景完全虚化，呈现暖黄色调的模糊色块，无法辨识具体建筑或环境，但营造出室内柔和光线的氛围。无明确地标、家具或自然元素，仅以抽象色块强化人物情绪与空间纵深感。';
    const act = s4?.action || '女性处于静态凝视状态，头部微微侧向右方，目光聚焦于画面外右侧人物（仅可见其蓝色衣袖轮廓）。嘴唇微张，似在倾听或即将回应，形成无声的情感对话。整体姿态优雅内敛，传递出专注、期待或轻微不安的情绪张力。';
    const fg = s4?.foreground || '画面右下角有一块深蓝色布料（推测为另一人物衣物），呈虚化状态，作为前景遮挡物，不仅增加画面层次，也引导观众视线向中心女性集中，并暗示“对话对象”的存在，强化互动关系。';
    const env = s4?.environment || '未明确指定具体世界观，但从光影、服饰、妆容及构图风格判断，属于“现代都市室内场景”或“浪漫剧情片特写镜头”。整体氛围偏向温情、私密、情感浓烈，适合爱情、家庭或心理剧情类影视作品。';

    return `因此，主分类为：${mainType}\n\n最终分类：${subType}\n\n\nLight: ${light}\nColor Tone: ${tone}\nCamera: ${cam}\nComposition: ${comp}\nLens Focal: ${focal}\nAperture: ${ap}\n\n\n\n🎬 Subject（核心主体）\n${sub}\n\n🌄 Background（背景环境与远景建筑/气候）\n${bg}\n\n🌀 Action（主体的动态姿态与交互动作）\n${act}\n\n🖼️ Foreground（前景遮挡物或视线引导元素）\n${fg}\n\n🌍 Environment（宏观世界观环境设定）\n${env}\n\n最后结果。`;
  };

  const imageType = item.skill_result_json.skill_01_image_type?.image_type || '人物';
  const confidence = item.skill_result_json.skill_01_image_type?.confidence || 0.96;
  const styles = item.skill_result_json.skill_02_image_style?.style || [];
  const cameraLight = item.skill_result_json.skill_03_camera_param?.light;
  const cameraDevice = item.skill_result_json.skill_03_camera_param?.camera;
  const subject = item.skill_result_json.skill_04_scene_content?.subject;

  const isFlow = layoutMode === 'flow' || layoutMode === 'grid';

  return (
    <div className={`bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 group flex flex-col break-inside-avoid ${isFlow ? 'w-full mb-4 inline-block' : 'w-full'}`}>
      <div className={`p-4 flex flex-col ${isFlow ? 'space-y-3' : 'md:flex-row gap-4'}`}>
        {/* Thumbnail - adapts width horizontally and naturally extends vertically in flow mode */}
        <div className={`relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group-hover:border-slate-300 flex-shrink-0 ${isFlow ? 'w-full' : 'w-full md:w-44 h-44'}`}>
          <img
            src={item.thumb_path}
            alt={item.file_name}
            className={`w-full ${isFlow ? 'h-auto block object-contain' : 'h-full object-cover'} transition duration-300 group-hover:scale-[1.02]`}
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
            <span className="text-emerald-300 font-mono font-medium">
              {t('card.confidence', { percent: (confidence * 100).toFixed(0), value: (confidence * 100).toFixed(0) })}
            </span>
          </div>
        </div>

        {/* Right / Body Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
          {/* Header Row */}
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 truncate">
                <h4
                  onClick={() => onEdit(item)}
                  className="font-semibold text-sm text-slate-900 hover:text-blue-600 cursor-pointer truncate transition max-w-[200px]"
                  title={item.file_name}
                >
                  {item.file_name}
                </h4>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200/80 whitespace-nowrap flex-shrink-0">
                  {item.target_model}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  onClick={handleCopyReport}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition whitespace-nowrap ${
                    copiedReport
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="复制完整分镜与光影分析报告"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{copiedReport ? t('card.copiedReport') : t('card.copyReport')}</span>
                </button>

                <button
                  onClick={() => onEdit(item)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition whitespace-nowrap"
                  title={t('card.editBtn')}
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('card.editBtn')}</span>
                </button>

                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-slate-200 transition flex-shrink-0"
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
                  className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-medium border border-purple-200 whitespace-nowrap"
                >
                  🎨 {s}
                </span>
              ))}
              {cameraDevice && (
                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[11px] font-medium border border-sky-200 truncate max-w-[180px]">
                  📷 {cameraDevice}
                </span>
              )}
              {item.execution_time_ms && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-mono border border-slate-200/60 whitespace-nowrap">
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
              <p className={`text-xs text-slate-100 select-all font-mono leading-relaxed ${isFlow ? 'line-clamp-3' : 'line-clamp-2'}`}>
                {item.positive_prompt}
              </p>
            </div>

            {/* Negative Prompt Box (if present and in list mode or when expanded) */}
            {item.negative_prompt && (!isFlow || isExpanded) && (
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

          {/* Expandable SKILL 6-Stage Details Accordion Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              {t('card.createdAt')}: {item.create_at}
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition"
            >
              <span>{isExpanded ? t('card.collapseReport') : t('card.expandReport')}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded 6-Stage Breakdown & Full Report Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-3 bg-slate-50/90 border-t border-slate-200 space-y-3 text-xs">
          {/* Header Switcher */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('report')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  viewMode === 'report'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t('card.viewReportMode')}</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  viewMode === 'cards'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t('card.viewCardsMode')}</span>
              </button>
            </div>

            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs border border-slate-200 transition font-medium"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReport ? t('card.copied') : t('card.copy')}</span>
            </button>
          </div>

          {viewMode === 'report' ? (
            /* Formatted text view exactly matching user prompt */
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs font-sans text-slate-800 space-y-4 leading-relaxed text-xs">
              <pre className="whitespace-pre-wrap font-sans text-[12px] text-slate-800 leading-relaxed select-all">
                {item.formatted_report || generateReportFromItem(item)}
              </pre>
            </div>
          ) : (
            /* Cards grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
      )}
    </div>
  );
};
