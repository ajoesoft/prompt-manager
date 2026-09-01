import { ComfyUiWorkflowTemplate } from '../types';

export const DEFAULT_COMFY_WORKFLOWS: ComfyUiWorkflowTemplate[] = [
  {
    id: 'z-image-turbo',
    name: 'Z-Image Turbo 极速通用工作流 (标准原生架构)',
    display_name: 'Z-Image Turbo',
    badge_color: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
    description: '官方推荐：基于原生 Checkpoint + Latent + KSampler 极速采样架构，无需安装第三方扩展，即装即用',
    author: 'Z-Image Turbo / Universal Native',
    target_model: 'z-image-turbo',
    workflow_type: 'turbo',
    is_builtin: true,
    is_default: true,
    node_mappings: {
      positive_prompt_node: '6',
      positive_prompt_field: 'text',
      negative_prompt_node: '7',
      negative_prompt_field: 'text',
      latent_image_node: '5',
      width_field: 'width',
      height_field: 'height',
      sampler_node: '3',
      seed_field: 'seed',
      steps_field: 'steps',
      cfg_field: 'cfg',
      sampler_field: 'sampler_name',
      scheduler_field: 'scheduler',
      denoise_field: 'denoise',
      checkpoint_node: '4',
      ckpt_name_field: 'ckpt_name',
      save_image_node: '9',
      filename_prefix_field: 'filename_prefix',
    },
    workflow_json: JSON.stringify(
      {
        "3": {
          "inputs": {
            "seed": 384476551898328,
            "steps": 20,
            "cfg": 3.0,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1,
            "model": ["4", 0],
            "positive": ["6", 0],
            "negative": ["7", 0],
            "latent_image": ["5", 0]
          },
          "class_type": "KSampler",
          "_meta": {
            "title": "KSampler (Z-Image Turbo)"
          }
        },
        "4": {
          "inputs": {
            "ckpt_name": "z-image-turbo-bf16-aio.safetensors"
          },
          "class_type": "CheckpointLoaderSimple",
          "_meta": {
            "title": "Load Checkpoint (Z-Image Turbo)"
          }
        },
        "5": {
          "inputs": {
            "width": 1024,
            "height": 1024,
            "batch_size": 1
          },
          "class_type": "EmptyLatentImage",
          "_meta": {
            "title": "Empty Latent Image (image_width x image_height)"
          }
        },
        "6": {
          "inputs": {
            "text": "{{positive_prompt}}",
            "clip": ["4", 1]
          },
          "class_type": "CLIPTextEncode",
          "_meta": {
            "title": "CLIP Text Encode (Positive Prompt)"
          }
        },
        "7": {
          "inputs": {
            "text": "{{negative_prompt}}",
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
            "filename_prefix": "ZImageTurbo",
            "images": ["8", 0]
          },
          "class_type": "SaveImage",
          "_meta": {
            "title": "Save Image"
          }
        }
      },
      null,
      2
    ),
  },
  {
    id: 'krea2-turbo',
    name: 'Krea-2 Turbo 流式生成通用工作流 (标准原生架构)',
    display_name: 'Krea-2 Turbo',
    badge_color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Krea-2 极速流式采样标准工作流，支持低步数、低 CFG 快速出图',
    author: 'Krea AI / Universal Native',
    target_model: 'krea2-turbo',
    workflow_type: 'krea',
    is_builtin: true,
    is_default: false,
    node_mappings: {
      positive_prompt_node: '6',
      positive_prompt_field: 'text',
      negative_prompt_node: '7',
      negative_prompt_field: 'text',
      latent_image_node: '5',
      width_field: 'width',
      height_field: 'height',
      sampler_node: '3',
      seed_field: 'seed',
      steps_field: 'steps',
      cfg_field: 'cfg',
      sampler_field: 'sampler_name',
      scheduler_field: 'scheduler',
      denoise_field: 'denoise',
      checkpoint_node: '4',
      ckpt_name_field: 'ckpt_name',
      save_image_node: '9',
      filename_prefix_field: 'filename_prefix',
    },
    workflow_json: JSON.stringify(
      {
        "3": {
          "inputs": {
            "seed": 1078089108025759,
            "steps": 12,
            "cfg": 1.0,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1,
            "model": ["4", 0],
            "positive": ["6", 0],
            "negative": ["7", 0],
            "latent_image": ["5", 0]
          },
          "class_type": "KSampler",
          "_meta": {
            "title": "KSampler (Krea-2 Turbo)"
          }
        },
        "4": {
          "inputs": {
            "ckpt_name": "krea-2-turbo.safetensors"
          },
          "class_type": "CheckpointLoaderSimple",
          "_meta": {
            "title": "Load Checkpoint (Krea-2 Turbo)"
          }
        },
        "5": {
          "inputs": {
            "width": 1024,
            "height": 1024,
            "batch_size": 1
          },
          "class_type": "EmptyLatentImage",
          "_meta": {
            "title": "Empty Latent Image"
          }
        },
        "6": {
          "inputs": {
            "text": "{{positive_prompt}}",
            "clip": ["4", 1]
          },
          "class_type": "CLIPTextEncode",
          "_meta": {
            "title": "CLIP Text Encode (Positive Prompt)"
          }
        },
        "7": {
          "inputs": {
            "text": "{{negative_prompt}}",
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
            "filename_prefix": "Krea2_Turbo",
            "images": ["8", 0]
          },
          "class_type": "SaveImage",
          "_meta": {
            "title": "Save Image"
          }
        }
      },
      null,
      2
    ),
  },
  {
    id: 'qwen-image-2512',
    name: 'Qwen-Image 2512 / 通义万相 2.5 扩散工作流',
    display_name: 'Qwen-Image 2512',
    badge_color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    description: '适配通义千问视觉大模型与 DiT 扩散架构的文生图工作流，支持中英文双语高精度提示词解析',
    author: 'Alibaba Qwen / ComfyUI',
    target_model: 'qwen-image-2512',
    workflow_type: 'qwen',
    is_builtin: true,
    is_default: false,
    node_mappings: {
      positive_prompt_node: '6',
      positive_prompt_field: 'text',
      negative_prompt_node: '7',
      negative_prompt_field: 'text',
      latent_image_node: '5',
      width_field: 'width',
      height_field: 'height',
      sampler_node: '3',
      seed_field: 'seed',
      steps_field: 'steps',
      cfg_field: 'cfg',
      sampler_field: 'sampler_name',
      scheduler_field: 'scheduler',
      denoise_field: 'denoise',
      checkpoint_node: '4',
      ckpt_name_field: 'ckpt_name',
      save_image_node: '9',
      filename_prefix_field: 'filename_prefix',
    },
    workflow_json: JSON.stringify(
      {
        "3": {
          "inputs": {
            "seed": 99999,
            "steps": 28,
            "cfg": 6.5,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1,
            "model": ["4", 0],
            "positive": ["6", 0],
            "negative": ["7", 0],
            "latent_image": ["5", 0]
          },
          "class_type": "KSampler",
          "_meta": {
            "title": "KSampler (Qwen-Image 2512)"
          }
        },
        "4": {
          "inputs": {
            "ckpt_name": "qwen-image-2512.safetensors"
          },
          "class_type": "CheckpointLoaderSimple",
          "_meta": {
            "title": "Load Checkpoint (Qwen-Image 2512)"
          }
        },
        "5": {
          "inputs": {
            "width": 1024,
            "height": 1024,
            "batch_size": 1
          },
          "class_type": "EmptyLatentImage",
          "_meta": {
            "title": "Empty Latent Image (image_width x image_height)"
          }
        },
        "6": {
          "inputs": {
            "text": "{{positive_prompt}}",
            "clip": ["4", 1]
          },
          "class_type": "CLIPTextEncode",
          "_meta": {
            "title": "CLIP Text Encode (positive_prompt)"
          }
        },
        "7": {
          "inputs": {
            "text": "{{negative_prompt}}",
            "clip": ["4", 1]
          },
          "class_type": "CLIPTextEncode",
          "_meta": {
            "title": "CLIP Text Encode (negative_prompt)"
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
            "filename_prefix": "QwenImage2512",
            "images": ["8", 0]
          },
          "class_type": "SaveImage",
          "_meta": {
            "title": "Save Image"
          }
        }
      },
      null,
      2
    ),
  },
  {
    id: 'flux2',
    name: 'FLUX.2 / FLUX.1 纯自然长句工作流',
    display_name: 'FLUX.2 / FLUX.1',
    badge_color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    description: 'Black Forest Labs FLUX.2 / FLUX.1 官方推荐工作流，支持纯自然叙事与超高光学质感',
    author: 'Black Forest Labs / ComfyUI',
    target_model: 'flux2',
    workflow_type: 'flux',
    is_builtin: true,
    is_default: false,
    node_mappings: {
      positive_prompt_node: '6',
      positive_prompt_field: 'text',
      negative_prompt_node: '7',
      negative_prompt_field: 'text',
      latent_image_node: '5',
      width_field: 'width',
      height_field: 'height',
      sampler_node: '3',
      seed_field: 'seed',
      steps_field: 'steps',
      cfg_field: 'cfg',
      sampler_field: 'sampler_name',
      scheduler_field: 'scheduler',
      denoise_field: 'denoise',
      checkpoint_node: '4',
      ckpt_name_field: 'ckpt_name',
      save_image_node: '9',
      filename_prefix_field: 'filename_prefix',
    },
    workflow_json: JSON.stringify(
      {
        "3": {
          "inputs": {
            "seed": 88888,
            "steps": 28,
            "cfg": 3.5,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1,
            "model": ["4", 0],
            "positive": ["6", 0],
            "negative": ["7", 0],
            "latent_image": ["5", 0]
          },
          "class_type": "KSampler",
          "_meta": {
            "title": "KSampler (FLUX.2)"
          }
        },
        "4": {
          "inputs": {
            "ckpt_name": "flux2-dev-fp8.safetensors"
          },
          "class_type": "CheckpointLoaderSimple",
          "_meta": {
            "title": "Load Checkpoint (FLUX.2)"
          }
        },
        "5": {
          "inputs": {
            "width": 1024,
            "height": 1024,
            "batch_size": 1
          },
          "class_type": "EmptyLatentImage",
          "_meta": {
            "title": "Empty Latent Image (image_width x image_height)"
          }
        },
        "6": {
          "inputs": {
            "text": "{{positive_prompt}}",
            "clip": ["4", 1]
          },
          "class_type": "CLIPTextEncode",
          "_meta": {
            "title": "CLIP Text Encode (Positive Prompt)"
          }
        },
        "7": {
          "inputs": {
            "text": "{{negative_prompt}}",
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
            "filename_prefix": "Flux2_Output",
            "images": ["8", 0]
          },
          "class_type": "SaveImage",
          "_meta": {
            "title": "Save Image"
          }
        }
      },
      null,
      2
    ),
  },
  {
    id: 'ideogram-v4',
    name: 'Ideogram v4.0 文字排版与海报概念工作流',
    display_name: 'Ideogram v4.0',
    badge_color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    description: '专为精准文字排印 (Typography)、海报视觉设计、杂志封面与概念插画调优的高阶工作流',
    author: 'Ideogram / ComfyUI Community',
    target_model: 'ideogram-v4',
    workflow_type: 'ideogram',
    is_builtin: true,
    is_default: false,
    node_mappings: {
      positive_prompt_node: '6',
      positive_prompt_field: 'text',
      negative_prompt_node: '7',
      negative_prompt_field: 'text',
      latent_image_node: '5',
      width_field: 'width',
      height_field: 'height',
      sampler_node: '3',
      seed_field: 'seed',
      steps_field: 'steps',
      cfg_field: 'cfg',
      sampler_field: 'sampler_name',
      scheduler_field: 'scheduler',
      denoise_field: 'denoise',
      checkpoint_node: '4',
      ckpt_name_field: 'ckpt_name',
      save_image_node: '9',
      filename_prefix_field: 'filename_prefix',
    },
    workflow_json: JSON.stringify(
      {
        "3": {
          "inputs": {
            "seed": 777777,
            "steps": 25,
            "cfg": 5.0,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1,
            "model": ["4", 0],
            "positive": ["6", 0],
            "negative": ["7", 0],
            "latent_image": ["5", 0]
          },
          "class_type": "KSampler",
          "_meta": {
            "title": "KSampler (Ideogram v4)"
          }
        },
        "4": {
          "inputs": {
            "ckpt_name": "ideogram-v4-typography.safetensors"
          },
          "class_type": "CheckpointLoaderSimple",
          "_meta": {
            "title": "Load Checkpoint (Ideogram v4)"
          }
        },
        "5": {
          "inputs": {
            "width": 1024,
            "height": 1024,
            "batch_size": 1
          },
          "class_type": "EmptyLatentImage",
          "_meta": {
            "title": "Empty Latent Image (image_width x image_height)"
          }
        },
        "6": {
          "inputs": {
            "text": "{{positive_prompt}}",
            "clip": ["4", 1]
          },
          "class_type": "CLIPTextEncode",
          "_meta": {
            "title": "CLIP Text Encode (Positive Prompt)"
          }
        },
        "7": {
          "inputs": {
            "text": "{{negative_prompt}}",
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
            "filename_prefix": "IdeogramV4_Poster",
            "images": ["8", 0]
          },
          "class_type": "SaveImage",
          "_meta": {
            "title": "Save Image"
          }
        }
      },
      null,
      2
    ),
  },
  {
    id: 'stable-diffusion-3',
    name: 'Stable Diffusion 3.5 通用工作流',
    display_name: 'Stable Diffusion 3.5 (SD3)',
    badge_color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    description: 'Stability AI SD3 / SD3.5 Medium & Large 原生工作流，支持 T5-XXL 语义编码与高质量采样',
    author: 'Stability AI / Universal Native',
    target_model: 'stable-diffusion-3',
    workflow_type: 'sd3',
    is_builtin: true,
    is_default: false,
    node_mappings: {
      positive_prompt_node: '6',
      positive_prompt_field: 'text',
      negative_prompt_node: '7',
      negative_prompt_field: 'text',
      latent_image_node: '5',
      width_field: 'width',
      height_field: 'height',
      sampler_node: '3',
      seed_field: 'seed',
      steps_field: 'steps',
      cfg_field: 'cfg',
      sampler_field: 'sampler_name',
      scheduler_field: 'scheduler',
      denoise_field: 'denoise',
      checkpoint_node: '4',
      ckpt_name_field: 'ckpt_name',
      save_image_node: '9',
      filename_prefix_field: 'filename_prefix',
    },
    workflow_json: JSON.stringify(
      {
        "3": {
          "inputs": {
            "seed": 1000000,
            "steps": 28,
            "cfg": 4.5,
            "sampler_name": "euler",
            "scheduler": "simple",
            "denoise": 1,
            "model": ["4", 0],
            "positive": ["6", 0],
            "negative": ["7", 0],
            "latent_image": ["5", 0]
          },
          "class_type": "KSampler",
          "_meta": {
            "title": "KSampler (SD3.5)"
          }
        },
        "4": {
          "inputs": {
            "ckpt_name": "sd3.5_large.safetensors"
          },
          "class_type": "CheckpointLoaderSimple",
          "_meta": {
            "title": "Load Checkpoint (SD3.5)"
          }
        },
        "5": {
          "inputs": {
            "width": 1024,
            "height": 1024,
            "batch_size": 1
          },
          "class_type": "EmptyLatentImage",
          "_meta": {
            "title": "Empty Latent Image (image_width x image_height)"
          }
        },
        "6": {
          "inputs": {
            "text": "{{positive_prompt}}",
            "clip": ["4", 1]
          },
          "class_type": "CLIPTextEncode",
          "_meta": {
            "title": "CLIP Text Encode (Positive Prompt)"
          }
        },
        "7": {
          "inputs": {
            "text": "{{negative_prompt}}",
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
            "filename_prefix": "SD3_Output",
            "images": ["8", 0]
          },
          "class_type": "SaveImage",
          "_meta": {
            "title": "Save Image"
          }
        }
      },
      null,
      2
    ),
  },
];

