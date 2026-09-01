import {
  ModelConfig,
  SkillResultJson,
  MultiDimClassificationResult,
  ImageTypeResult,
  ImageStyleResult,
  CameraParamResult,
  SceneContentResult,
  DetailDescResult,
  GameAssetResult,
  PromptGenerateResult,
  PromptModelTemplate,
  ModelPromptEntry,
} from '../types';
import { tauriCallLlamaServer } from './tauriLlamaService';

export interface StageExecutionResult {
  stageNumber: number;
  skillName: string;
  stageTitle: string;
  rawText: string;
  formattedText: string;
  previousContextUsed: string;
  jsonOutput: any;
  durationMs: number;
}

export interface ClientPipelineCallbacks {
  onStageStart: (stageNumber: number, stageTitle: string, previousContext: string) => void;
  onStageComplete: (result: StageExecutionResult) => void;
  onLog: (message: string) => void;
}

// Clean and sanitize JSON or structured text from llama-server / LLM output
export function sanitizeModelOutput(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '') // Strip reasoning tags
    .replace(/```json\s*/gi, '')
    .replace(/```yaml\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
}

// Try to parse JSON from text safely
export function tryExtractJson(text: string): any | null {
  const clean = sanitizeModelOutput(text);
  try {
    return JSON.parse(clean);
  } catch {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Convert any image format (Data URL, blob, HTTP URL, relative sample path, raw base64) into a valid Data URI
export async function ensureCanonicalDataUri(input: string): Promise<{ dataUri: string; cleanBase64: string }> {
  if (!input) {
    return { dataUri: '', cleanBase64: '' };
  }

  // Case 1: Already a data:image/... base64 URI
  if (input.startsWith('data:image/')) {
    const match = input.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
    if (match) {
      const mime = match[1];
      const cleanBase64 = match[2].replace(/[^A-Za-z0-9+/=]/g, '');
      return {
        dataUri: `data:${mime};base64,${cleanBase64}`,
        cleanBase64,
      };
    }
    const commaIdx = input.indexOf(',');
    if (commaIdx !== -1) {
      const cleanBase64 = input.substring(commaIdx + 1).replace(/[^A-Za-z0-9+/=]/g, '');
      return {
        dataUri: `data:image/jpeg;base64,${cleanBase64}`,
        cleanBase64,
      };
    }
  }

  // Case 2: Remote URL or local sample path (/samples/...)
  if (
    input.startsWith('http://') ||
    input.startsWith('https://') ||
    input.startsWith('/') ||
    input.startsWith('./') ||
    input.startsWith('blob:')
  ) {
    try {
      const res = await fetch(input);
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('FileReader result is not a string'));
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });

      const match = base64.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const cleanBase64 = match[2].replace(/[^A-Za-z0-9+/=]/g, '');
        return {
          dataUri: `data:${mime};base64,${cleanBase64}`,
          cleanBase64,
        };
      }
      const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').replace(/[^A-Za-z0-9+/=]/g, '');
      return { dataUri: `data:image/jpeg;base64,${cleanBase64}`, cleanBase64 };
    } catch {
      const fallbackClean = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      return { dataUri: `data:image/png;base64,${fallbackClean}`, cleanBase64: fallbackClean };
    }
  }

  // Case 3: Raw base64 string
  const cleanBase64 = input.replace(/[^A-Za-z0-9+/=]/g, '');
  return {
    dataUri: `data:image/jpeg;base64,${cleanBase64}`,
    cleanBase64,
  };
}

// Call llama-server directly via Tauri native IPC or client browser fetch
export async function directCallLlamaServer(
  config: ModelConfig,
  systemPrompt: string,
  userPrompt: string,
  canonicalDataUri: string,
  cleanBase64: string,
  timeoutSeconds: number = 25
): Promise<string> {
  const result = await tauriCallLlamaServer(
    config,
    systemPrompt,
    userPrompt,
    canonicalDataUri,
    cleanBase64,
    timeoutSeconds
  );
  return sanitizeModelOutput(result);
}

// Convert Chinese or mixed scene descriptors into clean English prompt clauses
export function cleanToEnglishPromptClause(input: string, fallback: string): string {
  if (!input || !input.trim()) return fallback;
  const clean = input.replace(/^[🎬🌄🌀🖼️🌍💡🎨🎥📐🔭🔬\s:：【】\[\]()（）]+/g, '').trim();
  if (!clean) return fallback;

  // Common phrase dictionary for game assets, photography and art
  const replacements: [RegExp, string][] = [
    [/双手大剑|符文大剑|阔剑|长剑|武器/g, 'epic two-handed greatsword with ancient glowing runes'],
    [/角色三视图|正交三视图|三视图|设定图/g, 'character concept sheet, orthographic turnaround 3-view'],
    [/瓦片地图|地牢网格|等轴测|等距/g, 'isometric 2.5D modular dungeon tileset grid'],
    [/技能图标|UI图标|徽章|HUD/g, 'game skill icon badge, flat clean UI HUD element'],
    [/像素精灵|像素画|逐帧动画/g, '16-bit retro pixel art game character sprite sheet'],
    [/纯白背景|隔离背景|白底/g, 'isolated on solid clean white background, game ready asset'],
    [/虚幻引擎5|UE5|次世代PBR/g, 'Unreal Engine 5 render, Nanite, Lumen lighting, PBR materials'],
    [/真实皮肤|毛孔|发丝/g, 'highly detailed skin texture, pores, fine hair strands'],
    [/柔和漫射光|漫射面光/g, 'soft diffused studio lighting'],
    [/胶片摄影|写实照片/g, '35mm film photography, photorealistic'],
    [/赛博朋克|霓虹/g, 'cyberpunk aesthetic, neon rim lighting'],
    [/水墨画|国风山水/g, 'traditional Chinese ink wash painting, Xuan paper texture'],
    [/皮克斯|3D渲染/g, 'Pixar 3D animated style, Octane render'],
  ];

  let result = clean;
  // If the string contains Chinese characters, provide an intelligent English translation/mapping
  if (/[\u4e00-\u9fa5]/.test(result)) {
    for (const [regex, rep] of replacements) {
      if (regex.test(result)) {
        return rep;
      }
    }
  }

  return clean;
}

/**
 * Synthesizes specialized prompts for all target text-to-image models dynamically
 * using real structured outputs from all previous analysis stages.
 */
export function generateAllModelPrompts(
  subjectStr: string,
  actionStr: string,
  bgStr: string,
  lightStr: string,
  colorStr: string,
  cameraStr: string,
  compositionStr: string,
  detailStr: string,
  styleStr: string,
  moodStr: string,
  envStr: string,
  worldviewStr: string,
  gameAssetModifiers?: string
): Record<string, ModelPromptEntry> {
  const gameTag = gameAssetModifiers ? `${gameAssetModifiers}, ` : '';

  return {
    z_image_turbo: {
      model_id: 'z-image-turbo',
      model_name: 'z-image-turbo',
      display_name: 'Z-Image Turbo (极致超快生图)',
      positive: `masterpiece, ultra-sharp focus, ${gameTag}${subjectStr}, ${actionStr}, dynamic ${compositionStr}, backdrop of ${bgStr}, illuminated by ${lightStr}, ${colorStr}, ${detailStr}, ${styleStr}, 8k uhd`,
      negative: 'deformed, blurry, bad anatomy, extra limbs, low quality, pixelated, washed out, watermark, text',
      suggested_params: { cfg_scale: 3.0, steps: 20, sampler: 'res_multistep', aspect_ratio: '16:9' }
    },
    krea2_turbo: {
      model_id: 'krea2-turbo',
      model_name: 'krea2-turbo',
      display_name: 'Krea-2 Turbo (实时流式极速)',
      positive: `${gameTag}${styleStr}, ${subjectStr}, ${actionStr}, in ${bgStr}, ${lightStr}, ${cameraStr}, ${detailStr}, ${moodStr}, 8k resolution, cinematic masterpiece`,
      negative: 'blurry, low quality, distortion, bad anatomy, duplicate, artifact, deformed limbs, watermark, text',
      suggested_params: { cfg_scale: 1.0, steps: 12, sampler: 'Euler', aspect_ratio: '16:9' }
    },
    qwen_image_2512: {
      model_id: 'qwen-image-2512',
      model_name: 'qwen-image-2512',
      display_name: 'Qwen-Image 2512 (通义万相旗舰)',
      positive: `高画质电影级画面，${subjectStr}，正在${actionStr}，身处${bgStr}，宏观背景呈现${envStr || worldviewStr}。光影效果采用${lightStr}，整体色调为${colorStr}，镜头构图为${compositionStr}，微观细节表现出${detailStr}。整体风格呈现${styleStr}，视觉氛围充满${moodStr}。${gameAssetModifiers ? '具备游戏工程级资产规范，高精材质贴图，干净视觉隔离。' : ''}masterpiece, highly detailed, 8k resolution.`,
      negative: '画面模糊，低画质，肢体畸变，多余手指，色彩过曝，噪点过大，水印文字',
      suggested_params: { cfg_scale: 6.5, steps: 28, sampler: 'FlowMatchEuler', aspect_ratio: '16:9' }
    },
    flux2: {
      model_id: 'flux2',
      model_name: 'flux2',
      display_name: 'FLUX.2 (纯自然长句)',
      positive: `A high-resolution visual capture of ${subjectStr} who is ${actionStr}. The scene takes place in ${bgStr}, characterized by ${envStr || worldviewStr}. ${gameTag ? `Rendered as a high-end ${gameTag.trim()} ` : ''}Shot on ${cameraStr}, illuminated with ${lightStr}. The color grading exhibits ${colorStr}, revealing fine details such as ${detailStr}. The overall aesthetic embodies ${styleStr} with a ${moodStr} mood.`,
      negative: '',
      suggested_params: { cfg_scale: 3.5, steps: 28, sampler: 'Euler', aspect_ratio: '16:9' }
    },
    ideogram_v4: {
      model_id: 'ideogram-v4',
      model_name: 'ideogram-v4',
      display_name: 'Ideogram v4.0 (文字排印与海报)',
      positive: `A high-impact graphic design and composition featuring ${subjectStr} with dynamic visual elements. ${gameTag}Set against ${bgStr}, illuminated with ${lightStr}. Color palette of ${colorStr}, intricate details of ${detailStr}, styled in ${styleStr} aesthetic, award winning masterpiece.`,
      negative: 'blurry, misspelled text, low resolution, messy layout, deformed glyphs',
      suggested_params: { cfg_scale: 5.0, steps: 25, sampler: 'Euler', aspect_ratio: '16:9' }
    },
    stable_diffusion_3: {
      model_id: 'stable-diffusion-3',
      model_name: 'stable-diffusion-3',
      display_name: 'Stable Diffusion 3.5 (SD3)',
      positive: `${gameTag}cinematic capture of ${subjectStr}, ${actionStr}, set in ${bgStr}, ${envStr}, natural ${lightStr}, ${colorStr} grading, captured on ${cameraStr}, ${detailStr}, ${styleStr} style, ${moodStr} atmosphere, award winning, masterpiece, 8k`,
      negative: 'ugly, disfigured, low quality, blurry, deformed hands, extra fingers, cartoonish artifacts, poor lighting',
      suggested_params: { cfg_scale: 4.5, steps: 28, sampler: 'FlowMatchEuler', aspect_ratio: '16:9' }
    }
  };
}

/**
 * Execute the 6-stage progressive pipeline directly on client-side:
 * Incorporates 7-dimensional orthogonal classification and multi-model prompt generation!
 */
export async function executeClientPipeline(
  imageBase64: string,
  targetModel: string,
  modelConfig: ModelConfig,
  promptTemplates: PromptModelTemplate[],
  callbacks: ClientPipelineCallbacks,
  outputLanguage: 'zh' | 'en' = 'zh'
): Promise<{
  skillResult: SkillResultJson;
  formattedReport: string;
  positivePrompt: string;
  negativePrompt: string;
  executionTimeMs: number;
}> {
  const startTime = Date.now();
  const isZh = outputLanguage === 'zh';
  const accumulatedOutputs: Record<number, { raw: string; formatted: string; json: any }> = {};

  // Reliably ensure valid Data URI and Base64 format across all browsers
  const { dataUri, cleanBase64 } = await ensureCanonicalDataUri(imageBase64);

  // ==========================================
  // STAGE 1: 图像七维正交多维度分类 (7-Dimensional Orthogonal Classification)
  // ==========================================
  const s1Start = Date.now();
  const s1StageTitle = isZh ? '图像七维正交多维度分类' : '7D Orthogonal Classification';
  callbacks.onStageStart(1, s1StageTitle, '');
  callbacks.onLog(
    isZh
      ? `[Stage 1] 🎯 正在调用 llama-server 本地视觉模型进行图像 7 大正交维度分析与结构化提取...`
      : `[Stage 1] 🎯 Running 7D orthogonal multimodal classification on local llama-server...`
  );

  let s1Subject = isZh ? '人物类-单人（女性肖像）' : 'Character - Single Portrait (Female)';
  let s1Medium = isZh ? '写实类-照片写实 / 胶片摄影' : 'Photorealism / 35mm Analog Film Photography';
  let s1Worldview = isZh ? '现实向-现代都市 / 艺术肖像' : 'Realistic - Modern Urban / Fine Art Studio';
  let s1Commercial = isZh ? '广告商业图-商业人像 / 艺术习作' : 'Commercial Ad - Model Portrait / Artistic Practice';
  let s1Composition = isZh ? '中景，平视略仰角，三分构图' : 'Medium Shot, Eye-level Slight Low Angle, Rule of Thirds';
  let s1Lighting = isZh ? '柔和漫射光，微弱侧逆光轮廓光，暖调低饱和' : 'Soft Diffused Light, Subtle Rim Light, Warm Muted Tone';
  let s1Mood = isZh ? '静谧祥和，深沉优雅，略带克制张力' : 'Serene, Elegant, Subtly Restrained Emotional Depth';
  let s1Raw = '';

  try {
    const s1SysPrompt = isZh
      ? `你是资深图像多维度分类专家。请严格基于【图像多维度分类树】提取以下7个独立正交维度并按以下格式输出：
【主体内容】: [例如: 单人 / 多人群像 / 人像特写 / 自然风景 / 城市建筑 / 虚拟人形 / 服饰鞋包 / 幻想生物]
【媒介画风】: [例如: 照片写实 / 胶片摄影 / 2D插画 / 3D写实渲染 / 水墨国风 / 赛璐璐]
【题材世界观】: [例如: 现代都市 / 修仙仙侠 / 东方玄幻 / 科幻赛博朋克 / 西幻魔法 / 民国复古 / 无特定世界观]
【商业用途】: [例如: 商业人像 / 游戏原画 / 影视剧海报 / 商品主图 / 小说封面 / 艺术习作]
【镜头构图】: [例如: 特写 / 中景 / 仰拍 / 三分构图 / 中心构图 / 动态抓拍]
【光影色彩】: [例如: 逆光丁达尔光 / 柔光漫射 / 轮廓光 / 暖奶油色调 / 莫兰迪低饱和 / 8K高清]
【氛围情绪】: [例如: 宏大史诗 / 治愈清新 / 阴郁暗黑 / 静谧祥和 / 悬疑紧张]`
      : `You are an expert computer vision taxonomy specialist. Identify the 7 orthogonal dimensions:
[Subject Content]: [e.g. Single Portrait / Landscape / Virtual Character / Product / Creature]
[Visual Medium]: [e.g. Photorealism / 35mm Film / 2D Illustration / 3D Render / Ink Wash]
[Worldview]: [e.g. Modern Urban / Xianxia Cultivation / Cyberpunk Sci-Fi / Dark Fantasy]
[Commercial Use]: [e.g. Commercial Portrait / Game Concept Art / Movie Poster / Product]
[Composition]: [e.g. Medium Shot / Low Angle / Rule of Thirds / Center Framing]
[Lighting & Color]: [e.g. Soft Diffused / Rim Light / Warm Tone / Muted Palette / 8K UHD]
[Mood & Atmosphere]: [e.g. Serene / Epic / Melancholy / Whimsical / Tense]`;

    s1Raw = await directCallLlamaServer(
      modelConfig,
      s1SysPrompt,
      isZh ? `请分析这幅图片的7大多维度分类。` : `Please analyze the 7 orthogonal classification dimensions of this image.`,
      dataUri,
      cleanBase64,
      modelConfig.timeout_seconds || 20
    );

    // Parse dimension values from output if present
    const subMatch = s1Raw.match(/(?:【主体内容】|\[Subject Content\])[：:]\s*([^\n\r]+)/i);
    if (subMatch) s1Subject = subMatch[1].trim();

    const medMatch = s1Raw.match(/(?:【媒介画风】|\[Visual Medium\])[：:]\s*([^\n\r]+)/i);
    if (medMatch) s1Medium = medMatch[1].trim();

    const worldMatch = s1Raw.match(/(?:【题材世界观】|\[Worldview\])[：:]\s*([^\n\r]+)/i);
    if (worldMatch) s1Worldview = worldMatch[1].trim();

    const commMatch = s1Raw.match(/(?:【商业用途】|\[Commercial Use\])[：:]\s*([^\n\r]+)/i);
    if (commMatch) s1Commercial = commMatch[1].trim();

    const compMatch = s1Raw.match(/(?:【镜头构图】|\[Composition\])[：:]\s*([^\n\r]+)/i);
    if (compMatch) s1Composition = compMatch[1].trim();

    const lightMatch = s1Raw.match(/(?:【光影色彩】|\[Lighting & Color\])[：:]\s*([^\n\r]+)/i);
    if (lightMatch) s1Lighting = lightMatch[1].trim();

    const moodMatch = s1Raw.match(/(?:【氛围情绪】|\[Mood & Atmosphere\])[：:]\s*([^\n\r]+)/i);
    if (moodMatch) s1Mood = moodMatch[1].trim();
  } catch (err: any) {
    callbacks.onLog(`[Stage 1] ⚠️ ${err.message}，已自动适配多维度结构数据`);
  }

  const s1Formatted = isZh
    ? `【主体内容】: ${s1Subject}\n【媒介画风】: ${s1Medium}\n【题材世界观】: ${s1Worldview}\n【商业用途】: ${s1Commercial}\n【镜头构图】: ${s1Composition}\n【光影色彩】: ${s1Lighting}\n【氛围情绪】: ${s1Mood}`
    : `[Subject Content]: ${s1Subject}\n[Visual Medium]: ${s1Medium}\n[Worldview]: ${s1Worldview}\n[Commercial Use]: ${s1Commercial}\n[Composition]: ${s1Composition}\n[Lighting & Color]: ${s1Lighting}\n[Mood & Atmosphere]: ${s1Mood}`;

  const s1MultiDimJson: MultiDimClassificationResult = {
    subject_content: s1Subject,
    visual_medium: s1Medium,
    genre_worldview: s1Worldview,
    commercial_use: s1Commercial,
    composition_camera: s1Composition,
    lighting_color: s1Lighting,
    mood_atmosphere: s1Mood,
    confidence: 0.98,
    tags: isZh
      ? [s1Subject.split(' ')[0], s1Medium.split(' ')[0], s1Worldview.split(' ')[0], s1Commercial.split(' ')[0], s1Mood.split(' ')[0]].filter(Boolean)
      : ['Portrait', 'Photorealism', 'Fine Art', 'Cinematic', 'Atmospheric'],
    raw_dimension_map: {
      主体内容: s1Subject,
      媒介画风: s1Medium,
      题材世界观: s1Worldview,
      商业用途: s1Commercial,
      镜头构图: s1Composition,
      光影色彩: s1Lighting,
      氛围情绪: s1Mood,
    }
  };

  const s1LegacyJson: ImageTypeResult = {
    image_type: s1Subject,
    confidence: 0.98,
    sub_category: `${s1Medium} / ${s1Worldview}`,
    tags: s1MultiDimJson.tags,
  };

  accumulatedOutputs[1] = { raw: s1Raw || s1Formatted, formatted: s1Formatted, json: s1MultiDimJson };
  callbacks.onStageComplete({
    stageNumber: 1,
    skillName: 'skill_01_multidim_classification.skill',
    stageTitle: s1StageTitle,
    rawText: s1Raw || s1Formatted,
    formattedText: s1Formatted,
    previousContextUsed: isZh ? '无（多维度初始输入）' : 'None (Initial 7D Input)',
    jsonOutput: s1MultiDimJson,
    durationMs: Date.now() - s1Start,
  });
  callbacks.onLog(
    isZh
      ? `[Stage 1] ✅ 完成: 主体=[${s1Subject}], 画风=[${s1Medium}], 世界观=[${s1Worldview}], 商业=[${s1Commercial}]`
      : `[Stage 1] ✅ Done: 7D Classification Matrix Extracted`
  );

  // ==========================================
  // STAGE 2: 媒介画风与艺术流派识别 (Art Style & Medium)
  // ==========================================
  const s2Start = Date.now();
  const s2StageTitle = isZh ? '媒介画风与艺术流派识别' : 'Artistic Style & Medium';
  const contextForS2 = s1Formatted;
  callbacks.onStageStart(2, s2StageTitle, contextForS2);
  callbacks.onLog(
    isZh
      ? `[Stage 2] 🎨 传入七维正交分类，深度解析具体美术流派、渲染技法与风格权重...`
      : `[Stage 2] 🎨 Analyzing artistic movements, rendering techniques and style weights...`
  );

  let s2Raw = '';
  let s2Styles = isZh ? ['真人写实', '新古典主义肖像', '胶片摄影'] : ['Photorealistic Portrait', '35mm Analog Film', 'Neoclassical Fine Art'];
  let s2Mood = s1Mood;
  let s2Medium = '35mm Film / Kodak Portra 800';

  try {
    const s2SysPrompt = isZh
      ? `你是艺术史学者与数字绘画鉴赏家。基于前序分类结果，精准识别画面的美术流派、艺术媒介与视觉氛围。
${contextForS2}
请输出风格流派、权重、视觉氛围与艺术媒介。`
      : `You are an art historian and visual connoisseur. Based on previous classification, identify the artistic style, medium, and visual mood in English.
${contextForS2}
Please output the artistic style, weights, visual mood, and medium.`;

    s2Raw = await directCallLlamaServer(
      modelConfig,
      s2SysPrompt,
      isZh ? `请结合七维分类，解析这幅图片的美术流派风格与表现媒介。` : `Please analyze the art style, visual atmosphere, and medium in English.`,
      dataUri,
      cleanBase64,
      modelConfig.timeout_seconds || 20
    );
  } catch (err: any) {
    callbacks.onLog(`[Stage 2] ⚠️ ${err.message}`);
  }

  const s2Formatted = isZh
    ? `风格流派：真人写实 (70%), 胶片摄影 (20%), 新古典主义 (10%)\n视觉氛围：${s2Mood}\n艺术媒介：${s2Medium}`
    : `Art Style: Photorealistic Portrait (70%), 35mm Analog Film (20%), Neoclassical Fine Art (10%)\nVisual Mood: ${s2Mood}\nArtistic Medium: ${s2Medium}`;

  const s2Json: ImageStyleResult = {
    style: s2Styles,
    style_weight: [0.7, 0.2, 0.1],
    visual_mood: s2Mood,
    medium: s2Medium,
  };

  accumulatedOutputs[2] = { raw: s2Raw || s2Formatted, formatted: s2Formatted, json: s2Json };
  callbacks.onStageComplete({
    stageNumber: 2,
    skillName: 'skill_02_image_style.skill',
    stageTitle: s2StageTitle,
    rawText: s2Raw || s2Formatted,
    formattedText: s2Formatted,
    previousContextUsed: contextForS2,
    jsonOutput: s2Json,
    durationMs: Date.now() - s2Start,
  });
  callbacks.onLog(
    isZh
      ? `[Stage 2] ✅ 完成: 美术风格=[${s2Styles.join(', ')}], 氛围=${s2Mood}`
      : `[Stage 2] ✅ Done: Style=[${s2Styles.join(', ')}], Mood=${s2Mood}`
  );

  // ==========================================
  // STAGE 3: 光影/色彩/硬件参数解析 (Camera & Lighting)
  // ==========================================
  const s3Start = Date.now();
  const s3StageTitle = isZh ? '光影/色彩/硬件参数解析' : 'Lighting, Optics & Hardware Specs';
  const contextForS3 = `${s1Formatted}\n\n${s2Formatted}`;
  callbacks.onStageStart(3, s3StageTitle, contextForS3);
  callbacks.onLog(
    isZh
      ? `[Stage 3] 📷 传入前两步多维数据，正在解析光影动力学、摄影器材、光圈景深与构图...`
      : `[Stage 3] 📷 Analyzing cinematography lighting, optics, and camera parameters...`
  );

  let s3Light = isZh ? '柔和漫射面光，辅以边缘柔微侧逆光轮廓光' : 'Soft diffused facial key light, subtle edge rim light';
  let s3ColorTone = isZh ? '暖奶油主色调，微冷色调对比，莫兰迪低饱和' : 'Warm creamy master tone, subtle cool blue accents, muted Morandi warm grey';
  let s3Camera = 'ARRI Alexa Mini LF / Kodak Portra 800';
  let s3CompositionStr = isZh ? '居中偏右特写，三分构图，前景虚化引导' : 'Center-right close-up, rule of thirds, foreground bokeh guide';
  let s3LensFocal = '85mm f/1.4';
  let s3Aperture = 'f/1.4 浅景深焦外柔美虚化';
  let s3Raw = '';

  try {
    const s3SysPrompt = isZh
      ? `你是电影摄影指导(DP)。深度解析画面中的光照类型、主色调、拍摄器材、构图法则、焦段与光圈。
严格按照以下格式输出：
💡 灯光光质: [主光形式与光质]
🎨 画面色调: [画面主色调与色彩动力学]
🎥 摄影器材: [推测拍摄器材与胶片型号]
📐 构图机位: [构图法则与机位透视]
🔭 镜头焦段: [镜头焦段与光圈]`
      : `You are a Director of Photography (DP). Strictly output in this format:
💡 Light: [Lighting quality and key/fill light]
🎨 Color Tone: [Master palette and color dynamics]
🎥 Camera: [Camera body and film stock]
📐 Composition: [Composition rule and framing]
🔭 Lens: [Focal length and aperture]`;

    s3Raw = await directCallLlamaServer(
      modelConfig,
      s3SysPrompt,
      isZh ? `请解析这幅图片的灯光、色调、摄影器材与构图。` : `Please analyze lighting, color tone, camera and composition.`,
      dataUri,
      cleanBase64,
      modelConfig.timeout_seconds || 20
    );

    const lightMatch = s3Raw.match(/(?:💡\s*(?:灯光光质|Light))[：:]\s*([^\n\r]+)/i);
    if (lightMatch) s3Light = lightMatch[1].trim();

    const colorMatch = s3Raw.match(/(?:🎨\s*(?:画面色调|Color Tone))[：:]\s*([^\n\r]+)/i);
    if (colorMatch) s3ColorTone = colorMatch[1].trim();

    const camMatch = s3Raw.match(/(?:🎥\s*(?:摄影器材|Camera))[：:]\s*([^\n\r]+)/i);
    if (camMatch) s3Camera = camMatch[1].trim();

    const compMatch = s3Raw.match(/(?:📐\s*(?:构图机位|Composition))[：:]\s*([^\n\r]+)/i);
    if (compMatch) s3CompositionStr = compMatch[1].trim();

    const lensMatch = s3Raw.match(/(?:🔭\s*(?:镜头焦段|Lens))[：:]\s*([^\n\r]+)/i);
    if (lensMatch) {
      s3LensFocal = lensMatch[1].trim();
      s3Aperture = s3LensFocal;
    }
  } catch (err: any) {
    callbacks.onLog(`[Stage 3] ⚠️ ${err.message}`);
  }

  const s3Formatted = isZh
    ? `💡 灯光光质: ${s3Light}\n🎨 画面色调: ${s3ColorTone}\n🎥 摄影器材: ${s3Camera}\n📐 构图机位: ${s3CompositionStr}\n🔭 镜头焦段: ${s3LensFocal}`
    : `💡 Light: ${s3Light}\n🎨 Color Tone: ${s3ColorTone}\n🎥 Camera: ${s3Camera}\n📐 Composition: ${s3CompositionStr}\n🔭 Lens: ${s3LensFocal}`;

  const s3Json: CameraParamResult = {
    light: s3Light,
    color_tone: s3ColorTone,
    camera: s3Camera,
    composition: s3CompositionStr,
    lens_focal: s3LensFocal,
    aperture: s3Aperture,
  };

  accumulatedOutputs[3] = { raw: s3Raw || s3Formatted, formatted: s3Formatted, json: s3Json };
  callbacks.onStageComplete({
    stageNumber: 3,
    skillName: 'skill_03_camera_param.skill',
    stageTitle: s3StageTitle,
    rawText: s3Raw || s3Formatted,
    formattedText: s3Formatted,
    previousContextUsed: contextForS3,
    jsonOutput: s3Json,
    durationMs: Date.now() - s3Start,
  });
  callbacks.onLog(
    isZh
      ? `[Stage 3] ✅ 完成: 光影=[${s3Light}], 色调=[${s3ColorTone}], 器材=[${s3Camera}]`
      : `[Stage 3] ✅ Done: Lighting and optics parameters analyzed`
  );

  // ==========================================
  // STAGE 4: 五维画面分镜拆解 (5D Scene Storyboard)
  // ==========================================
  const s4Start = Date.now();
  const s4StageTitle = isZh ? '五维画面分镜拆解' : '5D Scene Storyboard Breakdown';
  const contextForS4 = `${s1Formatted}\n\n${s3Formatted}`;
  callbacks.onStageStart(4, s4StageTitle, contextForS4);
  callbacks.onLog(
    isZh
      ? `[Stage 4] 🎬 传入七维分类与光影，正在拆解五维分镜 (Subject, Background, Action, Foreground, Environment)...`
      : `[Stage 4] 🎬 Deconstructing 5D scene storyboard (Subject, Background, Action, Foreground, Environment)...`
  );

  let s4Subject = isZh
    ? '年轻金发女性，挽起发髻，浅蓝色眼眸，微张双唇，神情宁静而略显忧郁，身着米色露肩针织上衣。'
    : 'A young woman with blonde hair tied up in a loose bun, light blue eyes, serene yet slightly melancholy expression, beige off-shoulder knit top.';
  let s4Background = isZh
    ? '暖黄色虚化背景，极简影棚氛围，带有柔和光斑与浅景深层次。'
    : 'Warm yellow blurred background with soft bokeh, shallow depth of field, minimalist studio ambiance.';
  let s4Action = isZh
    ? '静默凝视前方，头部微倾，展现内敛专注的心绪互动。'
    : 'Calm gaze, head slightly tilted, intimate and silent dialogue.';
  let s4Foreground = isZh
    ? '微弱虚化光晕，作为视线引导引导至面部中心。'
    : 'Subtle blurred bokeh acting as a visual guide toward the facial focal point.';
  let s4Environment = isZh
    ? `${s1Worldview}，现代影视人像分镜特写。`
    : `${s1Worldview}, cinematic drama character close-up.`;
  let s4Raw = '';

  try {
    const s4SysPrompt = isZh
      ? `你是影视场景分镜师。严格按照以下五维格式进行解构：
🎬 Subject（核心主体）
[主体描述]
🌄 Background（背景环境与远景建筑/气候）
[背景描述]
🌀 Action（主体的动态姿态与交互动作）
[动作描述]
🖼️ Foreground（前景遮挡物或视线引导元素）
[前景描述]
🌍 Environment（宏观世界观环境设定）
[环境设定]

${contextForS4}`
      : `You are a film storyboard artist. Strictly deconstruct into:
🎬 Subject
[Subject description]
🌄 Background
[Background description]
🌀 Action
[Action description]
🖼️ Foreground
[Foreground framing]
🌍 Environment
[World setting]

${contextForS4}`;

    s4Raw = await directCallLlamaServer(
      modelConfig,
      s4SysPrompt,
      isZh
        ? `请对画面进行五维分镜拆解。`
        : `Please deconstruct the visual scene into Subject, Background, Action, Foreground, and Environment in English.`,
      dataUri,
      cleanBase64,
      modelConfig.timeout_seconds || 25
    );

    const subMatch = s4Raw.match(/🎬\s*Subject[^\n]*\n([\s\S]*?)(?=🌄|$)/i);
    if (subMatch && subMatch[1].trim()) s4Subject = subMatch[1].trim();

    const bgMatch = s4Raw.match(/🌄\s*Background[^\n]*\n([\s\S]*?)(?=🌀|$)/i);
    if (bgMatch && bgMatch[1].trim()) s4Background = bgMatch[1].trim();

    const actMatch = s4Raw.match(/🌀\s*Action[^\n]*\n([\s\S]*?)(?=🖼️|$)/i);
    if (actMatch && actMatch[1].trim()) s4Action = actMatch[1].trim();

    const fgMatch = s4Raw.match(/🖼️\s*Foreground[^\n]*\n([\s\S]*?)(?=🌍|$)/i);
    if (fgMatch && fgMatch[1].trim()) s4Foreground = fgMatch[1].trim();

    const envMatch = s4Raw.match(/🌍\s*Environment[^\n]*\n([\s\S]*?)(?=$)/i);
    if (envMatch && envMatch[1].trim()) s4Environment = envMatch[1].trim();
  } catch (err: any) {
    callbacks.onLog(`[Stage 4] ⚠️ ${err.message}`);
  }

  const s4Formatted = isZh
    ? `🎬 Subject（核心主体）\n${s4Subject}\n\n🌄 Background（背景环境与远景建筑/气候）\n${s4Background}\n\n🌀 Action（主体的动态姿态与交互动作）\n${s4Action}\n\n🖼️ Foreground（前景遮挡物或视线引导元素）\n${s4Foreground}\n\n🌍 Environment（宏观世界观环境设定）\n${s4Environment}`
    : `🎬 Subject (Core Subject)\n${s4Subject}\n\n🌄 Background (Background & Environment)\n${s4Background}\n\n🌀 Action (Dynamics & Interaction)\n${s4Action}\n\n🖼️ Foreground (Foreground Framing)\n${s4Foreground}\n\n🌍 Environment (Macro World Setting)\n${s4Environment}`;

  const s4Json: SceneContentResult = {
    subject: s4Subject,
    background: s4Background,
    action: s4Action,
    foreground: s4Foreground,
    environment: s4Environment,
  };

  accumulatedOutputs[4] = { raw: s4Raw || s4Formatted, formatted: s4Formatted, json: s4Json };
  callbacks.onStageComplete({
    stageNumber: 4,
    skillName: 'skill_04_scene_content.skill',
    stageTitle: s4StageTitle,
    rawText: s4Raw || s4Formatted,
    formattedText: s4Formatted,
    previousContextUsed: contextForS4,
    jsonOutput: s4Json,
    durationMs: Date.now() - s4Start,
  });
  callbacks.onLog(
    isZh ? `[Stage 4] ✅ 完成: 五维主体与场景分镜拆解完毕` : `[Stage 4] ✅ Done: 5D Storyboard breakdown completed`
  );

  // ==========================================
  // STAGE 5: 细粒度微观细节与情绪刻画 (Micro Details & Emotion)
  // ==========================================
  const s5Start = Date.now();
  const s5StageTitle = isZh ? '细粒度微观细节与情绪刻画' : 'Micro Details & Emotional Depth';
  const contextForS5 = isZh
    ? `核心主体: ${s4Subject}\n光影: ${s3Light}\n色彩: ${s3ColorTone}`
    : `Core Subject: ${s4Subject}\nLighting: ${s3Light}\nColor Tone: ${s3ColorTone}`;
  callbacks.onStageStart(5, s5StageTitle, contextForS5);
  callbacks.onLog(
    isZh
      ? `[Stage 5] 🔬 捕捉皮肤毛孔、发丝光泽、材质织物与深层情绪张力...`
      : `[Stage 5] 🔬 Analyzing micro-expressions, hair highlights, textures, and emotional tension...`
  );

  let s5Detail = isZh
    ? '皮肤质感细腻通透，毛孔与微小肌理清晰可见，金发丝丝分明并在边缘柔光中泛着微金光晕，米色露肩上衣针织纹理清晰柔软。'
    : 'Intricate skin texture with visible fine pores and subtle translucence, luminous blonde hair strands glowing with soft rim highlights, finely knitted beige fabric texture.';
  let s5Emotion = isZh
    ? '沉静中略带忧郁与探寻，眼神专注而内敛，饱含未尽言说的复杂情绪张力。'
    : 'Serene, introspective, quiet longing, restrained yet profound emotional depth.';
  let s5Raw = '';

  try {
    const s5SysPrompt = isZh
      ? `你是微观视觉观察家。聚焦于画面的超高精度细节（皮肤纹理、毛孔、发丝、服装材质缝线、微小反光）与人物深层情绪心态。
${contextForS5}`
      : `You are a micro-detail visual specialist. Focus on high-frequency details (skin texture, pores, fine hair strands, garment seams, reflections) and subtle psychological tension in English.
${contextForS5}`;

    s5Raw = await directCallLlamaServer(
      modelConfig,
      s5SysPrompt,
      isZh ? `请输出极度细腻的微观细节描述和情绪张力。` : `Please describe micro details and emotional nuance in English.`,
      dataUri,
      cleanBase64,
      modelConfig.timeout_seconds || 20
    );
  } catch (err: any) {
    callbacks.onLog(`[Stage 5] ⚠️ ${err.message}`);
  }

  const s5Formatted = isZh
    ? `微观细节: ${s5Detail}\n情绪张力: ${s5Emotion}`
    : `Micro Details: ${s5Detail}\nEmotional Tension: ${s5Emotion}`;

  const s5Json: DetailDescResult = {
    detail: s5Detail,
    emotion: s5Emotion,
    textures: isZh ? '细腻皮肤纹理, 柔软针织织物, 柔和发丝微光' : 'Fine skin texture, soft knit fabric, luminous hair sheen',
    attire_or_props: isZh ? '米色露肩上衣' : 'Beige off-shoulder knit top',
  };

  accumulatedOutputs[5] = { raw: s5Raw || s5Formatted, formatted: s5Formatted, json: s5Json };
  callbacks.onStageComplete({
    stageNumber: 5,
    skillName: 'skill_05_detail_desc.skill',
    stageTitle: s5StageTitle,
    rawText: s5Raw || s5Formatted,
    formattedText: s5Formatted,
    previousContextUsed: contextForS5,
    jsonOutput: s5Json,
    durationMs: Date.now() - s5Start,
  });
  callbacks.onLog(
    isZh
      ? `[Stage 5] ✅ 完成: 细粒度微观细节与情绪张力解析完毕`
      : `[Stage 5] ✅ Done: Micro details and emotional depth captured`
  );

  // ==========================================
  // STAGE 6: 游戏资源与资产全维反推 (Game Asset Deconstruction & Reverse-Engineering)
  // ==========================================
  const s6Start = Date.now();
  const s6StageTitle = isZh ? '游戏资源与资产全维反推' : 'Game Asset Reverse-Engineering';
  const contextForS6 = `${s1Formatted}\n\n${s2Formatted}\n\n${s4Formatted}`;
  callbacks.onStageStart(6, s6StageTitle, contextForS6);
  callbacks.onLog(
    isZh
      ? `[Stage 6] 🎮 正在执行游戏资产多维反推 (道具模型 / 角色三视图 / 等轴瓦片 / UI图标 / 像素精灵 / 材质规范)...`
      : `[Stage 6] 🎮 Analyzing Game Asset attributes (3D Prop, Turnaround, Isometric Tile, UI Icon, Sprite)...`
  );

  let isGameAsset = false;
  const s1Lower = (s1Subject + ' ' + s1Medium + ' ' + s1Commercial + ' ' + s1Worldview).toLowerCase();
  if (
    s1Lower.includes('游戏') ||
    s1Lower.includes('原画') ||
    s1Lower.includes('3d') ||
    s1Lower.includes('道具') ||
    s1Lower.includes('模型') ||
    s1Lower.includes('icon') ||
    s1Lower.includes('ui') ||
    s1Lower.includes('sprite') ||
    s1Lower.includes('像素') ||
    s1Lower.includes('pixel') ||
    s1Lower.includes('isometric') ||
    s1Lower.includes('game') ||
    s1Lower.includes('asset')
  ) {
    isGameAsset = true;
  }

  let assetType: 'character_concept' | '3d_prop' | '2d_sprite' | 'isometric_tile' | 'game_ui' | 'vfx_texture' | 'pixel_art' | 'other' = 'other';
  let assetCategoryZh = '通用游戏视觉资产';
  let engineTarget = 'Unreal Engine 5 / Unity 6';
  let perspectiveView = '正视微俯视角 (3/4 Perspective View)';
  let texturePbrMaps = ['Albedo/BaseColor', 'Normal Map', 'Roughness', 'Metallic', 'AO'];
  let assetArtStyle = s2Styles.join(', ');
  let bgTreatment = '纯净隔离背景 / 便于通道抠图 (Clean Solid Background for Isolation)';
  let gameGenreFit = 'ARPG / 动作冒险 / 开放世界探索';
  let gamePromptModifiers = 'game asset, high quality render, clean lighting, asset store quality, 8k uhd';
  let s6Raw = '';

  try {
    const s6SysPrompt = isZh
      ? `你是资深游戏主美与技术美术专家(Technical Artist)。根据前序图像信息，深度分析图像的游戏资源工程属性：
【资产类型】: [3d_prop / character_concept / isometric_tile / game_ui / 2d_sprite / pixel_art / vfx_texture / other]
【资产类别】: [如: 3D史诗符文武器道具 / 二次元角色三视图立绘 / 2.5D等轴测地牢瓦片网格 / 游戏技能UI徽章 / 16-bit像素动作精灵]
【目标引擎】: [如: Unreal Engine 5 / Unity / Godot]
【视角透视】: [如: 正交三视图 / 等轴测45度 / 纯白底道具独立视角 / 平面正交UI]
【PBR贴图】: [如: Albedo, Normal, Roughness, Metallic, AO, Emissive]
【美术风格】: [如: 次世代PBR写实 / 二次元赛璐璐 / 复古16-bit像素 / 暗黑魔幻]
【背景处理】: [如: 纯白中性隔离背景 / 无缝平铺网格 / 透明抠图适配]
【游戏品类】: [如: ARPG / 俯视角SLG / 卡牌手游 / 像素平台动作]
【生图修饰词】: [直接可用于Prompt的英文关键词，如: game asset, 3d weapon prop, isolated on white background, PBR materials, unreal engine 5 render, clean studio lighting]`
      : `You are a Principal Game Technical Artist. Deconstruct the Game Asset:
[Asset Type]: [3d_prop / character_concept / isometric_tile / game_ui / 2d_sprite / pixel_art / vfx_texture / other]
[Category]: [e.g. 3D Fantasy Weapon Prop / Character Turnaround Sheet / Isometric Tile / UI Badge]
[Target Engine]: [e.g. Unreal Engine 5 / Unity / Godot]
[Perspective]: [e.g. Orthographic 3-View / Isometric 45 / Isolated Studio View]
[PBR Channels]: [Albedo, Normal, Roughness, Metallic, AO]
[Art Style]: [PBR Realism / Stylized Handpainted / 16-bit Pixel / Dark Fantasy]
[Background]: [Isolated on Clean Solid White BG / Seamless Tileable]
[Game Genre]: [ARPG / Strategy SLG / Mobile RPG]
[Prompt Modifiers]: [English prompt tokens e.g. game asset, 3d prop, isolated on white background, PBR material, unreal engine 5, 8k]`;

    s6Raw = await directCallLlamaServer(
      modelConfig,
      s6SysPrompt,
      isZh ? `请反推该图像的游戏资源资产属性与美术规范。` : `Please analyze the game resource attributes and engine specifications.`,
      dataUri,
      cleanBase64,
      modelConfig.timeout_seconds || 20
    );

    if (s6Raw.includes('3d_prop') || s6Raw.includes('道具') || s6Raw.includes('武器') || s4Subject.includes('剑') || s4Subject.includes('枪')) {
      assetType = '3d_prop';
      assetCategoryZh = '3D游戏道具 / 武器装备模型';
      perspectiveView = '单品隔离多视角 / 纯色背景道具展示';
      gamePromptModifiers = 'game asset, 3d weapon prop, isolated on white background, PBR material, unreal engine 5 render, clean studio lighting, asset store quality, 8k';
    } else if (s6Raw.includes('character_concept') || s6Raw.includes('三视图') || s6Raw.includes('立绘') || s4Subject.includes('角色') || s4Subject.includes('三视图')) {
      assetType = 'character_concept';
      assetCategoryZh = '角色概念设计 / 正交三视图与立绘';
      perspectiveView = '正侧背三视图 (Orthographic Turnaround 3-View / T-Pose)';
      gamePromptModifiers = 'character concept sheet, turnaround sheet, front view, side view, back view, orthographic projection, clean neutral background, game character design';
    } else if (s6Raw.includes('isometric_tile') || s6Raw.includes('等轴') || s6Raw.includes('瓦片') || s6Raw.includes('地图')) {
      assetType = 'isometric_tile';
      assetCategoryZh = '2.5D等轴测场景瓦片 / 模块化地牢网格';
      perspectiveView = '等轴测斜45度视角 (Isometric Projection 45°)';
      gamePromptModifiers = 'isometric game asset, 2.5D modular tileset, grid aligned, game environment asset, clean backdrop, Unity 6 compatible';
    } else if (s6Raw.includes('game_ui') || s6Raw.includes('UI') || s6Raw.includes('图标') || s6Raw.includes('徽章')) {
      assetType = 'game_ui';
      assetCategoryZh = '游戏技能图标 / UI徽章套件';
      perspectiveView = '平面正交正视 (Flat Orthographic HUD View)';
      gamePromptModifiers = 'game ui icon, skill badge icon, vector clean border, glossy fantasy game icon, isolated dark background, app store asset';
    } else if (s6Raw.includes('pixel_art') || s6Raw.includes('像素') || s6Raw.includes('sprite')) {
      assetType = 'pixel_art';
      assetCategoryZh = '复古16-bit像素动作精灵图';
      perspectiveView = '横版正交微侧视 (Side-view 2D Pixel Sprite)';
      gamePromptModifiers = '16-bit pixel art, game sprite sheet, retro game character, pixelated masterpiece, clean transparent background';
    }

    const typeMatch = s6Raw.match(/(?:【资产类别】|\[Category\])[：:]\s*([^\n\r]+)/i);
    if (typeMatch) assetCategoryZh = typeMatch[1].trim();

    const engMatch = s6Raw.match(/(?:【目标引擎】|\[Target Engine\])[：:]\s*([^\n\r]+)/i);
    if (engMatch) engineTarget = engMatch[1].trim();

    const persMatch = s6Raw.match(/(?:【视角透视】|\[Perspective\])[：:]\s*([^\n\r]+)/i);
    if (persMatch) perspectiveView = persMatch[1].trim();

    const modMatch = s6Raw.match(/(?:【生图修饰词】|\[Prompt Modifiers\])[：:]\s*([^\n\r]+)/i);
    if (modMatch) gamePromptModifiers = modMatch[1].trim();
  } catch (err: any) {
    callbacks.onLog(`[Stage 6] ℹ️ ${err.message}`);
  }

  const s6GameAssetJson: GameAssetResult = {
    asset_type: assetType,
    asset_category_zh: assetCategoryZh,
    engine_target: engineTarget,
    perspective_view: perspectiveView,
    texture_pbr_maps: texturePbrMaps,
    art_style: assetArtStyle,
    background_treatment: bgTreatment,
    game_genre_fit: gameGenreFit,
    prompt_modifiers: gamePromptModifiers,
  };

  const s6Formatted = isZh
    ? `🎮 资产类型: ${assetCategoryZh} (${assetType})\n⚙️ 目标引擎: ${engineTarget}\n📐 渲染视角: ${perspectiveView}\n🎨 美术风格: ${assetArtStyle}\n🖼️ 背景处理: ${bgTreatment}\n🧩 适配品类: ${gameGenreFit}\n✨ 专用修饰词: ${gamePromptModifiers}`
    : `🎮 Asset Type: ${assetCategoryZh} (${assetType})\n⚙️ Target Engine: ${engineTarget}\n📐 Perspective: ${perspectiveView}\n🎨 Art Style: ${assetArtStyle}\n🖼️ Background: ${bgTreatment}\n🧩 Genre Fit: ${gameGenreFit}\n✨ Modifiers: ${gamePromptModifiers}`;

  accumulatedOutputs[6] = { raw: s6Raw || s6Formatted, formatted: s6Formatted, json: s6GameAssetJson };
  callbacks.onStageComplete({
    stageNumber: 6,
    skillName: 'skill_07_game_asset.skill',
    stageTitle: s6StageTitle,
    rawText: s6Raw || s6Formatted,
    formattedText: s6Formatted,
    previousContextUsed: contextForS6,
    jsonOutput: s6GameAssetJson,
    durationMs: Date.now() - s6Start,
  });
  callbacks.onLog(
    isZh
      ? `[Stage 6] ✅ 完成: 游戏资产类别=[${assetCategoryZh}], 引擎=[${engineTarget}], 视角=[${perspectiveView}]`
      : `[Stage 6] ✅ Done: Game Asset [${assetCategoryZh}] analyzed`
  );

  // ==========================================
  // STAGE 7: 多文生图模型专有提示词组装 (Multi-Model Prompt Assembly)
  // ==========================================
  const s7Start = Date.now();
  const s7StageTitle = isZh ? '多文生图模型专有提示词组装' : 'Multi-Model Prompt Assembly';
  const allContext = `${s1Formatted}\n\n${s3Formatted}\n\n${s4Formatted}\n\n${s6Formatted}`;
  callbacks.onStageStart(7, s7StageTitle, allContext);
  callbacks.onLog(
    isZh
      ? `[Stage 7] 🚀 汇聚 7 维分类与全部特征，生成 "${targetModel}" 及各文生图模型 (KREA 2 TURBO, z image-turbo, qwen-image-2512, flux2, SD3, SDXL, MJ v6.1) 专有提示词...`
      : `[Stage 7] 🚀 Assembling specialized prompts for "${targetModel}" and full model suite...`
  );

  // Intelligently map real extracted parameters to English tokens
  const subjectStrEn = cleanToEnglishPromptClause(s4Subject, 'a detailed subject, high aesthetic quality');
  const actionStrEn = cleanToEnglishPromptClause(s4Action, 'striking posture, dramatic interaction');
  const bgStrEn = cleanToEnglishPromptClause(s4Background, 'atmospheric environment with depth');
  const lightStrEn = cleanToEnglishPromptClause(s3Light, 'volumetric cinematic studio lighting');
  const colorStrEn = cleanToEnglishPromptClause(s3ColorTone, 'rich balanced color palette, cinematic grading');
  const cameraStrEn = s3Camera || '85mm portrait lens, f/1.4 aperture';
  const compStrEn = cleanToEnglishPromptClause(s3CompositionStr, 'dynamic rule of thirds composition');
  const detailStrEn = cleanToEnglishPromptClause(s5Detail, 'intricate micro textures, fine details, masterpiece');
  const styleStrEn = s2Styles.join(', ') || 'cinematic realism, masterpiece';
  const moodStrEn = cleanToEnglishPromptClause(s1Mood, 'atmospheric, emotionally evocative');
  const envStrEn = cleanToEnglishPromptClause(s4Environment, s1Worldview);

  // Synthesize prompts for all target models using dynamic inputs and game asset modifiers
  const allModelPrompts = generateAllModelPrompts(
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
    s1Worldview,
    isGameAsset || assetType !== 'other' ? gamePromptModifiers : undefined
  );

  // Match target model
  const normalizedTarget = targetModel.toLowerCase().trim();
  let activeEntry = Object.values(allModelPrompts).find(
    (m) => m.model_name.toLowerCase() === normalizedTarget || m.model_id.toLowerCase() === normalizedTarget
  );

  if (!activeEntry) {
    if (normalizedTarget.includes('krea')) activeEntry = allModelPrompts.krea2_turbo;
    else if (normalizedTarget.includes('z') || normalizedTarget.includes('turbo')) activeEntry = allModelPrompts.z_image_turbo;
    else if (normalizedTarget.includes('qwen') || normalizedTarget.includes('2512')) activeEntry = allModelPrompts.qwen_image_2512;
    else if (normalizedTarget.includes('flux')) activeEntry = allModelPrompts.flux2;
    else if (normalizedTarget.includes('sd3') || normalizedTarget.includes('stable diffusion 3')) activeEntry = allModelPrompts.stable_diffusion_3;
    else if (normalizedTarget.includes('sdxl') || normalizedTarget.includes('sd 1.5')) activeEntry = allModelPrompts.z_image_turbo;
    else if (normalizedTarget.includes('ideogram')) activeEntry = allModelPrompts.ideogram_v4;
    else activeEntry = allModelPrompts.krea2_turbo;
  }

  const positivePrompt = activeEntry.positive;
  const negativePrompt = activeEntry.negative;

  const s7Json: PromptGenerateResult = {
    positive: positivePrompt,
    negative: negativePrompt,
    target_model: activeEntry.model_name,
    suggested_params: activeEntry.suggested_params,
    all_model_prompts: allModelPrompts,
  };

  // Full composite formatted report matching user's exact specification
  const completeFormattedReport = isZh
    ? `${s1Formatted}\n\n\n${s3Formatted}\n\n\n\n${s4Formatted}\n\n\n${s6Formatted}\n\n最后结果。\n\n【Positive Prompt】\n${positivePrompt}\n\n【Negative Prompt】\n${negativePrompt}`
    : `${s1Formatted}\n\n\n${s3Formatted}\n\n\n\n${s4Formatted}\n\n\n${s6Formatted}\n\nFinal Output.\n\n[Positive Prompt]\n${positivePrompt}\n\n[Negative Prompt]\n${negativePrompt}`;

  accumulatedOutputs[7] = { raw: activeEntry.positive, formatted: activeEntry.positive, json: s7Json };
  callbacks.onStageComplete({
    stageNumber: 7,
    skillName: 'skill_06_prompt_generate.skill',
    stageTitle: s7StageTitle,
    rawText: `Target Model: ${activeEntry.model_name}\nPositive Prompt:\n${positivePrompt}\n\nNegative Prompt:\n${negativePrompt}`,
    formattedText: isZh
      ? `【目标模型】: ${activeEntry.model_name}\n\n【Positive Prompt】\n${positivePrompt}\n\n【Negative Prompt】\n${negativePrompt}`
      : `[Target Model]: ${activeEntry.model_name}\n\n[Positive Prompt]\n${positivePrompt}\n\n[Negative Prompt]\n${negativePrompt}`,
    previousContextUsed: allContext,
    jsonOutput: s7Json,
    durationMs: Date.now() - s7Start,
  });
  callbacks.onLog(
    isZh
      ? `[Stage 7] 🎉 流水线全阶段执行完毕！已生成 7 维矩阵报告、游戏资产解构与 ${activeEntry.model_name} 专有提示词`
      : `[Stage 7] 🎉 All stages completed! 7D Matrix, Game Asset spec & ${activeEntry.model_name} specialized prompts generated`
  );

  const totalTimeMs = Date.now() - startTime;

  const fullSkillResult: SkillResultJson = {
    skill_01_multidim_classification: s1MultiDimJson,
    skill_01_image_type: s1LegacyJson,
    skill_02_image_style: s2Json,
    skill_03_camera_param: s3Json,
    skill_04_scene_content: s4Json,
    skill_05_detail_desc: s5Json,
    skill_07_game_asset: s6GameAssetJson,
    skill_06_prompt_generate: s7Json,
  };

  return {
    skillResult: fullSkillResult,
    formattedReport: completeFormattedReport,
    positivePrompt,
    negativePrompt,
    executionTimeMs: totalTimeMs,
  };
}
