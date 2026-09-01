import { Project } from '../types';

export const ASPECT_RATIO_OPTIONS = [
  { label: '16:9 (横版宽屏)', value: '16:9', width: 1344, height: 768 },
  { label: '9:16 (竖版短视频/手机)', value: '9:16', width: 768, height: 1344 },
  { label: '1:1 (正方形头像/插画)', value: '1:1', width: 1024, height: 1024 },
  { label: '4:3 (标准横屏)', value: '4:3', width: 1152, height: 864 },
  { label: '3:4 (经典竖构图)', value: '3:4', width: 864, height: 1152 },
  { label: '21:9 (电影超宽荧幕)', value: '21:9', width: 1536, height: 640 },
  { label: '3:2 (单反相机横构图)', value: '3:2', width: 1216, height: 832 },
  { label: '2:3 (单反人像竖构图)', value: '2:3', width: 832, height: 1216 },
];

export const DIMENSION_PRESETS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '1:1': { width: 1024, height: 1024 },
  '4:3': { width: 1152, height: 864 },
  '3:4': { width: 864, height: 1152 },
  '21:9': { width: 1536, height: 640 },
  '3:2': { width: 1216, height: 832 },
  '2:3': { width: 832, height: 1216 },
};

export const INITIAL_DEFAULT_PROJECT: Project = {
  uuid: 'proj-default-krea2-001',
  name: '默认文生图反推与生成项目',
  description: '整合多模态七维反推、提示词专有模型解析、图片尺寸定制以及 ComfyUI REST API 生成调度。',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  scheduled_time: '',
  output_dir: './outputs/default_project',
  status: 'idle',
  target_model: 'Krea2 Turbo',
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
  tags: ['通用', 'Krea2', 'Flux'],
};

