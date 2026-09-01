import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FolderKanban,
  X,
  Plus,
  Sliders,
  Camera,
  Layers,
  Palette,
  Check,
  Play,
  Upload,
  Image as ImageIcon,
  Tag,
  Wand2,
  Ratio
} from 'lucide-react';
import { Project, PromptModelTemplate, HistoryItem, GenerationParams } from '../types';

interface ManualPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectUuid: string | null;
  promptTemplates: PromptModelTemplate[];
  onAddPrompt: (newItem: HistoryItem, autoRunComfyUi?: boolean) => void;
}

const COMMON_TAGS = [
  '8k uhd', 'masterpiece', 'cinematic lighting', 'hyperrealistic', 'dslr',
  'cyberpunk', 'photorealistic', 'anime style', '国风水墨', '厚涂插画',
  '3D render', 'octane render', 'unreal engine 5', 'soft rim light', 'volumetric fog'
];

const ASPECT_RATIO_PRESETS: { label: string; ratio: string; width: number; height: number }[] = [
  { label: '16:9 (横屏宽幅)', ratio: '16:9', width: 1344, height: 768 },
  { label: '9:16 (竖屏短视频/手机)', ratio: '9:16', width: 768, height: 1344 },
  { label: '1:1 (正方形头像/插画)', ratio: '1:1', width: 1024, height: 1024 },
  { label: '4:3 (经典构图)', ratio: '4:3', width: 1152, height: 864 },
  { label: '3:4 (竖向人像摄影)', ratio: '3:4', width: 864, height: 1152 },
  { label: '21:9 (电影超宽荧幕)', ratio: '21:9', width: 1536, height: 640 },
];

export const ManualPromptModal: React.FC<ManualPromptModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectUuid,
  promptTemplates,
  onAddPrompt,
}) => {
  const [selectedProjectUuid, setSelectedProjectUuid] = useState<string>(
    activeProjectUuid || projects[0]?.uuid || ''
  );
  const [title, setTitle] = useState('');
  const [selectedModel, setSelectedModel] = useState(
    promptTemplates[0]?.model_name || 'KREA 2 TURBO'
  );
  const [positivePrompt, setPositivePrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [subjectType, setSubjectType] = useState('单人/虚拟人形');
  const [styleMedium, setStyleMedium] = useState('照片写实/真实摄影');
  const [visualMood, setVisualMood] = useState('电影胶片氛围');
  const [cameraLight, setCameraLight] = useState('逆光丁达尔光, 85mm镜头');
  const [customTags, setCustomTags] = useState<string[]>(['8k uhd', 'cinematic lighting']);
  const [newTagInput, setNewTagInput] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [width, setWidth] = useState(1344);
  const [height, setHeight] = useState(768);
  const [referenceImage, setReferenceImage] = useState<string>('');
  const [referenceFileName, setReferenceFileName] = useState('');

  // Generation Params
  const [cfgScale, setCfgScale] = useState(7.0);
  const [steps, setSteps] = useState(25);
  const [sampler, setSampler] = useState('euler');
  const [scheduler, setScheduler] = useState('normal');
  const [seed, setSeed] = useState(-1);
  const [denoise, setDenoise] = useState(1.0);

  // Sync active project if changed
  useEffect(() => {
    if (activeProjectUuid && projects.some((p) => p.uuid === activeProjectUuid)) {
      setSelectedProjectUuid(activeProjectUuid);
    }
  }, [activeProjectUuid, projects]);

  // When model changes, optionally update default template neg
  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName);
    const tpl = promptTemplates.find((t) => t.model_name.toLowerCase() === modelName.toLowerCase());
    if (tpl) {
      if (!negativePrompt.trim() && tpl.template_neg) {
        setNegativePrompt(tpl.template_neg);
      }
      if (tpl.default_params) {
        if (tpl.default_params.cfg_scale) setCfgScale(tpl.default_params.cfg_scale);
        if (tpl.default_params.steps) setSteps(tpl.default_params.steps);
        if (tpl.default_params.sampler) setSampler(tpl.default_params.sampler);
      }
    }
  };

  const handleApplyPresetTemplate = () => {
    const tpl = promptTemplates.find((t) => t.model_name.toLowerCase() === selectedModel.toLowerCase());
    if (tpl) {
      const sampleSubject = 'stunning character, graceful attire, elegant demeanor';
      const sampleBackground = 'ancient oriental pavilion with cherry blossom petals floating in mist';
      let pos = tpl.template_pos
        .replaceAll('{subject}', sampleSubject)
        .replaceAll('{action}', 'standing gracefully with soft breeze')
        .replaceAll('{background}', sampleBackground)
        .replaceAll('{style_list}', 'cinematic photography, masterpieces')
        .replaceAll('{style_weighted}', '(cinematic photography:1.2), (photorealistic:1.1)')
        .replaceAll('{light}', 'warm natural golden hour rim light')
        .replaceAll('{color_tone}', 'rich vibrant cinematic tones')
        .replaceAll('{camera}', '85mm f/1.4 lens, shallow depth of field')
        .replaceAll('{composition}', 'rule of thirds')
        .replaceAll('{detail}', 'intricate embroidery textures, 8k uhd')
        .replaceAll('{visual_mood}', 'serene ethereal atmosphere')
        .replaceAll('{environment}', sampleBackground);

      setPositivePrompt(pos);
      setNegativePrompt(tpl.template_neg);
      if (!title.trim()) {
        setTitle(`手写提示词-${selectedModel}-${Date.now().toString().slice(-4)}`);
      }
    }
  };

  const handleRatioSelect = (preset: typeof ASPECT_RATIO_PRESETS[0]) => {
    setAspectRatio(preset.ratio);
    setWidth(preset.width);
    setHeight(preset.height);
  };

  const handleAddTag = (tag: string) => {
    if (!tag.trim() || customTags.includes(tag.trim())) return;
    setCustomTags([...customTags, tag.trim()]);
    if (!positivePrompt.includes(tag.trim())) {
      setPositivePrompt((prev) => (prev ? `${prev}, ${tag.trim()}` : tag.trim()));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter((t) => t !== tagToRemove));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate placeholder SVG image data URL if no reference image uploaded
  const generatePlaceholderImage = (promptTitle: string, modelName: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#1E293B');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Decorative pattern
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 2;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }

      // Title & Model Info
      ctx.fillStyle = '#60A5FA';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(promptTitle || 'Custom Prompt', 50, height / 2 - 20);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '24px monospace';
      ctx.fillText(`${modelName} | ${aspectRatio} (${width}x${height})`, 50, height / 2 + 30);
      ctx.fillText(`手写提示词 / Manual Prompt`, 50, height / 2 + 70);
    }
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleSubmit = (autoRunComfyUi = false) => {
    if (!positivePrompt.trim()) return;

    const finalTitle = title.trim() || `手动提示词-${Date.now().toString().slice(-4)}`;
    const finalImg = referenceImage || generatePlaceholderImage(finalTitle, selectedModel);

    const genParams: GenerationParams = {
      cfg_scale: cfgScale,
      steps: steps,
      sampler: sampler,
      scheduler: scheduler,
      seed: seed,
      denoise: denoise,
      batch_size: 1,
    };

    const newItem: HistoryItem = {
      id: 'manual-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      project_uuid: selectedProjectUuid,
      origin_path: finalImg,
      thumb_path: finalImg,
      file_name: `${finalTitle}.png`,
      file_size_kb: Math.round(finalImg.length / 1024),
      dimensions: { width, height },
      aspect_ratio: aspectRatio,
      create_at: new Date().toISOString(),
      target_model: selectedModel,
      positive_prompt: positivePrompt.trim(),
      negative_prompt: negativePrompt.trim(),
      generation_params: genParams,
      execution_status: 'unexecuted',
      execution_progress: 0,
      skill_result_json: {
        skill_01_multidim_classification: {
          subject_content: subjectType,
          visual_medium: styleMedium,
          genre_worldview: '自定义世界观',
          commercial_use: '文生图项目创意',
          composition_camera: '标准构图',
          lighting_color: cameraLight,
          mood_atmosphere: visualMood,
          confidence: 1.0,
          tags: customTags,
        },
        skill_01_image_type: {
          image_type: subjectType,
          confidence: 1.0,
          tags: customTags,
        },
        skill_02_image_style: {
          style: [styleMedium, visualMood],
          style_weight: [1.0, 0.8],
          visual_mood: visualMood,
          medium: styleMedium,
        },
        skill_03_camera_param: {
          light: cameraLight,
          color_tone: 'Balanced cinematic colors',
          camera: '85mm lens',
          composition: 'rule of thirds',
        },
        skill_04_scene_content: {
          subject: subjectType,
          background: 'detailed environment',
          action: 'active',
        },
        skill_05_detail_desc: {
          detail: 'high quality textures, 8k uhd',
          emotion: visualMood,
        },
        skill_06_prompt_generate: {
          positive: positivePrompt.trim(),
          negative: negativePrompt.trim(),
          target_model: selectedModel,
          suggested_params: {
            cfg_scale: cfgScale,
            steps: steps,
            sampler: sampler,
            aspect_ratio: aspectRatio,
          },
        },
      },
      output_language: 'zh',
      notes: '用户手动编写添加',
    };

    onAddPrompt(newItem, autoRunComfyUi);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center space-x-2">
                <span>手动编写提示词加入项目</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                  Manual Prompt Creator
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                自定义正负提示词、多模态目标模型与生图参数，直接加入指定项目
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5 bg-slate-50/50">
          {/* Left Column: Basic Info, Prompts & Tags (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            {/* Target Project & Model Selector */}
            <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                  <span>目标所属项目 <span className="text-rose-500">*</span></span>
                </label>
                <select
                  value={selectedProjectUuid}
                  onChange={(e) => setSelectedProjectUuid(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  {projects.map((proj) => (
                    <option key={proj.uuid} value={proj.uuid}>
                      {proj.name} ({proj.target_model || '默认'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>目标生成模型 <span className="text-rose-500">*</span></span>
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  {promptTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.model_name}>
                      {tpl.model_name} ({tpl.display_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prompt Title */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                提示词标题 / 名称
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：赛博朋克雨夜武士、国风仙侠水墨山水..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Positive Prompt */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>正向提示词 (Positive Prompt) <span className="text-rose-500">*</span></span>
                </label>
                <button
                  onClick={handleApplyPresetTemplate}
                  className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline flex items-center space-x-1 font-medium"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>从模型模板填充示例</span>
                </button>
              </div>
              <textarea
                rows={5}
                value={positivePrompt}
                onChange={(e) => setPositivePrompt(e.target.value)}
                placeholder="在此输入英文或中文正向提示词，如 (masterpiece:1.2), high quality, 1girl, atmospheric lighting, 8k uhd..."
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-500 leading-relaxed bg-slate-50/50"
              />
              <div className="text-[10px] text-slate-400 text-right">
                字数：{positivePrompt.length}
              </div>
            </div>

            {/* Negative Prompt */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  负向提示词 (Negative Prompt)
                </label>
                <button
                  onClick={() => {
                    const tpl = promptTemplates.find((t) => t.model_name.toLowerCase() === selectedModel.toLowerCase());
                    if (tpl) setNegativePrompt(tpl.template_neg);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
                >
                  填充默认负向过滤词
                </button>
              </div>
              <textarea
                rows={2}
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="例如：blurry, bad quality, distortion, lowres, watermark..."
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:border-blue-500 leading-relaxed bg-slate-50/50"
              />
            </div>

            {/* Quick Tags Add */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <label className="block text-xs font-semibold text-slate-700 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>常用质量与画风标签快速添加</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-[10px] font-mono transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Aspect Ratio, ComfyUI Params & Optional Ref Image (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            {/* Aspect Ratio & Resolution Preset */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Ratio className="w-3.5 h-3.5 text-amber-600" />
                <span>图片比例与生成尺寸</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {ASPECT_RATIO_PRESETS.map((p) => (
                  <button
                    key={p.ratio}
                    onClick={() => handleRatioSelect(p)}
                    className={`px-2 py-1.5 rounded-lg border text-left text-[11px] transition flex flex-col ${
                      aspectRatio === p.ratio
                        ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-semibold ring-1 ring-amber-400/30'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-mono">{p.ratio}</span>
                    <span className="text-[9px] text-slate-500 font-normal">{p.width}x{p.height}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500">宽度 (px)</span>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 1024)}
                    className="w-full px-2 py-1 font-mono rounded border border-slate-300"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">高度 (px)</span>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 1024)}
                    className="w-full px-2 py-1 font-mono rounded border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* ComfyUI Parameters */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>ComfyUI 生图调度参数</span>
              </label>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px]">CFG Scale: {cfgScale}</span>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={0.5}
                    value={cfgScale}
                    onChange={(e) => setCfgScale(parseFloat(e.target.value))}
                    className="w-28 accent-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-[11px]">Steps (迭代步数): {steps}</span>
                  <input
                    type="range"
                    min={4}
                    max={60}
                    step={1}
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value))}
                    className="w-28 accent-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">采样器 (Sampler)</span>
                    <select
                      value={sampler}
                      onChange={(e) => setSampler(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                    >
                      <option value="euler">euler</option>
                      <option value="euler_ancestral">euler_ancestral</option>
                      <option value="dpmpp_2m">dpmpp_2m</option>
                      <option value="dpmpp_2m_sde">dpmpp_2m_sde</option>
                      <option value="uni_pc">uni_pc</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">调度器 (Scheduler)</span>
                    <select
                      value={scheduler}
                      onChange={(e) => setScheduler(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                    >
                      <option value="normal">normal</option>
                      <option value="karras">karras</option>
                      <option value="exponential">exponential</option>
                      <option value="sgm_uniform">sgm_uniform</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Reference Image Upload */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <label className="block text-xs font-semibold text-slate-700 flex items-center space-x-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>可选参考配图 / 缩略图</span>
              </label>

              {referenceImage ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 group">
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-full h-28 object-contain"
                  />
                  <button
                    onClick={() => {
                      setReferenceImage('');
                      setReferenceFileName('');
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-rose-400 hover:text-rose-300 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 text-[9px] bg-slate-900/80 text-slate-300 px-1.5 py-0.5 rounded font-mono truncate max-w-[150px]">
                    {referenceFileName || '已上传参考图'}
                  </span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[11px] font-medium text-slate-600">点击上传参考图 (可选)</span>
                  <span className="text-[9px] text-slate-400">未上传时将自动生成卡片封面占位图</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>将被加入项目：<strong className="text-slate-800">{projects.find((p) => p.uuid === selectedProjectUuid)?.name || '当前项目'}</strong></span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              取消
            </button>

            <button
              onClick={() => handleSubmit(false)}
              disabled={!positivePrompt.trim()}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>保存加入项目</span>
            </button>

            <button
              onClick={() => handleSubmit(true)}
              disabled={!positivePrompt.trim()}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
              title="保存并直接排队发送至 ComfyUI REST API 生成图片"
            >
              <Play className="w-4 h-4" />
              <span>保存并立即生图</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
