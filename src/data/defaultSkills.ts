import { SkillTemplate, PromptModelTemplate, ModelConfig } from '../types';

export const DEFAULT_SKILL_TEMPLATES: SkillTemplate[] = [
  {
    id: 'skill_01',
    skill_name: 'skill_01_multidim_classification.skill',
    stage_number: 1,
    display_title: '图像七维正交分类',
    enable: true,
    sort_index: 1,
    timeout: 15,
    retry: 2,
    file_content: `# skill_01_multidim_classification.skill
stage_name: 图像七维正交多维度分类识别
version: 2.0
language_control:
  supported_languages: ["zh", "en"]
  default_language: "zh"
  rules:
    zh: "输出七大正交维度分类（主体内容/媒介画风/题材世界观/商业用途/构图镜头/光影色彩/氛围情绪）及高概括标签"
    en: "Output all 7 orthogonal dimensions (Subject/Medium/Worldview/Commercial/Composition/Lighting/Mood) in English"
system_prompt: >
  你是资深视觉分类与多模态反推专家。严格按照【图像多维度分类树】的7个独立正交维度进行识别与打标：
  1. 主体内容维度：人物类（单人/多人/特写/人体/虚拟人形）、景物环境类（自然风景/城市建筑/室内/微观）、物品产品类（服饰/数码/食品/工业/文创武器）、生物动物类（动物/幻想生物/植物）、抽象图形类、综合复合场景。
  2. 视觉媒介/画风维度：写实类（照片写实/超写实/纪实）、2D手绘类（动画/漫画/插画/像素）、3D渲染类（3D写实/3D卡通/UE Blender/黏土手办）、艺术特效类（赛璐璐/水墨国风/油画水粉/版画/复古胶片）、混合媒介。
  3. 题材世界观/时代背景维度：现实向（现代都市/近代复古/古风古代/近现代历史）、幻想向（修仙仙侠/玄幻/科幻/奇幻西幻/末世克苏鲁）、架空小众（蒸汽朋克/日式和风/中世纪欧式/乌托邦）、无特定世界观。
  4. 商业用途维度：影视类（电影镜头/短剧/海报/概念原画）、游戏类（角色场景原画/CG/UI/实机截图）、广告商业图（商品主图/品牌海报/电商穿搭/商业人像）、文创出版、个人创作、素材通用图。
  5. 构图&镜头维度：景别（特写/近景/中景/全景/远景）、视角（平视/仰拍/俯拍/微距）、构图（中心/三分/对称/框架）、动态（静态/动态模糊/高速抓拍）。
  6. 光影色彩维度：光照（自然光/柔光/硬光/轮廓光/逆光/丁达尔光/夜景）、色调（冷调/暖调/高饱和/低饱和/莫兰迪/黑白）、画质（高清/8K/胶片颗粒/景深虚化）。
  7. 情绪氛围维度：治愈清新/宏大史诗/阴郁暗黑/欢快活泼/悬疑紧张/孤寂荒凉/静谧祥和。
output_schema:
  type: object
  properties:
    subject_content:
      type: string
      description: 维度1：主体内容
    visual_medium:
      type: string
      description: 维度2：媒介画风
    genre_worldview:
      type: string
      description: 维度3：题材世界观
    commercial_use:
      type: string
      description: 维度4：商业用途
    composition_camera:
      type: string
      description: 维度5：构图镜头
    lighting_color:
      type: string
      description: 维度6：光影色彩
    mood_atmosphere:
      type: string
      description: 维度7：情绪氛围
    confidence:
      type: number
      description: 置信度 0.0 ~ 1.0
    tags:
      type: array
      items:
        type: string
      description: 5-8个高概括性多维度分类标签
  required: ["subject_content", "visual_medium", "genre_worldview", "commercial_use", "composition_camera", "lighting_color"]
retry: 2
timeout: 15
`
  },
  {
    id: 'skill_02',
    skill_name: 'skill_02_image_style.skill',
    stage_number: 2,
    display_title: '媒介画风与艺术流派识别',
    enable: true,
    sort_index: 2,
    timeout: 15,
    retry: 2,
    file_content: `# skill_02_image_style.skill
stage_name: 媒介画风与艺术流派细解
version: 2.0
language_control:
  supported_languages: ["zh", "en"]
  default_language: "zh"
  rules:
    zh: "流派名称、视觉氛围与媒介以中文专业艺术鉴赏词汇表述"
    en: "Artistic movements, visual mood, and creative mediums must be output in English"
system_prompt: >
  你是艺术史学者与数字绘画鉴赏家。基于阶段1的多维度分类基础，精准识别画面中所呈现的具体美术流派、画风技法、艺术媒介与风格权重分配。
output_schema:
  type: object
  properties:
    style:
      type: array
      items:
        type: string
      description: 风格标签数组 (1-4个，如: 照片写实, 新古典主义, 赛璐璐, 水墨写意, 3D UE5渲染)
    style_weight:
      type: array
      items:
        type: number
      description: 对应的风格权重比例 (总和约1.0)
    visual_mood:
      type: string
      description: 整体视觉氛围
    medium:
      type: string
      description: 艺术表现媒介
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
version: 2.0
language_control:
  supported_languages: ["zh", "en"]
  default_language: "zh"
  rules:
    zh: "光质、色调、构图与镜头硬件使用中文影视摄影术语"
    en: "Lighting quality, color grading, composition rules, and camera hardware must be described in English"
system_prompt: >
  你是资深电影摄影指导(DP)与工业级灯光师。深度解析画面中的光照类型（自然光/柔光/丁达尔光/轮廓光）、主色调倾向（冷暖调/莫兰迪/高饱和）、镜头光学参数与影视构图法则。
output_schema:
  type: object
  properties:
    light:
      type: string
      description: 主光形式与光质 (如: 逆光丁达尔光, 柔和漫射光, 轮廓光)
    color_tone:
      type: string
      description: 画面主色调与色彩动力学 (如: 暖奶油主调, 莫兰迪低饱和)
    camera:
      type: string
      description: 推测拍摄器材与胶片型号 (如: ARRI Alexa Mini LF, Kodak Portra 800, Sony A7R5)
    composition:
      type: string
      description: 构图法则与机位 (如: 三分构图, 居中特写, 引导线法则)
    lens_focal:
      type: string
      description: 镜头焦段与透视 (如: 85mm f/1.4 人像定焦)
    aperture:
      type: string
      description: 光圈与景深范围 (如: 浅景深焦外虚化)
  required: ["light", "color_tone", "camera", "composition"]
retry: 2
timeout: 15
`
  },
  {
    id: 'skill_04',
    skill_name: 'skill_04_scene_content.skill',
    stage_number: 4,
    display_title: '基础画面五维分镜拆解',
    enable: true,
    sort_index: 4,
    timeout: 15,
    retry: 2,
    file_content: `# skill_04_scene_content.skill
stage_name: 基础画面五维分镜拆解
version: 2.0
language_control:
  supported_languages: ["zh", "en"]
  default_language: "zh"
  rules:
    zh: "主体形象、背景空间、动态姿态、前景与世界观设定以中文详细叙述"
    en: "Subject details, background environment, character actions, foreground and world settings in English"
system_prompt: >
  你是影视场景分镜师。条分缕析地解构画面中的五维分镜要素：
  🎬 Subject（核心主体）：主体外观、特征、装束与身份
  🌄 Background（背景环境）：远景建筑、地貌气候、空间层次
  🌀 Action（动态动作）：主体的姿态、交互动作、心理状态
  🖼️ Foreground（前景构图）：前景遮挡物、景深引导元素
  🌍 Environment（世界观环境）：宏观世界观时代背景与氛围
output_schema:
  type: object
  properties:
    subject:
      type: string
      description: 核心主体描述
    background:
      type: string
      description: 背景环境与远景
    action:
      type: string
      description: 主体动态姿态与交互动作
    foreground:
      type: string
      description: 前景视线引导元素
    environment:
      type: string
      description: 宏观世界观环境设定
  required: ["subject", "background", "action"]
retry: 2
timeout: 15
`
  },
  {
    id: 'skill_05',
    skill_name: 'skill_05_detail_desc.skill',
    stage_number: 5,
    display_title: '细粒度微观细节与情绪刻画',
    enable: true,
    sort_index: 5,
    timeout: 20,
    retry: 2,
    file_content: `# skill_05_detail_desc.skill
stage_name: 细粒度微观细节与情绪刻画
version: 2.0
language_control:
  supported_languages: ["zh", "en"]
  default_language: "zh"
  rules:
    zh: "微观材质、皮肤毛孔、发丝织物与情绪心态以细腻中文刻画"
    en: "Micro-textures, skin pores, fabric weaves, and psychological emotional tensions in English"
system_prompt: >
  你是微观视觉观察家。聚焦于画面的超高精度细节：如人物的面部五官微表情、发丝光泽、服装褶皱与缝线、材质表面反光与微小磨损，以及画面所传递的情绪张力与心理深度。
output_schema:
  type: object
  properties:
    detail:
      type: string
      description: 极度细腻的微观细节描述 (皮肤纹理/布料工艺/金属光泽/风化磨损)
    emotion:
      type: string
      description: 画面或人物传递的情绪张力与心理状态
    textures:
      type: string
      description: 显著的物理材质特征
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
    display_title: '多文生图模型专有提示词组装',
    enable: true,
    sort_index: 6,
    timeout: 20,
    retry: 2,
    file_content: `# skill_06_prompt_generate.skill
stage_name: 多文生图模型专有提示词结构化组装
version: 2.0
language_control:
  supported_languages: ["zh", "en"]
  default_language: "zh"
  rules:
    zh: "按照目标文生图模型（KREA 2 TURBO, z image-turbo, qwen-image-2512, flux2, stable diffusion 3, SDXL, Midjourney, LTX Video）语法规范输出专有提示词与负向词"
    en: "Assemble specialized prompt syntax for target image models (Krea 2, Z-Image, Qwen-Image, Flux 2, SD3, SDXL, Midjourney, LTX Video)"
system_prompt: >
  你是顶级 Prompt 架构工程师。综合前5个阶段的结构化析出数据，按照目标生图模型的最优语法范式生成高表现力正向与负向提示词：
  - KREA 2 TURBO：高浓缩自然语言 + 核心美学流派 + 强视觉冲击，适合实时流式生图 (cfg 2.0, steps 8)
  - z image-turbo：极致超快生图，紧凑主体 + 动态构图 + 8k uhd, masterpiece 语法 (cfg 2.5, steps 10)
  - qwen-image-2512：通义万相旗舰，中英双语高保真画质，极擅长中文国风修仙/古风/二次元/写实 (cfg 6.5, steps 30)
  - flux2：FLUX.2/FLUX.1 纯自然语言长句叙述，无需负面提示词，对镜头光影与真实质感还原极佳 (cfg 3.5, steps 28)
  - stable diffusion 3：SD3.5 T5-XXL 长文本语义 + CLIP 关键词融合，构图与色彩精准度极高 (cfg 4.5, steps 28)
  - SDXL 1.0：Danbooru 标签 + 镜头器材权重 + 质量增强修饰词 + 丰富负向词 (cfg 7.0, steps 30)
  - Midjourney v6.1：艺术概念短语 + 摄影机位 + --ar 16:9 --v 6.1 --style raw 参数
  - LTX Video：镜头运镜 Track/Pan/Tilt + 物理连续动态 + 动作时间序列
output_schema:
  type: object
  properties:
    positive:
      type: string
      description: 针对当前目标模型的正向提示词
    negative:
      type: string
      description: 定制的负向排除提示词
    target_model:
      type: string
      description: 当前目标模型名称
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
    all_model_prompts:
      type: object
      description: 各个主流文生图模型的全量专有提示词映射表
  required: ["positive", "negative", "target_model"]
retry: 2
timeout: 20
`
  },
  {
    id: 'skill_07',
    skill_name: 'skill_07_game_asset.skill',
    stage_number: 7,
    display_title: '游戏资源与资产全维反推',
    enable: true,
    sort_index: 7,
    timeout: 20,
    retry: 2,
    file_content: `# skill_07_game_asset.skill
stage_name: 游戏资源与美术资产全维度解构反推
version: 2.0
language_control:
  supported_languages: ["zh", "en"]
  default_language: "zh"
  rules:
    zh: "输出游戏资产类型、目标游戏引擎、渲染视角、PBR贴图通道、美术风格、背景隔离规范与专属Prompt修饰词"
    en: "Output Game Asset Type, Target Game Engine, Perspective, PBR Texture Channels, Art Style, Isolation Treatment, and Game Ready Prompt Modifiers"
system_prompt: >
  你是顶级游戏主美与技术美术专家(Technical Artist)。深度解析图像中的游戏资产(Game Asset)工程属性与美术规范：
  1. 资产类型判定 (Asset Type)：
     - 3D 游戏道具/武器装备 (3D Weapon/Item Prop)
     - 角色概念三视图/T-Pose/立绘 (Character Turnaround Sheet / Concept Sheet)
     - 2.5D 等轴测瓦片地图/场景网格 (Isometric Tileset / Modular Dungeon Grid)
     - 游戏 UI 图标/技能徽章/HUD 元素 (Game UI Icons / Badges / HUD Kit)
     - 2D 逐帧精灵/像素动画序列 (2D Sprite Sheet / 16-bit Pixel Art)
     - 材质贴图/特效纹理 (PBR Texture / VFX Texture)
  2. 目标游戏引擎与管线 (Target Engine): Unreal Engine 5 (Nanite/Lumen), Unity 6 (URP/HDRP), Godot 4, 2D Pixel Engine.
  3. 视角透视与构图 (Perspective): 等轴测 (Isometric 45°), 正交三视图 (Orthographic Front/Side/Back), UI平面正交 (Flat Orthographic), 斜45度透视 (3/4 Perspective).
  4. 材质与贴图通道 (PBR Channels): Albedo/BaseColor, Normal Map, Roughness, Metallic, AO, Emissive.
  5. 背景处理 (Background Treatment): 纯白/纯黑中性隔离背景 (Isolated on Clean Solid Background), 透明抠图优化, 无缝拼接网格 (Seamless Tileable).
  6. 适配游戏品类 (Game Genre): ARPG, MMORPG, 俯视角策略SLG, 卡牌手游, 像素横版闯关, 科幻FPS.
  7. 游戏专用 Prompt 修饰词组 (Prompt Modifiers): 结构化输出可直接用于生图的 game asset 专有描述词。
output_schema:
  type: object
  properties:
    asset_type:
      type: string
      enum: ["character_concept", "3d_prop", "2d_sprite", "isometric_tile", "game_ui", "vfx_texture", "pixel_art", "other"]
    asset_category_zh:
      type: string
      description: 游戏资产类别中文描述
    engine_target:
      type: string
      description: 目标游戏引擎 (如: Unreal Engine 5 / Unity / Godot)
    perspective_view:
      type: string
      description: 渲染视点与透视 (如: 等轴测斜45度 / 正交三视图 / 纯色背景道具视角)
    texture_pbr_maps:
      type: array
      items:
        type: string
      description: 适配的PBR贴图通道列表
    art_style:
      type: string
      description: 游戏美术风格 (如: 次世代AAA写实PBR / 二次元手绘 / 16-bit像素 / 暗黑魔幻)
    background_treatment:
      type: string
      description: 背景隔离与拼接处理 (如: 纯白中性隔离背景 / 无缝平铺)
    game_genre_fit:
      type: string
      description: 适用的游戏玩法与品类 (如: ARPG / 俯视角SLG / 卡牌RPG)
    prompt_modifiers:
      type: string
      description: 针对该游戏资产量身定制的高效生图修饰词
  required: ["asset_type", "asset_category_zh", "engine_target", "perspective_view", "prompt_modifiers"]
retry: 2
timeout: 20
`
  }
];

export const DEFAULT_PROMPT_TEMPLATES: PromptModelTemplate[] = [
  {
    id: 'z-image-turbo',
    model_name: 'z-image-turbo',
    display_name: 'Z-Image Turbo (极致超快生图)',
    badge_color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    syntax_guide: '极简紧凑主体 + 动态构图标签 + 8k uhd, masterpiece 语法，极快响应并保留超强细节',
    template_pos: 'masterpiece, ultra-sharp focus, {subject}, {action}, dynamic {composition}, backdrop of {background}, illuminated by {light}, {color_tone}, {detail}, {style_list}, 8k uhd',
    template_neg: 'deformed, blurry, bad anatomy, extra limbs, low quality, pixelated, washed out, watermark, text',
    default_params: {
      cfg_scale: 3.0,
      steps: 20,
      sampler: 'res_multistep'
    }
  },
  {
    id: 'krea2-turbo',
    model_name: 'krea2-turbo',
    display_name: 'Krea-2 Turbo (实时流式极速)',
    badge_color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    syntax_guide: '高浓缩自然语言 + 核心美学流派 + 强视觉冲击光影，专为实时生图流式生成调优',
    template_pos: '{style_list}, {subject}, {action}, in {background}, {light}, {camera}, {detail}, {visual_mood}, 8k resolution, cinematic masterpiece',
    template_neg: 'blurry, low quality, distortion, bad anatomy, duplicate, artifact, deformed limbs, watermark, text',
    default_params: {
      cfg_scale: 1.0,
      steps: 12,
      sampler: 'Euler'
    }
  },
  {
    id: 'qwen-image-2512',
    model_name: 'qwen-image-2512',
    display_name: 'Qwen-Image 2512 (通义万相旗舰)',
    badge_color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    syntax_guide: '中英双语高保真多模态提示词，极擅长国风仙侠修仙、东方玄幻、二次元精细画风与逼真写实人物',
    template_pos: '高画质电影级画面，{subject}，正在{action}，身处{background}，宏观背景呈现{environment}。光影效果采用{light}，整体色调为{color_tone}，镜头构图为{composition}，微观细节表现出{detail}。整体风格呈现{style_list}，视觉氛围充满{visual_mood}。masterpiece, highly detailed, 8k resolution.',
    template_neg: '画面模糊，低画质，肢体畸变，多余手指，色彩过曝，噪点过大，水印文字',
    default_params: {
      cfg_scale: 6.5,
      steps: 28,
      sampler: 'FlowMatchEuler'
    }
  },
  {
    id: 'flux2',
    model_name: 'flux2',
    display_name: 'FLUX.2 (纯自然长句)',
    badge_color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    syntax_guide: '纯自然长句叙述，无需负面提示词，对复杂场景空间、镜头硬件与真实物理质感还原极佳',
    template_pos: 'A cinematic high-resolution visual capture of {subject} who is {action}. The scene takes place in {background}, characterized by {environment}. Shot on {camera} with {lens_focal} and {aperture}, illuminated with {light}. The color grading exhibits {color_tone}, revealing fine details such as {detail}. The overall aesthetic embodies {style_list} with a {visual_mood} mood.',
    template_neg: '',
    default_params: {
      cfg_scale: 3.5,
      steps: 28,
      sampler: 'Euler'
    }
  },
  {
    id: 'ideogram-v4',
    model_name: 'ideogram-v4',
    display_name: 'Ideogram v4.0 (文字排印与海报)',
    badge_color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    syntax_guide: '排版文本 Typography 渲染 + 视觉平面设计 + 纯净光影构图',
    template_pos: 'A high-impact typography and graphic poster design featuring {subject} with dynamic text elements. Set against {background}, illuminated with {light}. Color palette of {color_tone}, intricate details of {detail}, styled in {style_list} aesthetic, award winning masterpiece.',
    template_neg: 'blurry, misspelled text, low resolution, messy layout, deformed glyphs',
    default_params: {
      cfg_scale: 5.0,
      steps: 25,
      sampler: 'Euler'
    }
  },
  {
    id: 'stable-diffusion-3',
    model_name: 'stable-diffusion-3',
    display_name: 'Stable Diffusion 3.5 (SD3)',
    badge_color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    syntax_guide: 'T5-XXL 长文本语义 + CLIP 关键词权重融合，色彩与构图控制力极高',
    template_pos: 'cinematic photography of {subject}, {action}, set in {background}, {environment}, natural {light}, {color_tone} grading, captured on {camera}, {detail}, {style_list} style, {visual_mood} atmosphere, award winning, masterpiece, 8k',
    template_neg: 'ugly, disfigured, low quality, blurry, deformed hands, extra fingers, cartoonish artifacts, poor lighting',
    default_params: {
      cfg_scale: 4.5,
      steps: 28,
      sampler: 'FlowMatchEuler'
    }
  }
];

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  run_mode: 'local',
  llama_bin: '/usr/local/bin/llama-server',
  llama_host: '127.0.0.1',
  llama_port: 8080,
  main_gguf: './models/qwen2.5-vl-7b-instruct-q4_k_m.gguf',
  mmproj_gguf: './models/mmproj-Qwen2.5-VL-7B-Instruct-f16.gguf',
  models_dir: './models',
  n_gpu_layers: 99,
  threads: 8,
  temperature: 0.2,
  top_p: 0.9,
  context_length: 32768,
  batch_size: 512,
  flash_attn: true,
  updated_at: new Date().toISOString()
};
