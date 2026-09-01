import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HistoryItem,
  FilterRule,
  ModelConfig,
  SkillTemplate,
  PromptModelTemplate,
  PipelineStageProgress,
  SkillResultJson,
  SqliteDatabaseInfo,
  Project,
  ProjectExportFilter,
  ProjectExportJson,
  GenerationParams,
  ExecutionStatus,
  ComfyUiWorkflowTemplate
} from '../types';
import {
  DEFAULT_SKILL_TEMPLATES,
  DEFAULT_PROMPT_TEMPLATES,
  DEFAULT_MODEL_CONFIG,
} from '../data/defaultSkills';
import { DEFAULT_COMFY_WORKFLOWS } from '../data/defaultComfyWorkflows';
import { INITIAL_DEFAULT_PROJECT } from '../data/defaultProjects';
import { SAMPLE_PRESET_ITEMS } from '../data/samplePresets';
import { executeClientPipeline, generateAllModelPrompts, cleanToEnglishPromptClause } from '../services/clientLlamaPipeline';
import { tauriGetSqliteStats, isTauri } from '../services/tauriLlamaService';
import { executeItemOnComfyUi, checkComfyUiHealth } from '../services/comfyUiService';

const STORAGE_KEYS = {
  HISTORY: 'prompt_manager_history_v1',
  CONFIG: 'prompt_manager_config_v1',
  SKILLS: 'prompt_manager_skills_v2',
  TEMPLATES: 'prompt_manager_templates_v1',
  PROJECTS: 'prompt_manager_projects_v1',
  ACTIVE_PROJECT: 'prompt_manager_active_project_v1',
  COMFY_WORKFLOWS: 'prompt_manager_comfy_workflows_v1',
  ACTIVE_COMFY_WORKFLOW: 'prompt_manager_active_comfy_workflow_id_v1',
};

export function usePromptStore() {
  // 0. Projects Management
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load projects from localStorage', e);
    }
    return [INITIAL_DEFAULT_PROJECT];
  });

  const [activeProjectUuid, setActiveProjectUuid] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT);
      if (saved) return saved;
    } catch (e) {}
    return INITIAL_DEFAULT_PROJECT.uuid;
  });

  const activeProject = useMemo(() => {
    if (!activeProjectUuid) return null;
    return projects.find((p) => p.uuid === activeProjectUuid) || null;
  }, [projects, activeProjectUuid]);

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

  // 3. SQLite3 Database Metrics
  const [sqliteStats, setSqliteStats] = useState<SqliteDatabaseInfo | null>(null);

  // 4. Skill Templates
  const [skillTemplates, setSkillTemplates] = useState<SkillTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SKILLS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SKILL_TEMPLATES;
  });

  // 5. Prompt Model Templates
  const [promptTemplates, setPromptTemplates] = useState<PromptModelTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PROMPT_TEMPLATES;
  });

  // 6. ComfyUI Workflow Templates (z-image-turbo, SDXL, Flux, Qwen, etc.)
  const [comfyWorkflows, setComfyWorkflows] = useState<ComfyUiWorkflowTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMFY_WORKFLOWS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load comfy workflows from localStorage', e);
    }
    return DEFAULT_COMFY_WORKFLOWS;
  });

  const [activeComfyWorkflowId, setActiveComfyWorkflowId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_COMFY_WORKFLOW);
      if (saved) return saved;
    } catch (e) {}
    return 'z-image-turbo';
  });

  // Sync comfy workflows to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMFY_WORKFLOWS, JSON.stringify(comfyWorkflows));
    } catch (e) {}
  }, [comfyWorkflows]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMFY_WORKFLOW, activeComfyWorkflowId);
    } catch (e) {}
  }, [activeComfyWorkflowId]);

  // Actions for ComfyUI Workflows
  const updateComfyWorkflow = useCallback((workflow: ComfyUiWorkflowTemplate) => {
    setComfyWorkflows((prev) => {
      const idx = prev.findIndex((w) => w.id === workflow.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = workflow;
        return updated;
      }
      return [...prev, workflow];
    });
  }, []);

  const addComfyWorkflow = useCallback((workflow: ComfyUiWorkflowTemplate) => {
    setComfyWorkflows((prev) => [...prev, workflow]);
  }, []);

  const deleteComfyWorkflow = useCallback((id: string) => {
    setComfyWorkflows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const resetComfyWorkflows = useCallback(() => {
    setComfyWorkflows(DEFAULT_COMFY_WORKFLOWS);
    setActiveComfyWorkflowId('z-image-turbo');
  }, []);

  const updateComfyEndpoint = useCallback((endpoint: string) => {
    if (activeProject) {
      updateProject(activeProject.uuid, {
        comfyui_config: {
          ...activeProject.comfyui_config,
          endpoint,
        },
      });
    }
  }, [activeProject]);

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

  // 10. ComfyUI Batch Execution State
  const [isComfyUiBatchRunning, setIsComfyUiBatchRunning] = useState(false);
  const [comfyUiExecutingItemId, setComfyUiExecutingItemId] = useState<string | null>(null);

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
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {}
  }, [projects]);

  useEffect(() => {
    try {
      if (activeProjectUuid) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, activeProjectUuid);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT);
      }
    } catch (e) {}
  }, [activeProjectUuid]);

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

  // Actions: Project Management
  const createProject = useCallback((data: Partial<Project>): Project => {
    const newProj: Project = {
      uuid: 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: data.name?.trim() || '新建文生图项目',
      description: data.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scheduled_time: data.scheduled_time || '',
      output_dir: data.output_dir || `./outputs/project_${Date.now().toString().slice(-4)}`,
      status: data.status || 'idle',
      target_model: data.target_model || 'Krea2 Turbo',
      dimensions: data.dimensions || { width: 1344, height: 768 },
      aspect_ratio: data.aspect_ratio || '16:9',
      comfyui_config: data.comfyui_config || {
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
      tags: data.tags || ['新项目'],
    };
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectUuid(newProj.uuid);
    return newProj;
  }, []);

  const updateProject = useCallback((uuid: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.uuid === uuid ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      )
    );
  }, []);

  const deleteProject = useCallback((uuid: string) => {
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.uuid !== uuid);
      if (remaining.length === 0) {
        return [INITIAL_DEFAULT_PROJECT];
      }
      return remaining;
    });
    if (activeProjectUuid === uuid) {
      setProjects((prev) => {
        const next = prev.find((p) => p.uuid !== uuid);
        setActiveProjectUuid(next ? next.uuid : null);
        return prev;
      });
    }
  }, [activeProjectUuid]);

  const duplicateProject = useCallback((uuid: string): Project | null => {
    const target = projects.find((p) => p.uuid === uuid);
    if (!target) return null;
    const duplicated: Project = {
      ...target,
      uuid: 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: `${target.name} (副本)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'idle',
    };
    setProjects((prev) => [duplicated, ...prev]);
    setActiveProjectUuid(duplicated.uuid);
    return duplicated;
  }, [projects]);

  // Actions: History & Items
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
    setHistoryList([]);
    setProjects([INITIAL_DEFAULT_PROJECT]);
    setActiveProjectUuid(INITIAL_DEFAULT_PROJECT.uuid);
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
      const normalizedTarget = (targetModelName || '').toLowerCase().trim();

      // 1. If the item already contains precomputed all_model_prompts, match first
      const precomputedMap = skillResult.skill_06_prompt_generate?.all_model_prompts;
      if (precomputedMap && Object.keys(precomputedMap).length > 0) {
        const directMatch = Object.values(precomputedMap).find(
          (m) =>
            m.model_name.toLowerCase() === normalizedTarget ||
            m.model_id.toLowerCase() === normalizedTarget ||
            m.display_name.toLowerCase().includes(normalizedTarget)
        );
        if (directMatch && directMatch.positive) {
          return { pos: directMatch.positive, neg: directMatch.negative || '' };
        }
      }

      // 2. Extract structured stage components
      const s1Multi = skillResult.skill_01_multidim_classification;
      const t1 = skillResult.skill_01_image_type;
      const t2 = skillResult.skill_02_image_style;
      const t3 = skillResult.skill_03_camera_param;
      const t4 = skillResult.skill_04_scene_content;
      const t5 = skillResult.skill_05_detail_desc;
      const s7Game = skillResult.skill_07_game_asset;

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
      const visualMood = t2?.visual_mood || s1Multi?.mood_atmosphere || 'cinematic atmosphere';
      const environment = t4?.environment || s1Multi?.genre_worldview || background;
      const lensFocal = t3?.lens_focal || '85mm';
      const aperture = t3?.aperture || 'f/1.4';

      // 3. Check custom promptTemplates first if user defined custom template
      const foundTemplate = promptTemplates.find(
        (t) => t.model_name.toLowerCase() === normalizedTarget || t.id.toLowerCase() === normalizedTarget
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
          .replaceAll('{environment}', environment)
          .replaceAll('{lens_focal}', lensFocal)
          .replaceAll('{aperture}', aperture);

        let neg = foundTemplate.template_neg;
        return { pos, neg };
      }

      // 4. Generate synthesized high-quality model prompts
      const subjectStrEn = cleanToEnglishPromptClause(subject, 'a detailed subject, high aesthetic quality');
      const actionStrEn = cleanToEnglishPromptClause(action, 'striking posture, dramatic interaction');
      const bgStrEn = cleanToEnglishPromptClause(background, 'atmospheric environment with depth');
      const lightStrEn = cleanToEnglishPromptClause(light, 'volumetric cinematic studio lighting');
      const colorStrEn = cleanToEnglishPromptClause(colorTone, 'rich balanced color palette, cinematic grading');
      const cameraStrEn = camera || '85mm portrait lens, f/1.4 aperture';
      const compStrEn = cleanToEnglishPromptClause(composition, 'dynamic rule of thirds composition');
      const detailStrEn = cleanToEnglishPromptClause(detail, 'intricate micro textures, fine details, masterpiece');
      const styleStrEn = styleList;
      const moodStrEn = cleanToEnglishPromptClause(visualMood, 'atmospheric, emotionally evocative');
      const envStrEn = cleanToEnglishPromptClause(environment, 'cinematic environment');

      const generatedSuite = generateAllModelPrompts(
        subjectStrEn,
        actionStrEn,
        bgStrEn,
        lightStrEn,
        colorStrEn,
        cameraStrEn,
        compStrEn,
        detailStrEn,
        styleStrEn,
        moodStrEn,
        envStrEn,
        s1Multi?.genre_worldview || '',
        s7Game?.prompt_modifiers
      );

      let matched = Object.values(generatedSuite).find(
        (m) => m.model_name.toLowerCase() === normalizedTarget || m.model_id.toLowerCase() === normalizedTarget
      );

      if (!matched) {
        if (normalizedTarget.includes('krea')) matched = generatedSuite.krea2_turbo;
        else if (normalizedTarget.includes('z') || normalizedTarget.includes('turbo')) matched = generatedSuite.z_image_turbo;
        else if (normalizedTarget.includes('qwen') || normalizedTarget.includes('2512')) matched = generatedSuite.qwen_image_2512;
        else if (normalizedTarget.includes('flux')) matched = generatedSuite.flux2;
        else if (normalizedTarget.includes('sd3') || normalizedTarget.includes('stable diffusion 3')) matched = generatedSuite.stable_diffusion_3;
        else if (normalizedTarget.includes('sdxl')) matched = generatedSuite.z_image_turbo;
        else if (normalizedTarget.includes('ideogram')) matched = generatedSuite.ideogram_v4;
        else matched = generatedSuite.krea2_turbo;
      }

      if (matched) {
        return { pos: matched.positive, neg: matched.negative };
      }

      // Default fallback assembly
      const pos = `${styleList}, ${subject}, ${action}, in ${background}, ${light}, ${camera}, ${detail}, 8k uhd`;
      const neg = `blurry, low quality, distortion, watermark`;
      return { pos, neg };
    },
    [promptTemplates]
  );

  // Run the multi-stage Reverse Image pipeline with project context
  const runReversePipeline = useCallback(
    async (
      file: File | { dataUrl: string; name: string; size: number },
      customModel?: string,
      outputLanguage: 'zh' | 'en' = 'zh',
      options?: {
        projectUuid?: string;
        dimensions?: { width: number; height: number };
        aspectRatio?: string;
        generationParams?: GenerationParams;
      }
    ): Promise<HistoryItem | null> => {
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

      // Project context resolution
      const targetProjUuid = options?.projectUuid || activeProjectUuid || undefined;
      const targetProj = targetProjUuid ? projects.find((p) => p.uuid === targetProjUuid) : activeProject;

      const targetDims = options?.dimensions || targetProj?.dimensions || { width: 1344, height: 768 };
      const targetRatio = options?.aspectRatio || targetProj?.aspect_ratio || '16:9';
      const targetParams: GenerationParams = options?.generationParams || {
        cfg_scale: targetProj?.comfyui_config?.cfg_scale ?? 7.0,
        steps: targetProj?.comfyui_config?.steps ?? 25,
        sampler: targetProj?.comfyui_config?.sampler ?? 'euler',
        scheduler: targetProj?.comfyui_config?.scheduler ?? 'normal',
        seed: targetProj?.comfyui_config?.seed ?? -1,
        denoise: targetProj?.comfyui_config?.denoise ?? 1.0,
        batch_size: targetProj?.comfyui_config?.batch_size ?? 1,
      };

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
        `[${new Date().toLocaleTimeString()}] 🚀 启动多模态反推流水线: ${fileName} (${fileSizeKb} KB)`,
        `[${new Date().toLocaleTimeString()}] 📁 归属项目: ${targetProj ? targetProj.name : '未绑定项目'}`,
        `[${new Date().toLocaleTimeString()}] 🌐 输出语言控制: ${outputLanguage === 'zh' ? '中文 (Chinese)' : '英文 (English)'}`,
        `[${new Date().toLocaleTimeString()}] 📐 目标分辨率: ${targetDims.width}x${targetDims.height} (${targetRatio})`,
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
          },
          outputLanguage
        );

        setPipelineLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✅ 客户端流水线 6 阶段全部完成! 总耗时: ${result.executionTimeMs}ms`,
          `[${new Date().toLocaleTimeString()}] 💾 提示词与生成参数已录入项目库`,
        ]);

        const newItem: HistoryItem = {
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          project_uuid: targetProjUuid,
          origin_path: fileName,
          thumb_path: dataUrl,
          file_name: fileName,
          file_size_kb: fileSizeKb,
          dimensions: targetDims,
          aspect_ratio: targetRatio,
          create_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          target_model: targetModel,
          positive_prompt: result.positivePrompt,
          negative_prompt: result.negativePrompt,
          generation_params: targetParams,
          execution_status: 'unexecuted',
          skill_result_json: result.skillResult,
          formatted_report: result.formattedReport,
          is_favorite: false,
          execution_time_ms: result.executionTimeMs,
          output_language: outputLanguage,
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
    [skillTemplates, modelConfig, promptTemplates, addHistoryItem, refreshSqliteStats, activeProjectUuid, projects, activeProject]
  );

  // Actions: ComfyUI REST API Execution
  const executeItemComfyUi = useCallback(
    async (itemId: string): Promise<boolean> => {
      const item = historyList.find((i) => i.id === itemId);
      if (!item) return false;

      const proj =
        (item.project_uuid ? projects.find((p) => p.uuid === item.project_uuid) : null) ||
        activeProject ||
        INITIAL_DEFAULT_PROJECT;

      // Update item status to running
      setComfyUiExecutingItemId(itemId);
      setHistoryList((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, execution_status: 'running', execution_progress: 15 }
            : i
        )
      );

      try {
        // Smart workflow template resolution: prioritize matching item's target_model
        let targetWorkflow = (
          item.target_model
            ? comfyWorkflows.find(
                (w) => w.id === item.target_model || w.target_model === item.target_model
              )
            : null
        ) ||
        comfyWorkflows.find((w) => w.id === proj.comfyui_config?.workflow_id) ||
        comfyWorkflows.find((w) => w.id === activeComfyWorkflowId) ||
        comfyWorkflows[0];

        const result = await executeItemOnComfyUi(
          item,
          {
            endpoint: proj.comfyui_config?.endpoint || 'http://127.0.0.1:8188',
            name: proj.name,
            output_dir: proj.output_dir,
            params: item.generation_params || proj.comfyui_config,
            workflowTemplate: targetWorkflow,
          },
          (progress) => {
            setHistoryList((prev) =>
              prev.map((i) =>
                i.id === itemId ? { ...i, execution_progress: progress } : i
              )
            );
          }
        );

        if (result.ok && result.outputImages && result.outputImages.length > 0) {
          setHistoryList((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    execution_status: 'executed',
                    execution_progress: 100,
                    execution_result: {
                      prompt_id: result.prompt_id,
                      output_images: result.outputImages,
                      executed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                      duration_ms: result.durationMs,
                      repair_note: result.repairNote,
                    },
                  }
                : i
            )
          );
          setComfyUiExecutingItemId(null);
          return true;
        } else {
          setHistoryList((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    execution_status: 'failed',
                    execution_progress: 0,
                    execution_result: {
                      prompt_id: result.prompt_id,
                      error: result.error || 'ComfyUI 生成失败',
                    },
                  }
                : i
            )
          );
          setComfyUiExecutingItemId(null);
          return false;
        }
      } catch (err: any) {
        setHistoryList((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  execution_status: 'failed',
                  execution_progress: 0,
                  execution_result: {
                    error: err.message || '网络连接异常',
                  },
                }
              : i
          )
        );
        setComfyUiExecutingItemId(null);
        return false;
      }
    },
    [historyList, projects, activeProject, comfyWorkflows, activeComfyWorkflowId]
  );

  // Batch execute all unexecuted items in a project
  const executeProjectUnexecuted = useCallback(
    async (projectUuid?: string): Promise<{ total: number; success: number; failed: number }> => {
      const targetUuid = projectUuid || activeProjectUuid;
      const itemsToRun = historyList.filter(
        (i) =>
          (!targetUuid || i.project_uuid === targetUuid || !i.project_uuid) &&
          i.execution_status !== 'executed'
      );

      if (itemsToRun.length === 0) {
        return { total: 0, success: 0, failed: 0 };
      }

      setIsComfyUiBatchRunning(true);
      let success = 0;
      let failed = 0;

      for (const itm of itemsToRun) {
        const ok = await executeItemComfyUi(itm.id);
        if (ok) success++;
        else failed++;
      }

      setIsComfyUiBatchRunning(false);
      return { total: itemsToRun.length, success, failed };
    },
    [historyList, activeProjectUuid, executeItemComfyUi]
  );

  // Actions: Project JSON Export (executed / unexecuted / all)
  const exportProjectJson = useCallback(
    (projectUuid: string, filter: ProjectExportFilter): ProjectExportJson => {
      const targetProj =
        projects.find((p) => p.uuid === projectUuid) || activeProject || INITIAL_DEFAULT_PROJECT;
      const projectItems = historyList.filter(
        (i) => !i.project_uuid || i.project_uuid === projectUuid
      );

      const executedItems = projectItems.filter((i) => i.execution_status === 'executed');
      const unexecutedItems = projectItems.filter((i) => i.execution_status !== 'executed');

      let selectedItems: HistoryItem[] = [];
      let filterDesc = '';
      if (filter === 'executed') {
        selectedItems = executedItems;
        filterDesc = '仅包含已通过 ComfyUI 执行并生成的提示词记录及产物图像';
      } else if (filter === 'unexecuted') {
        selectedItems = unexecutedItems;
        filterDesc = '仅包含尚未执行或待渲染的提示词及参数配置列表';
      } else {
        selectedItems = projectItems;
        filterDesc = '包含该项目下的全部提示词、参数配置及生成产物信息';
      }

      const promptExportList = selectedItems.map((item) => ({
        id: item.id,
        file_name: item.file_name,
        target_model: item.target_model,
        positive_prompt: item.positive_prompt,
        negative_prompt: item.negative_prompt,
        dimensions: item.dimensions || targetProj.dimensions,
        aspect_ratio: item.aspect_ratio || targetProj.aspect_ratio,
        generation_params: item.generation_params || {
          cfg_scale: targetProj.comfyui_config.cfg_scale,
          steps: targetProj.comfyui_config.steps,
          sampler: targetProj.comfyui_config.sampler,
          scheduler: targetProj.comfyui_config.scheduler,
          seed: targetProj.comfyui_config.seed,
          denoise: targetProj.comfyui_config.denoise,
          batch_size: targetProj.comfyui_config.batch_size,
        },
        execution_status: item.execution_status || 'unexecuted',
        executed_at: item.execution_result?.executed_at,
        output_images: item.execution_result?.output_images,
        skill_classification: item.skill_result_json?.skill_01_multidim_classification,
      }));

      return {
        export_version: '1.0.0',
        exported_at: new Date().toISOString(),
        export_filter: filter,
        filter_description: filterDesc,
        project: {
          uuid: targetProj.uuid,
          name: targetProj.name,
          description: targetProj.description,
          created_at: targetProj.created_at,
          updated_at: targetProj.updated_at,
          scheduled_time: targetProj.scheduled_time,
          output_dir: targetProj.output_dir,
          status: targetProj.status,
          default_model: targetProj.target_model,
          default_dimensions: targetProj.dimensions,
          default_aspect_ratio: targetProj.aspect_ratio,
          comfyui_endpoint: targetProj.comfyui_config.endpoint,
        },
        statistics: {
          total_prompts: projectItems.length,
          executed_count: executedItems.length,
          unexecuted_count: unexecutedItems.length,
          failed_count: projectItems.filter((i) => i.execution_status === 'failed').length,
        },
        prompts: promptExportList,
      };
    },
    [projects, activeProject, historyList]
  );

  const downloadProjectJson = useCallback(
    (projectUuid: string, filter: ProjectExportFilter) => {
      const jsonObj = exportProjectJson(projectUuid, filter);
      const projName = jsonObj.project.name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '_');
      const fileName = `${projName}_${filter}_${new Date().toISOString().substring(0, 10)}.json`;
      const jsonStr = JSON.stringify(jsonObj, null, 2);

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [exportProjectJson]
  );

  // Filtered History (Scoped strictly to active project when activeProjectUuid is set)
  const filteredHistory = useMemo(() => {
    const defaultProjUuid = projects[0]?.uuid || INITIAL_DEFAULT_PROJECT.uuid;

    return historyList
      .filter((item) => {
        // Project filter: if activeProjectUuid is set, strictly match current project
        if (activeProjectUuid) {
          const itemProjectUuid = item.project_uuid || defaultProjUuid;
          if (itemProjectUuid !== activeProjectUuid) {
            return false;
          }
        }

        const s1Multi = item.skill_result_json?.skill_01_multidim_classification;
        const s1Legacy = item.skill_result_json?.skill_01_image_type;
        const s2 = item.skill_result_json?.skill_02_image_style;

        // Search query
        if (filterRule.searchQuery.trim()) {
          const q = filterRule.searchQuery.toLowerCase();
          const matchName = item.file_name.toLowerCase().includes(q);
          const matchPos = item.positive_prompt.toLowerCase().includes(q);
          const matchModel = item.target_model.toLowerCase().includes(q);
          const matchType = (
            s1Multi?.subject_content ||
            s1Legacy?.image_type ||
            ''
          ).toLowerCase().includes(q);
          const matchMedium = (
            s1Multi?.visual_medium ||
            s2?.medium ||
            ''
          ).toLowerCase().includes(q);
          const matchWorld = (
            s1Multi?.genre_worldview || ''
          ).toLowerCase().includes(q);
          const matchComm = (
            s1Multi?.commercial_use || ''
          ).toLowerCase().includes(q);
          const matchStyle = (s2?.style || []).some((s) =>
            s.toLowerCase().includes(q)
          );
          const matchTags = (s1Multi?.tags || []).some((t) =>
            t.toLowerCase().includes(q)
          );

          if (
            !matchName &&
            !matchPos &&
            !matchModel &&
            !matchType &&
            !matchMedium &&
            !matchWorld &&
            !matchComm &&
            !matchStyle &&
            !matchTags
          ) {
            return false;
          }
        }

        // Image Type / Subject Content filter
        if (filterRule.imageType) {
          const itemType = s1Multi?.subject_content || s1Legacy?.image_type;
          const matchTag = (s1Multi?.tags || []).includes(filterRule.imageType);
          if (itemType !== filterRule.imageType && !matchTag) return false;
        }

        // Style filter
        if (filterRule.style) {
          const styles = s2?.style || [];
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
  }, [historyList, filterRule, activeProjectUuid, projects]);

  // Aggregate Category Counts for currently scoped project
  const categoryStats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const styleCount: Record<string, number> = {};
    const modelCount: Record<string, number> = {};
    let favCount = 0;

    const defaultProjUuid = projects[0]?.uuid || INITIAL_DEFAULT_PROJECT.uuid;
    const scopedList = activeProjectUuid
      ? historyList.filter((i) => (i.project_uuid || defaultProjUuid) === activeProjectUuid)
      : historyList;

    scopedList.forEach((item) => {
      if (item.is_favorite) favCount++;

      const s1Multi = item.skill_result_json?.skill_01_multidim_classification;
      const s1Legacy = item.skill_result_json?.skill_01_image_type;
      const s2 = item.skill_result_json?.skill_02_image_style;

      const type = s1Multi?.subject_content || s1Legacy?.image_type;
      if (type) {
        const shortType = type.split(' ')[0];
        typeCount[shortType] = (typeCount[shortType] || 0) + 1;
      }

      const styles = s2?.style || [];
      styles.forEach((s) => {
        styleCount[s] = (styleCount[s] || 0) + 1;
      });

      const model = item.target_model;
      if (model) modelCount[model] = (modelCount[model] || 0) + 1;
    });

    return {
      total: scopedList.length,
      favorites: favCount,
      types: typeCount,
      styles: styleCount,
      models: modelCount,
    };
  }, [historyList, activeProjectUuid, projects]);

  return {
    projects,
    activeProjectUuid,
    activeProject,
    setActiveProjectUuid,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    historyList,
    filteredHistory,
    categoryStats,
    modelConfig,
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
    isComfyUiBatchRunning,
    comfyUiExecutingItemId,
    addHistoryItem,
    updateHistoryItem,
    deleteHistoryItem,
    toggleFavorite,
    clearAllHistory,
    resetToPresets,
    saveModelConfig,
    refreshSqliteStats,
    resetSqliteDatabase,
    updateSkillTemplate,
    toggleSkillEnable,
    updatePromptTemplate,
    addPromptTemplate,
    deletePromptTemplate,
    reAssemblePrompt,
    runReversePipeline,
    executeItemComfyUi,
    executeProjectUnexecuted,
    comfyWorkflows,
    activeComfyWorkflowId,
    updateComfyWorkflow,
    addComfyWorkflow,
    deleteComfyWorkflow,
    setActiveComfyWorkflowId,
    resetComfyWorkflows,
    updateComfyEndpoint,
    exportProjectJson,
    downloadProjectJson,
  };
}
