import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  Camera,
  Palette,
  Layers,
  Sliders,
  Eye,
  Bot,
  Tag,
  CheckCircle2,
  Wand2,
  Zap,
  Sun,
  User,
  Image as ImageIcon,
  Aperture,
  Frame,
  Type,
  ShieldAlert
} from 'lucide-react';
import { HistoryItem, PromptModelTemplate, SkillResultJson } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import {
  PROMPT_ELEMENT_CATEGORIES,
  QUICK_STYLE_PRESETS,
  PromptElementState,
  extractElementStateFromItem,
  reconstructPromptFromElements,
  ElementOption,
  cleanPromptString
} from '../utils/promptElementReplacer';

interface EditPromptDialogProps {
  item: HistoryItem | null;
  promptTemplates: PromptModelTemplate[];
  onSave: (updatedItem: HistoryItem) => void;
  onClose: () => void;
  onReassemble: (skillResult: SkillResultJson, targetModel: string) => { pos: string; neg: string };
}

export const EditPromptDialog: React.FC<EditPromptDialogProps> = ({
  item,
  promptTemplates,
  onSave,
  onClose,
  onReassemble,
}) => {
  const { t } = useLanguage();
  if (!item) return null;

  const [activeTab, setActiveTab] = useState<'report' | 'elements' | 'stage6' | 'stage7' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5'>('elements');
  const [targetModel, setTargetModel] = useState<string>(item.target_model);
  const [positivePrompt, setPositivePrompt] = useState<string>(item.positive_prompt);
  const [negativePrompt, setNegativePrompt] = useState<string>(item.negative_prompt);
  const [formattedReport, setFormattedReport] = useState<string>(item.formatted_report || '');
  const [notes, setNotes] = useState<string>(item.notes || '');

  // Cloned editable skill result
  const [skillJson, setSkillJson] = useState<SkillResultJson>(() => JSON.parse(JSON.stringify(item.skill_result_json)));

  // Element replacer active category inside dialog
  const [activeElementCategory, setActiveElementCategory] = useState<string>('style');
  const [elementState, setElementState] = useState<PromptElementState>(() => extractElementStateFromItem(item));

  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);
  const [copiedRep, setCopiedRep] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setTargetModel(item.target_model);
    setPositivePrompt(item.positive_prompt);
    setNegativePrompt(item.negative_prompt);
    setFormattedReport(item.formatted_report || '');
    setNotes(item.notes || '');
    setSkillJson(JSON.parse(JSON.stringify(item.skill_result_json)));
    setElementState(extractElementStateFromItem(item));
  }, [item]);

  // When an element preset or value changes, reassemble and sync
  const handleApplyElementChange = (fieldKey: keyof PromptElementState, value: string, negAdd?: string) => {
    const updatedState = { ...elementState, [fieldKey]: value };
    if (negAdd && !updatedState.negativePreset.includes(negAdd)) {
      updatedState.negativePreset = cleanPromptString(
        `${updatedState.negativePreset ? updatedState.negativePreset + ', ' : ''}${negAdd}`
      );
    }
    setElementState(updatedState);

    const reassembled = reconstructPromptFromElements(updatedState, promptTemplates);
    setPositivePrompt(reassembled.positivePrompt);
    setNegativePrompt(reassembled.negativePrompt);
    setTargetModel(reassembled.targetModel);

    // Sync to skillJson
    const nextJson: SkillResultJson = JSON.parse(JSON.stringify(skillJson));
    if (fieldKey === 'style') {
      if (!nextJson.skill_02_image_style) nextJson.skill_02_image_style = { style: [value], style_weight: [1.0] };
      else nextJson.skill_02_image_style.style = [value];
    } else if (fieldKey === 'lighting' || fieldKey === 'camera' || fieldKey === 'lens' || fieldKey === 'composition') {
      if (!nextJson.skill_03_camera_param) {
        nextJson.skill_03_camera_param = {
          light: updatedState.lighting,
          camera: updatedState.camera,
          lens_focal: updatedState.lens,
          composition: updatedState.composition,
          color_tone: '',
        };
      } else {
        nextJson.skill_03_camera_param.light = updatedState.lighting;
        nextJson.skill_03_camera_param.camera = updatedState.camera;
        nextJson.skill_03_camera_param.lens_focal = updatedState.lens;
        nextJson.skill_03_camera_param.composition = updatedState.composition;
      }
    } else if (fieldKey === 'subject' || fieldKey === 'background') {
      if (!nextJson.skill_04_scene_content) nextJson.skill_04_scene_content = { subject: updatedState.subject, background: updatedState.background, action: '' };
      else {
        nextJson.skill_04_scene_content.subject = updatedState.subject;
        nextJson.skill_04_scene_content.background = updatedState.background;
      }
    }
    setSkillJson(nextJson);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Palette': return <Palette className="w-3.5 h-3.5" />;
      case 'Layers': return <Layers className="w-3.5 h-3.5" />;
      case 'User': return <User className="w-3.5 h-3.5" />;
      case 'Image': return <ImageIcon className="w-3.5 h-3.5" />;
      case 'Sun': return <Sun className="w-3.5 h-3.5" />;
      case 'Frame': return <Frame className="w-3.5 h-3.5" />;
      case 'Camera': return <Camera className="w-3.5 h-3.5" />;
      case 'Aperture': return <Aperture className="w-3.5 h-3.5" />;
      case 'Sliders': return <Sliders className="w-3.5 h-3.5" />;
      case 'Type': return <Type className="w-3.5 h-3.5" />;
      case 'Sparkles': return <Sparkles className="w-3.5 h-3.5" />;
      case 'Bot': return <Bot className="w-3.5 h-3.5" />;
      case 'ShieldAlert': return <ShieldAlert className="w-3.5 h-3.5" />;
      default: return <Palette className="w-3.5 h-3.5" />;
    }
  };

  // Quick preset application inside dialog
  const handleApplyQuickPresetInDialog = (presetId: string) => {
    const preset = QUICK_STYLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const nextState = {
      ...elementState,
      ...preset.targetElements,
      targetModel: preset.suggestedModel || elementState.targetModel,
    };
    setElementState(nextState);

    const reassembled = reconstructPromptFromElements(nextState, promptTemplates);
    setPositivePrompt(reassembled.positivePrompt);
    setNegativePrompt(reassembled.negativePrompt);
    setTargetModel(reassembled.targetModel);
  };

  // When target model changes, offer to auto re-assemble
  const handleModelChange = (newModel: string) => {
    setTargetModel(newModel);
    const assembled = onReassemble(skillJson, newModel);
    setPositivePrompt(assembled.pos);
    setNegativePrompt(assembled.neg);
  };

  const handleManualReassemble = () => {
    const assembled = onReassemble(skillJson, targetModel);
    setPositivePrompt(assembled.pos);
    setNegativePrompt(assembled.neg);
  };

  const handleCopyPositive = () => {
    navigator.clipboard.writeText(positivePrompt);
    setCopiedPos(true);
    setTimeout(() => setCopiedPos(false), 1800);
  };

  const handleCopyNegative = () => {
    navigator.clipboard.writeText(negativePrompt);
    setCopiedNeg(true);
    setTimeout(() => setCopiedNeg(false), 1800);
  };

  const handleSave = () => {
    const updated: HistoryItem = {
      ...item,
      target_model: targetModel,
      positive_prompt: positivePrompt,
      negative_prompt: negativePrompt,
      formatted_report: formattedReport,
      notes: notes,
      skill_result_json: skillJson,
    };
    onSave(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                {t('editDialog.title')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t('editDialog.fileLabel')}: {item.file_name} · {t('editDialog.createdLabel')} {item.create_at} {item.output_language && `· ${item.output_language === 'zh' ? '🇨🇳 中文' : '🇺🇸 English'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{t('editDialog.savedSqlite')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('editDialog.saveChanges')}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Preview Column (4 cols) */}
          <div className="lg:col-span-4 p-4 bg-slate-50/60 border-r border-slate-200 flex flex-col space-y-4 overflow-y-auto">
            {/* Image Box */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-2 shadow-2xs">
              <img
                src={item.thumb_path}
                alt={item.file_name}
                className="w-full max-h-72 object-contain rounded-lg"
              />
            </div>

            {/* Meta stats */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs shadow-2xs">
              <div className="font-semibold text-slate-800 text-xs flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('editDialog.originalMeta')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>{t('editDialog.fileSize')}: {item.file_size_kb} KB</div>
                <div>{t('editDialog.inferTime')}: {item.execution_time_ms || 1800} ms</div>
                <div>{t('editDialog.confidence')}: {(Number(skillJson.skill_01_image_type?.confidence || 0.95) * 100).toFixed(0)}%</div>
                <div>{t('editDialog.format')}: PNG/RGB 1024px</div>
              </div>
            </div>

            {/* Notes input */}
            <div className="space-y-1 text-xs">
              <label className="text-slate-600 font-medium text-[11px]">{t('editDialog.customNotes')}:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('editDialog.notesPlaceholder')}
                className="w-full h-20 p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none shadow-2xs"
              />
            </div>
          </div>

          {/* Right Editor Tabs Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-full bg-white">
            {/* Stage Tabs Navigation */}
            <div className="flex items-center space-x-1.5 p-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab('elements')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1 ${
                  activeTab === 'elements'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                    : 'text-purple-700 bg-purple-50/60 hover:bg-purple-100/70 border border-purple-200/60'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>✨ 要素拆解与替换</span>
              </button>

              <button
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'report'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                📋 {t('editDialog.tabReport')}
              </button>

              <button
                onClick={() => setActiveTab('stage6')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage6'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                🎯 最终提示词与输出模型
              </button>

              <button
                onClick={() => setActiveTab('stage7')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage7'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                🎮 游戏资产反推
              </button>

              <button
                onClick={() => setActiveTab('stage1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage1'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                📷 {t('editDialog.tabStage1')}
              </button>

              <button
                onClick={() => setActiveTab('stage2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage2'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                🎨 {t('editDialog.tabStage2')}
              </button>

              <button
                onClick={() => setActiveTab('stage3')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage3'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                💡 {t('editDialog.tabStage3')}
              </button>

              <button
                onClick={() => setActiveTab('stage4')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage4'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                🎬 {t('editDialog.tabStage4')}
              </button>

              <button
                onClick={() => setActiveTab('stage5')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage5'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                🔍 {t('editDialog.tabStage5')}
              </button>
            </div>

            {/* Tab Panes */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB 0: GRANULAR ELEMENT REPLACER & STYLE RESTRUCTURING */}
              {activeTab === 'elements' && (
                <div className="space-y-4">
                  {/* Quick Style Presets Carousel */}
                  <div className="p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-xl border border-purple-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                        <Zap className="w-3.5 h-3.5 text-purple-600" />
                        <span>一键全套风格快速重塑 (One-Click Style Transformer)</span>
                      </span>
                      <span className="text-[11px] text-purple-600 font-medium">点击即可将当前画面全部要素一键重组</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {QUICK_STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleApplyQuickPresetInDialog(preset.id)}
                          className="flex flex-col items-center text-center p-2 rounded-lg bg-white/90 hover:bg-white border border-purple-200/70 hover:border-purple-400 shadow-2xs hover:shadow-xs transition group"
                        >
                          <span className="text-base mb-0.5 group-hover:scale-110 transition-transform">{preset.icon}</span>
                          <span className="text-xs font-bold text-slate-800">{preset.nameZh}</span>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{preset.descriptionZh}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Two-Column Element Granular Replacer */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                    {/* Left 4 cols: Category Selector */}
                    <div className="md:col-span-4 space-y-1 pr-1 border-r border-slate-200">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                        画面要素分类 ({PROMPT_ELEMENT_CATEGORIES.length})
                      </div>
                      <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
                        {PROMPT_ELEMENT_CATEGORIES.map((cat) => {
                          const isCatActive = activeElementCategory === cat.id;
                          const currentVal = (elementState as Record<string, string>)[cat.fieldKey];
                          return (
                            <button
                              key={cat.id}
                              onClick={() => setActiveElementCategory(cat.id)}
                              className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                                isCatActive
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span>{getCategoryIcon(cat.iconName)}</span>
                                <span className="font-semibold">{cat.titleZh}</span>
                              </div>
                              {currentVal && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded truncate max-w-[80px] font-mono ${
                                    isCatActive ? 'bg-purple-700 text-purple-100' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {currentVal}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right 8 cols: Category Options & Custom Value */}
                    <div className="md:col-span-8 space-y-3 pl-1">
                      {(() => {
                        const currentCat =
                          PROMPT_ELEMENT_CATEGORIES.find((c) => c.id === activeElementCategory) ||
                          PROMPT_ELEMENT_CATEGORIES[0];
                        const currentFieldKey = currentCat.fieldKey as keyof PromptElementState;
                        const currentValue = elementState[currentFieldKey] || '';

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                                  {getCategoryIcon(currentCat.iconName)}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800">{currentCat.titleZh}要素替换</h4>
                                  <p className="text-[11px] text-slate-500">{currentCat.descriptionZh}</p>
                                </div>
                              </div>
                              <span className="text-[11px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                字段: {currentCat.fieldKey}
                              </span>
                            </div>

                            {/* Preset Options Grid */}
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-semibold text-slate-600">可选预设样式 / 常用词条:</div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                                {currentCat.options.map((opt) => {
                                  const isSelected =
                                    currentValue === opt.valuePrompt || (opt.valueZh && currentValue === opt.valueZh);
                                  return (
                                    <button
                                      key={opt.id}
                                      onClick={() =>
                                        handleApplyElementChange(
                                          currentFieldKey,
                                          opt.valuePrompt || opt.valueZh || '',
                                          opt.negativePromptAdd
                                        )
                                      }
                                      className={`p-2 rounded-lg text-left text-xs transition border flex flex-col justify-between ${
                                        isSelected
                                          ? 'bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-500/20 font-bold'
                                          : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200 text-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="truncate">{opt.labelZh}</span>
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-mono truncate mt-1">
                                        {opt.valuePrompt}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Custom Input for this element */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                                <span>自定义输入该要素内容 (English / 中文):</span>
                                <span className="text-[10px] text-slate-400 font-mono">实时同步组装</span>
                              </label>
                              <input
                                type="text"
                                value={currentValue}
                                onChange={(e) =>
                                  handleApplyElementChange(currentFieldKey, e.target.value)
                                }
                                placeholder={`输入自定义 ${currentCat.titleZh} 描述...`}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Realtime Reconstructed Prompt Preview */}
                  <div className="p-4 bg-slate-900 rounded-xl text-slate-100 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-white">✨ 要素替换后实时生成提示词</span>
                        <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 font-mono">
                          {targetModel}
                        </span>
                      </div>
                      <button
                        onClick={handleCopyPositive}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                      >
                        {copiedPos ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPos ? '已复制' : '复制正向词'}</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-purple-300 font-mono font-semibold">Positive Prompt (正向提示词):</div>
                      <p className="text-xs text-slate-200 font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800 leading-relaxed max-h-28 overflow-y-auto select-text">
                        {positivePrompt}
                      </p>
                    </div>

                    {negativePrompt && (
                      <div className="space-y-1">
                        <div className="text-[11px] text-rose-300 font-mono font-semibold">Negative Prompt (反向提示词):</div>
                        <p className="text-xs text-slate-300 font-mono bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 leading-relaxed max-h-20 overflow-y-auto select-text">
                          {negativePrompt}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB REPORT: COMPLETE VISUAL REPORT */}
              {activeTab === 'report' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-700 font-semibold">
                      全阶段链式视觉分镜与光影参数分析报告（支持直接编辑与复制）
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(formattedReport);
                        setCopiedRep(true);
                        setTimeout(() => setCopiedRep(false), 1800);
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-blue-700 text-xs font-medium border border-slate-200 shadow-2xs transition"
                    >
                      {copiedRep ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRep ? '已复制报告' : '复制分镜文本'}</span>
                    </button>
                  </div>

                  <textarea
                    value={formattedReport}
                    onChange={(e) => setFormattedReport(e.target.value)}
                    rows={18}
                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-900 text-slate-100 font-sans text-xs leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none font-mono"
                    placeholder="完整分镜与光影分析报告内容..."
                  />
                </div>
              )}

              {/* TAB 6: PROMPT GENERATION & MODEL SPECIFICATION */}
              {activeTab === 'stage6' && (
                <div className="space-y-4">
                  {/* Model Quick Switcher Pills */}
                  <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-slate-50 rounded-xl border border-blue-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">指定输出模型体系:</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        当前: <strong className="text-blue-700 font-mono">{targetModel}</strong>
                      </span>
                    </div>

                    {/* Quick Model Selector Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                      {[
                        { id: 'z-image-turbo', name: 'z-image-turbo', label: 'Z-Image Turbo', tag: '极致极速' },
                        { id: 'krea2-turbo', name: 'krea2-turbo', label: 'Krea-2 Turbo', tag: '实时流式' },
                        { id: 'qwen-image-2512', name: 'qwen-image-2512', label: 'Qwen-Image 2512', tag: '通义万相' },
                        { id: 'flux2', name: 'flux2', label: 'FLUX.2', tag: '自然语言' },
                        { id: 'ideogram-v4', name: 'ideogram-v4', label: 'Ideogram v4.0', tag: '文字海报' },
                        { id: 'stable-diffusion-3', name: 'stable-diffusion-3', label: 'SD 3.5', tag: 'T5长文本' },
                      ].map((m) => {
                        const isSelected = targetModel.toLowerCase() === m.name.toLowerCase();
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleModelChange(m.name)}
                            className={`p-2 rounded-lg text-left transition flex flex-col justify-between border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-white hover:bg-blue-50/50 text-slate-700 border-slate-200 shadow-2xs'
                            }`}
                          >
                            <span className="text-[11px] font-bold truncate">{m.label}</span>
                            <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                              {m.tag}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Dropdown & Re-assemble toolbar */}
                    <div className="flex items-center justify-between pt-1 border-t border-blue-100/60 flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-600 font-medium">更多模型模版:</span>
                        <select
                          value={targetModel}
                          onChange={(e) => handleModelChange(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-blue-700 font-bold focus:outline-none focus:border-blue-500 shadow-2xs"
                        >
                          {promptTemplates.map((t) => (
                            <option key={t.id} value={t.model_name}>
                              {t.display_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleManualReassemble}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-blue-700 text-xs font-semibold border border-slate-300 shadow-2xs transition"
                        title={t('editDialog.reassembleTip')}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('editDialog.reassembleBtn')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Positive Prompt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-800 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>{t('editDialog.positivePromptTitle')}</span>
                        <span className="text-[11px] font-mono text-slate-400">({positivePrompt.length} 字符)</span>
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setPositivePrompt('')}
                          className="px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                          清空
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyPositive}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          {copiedPos ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPos ? t('editDialog.copied') : t('editDialog.copyPositive')}</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={positivePrompt}
                      onChange={(e) => setPositivePrompt(e.target.value)}
                      rows={6}
                      className="w-full p-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 leading-relaxed shadow-2xs transition"
                      placeholder="输入正向生图提示词..."
                    />
                  </div>

                  {/* Negative Prompt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-rose-700 flex items-center space-x-1.5">
                        <span>{t('editDialog.negativePromptTitle')}</span>
                        <span className="text-[11px] font-mono text-slate-400">({negativePrompt.length} 字符)</span>
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setNegativePrompt('')}
                          className="px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                          清空
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyNegative}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                        >
                          {copiedNeg ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedNeg ? t('editDialog.copied') : t('editDialog.copyNegative')}</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 leading-relaxed shadow-2xs transition"
                      placeholder="输入负向生图提示词..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 7: GAME ASSET REVERSE ENGINEERING */}
              {activeTab === 'stage7' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                    <div className="font-bold flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-amber-700" />
                      <span>Skill 07 游戏资源与资产反推设定</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      专门针对游戏开发资产（角色立绘、武器道具、UI图标、场景贴图、概念设计）的结构化反推与精准提示词修饰。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">资产类别 (中文):</label>
                      <input
                        type="text"
                        value={skillJson.skill_07_game_asset?.asset_category_zh || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_07_game_asset: {
                              asset_category: prev.skill_07_game_asset?.asset_category || 'weapon_equipment',
                              asset_category_zh: e.target.value,
                              engine_target: prev.skill_07_game_asset?.engine_target || 'Unreal Engine 5',
                              perspective_view: prev.skill_07_game_asset?.perspective_view || 'isometric 3D view',
                              art_style: prev.skill_07_game_asset?.art_style || 'stylized hand-painted PBR',
                              background_treatment: prev.skill_07_game_asset?.background_treatment || 'solid neutral background',
                              prompt_modifiers: prev.skill_07_game_asset?.prompt_modifiers || '',
                              asset_naming_slug: prev.skill_07_game_asset?.asset_naming_slug || 'game_asset',
                            },
                          }))
                        }
                        placeholder="例如: 武器道具 / 史诗双手大剑"
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">目标游戏引擎 (Engine Target):</label>
                      <input
                        type="text"
                        value={skillJson.skill_07_game_asset?.engine_target || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_07_game_asset: {
                              asset_category: prev.skill_07_game_asset?.asset_category || 'weapon_equipment',
                              asset_category_zh: prev.skill_07_game_asset?.asset_category_zh || '游戏资产',
                              engine_target: e.target.value,
                              perspective_view: prev.skill_07_game_asset?.perspective_view || 'isometric 3D view',
                              art_style: prev.skill_07_game_asset?.art_style || 'stylized hand-painted PBR',
                              background_treatment: prev.skill_07_game_asset?.background_treatment || 'solid neutral background',
                              prompt_modifiers: prev.skill_07_game_asset?.prompt_modifiers || '',
                              asset_naming_slug: prev.skill_07_game_asset?.asset_naming_slug || 'game_asset',
                            },
                          }))
                        }
                        placeholder="例如: Unreal Engine 5, Unity URP, Cocos"
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">透视视角 (Perspective View):</label>
                      <input
                        type="text"
                        value={skillJson.skill_07_game_asset?.perspective_view || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_07_game_asset: {
                              asset_category: prev.skill_07_game_asset?.asset_category || 'weapon_equipment',
                              asset_category_zh: prev.skill_07_game_asset?.asset_category_zh || '游戏资产',
                              engine_target: prev.skill_07_game_asset?.engine_target || 'Unreal Engine 5',
                              perspective_view: e.target.value,
                              art_style: prev.skill_07_game_asset?.art_style || 'stylized hand-painted PBR',
                              background_treatment: prev.skill_07_game_asset?.background_treatment || 'solid neutral background',
                              prompt_modifiers: prev.skill_07_game_asset?.prompt_modifiers || '',
                              asset_naming_slug: prev.skill_07_game_asset?.asset_naming_slug || 'game_asset',
                            },
                          }))
                        }
                        placeholder="例如: isometric 3D view, front ortho, three-quarter view"
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">美术风格渲染 (Art Style):</label>
                      <input
                        type="text"
                        value={skillJson.skill_07_game_asset?.art_style || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_07_game_asset: {
                              asset_category: prev.skill_07_game_asset?.asset_category || 'weapon_equipment',
                              asset_category_zh: prev.skill_07_game_asset?.asset_category_zh || '游戏资产',
                              engine_target: prev.skill_07_game_asset?.engine_target || 'Unreal Engine 5',
                              perspective_view: prev.skill_07_game_asset?.perspective_view || 'isometric 3D view',
                              art_style: e.target.value,
                              background_treatment: prev.skill_07_game_asset?.background_treatment || 'solid neutral background',
                              prompt_modifiers: prev.skill_07_game_asset?.prompt_modifiers || '',
                              asset_naming_slug: prev.skill_07_game_asset?.asset_naming_slug || 'game_asset',
                            },
                          }))
                        }
                        placeholder="例如: stylized hand-painted PBR, Genshin anime cel-shaded"
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">背景处理规范 (Background Treatment):</label>
                    <input
                      type="text"
                      value={skillJson.skill_07_game_asset?.background_treatment || ''}
                      onChange={(e) =>
                        setSkillJson((prev) => ({
                          ...prev,
                          skill_07_game_asset: {
                            asset_category: prev.skill_07_game_asset?.asset_category || 'weapon_equipment',
                            asset_category_zh: prev.skill_07_game_asset?.asset_category_zh || '游戏资产',
                            engine_target: prev.skill_07_game_asset?.engine_target || 'Unreal Engine 5',
                            perspective_view: prev.skill_07_game_asset?.perspective_view || 'isometric 3D view',
                            art_style: prev.skill_07_game_asset?.art_style || 'stylized hand-painted PBR',
                            background_treatment: e.target.value,
                            prompt_modifiers: prev.skill_07_game_asset?.prompt_modifiers || '',
                            asset_naming_slug: prev.skill_07_game_asset?.asset_naming_slug || 'game_asset',
                          },
                        }))
                      }
                      placeholder="例如: pure solid white background, clean studio asset cutout"
                      className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">游戏资产修饰词 (Prompt Modifiers):</label>
                    <textarea
                      value={skillJson.skill_07_game_asset?.prompt_modifiers || ''}
                      onChange={(e) =>
                        setSkillJson((prev) => ({
                          ...prev,
                          skill_07_game_asset: {
                            asset_category: prev.skill_07_game_asset?.asset_category || 'weapon_equipment',
                            asset_category_zh: prev.skill_07_game_asset?.asset_category_zh || '游戏资产',
                            engine_target: prev.skill_07_game_asset?.engine_target || 'Unreal Engine 5',
                            perspective_view: prev.skill_07_game_asset?.perspective_view || 'isometric 3D view',
                            art_style: prev.skill_07_game_asset?.art_style || 'stylized hand-painted PBR',
                            background_treatment: prev.skill_07_game_asset?.background_treatment || 'solid neutral background',
                            prompt_modifiers: e.target.value,
                            asset_naming_slug: prev.skill_07_game_asset?.asset_naming_slug || 'game_asset',
                          },
                        }))
                      }
                      rows={3}
                      placeholder="例如: game asset, isometric 3D view, stylized PBR, Unreal Engine 5 render, clean cutout, 8k uhd"
                      className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed shadow-2xs transition"
                    />
                  </div>
                </div>
              )}

              {/* TAB 1: IMAGE TYPE */}
              {activeTab === 'stage1' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">{t('editDialog.mainCategory')}:</label>
                      <input
                        type="text"
                        value={skillJson.skill_01_image_type?.image_type || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_01_image_type: {
                              ...prev.skill_01_image_type,
                              image_type: e.target.value,
                              confidence: prev.skill_01_image_type?.confidence || 0.95,
                            },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">{t('editDialog.subCategory')}:</label>
                      <input
                        type="text"
                        value={skillJson.skill_01_image_type?.sub_category || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_01_image_type: {
                              ...prev.skill_01_image_type,
                              image_type: prev.skill_01_image_type?.image_type || '其他',
                              confidence: prev.skill_01_image_type?.confidence || 0.95,
                              sub_category: e.target.value,
                            },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">{t('editDialog.featureTags')}:</label>
                    <input
                      type="text"
                      value={(skillJson.skill_01_image_type?.tags || []).join(', ')}
                      onChange={(e) =>
                        setSkillJson((prev) => ({
                          ...prev,
                          skill_01_image_type: {
                            ...prev.skill_01_image_type,
                            image_type: prev.skill_01_image_type?.image_type || '其他',
                            confidence: prev.skill_01_image_type?.confidence || 0.95,
                            tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                          },
                        }))
                      }
                      className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: ART STYLE */}
              {activeTab === 'stage2' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">{t('editDialog.artStyles')}:</label>
                    <input
                      type="text"
                      value={(skillJson.skill_02_image_style?.style || []).join(', ')}
                      onChange={(e) =>
                        setSkillJson((prev) => ({
                          ...prev,
                          skill_02_image_style: {
                            ...prev.skill_02_image_style,
                            style: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            style_weight: prev.skill_02_image_style?.style_weight || [0.8],
                          },
                        }))
                      }
                      className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">{t('editDialog.visualMood')}:</label>
                      <input
                        type="text"
                        value={skillJson.skill_02_image_style?.visual_mood || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_02_image_style: {
                              ...prev.skill_02_image_style,
                              style: prev.skill_02_image_style?.style || [],
                              style_weight: prev.skill_02_image_style?.style_weight || [],
                              visual_mood: e.target.value,
                            },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">{t('editDialog.medium')}:</label>
                      <input
                        type="text"
                        value={skillJson.skill_02_image_style?.medium || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_02_image_style: {
                              ...prev.skill_02_image_style,
                              style: prev.skill_02_image_style?.style || [],
                              style_weight: prev.skill_02_image_style?.style_weight || [],
                              medium: e.target.value,
                            },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CAMERA & LIGHTING */}
              {activeTab === 'stage3' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">{t('editDialog.lighting')}:</label>
                    <input
                      type="text"
                      value={skillJson.skill_03_camera_param?.light || ''}
                      onChange={(e) =>
                        setSkillJson((prev) => ({
                          ...prev,
                          skill_03_camera_param: {
                            ...prev.skill_03_camera_param,
                            light: e.target.value,
                            color_tone: prev.skill_03_camera_param?.color_tone || '',
                            camera: prev.skill_03_camera_param?.camera || '',
                            composition: prev.skill_03_camera_param?.composition || '',
                          },
                        }))
                      }
                      className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">{t('editDialog.colorTone')}:</label>
                    <input
                      type="text"
                      value={skillJson.skill_03_camera_param?.color_tone || ''}
                      onChange={(e) =>
                        setSkillJson((prev) => ({
                          ...prev,
                          skill_03_camera_param: {
                            ...prev.skill_03_camera_param,
                            light: prev.skill_03_camera_param?.light || '',
                            color_tone: e.target.value,
                            camera: prev.skill_03_camera_param?.camera || '',
                            composition: prev.skill_03_camera_param?.composition || '',
                          },
                        }))
                      }
                      className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">{t('editDialog.camera')}:</label>
                      <input
                        type="text"
                        value={skillJson.skill_03_camera_param?.camera || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_03_camera_param: {
                              ...prev.skill_03_camera_param,
                              light: prev.skill_03_camera_param?.light || '',
                              color_tone: prev.skill_03_camera_param?.color_tone || '',
                              camera: e.target.value,
                              composition: prev.skill_03_camera_param?.composition || '',
                            },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">{t('editDialog.composition')}:</label>
                      <input
                        type="text"
                        value={skillJson.skill_03_camera_param?.composition || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_03_camera_param: {
                              ...prev.skill_03_camera_param,
                              light: prev.skill_03_camera_param?.light || '',
                              color_tone: prev.skill_03_camera_param?.color_tone || '',
                              camera: prev.skill_03_camera_param?.camera || '',
                              composition: e.target.value,
                            },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SCENE CONTENT */}
              {activeTab === 'stage4' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">{t('editDialog.subject')}:</label>
                    <input
                      type="text"
                      value={skillJson.skill_04_scene_content?.subject || ''}
                      onChange={(e) =>
                        setSkillJson((prev) => ({
                          ...prev,
                          skill_04_scene_content: {
                            ...prev.skill_04_scene_content,
                            subject: e.target.value,
                            background: prev.skill_04_scene_content?.background || '',
                            action: prev.skill_04_scene_content?.action || '',
                          },
                        }))
                      }
                      className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">{t('editDialog.background')}:</label>
                    <input
                      type="text"
                      value={skillJson.skill_04_scene_content?.background || ''}
                      onChange={(e) =>
                        setSkillJson((prev) => ({
                          ...prev,
                          skill_04_scene_content: {
                            ...prev.skill_04_scene_content,
                            subject: prev.skill_04_scene_content?.subject || '',
                            background: e.target.value,
                            action: prev.skill_04_scene_content?.action || '',
                          },
                        }))
                      }
                      className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 font-medium block mb-1">{t('editDialog.action')}:</label>
                    <input
                      type="text"
                      value={skillJson.skill_04_scene_content?.action || ''}
                      onChange={(e) =>
                        setSkillJson((prev) => ({
                          ...prev,
                          skill_04_scene_content: {
                            ...prev.skill_04_scene_content,
                            subject: prev.skill_04_scene_content?.subject || '',
                            background: prev.skill_04_scene_content?.background || '',
                            action: e.target.value,
                          },
                        }))
                      }
                      className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: MICRO DETAILS & EMOTION */}
              {activeTab === 'stage5' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">{t('editDialog.microDetails')}:</label>
                    <textarea
                      value={skillJson.skill_05_detail_desc?.detail || ''}
                      onChange={(e) =>
                        setSkillJson((prev) => ({
                          ...prev,
                          skill_05_detail_desc: {
                            ...prev.skill_05_detail_desc,
                            detail: e.target.value,
                            emotion: prev.skill_05_detail_desc?.emotion || '',
                          },
                        }))
                      }
                      rows={3}
                      className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed shadow-2xs transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">{t('editDialog.emotion')}:</label>
                      <input
                        type="text"
                        value={skillJson.skill_05_detail_desc?.emotion || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_05_detail_desc: {
                              ...prev.skill_05_detail_desc,
                              detail: prev.skill_05_detail_desc?.detail || '',
                              emotion: e.target.value,
                            },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">{t('editDialog.attireProps')}:</label>
                      <input
                        type="text"
                        value={skillJson.skill_05_detail_desc?.attire_or_props || ''}
                        onChange={(e) =>
                          setSkillJson((prev) => ({
                            ...prev,
                            skill_05_detail_desc: {
                              ...prev.skill_05_detail_desc,
                              detail: prev.skill_05_detail_desc?.detail || '',
                              emotion: prev.skill_05_detail_desc?.emotion || '',
                              attire_or_props: e.target.value,
                            },
                          }))
                        }
                        className="w-full p-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs transition"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


