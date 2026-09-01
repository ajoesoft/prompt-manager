import React, { useState, useEffect, useMemo } from 'react';
import {
  Workflow,
  Check,
  Plus,
  Trash2,
  Download,
  Upload,
  Save,
  RotateCcw,
  Sparkles,
  FileCode,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Activity,
  Server,
  Play,
  Copy,
  Layers,
  ChevronDown,
  ChevronRight,
  Eye,
  Info,
  Maximize2,
  Cpu
} from 'lucide-react';
import { ComfyUiWorkflowTemplate, ComfyUiNodeMapping } from '../types';
import { DEFAULT_COMFY_WORKFLOWS } from '../data/defaultComfyWorkflows';
import {
  validateWorkflowJson,
  formatWorkflowJson,
  buildComfyUiWorkflowGraph,
  checkComfyUiHealth,
  queueComfyUiPrompt,
  pollComfyUiExecution
} from '../services/comfyUiService';
import { useLanguage } from '../i18n/LanguageContext';

interface ComfyWorkflowSettingsTabProps {
  workflows: ComfyUiWorkflowTemplate[];
  activeWorkflowId: string;
  comfyEndpoint?: string;
  onUpdateWorkflow: (workflow: ComfyUiWorkflowTemplate) => void;
  onAddWorkflow: (workflow: ComfyUiWorkflowTemplate) => void;
  onDeleteWorkflow: (id: string) => void;
  onSetActiveWorkflow: (id: string) => void;
  onResetWorkflows: () => void;
  onUpdateEndpoint?: (endpoint: string) => void;
}

export const ComfyWorkflowSettingsTab: React.FC<ComfyWorkflowSettingsTabProps> = ({
  workflows,
  activeWorkflowId,
  comfyEndpoint = 'http://127.0.0.1:8188',
  onUpdateWorkflow,
  onAddWorkflow,
  onDeleteWorkflow,
  onSetActiveWorkflow,
  onResetWorkflows,
  onUpdateEndpoint,
}) => {
  const { t, lang } = useLanguage();

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    activeWorkflowId || workflows[0]?.id || 'z-image-turbo'
  );

  const selectedWorkflow = useMemo(() => {
    return (
      workflows.find((w) => w.id === selectedWorkflowId) ||
      workflows[0] ||
      DEFAULT_COMFY_WORKFLOWS[0]
    );
  }, [workflows, selectedWorkflowId]);

  // Editor states
  const [nameDraft, setNameDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [modelDraft, setModelDraft] = useState('');
  const [jsonDraft, setJsonDraft] = useState('');
  const [typeDraft, setTypeDraft] = useState<ComfyUiWorkflowTemplate['workflow_type']>('turbo');
  const [nodeMappingDraft, setNodeMappingDraft] = useState<ComfyUiNodeMapping>({});
  const [showMappingConfig, setShowMappingConfig] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Sync draft when selected workflow changes
  useEffect(() => {
    if (selectedWorkflow) {
      setNameDraft(selectedWorkflow.name || '');
      setDescDraft(selectedWorkflow.description || '');
      setModelDraft(selectedWorkflow.target_model || '');
      setJsonDraft(selectedWorkflow.workflow_json || '');
      setTypeDraft(selectedWorkflow.workflow_type || 'turbo');
      setNodeMappingDraft(selectedWorkflow.node_mappings || {});
    }
  }, [selectedWorkflow?.id]);

  // Server health test state
  const [endpointInput, setEndpointInput] = useState(comfyEndpoint);
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverHealth, setServerHealth] = useState<{
    ok: boolean;
    online: boolean;
    devices?: any;
    queueRemaining?: number;
    error?: string;
  } | null>(null);

  // Test simulation state
  const [testPosPrompt, setTestPosPrompt] = useState(
    'A cinematic masterpiece portrait of a cyberpunk ronin, glowing neon katana, rain reflections, 8k uhd, photorealistic'
  );
  const [testNegPrompt, setTestNegPrompt] = useState(
    'blurry, low quality, bad anatomy, deformed limbs, watermark'
  );
  const [testWidth, setTestWidth] = useState(1024);
  const [testHeight, setTestHeight] = useState(1024);
  const [testSteps, setTestSteps] = useState(8);
  const [testCfg, setTestCfg] = useState(1.8);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testStatusText, setTestStatusText] = useState('');
  const [testResultImages, setTestResultImages] = useState<string[]>([]);
  const [testError, setTestError] = useState<string | null>(null);

  // Save notice
  const [saveNotice, setSaveNotice] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // JSON Validation computation
  const validation = useMemo(() => {
    return validateWorkflowJson(jsonDraft);
  }, [jsonDraft]);

  // New Workflow Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfId, setNewWfId] = useState('');
  const [newWfDesc, setNewWfDesc] = useState('');
  const [newWfType, setNewWfType] = useState<ComfyUiWorkflowTemplate['workflow_type']>('turbo');

  // Handle server connection test
  const handleTestServer = async () => {
    setIsTestingServer(true);
    setServerHealth(null);
    try {
      const result = await checkComfyUiHealth(endpointInput);
      setServerHealth(result);
      if (result.ok && onUpdateEndpoint) {
        onUpdateEndpoint(endpointInput);
      }
    } catch (err: any) {
      setServerHealth({
        ok: false,
        online: false,
        error: err.message || '无法连接 ComfyUI 服务',
      });
    } finally {
      setIsTestingServer(false);
    }
  };

  // Format JSON
  const handleFormatJson = () => {
    const formatted = formatWorkflowJson(jsonDraft);
    setJsonDraft(formatted);
  };

  // Save Workflow
  const handleSaveWorkflow = () => {
    if (!validation.valid) {
      alert(lang === 'zh' ? `工作流 JSON 存在语法错误，请修正后再保存: ${validation.error}` : `Workflow JSON error: ${validation.error}`);
      return;
    }

    const updated: ComfyUiWorkflowTemplate = {
      ...selectedWorkflow,
      name: nameDraft.trim() || selectedWorkflow.name,
      description: descDraft.trim(),
      target_model: modelDraft.trim(),
      workflow_type: typeDraft,
      workflow_json: jsonDraft,
      node_mappings: nodeMappingDraft,
      updated_at: new Date().toISOString(),
    };

    onUpdateWorkflow(updated);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2500);
  };

  // Set as Active
  const handleSetDefault = (id: string) => {
    onSetActiveWorkflow(id);
  };

  // Export Workflow JSON
  const handleExportJson = () => {
    const blob = new Blob([jsonDraft], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedWorkflow.id || 'comfyui-workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Workflow JSON from file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        const val = validateWorkflowJson(content);
        if (!val.valid) {
          alert(`导入文件校验失败: ${val.error}`);
          return;
        }
        setJsonDraft(formatWorkflowJson(content));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Create New Workflow
  const handleCreateNewWorkflow = () => {
    if (!newWfName.trim()) return;
    const cleanId = (newWfId.trim() || newWfName.trim())
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');

    // Base template from Z-Image Turbo
    const baseWf = DEFAULT_COMFY_WORKFLOWS[0];

    const newWf: ComfyUiWorkflowTemplate = {
      id: cleanId + '_' + Date.now().toString(36),
      name: newWfName.trim(),
      description: newWfDesc.trim() || '自定义 ComfyUI 文生图工作流',
      badge_color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      target_model: 'Custom / SDXL',
      workflow_type: newWfType,
      workflow_json: baseWf.workflow_json,
      node_mappings: { ...baseWf.node_mappings },
      is_builtin: false,
      is_default: false,
      updated_at: new Date().toISOString(),
    };

    onAddWorkflow(newWf);
    setSelectedWorkflowId(newWf.id);
    setShowNewModal(false);
    setNewWfName('');
    setNewWfId('');
    setNewWfDesc('');
  };

  // Generate payload preview graph
  const simulatedPayload = useMemo(() => {
    try {
      const draftTemplate: ComfyUiWorkflowTemplate = {
        ...selectedWorkflow,
        workflow_json: jsonDraft,
        node_mappings: nodeMappingDraft,
      };
      return buildComfyUiWorkflowGraph({
        positivePrompt: testPosPrompt,
        negativePrompt: testNegPrompt,
        width: testWidth,
        height: testHeight,
        steps: testSteps,
        cfgScale: testCfg,
        samplerName: 'euler',
        scheduler: 'simple',
        seed: 42,
        denoise: 1.0,
        batchSize: 1,
        filenamePrefix: 'TestWorkflow',
        workflowTemplate: draftTemplate,
      });
    } catch {
      return null;
    }
  }, [
    selectedWorkflow,
    jsonDraft,
    nodeMappingDraft,
    testPosPrompt,
    testNegPrompt,
    testWidth,
    testHeight,
    testSteps,
    testCfg,
  ]);

  // Execute direct test run on ComfyUI
  const handleRunTestGeneration = async () => {
    if (!simulatedPayload) {
      alert('工作流配置存在错误，无法生成有效 Payload');
      return;
    }
    setIsTestRunning(true);
    setTestProgress(10);
    setTestStatusText('正在连接 ComfyUI 并提交工作流...');
    setTestError(null);
    setTestResultImages([]);

    try {
      const queueRes = await queueComfyUiPrompt(endpointInput, simulatedPayload);
      setTestProgress(25);
      setTestStatusText(`任务已排队 (ID: ${queueRes.prompt_id.substring(0, 8)}...)`);

      const res = await pollComfyUiExecution(
        endpointInput,
        queueRes.prompt_id,
        (p, text) => {
          setTestProgress(p);
          setTestStatusText(text);
        }
      );

      if (res.outputImages && res.outputImages.length > 0) {
        setTestResultImages(res.outputImages);
        setTestProgress(100);
        setTestStatusText(`生成完成! 耗时: ${(res.durationMs / 1000).toFixed(1)}s`);
      } else {
        throw new Error('ComfyUI 执行完成，但未返回图片');
      }
    } catch (err: any) {
      setTestError(err.message || '执行测试失败');
    } finally {
      setIsTestRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. ComfyUI Endpoint Header Banner */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
              <span>ComfyUI 文生图工作流调度中心</span>
              <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-300">
                z-image-turbo 架构支持
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              统一调度文生图工作流，根据正向词 positive_prompt、反向词 negative_prompt、图片高宽 (image_height, image_width) 动态生成并下发
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={endpointInput}
              onChange={(e) => setEndpointInput(e.target.value)}
              placeholder="http://127.0.0.1:8188"
              className="text-xs font-mono bg-transparent border-none focus:outline-hidden w-40 text-slate-700"
            />
          </div>
          <button
            type="button"
            onClick={handleTestServer}
            disabled={isTestingServer}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <Activity className={`w-3.5 h-3.5 ${isTestingServer ? 'animate-spin' : 'text-emerald-600'}`} />
            <span>{isTestingServer ? '检测中...' : '测试 ComfyUI 服务'}</span>
          </button>
        </div>
      </div>

      {/* Server Health Result Notice */}
      {serverHealth && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            serverHealth.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {serverHealth.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>
              {serverHealth.ok
                ? `ComfyUI 服务连接正常！队列待处理任务: ${serverHealth.queueRemaining ?? 0} 个`
                : `ComfyUI 连接失败: ${serverHealth.error}`}
            </span>
          </div>
          {serverHealth.devices && serverHealth.devices.length > 0 && (
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
              GPU: {serverHealth.devices[0]?.name || 'CUDA Device'}
            </span>
          )}
        </div>
      )}

      {/* 2. Main Two-Column Workflow Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Column: Workflow Selector & Management (4 cols) */}
        <div className="md:col-span-4 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  工作流配置列表 ({workflows.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-semibold flex items-center space-x-1 transition"
              >
                <Plus className="w-3 h-3" />
                <span>新建工作流</span>
              </button>
            </div>

            {/* List of workflows */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {workflows.map((wf) => {
                const isSelected = wf.id === selectedWorkflow.id;
                const isDefault = wf.id === activeWorkflowId || wf.is_default;
                return (
                  <div
                    key={wf.id}
                    onClick={() => setSelectedWorkflowId(wf.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition relative space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-400 shadow-xs'
                        : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <span className="truncate">{wf.name}</span>
                      </div>
                      {isDefault && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 shrink-0">
                          默认生效
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {wf.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] font-mono text-slate-400">
                        {wf.target_model || 'SDXL / Turbo'}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        {!isDefault && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(wf.id);
                            }}
                            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            设为默认
                          </button>
                        )}
                        {!wf.is_builtin && workflows.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`确定删除工作流 "${wf.name}" 吗？`)) {
                                onDeleteWorkflow(wf.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-0.5 transition"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Reset to defaults button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('确认重置并重新载入内置的 z-image-turbo 及官方工作流预设？')) {
                    onResetWorkflows();
                  }
                }}
                className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center space-x-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>恢复官方预设 (含 z-image-turbo)</span>
              </button>
            </div>
          </div>

          {/* Placeholders Quick Reference Guide */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-slate-100 flex items-center space-x-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>动态生图参数插值占位符</span>
            </div>
            <div className="space-y-1 font-mono text-[10px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-emerald-400 font-semibold">{`{{positive_prompt}}`}</span>
                <span className="text-slate-400">正向提示词文本</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-400 font-semibold">{`{{negative_prompt}}`}</span>
                <span className="text-slate-400">反向提示词过滤</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400 font-semibold">{`{{image_width}}`} / {`{{width}}`}</span>
                <span className="text-slate-400">图片生成宽度 (px)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400 font-semibold">{`{{image_height}}`} / {`{{height}}`}</span>
                <span className="text-slate-400">图片生成高度 (px)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-400 font-semibold">{`{{steps}}`} / {`{{cfg_scale}}`}</span>
                <span className="text-slate-400">采样步数与相关性</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-400 font-semibold">{`{{sampler_name}}`} / {`{{seed}}`}</span>
                <span className="text-slate-400">采样算法与随机种子</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Editor & Inspection (8 cols) */}
        <div className="md:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            {/* Header with Title & Action toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  工作流配置与 JSON 图谱定义
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${selectedWorkflow.badge_color || 'bg-slate-100 text-slate-700'}`}>
                  {selectedWorkflow.id}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>导入 .json</span>
                  <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出 .json</span>
                </button>

                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition"
                >
                  <span>格式化 JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveWorkflow}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>保存工作流</span>
                </button>
              </div>
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  工作流显示名称 *
                </label>
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="例如: Z-Image Turbo 极速工作流 (z-image-turbo.json)"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  适配架构类型
                </label>
                <select
                  value={typeDraft}
                  onChange={(e) => setTypeDraft(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                >
                  <option value="turbo">Turbo 极速 (8-12步)</option>
                  <option value="sdxl">SDXL / SD1.5 常规</option>
                  <option value="flux">Flux.1 Schnell / Dev</option>
                  <option value="qwen">Qwen-Image / DiT</option>
                  <option value="custom">自定义工作流</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                工作流描述与出图特性
              </label>
              <input
                type="text"
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                placeholder="工作流说明与使用场景..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Smart Node Detection Badge Strip */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>智能节点解析与参数映射检测:</span>
                </span>
                <span className={`font-mono font-bold ${validation.valid ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {validation.valid ? `✅ 有效工作流 (${validation.nodeCount} 个节点)` : `❌ ${validation.error}`}
                </span>
              </div>

              {validation.valid && validation.detectedNodes && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">正向提示词 Node:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      Node {nodeMappingDraft.positive_prompt_node || validation.detectedNodes.positiveNodeId || '未检测'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">反向提示词 Node:</span>
                    <span className="font-mono font-bold text-rose-600">
                      Node {nodeMappingDraft.negative_prompt_node || validation.detectedNodes.negativeNodeId || '未检测'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">高宽 Latent Node:</span>
                    <span className="font-mono font-bold text-blue-600">
                      Node {nodeMappingDraft.latent_image_node || validation.detectedNodes.latentNodeId || '未检测'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">KSampler 采样 Node:</span>
                    <span className="font-mono font-bold text-purple-600">
                      Node {nodeMappingDraft.sampler_node || validation.detectedNodes.samplerNodeId || '未检测'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* JSON Code Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>ComfyUI API Prompt 图谱 JSON 源码:</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  支持插入占位符 (已内置容错反序列化引擎)
                </span>
              </div>

              {/* One-click Placeholder Insert Chips */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>快捷插入占位符:</span>
                </span>
                {[
                  { tag: '{{positive_prompt}}', label: '正向词', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                  { tag: '{{negative_prompt}}', label: '反向词', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
                  { tag: '{{image_width}}', label: '宽度', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                  { tag: '{{image_height}}', label: '高度', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                  { tag: '{{steps}}', label: '步数', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                  { tag: '{{cfg_scale}}', label: 'CFG', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                  { tag: '{{seed}}', label: '随机种子', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                  { tag: '{{sampler_name}}', label: '采样器', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(item.tag);
                      setJsonDraft((prev) => prev + `\n/* ${item.tag} */`);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border transition hover:scale-105 active:scale-95 flex items-center space-x-1 ${item.color}`}
                    title={`点击复制 ${item.tag} 并附加到 JSON`}
                  >
                    <span>{item.tag}</span>
                    <span className="opacity-70 text-[10px]">({item.label})</span>
                  </button>
                ))}
              </div>

              <textarea
                value={jsonDraft}
                onChange={(e) => setJsonDraft(e.target.value)}
                className="w-full h-80 p-3 text-xs font-mono bg-slate-900 text-slate-100 rounded-xl focus:outline-hidden resize-none leading-relaxed border border-slate-800 shadow-inner"
                spellCheck={false}
              />
            </div>

            {/* Save Success Alert */}
            {saveNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  工作流配置已成功保存！文生图与 ComfyUI 生图将统一使用此工作流。
                </span>
              </div>
            )}
          </div>

          {/* 3. Live Simulation & Test Generation Sandbox */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  工作流动态下发模拟与实时生图测试
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(!showPreviewModal)}
                className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showPreviewModal ? '隐藏 Payload 源码' : '查看下发 Payload 源码'}</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    输入正向提示词 (positive_prompt)
                  </label>
                  <textarea
                    value={testPosPrompt}
                    onChange={(e) => setTestPosPrompt(e.target.value)}
                    rows={2}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    输入反向提示词 (negative_prompt)
                  </label>
                  <textarea
                    value={testNegPrompt}
                    onChange={(e) => setTestNegPrompt(e.target.value)}
                    rows={2}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    图片宽 (image_width)
                  </label>
                  <input
                    type="number"
                    value={testWidth}
                    onChange={(e) => setTestWidth(parseInt(e.target.value) || 1024)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    图片高 (image_height)
                  </label>
                  <input
                    type="number"
                    value={testHeight}
                    onChange={(e) => setTestHeight(parseInt(e.target.value) || 1024)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    采样步数 (steps)
                  </label>
                  <input
                    type="number"
                    value={testSteps}
                    onChange={(e) => setTestSteps(parseInt(e.target.value) || 8)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    相关性 (cfg_scale)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={testCfg}
                    onChange={(e) => setTestCfg(parseFloat(e.target.value) || 1.8)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Action test button */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleRunTestGeneration}
                    disabled={isTestRunning || !validation.valid}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isTestRunning ? 'animate-spin' : ''}`} />
                    <span>{isTestRunning ? 'ComfyUI 生成中...' : '向 ComfyUI 发送生图测试'}</span>
                  </button>

                  {isTestRunning && (
                    <span className="text-xs text-blue-600 font-semibold">
                      {testStatusText} ({testProgress}%)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (simulatedPayload) {
                      navigator.clipboard.writeText(JSON.stringify(simulatedPayload, null, 2));
                      setCopiedPayload(true);
                      setTimeout(() => setCopiedPayload(false), 2000);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">已复制 Payload</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>复制生成 Payload</span>
                    </>
                  )}
                </button>
              </div>

              {/* Test Error display */}
              {testError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{testError}</span>
                </div>
              )}

              {/* Test Images output */}
              {testResultImages.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ComfyUI 生图成功:</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {testResultImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-300 shadow-sm max-w-xs">
                        <img src={imgUrl} alt="ComfyUI output" className="w-full h-auto object-cover" />
                        <a
                          href={imgUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white rounded text-[10px] font-semibold hover:bg-black"
                        >
                          查看大图
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payload Preview Modal / Box */}
              {showPreviewModal && simulatedPayload && (
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 border border-slate-800">
                  <pre>{JSON.stringify(simulatedPayload, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Create New Workflow */}
      {showNewModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-800">新建 ComfyUI 文生图工作流</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  工作流名称 *
                </label>
                <input
                  type="text"
                  value={newWfName}
                  onChange={(e) => setNewWfName(e.target.value)}
                  placeholder="例如: Z-Image-Turbo 特殊定制版"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  唯一标识 ID (英文/数字)
                </label>
                <input
                  type="text"
                  value={newWfId}
                  onChange={(e) => setNewWfId(e.target.value)}
                  placeholder="例如: custom_z_image_turbo"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  工作流架构类型
                </label>
                <select
                  value={newWfType}
                  onChange={(e) => setNewWfType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                >
                  <option value="turbo">Turbo 极速生图 (SDXL / Z-Image)</option>
                  <option value="sdxl">SDXL / SD1.5 标准 KSampler</option>
                  <option value="flux">Flux.1 Schnell / Dev</option>
                  <option value="qwen">Qwen-Image / DiT</option>
                  <option value="custom">自定义空白工作流</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  工作流说明 (可选)
                </label>
                <input
                  type="text"
                  value={newWfDesc}
                  onChange={(e) => setNewWfDesc(e.target.value)}
                  placeholder="描述此工作流的特点与采样方式..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreateNewWorkflow}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                立即创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
