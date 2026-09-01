import { HistoryItem, GenerationParams, Project, ComfyUiWorkflowTemplate } from '../types';
import { DEFAULT_COMFY_WORKFLOWS } from '../data/defaultComfyWorkflows';
import {
  sanitizeWorkflowJsonForValidation,
  formatWorkflowJsonWithPlaceholders,
  resolveWorkflowJsonTemplate,
  extractPlaceholdersFromWorkflowJson,
} from '../utils/comfyPlaceholderUtils';

export { formatWorkflowJsonWithPlaceholders };

export interface AspectRatioOption {
  ratio: string;
  label: string;
  width: number;
  height: number;
  description: string;
}

export const ASPECT_RATIO_PRESETS: AspectRatioOption[] = [
  { ratio: '1:1', label: '1:1 正方形 (Square)', width: 1024, height: 1024, description: '社交头像/通用头像/主图' },
  { ratio: '16:9', label: '16:9 宽屏 (Landscape)', width: 1344, height: 768, description: '桌面壁纸/影视横版/场景大图' },
  { ratio: '9:16', label: '9:16 竖屏 (Portrait)', width: 768, height: 1344, description: '手机壁纸/短视频/海报封面' },
  { ratio: '3:2', label: '3:2 相机横画幅 (Classic 3:2)', width: 1216, height: 832, description: '经典单反画幅/风景摄影' },
  { ratio: '2:3', label: '2:3 相机竖画幅 (Portrait 2:3)', width: 832, height: 1216, description: '人像写真/时尚摄影/角色立绘' },
  { ratio: '4:3', label: '4:3 传统横屏 (Classic 4:3)', width: 1024, height: 768, description: '传统画幅/插画/概念设定' },
  { ratio: '3:4', label: '3:4 传统竖屏 (Portrait 3:4)', width: 768, height: 1024, description: '图书封面/动漫插画/头像半身' },
  { ratio: '21:9', label: '21:9 电影级宽银幕 (Cinematic)', width: 1536, height: 640, description: '电影宽银幕/科幻全景大片' },
];

export const SAMPLER_OPTIONS = [
  'euler',
  'euler_ancestral',
  'dpmpp_2m',
  'dpmpp_2m_sde',
  'dpmpp_sde',
  'dpmpp_3m_sde',
  'ddim',
  'uni_pc',
  'heun',
  'lms'
];

export const SCHEDULER_OPTIONS = [
  'normal',
  'karras',
  'exponential',
  'sgm_uniform',
  'simple',
  'ddim_uniform'
];

/**
 * Check ComfyUI server connectivity and fetch available models
 */
export async function checkComfyUiHealth(endpoint: string = 'http://127.0.0.1:8188'): Promise<{
  ok: boolean;
  online: boolean;
  version?: string;
  system?: any;
  devices?: any;
  queueRemaining?: number;
  checkpoints?: string[];
  error?: string;
}> {
  const cleanEndpoint = endpoint.replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${cleanEndpoint}/system_stats`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let checkpoints: string[] = [];
    try {
      checkpoints = await fetchComfyUiCheckpoints(cleanEndpoint);
    } catch {}

    if (!res.ok) {
      // Fallback check /queue
      const queueRes = await fetch(`${cleanEndpoint}/queue`);
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        return {
          ok: true,
          online: true,
          queueRemaining: (queueData.queue_running?.length || 0) + (queueData.queue_pending?.length || 0),
          checkpoints,
        };
      }
      return { ok: false, online: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return {
      ok: true,
      online: true,
      system: data.system,
      devices: data.devices,
      checkpoints,
    };
  } catch (err: any) {
    return {
      ok: false,
      online: false,
      error: err.name === 'AbortError' ? '连接超时 (4s)' : (err.message || '无法连接 ComfyUI 服务，请确保服务已启动并允许跨域'),
    };
  }
}

/**
 * Fetch available Checkpoints from ComfyUI server
 */
export async function fetchComfyUiCheckpoints(endpoint: string = 'http://127.0.0.1:8188'): Promise<string[]> {
  const cleanEndpoint = endpoint.replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${cleanEndpoint}/object_info/CheckpointLoaderSimple`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const ckptList = data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
      if (Array.isArray(ckptList) && ckptList.length > 0) {
        return ckptList;
      }
    }
  } catch (e) {
    // try fallback
  }

  // Fallback: try full /object_info
  try {
    const res = await fetch(`${cleanEndpoint}/object_info`);
    if (res.ok) {
      const allInfo = await res.json();
      const ckptList = allInfo?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] ||
        allInfo?.UNETLoader?.input?.required?.unet_name?.[0];
      if (Array.isArray(ckptList) && ckptList.length > 0) {
        return ckptList;
      }
    }
  } catch {}

  return [];
}


/**
 * Validate and inspect ComfyUI Workflow JSON string with placeholder tolerance
 */
export function validateWorkflowJson(jsonStr: string): {
  valid: boolean;
  error?: string;
  nodeCount?: number;
  nodes?: Array<{ id: string; class_type: string; title?: string }>;
  detectedNodes?: {
    positiveNodeId?: string;
    negativeNodeId?: string;
    latentNodeId?: string;
    samplerNodeId?: string;
    ckptNodeId?: string;
    saveNodeId?: string;
  };
  placeholders?: string[];
} {
  if (!jsonStr || !jsonStr.trim()) {
    return { valid: false, error: '工作流 JSON 不能为空' };
  }

  try {
    // 1. Sanitize unquoted placeholders (e.g. "width": {{image_width}}) before JSON parse
    const sanitized = sanitizeWorkflowJsonForValidation(jsonStr);
    let parsed: any;
    try {
      parsed = JSON.parse(sanitized);
    } catch (e: any) {
      return { valid: false, error: `JSON 语法错误: ${e.message}` };
    }

    // ComfyUI prompt API format is an object where keys are node IDs
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { valid: false, error: '工作流必须为 ComfyUI API Prompt 对象 (键为节点ID)' };
    }

    const nodeIds = Object.keys(parsed);
    if (nodeIds.length === 0) {
      return { valid: false, error: '工作流中未包含任何节点' };
    }

    const nodesList: Array<{ id: string; class_type: string; title?: string }> = [];
    const detected: {
      positiveNodeId?: string;
      negativeNodeId?: string;
      latentNodeId?: string;
      samplerNodeId?: string;
      ckptNodeId?: string;
      saveNodeId?: string;
    } = {};

    for (const id of nodeIds) {
      const node = parsed[id];
      if (typeof node !== 'object' || !node.class_type) {
        return { valid: false, error: `节点 [${id}] 缺少必要的 class_type 属性` };
      }
      const title = node._meta?.title || node.class_type;
      nodesList.push({ id, class_type: node.class_type, title });

      const ctype = String(node.class_type).toLowerCase();
      const metaTitle = String(node._meta?.title || '').toLowerCase();

      // Detect CLIP text encode (positive vs negative)
      if (ctype.includes('cliptextencode') || ctype.includes('prompt') || ctype.includes('textencode')) {
        if (metaTitle.includes('negative') || metaTitle.includes('负向') || metaTitle.includes('反向')) {
          if (!detected.negativeNodeId) detected.negativeNodeId = id;
        } else if (metaTitle.includes('positive') || metaTitle.includes('正向')) {
          if (!detected.positiveNodeId) detected.positiveNodeId = id;
        } else if (!detected.positiveNodeId) {
          detected.positiveNodeId = id;
        } else if (!detected.negativeNodeId) {
          detected.negativeNodeId = id;
        }
      }

      // Detect EmptyLatentImage / EmptySD3LatentImage / EmptyImage
      if (
        ctype.includes('latent') ||
        ctype.includes('emptylatent') ||
        ctype.includes('emptyimage') ||
        ctype.includes('sd3latent') ||
        metaTitle.includes('latent') ||
        metaTitle.includes('empty image')
      ) {
        if (!detected.latentNodeId) detected.latentNodeId = id;
      }

      // Detect Sampler (KSampler, KSamplerAdvanced, etc.)
      if (ctype.includes('sampler') || metaTitle.includes('sampler')) {
        if (!detected.samplerNodeId) detected.samplerNodeId = id;
      }

      // Detect Checkpoint or Unet
      if (
        ctype.includes('checkpoint') ||
        ctype.includes('ckpt') ||
        ctype.includes('unetloader') ||
        metaTitle.includes('checkpoint') ||
        metaTitle.includes('unet')
      ) {
        if (!detected.ckptNodeId) detected.ckptNodeId = id;
      }

      // Detect SaveImage / PreviewImage
      if (ctype.includes('saveimage') || ctype.includes('previewimage') || metaTitle.includes('save image')) {
        if (!detected.saveNodeId) detected.saveNodeId = id;
      }
    }

    const placeholders = extractPlaceholdersFromWorkflowJson(jsonStr);

    return {
      valid: true,
      nodeCount: nodeIds.length,
      nodes: nodesList,
      detectedNodes: detected,
      placeholders,
    };
  } catch (err: any) {
    return { valid: false, error: err.message || '未知校验错误' };
  }
}

/**
 * Format JSON string safely preserving placeholders
 */
export function formatWorkflowJson(jsonStr: string): string {
  return formatWorkflowJsonWithPlaceholders(jsonStr);
}

/**
 * Build unified ComfyUI text2img prompt workflow graph with support for
 * custom workflows and standard KSampler pipelines.
 */
export function buildComfyUiWorkflowGraph(params: {
  positivePrompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  samplerName: string;
  scheduler: string;
  seed: number;
  denoise: number;
  batchSize: number;
  filenamePrefix: string;
  ckptName?: string;
  workflowTemplate?: ComfyUiWorkflowTemplate | null;
  serverCheckpoints?: string[];
}): Record<string, any> {
  const seed =
    params.seed === -1 || params.seed === undefined || isNaN(Number(params.seed))
      ? Math.floor(Math.random() * 1000000000000)
      : Number(params.seed);

  const steps = Number(params.steps) > 0 ? Number(params.steps) : 20;
  const cfgScale = Number(params.cfgScale) > 0 ? Number(params.cfgScale) : 2.5;
  const width = Number(params.width) > 0 ? Number(params.width) : 1024;
  const height = Number(params.height) > 0 ? Number(params.height) : 1024;
  const batchSize = Number(params.batchSize) > 0 ? Number(params.batchSize) : 1;
  const denoise = params.denoise !== undefined && !isNaN(Number(params.denoise)) ? Number(params.denoise) : 1.0;
  const samplerName = params.samplerName || 'euler';
  const scheduler = params.scheduler || 'simple';
  const filenamePrefix = params.filenamePrefix || 'ComfyUI';

  // 1. Determine checkpoint name with fallback to available server checkpoints
  let defaultCkpt = params.ckptName || 'z-image-turbo-bf16-aio.safetensors';
  if (params.serverCheckpoints && params.serverCheckpoints.length > 0) {
    if (!params.serverCheckpoints.includes(defaultCkpt)) {
      // Find closest matching or use first
      const found = params.serverCheckpoints.find((c) =>
        c.toLowerCase().includes('turbo') ||
        c.toLowerCase().includes('z') ||
        c.toLowerCase().includes('sdxl') ||
        c.toLowerCase().includes('qwen') ||
        c.toLowerCase().includes('flux') ||
        c.toLowerCase().includes('sd3')
      );
      defaultCkpt = found || params.serverCheckpoints[0];
    }
  }

  // 2. If a custom workflow template is supplied, use it
  const templateToUse = params.workflowTemplate || DEFAULT_COMFY_WORKFLOWS[0];

  if (templateToUse && templateToUse.workflow_json) {
    try {
      // Variable map for placeholders like {{positive_prompt}}, {{image_width}}, {{image_height}}, etc.
      const varMap: Record<string, any> = {
        positive_prompt: params.positivePrompt || '',
        negative_prompt: params.negativePrompt || '',
        image_width: width,
        image_height: height,
        width: width,
        height: height,
        steps: steps,
        cfg_scale: cfgScale,
        cfg: cfgScale,
        sampler_name: samplerName,
        sampler: samplerName,
        scheduler: scheduler,
        seed: seed,
        denoise: denoise,
        batch_size: batchSize,
        filename_prefix: filenamePrefix,
        ckpt_name: defaultCkpt,
      };

      // 1. Resolve raw JSON template with text-level & deep placeholder replacements
      let graph: Record<string, any> = resolveWorkflowJsonTemplate(templateToUse.workflow_json, varMap);

      // 2. Apply Node Mappings and Smart Node Injection
      const mapping = templateToUse.node_mappings || {};
      const validation = validateWorkflowJson(JSON.stringify(graph));
      const detected = validation.detectedNodes || {};

      // Positive Prompt Node injection
      const posNodeId = mapping.positive_prompt_node || detected.positiveNodeId;
      if (posNodeId && graph[posNodeId] && graph[posNodeId].inputs) {
        const field = mapping.positive_prompt_field || 'text';
        graph[posNodeId].inputs[field] = params.positivePrompt || '';
      }

      // Negative Prompt Node injection
      const negNodeId = mapping.negative_prompt_node || detected.negativeNodeId;
      if (negNodeId && graph[negNodeId] && graph[negNodeId].inputs) {
        const field = mapping.negative_prompt_field || 'text';
        graph[negNodeId].inputs[field] = params.negativePrompt || '';
      }

      // Latent Image / EmptyImage Dimension Node injection
      const latentNodeId = mapping.latent_image_node || detected.latentNodeId;
      if (latentNodeId && graph[latentNodeId] && graph[latentNodeId].inputs) {
        const inputs = graph[latentNodeId].inputs;
        const wField = mapping.width_field || 'width';
        const hField = mapping.height_field || 'height';
        
        if (!Array.isArray(inputs[wField])) {
          inputs[wField] = width;
        }
        if (!Array.isArray(inputs[hField])) {
          inputs[hField] = height;
        }
        if (inputs.batch_size !== undefined && !Array.isArray(inputs.batch_size)) {
          inputs.batch_size = batchSize;
        }
      }

      // Also check for EmptyImage node
      for (const [nId, nObj] of Object.entries(graph)) {
        if (nObj && typeof nObj === 'object' && nObj.class_type === 'EmptyImage' && nObj.inputs) {
          if (!Array.isArray(nObj.inputs.width)) nObj.inputs.width = width;
          if (!Array.isArray(nObj.inputs.height)) nObj.inputs.height = height;
        }
      }

      // Sampler Node injection
      const samplerNodeId = mapping.sampler_node || detected.samplerNodeId;
      if (samplerNodeId && graph[samplerNodeId] && graph[samplerNodeId].inputs) {
        const inputs = graph[samplerNodeId].inputs;
        if (inputs.seed !== undefined && !Array.isArray(inputs.seed)) inputs[mapping.seed_field || 'seed'] = seed;
        if (inputs.steps !== undefined && !Array.isArray(inputs.steps)) inputs[mapping.steps_field || 'steps'] = steps;
        if (inputs.cfg !== undefined && !Array.isArray(inputs.cfg)) inputs[mapping.cfg_field || 'cfg'] = cfgScale;
        if (inputs.sampler_name !== undefined && !Array.isArray(inputs.sampler_name)) inputs[mapping.sampler_field || 'sampler_name'] = samplerName;
        if (inputs.scheduler !== undefined && !Array.isArray(inputs.scheduler)) inputs[mapping.scheduler_field || 'scheduler'] = scheduler;
        if (inputs.denoise !== undefined && !Array.isArray(inputs.denoise)) inputs[mapping.denoise_field || 'denoise'] = denoise;
      }

      // Checkpoint Node injection
      const ckptNodeId = mapping.checkpoint_node || detected.ckptNodeId;
      if (ckptNodeId && graph[ckptNodeId] && graph[ckptNodeId].inputs) {
        const ckptField = mapping.ckpt_name_field || 'ckpt_name';
        if (params.ckptName) {
          graph[ckptNodeId].inputs[ckptField] = params.ckptName;
        } else if (params.serverCheckpoints && params.serverCheckpoints.length > 0) {
          const currentCkpt = graph[ckptNodeId].inputs[ckptField];
          if (currentCkpt && !params.serverCheckpoints.includes(currentCkpt)) {
            graph[ckptNodeId].inputs[ckptField] = defaultCkpt;
          }
        }
      }

      // Save Image Node injection
      const saveNodeId = mapping.save_image_node || detected.saveNodeId;
      if (saveNodeId && graph[saveNodeId] && graph[saveNodeId].inputs) {
        const prefixField = mapping.filename_prefix_field || 'filename_prefix';
        graph[saveNodeId].inputs[prefixField] = filenamePrefix;
      }

      return graph;
    } catch (e) {
      console.warn('Failed to parse workflow template JSON, falling back to default graph', e);
    }
  }

  // Fallback to built-in Z-Image Turbo / SDXL graph
  return {
    "3": {
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfgScale,
        "sampler_name": samplerName,
        "scheduler": scheduler,
        "denoise": denoise,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler",
      "_meta": {
        "title": "KSampler"
      }
    },
    "4": {
      "inputs": {
        "ckpt_name": defaultCkpt
      },
      "class_type": "CheckpointLoaderSimple",
      "_meta": {
        "title": "Load Checkpoint"
      }
    },
    "5": {
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": batchSize
      },
      "class_type": "EmptyLatentImage",
      "_meta": {
        "title": "Empty Latent Image"
      }
    },
    "6": {
      "inputs": {
        "text": params.positivePrompt || '',
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP Text Encode (Positive Prompt)"
      }
    },
    "7": {
      "inputs": {
        "text": params.negativePrompt || '',
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP Text Encode (Negative Prompt)"
      }
    },
    "8": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["4", 2]
      },
      "class_type": "VAEDecode",
      "_meta": {
        "title": "VAE Decode"
      }
    },
    "9": {
      "inputs": {
        "filename_prefix": filenamePrefix,
        "images": ["8", 0]
      },
      "class_type": "SaveImage",
      "_meta": {
        "title": "Save Image"
      }
    }
  };
}

/**
 * Queue a prompt to ComfyUI REST API with intelligent auto-repair on 400 Bad Request
 */
export async function queueComfyUiPrompt(
  endpoint: string,
  promptGraph: Record<string, any>,
  clientId: string = 'prompt_manager_client',
  retryCount: number = 0
): Promise<{ prompt_id: string; number?: number; autoRepaired?: boolean; repairNote?: string }> {
  const cleanEndpoint = endpoint.replace(/\/+$/, '');

  const res = await fetch(`${cleanEndpoint}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      prompt: promptGraph,
    }),
  });

  if (!res.ok) {
    let errJson: any = null;
    let errDetail = `HTTP ${res.status}: ${res.statusText}`;

    try {
      errJson = await res.json();
    } catch {}

    // Auto-repair on 400 Bad Request
    if (res.status === 400 && errJson && retryCount === 0) {
      console.warn('[ComfyUI 400 Error Detected, Attempting Auto-Repair]:', errJson);

      const nodeErrors = errJson.node_errors || {};
      let repairedGraph = JSON.parse(JSON.stringify(promptGraph));
      let repairMade = false;
      let repairNotes: string[] = [];

      // 1. Try to fetch available checkpoints from server
      let availableCheckpoints: string[] = [];
      try {
        availableCheckpoints = await fetchComfyUiCheckpoints(cleanEndpoint);
      } catch {}

      // 2. Inspect node errors
      for (const [nodeId, nErr] of Object.entries(nodeErrors) as [string, any][]) {
        const errors = nErr.errors || [];
        const classType = nErr.class_type;

        for (const err of errors) {
          // Checkpoint missing error: e.g. "Value not in list: ckpt_name: 'xyz' not in ['a.safetensors', ...]"
          if (err.type === 'value_not_in_list' && (err.message || '').includes('ckpt_name')) {
            // Extract valid list from message if available
            const match = /not in \[(.*?)\]/.exec(err.message);
            let candidates: string[] = availableCheckpoints;
            if (match && match[1]) {
              try {
                // Parse 'a.safetensors', 'b.safetensors'
                const parsedCandidates = match[1]
                  .split(',')
                  .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
                  .filter(Boolean);
                if (parsedCandidates.length > 0) candidates = parsedCandidates;
              } catch {}
            }

            if (candidates.length > 0 && repairedGraph[nodeId]?.inputs) {
              const fallbackModel = candidates[0];
              repairedGraph[nodeId].inputs.ckpt_name = fallbackModel;
              repairMade = true;
              repairNotes.push(`自动替换缺失模型为本地现有模型: ${fallbackModel}`);
            }
          }

          // Missing custom node class error: e.g. "Class not found: GetImageSize+"
          if (err.type === 'class_not_found') {
            repairNotes.push(`检测到缺少自定义插件节点 [${classType}]，已自动切换为标准原生通用工作流`);
            // Rebuild with basic universal native nodes
            const posText = Object.values(repairedGraph).find((n: any) => n.class_type === 'CLIPTextEncode' && !JSON.stringify(n._meta || '').toLowerCase().includes('negative')) as any;
            const negText = Object.values(repairedGraph).find((n: any) => n.class_type === 'CLIPTextEncode' && JSON.stringify(n._meta || '').toLowerCase().includes('negative')) as any;
            
            repairedGraph = buildComfyUiWorkflowGraph({
              positivePrompt: posText?.inputs?.text || '',
              negativePrompt: negText?.inputs?.text || '',
              width: 1024,
              height: 1024,
              steps: 20,
              cfgScale: 2.5,
              samplerName: 'euler',
              scheduler: 'simple',
              seed: -1,
              denoise: 1.0,
              batchSize: 1,
              filenamePrefix: 'RepairedOutput',
              serverCheckpoints: availableCheckpoints,
            });
            repairMade = true;
            break;
          }
        }
      }

      // If auto-repair was applied, retry immediately
      if (repairMade) {
        try {
          const retryRes = await queueComfyUiPrompt(cleanEndpoint, repairedGraph, clientId, 1);
          return {
            ...retryRes,
            autoRepaired: true,
            repairNote: repairNotes.join('; '),
          };
        } catch (retryErr: any) {
          console.error('[ComfyUI Auto-Repair Retry Failed]:', retryErr);
        }
      }
    }

    // Format comprehensive diagnostic error
    if (errJson && errJson.node_errors) {
      const errorSummaries: string[] = [];
      for (const [nodeId, nErr] of Object.entries(errJson.node_errors) as [string, any][]) {
        const msgs = (nErr.errors || []).map((e: any) => e.message).join(', ');
        errorSummaries.push(`• 节点 #${nodeId} [${nErr.class_type}]: ${msgs}`);
      }
      errDetail = `ComfyUI 节点校验未通过 (HTTP 400):\n` + errorSummaries.join('\n');
    } else if (errJson && errJson.error) {
      errDetail = typeof errJson.error === 'string' ? errJson.error : JSON.stringify(errJson.error);
    }

    throw new Error(`ComfyUI 队列提交失败:\n${errDetail}`);
  }

  const data = await res.json();
  if (!data.prompt_id) {
    throw new Error('ComfyUI 未返回 prompt_id: ' + JSON.stringify(data));
  }

  return { prompt_id: data.prompt_id, number: data.number };
}

/**
 * Poll ComfyUI task status until completion
 */
export async function pollComfyUiExecution(
  endpoint: string,
  promptId: string,
  onProgress?: (percent: number, statusText: string) => void,
  maxWaitSeconds: number = 180
): Promise<{ outputImages: string[]; durationMs: number }> {
  const cleanEndpoint = endpoint.replace(/\/+$/, '');
  const startTime = Date.now();
  let attempts = 0;

  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 1. Check history
    try {
      const res = await fetch(`${cleanEndpoint}/history/${promptId}`);
      if (res.ok) {
        const historyData = await res.json();
        const taskHistory = historyData[promptId];

        if (taskHistory && taskHistory.status) {
          if (taskHistory.status.status_str === 'error') {
            const errMsgs = taskHistory.status.messages || [];
            throw new Error(`ComfyUI 节点执行报错: ${JSON.stringify(errMsgs)}`);
          }

          if (taskHistory.outputs) {
            // Harvest generated images
            const images: string[] = [];
            for (const nodeId of Object.keys(taskHistory.outputs)) {
              const nodeOut = taskHistory.outputs[nodeId];
              if (nodeOut.images && Array.isArray(nodeOut.images)) {
                for (const img of nodeOut.images) {
                  const viewUrl = `${cleanEndpoint}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || '')}&type=${encodeURIComponent(img.type || 'output')}`;
                  images.push(viewUrl);
                }
              }
            }

            if (images.length > 0 || taskHistory.status.completed) {
              if (onProgress) onProgress(100, '执行完成');
              return {
                outputImages: images,
                durationMs: Date.now() - startTime,
              };
            }
          }
        }
      }

      // Check current queue
      const queueRes = await fetch(`${cleanEndpoint}/queue`);
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        const running = queueData.queue_running || [];
        const pending = queueData.queue_pending || [];

        const isRunning = running.some((item: any) => item[1] === promptId);
        const isPending = pending.some((item: any) => item[1] === promptId);

        if (isRunning) {
          const simulatedProgress = Math.min(90, 20 + attempts * 5);
          if (onProgress) onProgress(simulatedProgress, `ComfyUI 正在采样生成中... (${(attempts * 1.5).toFixed(1)}s)`);
        } else if (isPending) {
          if (onProgress) onProgress(10, `在 ComfyUI 队列等待中... (排队 ${pending.length} 个任务)`);
        }
      }
    } catch (e: any) {
      if (e.message && e.message.includes('ComfyUI 节点执行报错')) {
        throw e;
      }
      console.warn('[ComfyUI Poll Error]:', e);
    }
  }

  throw new Error(`ComfyUI 执行超时 (${maxWaitSeconds}s)，请检查 ComfyUI 控制台输出`);
}

/**
 * Execute full prompt generation on ComfyUI with specified workflow template
 */
export async function executeItemOnComfyUi(
  item: HistoryItem,
  projectOrConfig: {
    endpoint?: string;
    output_dir?: string;
    name?: string;
    params?: GenerationParams;
    workflowTemplate?: ComfyUiWorkflowTemplate | null;
  },
  onProgress?: (progress: number, text: string) => void
): Promise<{
  ok: boolean;
  prompt_id?: string;
  outputImages?: string[];
  durationMs?: number;
  error?: string;
  autoRepaired?: boolean;
  repairNote?: string;
}> {
  const endpoint = projectOrConfig.endpoint || 'http://127.0.0.1:8188';
  const width = item.dimensions?.width || 1024;
  const height = item.dimensions?.height || 1024;
  const params: GenerationParams = item.generation_params || projectOrConfig.params || {
    cfg_scale: 2.5,
    steps: 20,
    sampler: 'euler',
    scheduler: 'simple',
    seed: -1,
    denoise: 1.0,
    batch_size: 1,
  };

  const filenamePrefix = (projectOrConfig.name || 'PromptManager')
    .replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '_')
    .substring(0, 30);

  try {
    if (onProgress) onProgress(5, '正在连接 ComfyUI REST API 服务...');

    // 1. Fetch available checkpoints for smart fallback
    let serverCheckpoints: string[] = [];
    try {
      serverCheckpoints = await fetchComfyUiCheckpoints(endpoint);
    } catch {}

    const promptGraph = buildComfyUiWorkflowGraph({
      positivePrompt: item.positive_prompt,
      negativePrompt: item.negative_prompt,
      width,
      height,
      steps: params.steps,
      cfgScale: params.cfg_scale,
      samplerName: params.sampler,
      scheduler: params.scheduler || 'simple',
      seed: params.seed ?? -1,
      denoise: params.denoise ?? 1.0,
      batchSize: params.batch_size || 1,
      filenamePrefix,
      ckptName: params.ckpt_name,
      workflowTemplate: projectOrConfig.workflowTemplate,
      serverCheckpoints,
    });

    if (onProgress) onProgress(15, '已发送 Prompt 工作流至 ComfyUI 队列...');
    const queueRes = await queueComfyUiPrompt(endpoint, promptGraph);

    if (queueRes.autoRepaired && queueRes.repairNote) {
      if (onProgress) onProgress(20, `💡 ${queueRes.repairNote}`);
    }

    if (onProgress) onProgress(25, `任务已排入队列 (ID: ${queueRes.prompt_id.substring(0, 8)}...)`);

    const executionResult = await pollComfyUiExecution(endpoint, queueRes.prompt_id, onProgress);

    return {
      ok: true,
      prompt_id: queueRes.prompt_id,
      outputImages: executionResult.outputImages,
      durationMs: executionResult.durationMs,
      autoRepaired: queueRes.autoRepaired,
      repairNote: queueRes.repairNote,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || 'ComfyUI 执行发生未知错误',
    };
  }
}

