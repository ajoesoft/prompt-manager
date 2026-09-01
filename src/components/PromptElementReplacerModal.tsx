import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Palette,
  Layers,
  User,
  Image as ImageIcon,
  Sun,
  Frame,
  Camera,
  Aperture,
  Sliders,
  Type,
  Bot,
  ShieldAlert,
  Save,
  Copy,
  Check,
  Play,
  RotateCcw,
  ArrowRight,
  GitFork,
  CheckCircle2,
  Wand2,
  ListFilter,
  Search,
  Zap,
  FolderKanban
} from 'lucide-react';
import {
  HistoryItem,
  PromptModelTemplate,
  GenerationParams
} from '../types';
import {
  PROMPT_ELEMENT_CATEGORIES,
  QUICK_STYLE_PRESETS,
  PromptElementState,
  ElementOption,
  extractElementStateFromItem,
  reconstructPromptFromElements,
  applyElementsToHistoryItem,
  cleanPromptString
} from '../utils/promptElementReplacer';

interface PromptElementReplacerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Can be a single item or multiple items for batch replacement
  item: HistoryItem | null;
  batchItems?: HistoryItem[];
  promptTemplates: PromptModelTemplate[];
  projectName?: string;
  onSaveItem: (updatedItem: HistoryItem) => void;
  onSaveAsNewFork?: (newItem: HistoryItem) => void;
  onBatchSaveItems?: (updatedItems: HistoryItem[]) => void;
  onExecuteComfyUi?: (itemId: string) => void;
}

export const PromptElementReplacerModal: React.FC<PromptElementReplacerModalProps> = ({
  isOpen,
  onClose,
  item,
  batchItems = [],
  promptTemplates,
  projectName,
  onSaveItem,
  onSaveAsNewFork,
  onBatchSaveItems,
  onExecuteComfyUi,
}) => {
  if (!isOpen || (!item && batchItems.length === 0)) return null;

  const targetItem = item || batchItems[0];
  const isBatchMode = batchItems.length > 1;

  // Active Category Tab
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>('style');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Initial and editable element state
  const [initialElements, setInitialElements] = useState<PromptElementState>(() =>
    extractElementStateFromItem(targetItem)
  );
  const [currentElements, setCurrentElements] = useState<PromptElementState>(() =>
    extractElementStateFromItem(targetItem)
  );

  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Sync state if incoming item changes
  useEffect(() => {
    if (targetItem) {
      const extracted = extractElementStateFromItem(targetItem);
      setInitialElements(extracted);
      setCurrentElements(extracted);
    }
  }, [targetItem?.id]);

  // Compute live reconstructed prompt
  const livePromptResult = useMemo(() => {
    return reconstructPromptFromElements(currentElements, promptTemplates);
  }, [currentElements, promptTemplates]);

  // Check how many elements have been modified
  const modifiedElementCount = useMemo(() => {
    let count = 0;
    const keys = Object.keys(currentElements) as (keyof PromptElementState)[];
    for (const k of keys) {
      if (currentElements[k] !== initialElements[k] && currentElements[k].trim() !== '') {
        count++;
      }
    }
    return count;
  }, [currentElements, initialElements]);

  // Quick Style Preset Click Handler
  const handleApplyQuickPreset = (presetId: string) => {
    const preset = QUICK_STYLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setCurrentElements((prev) => ({
      ...prev,
      ...preset.targetElements,
      targetModel: preset.suggestedModel || prev.targetModel,
    }));
  };

  // Option Click Handler
  const handleSelectOption = (fieldKey: string, option: ElementOption) => {
    setCurrentElements((prev) => {
      const updated = { ...prev, [fieldKey]: option.valuePrompt };
      // If the option also specifies a negative prompt keyword
      if (option.negativePromptAdd && !prev.negativePreset.includes(option.negativePromptAdd)) {
        updated.negativePreset = cleanPromptString(
          `${prev.negativePreset ? prev.negativePreset + ', ' : ''}${option.negativePromptAdd}`
        );
      }
      return updated;
    });
  };

  // Reset a specific element back to initial
  const handleResetElement = (fieldKey: keyof PromptElementState) => {
    setCurrentElements((prev) => ({
      ...prev,
      [fieldKey]: initialElements[fieldKey],
    }));
  };

  // Reset all elements back to initial
  const handleResetAll = () => {
    setCurrentElements(initialElements);
  };

  // Save changes to current item (Overwrite)
  const handleSaveOverwrite = () => {
    if (isBatchMode && onBatchSaveItems) {
      const updatedList = batchItems.map((itm) =>
        applyElementsToHistoryItem(itm, currentElements, {
          asNewFork: false,
          promptTemplates,
        })
      );
      onBatchSaveItems(updatedList);
      setSaveSuccess(`已成功批量替换 ${updatedList.length} 条提示词！`);
    } else {
      const updated = applyElementsToHistoryItem(targetItem, currentElements, {
        asNewFork: false,
        promptTemplates,
      });
      onSaveItem(updated);
      setSaveSuccess('提示词要素已覆盖保存！');
    }

    setTimeout(() => {
      setSaveSuccess(null);
      onClose();
    }, 650);
  };

  // Save as new variant / fork
  const handleSaveAsFork = () => {
    if (onSaveAsNewFork) {
      const newFork = applyElementsToHistoryItem(targetItem, currentElements, {
        asNewFork: true,
        promptTemplates,
      });
      onSaveAsNewFork(newFork);
      setSaveSuccess('已另存为全新衍生提示词变体！');
      setTimeout(() => {
        setSaveSuccess(null);
        onClose();
      }, 650);
    }
  };

  // Save & Instant Generate on ComfyUI
  const handleSaveAndGenerate = () => {
    const updated = applyElementsToHistoryItem(targetItem, currentElements, {
      asNewFork: false,
      promptTemplates,
    });
    onSaveItem(updated);
    if (onExecuteComfyUi) {
      onExecuteComfyUi(updated.id);
    }
    setSaveSuccess('已保存并发送至 ComfyUI 队列生成！');
    setTimeout(() => {
      setSaveSuccess(null);
      onClose();
    }, 700);
  };

  // Render Category Icon
  const renderCategoryIcon = (iconName: string, className: string = 'w-4 h-4') => {
    switch (iconName) {
      case 'Palette':
        return <Palette className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'User':
        return <User className={className} />;
      case 'Image':
        return <ImageIcon className={className} />;
      case 'Sun':
        return <Sun className={className} />;
      case 'Frame':
        return <Frame className={className} />;
      case 'Camera':
        return <Camera className={className} />;
      case 'Aperture':
        return <Aperture className={className} />;
      case 'Sliders':
        return <Sliders className={className} />;
      case 'Type':
        return <Type className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Bot':
        return <Bot className={className} />;
      case 'ShieldAlert':
        return <ShieldAlert className={className} />;
      default:
        return <Wand2 className={className} />;
    }
  };

  const activeCategory =
    PROMPT_ELEMENT_CATEGORIES.find((c) => c.id === activeCategoryKey) ||
    PROMPT_ELEMENT_CATEGORIES[0];

  const filteredOptions = useMemo(() => {
    if (!searchFilter.trim()) return activeCategory.options;
    const q = searchFilter.toLowerCase();
    return activeCategory.options.filter(
      (opt) =>
        opt.labelZh.toLowerCase().includes(q) ||
        opt.labelEn.toLowerCase().includes(q) ||
        opt.valuePrompt.toLowerCase().includes(q) ||
        (opt.valueZh && opt.valueZh.toLowerCase().includes(q))
    );
  }, [activeCategory, searchFilter]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  提示词要素拆解与内容替换重塑器
                </h3>
                {isBatchMode ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    批量模式 ({batchItems.length} 条)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    单条重构
                  </span>
                )}
                {modifiedElementCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-xs animate-pulse">
                    已改写 {modifiedElementCount} 个要素
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center space-x-2 mt-0.5">
                <span>
                  当前对象: {targetItem?.file_name} · 目标模型: {currentElements.targetModel}
                </span>
                {projectName && (
                  <span className="flex items-center space-x-1 text-indigo-300">
                    <FolderKanban className="w-3 h-3" />
                    <span>{projectName}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Style Presets Banner (一键风格改写全套方案) */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center space-x-1.5 flex-shrink-0 text-xs font-semibold text-slate-700">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>一键风格套组:</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
            {QUICK_STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyQuickPreset(preset.id)}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 shadow-2xs transition whitespace-nowrap group"
                title={preset.descriptionZh}
              >
                <span>{preset.nameZh}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 font-mono">
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleResetAll}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 transition whitespace-nowrap flex-shrink-0"
            title="重置所有要素为初始状态"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置全部</span>
          </button>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-white">
          {/* Left Column: 13 Element Categories Navigation (3 cols) */}
          <div className="lg:col-span-3 border-r border-slate-200 bg-slate-50/70 p-3 overflow-y-auto flex flex-col space-y-1">
            <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              画面要素拆解维度 (13大类)
            </div>

            {PROMPT_ELEMENT_CATEGORIES.map((cat) => {
              const isSelected = activeCategoryKey === cat.id;
              const currentValue = currentElements[cat.fieldKey as keyof PromptElementState];
              const isModified =
                currentValue !== initialElements[cat.fieldKey as keyof PromptElementState] &&
                currentValue !== '';

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategoryKey(cat.id);
                    setSearchFilter('');
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className={isSelected ? 'text-white' : 'text-indigo-600'}>
                      {renderCategoryIcon(cat.iconName, 'w-4 h-4')}
                    </span>
                    <span className="truncate">{cat.titleZh.split(' ')[0]}</span>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {isModified && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-amber-300' : 'bg-amber-500'
                        }`}
                        title="已修改此要素"
                      />
                    )}
                    <span
                      className={`text-[10px] font-mono px-1 rounded ${
                        isSelected
                          ? 'bg-indigo-700 text-indigo-100'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {cat.options.length}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Middle Column: Current Element Presets & Custom Input (5 cols) */}
          <div className="lg:col-span-5 p-4 overflow-y-auto flex flex-col space-y-4 border-r border-slate-200">
            {/* Category Title & Search */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-indigo-600">
                    {renderCategoryIcon(activeCategory.iconName, 'w-5 h-5')}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900">
                    {activeCategory.titleZh}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeCategory.descriptionZh}
                </p>
              </div>

              <div className="relative w-36 sm:w-44 flex-shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="搜索关键词..."
                  className="w-full pl-8 pr-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                />
              </div>
            </div>

            {/* Current Active Value & Custom Input Area */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>当前选中/自定义内容 ({activeCategory.fieldKey})</span>
                <button
                  onClick={() =>
                    handleResetElement(activeCategory.fieldKey as keyof PromptElementState)
                  }
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>恢复原状</span>
                </button>
              </div>

              <textarea
                value={currentElements[activeCategory.fieldKey as keyof PromptElementState] || ''}
                onChange={(e) =>
                  setCurrentElements({
                    ...currentElements,
                    [activeCategory.fieldKey]: e.target.value,
                  })
                }
                rows={3}
                placeholder={`输入自定义${activeCategory.titleZh.split(' ')[0]}，或从下方预设库点击选择...`}
                className="w-full p-2.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed resize-none shadow-2xs"
              />
            </div>

            {/* Presets List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>预设素材库 (点击直接替换):</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  共 {filteredOptions.length} 个
                </span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    没有找到匹配的预设词
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isCurrent =
                      currentElements[activeCategory.fieldKey as keyof PromptElementState] ===
                      opt.valuePrompt;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(activeCategory.fieldKey, opt)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col space-y-1.5 ${
                          isCurrent
                            ? 'bg-indigo-50/90 border-indigo-500 ring-1 ring-indigo-500/20 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-slate-900">
                              {opt.labelZh}
                            </span>
                            {opt.badge && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          {isCurrent && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          )}
                        </div>

                        {opt.description && (
                          <p className="text-[11px] text-slate-500">
                            {opt.description}
                          </p>
                        )}

                        <div className="p-2 rounded bg-slate-900 text-slate-200 text-[11px] font-mono leading-relaxed line-clamp-2 select-all">
                          {opt.valuePrompt}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Diff Comparison & Instant Output (4 cols) */}
          <div className="lg:col-span-4 p-4 bg-slate-50/70 overflow-y-auto flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  实时效果预览与前后对比
                </h4>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-medium">
                {livePromptResult.targetModel}
              </span>
            </div>

            {/* Positive Prompt Box (New) */}
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 shadow-md space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>替换后正向提示词 (Positive)</span>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(livePromptResult.positivePrompt);
                    setCopiedPos(true);
                    setTimeout(() => setCopiedPos(false), 1500);
                  }}
                  className="flex items-center space-x-1 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition text-[10px]"
                >
                  {copiedPos ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPos ? '已复制' : '复制'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-100 font-mono leading-relaxed select-all max-h-48 overflow-y-auto pr-1">
                {livePromptResult.positivePrompt}
              </div>
            </div>

            {/* Negative Prompt Box (New) */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                <span className="font-semibold text-rose-600 flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>替换后反向提示词 (Negative)</span>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(livePromptResult.negativePrompt);
                    setCopiedNeg(true);
                    setTimeout(() => setCopiedNeg(false), 1500);
                  }}
                  className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded hover:bg-slate-100 transition text-[10px]"
                >
                  {copiedNeg ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedNeg ? '已复制' : '复制'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-600 font-mono leading-relaxed select-all max-h-24 overflow-y-auto">
                {livePromptResult.negativePrompt || '(无需负向提示词)'}
              </div>
            </div>

            {/* Comparison Diff / Original Positive */}
            <div className="bg-slate-100/90 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">
                原始正向提示词 (Before):
              </div>
              <p className="text-[11px] text-slate-600 font-mono line-clamp-3 select-all">
                {targetItem?.positive_prompt}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            {saveSuccess ? (
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{saveSuccess}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 flex items-center space-x-1">
                <span>提示: 支持直接替换当前提示词，或另存为全新衍生变体。</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
            >
              取消
            </button>

            {/* Save as New Fork (Variant) */}
            {!isBatchMode && onSaveAsNewFork && (
              <button
                onClick={handleSaveAsFork}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs transition"
                title="保留原图提示词，创建一条新的衍生提示词卡片"
              >
                <GitFork className="w-4 h-4 text-purple-600" />
                <span>另存为新变体</span>
              </button>
            )}

            {/* Overwrite Save */}
            <button
              onClick={handleSaveOverwrite}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>{isBatchMode ? `批量替换全部 ${batchItems.length} 条` : '覆盖更新当前提示词'}</span>
            </button>

            {/* Save & Instant ComfyUI Execute */}
            {!isBatchMode && onExecuteComfyUi && (
              <button
                onClick={handleSaveAndGenerate}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                title="保存并直接发送至 ComfyUI 队列进行出图"
              >
                <Play className="w-4 h-4" />
                <span>保存并出图</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
