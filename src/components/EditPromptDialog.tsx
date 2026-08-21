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
  CheckCircle2
} from 'lucide-react';
import { HistoryItem, PromptModelTemplate, SkillResultJson } from '../types';

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
  if (!item) return null;

  const [activeTab, setActiveTab] = useState<'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5' | 'stage6'>('stage6');
  const [targetModel, setTargetModel] = useState<string>(item.target_model);
  const [positivePrompt, setPositivePrompt] = useState<string>(item.positive_prompt);
  const [negativePrompt, setNegativePrompt] = useState<string>(item.negative_prompt);
  const [notes, setNotes] = useState<string>(item.notes || '');

  // Cloned editable skill result
  const [skillJson, setSkillJson] = useState<SkillResultJson>(() => JSON.parse(JSON.stringify(item.skill_result_json)));

  const [copiedPos, setCopiedPos] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setTargetModel(item.target_model);
    setPositivePrompt(item.positive_prompt);
    setNegativePrompt(item.negative_prompt);
    setNotes(item.notes || '');
    setSkillJson(JSON.parse(JSON.stringify(item.skill_result_json)));
  }, [item]);

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
                单条反推详情检视与多维度编辑
              </h3>
              <p className="text-[11px] text-slate-500">
                文件: {item.file_name} · 创建于 {item.create_at}
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
                  <span>已保存至 SQLite!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存修改</span>
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
                <span>原图元数据</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>文件大小: {item.file_size_kb} KB</div>
                <div>反推耗时: {item.execution_time_ms || 1800} ms</div>
                <div>类型置信度: {(Number(skillJson.skill_01_image_type?.confidence || 0.95) * 100).toFixed(0)}%</div>
                <div>格式: PNG/RGB 1024px</div>
              </div>
            </div>

            {/* Notes input */}
            <div className="space-y-1 text-xs">
              <label className="text-slate-600 font-medium text-[11px]">自定义备注 (Notes):</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="记录反推灵感或特定出图 LoRA 配合方案..."
                className="w-full h-20 p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none shadow-2xs"
              />
            </div>
          </div>

          {/* Right Editor Tabs Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-full bg-white">
            {/* Stage Tabs Navigation */}
            <div className="flex items-center space-x-1.5 p-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab('stage6')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage6'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                🎯 06. 最终提示词组装
              </button>

              <button
                onClick={() => setActiveTab('stage1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage1'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                📷 01. 类型分类
              </button>

              <button
                onClick={() => setActiveTab('stage2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage2'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                🎨 02. 美术风格
              </button>

              <button
                onClick={() => setActiveTab('stage3')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage3'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                💡 03. 灯光相机
              </button>

              <button
                onClick={() => setActiveTab('stage4')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage4'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                🎬 04. 画面主体
              </button>

              <button
                onClick={() => setActiveTab('stage5')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'stage5'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                🔍 05. 细粒度微观
              </button>
            </div>

            {/* Tab Panes */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB 6: PROMPT GENERATION */}
              {activeTab === 'stage6' && (
                <div className="space-y-4">
                  {/* Model Switcher Toolbar */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-slate-800">切换目标生图模型:</span>
                      <select
                        value={targetModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-blue-700 font-semibold focus:outline-none focus:border-blue-500 shadow-2xs"
                      >
                        {promptTemplates.map((t) => (
                          <option key={t.id} value={t.model_name}>
                            {t.display_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleManualReassemble}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-blue-700 text-xs font-medium border border-slate-200 shadow-2xs transition"
                      title="根据前5阶段数据重新套用模板组装提示词"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>重新组装提示词</span>
                    </button>
                  </div>

                  {/* Positive Prompt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-800 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>正向提示词 (Positive Prompt)</span>
                      </label>
                      <button
                        onClick={handleCopyPositive}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                      >
                        {copiedPos ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPos ? '已复制' : '复制正向词'}</span>
                      </button>
                    </div>
                    <textarea
                      value={positivePrompt}
                      onChange={(e) => setPositivePrompt(e.target.value)}
                      rows={5}
                      className="w-full p-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 leading-relaxed shadow-2xs transition"
                    />
                  </div>

                  {/* Negative Prompt */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-rose-700 flex items-center space-x-1.5">
                        <span>负向过滤词 (Negative Prompt)</span>
                      </label>
                      <button
                        onClick={handleCopyNegative}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
                      >
                        {copiedNeg ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedNeg ? '已复制' : '复制负向词'}</span>
                      </button>
                    </div>
                    <textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 leading-relaxed shadow-2xs transition"
                    />
                  </div>
                </div>
              )}

              {/* TAB 1: IMAGE TYPE */}
              {activeTab === 'stage1' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">主分类 (Image Type):</label>
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
                      <label className="text-slate-600 font-medium block mb-1">子分类 (Sub-Category):</label>
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
                    <label className="text-slate-600 font-medium block mb-1">特征标签 (Tags 逗号分隔):</label>
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
                    <label className="text-slate-600 font-medium block mb-1">美术流派风格 (逗号分隔):</label>
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
                      <label className="text-slate-600 font-medium block mb-1">视觉氛围 (Visual Mood):</label>
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
                      <label className="text-slate-600 font-medium block mb-1">艺术表现媒介 (Medium):</label>
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
                    <label className="text-slate-600 font-medium block mb-1">主光与光影质感 (Lighting):</label>
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
                    <label className="text-slate-600 font-medium block mb-1">色彩倾向与色调 (Color Tone):</label>
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
                      <label className="text-slate-600 font-medium block mb-1">推测摄影器材/镜头 (Camera):</label>
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
                      <label className="text-slate-600 font-medium block mb-1">构图法则与透视 (Composition):</label>
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
                    <label className="text-slate-600 font-medium block mb-1">画面核心主体 (Subject):</label>
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
                    <label className="text-slate-600 font-medium block mb-1">背景环境 (Background):</label>
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
                    <label className="text-slate-600 font-medium block mb-1">动态交互动作 (Action):</label>
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
                    <label className="text-slate-600 font-medium block mb-1">微观肌理/材质细节 (Micro Details):</label>
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
                      <label className="text-slate-600 font-medium block mb-1">隐匿情绪心境 (Emotion):</label>
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
                      <label className="text-slate-600 font-medium block mb-1">服饰或道具特征 (Attire / Props):</label>
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

