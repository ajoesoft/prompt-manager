import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Check,
  Copy,
  ExternalLink,
  FolderOpen,
  Plus,
  Trash2,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
  Zap,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Globe,
  Radio,
  ArrowDownToLine,
  Info
} from 'lucide-react';
import {
  GgufModelInfo,
  QuantizationOption,
  QuantizationType,
  DownloadSourceProvider,
  ModelConfig
} from '../types';
import { DEFAULT_MODELS, generateDownloadCommands, getQuantBadgeStyle } from '../data/modelDownloads';
import { useLanguage } from '../i18n/LanguageContext';

interface ModelDownloadHubProps {
  modelConfig: ModelConfig;
  onUpdateModelConfig: (newCfg: Partial<ModelConfig>) => void;
  onClose?: () => void;
}

export const ModelDownloadHub: React.FC<ModelDownloadHubProps> = ({
  modelConfig,
  onUpdateModelConfig,
}) => {
  const { t, lang } = useLanguage();

  // Registry Models State
  const [models, setModels] = useState<GgufModelInfo[]>(() => {
    try {
      const saved = localStorage.getItem('prompt_manager_custom_models_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_MODELS;
  });

  // Active Download Source (ModelScope vs HuggingFace)
  const [sourceProvider, setSourceProvider] = useState<DownloadSourceProvider>('modelscope');

  // Filter & Search State
  const [activeCategory, setActiveCategory] = useState<'all' | 'qwen_vl' | 'qwen_next' | 'mmproj'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Quantization per Model ID
  const [selectedQuants, setSelectedQuants] = useState<Record<string, QuantizationType>>(() => {
    const initial: Record<string, QuantizationType> = {};
    DEFAULT_MODELS.forEach((m) => {
      const rec = m.quantizations.find((q) => q.recommended) || m.quantizations[0];
      if (rec) initial[m.id] = rec.quant;
    });
    return initial;
  });

  // Command preview modal state
  const [activeCmdModel, setActiveCmdModel] = useState<{
    model: GgufModelInfo;
    quant: QuantizationOption;
  } | null>(null);
  const [activeCmdType, setActiveCmdType] = useState<'wget' | 'curl' | 'aria2c' | 'modelscopeCli' | 'hfCli'>('aria2c');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Feedback notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Add Custom Model Modal
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<'main_model' | 'mmproj'>('main_model');
  const [customParams, setCustomParams] = useState('7B');
  const [customDesc, setCustomDesc] = useState('');
  const [customFileName, setCustomFileName] = useState('custom-model-q4_k_m.gguf');
  const [customQuant, setCustomQuant] = useState<QuantizationType>('Q4_K_M');
  const [customMsUrl, setCustomMsUrl] = useState('');
  const [customHfUrl, setCustomHfUrl] = useState('');
  const [customSizeGb, setCustomSizeGb] = useState(4.5);

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      // Category filter
      if (activeCategory === 'qwen_vl' && m.family !== 'qwen_vl') return false;
      if (activeCategory === 'qwen_next' && !['qwen_3_5', 'qwen_3_6', 'qwen_3_8'].includes(m.family)) return false;
      if (activeCategory === 'mmproj' && m.model_type !== 'mmproj') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.name.toLowerCase().includes(q);
        const matchDesc = (m.description_zh + ' ' + m.description_en).toLowerCase().includes(q);
        const matchTags = m.tags.some((t) => t.toLowerCase().includes(q));
        const matchFamily = m.family_display.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchTags && !matchFamily) return false;
      }
      return true;
    });
  }, [models, activeCategory, searchQuery]);

  const handleSelectQuant = (modelId: string, quant: QuantizationType) => {
    setSelectedQuants((prev) => ({ ...prev, [modelId]: quant }));
  };

  // Set as Active Model in llama-server config
  const handleApplyAsActiveModel = (model: GgufModelInfo, quantOpt: QuantizationOption) => {
    const defaultDir = modelConfig.models_dir || './models';
    const filePath = `${defaultDir.replace(/\/$/, '')}/${quantOpt.file_name}`;

    if (model.model_type === 'mmproj') {
      onUpdateModelConfig({ mmproj_gguf: filePath });
      showToast(lang === 'zh' ? `已将视觉投影文件设为: ${filePath}` : `Set vision projector to: ${filePath}`);
    } else {
      onUpdateModelConfig({ main_gguf: filePath });
      showToast(lang === 'zh' ? `已将主推理模型设为: ${filePath}` : `Set main inference model to: ${filePath}`);
    }
  };

  // Copy command to clipboard
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast(lang === 'zh' ? '已复制到剪贴板' : 'Copied to clipboard');
  };

  // Add Custom Model
  const handleSaveCustomModel = () => {
    if (!customName.trim() || (!customMsUrl.trim() && !customHfUrl.trim())) {
      alert(lang === 'zh' ? '请填写模型名称和至少一个下载链接' : 'Please provide model name and at least one download URL');
      return;
    }

    const newModel: GgufModelInfo = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      family: 'custom',
      family_display: lang === 'zh' ? '用户自定义模型' : 'Custom User Model',
      author: 'Custom GGUF',
      model_type: customType,
      parameters: customParams,
      context_length: 32768,
      recommended_for_reverse: false,
      description_zh: customDesc || '用户自定义本地 GGUF 模型文件。',
      description_en: customDesc || 'Custom user defined local GGUF model.',
      hf_repo: 'custom/repo',
      ms_repo: 'custom/repo',
      tags: ['自定义', 'GGUF'],
      quantizations: [
        {
          quant: customQuant,
          file_name: customFileName.trim() || 'model.gguf',
          size_gb: customSizeGb,
          recommended: true,
          vram_requirement_gb: customSizeGb * 1.3,
          description_zh: `${customQuant} 自定义量化文件`,
          description_en: `${customQuant} Custom Quantization`,
          download_urls: {
            modelscope: customMsUrl.trim() || customHfUrl.trim(),
            huggingface: customHfUrl.trim() || customMsUrl.trim(),
          }
        }
      ]
    };

    const updated = [newModel, ...models];
    setModels(updated);
    localStorage.setItem('prompt_manager_custom_models_v2', JSON.stringify(updated));
    setShowAddCustomModal(false);
    showToast(lang === 'zh' ? '已成功添加自定义模型' : 'Custom model added successfully');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center space-x-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Banner: Dual Download Sources & Directory Config */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Download className="w-4 h-4 text-blue-600" />
              <span>{lang === 'zh' ? '本地 GGUF 模型库与高速下载中心' : 'Local GGUF Model Hub & Downloader'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'zh'
                ? '支持从国内 ModelScope (魔搭高速镜像) 或 Hugging Face 官方源下载 Qwen-VL、Qwen 3.5/3.6/3.8 及 mmproj 视觉投影层。'
                : 'Download Qwen-VL, Qwen 3.5/3.6/3.8, and mmproj vision projectors from ModelScope (China Fast Mirror) or Hugging Face.'}
            </p>
          </div>

          {/* Download Source Switcher */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setSourceProvider('modelscope')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                sourceProvider === 'modelscope'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <span>🇨🇳</span>
              <span>{lang === 'zh' ? 'ModelScope (魔搭国内源)' : 'ModelScope (China)'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                {lang === 'zh' ? '推荐' : 'Fast'}
              </span>
            </button>

            <button
              onClick={() => setSourceProvider('huggingface')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                sourceProvider === 'huggingface'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <span>🌐</span>
              <span>{lang === 'zh' ? 'Hugging Face (官方源)' : 'Hugging Face (Global)'}</span>
            </button>
          </div>
        </div>

        {/* Directory & Quick Stats Bar */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="font-semibold text-slate-600">{lang === 'zh' ? '下载存放目录:' : 'Download Dir:'}</span>
            <input
              type="text"
              value={modelConfig.models_dir || './models'}
              onChange={(e) => onUpdateModelConfig({ models_dir: e.target.value })}
              className="flex-1 bg-white border border-slate-200 rounded px-2 py-0.5 font-mono text-[11px] text-slate-800 focus:outline-hidden focus:border-blue-500"
              placeholder="./models"
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 truncate">
            <Cpu className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span className="font-semibold text-slate-600">{lang === 'zh' ? '当前主模型:' : 'Main Model:'}</span>
            <span className="font-mono text-[11px] text-slate-700 truncate" title={modelConfig.main_gguf}>
              {modelConfig.main_gguf ? modelConfig.main_gguf.split(/[\\/]/).pop() : (lang === 'zh' ? '未配置' : 'Not set')}
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 truncate">
            <Eye className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="font-semibold text-slate-600">{lang === 'zh' ? '当前投影层:' : 'MMProj:'}</span>
            <span className="font-mono text-[11px] text-slate-700 truncate" title={modelConfig.mmproj_gguf}>
              {modelConfig.mmproj_gguf ? modelConfig.mmproj_gguf.split(/[\\/]/).pop() : (lang === 'zh' ? '未配置' : 'Not set')}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {lang === 'zh' ? '全部模型' : 'All Models'} ({models.length})
          </button>
          <button
            onClick={() => setActiveCategory('qwen_vl')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeCategory === 'qwen_vl'
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {lang === 'zh' ? 'Qwen2.5-VL 视觉反推' : 'Qwen2.5-VL Series'}
          </button>
          <button
            onClick={() => setActiveCategory('qwen_next')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeCategory === 'qwen_next'
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {lang === 'zh' ? 'Qwen 3.5 / 3.6 / 3.8 次世代' : 'Qwen 3.5 / 3.6 / 3.8'}
          </button>
          <button
            onClick={() => setActiveCategory('mmproj')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeCategory === 'mmproj'
                ? 'bg-blue-600 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {lang === 'zh' ? 'mmproj 视觉投影层' : 'mmproj Projectors'}
          </button>
        </div>

        {/* Search input & Add Custom Model */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'zh' ? '搜索模型名称/参数/特性...' : 'Search model name, params...'}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 w-48 sm:w-60"
            />
          </div>

          <button
            onClick={() => setShowAddCustomModal(true)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 text-xs font-bold transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '添加自定义模型' : 'Add Custom'}</span>
          </button>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredModels.map((model) => {
          const currentQuantKey = selectedQuants[model.id] || model.quantizations[0].quant;
          const currentQuantOption =
            model.quantizations.find((q) => q.quant === currentQuantKey) || model.quantizations[0];
          const quantBadge = getQuantBadgeStyle(currentQuantOption.quant);
          const downloadUrl =
            sourceProvider === 'modelscope'
              ? currentQuantOption.download_urls.modelscope
              : currentQuantOption.download_urls.huggingface;

          // Check if this model is active in config
          const isMainActive =
            model.model_type === 'main_model' &&
            modelConfig.main_gguf?.includes(currentQuantOption.file_name.replace(/\.gguf$/i, ''));
          const isMmprojActive =
            model.model_type === 'mmproj' &&
            modelConfig.mmproj_gguf?.includes(currentQuantOption.file_name.replace(/\.gguf$/i, ''));

          return (
            <div
              key={model.id}
              className={`p-5 rounded-2xl bg-white border transition shadow-2xs hover:shadow-md ${
                isMainActive || isMmprojActive ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-sm font-bold text-slate-800">{model.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {model.family_display}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {model.parameters}
                    </span>
                    {model.recommended_for_reverse && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 mr-0.5" />
                        <span>{lang === 'zh' ? '反推首选' : 'Recommended'}</span>
                      </span>
                    )}
                    {model.model_type === 'mmproj' && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        --mmproj
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {lang === 'zh' ? model.description_zh : model.description_en}
                  </p>

                  {/* Quantization Selector Row */}
                  <div className="pt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs font-bold text-slate-700">
                        {lang === 'zh' ? '选择量化精度档位 (Quantization):' : 'Select Quantization:'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 flex-wrap gap-y-2">
                      {model.quantizations.map((q) => {
                        const isSelected = q.quant === currentQuantOption.quant;
                        const badge = getQuantBadgeStyle(q.quant);
                        return (
                          <button
                            key={q.quant}
                            onClick={() => handleSelectQuant(model.id, q.quant)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : `${badge.bg} ${badge.text} ${badge.border} hover:opacity-80`
                            }`}
                          >
                            <span>{q.quant}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'opacity-70'}`}>
                              ({q.size_gb} GB)
                            </span>
                            {q.recommended && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quant details note */}
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-700">{currentQuantOption.file_name}</span>
                        <span className="text-slate-400">|</span>
                        <span>{lang === 'zh' ? currentQuantOption.description_zh : currentQuantOption.description_en}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500">
                        <span>大小: {currentQuantOption.size_gb} GB</span>
                        <span>推荐显存: {currentQuantOption.vram_requirement_gb} GB</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end space-x-2 lg:space-x-0 lg:space-y-2 flex-shrink-0 pt-2 lg:pt-0">
                  {/* Download Link */}
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'zh'
                        ? `从 ${sourceProvider === 'modelscope' ? '魔搭' : 'HF'} 下载`
                        : `Download (${sourceProvider === 'modelscope' ? 'ModelScope' : 'HF'})`}
                    </span>
                  </a>

                  {/* Copy CLI commands button */}
                  <button
                    onClick={() => setActiveCmdModel({ model, quant: currentQuantOption })}
                    className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center justify-center space-x-1.5 border border-slate-200"
                  >
                    <Terminal className="w-3.5 h-3.5 text-slate-600" />
                    <span>{lang === 'zh' ? '复制下载命令' : 'Copy CLI'}</span>
                  </button>

                  {/* Set as Active Model */}
                  <button
                    onClick={() => handleApplyAsActiveModel(model, currentQuantOption)}
                    className={`w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5 border ${
                      isMainActive || isMmprojActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isMainActive || isMmprojActive ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lang === 'zh' ? '当前已设为默认' : 'Currently Active'}</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {model.model_type === 'mmproj'
                            ? (lang === 'zh' ? '设为视觉投影 (--mmproj)' : 'Set as --mmproj')
                            : (lang === 'zh' ? '设为主模型 (-m)' : 'Set as Main Model (-m)')}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal CLI Command Dialog */}
      {activeCmdModel && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold">
                  {lang === 'zh' ? '高速命令行下载指令' : 'CLI Download Commands'}
                </h4>
              </div>
              <button
                onClick={() => setActiveCmdModel(null)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{activeCmdModel.model.name}</span>
                <span className="mx-2">·</span>
                <span className="font-mono text-blue-600">{activeCmdModel.quant.file_name}</span>
                <span className="mx-2">·</span>
                <span>{activeCmdModel.quant.size_gb} GB</span>
              </div>

              {/* Tool Selector Tabs */}
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setActiveCmdType('aria2c')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeCmdType === 'aria2c'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  aria2c ({lang === 'zh' ? '16线程极速推荐' : '16-thread Fast'})
                </button>
                <button
                  onClick={() => setActiveCmdType('wget')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeCmdType === 'wget'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  wget (断点续传)
                </button>
                <button
                  onClick={() => setActiveCmdType('curl')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeCmdType === 'curl'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  curl
                </button>
                <button
                  onClick={() => setActiveCmdType('modelscopeCli')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeCmdType === 'modelscopeCli'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  modelscope cli
                </button>
              </div>

              {/* Code Box */}
              {(() => {
                const cmds = generateDownloadCommands(
                  activeCmdModel.model,
                  activeCmdModel.quant,
                  sourceProvider,
                  modelConfig.models_dir || './models'
                );
                const currentCmd = cmds[activeCmdType];

                return (
                  <div className="relative">
                    <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {currentCmd}
                    </pre>

                    <button
                      onClick={() => handleCopyText(currentCmd, 'dialog_cmd')}
                      className="absolute right-3 top-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-md border border-slate-700"
                    >
                      {copiedKey === 'dialog_cmd' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>复制命令</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })()}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <p className="font-semibold">💡 极速下载提示:</p>
                <p>
                  1. 模型文件下载完成后，默认存放在 <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-300">{modelConfig.models_dir || './models'}</code> 目录下。
                </p>
                <p>
                  2. 若在国内使用，优先选择 <span className="font-semibold text-blue-700">ModelScope 魔搭源</span> 并搭配 <span className="font-mono">aria2c</span> 多线程下载，速度可达 50~100MB/s。
                </p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveCmdModel(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
              >
                {lang === 'zh' ? '关闭' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Model Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>{lang === 'zh' ? '添加自定义 GGUF 模型下载项' : 'Add Custom GGUF Model'}</span>
              </h4>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '模型名称与说明' : 'Model Name'}
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="例如: Qwen-3.8-Custom-Quant"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'zh' ? '模型角色类别' : 'Model Role'}
                  </label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="main_model">主推理模型 (-m)</option>
                    <option value="mmproj">视觉投影编码层 (--mmproj)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'zh' ? '量化档位' : 'Quantization'}
                  </label>
                  <select
                    value={customQuant}
                    onChange={(e) => setCustomQuant(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Q4_K_M">Q4_K_M (平衡推荐)</option>
                    <option value="Q2_K">Q2_K (极速低显存)</option>
                    <option value="Q5_K_M">Q5_K_M (高精度)</option>
                    <option value="Q6_K">Q6_K (高精度)</option>
                    <option value="Q8_0">Q8_0 (无损 8-bit)</option>
                    <option value="F16">F16 (全精度)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'zh' ? '保存文件名 (含 .gguf 后缀)' : 'GGUF File Name'}
                </label>
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="model-q4_k_m.gguf"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  🇨🇳 {lang === 'zh' ? 'ModelScope 魔搭下载直链' : 'ModelScope Download URL'}
                </label>
                <input
                  type="text"
                  value={customMsUrl}
                  onChange={(e) => setCustomMsUrl(e.target.value)}
                  placeholder="https://modelscope.cn/models/.../resolve/master/...gguf"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  🌐 {lang === 'zh' ? 'Hugging Face 下载直链 (可选)' : 'Hugging Face URL (Optional)'}
                </label>
                <input
                  type="text"
                  value={customHfUrl}
                  onChange={(e) => setCustomHfUrl(e.target.value)}
                  placeholder="https://huggingface.co/.../resolve/main/...gguf"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition"
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveCustomModel}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                {lang === 'zh' ? '保存并添加到模型库' : 'Save Model'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
