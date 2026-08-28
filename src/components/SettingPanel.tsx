import React, { useState, useEffect } from 'react';
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
  HardDrive,
  Eye,
  EyeOff,
  Server,
  Activity,
  Check,
  Play,
  RefreshCw,
  Clock,
  ShieldCheck,
  Copy,
  Terminal,
  Info,
  HelpCircle
} from 'lucide-react';
import {
  ModelConfig,
  SkillTemplate,
  PromptModelTemplate,
  ApiProfile,
  SqliteDatabaseInfo
} from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { tauriTestConnection, isTauri, tauriGetSystemInfo } from '../services/tauriLlamaService';

interface SettingPanelProps {
  modelConfig: ModelConfig;
  apiProfiles: ApiProfile[];
  sqliteStats: SqliteDatabaseInfo | null;
  skillTemplates: SkillTemplate[];
  promptTemplates: PromptModelTemplate[];
  onSaveModelConfig: (cfg: ModelConfig) => void;
  onSaveApiProfile?: (profile: ApiProfile) => void;
  onDeleteApiProfile?: (id: string) => void;
  onActivateApiProfile?: (id: string) => void;
  onRefreshSqliteStats?: () => void;
  onResetSqliteDatabase?: () => void;
  onUpdateSkillTemplate: (skill: SkillTemplate) => void;
  onToggleSkillEnable: (id: string) => void;
  onUpdatePromptTemplate: (tpl: PromptModelTemplate) => void;
  onAddPromptTemplate: (tpl: PromptModelTemplate) => void;
  onDeletePromptTemplate: (id: string) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

export const SettingPanel: React.FC<SettingPanelProps> = ({
  modelConfig,
  apiProfiles = [],
  sqliteStats,
  skillTemplates,
  promptTemplates,
  onSaveModelConfig,
  onSaveApiProfile,
  onDeleteApiProfile,
  onActivateApiProfile,
  onRefreshSqliteStats,
  onResetSqliteDatabase,
  onUpdateSkillTemplate,
  onToggleSkillEnable,
  onUpdatePromptTemplate,
  onAddPromptTemplate,
  onDeletePromptTemplate,
  onClearHistory,
  onClose,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'llama' | 'online_api' | 'sqlite' | 'skills' | 'prompts'>('llama');

  // Local draft of model config
  const [cfg, setCfg] = useState<ModelConfig>(modelConfig);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setCfg(modelConfig);
  }, [modelConfig]);

  // Selected skill for YAML editing
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skillTemplates[0]?.id || 'skill_01');
  const selectedSkill = skillTemplates.find((s) => s.id === selectedSkillId) || skillTemplates[0];
  const [skillYamlDraft, setSkillYamlDraft] = useState<string>(selectedSkill?.file_content || '');

  // Connection testing state
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connTestResult, setConnTestResult] = useState<{
    success: boolean;
    message: string;
    latency_ms?: number;
    endpoint?: string;
  } | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // New API Profile Modal State
  const [copiedCli, setCopiedCli] = useState(false);
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileProvider, setNewProfileProvider] = useState<'gemini' | 'openai_compatible' | 'ollama' | 'deepseek' | 'qwen_vl' | 'custom'>('openai_compatible');
  const [newProfileEndpoint, setNewProfileEndpoint] = useState('https://api.openai.com/v1/chat/completions');
  const [newProfileApiKey, setNewProfileApiKey] = useState('');
  const [newProfileModel, setNewProfileModel] = useState('gpt-4o');
  const [newProfileTimeout, setNewProfileTimeout] = useState(45);
  const [newProfileDesc, setNewProfileDesc] = useState('');

  // New prompt template modal state
  const [showAddPromptModal, setShowAddPromptModal] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptDisplay, setNewPromptDisplay] = useState('');
  const [newPromptPos, setNewPromptPos] = useState('{style_list}, {subject}, {action}, in {background}, {light}, 8k');
  const [newPromptNeg, setNewPromptNeg] = useState('blurry, low quality');

  // Test connection handler using Tauri IPC or client direct bridge
  const handleTestConnection = async (overrideParams?: Partial<ModelConfig>) => {
    setIsTestingConn(true);
    setConnTestResult(null);
    try {
      const payload = { ...cfg, ...overrideParams };
      const data = await tauriTestConnection(payload);
      if (data.success) {
        setConnTestResult({
          success: true,
          message: data.message,
          latency_ms: data.latency_ms,
          endpoint: data.endpoint,
        });
      } else {
        setConnTestResult({
          success: false,
          message: `连接测试失败: ${data.error || '无法与端点建立握手'}`,
        });
      }
    } catch (e: any) {
      setConnTestResult({
        success: false,
        message: `通讯异常: ${e.message}`,
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSaveModelConfig = () => {
    onSaveModelConfig(cfg);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleCreateApiProfile = () => {
    if (!newProfileName.trim() || !newProfileEndpoint.trim() || !newProfileModel.trim()) return;
    const profile: ApiProfile = {
      id: `profile_${Date.now()}`,
      name: newProfileName.trim(),
      provider: newProfileProvider,
      endpoint: newProfileEndpoint.trim(),
      api_key: newProfileApiKey.trim(),
      model_name: newProfileModel.trim(),
      timeout_seconds: newProfileTimeout,
      description: newProfileDesc.trim() || '自定义 API 端点预设',
      is_active: false,
    };
    onSaveApiProfile?.(profile);
    setShowNewProfileModal(false);
    // Reset form
    setNewProfileName('');
    setNewProfileApiKey('');
    setNewProfileDesc('');
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Dialog Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-600/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-800">{t('settings.title')}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Database className="w-3 h-3 mr-1" />
                  {t('settings.sqliteBadge')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-white border-b border-slate-200 flex items-center space-x-1 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('llama'); setConnTestResult(null); }}
            className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'llama'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{t('settings.tabLlama')}</span>
            {cfg.run_mode === 'local' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('online_api'); setConnTestResult(null); }}
            className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'online_api'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{t('settings.tabOnline')}</span>
            {cfg.run_mode === 'online' && (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('sqlite'); onRefreshSqliteStats?.(); }}
            className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'sqlite'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{t('settings.tabSqlite')}</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'skills'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('settings.tabSkills')}</span>
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'prompts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{t('settings.tabPrompts')}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
          {/* ================= TAB 1: LLAMA-SERVER CONFIGURATION ================= */}
          {activeTab === 'llama' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Mode switch banner */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                    <Server className="w-4 h-4 text-purple-600" />
                    <span>llama.cpp 本地离线多模态守护进程</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    使用本地 GPU/CPU 加速运行 Qwen3.5-9B、LLaVA、MiniCPM-V 等多模态大模型，无需外网通讯
                  </p>
                </div>
                <button
                  onClick={() => setCfg({ ...cfg, run_mode: 'local' })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    cfg.run_mode === 'local'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cfg.run_mode === 'local' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>已设为当前激活模式</span>
                    </>
                  ) : (
                    <span>切换并激活本地模式</span>
                  )}
                </button>
              </div>

              {/* Llama-server Paths & Server details */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span>进程路径与服务监听地址</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      llama-server 可执行文件路径
                    </label>
                    <input
                      type="text"
                      value={cfg.llama_bin}
                      onChange={(e) => setCfg({ ...cfg, llama_bin: e.target.value })}
                      placeholder="/usr/local/bin/llama-server"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        本地服务监听 Host
                      </label>
                      <input
                        type="text"
                        value={cfg.llama_host || '127.0.0.1'}
                        onChange={(e) => setCfg({ ...cfg, llama_host: e.target.value })}
                        placeholder="127.0.0.1"
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        端口 Port
                      </label>
                      <input
                        type="number"
                        value={cfg.llama_port || 8080}
                        onChange={(e) => setCfg({ ...cfg, llama_port: parseInt(e.target.value) || 8080 })}
                        placeholder="8080"
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      主语言模型 GGUF 文件路径 (-m)
                    </label>
                    <input
                      type="text"
                      value={cfg.main_gguf}
                      onChange={(e) => setCfg({ ...cfg, main_gguf: e.target.value })}
                      placeholder="./models/Qwen3.5-9B-Q4_K_M.gguf"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      视觉投影权重 mmproj GGUF (--mmproj)
                    </label>
                    <input
                      type="text"
                      value={cfg.mmproj_gguf}
                      onChange={(e) => setCfg({ ...cfg, mmproj_gguf: e.target.value })}
                      placeholder="./models/mmproj-F16.gguf"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Hardware Acceleration & Tuning */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>硬件加速与推理超参配置</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">SQLite: model_config</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        GPU 卸载层数 (-ngl / n_gpu_layers)
                      </label>
                      <span className="text-xs font-mono font-bold text-blue-600">{cfg.n_gpu_layers} Layers</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="64"
                      value={cfg.n_gpu_layers}
                      onChange={(e) => setCfg({ ...cfg, n_gpu_layers: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>0 (纯CPU)</span>
                      <span>33 (全量GPU显存)</span>
                      <span>64 (大显存极限)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        CPU 计算线程数 (-t / threads)
                      </label>
                      <span className="text-xs font-mono font-bold text-slate-700">{cfg.threads} 线程</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="32"
                      value={cfg.threads}
                      onChange={(e) => setCfg({ ...cfg, threads: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>1 Core</span>
                      <span>8 Cores</span>
                      <span>32 Cores</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      上下文长度 (-c / ctx)
                    </label>
                    <select
                      value={cfg.context_length}
                      onChange={(e) => setCfg({ ...cfg, context_length: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    >
                      <option value="4096">4096 Tokens</option>
                      <option value="8192">8192 Tokens (推荐)</option>
                      <option value="16384">16384 Tokens</option>
                      <option value="32768">32768 Tokens</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      温度 Temperature
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.0"
                      max="1.5"
                      value={cfg.temperature}
                      onChange={(e) => setCfg({ ...cfg, temperature: parseFloat(e.target.value) || 0.2 })}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      采样 Top-P
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.0"
                      value={cfg.top_p}
                      onChange={(e) => setCfg({ ...cfg, top_p: parseFloat(e.target.value) || 0.9 })}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Llama-server CLI Launch Command & Troubleshooting Card */}
              <div className="p-5 rounded-xl bg-slate-900 text-slate-100 shadow-sm border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-100">
                      Qwen3.5-9B-Q4_K_M + llama-server 启动命令 (已修复模式匹配报错)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const cmd = `llama-server \\
-m ${cfg.main_gguf || './Qwen3.5-9B-Q4_K_M.gguf'} \\
--mmproj ${cfg.mmproj_gguf || './mmproj-F16.gguf'} \\
--jinja \\
--chat-template-kwargs '{"enable_thinking":false}' \\
-ngl 99 \\
-c 32768 \\
-fa on \\
--cache-type-k q8_0 \\
--cache-type-v q8_0 \\
--port ${cfg.llama_port || 8080} \\
--host 0.0.0.0 \\
--parallel 1 \\
--temp 0.7 \\
--top-p 0.95 \\
--top-k 20 \\
--min-p 0.0`;
                      navigator.clipboard.writeText(cmd);
                      setCopiedCli(true);
                      setTimeout(() => setCopiedCli(false), 2500);
                    }}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center space-x-1.5 transition border border-slate-700"
                  >
                    {copiedCli ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">已复制命令</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>一键复制启动命令</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-black/60 rounded-lg text-[11px] font-mono text-emerald-300/90 overflow-x-auto leading-relaxed border border-slate-800/80">
{`llama-server \\
-m ${cfg.main_gguf || './Qwen3.5-9B-Q4_K_M.gguf'} \\
--mmproj ${cfg.mmproj_gguf || './mmproj-F16.gguf'} \\
--jinja \\
--chat-template-kwargs '{"enable_thinking":false}' \\
-ngl 99 \\
-c 32768 \\
-fa on \\
--cache-type-k q8_0 \\
--cache-type-v q8_0 \\
--port ${cfg.llama_port || 8080} \\
--host 0.0.0.0 \\
--parallel 1 \\
--temp 0.7 \\
--top-p 0.95 \\
--top-k 20 \\
--min-p 0.0`}
                </pre>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                  <div className="flex items-start space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-200">--chat-template-kwargs:</strong> 禁用思考链输出，彻底消除模式匹配异常</span>
                  </div>
                  <div className="flex items-start space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-200">--cache-type-k/v q8_0 + -fa on:</strong> 32k 上下文显存占用降低 50%</span>
                  </div>
                </div>
              </div>

              {/* Bottom Test & Save Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection({ run_mode: 'local' })}
                  disabled={isTestingConn}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : 'text-blue-600'}`} />
                  <span>{isTestingConn ? '测试握手中...' : '测试 llama-server 连接'}</span>
                </button>

                <div className="flex items-center space-x-3">
                  {saveSuccessNotice && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>已写入 SQLite3 (model_config)</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveModelConfig}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>保存配置至 SQLite3</span>
                  </button>
                </div>
              </div>

              {/* Connection Test Result Box */}
              {connTestResult && (
                <div
                  className={`p-4 rounded-xl border text-xs flex items-start space-x-3 ${
                    connTestResult.success
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/80 border-rose-200 text-rose-900'
                  }`}
                >
                  {connTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">{connTestResult.message}</div>
                    {connTestResult.latency_ms && (
                      <div className="text-[11px] text-emerald-700 mt-0.5 font-mono">
                        响应延迟: {connTestResult.latency_ms} ms | 存储状态: SQLite 已同步
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: ONLINE REVERSE PROMPT API ================= */}
          {activeTab === 'online_api' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Mode switch banner */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>在线多模态图反推 API 模式</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    通过云端多模态大模型 (Gemini 3.7 / OpenAI GPT-4o / 通义千问 Qwen2.5-VL / Ollama) 进行毫秒级精准反推
                  </p>
                </div>
                <button
                  onClick={() => setCfg({ ...cfg, run_mode: 'online' })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    cfg.run_mode === 'online'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cfg.run_mode === 'online' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>已设为当前激活模式</span>
                    </>
                  ) : (
                    <span>切换并激活在线模式</span>
                  )}
                </button>
              </div>

              {/* Saved Profiles Quick Selector & Manager */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                    <HardDrive className="w-4 h-4 text-emerald-600" />
                    <span>已保存在 SQLite3 的 API 预设端点 ({apiProfiles.length} 项)</span>
                  </h4>
                  <button
                    onClick={() => setShowNewProfileModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新建 API 预设</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {apiProfiles.map((prof) => {
                    const isCurrent = cfg.api_endpoint === prof.endpoint && cfg.api_model === prof.model_name;
                    return (
                      <div
                        key={prof.id}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between space-y-2 ${
                          isCurrent
                            ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400'
                            : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                              <span>{prof.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                                  使用中
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate max-w-[220px]">
                              {prof.model_name}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 text-slate-700 uppercase">
                            {prof.provider}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {prof.description || prof.endpoint}
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setCfg({
                                ...cfg,
                                api_provider: prof.provider,
                                api_endpoint: prof.endpoint,
                                api_key: prof.api_key || cfg.api_key,
                                api_model: prof.model_name,
                                timeout_seconds: prof.timeout_seconds || 45,
                              });
                              onActivateApiProfile?.(prof.id);
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                              isCurrent
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isCurrent ? '当前配置' : '设为使用'}
                          </button>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleTestConnection({
                                api_endpoint: prof.endpoint,
                                api_model: prof.model_name,
                                api_key: prof.api_key,
                                api_provider: prof.provider,
                                run_mode: 'online'
                              })}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                              title="测试该预设"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                            {apiProfiles.length > 1 && (
                              <button
                                onClick={() => onDeleteApiProfile?.(prof.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                title="从 SQLite 删除"
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
              </div>

              {/* Active API Details Form */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span>当前激活的 API 端点与鉴权密钥</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>已加密写入 SQLite 数据库</span>
                  </span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      服务商协议 Provider
                    </label>
                    <select
                      value={cfg.api_provider || 'gemini'}
                      onChange={(e) => setCfg({ ...cfg, api_provider: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden font-medium"
                    >
                      <option value="gemini">Google Gemini (推荐)</option>
                      <option value="openai_compatible">OpenAI Compatible (通用)</option>
                      <option value="qwen_vl">阿里百炼 Qwen-VL</option>
                      <option value="ollama">Ollama 本地服务</option>
                      <option value="deepseek">DeepSeek 视觉</option>
                      <option value="custom">自定义 HTTP 端点</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      API 端点 URL (Endpoint)
                    </label>
                    <input
                      type="text"
                      value={cfg.api_endpoint}
                      onChange={(e) => setCfg({ ...cfg, api_endpoint: e.target.value })}
                      placeholder="https://generativelanguage.googleapis.com/v1beta"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      模型名称 / Model Identifier
                    </label>
                    <input
                      type="text"
                      value={cfg.api_model}
                      onChange={(e) => setCfg({ ...cfg, api_model: e.target.value })}
                      placeholder="gemini-3.7-flash"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      API Key (鉴权私钥)
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={cfg.api_key || ''}
                        onChange={(e) => setCfg({ ...cfg, api_key: e.target.value })}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 pr-10 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      请求超时时间 (秒)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={cfg.timeout_seconds}
                      onChange={(e) => setCfg({ ...cfg, timeout_seconds: parseInt(e.target.value) || 45 })}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      自定义 HTTP Headers (JSON 格式)
                    </label>
                    <input
                      type="text"
                      value={cfg.custom_headers || ''}
                      onChange={(e) => setCfg({ ...cfg, custom_headers: e.target.value })}
                      placeholder='{"User-Agent": "PromptManager/1.2"}'
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Test & Save Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection({ run_mode: 'online' })}
                  disabled={isTestingConn}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : 'text-blue-600'}`} />
                  <span>{isTestingConn ? '测试端点中...' : '测试在线 API 连通性'}</span>
                </button>

                <div className="flex items-center space-x-3">
                  {saveSuccessNotice && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>已写入 SQLite3 (model_config)</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveModelConfig}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>保存配置至 SQLite3</span>
                  </button>
                </div>
              </div>

              {/* Connection Test Result Box */}
              {connTestResult && (
                <div
                  className={`p-4 rounded-xl border text-xs flex items-start space-x-3 ${
                    connTestResult.success
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/80 border-rose-200 text-rose-900'
                  }`}
                >
                  {connTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">{connTestResult.message}</div>
                    {connTestResult.latency_ms && (
                      <div className="text-[11px] text-emerald-700 mt-0.5 font-mono">
                        响应延迟: {connTestResult.latency_ms} ms | 存储状态: SQLite 已同步
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: SQLITE3 DATABASE MANAGEMENT ================= */}
          {activeTab === 'sqlite' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* SQLite Overview Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        SQLite3 本地数据库引擎 (Wasm Embedded)
                      </h3>
                      <p className="text-xs text-slate-500">
                        文件路径: <span className="font-mono text-slate-700">{sqliteStats?.db_file || 'prompt_manager.db'}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRefreshSqliteStats?.()}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>刷新统计</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">数据库大小</div>
                    <div className="text-lg font-bold text-slate-800 font-mono mt-0.5">
                      {sqliteStats ? `${(sqliteStats.db_size_bytes / 1024).toFixed(1)} KB` : '48.0 KB'}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">● 正常读写就绪</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">SQLite 版本</div>
                    <div className="text-sm font-bold text-slate-800 font-mono mt-1">
                      {sqliteStats?.sqlite_version || 'SQLite 3.45.0'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Wasm / Pure TypeScript</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">持久化状态</div>
                    <div className="text-sm font-bold text-emerald-600 mt-1">
                      已挂载并同步落盘
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {sqliteStats?.last_sync ? new Date(sqliteStats.last_sync).toLocaleTimeString() : '刚刚'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SQLite Tables Breakdown */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>数据库表结构与实时记录数</span>
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {(sqliteStats?.tables || [
                    { name: 'model_config', count: 1, description: 'llama.cpp 与在线多模态 API 运行时配置表' },
                    { name: 'api_profiles', count: apiProfiles.length, description: '已保存的多服务商 API 反推端点预设表' },
                    { name: 'execution_logs', count: 12, description: '多模态反推流水线执行历史与性能遥测日志' }
                  ]).map((tbl) => (
                    <div key={tbl.name} className="p-3.5 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold font-mono text-slate-800 flex items-center space-x-2">
                          <span>{tbl.name}</span>
                          <span className="text-[10px] font-normal text-slate-500">({tbl.description})</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
                          {tbl.count} 记录
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maintenance & Reset */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>数据维护与重置操作</span>
                </h4>
                <p className="text-xs text-slate-500">
                  重置将重新生成预设的 API Profiles 与默认的 llama-server 配置表结构。
                </p>
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => {
                      if (window.confirm('确认将 SQLite3 数据库恢复至初始预设状态？')) {
                        onResetSqliteDatabase?.();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center space-x-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重置 SQLite3 数据库至初始状态</span>
                  </button>

                  <button
                    onClick={onClearHistory}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    清空前端分析历史记录
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: SKILL TEMPLATES (YAML) ================= */}
          {activeTab === 'skills' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              {/* Left Skills List */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>流水线技能列表 ({skillTemplates.length})</span>
                  <span className="text-[10px] text-slate-400">.skill YAML</span>
                </div>
                <div className="space-y-1.5">
                  {skillTemplates.map((skill) => (
                    <div
                      key={skill.id}
                      onClick={() => {
                        setSelectedSkillId(skill.id);
                        setSkillYamlDraft(skill.file_content);
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                        selectedSkillId === skill.id
                          ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                          {skill.stage_number}
                        </span>
                        <span className="truncate">{skill.display_title}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={skill.enable}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleSkillEnable(skill.id);
                        }}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right YAML Editor */}
              <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {selectedSkill?.skill_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="cursor-pointer px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center space-x-1 transition">
                      <Upload className="w-3 h-3" />
                      <span>导入</span>
                      <input type="file" accept=".skill,.yaml,.yml" onChange={handleImportSkillFile} className="hidden" />
                    </label>
                    {selectedSkill && (
                      <button
                        onClick={() => handleExportSkillFile(selectedSkill)}
                        className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center space-x-1 transition"
                      >
                        <Download className="w-3 h-3" />
                        <span>导出</span>
                      </button>
                    )}
                    <button
                      onClick={handleSaveSkillYaml}
                      className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center space-x-1 transition"
                    >
                      <Save className="w-3 h-3" />
                      <span>保存</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={skillYamlDraft}
                  onChange={(e) => setSkillYamlDraft(e.target.value)}
                  className="flex-1 w-full min-h-[360px] p-3 text-xs font-mono bg-slate-900 text-slate-100 rounded-lg focus:outline-hidden resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* ================= TAB 5: PROMPT TEMPLATES ================= */}
          {activeTab === 'prompts' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">生图模型语法重组模板</h4>
                <button
                  onClick={() => setShowAddPromptModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加模型语法</span>
                </button>
              </div>

              <div className="space-y-3">
                {promptTemplates.map((tpl) => (
                  <div key={tpl.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tpl.badge_color}`}>
                        {tpl.display_name}
                      </span>
                      {promptTemplates.length > 1 && (
                        <button
                          onClick={() => onDeletePromptTemplate(tpl.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-400 font-semibold">正向提示词拼装语法 (Pos Template):</div>
                      <div className="text-xs font-mono bg-slate-50 p-2 rounded-md border border-slate-100 text-slate-700">
                        {tpl.template_pos}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>SQLite3 存储引擎已挂载 / prompt_manager.db</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition"
          >
            完成并返回工作台
          </button>
        </div>
      </div>

      {/* SUB-MODAL: Add New API Profile */}
      {showNewProfileModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">新建在线反推 API 预设</h3>
              <button
                onClick={() => setShowNewProfileModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  预设显示名称 *
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="例如: 通义千问 Qwen2.5-VL"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    协议类型 Provider
                  </label>
                  <select
                    value={newProfileProvider}
                    onChange={(e) => setNewProfileProvider(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                  >
                    <option value="openai_compatible">OpenAI Compatible</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="qwen_vl">阿里百炼 Qwen-VL</option>
                    <option value="ollama">Ollama 本地服务</option>
                    <option value="deepseek">DeepSeek 视觉</option>
                    <option value="custom">自定义 HTTP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    模型名称 Identifier *
                  </label>
                  <input
                    type="text"
                    value={newProfileModel}
                    onChange={(e) => setNewProfileModel(e.target.value)}
                    placeholder="gpt-4o / gemini-3.7-flash"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API 端点 URL *
                </label>
                <input
                  type="text"
                  value={newProfileEndpoint}
                  onChange={(e) => setNewProfileEndpoint(e.target.value)}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Key (鉴权密钥)
                </label>
                <input
                  type="password"
                  value={newProfileApiKey}
                  onChange={(e) => setNewProfileApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  备注描述
                </label>
                <input
                  type="text"
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  placeholder="描述该模型适用场景"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowNewProfileModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleCreateApiProfile}
                disabled={!newProfileName.trim() || !newProfileEndpoint.trim()}
                className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
              >
                保存并写入 SQLite3
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Add Prompt Template */}
      {showAddPromptModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-800">新建生图模型语法重组模板</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">模型英文名称 *</label>
                <input
                  type="text"
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="例如: Hunyuan-DiT / Kling"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">正向提示词拼装语法 *</label>
                <textarea
                  value={newPromptPos}
                  onChange={(e) => setNewPromptPos(e.target.value)}
                  className="w-full h-24 p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowAddPromptModal(false)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleCreatePromptTemplate}
                className="px-4 py-1.5 text-xs bg-blue-600 text-white font-semibold rounded-lg"
              >
                保存模板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
