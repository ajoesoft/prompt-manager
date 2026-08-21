import { SkillTemplate, PromptModelTemplate, ModelConfig } from '../types';

export const DEFAULT_SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: 'skill_01',
    skill_name: 'skill_01_image_type.skill',
    stage_number: 1,
    display_title: '图片类型识别',
    enable: true,
    sort_index: 1,
    timeout: 15,
    retry: 2,
    file_content: `# skill_01_image_type.skill
stage_name: 图片类型识别
version: 1.0
system_prompt: >
  你是资深图像分析专家与多模态计算机视觉工程师。基于传入图片，严格判断其基本类型与子类。
  可选主分类枚举：人物、风景、电影截图、商业广告、游戏原画、UI界面、静物、插画、3D渲染、二次元动画、其他。
output_schema:
  type: object
  properties:
    image_type:
      type: string
      description: 核心分类名称
    confidence:
      type: number
      description: 置信度 0.0 ~ 1.0
    sub_category:
      type: string
      description: 更细分的子类目
    tags:
      type: array
      items:
        type: string
      description: 3-5个高概括性分类标签
  required: ["image_type", "confidence"]
retry: 2
timeout: 15
`
  },
  {
    id: 'skill_02',
    skill_name: 'skill_02_image_style.skill',
    stage_number: 2,
    display_title: '美术风格识别',
    enable: true,
    sort_index: 2,
    timeout: 15,
    retry: 2,
    file_content: `# skill_02_image_style.skill
stage_name: 美术风格识别
version: 1.0
system_prompt: >
  你是艺术史学者与数字绘画鉴赏家。精准识别画面中所呈现的美术流派、艺术媒介与风格权重。
  可选参考：PIXAR皮克斯3D、迪士尼手绘、真人写实、胶片摄影、新海诚二次元、赛博朋克、中国传统水墨、印象派油画、像素艺术、暗黑仙侠、科幻史诗、超现实主义等。
output_schema:
  type: object
  properties:
    style:
      type: array
      items:
        type: string
      description: 风格标签数组 (1-4个)
    style_weight:
      type: array
      items:
        type: number
      description: 对应的风格权重比例 (总和约1.0)
    visual_mood:
      type: string
      description: 整体视觉氛围 (如: 梦幻明亮, 压抑冷峻, 温暖复古)
    medium:
      type: string
      description: 艺术表现媒介 (如: 3D Blender, 35mm Film, Digital Concept Art)
  required: ["style", "style_weight"]
retry: 2
timeout: 15
`
  },
  {
    id: 'skill_03',
    skill_name: 'skill_03_camera_param.skill',
    stage_number: 3,
    display_title: '光影/色彩/硬件参数解析',
    enable: true,
    sort_index: 3,
    timeout: 15,
    retry: 2,
    file_content: `# skill_03_camera_param.skill
stage_name: 灯光/色彩/硬件拍摄参数解析
version: 1.0
system_prompt: >
  你是资深电影摄影指导(DP)与工业级灯光师。深度解析画面中的光照类型、色调倾向、镜头光学参数与构图法则。
output_schema:
  type: object
  properties:
    light:
      type: string
      description: 主光形式与光质 (如: 伦勃朗光, 柔和漫射光, 赛博霓虹点光源, 侧逆光轮廓光, 黄金时刻自然光)
    color_tone:
      type: string
      description: 画面主色调与色彩动力学 (如: 暖橙与青色双色调对比, 莫兰迪低饱和冷灰, 鲜亮高饱和波普)
    camera:
      type: string
      description: 推测拍摄器材与胶片型号 (如: ARRI Alexa Mini LF, Hasselblad 500C, Sony A7R V, Kodak Portra 400)
    composition:
      type: string
      description: 构图法则与机位 (如: 三分法则, 黄金螺旋, 极度对称, 荷兰角倾斜, 居中特写, 鸟瞰俯拍)
    lens_focal:
      type: string
      description: 镜头焦段与透视 (如: 35mm人文广角, 85mm人像大光圈, 14mm超广角鱼眼)
    aperture:
      type: string
      description: 光圈与景深范围 (如: f/1.4浅景深极致虚化, f/8全景超深景深)
  required: ["light", "color_tone", "camera", "composition"]
retry: 2
timeout: 15
`
  },
  {
    id: 'skill_04',
    skill_name: 'skill_04_scene_content.skill',
    stage_number: 4,
    display_title: '基础画面内容拆解',
    enable: true,
    sort_index: 4,
    timeout: 15,
    retry: 2,
    file_content: `# skill_04_scene_content.skill
stage_name: 基础画面内容拆解
version: 1.0
system_prompt: >
  你是场景分镜师。条分缕析地解构画面中的主角主体(Subject)、前景(Foreground)、背景环境(Background)及正在发生的核心动作或事件。
output_schema:
  type: object
  properties:
    subject:
      type: string
      description: 核心主体描述 (人物/物体/生物/建筑)
    background:
      type: string
      description: 背景环境与远景建筑/气候
    action:
      type: string
      description: 主体的动态姿态与交互动作
    foreground:
      type: string
      description: 前景遮挡物或视线引导元素 (如有)
    environment:
      type: string
      description: 宏观世界观环境设定 (如: 赛博朋克九龙城寨, 维多利亚蒸汽工厂, 苍茫外星苔原地表)
  required: ["subject", "background", "action"]
retry: 2
timeout: 15
`
  },
  {
    id: 'skill_05',
    skill_name: 'skill_05_detail_desc.skill',
    stage_number: 5,
    display_title: '细粒度细节与情绪描述',
    enable: true,
    sort_index: 5,
    timeout: 20,
    retry: 2,
    file_content: `# skill_05_detail_desc.skill
stage_name: 细粒度人物/物体详细描述
version: 1.0
system_prompt: >
  你是微观视觉观察家。聚焦于画面的超高精度细节：如人物的面部五官微表情、发丝光泽、服装褶皱与缝线、材质表面反光与微小磨损，以及隐匿的情绪张力。
output_schema:
  type: object
  properties:
    detail:
      type: string
      description: 极度细腻的微观细节描述 (材质/皮肤纹理/布料工艺/水珠光泽/金属拉丝/风化磨损)
    emotion:
      type: string
      description: 人物或画面传递的微妙情绪心态 (如: 坚毅隐忍, 孤寂清冷, 炽热狂喜, 警惕冷酷, 宁静致远)
    textures:
      type: string
      description: 画面中最显著的物理材质特性
    attire_or_props:
      type: string
      description: 服饰配饰或手持核心道具特征
  required: ["detail", "emotion"]
retry: 2
timeout: 20
`
  },
  {
    id: 'skill_06',
    skill_name: 'skill_06_prompt_generate.skill',
    stage_number: 6,
    display_title: '文生图提示词结构化组装',
    enable: true,
    sort_index: 6,
    timeout: 20,
    retry: 2,
    file_content: `# skill_06_prompt_generate.skill
stage_name: 最终提示词组装
version: 1.0
system_prompt: >
  你是顶级 Prompt 架构工程师。综合前5个阶段的全部结构化析出数据（类型、艺术风格、摄影灯光、场景结构、微观细节），按照目标文生图模型（如 SDXL, Krea2 Turbo, Flux.1, Midjourney v6, LTX Video）的最优语法范式，生成高度精准、富有视觉表现力的正向提示词（Positive Prompt）与负向过滤词（Negative Prompt）。
output_schema:
  type: object
  properties:
    positive:
      type: string
      description: 组装完成的英文正向提示词 (符合目标模型语法与权重标记)
    negative:
      type: string
      description: 针对该风格和主体定制的负向排除提示词
    target_model:
      type: string
      description: 适配的目标生成模型 (如 SDXL / Krea2 Turbo / Flux.1 / Midjourney v6)
    suggested_params:
      type: object
      properties:
        cfg_scale:
          type: number
        steps:
          type: number
        sampler:
          type: string
        aspect_ratio:
          type: string
  required: ["positive", "negative", "target_model"]
retry: 2
timeout: 20
`
  }
];

export const DEFAULT_PROMPT_TEMPLATES: PromptModelTemplate[] = [
  {
    id: 'krea2_turbo',
    model_name: 'Krea2 Turbo',
    display_name: 'Krea2 Turbo (实时流式)',
    badge_color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    syntax_guide: '高浓缩自然语言 + 核心美学风格修饰，强调实时高渲染感',
    template_pos: '{style_list}, {subject}, {action}, in {background}, {light}, {camera}, {detail}, {visual_mood}, 8k resolution, cinematic masterpiece',
    template_neg: 'blurry, low quality, distortion, bad anatomy, duplicate, artifact, deformed limbs, watermark, text',
    default_params: {
      cfg_scale: 2.0,
      steps: 8,
      sampler: 'Euler A'
    }
  },
  {
    id: 'sdxl',
    model_name: 'SDXL 1.0',
    display_name: 'Stable Diffusion XL (SDXL)',
    badge_color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    syntax_guide: 'Danbooru 标签 + 镜头器材权重 + 质量增强修饰词',
    template_pos: '(masterpiece, best quality, ultra-detailed:1.2), {subject}, {action}, {style_weighted}, {background}, {camera}, {light}, {composition}, {detail}, intricate textures, hyperrealistic, 8k uhd, dslr:1.1',
    template_neg: 'canvas frame, cartoon, 3d, sketch, anime, bad hands, bad eyes, cropped, bad proportions, bad art, monochrome, ugly, worst quality, low quality, normal quality, lowres, extra limbs, watermark',
    default_params: {
      cfg_scale: 7.0,
      steps: 30,
      sampler: 'DPM++ 2M Karras'
    }
  },
  {
    id: 'flux1_dev',
    model_name: 'Flux.1 Dev',
    display_name: 'Flux.1 (Dev / Schnell)',
    badge_color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    syntax_guide: '纯自然长句叙述，无需负面提示词，对镜头光影与真实纹理理解极佳',
    template_pos: 'A cinematic high-resolution capture of {subject} who is {action}. The scene takes place in {background}, characterized by {environment}. Shot on {camera} with {lens_focal} and {aperture}, illuminated with {light}. The color grading exhibits {color_tone}, revealing fine details such as {detail}. The overall aesthetic embodies {style_list} with a {visual_mood} mood.',
    template_neg: '',
    default_params: {
      cfg_scale: 3.5,
      steps: 28,
      sampler: 'Euler'
    }
  },
  {
    id: 'midjourney_v6',
    model_name: 'Midjourney v6.1',
    display_name: 'Midjourney v6.1',
    badge_color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    syntax_guide: '优美艺术概念短语 + 摄影术语 + --ar --v 6.1 --style raw 参数',
    template_pos: '{style_list} aesthetic of {subject}, {action}, in the backdrop of {background}, {light}, cinematic color grading with {color_tone}, {camera}, {detail}, highly atmospheric --ar 16:9 --v 6.1 --style raw --c 5',
    template_neg: '--no blurry, deformed, cartoonish, low resolution, bad hands',
    default_params: {
      cfg_scale: 6.0,
      steps: 25,
      sampler: 'Midjourney Internal'
    }
  },
  {
    id: 'ltx_video',
    model_name: 'LTX Video',
    display_name: 'LTX Video (视频动态模型)',
    badge_color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    syntax_guide: '强调镜头运动 (Pan/Tilt/Zoom) + 连续时间动态 + 物理光影流转',
    template_pos: 'Cinematic video sequence: camera slowly tracks around {subject} as they {action}. In the background, {background}. Dramatic {light} shifts, highly consistent motion, photorealistic {style_list} rendering, film grain.',
    template_neg: 'static frame, stuttering, flickering, morphing, sudden camera cuts, watermark',
    default_params: {
      cfg_scale: 4.0,
      steps: 35,
      sampler: 'FlowMatchEuler'
    }
  }
];

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  run_mode: 'online', // Default to online for instant zero-config experience, with local llama.cpp toggle
  llama_bin: '/usr/local/bin/llama-server',
  main_gguf: './models/Qwen3.5-9B-Q4_K_M.gguf',
  mmproj_gguf: './models/mmproj-F16.gguf',
  n_gpu_layers: 33,
  threads: 8,
  temperature: 0.2,
  top_p: 0.9,
  context_length: 8192,
  api_endpoint: 'https://generativelanguage.googleapis.com/v1beta',
  api_key: '',
  api_model: 'gemini-3.7-flash',
  timeout_seconds: 45
};
