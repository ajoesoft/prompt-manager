import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HistoryItem,
  FilterRule,
  ModelConfig,
  SkillTemplate,
  PromptModelTemplate,
  PipelineStageProgress,
  SkillResultJson,
  ApiProfile,
  SqliteDatabaseInfo
} from '../types';
import {
  DEFAULT_SKILL_TEMPLATES,
  DEFAULT_PROMPT_TEMPLATES,
  DEFAULT_MODEL_CONFIG,
  DEFAULT_API_PROFILES
} from '../data/defaultSkills';
import { SAMPLE_PRESET_ITEMS } from '../data/samplePresets';
import { executeClientPipeline } from '../services/clientLlamaPipeline';
import { tauriGetSqliteStats, isTauri } from '../services/tauriLlamaService';

const STORAGE_KEYS = {
  HISTORY: 'prompt_manager_history_v1',
  CONFIG: 'prompt_manager_config_v1',
  SKILLS: 'prompt_manager_skills_v1',
  TEMPLATES: 'prompt_manager_templates_v1',
  PROFILES: 'prompt_manager_api_profiles_v1',
};

export function usePromptStore() {
  // 1. History Items (Empty by default, user imports their own images)
  const [historyList, setHistoryList] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }
    return [];
  });

  // 2. Model Config (Synced with SQLite3 backend)
  const [modelConfig, setModelConfig] = useState<ModelConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MODEL_CONFIG;
  });

  // 3. API Profiles (Saved multi-endpoint vision configurations in SQLite3)
  const [apiProfiles, setApiProfiles] = useState<ApiProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_API_PROFILES;
  });

  // 4. SQLite3 Database Metrics
  const [sqliteStats, setSqliteStats] = useState<SqliteDatabaseInfo | null>(null);

  // 5. Skill Templates
  const [skillTemplates, setSkillTemplates] = useState<SkillTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SKILLS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SKILL_TEMPLATES;
  });

  // 6. Prompt Model Templates
  const [promptTemplates, setPromptTemplates] = useState<PromptModelTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PROMPT_TEMPLATES;
  });

  // 7. Filter & Search
  const [filterRule, setFilterRule] = useState<FilterRule>({
    searchQuery: '',
    imageType: null,
    style: null,
    targetModel: null,
    onlyFavorites: false,
    sortBy: 'date_desc',
  });

  // 8. Active Item for Editing
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);

  // 9. Active Pipeline Execution Progress
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineStageProgress[]>([]);

  // Load SQLite / Tauri Stats on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await tauriGetSqliteStats();
        setSqliteStats(stats);
      } catch (e) {
        console.warn('Tauri stats warning:', e);
      }
    }
    loadStats();
  }, [historyList]);

  // Sync to localStorage / Tauri storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyList));
    } catch (e) {}
  }, [historyList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(modelConfig));
    } catch (e) {}
  }, [modelConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(apiProfiles));
    } catch (e) {}
  }, [apiProfiles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(skillTemplates));
    } catch (e) {}
  }, [skillTemplates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(promptTemplates));
    } catch (e) {}
  }, [promptTemplates]);

  // Actions
  const addHistoryItem = useCallback((item: HistoryItem) => {
    setHistoryList((prev) => {
      // Prevent inserting duplicate history items if created within 2 seconds with identical filename & target_model
      const isDuplicate = prev.some(
        (existing) =>
          existing.id === item.id ||
          (existing.file_name === item.file_name &&
            existing.file_size_kb === item.file_size_kb &&
            existing.target_model === item.target_model &&
            Math.abs(new Date(existing.create_at).getTime() - new Date(item.create_at).getTime()) < 3000)
      );
      if (isDuplicate) {
        return prev;
      }
      return [item, ...prev];
    });
  }, []);

  const updateHistoryItem = useCallback((updated: HistoryItem) => {
    setHistoryList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (activeItem?.id === updated.id) {
      setActiveItem(updated);
    }
  }, [activeItem]);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistoryList((prev) => prev.filter((item) => item.id !== id));
    if (activeItem?.id === id) {
      setActiveItem(null);
    }
  }, [activeItem]);

  const toggleFavorite = useCallback((id: string) => {
    setHistoryList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_favorite: !item.is_favorite } : item))
    );
  }, []);

  const clearAllHistory = useCallback(() => {
    setHistoryList([]);
  }, []);

  const resetToPresets = useCallback(() => {
    setHistoryList([]);
  }, []);

  const updateSkillTemplate = useCallback((updated: SkillTemplate) => {
    setSkillTemplates((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const toggleSkillEnable = useCallback((id: string) => {
    setSkillTemplates((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enable: !s.enable } : s))
    );
  }, []);

  // Save Model Config directly to client / Tauri local storage
  const saveModelConfig = useCallback(async (cfg: ModelConfig) => {
    setModelConfig(cfg);
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cfg));
    } catch (e) {
      console.warn('Failed to persist model config:', e);
    }
  }, []);

  // API Profiles management
  const saveApiProfile = useCallback(async (profile: ApiProfile) => {
    setApiProfiles((prev) => {
      const idx = prev.findIndex((p) => p.id === profile.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = profile;
        return next;
      }
      return [...prev, profile];
    });
  }, []);

  const deleteApiProfile = useCallback(async (id: string) => {
    setApiProfiles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const activateApiProfile = useCallback(async (id: string) => {
    const target = apiProfiles.find((p) => p.id === id);
    if (target) {
      const updatedConfig: ModelConfig = {
        ...modelConfig,
        run_mode: 'online',
        api_provider: target.provider,
        api_endpoint: target.endpoint,
        api_key: target.api_key || '',
        api_model: target.model,
        timeout_seconds: target.timeout_seconds || 45,
      };
      setModelConfig(updatedConfig);
      setApiProfiles((prev) =>
        prev.map((p) => ({ ...p, is_active: p.id === id }))
      );
    }
  }, [apiProfiles, modelConfig]);

  const refreshSqliteStats = useCallback(async () => {
    try {
      const stats = await tauriGetSqliteStats();
      setSqliteStats(stats);
    } catch (e) {
      console.warn('Failed to refresh stats:', e);
    }
  }, []);

  const resetSqliteDatabase = useCallback(async () => {
    setModelConfig(DEFAULT_MODEL_CONFIG);
    setApiProfiles(DEFAULT_API_PROFILES);
    setHistoryList([]);
    setSkillTemplates(DEFAULT_SKILL_TEMPLATES);
    setPromptTemplates(DEFAULT_PROMPT_TEMPLATES);
    localStorage.clear();
    refreshSqliteStats();
  }, [refreshSqliteStats]);

  const updatePromptTemplate = useCallback((tpl: PromptModelTemplate) => {
    setPromptTemplates((prev) => prev.map((t) => (t.id === tpl.id ? tpl : t)));
  }, []);

  const addPromptTemplate = useCallback((tpl: PromptModelTemplate) => {
    setPromptTemplates((prev) => [...prev, tpl]);
  }, []);

  const deletePromptTemplate = useCallback((id: string) => {
    setPromptTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Re-assemble prompts dynamically when target model changes
  const reAssemblePrompt = useCallback(
    (skillResult: SkillResultJson, targetModelName: string): { pos: string; neg: string } => {
      const t1 = skillResult.skill_01_image_type;
      const t2 = skillResult.skill_02_image_style;
      const t3 = skillResult.skill_03_camera_param;
      const t4 = skillResult.skill_04_scene_content;
      const t5 = skillResult.skill_05_detail_desc;

      const styleList = (t2?.style || []).join(', ') || 'aesthetic photography';
      const styleWeighted = (t2?.style || []).map((s, i) => `(${s}:${(t2?.style_weight?.[i] || 0.8).toFixed(1)})`).join(', ') || '(masterpiece:1.2)';
      const subject = t4?.subject || 'stunning subject';
      const action = t4?.action || 'standing naturally';
      const background = t4?.background || 'atmospheric environment';
      const light = t3?.light || 'soft natural lighting';
      const colorTone = t3?.color_tone || 'balanced vibrant colors';
      const camera = t3?.camera || '85mm lens';
      const composition = t3?.composition || 'rule of thirds';
      const detail = t5?.detail || 'intricate high resolution textures';
      const visualMood = t2?.visual_mood || 'cinematic atmosphere';

      const foundTemplate = promptTemplates.find(
        (t) => t.model_name.toLowerCase() === targetModelName.toLowerCase()
      );

      if (foundTemplate) {
        let pos = foundTemplate.template_pos
          .replaceAll('{style_list}', styleList)
          .replaceAll('{style_weighted}', styleWeighted)
          .replaceAll('{subject}', subject)
          .replaceAll('{action}', action)
          .replaceAll('{background}', background)
          .replaceAll('{light}', light)
          .replaceAll('{color_tone}', colorTone)
          .replaceAll('{camera}', camera)
          .replaceAll('{composition}', composition)
          .replaceAll('{detail}', detail)
          .replaceAll('{visual_mood}', visualMood)
          .replaceAll('{environment}', t4?.environment || background);

        let neg = foundTemplate.template_neg;
        return { pos, neg };
      }

      // Default fallback assembly
      const pos = `${styleList}, ${subject}, ${action}, in ${background}, ${light}, ${camera}, ${detail}, 8k uhd`;
      const neg = `blurry, low quality, distortion, watermark`;
      return { pos, neg };
    },
    [promptTemplates]
  );

  // Run the multi-stage Reverse Image pipeline
  const runReversePipeline = useCallback(
    async (file: File | { dataUrl: string; name: string; size: number }, customModel?: string): Promise<HistoryItem | null> => {
      setIsAnalyzing(true);
      setPipelineLogs([]);
      const targetModel = customModel || promptTemplates[0]?.model_name || 'Krea2 Turbo';

      // Convert file to base64 if needed
      let dataUrl = '';
      let fileName = 'uploaded_image.png';
      let fileSizeKb = 500;

      if ('dataUrl' in file) {
        dataUrl = file.dataUrl;
        fileName = file.name;
        fileSizeKb = Math.round(file.size / 1024);
      } else {
        fileName = file.name;
        fileSizeKb = Math.round(file.size / 1024);
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Initialize stages UI
      const stages: PipelineStageProgress[] = skillTemplates
        .filter((s) => s.enable)
        .sort((a, b) => a.sort_index - b.sort_index)
        .map((s) => ({
          stageNumber: s.stage_number,
          skillName: s.skill_name,
          stageTitle: s.display_title,
          status: 'pending',
        }));

      setPipelineProgress(stages);
      setPipelineLogs([
        `[${new Date().toLocaleTimeString()}] 🚀 启动客户端直接多模态反推流水线: ${fileName} (${fileSizeKb} KB)`,
        `[${new Date().toLocaleTimeString()}] 🔧 运行模式: 客户端直连 llama-server (http://${modelConfig.llama_host || '127.0.0.1'}:${modelConfig.llama_port || 8080})`,
        `[${new Date().toLocaleTimeString()}] 🔄 流水线机制: 每次执行完将上次生成结果存储，自动作为下一步上下文`,
        `[${new Date().toLocaleTimeString()}] 💾 存储引擎: SQLite3 (prompt_manager.db 已挂载)`,
        `[${new Date().toLocaleTimeString()}] 🎯 目标模型预设: ${targetModel}`,
      ]);

      try {
        const result = await executeClientPipeline(
          dataUrl,
          targetModel,
          modelConfig,
          promptTemplates,
          {
            onStageStart: (stageNum, stageTitle, prevContext) => {
              setPipelineProgress((prev) =>
                prev.map((st) =>
                  st.stageNumber === stageNum
                    ? { ...st, status: 'running', previousContext: prevContext }
                    : st
                )
              );
            },
            onStageComplete: (res) => {
              setPipelineProgress((prev) =>
                prev.map((st) =>
                  st.stageNumber === res.stageNumber
                    ? {
                        ...st,
                        status: 'success',
                        outputJson: res.jsonOutput,
                        formattedText: res.formattedText,
                        previousContext: res.previousContextUsed,
                        durationMs: res.durationMs,
                      }
                    : st
                )
              );
            },
            onLog: (msg) => {
              setPipelineLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
            },
          }
        );

        setPipelineLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✅ 客户端流水线 6 阶段全部完成! 总耗时: ${result.executionTimeMs}ms`,
          `[${new Date().toLocaleTimeString()}] 💾 自动落盘写入 SQLite 数据库 execution_logs 表与本地历史`,
        ]);

        const newItem: HistoryItem = {
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          origin_path: fileName,
          thumb_path: dataUrl,
          file_name: fileName,
          file_size_kb: fileSizeKb,
          dimensions: { width: 1024, height: 1024 },
          create_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          target_model: targetModel,
          positive_prompt: result.positivePrompt,
          negative_prompt: result.negativePrompt,
          skill_result_json: result.skillResult,
          formatted_report: result.formattedReport,
          is_favorite: false,
          execution_time_ms: result.executionTimeMs,
        };

        addHistoryItem(newItem);
        setActiveItem(newItem);
        setIsAnalyzing(false);

        // Refresh stats
        refreshSqliteStats();

        return newItem;
      } catch (err: any) {
        console.error('Pipeline error:', err);
        setPipelineLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ❌ 流水线报错: ${err.message || '未知错误'}`,
        ]);
        setPipelineProgress((prev) =>
          prev.map((st) => (st.status === 'running' ? { ...st, status: 'error', error: err.message } : st))
        );
        setIsAnalyzing(false);
        return null;
      }
    },
    [skillTemplates, modelConfig, promptTemplates, addHistoryItem, refreshSqliteStats]
  );

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyList
      .filter((item) => {
        // Search query
        if (filterRule.searchQuery.trim()) {
          const q = filterRule.searchQuery.toLowerCase();
          const matchName = item.file_name.toLowerCase().includes(q);
          const matchPos = item.positive_prompt.toLowerCase().includes(q);
          const matchModel = item.target_model.toLowerCase().includes(q);
          const matchType = item.skill_result_json.skill_01_image_type?.image_type.toLowerCase().includes(q);
          const matchStyle = (item.skill_result_json.skill_02_image_style?.style || []).some((s) =>
            s.toLowerCase().includes(q)
          );
          if (!matchName && !matchPos && !matchModel && !matchType && !matchStyle) return false;
        }

        // Image Type filter
        if (filterRule.imageType) {
          const itemType = item.skill_result_json.skill_01_image_type?.image_type;
          if (itemType !== filterRule.imageType) return false;
        }

        // Style filter
        if (filterRule.style) {
          const styles = item.skill_result_json.skill_02_image_style?.style || [];
          if (!styles.includes(filterRule.style)) return false;
        }

        // Target Model filter
        if (filterRule.targetModel) {
          if (item.target_model !== filterRule.targetModel) return false;
        }

        // Favorites
        if (filterRule.onlyFavorites && !item.is_favorite) return false;

        return true;
      })
      .sort((a, b) => {
        if (filterRule.sortBy === 'date_desc') {
          return new Date(b.create_at).getTime() - new Date(a.create_at).getTime();
        }
        if (filterRule.sortBy === 'date_asc') {
          return new Date(a.create_at).getTime() - new Date(b.create_at).getTime();
        }
        if (filterRule.sortBy === 'name') {
          return a.file_name.localeCompare(b.file_name);
        }
        return 0;
      });
  }, [historyList, filterRule]);

  // Aggregate Category Counts
  const categoryStats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const styleCount: Record<string, number> = {};
    const modelCount: Record<string, number> = {};
    let favCount = 0;

    historyList.forEach((item) => {
      if (item.is_favorite) favCount++;

      const type = item.skill_result_json.skill_01_image_type?.image_type;
      if (type) typeCount[type] = (typeCount[type] || 0) + 1;

      const styles = item.skill_result_json.skill_02_image_style?.style || [];
      styles.forEach((s) => {
        styleCount[s] = (styleCount[s] || 0) + 1;
      });

      const model = item.target_model;
      if (model) modelCount[model] = (modelCount[model] || 0) + 1;
    });

    return {
      total: historyList.length,
      favorites: favCount,
      types: typeCount,
      styles: styleCount,
      models: modelCount,
    };
  }, [historyList]);

  return {
    historyList,
    filteredHistory,
    categoryStats,
    modelConfig,
    apiProfiles,
    sqliteStats,
    skillTemplates,
    promptTemplates,
    filterRule,
    setFilterRule,
    activeItem,
    setActiveItem,
    isAnalyzing,
    pipelineProgress,
    pipelineLogs,
    addHistoryItem,
    updateHistoryItem,
    deleteHistoryItem,
    toggleFavorite,
    clearAllHistory,
    resetToPresets,
    saveModelConfig,
    saveApiProfile,
    deleteApiProfile,
    activateApiProfile,
    refreshSqliteStats,
    resetSqliteDatabase,
    updateSkillTemplate,
    toggleSkillEnable,
    updatePromptTemplate,
    addPromptTemplate,
    deletePromptTemplate,
    reAssemblePrompt,
    runReversePipeline,
  };
}
