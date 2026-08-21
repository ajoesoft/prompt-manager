import React, { useState } from 'react';
import {
  X,
  Settings,
  Cpu,
  Globe,
  Layers,
  Bot,
  Database,
  Save,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Download,
  Upload,
  Plus,
  Trash2,
  RotateCcw,
  Zap,
  HardDrive
} from 'lucide-react';
import { ModelConfig, SkillTemplate, PromptModelTemplate } from '../types';

interface SettingPanelProps {
  modelConfig: ModelConfig;
  skillTemplates: SkillTemplate[];
  promptTemplates: PromptModelTemplate[];
  onSaveModelConfig: (cfg: ModelConfig) => void;
  onUpdateSkillTemplate: (skill: SkillTemplate) => void;
  onToggleSkillEnable: (id: string) => void;
  onUpdatePromptTemplate: (tpl: PromptModelTemplate) => void;
  onAddPromptTemplate: (tpl: PromptModelTemplate) => void;
  onDeletePromptTemplate: (id: string) => void;
  onClearHistory: () => void;
  onResetPresets: () => void;
  onClose: () => void;
}

export const SettingPanel: React.FC<SettingPanelProps> = ({
  modelConfig,
  skillTemplates,
  promptTemplates,
  onSaveModelConfig,
  onUpdateSkillTemplate,
  onToggleSkillEnable,
  onUpdatePromptTemplate,
  onAddPromptTemplate,
  onDeletePromptTemplate,
  onClearHistory,
  onResetPresets,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'model' | 'skills' | 'prompts' | 'database'>('model');

  // Local copy of model config
  const [cfg, setCfg] = useState<ModelConfig>(modelConfig);

  // Selected skill for YAML editing
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skillTemplates[0]?.id || 'skill_01');
  const selectedSkill = skillTemplates.find((s) => s.id === selectedSkillId) || skillTemplates[0];
  const [skillYamlDraft, setSkillYamlDraft] = useState<string>(selectedSkill?.file_content || '');

  // Connection testing state
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connTestResult, setConnTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // New prompt template modal state
  const [showAddPromptModal, setShowAddPromptModal] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptDisplay, setNewPromptDisplay] = useState('');
  const [newPromptPos, setNewPromptPos] = useState('{style_list}, {subject}, {action}, in {background}, {light}, 8k');
  const [newPromptNeg, setNewPromptNeg] = useState('blurry, low quality');

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setConnTestResult(null);
    try {
      const res = await fetch('/api/system/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (data.success) {
        setConnTestResult({
          success: true,
          message: `${data.message} (耗时 ${data.latency_ms}ms)`,
        });
      } else {
        setConnTestResult({
          success: false,
          message: `连接失败: ${data.error || '无法建立握手'}`,
        });
      }
    } catch (e: any) {
      setConnTestResult({
        success: false,
        message: `网络错误: ${e.message}`,
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSaveModelConfig = () => {
    onSaveModelConfig(cfg);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  const handleSaveSkillYaml = () => {
    if (!selectedSkill) return;
    const updated: SkillTemplate = {
      ...selectedSkill,
      file_content: skillYamlDraft,
    };
    onUpdateSkillTemplate(updated);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  const handleExportSkillFile = (skill: SkillTemplate) => {
    const blob = new Blob([skill.file_content], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = skill.skill_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSkillFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setSkillYamlDraft(content);
      if (selectedSkill) {
        onUpdateSkillTemplate({ ...selectedSkill, file_content: content });
      }
    };
    reader.readAsText(file);
  };

  const handleCreatePromptTemplate = () => {
    if (!newPromptName.trim()) return;
    const newTpl: PromptModelTemplate = {
      id: 'tpl_' + Date.now(),
      model_name: newPromptName.trim(),
      display_name: newPromptDisplay.trim() || newPromptName.trim(),
      badge_color: 'bg-blue-50 text-blue-700 border-blue-200',
      template_pos: newPromptPos,
      template_neg: newPromptNeg,
      syntax_guide: '自定义生图语法模板',
      default_params: {
        cfg_scale: 7.0,
        steps: 30,
        sampler: 'Euler A',
      },
    };
    onAddPromptTemplate(newTpl);
    setShowAddPromptModal(false);
    setNewPromptName('');
    setNewPromptDisplay('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">系统配置与 SKILL 规则管理</h3>
              <p className="text-[11px] text-slate-500">管控多模态推理后端、6 阶段规则 YAML 与文生图提示词语法模板</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {saveSuccessNotice && (
              <span className="text-xs text-emerald-600 flex items-center space-x-1 font-medium mr-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>配置已持久化至 SQLite!</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 px-5 pt-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('model')}
            className={`flex items-center space-x-1.5 px-4 py-2 border-b-2 font-semibold text-xs transition ${
              activeTab === 'model'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>01. 模型与推理后端配置</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center space-x-1.5 px-4 py-2 border-b-2 font-semibold text-xs transition ${
              activeTab === 'skills'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>02. SKILL 阶段规则文件 (.skill)</span>
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`flex items-center space-x-1.5 px-4 py-2 border-b-2 font-semibold text-xs transition ${
              activeTab === 'prompts'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>03. 文生图提示词模型模板</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center space-x-1.5 px-4 py-2 border-b-2 font-semibold text-xs transition ${
              activeTab === 'database'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>04. SQLite 存储与数据库维护</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs bg-white">
          {/* TAB 1: MODEL CONFIG */}
          {activeTab === 'model' && (
            <div className="space-y-5">
              {/* Dual Mode Switcher */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                <label className="font-semibold text-slate-800 text-xs block">
                  多模态推理模式切换 (Run Mode)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    onClick={() => setCfg({ ...cfg, run_mode: 'local' })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                      cfg.run_mode === 'local'
                        ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Cpu className={`w-5 h-5 mt-0.5 ${cfg.run_mode === 'local' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">模式 A: 本地 llama.cpp 离线模式</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        加载 Qwen3.5-9B-Q4_K_M.gguf + mmproj-F16.gguf 视觉投影，100% 离线隐私运行，支持 GPU 分层。
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setCfg({ ...cfg, run_mode: 'online' })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                      cfg.run_mode === 'online'
                        ? 'bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Globe className={`w-5 h-5 mt-0.5 ${cfg.run_mode === 'online' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">模式 B: 在线多模态 API 模式</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        兼容 Google Gemini 3.7 / OpenAI 格式多模态接口，流水线复用 6 阶段 SKILL 规则。
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode A Details */}
              {cfg.run_mode === 'local' && (
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-semibold text-blue-700 text-xs flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>llama.cpp 运行时参数</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">llama-server 可执行文件路径:</label>
                      <input
                        type="text"
                        value={cfg.llama_bin}
                        onChange={(e) => setCfg({ ...cfg, llama_bin: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] shadow-2xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">主模型路径 (Qwen3.5-9B GGUF):</label>
                      <input
                        type="text"
                        value={cfg.main_gguf}
                        onChange={(e) => setCfg({ ...cfg, main_gguf: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] shadow-2xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">多模态投影文件 (mmproj GGUF):</label>
                      <input
                        type="text"
                        value={cfg.mmproj_gguf}
                        onChange={(e) => setCfg({ ...cfg, mmproj_gguf: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] shadow-2xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-600 block mb-1 font-medium">GPU Offload (n_gpu_layers):</label>
                        <input
                          type="number"
                          value={cfg.n_gpu_layers}
                          onChange={(e) => setCfg({ ...cfg, n_gpu_layers: Number(e.target.value) })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] shadow-2xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 block mb-1 font-medium">CPU 线程数 (threads):</label>
                        <input
                          type="number"
                          value={cfg.threads}
                          onChange={(e) => setCfg({ ...cfg, threads: Number(e.target.value) })}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] shadow-2xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode B Details */}
              {cfg.run_mode === 'online' && (
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-semibold text-blue-700 text-xs flex items-center space-x-1.5">
                    <Globe className="w-4 h-4" />
                    <span>在线 API 接口与多模态端点</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">API 端点 (API Endpoint):</label>
                      <input
                        type="text"
                        value={cfg.api_endpoint}
                        onChange={(e) => setCfg({ ...cfg, api_endpoint: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] shadow-2xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">模型代号 (Model Identifier):</label>
                      <input
                        type="text"
                        value={cfg.api_model}
                        onChange={(e) => setCfg({ ...cfg, api_model: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] shadow-2xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 block mb-1 font-medium">请求超时时间 (秒):</label>
                      <input
                        type="number"
                        value={cfg.timeout_seconds}
                        onChange={(e) => setCfg({ ...cfg, timeout_seconds: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] shadow-2xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Connection Test & Save Footer */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConn}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 font-medium shadow-2xs transition"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isTestingConn ? '测试连接中...' : '测试服务连接 (IPC Handshake)'}</span>
                </button>

                <button
                  onClick={handleSaveModelConfig}
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-xs transition"
                >
                  <Save className="w-4 h-4" />
                  <span>保存模型配置至 SQLite</span>
                </button>
              </div>

              {connTestResult && (
                <div
                  className={`p-3 rounded-xl border flex items-center space-x-2 text-xs ${
                    connTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {connTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{connTestResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SKILL RULES MANAGER */}
          {activeTab === 'skills' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
              {/* Left Skill List (4 cols) */}
              <div className="md:col-span-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="px-2 py-1 text-slate-600 font-semibold text-[11px] flex items-center justify-between">
                  <span>6 阶段流水线 SKILL 列表</span>
                  <label className="cursor-pointer text-blue-600 hover:text-blue-700 flex items-center space-x-1 text-[10px] font-medium">
                    <Upload className="w-3 h-3" />
                    <span>导入 .skill</span>
                    <input
                      type="file"
                      accept=".skill,.yaml,.yml"
                      className="hidden"
                      onChange={handleImportSkillFile}
                    />
                  </label>
                </div>

                {skillTemplates.map((skill) => {
                  const isSelected = skill.id === selectedSkillId;
                  return (
                    <div
                      key={skill.id}
                      onClick={() => {
                        setSelectedSkillId(skill.id);
                        setSkillYamlDraft(skill.file_content);
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs font-semibold'
                          : 'bg-white border-slate-200 hover:bg-slate-100/60 text-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-[11px] truncate">
                          0{skill.stage_number}. {skill.display_title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{skill.skill_name}</div>
                      </div>

                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={skill.enable}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleSkillEnable(skill.id);
                          }}
                          className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                          title={skill.enable ? '已启用阶段' : '已禁用'}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right YAML Editor (8 cols) */}
              <div className="md:col-span-8 bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <span className="font-mono text-xs font-semibold text-slate-800">{selectedSkill?.skill_name}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => selectedSkill && handleExportSkillFile(selectedSkill)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[11px] border border-slate-200 shadow-2xs transition font-medium"
                      title="导出此阶段 .skill 规则文件"
                    >
                      <Download className="w-3 h-3" />
                      <span>导出 .skill</span>
                    </button>

                    <button
                      onClick={handleSaveSkillYaml}
                      className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition shadow-xs"
                    >
                      <Save className="w-3 h-3" />
                      <span>保存 SKILL 修改</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={skillYamlDraft}
                  onChange={(e) => setSkillYamlDraft(e.target.value)}
                  rows={14}
                  className="w-full flex-1 p-3 bg-slate-900 font-mono text-[11px] text-emerald-400 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed resize-none shadow-xs"
                />

                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                  <span>支持 YAML 结构规范，定义 stage_name, system_prompt, output_schema, retry, timeout</span>
                  <span className="text-blue-600 font-mono font-medium">Stage 0{selectedSkill?.stage_number}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROMPT TEMPLATES */}
          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  针对不同生图引擎 (SDXL, Flux, Krea2, Midjourney) 的语法结构与权重组装模板:
                </span>
                <button
                  onClick={() => setShowAddPromptModal(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加自定义生图模型模板</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {promptTemplates.map((tpl) => (
                  <div key={tpl.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800 text-xs">{tpl.display_name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                          {tpl.model_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{tpl.syntax_guide}</span>
                    </div>

                    <div>
                      <label className="text-[10px] text-blue-700 font-mono font-semibold block mb-0.5">
                        正向词组装模板 (Positive Template):
                      </label>
                      <textarea
                        value={tpl.template_pos}
                        onChange={(e) =>
                          onUpdatePromptTemplate({
                            ...tpl,
                            template_pos: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full p-2 bg-white font-mono text-[11px] text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-rose-700 font-mono font-semibold block mb-0.5">
                        负向过滤词模板 (Negative Template):
                      </label>
                      <input
                        type="text"
                        value={tpl.template_neg}
                        onChange={(e) =>
                          onUpdatePromptTemplate({
                            ...tpl,
                            template_neg: e.target.value,
                          })
                        }
                        className="w-full p-1.5 bg-white font-mono text-[11px] text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Prompt Template Dialog */}
              {showAddPromptModal && (
                <div className="p-4 bg-slate-50 border border-blue-200 rounded-xl space-y-3 mt-4 shadow-sm">
                  <div className="font-semibold text-slate-900 text-xs">新增自定义文生图模型语法</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="模型代号 (如: StableCascade)"
                      value={newPromptName}
                      onChange={(e) => setNewPromptName(e.target.value)}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                    <input
                      type="text"
                      placeholder="显示名称 (如: Stable Cascade 3.0)"
                      value={newPromptDisplay}
                      onChange={(e) => setNewPromptDisplay(e.target.value)}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                  <textarea
                    placeholder="正向词模板 (使用 {style_list}, {subject}, {background}, {light}, {detail} 等变量)"
                    value={newPromptPos}
                    onChange={(e) => setNewPromptPos(e.target.value)}
                    rows={2}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setShowAddPromptModal(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs text-slate-600 transition"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleCreatePromptTemplate}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      添加模板
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DATABASE & STORAGE */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800 text-xs flex items-center space-x-1.5">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>SQLite 本地数据库状态表</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[10px]">img_history 表</div>
                    <div className="text-base font-bold text-blue-600 font-mono">已挂载</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[10px]">skill_template 表</div>
                    <div className="text-base font-bold text-emerald-600 font-mono">{skillTemplates.length} 规则</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[10px]">prompt_model_template</div>
                    <div className="text-base font-bold text-purple-600 font-mono">{promptTemplates.length} 模板</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-slate-500 text-[10px]">model_config</div>
                    <div className="text-base font-bold text-sky-600 font-mono">{cfg.run_mode.toUpperCase()}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-semibold text-slate-800 text-xs">数据库管理与重置</div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onResetPresets}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                    <span>重置为精选样本数据库</span>
                  </button>

                  <button
                    onClick={onClearHistory}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs transition font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>清空所有历史记录</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

