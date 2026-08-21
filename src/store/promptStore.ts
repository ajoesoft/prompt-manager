import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HistoryItem,
  FilterRule,
  ModelConfig,
  SkillTemplate,
  PromptModelTemplate,
  PipelineStageProgress,
  SkillResultJson
} from '../types';
import {
  DEFAULT_SKILL_TEMPLATES,
  DEFAULT_PROMPT_TEMPLATES,
  DEFAULT_MODEL_CONFIG
} from '../data/defaultSkills';
import { SAMPLE_PRESET_ITEMS } from '../data/samplePresets';

const STORAGE_KEYS = {
  HISTORY: 'prompt_manager_history_v1',
  CONFIG: 'prompt_manager_config_v1',
  SKILLS: 'prompt_manager_skills_v1',
  TEMPLATES: 'prompt_manager_templates_v1',
};

export function usePromptStore() {
  // 1. History Items
  const [historyList, setHistoryList] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }
    return SAMPLE_PRESET_ITEMS;
  });

  // 2. Model Config
  const [modelConfig, setModelConfig] = useState<ModelConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MODEL_CONFIG;
  });

  // 3. Skill Templates
  const [skillTemplates, setSkillTemplates] = useState<SkillTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SKILLS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SKILL_TEMPLATES;
  });

  // 4. Prompt Model Templates
  const [promptTemplates, setPromptTemplates] = useState<PromptModelTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PROMPT_TEMPLATES;
  });

  // 5. Filter & Search
  const [filterRule, setFilterRule] = useState<FilterRule>({
    searchQuery: '',
    imageType: null,
    style: null,
    targetModel: null,
    onlyFavorites: false,
    sortBy: 'date_desc',
  });

  // 6. Active Item for Editing
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);

  // 7. Active Pipeline Execution Progress
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineStageProgress[]>([]);

  // Sync to localStorage
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
    setHistoryList((prev) => [item, ...prev]);
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
    setHistoryList(SAMPLE_PRESET_ITEMS);
  }, []);

  const updateSkillTemplate = useCallback((updated: SkillTemplate) => {
    setSkillTemplates((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }, []);

  const toggleSkillEnable = useCallback((id: string) => {
    setSkillTemplates((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enable: !s.enable } : s))
    );
  }, []);

  const saveModelConfig = useCallback((cfg: ModelConfig) => {
    setModelConfig(cfg);
  }, []);

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
          .replace('{style_list}', styleList)
          .replace('{style_weighted}', styleWeighted)
          .replace('{subject}', subject)
          .replace('{action}', action)
          .replace('{background}', background)
          .replace('{light}', light)
          .replace('{color_tone}', colorTone)
          .replace('{camera}', camera)
          .replace('{composition}', composition)
          .replace('{detail}', detail)
          .replace('{visual_mood}', visualMood)
          .replace('{environment}', t4?.environment || background);

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
      setPipelineLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 🚀 启动多模态反推流水线: ${fileName} (${fileSizeKb} KB)`,
        `[${new Date().toLocaleTimeString()}] 🔧 运行模式: ${modelConfig.run_mode === 'local' ? 'Local llama.cpp (Qwen3.5-9B-Q4_K_M + mmproj)' : 'Online Multimodal API'}`,
        `[${new Date().toLocaleTimeString()}] 🎯 目标模型预设: ${targetModel}`,
      ]);

      try {
        // Animate stages step-by-step for visual feedback
        for (let i = 0; i < stages.length; i++) {
          const currentStage = stages[i];
          setPipelineProgress((prev) =>
            prev.map((st, idx) => (idx === i ? { ...st, status: 'running' } : st))
          );
          setPipelineLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] ⏳ 执行阶段 ${currentStage.stageNumber}: ${currentStage.skillName} (${currentStage.stageTitle})...`,
          ]);

          // Small stagger for realistic pipeline execution
          await new Promise((r) => setTimeout(r, 450));
        }

        // Call backend API
        const res = await fetch('/api/reverse-prompt/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: dataUrl,
            target_model: targetModel,
            run_mode: modelConfig.run_mode,
            skills_enabled: skillTemplates.filter((s) => s.enable).map((s) => s.stage_number),
            model_config: modelConfig,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Server pipeline execution failed');
        }

        const skillResult: SkillResultJson = data.skill_result_json;

        // Mark all stages success
        setPipelineProgress((prev) =>
          prev.map((st) => {
            const stageKey = `skill_0${st.stageNumber}_` as keyof SkillResultJson;
            const matchedKey = Object.keys(skillResult).find((k) => k.startsWith(`skill_0${st.stageNumber}`));
            const output = matchedKey ? skillResult[matchedKey] : null;
            return {
              ...st,
              status: 'success',
              outputJson: output,
            };
          })
        );

        setPipelineLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✅ 流水线全阶段完成! 耗时: ${data.execution_time_ms || 1800}ms`,
          `[${new Date().toLocaleTimeString()}] 💾 自动落盘写入 SQLite 数据库 img_history 表`,
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
          positive_prompt: data.positive_prompt,
          negative_prompt: data.negative_prompt,
          skill_result_json: skillResult,
          is_favorite: false,
          execution_time_ms: data.execution_time_ms || 1800,
        };

        addHistoryItem(newItem);
        setActiveItem(newItem);
        setIsAnalyzing(false);
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
    [skillTemplates, modelConfig, promptTemplates, addHistoryItem]
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
    updateSkillTemplate,
    toggleSkillEnable,
    updatePromptTemplate,
    addPromptTemplate,
    deletePromptTemplate,
    reAssemblePrompt,
    runReversePipeline,
  };
}
