import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Download,
  Play,
  CheckCircle2,
  Clock,
  Settings2,
  Layers,
  Sparkles,
  Server,
  FolderOpen,
  Calendar,
  AlertCircle,
  FileJson,
  X,
  RefreshCw,
  Sliders,
  Check,
  Zap,
  Code
} from 'lucide-react';
import {
  Project,
  ProjectExportFilter,
  ProjectExportJson,
  PromptModelTemplate,
  HistoryItem
} from '../types';
import { ASPECT_RATIO_OPTIONS, DIMENSION_PRESETS } from '../data/defaultProjects';
import { checkComfyUiHealth } from '../services/comfyUiService';

interface ProjectManagementModalProps {
  isOpen?: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectUuid: string | null;
  initialProjectUuid?: string | null;
  initialEditing?: boolean;
  onSelectProject?: (uuid: string) => void;
  onSelectActiveProject?: (uuid: string) => void;
  onCreateProject: (data: Partial<Project>) => Project;
  onUpdateProject: (uuid: string, updates: Partial<Project>) => void;
  onDeleteProject: (uuid: string) => void;
  onDuplicateProject?: (uuid: string) => void;
  promptTemplates: PromptModelTemplate[];
  historyList: HistoryItem[];
  onExecuteProjectUnexecuted?: (uuid: string) => Promise<{ total: number; success: number; failed: number }>;
  onExecuteUnexecuted?: (uuid: string) => Promise<{ total: number; success: number; failed: number }>;
  onExecuteItem?: (id: string) => Promise<void>;
  onDownloadProjectJson: (uuid: string, filter: ProjectExportFilter) => void;
  onExportProjectJson: (uuid: string, filter: ProjectExportFilter) => ProjectExportJson;
  isComfyUiBatchRunning?: boolean;
}

export const ProjectManagementModal: React.FC<ProjectManagementModalProps> = ({
  isOpen = true,
  onClose,
  projects,
  activeProjectUuid,
  initialProjectUuid,
  initialEditing = false,
  onSelectProject,
  onSelectActiveProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onDuplicateProject,
  promptTemplates,
  historyList,
  onExecuteProjectUnexecuted,
  onExecuteUnexecuted,
  onDownloadProjectJson,
  onExportProjectJson,
  isComfyUiBatchRunning = false,
}) => {
  const handleSelectActive = onSelectActiveProject || onSelectProject || (() => {});
  const handleBatchRun = onExecuteProjectUnexecuted || onExecuteUnexecuted || (async () => ({ total: 0, success: 0, failed: 0 }));

  const [selectedProjectUuid, setSelectedProjectUuid] = useState<string>(
    initialProjectUuid || activeProjectUuid || projects[0]?.uuid || ''
  );
  const [isEditing, setIsEditing] = useState<boolean>(initialEditing);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'export' | 'comfyui'>('details');

  // Form State
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [comfyUiStatus, setComfyUiStatus] = useState<{
    checked: boolean;
    online: boolean;
    error?: string;
  }>({ checked: false, online: false });
  const [isCheckingComfy, setIsCheckingComfy] = useState(false);
  const [exportFilter, setExportFilter] = useState<ProjectExportFilter>('all');
  const [jsonPreview, setJsonPreview] = useState<string>('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [batchRunResult, setBatchRunResult] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const currentProject = projects.find((p) => p.uuid === selectedProjectUuid) || projects[0];

  // Update selected project if initialProjectUuid or active changes
  useEffect(() => {
    if (initialProjectUuid && projects.some((p) => p.uuid === initialProjectUuid)) {
      setSelectedProjectUuid(initialProjectUuid);
    } else if (activeProjectUuid && projects.some((p) => p.uuid === activeProjectUuid)) {
      setSelectedProjectUuid(activeProjectUuid);
    }
  }, [initialProjectUuid, activeProjectUuid, projects]);

  // Load project into form
  useEffect(() => {
    if (currentProject && !isCreating) {
      setFormData({
        name: currentProject.name,
        description: currentProject.description,
        scheduled_time: currentProject.scheduled_time,
        output_dir: currentProject.output_dir,
        target_model: currentProject.target_model,
        dimensions: currentProject.dimensions,
        aspect_ratio: currentProject.aspect_ratio,
        comfyui_config: { ...currentProject.comfyui_config },
        tags: [...currentProject.tags],
      });
    }
  }, [currentProject, isCreating]);

  // Update JSON Preview
  useEffect(() => {
    if (currentProject) {
      const data = onExportProjectJson(currentProject.uuid, exportFilter);
      setJsonPreview(JSON.stringify(data, null, 2));
    }
  }, [currentProject, exportFilter, onExportProjectJson, historyList]);

  // Test ComfyUI connectivity
  const handleTestComfyUi = async (endpoint?: string) => {
    const targetEndpoint = endpoint || formData.comfyui_config?.endpoint || currentProject?.comfyui_config?.endpoint || 'http://127.0.0.1:8188';
    setIsCheckingComfy(true);
    const res = await checkComfyUiHealth(targetEndpoint);
    setComfyUiStatus({
      checked: true,
      online: res.online,
      error: res.error,
    });
    setIsCheckingComfy(false);
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setIsEditing(true);
    setFormData({
      name: `新项目_${new Date().toLocaleDateString()}`,
      description: '基于视觉多模态反推与 ComfyUI REST 生成的高质量文生图项目',
      scheduled_time: '',
      output_dir: `./outputs/proj_${Date.now().toString().slice(-4)}`,
      target_model: promptTemplates[0]?.model_name || 'Krea2 Turbo',
      dimensions: { width: 1344, height: 768 },
      aspect_ratio: '16:9',
      comfyui_config: {
        endpoint: 'http://127.0.0.1:8188',
        cfg_scale: 7.0,
        steps: 25,
        sampler: 'euler',
        scheduler: 'normal',
        seed: -1,
        denoise: 1.0,
        batch_size: 1,
        workflow_type: 'default',
      },
      tags: ['文生图'],
    });
  };

  const handleSaveProject = () => {
    if (!formData.name?.trim()) return;

    if (isCreating) {
      const created = onCreateProject(formData);
      setSelectedProjectUuid(created.uuid);
      setIsCreating(false);
      setIsEditing(false);
    } else if (currentProject) {
      onUpdateProject(currentProject.uuid, formData);
      setIsEditing(false);
    }
  };

  const handleBatchExecute = async () => {
    if (!currentProject) return;
    setBatchRunResult(null);
    const res = await handleBatchRun(currentProject.uuid);
    setBatchRunResult(res);
  };

  const handleCopyJson = () => {
    if (!jsonPreview) return;
    navigator.clipboard.writeText(jsonPreview);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  if (!isOpen) return null;

  // Calculate project item statistics
  const projectItems = historyList.filter(
    (item) => !item.project_uuid || item.project_uuid === currentProject?.uuid
  );
  const executedCount = projectItems.filter((i) => i.execution_status === 'executed').length;
  const unexecutedCount = projectItems.filter((i) => i.execution_status !== 'executed').length;
  const failedCount = projectItems.filter((i) => i.execution_status === 'failed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-5xl h-[88vh] max-h-[820px] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-200/50">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  项目管理与 ComfyUI REST 调度
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded-md">
                  {projects.length} 个项目
                </span>
              </div>
              <p className="text-xs text-slate-500">
                管理独立 UUID 项目配置、提示词与图片尺寸模型绑定、ComfyUI 渲染运行及多状态 JSON 导出
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleStartCreate}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>新建项目</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Sidebar Projects List & Right Main Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: Projects List */}
          <div className="w-72 border-r border-slate-100 bg-slate-50/30 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              所有项目列表 ({projects.length})
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {projects.map((proj) => {
                const isCurrent = proj.uuid === selectedProjectUuid;
                const isActiveGlobal = proj.uuid === activeProjectUuid;
                const pItems = historyList.filter((i) => !i.project_uuid || i.project_uuid === proj.uuid);
                const pDone = pItems.filter((i) => i.execution_status === 'executed').length;

                return (
                  <div
                    key={proj.uuid}
                    onClick={() => {
                      setSelectedProjectUuid(proj.uuid);
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer text-left relative ${
                      isCurrent
                        ? 'bg-white border-blue-300 shadow-sm ring-1 ring-blue-500/20'
                        : 'bg-white/60 hover:bg-white border-slate-200/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                        {proj.name}
                      </h4>
                      {isActiveGlobal && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold flex items-center space-x-0.5">
                          <Check className="w-3 h-3 inline" />
                          <span>当前激活</span>
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                      {proj.description || '无详细描述'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                      <span className="font-mono">{proj.target_model}</span>
                      <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                        {pDone}/{pItems.length} 已执行
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Project Details & Actions */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Nav Tabs */}
            <div className="flex items-center justify-between px-6 pt-3 border-b border-slate-100 bg-white">
              <div className="flex space-x-6">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
                    activeTab === 'details'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Settings2 className="w-4 h-4" />
                  <span>项目基本属性与生成参数</span>
                </button>

                <button
                  onClick={() => setActiveTab('comfyui')}
                  className={`pb-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
                    activeTab === 'comfyui'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Server className="w-4 h-4" />
                  <span>ComfyUI REST 运行与调度</span>
                  {unexecutedCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-700 font-bold">
                      {unexecutedCount} 待跑
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('export')}
                  className={`pb-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
                    activeTab === 'export'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileJson className="w-4 h-4" />
                  <span>多分类 JSON 导出</span>
                </button>
              </div>

              {/* Action Buttons for selected project */}
              {currentProject && !isCreating && (
                <div className="flex items-center space-x-2 pb-2">
                  {currentProject.uuid !== activeProjectUuid && (
                    <button
                      onClick={() => handleSelectActive(currentProject.uuid)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium transition flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>设为全局当前项目</span>
                    </button>
                  )}
                  {onDuplicateProject && (
                    <button
                      onClick={() => onDuplicateProject(currentProject.uuid)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                      title="复制项目副本"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                  {projects.length > 1 && (
                    <button
                      onClick={() => onDeleteProject(currentProject.uuid)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                      title="删除项目"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* TAB 1: Project Details & Configuration */}
              {activeTab === 'details' && (
                <div className="space-y-6 max-w-3xl">
                  {/* Top UUID & Meta Banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-mono text-xs font-bold">
                        ID
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          独立项目 UUID
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-700 select-all">
                          {isCreating ? '(创建后自动生成)' : currentProject?.uuid}
                        </div>
                      </div>
                    </div>
                    
                    {!isCreating && (
                      <div className="text-right text-[11px] text-slate-400">
                        <div>创建时间: {currentProject?.created_at.replace('T', ' ').substring(0, 16)}</div>
                        <div>更新时间: {currentProject?.updated_at.replace('T', ' ').substring(0, 16)}</div>
                      </div>
                    )}
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Project Name */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        项目名称 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          setIsEditing(true);
                        }}
                        placeholder="例如: 赛博朋克科幻角色批量设计"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium"
                      />
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        项目描述与说明
                      </label>
                      <textarea
                        rows={2}
                        value={formData.description || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value });
                          setIsEditing(true);
                        }}
                        placeholder="描述该项目生成目标、风格特征与应用场景..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    {/* Output Directory */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                        <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span>输出目录 (Output Directory)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.output_dir || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, output_dir: e.target.value });
                          setIsEditing(true);
                        }}
                        placeholder="./outputs/project_01"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    {/* Scheduled Execution Time */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>定时执行时间 (Scheduled Time)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.scheduled_time || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, scheduled_time: e.target.value });
                          setIsEditing(true);
                        }}
                        placeholder="例如: 2026-03-01 10:00:00 (选填)"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    {/* Model Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span>项目默认文生图模型</span>
                      </label>
                      <select
                        value={formData.target_model || promptTemplates[0]?.model_name}
                        onChange={(e) => {
                          setFormData({ ...formData, target_model: e.target.value });
                          setIsEditing(true);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-hidden focus:border-blue-500"
                      >
                        {promptTemplates.map((tpl) => (
                          <option key={tpl.id} value={tpl.model_name}>
                            {tpl.model_name} ({tpl.display_name})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Aspect Ratio & Dimensions */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                        <Sliders className="w-3.5 h-3.5 text-amber-500" />
                        <span>图片预设比例与尺寸</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={formData.aspect_ratio || '16:9'}
                          onChange={(e) => {
                            const ratio = e.target.value;
                            const matchedPreset = DIMENSION_PRESETS[ratio] || { width: 1024, height: 1024 };
                            setFormData({
                              ...formData,
                              aspect_ratio: ratio,
                              dimensions: matchedPreset,
                            });
                            setIsEditing(true);
                          }}
                          className="px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-hidden focus:border-blue-500"
                        >
                          {ASPECT_RATIO_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            value={formData.dimensions?.width || 1024}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                dimensions: {
                                  width: parseInt(e.target.value) || 1024,
                                  height: formData.dimensions?.height || 1024,
                                },
                              });
                              setIsEditing(true);
                            }}
                            className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 font-mono text-center"
                            placeholder="W"
                          />
                          <span className="text-slate-400 text-xs">x</span>
                          <input
                            type="number"
                            value={formData.dimensions?.height || 1024}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                dimensions: {
                                  width: formData.dimensions?.width || 1024,
                                  height: parseInt(e.target.value) || 1024,
                                },
                              });
                              setIsEditing(true);
                            }}
                            className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 font-mono text-center"
                            placeholder="H"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ComfyUI Basic Parameters Section */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Server className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-700">
                          ComfyUI REST API 生成参数预设
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formData.comfyui_config?.endpoint || 'http://127.0.0.1:8188'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">采样步数 (Steps)</label>
                        <input
                          type="number"
                          value={formData.comfyui_config?.steps ?? 25}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              comfyui_config: {
                                ...formData.comfyui_config!,
                                steps: parseInt(e.target.value) || 20,
                              },
                            });
                            setIsEditing(true);
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">提示词引导 (CFG)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={formData.comfyui_config?.cfg_scale ?? 7.0}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              comfyui_config: {
                                ...formData.comfyui_config!,
                                cfg_scale: parseFloat(e.target.value) || 7.0,
                              },
                            });
                            setIsEditing(true);
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">采样器 (Sampler)</label>
                        <input
                          type="text"
                          value={formData.comfyui_config?.sampler || 'euler'}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              comfyui_config: {
                                ...formData.comfyui_config!,
                                sampler: e.target.value,
                              },
                            });
                            setIsEditing(true);
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">调度器 (Scheduler)</label>
                        <input
                          type="text"
                          value={formData.comfyui_config?.scheduler || 'normal'}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              comfyui_config: {
                                ...formData.comfyui_config!,
                                scheduler: e.target.value,
                              },
                            });
                            setIsEditing(true);
                          }}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end space-x-3 pt-2">
                    {isCreating && (
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setIsEditing(false);
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                      >
                        取消创建
                      </button>
                    )}
                    <button
                      onClick={handleSaveProject}
                      disabled={!formData.name?.trim()}
                      className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isCreating ? '立即创建项目' : '保存项目修改'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: ComfyUI REST Execution & Connectivity */}
              {activeTab === 'comfyui' && (
                <div className="space-y-6 max-w-3xl">
                  {/* ComfyUI REST Endpoint Health Check */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Server className="w-4 h-4 text-slate-700" />
                        <h4 className="text-xs font-bold text-slate-800">
                          ComfyUI REST API 服务端连通性
                        </h4>
                      </div>
                      <button
                        onClick={() => handleTestComfyUi()}
                        disabled={isCheckingComfy}
                        className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-medium text-slate-700 shadow-xs transition"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingComfy ? 'animate-spin' : ''}`} />
                        <span>{isCheckingComfy ? '测试中...' : '测试连接'}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={formData.comfyui_config?.endpoint || 'http://127.0.0.1:8188'}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            comfyui_config: {
                              ...formData.comfyui_config!,
                              endpoint: e.target.value,
                            },
                          });
                          setIsEditing(true);
                        }}
                        placeholder="http://127.0.0.1:8188"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                      />
                      {comfyUiStatus.checked && (
                        <div
                          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                            comfyUiStatus.online
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {comfyUiStatus.online ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>ComfyUI 在线就绪</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>无法连接 (请确保已启动 ComfyUI)</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Prompt Execution Status Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <div className="text-[11px] text-slate-400 font-semibold mb-1">项目总提示词数</div>
                      <div className="text-xl font-bold text-slate-800 font-mono">{projectItems.length}</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                      <div className="text-[11px] text-emerald-600 font-semibold mb-1">已执行生成成功</div>
                      <div className="text-xl font-bold text-emerald-700 font-mono">{executedCount}</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
                      <div className="text-[11px] text-amber-600 font-semibold mb-1">待执行渲染</div>
                      <div className="text-xl font-bold text-amber-700 font-mono">{unexecutedCount}</div>
                    </div>
                  </div>

                  {/* Batch Action Banner */}
                  <div className="p-5 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                          <Zap className="w-4 h-4 text-blue-600" />
                          <span>一键批量发送提示词到 ComfyUI REST API</span>
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          自动遍历本项目下所有未执行（或待重试）的提示词，按当前模型与尺寸参数排队运行，生成结果将自动回填并在结果卡片中展示。
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleBatchExecute}
                        disabled={isComfyUiBatchRunning || unexecutedCount === 0}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-2"
                      >
                        {isComfyUiBatchRunning ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>正在批量提交与监听 ComfyUI 生成队列...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>执行本项目全部未执行任务 ({unexecutedCount})</span>
                          </>
                        )}
                      </button>

                      {batchRunResult && (
                        <div className="text-xs font-medium text-slate-700 flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            批量执行完成: 成功 {batchRunResult.success} / 失败 {batchRunResult.failed}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Multi-Category JSON Export */}
              {activeTab === 'export' && (
                <div className="space-y-4 max-w-4xl">
                  {/* Category Filter Selector */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-700">导出数据分类:</span>
                      <div className="flex space-x-1 bg-white p-1 rounded-lg border border-slate-200">
                        <button
                          onClick={() => setExportFilter('all')}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                            exportFilter === 'all'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          全部提示词与项目信息 ({projectItems.length})
                        </button>
                        <button
                          onClick={() => setExportFilter('executed')}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                            exportFilter === 'executed'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          已执行生成 ({executedCount})
                        </button>
                        <button
                          onClick={() => setExportFilter('unexecuted')}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                            exportFilter === 'unexecuted'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          未执行提示词 ({unexecutedCount})
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCopyJson}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                      >
                        {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{copiedJson ? '已复制' : '复制 JSON'}</span>
                      </button>

                      {currentProject && (
                        <button
                          onClick={() => onDownloadProjectJson(currentProject.uuid, exportFilter)}
                          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>下载 .json 文件</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* JSON Code Viewer */}
                  <div className="relative rounded-xl border border-slate-200 bg-slate-900 overflow-hidden font-mono text-[11px]">
                    <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700 text-slate-300 flex items-center justify-between text-[10px]">
                      <span>project_export_{exportFilter}.json ({jsonPreview.length} 字符)</span>
                      <span className="text-slate-400">符合标准 ComfyUI & ProjectExportJson 规范</span>
                    </div>
                    <pre className="p-4 text-emerald-300 overflow-x-auto max-h-[360px] overflow-y-auto leading-relaxed select-all">
                      {jsonPreview}
                    </pre>
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
