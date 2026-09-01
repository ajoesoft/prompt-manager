import React, { useState, useEffect } from 'react';
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
  LayoutGrid,
  Layers,
  Sliders,
  Eye,
  Camera,
  Film,
  Play,
  Loader2,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  ImageIcon,
  Wand2,
  RotateCcw,
  Save,
  X,
  Bot,
  SlidersHorizontal,
  CheckCheck
} from 'lucide-react';
import { HistoryItem, ModelPromptEntry, PromptModelTemplate, SkillResultJson } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface PromptResultCardProps {
  item: HistoryItem;
  projectName?: string;
  layoutMode?: 'list' | 'grid' | 'flow';
  promptTemplates?: PromptModelTemplate[];
  onEdit: (item: HistoryItem) => void;
  onSave?: (updatedItem: HistoryItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRerun: (item: HistoryItem) => void;
  onExecuteComfyUi?: (id: string) => void;
  onOpenElementReplacer?: (item: HistoryItem) => void;
  onReassemble?: (skillResult: SkillResultJson, targetModel: string) => { pos: string; neg: string };
}

// Available model options for quick switching
const AVAILABLE_MODELS = [
  { id: 'z-image-turbo', name: 'z-image-turbo', label: 'Z-Image Turbo', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'krea2-turbo', name: 'krea2-turbo', label: 'Krea-2 Turbo', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'qwen-image-2512', name: 'qwen-image-2512', label: 'Qwen-Image 2512', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'flux2', name: 'flux2', label: 'FLUX.2', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'ideogram-v4', name: 'ideogram-v4', label: 'Ideogram v4.0', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'stable-diffusion-3', name: 'stable-diffusion-3', label: 'SD 3.5', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const PromptResultCard: React.FC<PromptResultCardProps> = ({
  item,
  projectName,
  layoutMode = 'list',
  promptTemplates = [],
  onEdit,
  onSave,
  onDelete,
  onToggleFavorite,
  onRerun,
  onExecuteComfyUi,
  onOpenElementReplacer,
  onReassemble,
}) => {
  const { t } = useLanguage();
  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedModelPrompt, setCopiedModelPrompt] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'report' | 'cards' | 'models'>('report');
  const [activeModelTab, setActiveModelTab] = useState<string>(item.target_model || 'krea2-turbo');

  // Inline Quick-Edit State for Prompt & Model
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editPositive, setEditPositive] = useState(item.positive_prompt);
  const [editNegative, setEditNegative] = useState(item.negative_prompt);
  const [editTargetModel, setEditTargetModel] = useState(item.target_model);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize local edit state when item changes
  useEffect(() => {
    setEditPositive(item.positive_prompt);
    setEditNegative(item.negative_prompt);
    setEditTargetModel(item.target_model);
    setActiveModelTab(item.target_model);
  }, [item]);

  const s1Multi = item.skill_result_json.skill_01_multidim_classification;
  const s1Legacy = item.skill_result_json.skill_01_image_type;
  const s2 = item.skill_result_json.skill_02_image_style;
  const s3 = item.skill_result_json.skill_03_camera_param;
  const s4 = item.skill_result_json.skill_04_scene_content;
  const s5 = item.skill_result_json.skill_05_detail_desc;
  const s6 = item.skill_result_json.skill_06_prompt_generate;
  const s7Game = item.skill_result_json.skill_07_game_asset;
  const allModelPrompts = s6?.all_model_prompts as Record<string, ModelPromptEntry> | undefined;

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

  const handleCopySpecificModelPrompt = (promptText: string, modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(promptText);
    setCopiedModelPrompt(modelId);
    setTimeout(() => setCopiedModelPrompt(null), 1800);
  };

  // Re-assemble prompts for a given model
  const getReassembledForModel = (modelName: string): { pos: string; neg: string } => {
    // 1. Check all_model_prompts first
    if (allModelPrompts) {
      const match = Object.values(allModelPrompts).find(
        (m) =>
          m.model_name.toLowerCase() === modelName.toLowerCase() ||
          m.model_id.toLowerCase() === modelName.toLowerCase()
      );
      if (match) {
        return { pos: match.positive, neg: match.negative };
      }
    }
    // 2. Call onReassemble callback if provided
    if (onReassemble) {
      return onReassemble(item.skill_result_json, modelName);
    }
    return { pos: item.positive_prompt, neg: item.negative_prompt };
  };

  // Switch model directly from dropdown in card header
  const handleQuickSwitchModel = (newModel: string) => {
    const reassembled = getReassembledForModel(newModel);
    const updated: HistoryItem = {
      ...item,
      target_model: newModel,
      positive_prompt: reassembled.pos,
      negative_prompt: reassembled.neg,
    };
    if (onSave) {
      onSave(updated);
    }
    setEditTargetModel(newModel);
    setEditPositive(reassembled.pos);
    setEditNegative(reassembled.neg);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  // Inline prompt re-assemble in edit mode
  const handleInlineReassemble = () => {
    const reassembled = getReassembledForModel(editTargetModel);
    setEditPositive(reassembled.pos);
    setEditNegative(reassembled.neg);
  };

  // Save inline edits
  const handleSaveInlineEdit = () => {
    const updated: HistoryItem = {
      ...item,
      target_model: editTargetModel,
      positive_prompt: editPositive,
      negative_prompt: editNegative,
    };
    if (onSave) {
      onSave(updated);
    }
    setIsEditingPrompt(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1800);
  };

  // Apply a specific model prompt from the "各生图模型专有提示词" tab
  const handleApplyModelPromptAsActive = (entry: ModelPromptEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated: HistoryItem = {
      ...item,
      target_model: entry.model_name,
      positive_prompt: entry.positive,
      negative_prompt: entry.negative || '',
      generation_params: entry.suggested_params
        ? {
            cfg_scale: entry.suggested_params.cfg_scale,
            steps: entry.suggested_params.steps,
            sampler: entry.suggested_params.sampler,
          }
        : item.generation_params,
    };
    if (onSave) {
      onSave(updated);
    }
    setEditTargetModel(entry.model_name);
    setEditPositive(entry.positive);
    setEditNegative(entry.negative || '');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const generateReportFromItem = (it: HistoryItem): string => {
    const multi = it.skill_result_json.skill_01_multidim_classification;
    const legacy = it.skill_result_json.skill_01_image_type;
    const cam = it.skill_result_json.skill_03_camera_param;
    const sc = it.skill_result_json.skill_04_scene_content;

    const subContent = multi?.subject_content || legacy?.image_type || '人物';
    const medium = multi?.visual_medium || legacy?.sub_category || '照片写实';
    const world = multi?.genre_worldview || '现代都市';
    const comm = multi?.commercial_use || '商业人像';
    const comp = multi?.composition_camera || cam?.composition || '三分构图';
    const light = multi?.lighting_color || cam?.light || '柔和漫射光';
    const mood = multi?.mood_atmosphere || '静谧祥和';

    const camLight = cam?.light || '柔和漫射面光';
    const camTone = cam?.color_tone || '暖奶油主色调';
    const camDev = cam?.camera || 'ARRI Alexa Mini LF / Kodak Portra 800';
    const camComp = cam?.composition || '三分法 + 平视微仰角';
    const camFocal = cam?.lens_focal || '85mm f/1.4';

    const sub = sc?.subject || '核心主体描述';
    const bg = sc?.background || '背景环境描述';
    const act = sc?.action || '主体动作描述';
    const fg = sc?.foreground || '前景视线引导';
    const env = sc?.environment || '宏观世界观环境设定';

    return `【主体内容】: ${subContent}\n【媒介画风】: ${medium}\n【题材世界观】: ${world}\n【商业用途】: ${comm}\n【镜头构图】: ${comp}\n【光影色彩】: ${light}\n【氛围情绪】: ${mood}\n\n\n💡 灯光光质: ${camLight}\n🎨 画面色调: ${camTone}\n🎥 摄影器材: ${camDev}\n📐 构图机位: ${camComp}\n🔭 镜头焦段: ${camFocal}\n\n\n\n🎬 Subject（核心主体）\n${sub}\n\n🌄 Background（背景环境与远景建筑/气候）\n${bg}\n\n🌀 Action（主体的动态姿态与交互动作）\n${act}\n\n🖼️ Foreground（前景遮挡物或视线引导元素）\n${fg}\n\n🌍 Environment（宏观世界观环境设定）\n${env}\n\n最后结果。\n\n【Positive Prompt】\n${it.positive_prompt}\n\n【Negative Prompt】\n${it.negative_prompt}`;
  };

  const primaryLabel = s1Multi?.subject_content || s1Legacy?.image_type || '人物';
  const confidence = s1Multi?.confidence || s1Legacy?.confidence || 0.98;
  const styles = s2?.style || [];
  const cameraDevice = s3?.camera;
  const isFlow = layoutMode === 'flow' || layoutMode === 'grid';

  // Model list for select dropdown
  const modelOptions = promptTemplates && promptTemplates.length > 0
    ? promptTemplates.map((pt) => ({ id: pt.id, name: pt.model_name, label: pt.display_name }))
    : AVAILABLE_MODELS;

  return (
    <div className={`bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 group flex flex-col break-inside-avoid ${isFlow ? 'w-full mb-4 inline-block' : 'w-full'}`}>
      <div className={`p-4 flex flex-col ${isFlow ? 'space-y-3' : 'md:flex-row gap-4'}`}>
        {/* Thumbnail & Generated Output */}
        <div className={`flex flex-col gap-2 flex-shrink-0 ${isFlow ? 'w-full' : 'w-full md:w-48'}`}>
          <div className={`relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group-hover:border-slate-300 ${isFlow ? 'w-full' : 'w-full md:w-48 h-48'}`}>
            <img
              src={item.thumb_path}
              alt={item.file_name}
              className={`w-full ${isFlow ? 'h-auto block object-contain' : 'h-full object-cover'} transition duration-300 group-hover:scale-[1.02]`}
              loading="lazy"
            />

            {/* Top Overlays */}
            <div className="absolute top-2 left-2 flex items-center space-x-1">
              <span className="px-1.5 py-0.5 rounded bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-mono border border-slate-700/50">
                {primaryLabel.split(' ')[0]}
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

          {/* Generated Result Preview (if ComfyUI produced output) */}
          {item.execution_result?.output_images && item.execution_result.output_images.length > 0 && (
            <div className="relative rounded-lg overflow-hidden border-2 border-emerald-500 bg-slate-900">
              <img
                src={item.execution_result.output_images[0]}
                alt="ComfyUI Generated"
                className="w-full h-24 object-cover"
              />
              <span className="absolute bottom-1 right-1 text-[9px] bg-emerald-600/90 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                ComfyUI 渲染产物
              </span>
            </div>
          )}
        </div>

        {/* Right / Body Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
          {/* Header Row */}
          <div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 truncate flex-wrap">
                <h4
                  onClick={() => onEdit(item)}
                  className="font-semibold text-sm text-slate-900 hover:text-blue-600 cursor-pointer truncate transition max-w-[200px]"
                  title={item.file_name}
                >
                  {item.file_name}
                </h4>
                
                {/* Project Tag */}
                {(projectName || item.project_uuid) && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap flex items-center space-x-1">
                    <FolderKanban className="w-3 h-3" />
                    <span>{projectName || '项目'}</span>
                  </span>
                )}

                {/* Target Model Quick Switcher Dropdown */}
                <div className="relative inline-flex items-center">
                  <select
                    value={item.target_model}
                    onChange={(e) => handleQuickSwitchModel(e.target.value)}
                    className="text-xs pl-2.5 pr-6 py-0.5 rounded-full font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer appearance-none transition focus:outline-none focus:ring-1 focus:ring-blue-400"
                    title="点击可直接指定当前结果的输出模型并按此模型规范重组提示词"
                  >
                    {modelOptions.map((opt) => (
                      <option key={opt.id} value={opt.name}>
                        {opt.label || opt.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-blue-600 absolute right-2 pointer-events-none" />
                </div>

                {saveSuccess && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1 animate-pulse">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>已保存</span>
                  </span>
                )}

                {item.aspect_ratio && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                    📐 {item.aspect_ratio} ({item.dimensions ? `${item.dimensions.width}x${item.dimensions.height}` : ''})
                  </span>
                )}

                {/* ComfyUI Execution Status Badge */}
                {item.execution_status === 'executed' && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>已生成</span>
                  </span>
                )}
                {item.execution_status === 'running' && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-300 flex items-center space-x-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                    <span>生成中 {item.execution_progress ? `${item.execution_progress}%` : ''}</span>
                  </span>
                )}
                {item.execution_status === 'failed' && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1" title={item.execution_result?.error}>
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>生成失败</span>
                  </span>
                )}

                {item.output_language && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap flex-shrink-0">
                    {item.output_language === 'zh' ? '🇨🇳 中文' : '🇺🇸 EN'}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                {/* ComfyUI Execute Action */}
                {onExecuteComfyUi && (
                  <button
                    onClick={() => onExecuteComfyUi(item.id)}
                    disabled={item.execution_status === 'running' || item.execution_status === 'queued'}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition ${
                      item.execution_status === 'running' || item.execution_status === 'queued'
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : item.execution_status === 'executed'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                    title="发送此提示词到 ComfyUI REST API 生成图片"
                  >
                    {item.execution_status === 'running' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>运行中...</span>
                      </>
                    ) : item.execution_status === 'executed' ? (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>重新生图</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>ComfyUI 生图</span>
                      </>
                    )}
                  </button>
                )}

                {/* Inline Quick Edit Toggle Button */}
                <button
                  onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition whitespace-nowrap shadow-2xs ${
                    isEditingPrompt
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                  }`}
                  title="直接在卡片上快速修改正负提示词并指定输出模型"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingPrompt ? '收起编辑' : '修改提示词'}</span>
                </button>

                {/* Element Replacement & Style Transformer Button */}
                {onOpenElementReplacer && (
                  <button
                    onClick={() => onOpenElementReplacer(item)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 text-xs font-semibold border border-purple-200/80 transition whitespace-nowrap shadow-2xs group"
                    title="拆解画面要素（风格、类型、人物IP、背景、灯光、镜头等）并进行分别替换与风格重塑"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-purple-600 group-hover:rotate-12 transition-transform duration-200" />
                    <span>要素替换</span>
                  </button>
                )}

                <button
                  onClick={handleCopyReport}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition whitespace-nowrap ${
                    copiedReport
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="复制完整七维分类与分镜报告"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{copiedReport ? t('card.copiedReport') : t('card.copyReport')}</span>
                </button>

                <button
                  onClick={() => onEdit(item)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition whitespace-nowrap"
                  title="打开深度修改面板"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                  <span>详情</span>
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

            {/* Badges: 7D Tags, Styles & Camera */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {s1Multi?.genre_worldview && (
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200 whitespace-nowrap">
                  🌍 {s1Multi.genre_worldview.split(' ')[0]}
                </span>
              )}
              {s1Multi?.commercial_use && (
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200 whitespace-nowrap">
                  💼 {s1Multi.commercial_use.split(' ')[0]}
                </span>
              )}
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

          {/* Prompt Section: Displays either Live Read-only View or Inline Edit Mode */}
          {!isEditingPrompt ? (
            <div className="space-y-2">
              {/* Positive Prompt Box */}
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 relative shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                  <span className="text-blue-300 font-semibold flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('card.positivePrompt')} ({item.target_model})</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsEditingPrompt(true)}
                      className="text-[11px] text-blue-300 hover:text-white flex items-center space-x-1 hover:underline transition"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>快速修改</span>
                    </button>
                    <button
                      onClick={handleCopyPositive}
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-sans transition ${
                        copiedPos
                          ? 'bg-emerald-500/30 text-emerald-300 font-medium'
                          : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {copiedPos ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPos ? t('card.copied') : t('card.copy')}</span>
                    </button>
                  </div>
                </div>
                <p className={`text-xs text-slate-100 select-all font-mono leading-relaxed ${isFlow ? 'line-clamp-3' : 'line-clamp-2'}`}>
                  {item.positive_prompt}
                </p>
              </div>

              {/* Negative Prompt Box */}
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
          ) : (
            /* ==========================================================
               INLINE PROMPT & MODEL SPECIFICATION EDITOR
               ========================================================== */
            <div className="p-3.5 bg-slate-50 rounded-xl border-2 border-blue-500/80 shadow-md space-y-3 animate-in fade-in duration-150">
              {/* Output Model Selector & Reassemble Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">指定输出模型:</span>
                  <select
                    value={editTargetModel}
                    onChange={(e) => {
                      const newM = e.target.value;
                      setEditTargetModel(newM);
                      const autoReassembled = getReassembledForModel(newM);
                      setEditPositive(autoReassembled.pos);
                      setEditNegative(autoReassembled.neg);
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-blue-700 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
                  >
                    {modelOptions.map((opt) => (
                      <option key={opt.id} value={opt.name}>
                        {opt.label || opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleInlineReassemble}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-2xs transition"
                  title="按选定模型的语法规范，重新根据画面 7 维特征组装提示词"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>按模型重组提示词</span>
                </button>
              </div>

              {/* Editable Positive Prompt */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-800 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>正向提示词 (Positive Prompt)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {editPositive.length} 字符
                  </span>
                </div>
                <textarea
                  value={editPositive}
                  onChange={(e) => setEditPositive(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 leading-relaxed shadow-2xs"
                  placeholder="输入正向提示词..."
                />
              </div>

              {/* Editable Negative Prompt */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-rose-700 flex items-center space-x-1">
                    <span>负向提示词 (Negative Prompt)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {editNegative.length} 字符
                  </span>
                </div>
                <textarea
                  value={editNegative}
                  onChange={(e) => setEditNegative(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 leading-relaxed shadow-2xs"
                  placeholder="输入负向提示词（可留空）..."
                />
              </div>

              {/* Save & Cancel Actions */}
              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditPositive(item.positive_prompt);
                    setEditNegative(item.negative_prompt);
                    setEditTargetModel(item.target_model);
                    setIsEditingPrompt(false);
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>取消</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveInlineEdit}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>保存修改</span>
                </button>
              </div>
            </div>
          )}

          {/* Expandable SKILL Details Accordion Toggle */}
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

      {/* Expanded 7-Stage Breakdown & Multi-Model Suite */}
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
                <span>完整分析报告</span>
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
                <span>七维矩阵与分镜</span>
              </button>
              {allModelPrompts && Object.keys(allModelPrompts).length > 0 && (
                <button
                  onClick={() => setViewMode('models')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    viewMode === 'models'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>各生图模型专有提示词 ({Object.keys(allModelPrompts).length})</span>
                </button>
              )}
            </div>

            <button
              onClick={handleCopyReport}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs border border-slate-200 transition font-medium"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReport ? t('card.copied') : t('card.copy')}</span>
            </button>
          </div>

          {viewMode === 'report' && (
            /* Formatted text view matching specification */
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs font-sans text-slate-800 space-y-4 leading-relaxed text-xs">
              <pre className="whitespace-pre-wrap font-sans text-[12px] text-slate-800 leading-relaxed select-all">
                {item.formatted_report || generateReportFromItem(item)}
              </pre>
            </div>
          )}

          {viewMode === 'cards' && (
            /* Cards grid */
            <div className={`grid grid-cols-1 md:grid-cols-2 ${s7Game ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3`}>
              {/* Stage 1: 7-Dimensional Taxonomy Matrix */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="font-semibold text-slate-800 text-[11px] flex items-center justify-between text-sky-700">
                  <span className="flex items-center space-x-1">
                    <Sliders className="w-3.5 h-3.5 text-sky-600" />
                    <span>图像七维正交多维度分类</span>
                  </span>
                  <span className="text-[10px] text-sky-500 font-mono">Stage 1</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="text-slate-700"><span className="text-slate-400">1. 主体内容:</span> {s1Multi?.subject_content || primaryLabel}</div>
                  <div className="text-slate-700"><span className="text-slate-400">2. 媒介画风:</span> {s1Multi?.visual_medium || s2?.medium || '照片写实'}</div>
                  <div className="text-slate-700"><span className="text-slate-400">3. 题材世界观:</span> {s1Multi?.genre_worldview || '现代都市'}</div>
                  <div className="text-slate-700"><span className="text-slate-400">4. 商业用途:</span> {s1Multi?.commercial_use || '商业人像/摄影'}</div>
                  <div className="text-slate-700"><span className="text-slate-400">5. 构图镜头:</span> {s1Multi?.composition_camera || s3?.composition || '三分构图'}</div>
                  <div className="text-slate-700"><span className="text-slate-400">6. 光影色彩:</span> {s1Multi?.lighting_color || s3?.light || '柔光漫射'}</div>
                  <div className="text-slate-700"><span className="text-slate-400">7. 情绪氛围:</span> {s1Multi?.mood_atmosphere || s2?.visual_mood || '静谧优雅'}</div>
                </div>
              </div>

              {/* Stage 3 & 4: Lighting, Camera & 5D Storyboard */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="font-semibold text-slate-800 text-[11px] flex items-center justify-between text-purple-700">
                  <span className="flex items-center space-x-1">
                    <Camera className="w-3.5 h-3.5 text-purple-600" />
                    <span>光影参数与五维分镜</span>
                  </span>
                  <span className="text-[10px] text-purple-500 font-mono">Stage 3 & 4</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="text-slate-700 truncate"><span className="text-slate-400">💡 光质:</span> {s3?.light || '柔和漫射面光'}</div>
                  <div className="text-slate-700 truncate"><span className="text-slate-400">🎨 色调:</span> {s3?.color_tone || '暖奶油莫兰迪'}</div>
                  <div className="text-slate-700 truncate"><span className="text-slate-400">🎥 器材:</span> {s3?.camera || 'ARRI Alexa Mini LF'}</div>
                  <div className="text-slate-700 truncate"><span className="text-slate-400">🎬 主体:</span> {s4?.subject || '年轻金发女性'}</div>
                  <div className="text-slate-700 truncate"><span className="text-slate-400">🌄 背景:</span> {s4?.background || '暖黄色虚化背景'}</div>
                  <div className="text-slate-700 truncate"><span className="text-slate-400">🌀 动作:</span> {s4?.action || '静默凝视前方'}</div>
                </div>
              </div>

              {/* Stage 6: Game Asset Reverse-Engineering */}
              {s7Game && (
                <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="font-semibold text-slate-800 text-[11px] flex items-center justify-between text-amber-700">
                    <span className="flex items-center space-x-1">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      <span>游戏资源与资产反推</span>
                    </span>
                    <span className="text-[10px] text-amber-500 font-mono">Skill 07</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-slate-700 truncate"><span className="text-slate-400">🎮 类别:</span> {s7Game.asset_category_zh}</div>
                    <div className="text-slate-700 truncate"><span className="text-slate-400">⚙️ 引擎:</span> {s7Game.engine_target}</div>
                    <div className="text-slate-700 truncate"><span className="text-slate-400">📐 视角:</span> {s7Game.perspective_view}</div>
                    <div className="text-slate-700 truncate"><span className="text-slate-400">🎨 美术:</span> {s7Game.art_style}</div>
                    <div className="text-slate-700 truncate"><span className="text-slate-400">🖼️ 背景:</span> {s7Game.background_treatment}</div>
                    <div className="text-slate-700 truncate"><span className="text-slate-400">✨ 修饰:</span> {s7Game.prompt_modifiers}</div>
                  </div>
                </div>
              )}

              {/* Stage 5 & Final: Details & Suggested Params */}
              <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="font-semibold text-slate-800 text-[11px] flex items-center justify-between text-emerald-700">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>微观细节与模型调优参数</span>
                  </span>
                  <span className="text-[10px] text-emerald-500 font-mono">Stage 5 & Prompt</span>
                </div>
                <div className="text-slate-700 text-[11px] line-clamp-2">
                  <span className="text-slate-400">🔬 微观细节:</span> {s5?.detail || '皮肤质感通透，毛孔微小肌理可见'}
                </div>
                <div className="text-slate-700 text-[11px] truncate">
                  <span className="text-slate-400">🎭 情绪张力:</span> {s5?.emotion || '沉静忧郁，内敛专注'}
                </div>
                {s6?.suggested_params && (
                  <div className="text-slate-700 text-[10px] font-mono bg-slate-100 p-1.5 rounded border border-slate-200">
                    CFG: {s6.suggested_params.cfg_scale || 7.0} · Steps: {s6.suggested_params.steps || 30} · Sampler: {s6.suggested_params.sampler || 'Euler'} · AR: {s6.suggested_params.aspect_ratio || '16:9'}
                  </div>
                )}
              </div>
            </div>
          )}

          {viewMode === 'models' && allModelPrompts && (
            /* Multi-model prompt list */
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
                {Object.values(allModelPrompts).map((m) => (
                  <button
                    key={m.model_id}
                    onClick={() => setActiveModelTab(m.model_name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                      activeModelTab === m.model_name
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{m.model_name}</span>
                    {item.target_model === m.model_name && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="当前激活模型" />
                    )}
                  </button>
                ))}
              </div>

              {(() => {
                const currentEntry =
                  Object.values(allModelPrompts).find((m) => m.model_name === activeModelTab) ||
                  Object.values(allModelPrompts)[0];
                if (!currentEntry) return null;

                const isCurrentActive = item.target_model === currentEntry.model_name;

                return (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800 text-xs">{currentEntry.display_name}</span>
                        {currentEntry.suggested_params && (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            CFG {currentEntry.suggested_params.cfg_scale} · Steps {currentEntry.suggested_params.steps} · {currentEntry.suggested_params.sampler}
                          </span>
                        )}
                        {isCurrentActive && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            ✓ 当前激活输出模型
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {/* Set As Active Model & Prompt Button */}
                        {!isCurrentActive && (
                          <button
                            onClick={(e) => handleApplyModelPromptAsActive(currentEntry, e)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-xs transition"
                            title="将此模型的提示词与参数直接设为此条目的最终输出结果"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>设为当前结果最终提示词</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => handleCopySpecificModelPrompt(currentEntry.positive, currentEntry.model_id, e)}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition font-medium"
                        >
                          {copiedModelPrompt === currentEntry.model_id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedModelPrompt === currentEntry.model_id ? '已复制' : '复制正向词'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-2.5 font-mono text-[11px] text-slate-100 select-all leading-relaxed">
                      {currentEntry.positive}
                    </div>

                    {currentEntry.negative && (
                      <div className="bg-slate-50 rounded-lg p-2 font-mono text-[11px] text-slate-600 select-all border border-slate-200">
                        <span className="text-slate-400 mr-1">Negative:</span>
                        {currentEntry.negative}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
