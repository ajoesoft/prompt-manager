import {
  HistoryItem,
  SkillResultJson,
  PromptModelTemplate,
  GenerationParams
} from '../types';
import { DEFAULT_PROMPT_TEMPLATES } from '../data/defaultSkills';

export interface ElementOption {
  id: string;
  labelZh: string;
  labelEn: string;
  valuePrompt: string; // The English/Syntactic prompt phrase
  valueZh?: string; // The Chinese description
  negativePromptAdd?: string; // Optional negative prompt addition
  negativePromptRemove?: string; // Optional negative keywords to clean
  suggestedParams?: Partial<GenerationParams>;
  description?: string;
  badge?: string;
}

export interface ElementCategory {
  id: string;
  titleZh: string;
  titleEn: string;
  iconName: string;
  descriptionZh: string;
  fieldKey: string; // Target field in skillJson or prompt
  options: ElementOption[];
}

export interface PromptElementState {
  style: string; // 画面风格
  medium: string; // 画面类型/媒介
  subject: string; // 人物/主体/IP
  background: string; // 背景/场景环境
  lighting: string; // 灯光光质
  composition: string; // 镜头机位/构图
  camera: string; // 相机设备
  lens: string; // 镜头焦段
  isoParams: string; // 摄影参数/ISO
  typography: string; // 画面文字/排版
  renderQuality: string; // 渲染/品质修饰词
  targetModel: string; // 目标模型
  negativePreset: string; // 反向提示词方案
  customModifiers: string; // 自定义追加修饰词
}

// Quick Style Transform Presets (一键风格改写全套预设，例如：一键转3D渲染、一键转日漫二次元、一键转真人胶片)
export interface QuickStylePreset {
  id: string;
  nameZh: string;
  nameEn: string;
  icon: string;
  badge: string;
  descriptionZh: string;
  targetElements: Partial<PromptElementState>;
  suggestedModel?: string;
}

// 1. All Element Categories & Presets
export const PROMPT_ELEMENT_CATEGORIES: ElementCategory[] = [
  {
    id: 'style',
    titleZh: '画面风格 (Art & Visual Style)',
    titleEn: 'Art & Visual Style',
    iconName: 'Palette',
    descriptionZh: '画面的核心美学流派，如将真人写实改为 3D 渲染、日漫、赛博朋克等',
    fieldKey: 'style',
    options: [
      {
        id: '3d_pixar_octane',
        labelZh: '3D 渲染 / 迪士尼皮克斯动画风格',
        labelEn: '3D Render / Pixar Animation Style',
        valuePrompt: '3D Pixar style animation render, Octane Render 3D, smooth volumetric plastic & clay textures, cute stylization, Unreal Engine 5 render, cinematic 3D lighting, vibrant cheerful atmosphere, Ray Tracing, C4D',
        valueZh: '3D皮克斯动画渲染风格，细腻次表面散射材质，虚幻引擎5渲染，光线追踪立体光影',
        negativePromptAdd: 'photorealistic, raw photo, realistic human skin, 2d sketch, flat illustration',
        badge: '热门替换',
        description: '将写实人物/场景转换为精美迪士尼皮克斯3D动画雕塑与CG质感'
      },
      {
        id: 'photorealistic_cinema',
        labelZh: '真人写实 / 电影级超清摄影',
        labelEn: 'Photorealistic / Cinematic Film Photography',
        valuePrompt: 'photorealistic portrait photography, cinematic realism, natural skin texture with visible pores, ultra-detailed, 8k uhd, dslr photo, film grain, hyperrealistic masterpiece',
        valueZh: '真人高清写实摄影，自然毛孔皮肤肌理，电影胶片质感，顶级单反光学成像',
        negativePromptAdd: '3d, render, cartoon, anime, illustration, CGI, drawing, fake skin, plastic',
        badge: '真实质感',
        description: '追求极致逼真的人类皮肤毛孔、光学景深与真实摄影氛围'
      },
      {
        id: 'cyberpunk_scifi',
        labelZh: '赛博朋克 / 霓虹科幻风格',
        labelEn: 'Cyberpunk / Neon Sci-Fi Aesthetic',
        valuePrompt: 'cyberpunk aesthetic, futuristic sci-fi neon lighting, chromatic aberration, holographic glow, rainy wet reflection, high-tech dystopian atmosphere, raytracing reflections, 8k uhd',
        valueZh: '赛博朋克科幻美学，冷暖双色霓虹反光，雨夜湿漉地面倒影，全息高科技质感',
        badge: '科幻潮流',
        description: '未来高科技科幻、霓虹雨夜反光、机械与全息视觉'
      },
      {
        id: 'anime_shinkai',
        labelZh: '日系二次元 / 新海诚治愈动漫',
        labelEn: 'Japanese Anime / Makoto Shinkai Style',
        valuePrompt: 'anime aesthetic, Makoto Shinkai art style, cel shaded, vibrant anime sky with fluffy cumulus clouds, painterly light rays, delicate anime lines, Kyoto Animation visual, masterpiece anime artwork',
        valueZh: '新海诚唯美日系动漫，赛璐璐精细勾线，治愈系云朵光斑，明快通透色彩',
        negativePromptAdd: 'photorealistic, real photo, 3d render, creepy realistic eyes',
        badge: '唯美二次元',
        description: '通透唯美的动漫光斑、清透云彩与二次元线条'
      },
      {
        id: 'chinese_ink_xianxia',
        labelZh: '国风水墨 / 东方仙侠玄幻',
        labelEn: 'Chinese Traditional Ink & Xianxia Immortal',
        valuePrompt: 'traditional Chinese ink painting style, ethereal Xianxia aesthetic, fluid brushwork, misty atmospheric perspective, Xuan paper texture, poetic oriental elegance, gold foil embellishments, masterpiece',
        valueZh: '传统国风写意水墨，仙侠缥缈意境，宣纸肌理与金箔点缀，空灵留白东方美学',
        badge: '东方国风',
        description: '水墨写意笔触、仙气缥缈的东方留白意境与国潮古风'
      },
      {
        id: 'claymation_stopmotion',
        labelZh: '黏土定格动画 / 手工偶动画',
        labelEn: 'Claymation / Plasticine Stop-Motion',
        valuePrompt: 'claymation plasticine stop-motion animation style, tactile handmade clay texture, fingerprint marks on surface, miniature studio macro photography, tilt-shift depth of field, Aardman animations aesthetic',
        valueZh: '黏土偶定格动画风格，手工捏塑指纹肌理，微缩摄影移轴景深，阿德曼动画质感',
        badge: '创意手作',
        description: '富有触感的手工黏土、微缩模型光影与定格动画质感'
      },
      {
        id: 'vintage_film_portra',
        labelZh: '复古胶片 / 柯达金胶卷 90s 复古',
        labelEn: 'Vintage 90s Film / Kodak Portra 400',
        valuePrompt: 'vintage 35mm film photography, Kodak Portra 400 film grain, warm nostalgic tones, slight light leak, soft vintage contrast, authentic retro 1990s analog aesthetic',
        valueZh: '35mm经典胶片摄影，柯达Portra暖调颗粒，复古轻微漏光，90年代怀旧胶卷质感',
        badge: '复古胶片',
        description: '温暖复古色调、经典胶卷颗粒与轻微色散漏光'
      },
      {
        id: 'concept_art_epic',
        labelZh: '史诗概念原画 / ArtStation 潮流',
        labelEn: 'Epic Concept Art / ArtStation Trending',
        valuePrompt: 'epic cinematic concept art, trending on ArtStation, dynamic brush strokes, dramatic scale and atmosphere, masterpiece digital matte painting, matte fantasy illustration',
        valueZh: '游戏影视级概念场景原画，宏大透视与动态厚涂笔触，Artstation榜首艺术质感',
        badge: '游戏原画',
        description: '宏大空间尺度、影视概念原画设计与氛围渲染'
      },
      {
        id: 'dreamy_watercolor',
        labelZh: '梦幻水彩 / 湿画法水晕插画',
        labelEn: 'Dreamy Watercolor / Wet-on-Wet Splatter',
        valuePrompt: 'dreamy watercolor illustration, wet-on-wet paint bleeding technique, soft pastel gradients, artistic paint splatters, textured cold-press watercolor paper grain, delicate fluidity',
        valueZh: '梦幻水彩插画，湿画法水彩晕染边缘，柔和马卡龙渐变，水彩纸纹理感',
        badge: '艺术插画',
        description: '通透轻盈的水彩水渍晕染、柔和色彩渐变'
      }
    ]
  },
  {
    id: 'medium',
    titleZh: '画面类型 (Image Medium & Type)',
    titleEn: 'Image Medium & Format',
    iconName: 'Layers',
    descriptionZh: '画面的视觉题材与商业媒介形式，如人像摄影、盲盒手办、电影海报等',
    fieldKey: 'medium',
    options: [
      {
        id: 'commercial_portrait',
        labelZh: '商业高端人像写真 (Commercial Portrait)',
        labelEn: 'Commercial Studio Portrait',
        valuePrompt: 'high-end commercial studio portrait photography, magazine cover framing, flawless makeup, studio lighting setup',
        valueZh: '商业棚拍人像，高端杂志封面构图，精致妆容与光影'
      },
      {
        id: 'blindbox_toy_figurine',
        labelZh: '3D 盲盒手办 / 潮玩雕塑 (Blindbox Figurine)',
        labelEn: '3D Blind Box Toy / Popmart Figurine',
        valuePrompt: 'Popmart style collectible designer toy figurine, chibi proportions, smooth PVC and vinyl material, standing on acrylic display pedestal, studio product photography',
        valueZh: '泡泡玛特风潮玩盲盒手办，Q版比例，PVC树脂平滑质感，亚克力展示台'
      },
      {
        id: 'movie_cinematic_still',
        labelZh: '电影宽银幕剧照 (Cinematic Film Still)',
        labelEn: 'Cinematic Anamorphic Movie Still',
        valuePrompt: 'cinematic anamorphic movie still, 2.39:1 widescreen aspect ratio, color graded, dramatic storytelling moment, film grain',
        valueZh: '电影宽银幕剧照，2.39:1叙事构图，专业电影调色与故事感'
      },
      {
        id: 'macro_still_life',
        labelZh: '微距静物特写 (Macro Still Life Photography)',
        labelEn: 'Macro Product Still Life',
        valuePrompt: 'macro product photography, extreme close-up, intricate surface details, water droplets and textures, shallow depth of field',
        valueZh: '商业微距静物摄影，极致特写，水滴与微观材质纹理'
      },
      {
        id: 'fashion_editorial',
        labelZh: '时尚大片与杂志刊物 (Fashion Editorial)',
        labelEn: 'High Fashion Editorial Shoot',
        valuePrompt: 'avant-garde high fashion editorial, Vogue magazine aesthetic, dramatic model pose, haute couture designer styling',
        valueZh: '前卫高级时尚大片，Vogue美学，张力模特姿态与高级定制服饰'
      },
      {
        id: 'game_cg_wallpaper',
        labelZh: '游戏CG原画壁纸 (Game CG Splash Art)',
        labelEn: 'Game CG Wallpaper Splash Art',
        valuePrompt: 'AAA video game CG splash art, 4K high resolution wallpaper, intense visual fx and magical particle energy',
        valueZh: '3A级游戏CG主视觉原画，4K高清壁纸，丰富光效与粒子动态'
      }
    ]
  },
  {
    id: 'subject',
    titleZh: '人物 / 主体 / 知名IP (Subject / Character / IP)',
    titleEn: 'Subject / Character / IP',
    iconName: 'User',
    descriptionZh: '画面中的核心主角或物体，可替换为不同职业、二次元人物、机甲或知名IP',
    fieldKey: 'subject',
    options: [
      {
        id: 'subject_cyber_heroine',
        labelZh: '赛博朋克机械义体少女',
        labelEn: 'Cyberpunk Cyborg Heroine',
        valuePrompt: 'a cool cyberpunk young woman with silver bob hair, cybernetic mechanical arm with glowing blue circuits, sleek futuristic cyber jacket, confident gaze',
        valueZh: '银色短发赛博朋克少女，带有发光蓝色电路的机械义肢，未来机能风夹克'
      },
      {
        id: 'subject_hanfu_maiden',
        labelZh: '东方汉服古典少女',
        labelEn: 'Traditional Hanfu Maiden',
        valuePrompt: 'an ethereal beautiful Chinese maiden in flowing pastel Hanfu robe with gold embroidery, jade hairpin in classical updo hairstyle, gentle delicate gaze',
        valueZh: '身穿飘逸金丝刺绣汉服的古典东方少女，发髻插玉簪，温婉动人'
      },
      {
        id: 'subject_modern_exec',
        labelZh: '现代都市职场精英女性',
        labelEn: 'Modern Urban Professional Executive',
        valuePrompt: 'a sophisticated modern businesswoman in tailored minimalist blazer, neat elegant hairstyle, warm confident smile, natural makeup',
        valueZh: '身着剪裁合体西装的现代都市职场精英，优雅从容，干练大方'
      },
      {
        id: 'subject_mecha_warrior',
        labelZh: '重装机甲战士 / 高达风格机甲',
        labelEn: 'Heavy Armored Mecha / Gundam Robot',
        valuePrompt: 'a towering high-tech Gundam-style combat mecha, white and cobalt blue armor plates, glowing photon thrusters, heavy mechanical joints and panel lining details',
        valueZh: '高达风格重型战斗机甲，白蓝合金装甲，发光推进器与精细机械刻线'
      },
      {
        id: 'subject_wukong_myth',
        labelZh: '黑神话孙悟空 / 齐天大圣',
        labelEn: 'Black Myth Sun Wukong / Monkey King',
        valuePrompt: 'Sun Wukong the Monkey King from Black Myth, golden chainmail armor, holding the mystical Ruyi Jingu Bang staff, fierce battle-hardened golden fiery eyes',
        valueZh: '黑神话齐天大圣孙悟空，锁子黄金甲，手持如意金箍棒，火眼金睛威武霸气'
      },
      {
        id: 'subject_cute_astro_cat',
        labelZh: '宇航员萌宠喵星人 (萌系生物)',
        labelEn: 'Cute Astronaut Kitten in Space Suit',
        valuePrompt: 'an adorable fluffy ginger kitten wearing a miniature NASA astronaut spacesuit with a transparent glass helmet, floating weightlessly, big curious sparkling eyes',
        valueZh: '穿微型NASA宇航服的蓬松橘猫，戴透明玻璃头盔，大眼睛好奇灵动'
      },
      {
        id: 'subject_hypercar',
        labelZh: '未来概念超跑 / 悬浮战车',
        labelEn: 'Futuristic Concept Hypercar',
        valuePrompt: 'a sleek futuristic carbon-fiber concept hypercar, aerodynamic body lines, glowing LED matrix taillights, matte black and iridescent violet finish',
        valueZh: '流线型未来碳纤维概念超跑，流光LED矩阵车灯，哑光黑与渐变紫车漆'
      }
    ]
  },
  {
    id: 'background',
    titleZh: '背景与场景环境 (Background & Environment)',
    titleEn: 'Background & Environment',
    iconName: 'Image',
    descriptionZh: '主体身处的宏观地理环境与背景空间，如街道、摄影棚、太空、水乡等',
    fieldKey: 'background',
    options: [
      {
        id: 'bg_neon_rain_city',
        labelZh: '赛博朋克霓虹雨夜街道',
        labelEn: 'Cyberpunk Rainy Neon Metropolis',
        valuePrompt: 'backdrop of a futuristic rainy cyberpunk metropolis at night, glowing neon billboards, wet asphalt with colorful light reflections, steam rising from grates',
        valueZh: '未来赛博朋克雨夜都市，绚烂霓虹广告牌，湿漉柏油路面映衬倒影'
      },
      {
        id: 'bg_clean_studio',
        labelZh: '极简无影摄影棚 / 纯色背景',
        labelEn: 'Minimalist Clean Studio Infinity Cove',
        valuePrompt: 'clean minimalist photo studio with an infinity curve background, soft neutral gray backdrop, immaculate seamless space with gentle gradient shadow',
        valueZh: '极简无影摄影棚，无缝浅灰渐变纯色背景，干净纯粹的商业空间'
      },
      {
        id: 'bg_misty_forest',
        labelZh: '晨雾幽谧魔法森林',
        labelEn: 'Misty Magical Fantasy Forest',
        valuePrompt: 'enchanted ancient fantasy forest in early morning mist, towering moss-covered trees, sunbeams filtering through dense canopy, glowing bioluminescent flora',
        valueZh: '清晨薄雾笼罩的古老魔法森林，巨树生苔，丁达尔光穿透树冠，微光植物'
      },
      {
        id: 'bg_cozy_cafe',
        labelZh: '暖光复古轻奢咖啡厅',
        labelEn: 'Warm Cozy Vintage Boutique Café',
        valuePrompt: 'interior of a cozy vintage boutique café, warm wooden furnishings, soft amber Edison pendant lights, rainy window in the background, tranquil ambiance',
        valueZh: '温馨复古咖啡馆内部，温润原木家具，爱迪生暖黄吊灯，雨滴落地窗'
      },
      {
        id: 'bg_space_station',
        labelZh: '外太空空间站与星际轨道',
        labelEn: 'Deep Space Orbital Station & Nebula',
        valuePrompt: 'view from an orbital space station looking out at planet Earth and a glowing cosmic nebula, stars sparkling in deep black void, sleek modular sci-fi interior',
        valueZh: '太空轨道站全景舷窗，俯瞰蓝色地球与绚丽星云，星辰点缀深空'
      },
      {
        id: 'bg_snow_mountain',
        labelZh: '巍峨雪山与日照金山巅峰',
        labelEn: 'Snow Peak Mountain at Golden Sunset',
        valuePrompt: 'majestic snow-capped alpine mountain peaks at sunset, alpenglow golden light on snowy ridges, dramatic clouds, breathtaking wild landscape',
        valueZh: '夕阳下的巍峨阿尔卑斯雪山，日照金山暖光倾泻于积雪山脊，云海苍茫'
      },
      {
        id: 'bg_ancient_watertown',
        labelZh: '江南水乡烟雨古镇',
        labelEn: 'Traditional Chinese Misty Water Town',
        valuePrompt: 'traditional Jiangnan water town in light spring rain, white-washed walls and black-tiled roofs, stone arch bridge over tranquil canal, red lanterns reflecting on water',
        valueZh: '烟雨江南水乡古镇，粉墙黛瓦，石拱桥跨过静谧小河，红灯笼倒影摇曳'
      }
    ]
  },
  {
    id: 'lighting',
    titleZh: '灯光光质 (Lighting & Atmosphere)',
    titleEn: 'Lighting Quality & Glow',
    iconName: 'Sun',
    descriptionZh: '画面的光影动力学，如丁达尔神光、逆光黄金时刻、电影轮廓光等',
    fieldKey: 'lighting',
    options: [
      {
        id: 'light_volumetric_rays',
        labelZh: '丁达尔体积光 / 神圣光束 (Volumetric Rays)',
        labelEn: 'Volumetric Tyndall God Rays',
        valuePrompt: 'dramatic volumetric god rays, Tyndall effect light beams slicing through atmospheric haze, high-contrast chiaroscuro, cinematic radiance',
        valueZh: '震撼丁达尔体积光束，穿透晨雾的光柱，高对比明暗光影'
      },
      {
        id: 'light_golden_hour',
        labelZh: '黄金时刻暖阳逆光 (Golden Hour Backlight)',
        labelEn: 'Golden Hour Sunset Rim Light',
        valuePrompt: 'warm golden hour sunlight, soft glowing rim lighting outlining the subject, gentle lens flare, warm amber and apricot color temperature',
        valueZh: '日落黄金时刻逆光，发丝泛起金黄轮廓光，温暖杏黄色温与柔和光晕'
      },
      {
        id: 'light_rembrandt',
        labelZh: '电影级伦勃朗侧光 (Rembrandt Lighting)',
        labelEn: 'Cinematic Rembrandt Portrait Light',
        valuePrompt: 'classic Rembrandt lighting setup, characteristic triangle light on cheekbone, moody cinematic shadows, dimensional face contouring',
        valueZh: '经典伦勃朗肖像布光，面颊三角光区，立体深邃的阴影塑造'
      },
      {
        id: 'light_dual_neon',
        labelZh: '赛博冷暖双色边缘光 (Dual Neon Rim)',
        labelEn: 'Dual-tone Cyan & Magenta Neon Rim',
        valuePrompt: 'dual-tone split lighting, electric cyan fill light paired with hot magenta neon rim light, vivid chromatic contrast, high visual impact',
        valueZh: '青蓝与品红冷暖双色边缘光，高反差赛博光感，强视觉冲击'
      },
      {
        id: 'light_softbox_diffused',
        labelZh: '大柔光箱漫射面光 (Studio Softbox)',
        labelEn: 'Studio Softbox Diffused Light',
        valuePrompt: 'ultra-soft diffused studio softbox lighting, perfectly balanced fill light, zero harsh shadows, flattering even illumination',
        valueZh: '顶级柔光箱漫射光，均匀柔美面光，无生硬阴影，呈现通透肤质'
      }
    ]
  },
  {
    id: 'composition',
    titleZh: '镜头机位与构图 (Shot & Composition)',
    titleEn: 'Shot Framing & Composition',
    iconName: 'Frame',
    descriptionZh: '取景景别与视觉构图法则，如特写、俯瞰、黄金三分法、对称等',
    fieldKey: 'composition',
    options: [
      {
        id: 'comp_close_up',
        labelZh: '特写景别 / 微表情聚焦 (Close-Up Shot)',
        labelEn: 'Tight Close-Up Portrait Shot',
        valuePrompt: 'tight close-up framing focusing on facial expression and eyes, shallow depth of field, background fully blurred',
        valueZh: '紧凑特写景别，聚焦眼部微表情，极致浅景深背景虚化'
      },
      {
        id: 'comp_rule_of_thirds',
        labelZh: '经典三分法 / 视线留白 (Rule of Thirds)',
        labelEn: 'Rule of Thirds with Lead Room',
        valuePrompt: 'rule of thirds composition, subject positioned along vertical grid line, ample visual lead room, dynamic balance',
        valueZh: '黄金三分法则，主体置于黄金分割线，视线方向自然留白'
      },
      {
        id: 'comp_low_angle_hero',
        labelZh: '低角度仰拍 / 气势英雄视角 (Low Angle Hero)',
        labelEn: 'Dramatic Low-Angle Hero Shot',
        valuePrompt: 'dramatic low-angle hero shot, looking up at the subject against the sky, imposing majestic perspective, strong vertical lines',
        valueZh: '低角度仰拍视角，自下而上仰望主体，气势雄浑具有强烈压迫感'
      },
      {
        id: 'comp_wide_establishing',
        labelZh: '全景广角 / 环境叙事大景别 (Wide Establishing)',
        labelEn: 'Cinematic Wide Establishing Shot',
        valuePrompt: 'cinematic wide establishing shot, panoramic environmental perspective, deep spatial depth, subject harmoniously integrated into grand scale world',
        valueZh: '全景广角电影大景别，宏大空间透视与环境叙事感'
      },
      {
        id: 'comp_centered_symmetry',
        labelZh: '居中对称式构图 (Centered Symmetry)',
        labelEn: 'Perfect Centered Symmetry',
        valuePrompt: 'perfect centered symmetrical composition, Wes Anderson aesthetic, architectural geometric alignment, harmonious balance',
        valueZh: '严谨居中对称构图，韦斯·安德森几何美学，秩序与仪式感'
      }
    ]
  },
  {
    id: 'camera',
    titleZh: '相机设备与传感器 (Camera & Film)',
    titleEn: 'Camera & Film Emulation',
    iconName: 'Camera',
    descriptionZh: '推测或指定的专业摄影机与胶卷型号，如哈苏中画幅、ARRI电影机、索尼微单等',
    fieldKey: 'camera',
    options: [
      {
        id: 'cam_hasselblad_h6d',
        labelZh: '哈苏中画幅 Hasselblad H6D-100c (1亿像素顶级中画幅)',
        labelEn: 'Hasselblad H6D-100c Medium Format',
        valuePrompt: 'shot on Hasselblad H6D-100c medium format camera, 100 megapixel ultra resolution, incredible tonal gradation and dynamic range',
        valueZh: '哈苏H6D-100c一亿像素中画幅，无敌色彩过渡与动态范围'
      },
      {
        id: 'cam_arri_alexa_65',
        labelZh: '电影机之王 ARRI Alexa 65 (好莱坞大片电影质感)',
        labelEn: 'ARRI Alexa 65 Large Format Cinema',
        valuePrompt: 'captured on ARRI Alexa 65 large format cinema camera, cinematic Alexa color science, organic filmic highlight rolloff',
        valueZh: 'ARRI Alexa 65巨幅数字电影机，顶级电影高光渐变与色彩科学'
      },
      {
        id: 'cam_sony_a7rv',
        labelZh: '索尼全画幅微单 Sony A7R V (6100万像素现代数码锐利)',
        labelEn: 'Sony Alpha A7R V Full-Frame',
        valuePrompt: 'shot on Sony A7R V full-frame camera, Sony G-Master optics, razor sharp eye autofocus clarity, rich 61MP digital detail',
        valueZh: '索尼A7R5全画幅，G大师镜头锐利对焦，6100万像素丰富细节'
      },
      {
        id: 'cam_leica_m11',
        labelZh: '徕卡旁轴经典 Leica M11 (徕卡德味醇厚色彩)',
        labelEn: 'Leica M11 Rangefinder',
        valuePrompt: 'shot on Leica M11 rangefinder camera with Leica Summilux lens, signature Leica color rendition and micro-contrast',
        valueZh: '徕卡M11旁轴相机，经典徕卡德味、油润色彩与高微反差'
      },
      {
        id: 'cam_kodak_portra',
        labelZh: '柯达专业胶片 Kodak Portra 800 (人像肤色暖润胶卷)',
        labelEn: 'Kodak Portra 800 35mm Analog Film',
        valuePrompt: 'shot on 35mm Kodak Portra 800 analog film, authentic organic film grain, warm flattering skin tones, vintage analog charm',
        valueZh: '柯达Portra 800人像胶卷，温润细腻的肤色呈现与天然胶片颗粒'
      }
    ]
  },
  {
    id: 'lens',
    titleZh: '镜头焦段与型号 (Lens & Focal Length)',
    titleEn: 'Lens & Focal Length',
    iconName: 'Aperture',
    descriptionZh: '镜头的焦距与光圈配置，如 85mm 人像定焦、24mm 广角、微距或电影镜头',
    fieldKey: 'lens',
    options: [
      {
        id: 'lens_85mm_f14',
        labelZh: '85mm f/1.4 人像黄金大光圈 (人像首选，奶油虚化)',
        labelEn: '85mm f/1.4 Portrait Prime Lens',
        valuePrompt: '85mm f/1.4 portrait prime lens, creamy circular bokeh in background, sharp subject separation',
        valueZh: '85mm f/1.4黄金人像定焦，背景如奶油般化开，主体极度立体'
      },
      {
        id: 'lens_24mm_f28',
        labelZh: '24mm f/2.8 广角镜头 (透视张力，大场景风光)',
        labelEn: '24mm f/2.8 Ultra-Wide Lens',
        valuePrompt: '24mm f/2.8 wide angle lens, expansive perspective, dramatic foreground-to-background spatial depth',
        valueZh: '24mm超广角镜头，强空间纵深透视与大场景收纳'
      },
      {
        id: 'lens_50mm_f12',
        labelZh: '50mm f/1.2 标准定焦 (最接近人眼自然视角)',
        labelEn: '50mm f/1.2 Standard Prime Lens',
        valuePrompt: '50mm f/1.2 standard prime lens, natural human eye perspective, pristine optical clarity, soft falloff',
        valueZh: '50mm标准定焦，真实自然的透视比例与超大光圈进光量'
      },
      {
        id: 'lens_100mm_macro',
        labelZh: '100mm f/2.8 Macro 微距镜头 (微观纤毫特写)',
        labelEn: '100mm f/2.8 1:1 Macro Lens',
        valuePrompt: '100mm f/2.8 macro lens, 1:1 magnification ratio, razor sharp microscopic texture detail',
        valueZh: '100mm微距镜头，1:1微距放大，毫厘级微观细节'
      },
      {
        id: 'lens_anamorphic_cine',
        labelZh: '变形宽银幕电影镜头 Anamorphic (好莱坞蓝光拉丝与椭圆光斑)',
        labelEn: 'Anamorphic Cinema Lens (2x Squeeze)',
        valuePrompt: 'Cooke Anamorphic /i Prime cine lens, horizontal blue streak flare, oval bokeh, cinematic optical breathing',
        valueZh: '库克变形宽银幕电影镜头，水平蓝色拉丝眩光与椭圆形电影光斑'
      }
    ]
  },
  {
    id: 'isoParams',
    titleZh: '摄影参数与 ISO 曝光 (ISO & Shutter Exposure)',
    titleEn: 'ISO & Exposure Settings',
    iconName: 'Sliders',
    descriptionZh: '曝光参数与传感器感光度，如 ISO 100 纯净低噪点、ISO 6400 复古颗粒等',
    fieldKey: 'isoParams',
    options: [
      {
        id: 'iso_100_clean',
        labelZh: 'ISO 100 / 纯净低噪点 / f/1.4 浅景深 (极致干净)',
        labelEn: 'ISO 100 / f/1.4 Clean Zero-Noise',
        valuePrompt: 'ISO 100, f/1.4 aperture, 1/250s shutter speed, crystal clear zero-noise sensor capture',
        valueZh: 'ISO 100，f/1.4光圈，无噪点超纯净画面'
      },
      {
        id: 'iso_6400_grainy',
        labelZh: 'ISO 6400 / 电影夜景复古噪点质感',
        labelEn: 'ISO 6400 / Filmic Night Noise',
        valuePrompt: 'ISO 6400, gritty high-ISO filmic texture, raw realistic low-light noise, moody atmosphere',
        valueZh: 'ISO 6400，低光夜景真实感光噪点，沉浸式氛围感'
      },
      {
        id: 'shutter_freeze_action',
        labelZh: '1/8000s 高速快门 / 水滴凝结瞬间抓拍',
        labelEn: '1/8000s High Speed Freeze Motion',
        valuePrompt: '1/8000s ultra-fast shutter speed, freezing dynamic motion, water splash frozen in mid-air',
        valueZh: '1/8000s高速快门，瞬间凝固飞溅水滴与动态发丝'
      },
      {
        id: 'shutter_long_exposure',
        labelZh: '1/2s 慢门长曝光 / 丝绢流光光轨',
        labelEn: '1/2s Slow Shutter Motion Blur',
        valuePrompt: 'long exposure photography, smooth silky light trails, soft motion blur in background, sharp stationary subject',
        valueZh: '慢门长曝光，流光溢彩的光轨与丝绢感'
      }
    ]
  },
  {
    id: 'typography',
    titleZh: '画面文字与排版 (Typography & Text Overlay)',
    titleEn: 'Typography & Layout',
    iconName: 'Type',
    descriptionZh: '画面中的文字排版与标题元素，如无文字纯净版、霓虹发光文字、杂志排版等',
    fieldKey: 'typography',
    options: [
      {
        id: 'typo_none',
        labelZh: '纯净无文字 (No Text / Pure Image)',
        labelEn: 'No Text Overlay (Clean Visual)',
        valuePrompt: '',
        valueZh: '纯净画面，不包含任何文字或排版水印',
        negativePromptAdd: 'text, watermark, font, logo, signature, typography, letters, words'
      },
      {
        id: 'typo_neon_sign',
        labelZh: '发光霓虹艺术招牌文字 (Neon Signboard Text)',
        labelEn: 'Glowing Neon Signboard Typography',
        valuePrompt: 'stylized glowing neon signboard typography in background, Japanese Kanji and cyber font glow',
        valueZh: '背景带有发光霓虹招牌艺术文字'
      },
      {
        id: 'typo_vogue_cover',
        labelZh: '《VOGUE》高级时尚杂志封面排版',
        labelEn: 'High Fashion Magazine Cover Typography',
        valuePrompt: 'editorial magazine cover layout, clean bold modern serif typography "VOGUE" integrated at top, stylish subheadings',
        valueZh: '时尚杂志封面式顶部大标题与副标题排版'
      },
      {
        id: 'typo_movie_title',
        labelZh: '电影大片海报居中字样',
        labelEn: 'Cinematic Blockbuster Movie Title Layout',
        valuePrompt: 'cinematic blockbuster movie poster layout, dramatic metallic embossed title typography at bottom center, credit billing block',
        valueZh: '底部居中金属浮雕质感电影大片片名与演职员小字排版'
      }
    ]
  },
  {
    id: 'renderQuality',
    titleZh: '渲染/画质强化修饰词 (Render Quality & Boosters)',
    titleEn: 'Quality Enhancers',
    iconName: 'Sparkles',
    descriptionZh: '引擎画质与精细度关键词，如 UE5 渲染、光线追踪、8K 超高清等',
    fieldKey: 'renderQuality',
    options: [
      {
        id: 'quality_8k_masterpiece',
        labelZh: '8K 超写实杰作 (8K UHD, Masterpiece, Photoreal)',
        labelEn: '8K Masterpiece Photorealistic',
        valuePrompt: 'masterpiece, best quality, ultra-detailed, 8k uhd, sharp focus, professional color grading',
        valueZh: '8K大师级杰作，极致精细，专业调色'
      },
      {
        id: 'quality_ue5_raytracing',
        labelZh: '虚幻引擎 5 / 光线追踪 / 次表面散射 (UE5 & Octane)',
        labelEn: 'Unreal Engine 5, Ray Tracing, SSS',
        valuePrompt: 'Unreal Engine 5 render, Octane Render 3D, RTX Ray Tracing reflections, subsurface scattering SSS materials, photorealistic physics',
        valueZh: '虚幻5光线追踪，次表面散射材质，物理真实渲染'
      },
      {
        id: 'quality_raw_film',
        labelZh: 'Raw 原片摄影质感 / 真实噪点颗粒',
        labelEn: 'Raw Photo / Organic Film Texture',
        valuePrompt: 'raw photo, uncompressed color depth, authentic filmic texture, tactile organic details, natural imperfections',
        valueZh: 'Raw未压缩原片质感，天然细微肌理与有机胶片感'
      }
    ]
  },
  {
    id: 'targetModel',
    titleZh: '目标生成模型 (Target AI Model Syntax)',
    titleEn: 'Target Image Model',
    iconName: 'Bot',
    descriptionZh: '生图模型语法重构，如 z-image-turbo, krea2-turbo, qwen-image-2512, flux2, ideogram-v4, stable-diffusion-3',
    fieldKey: 'targetModel',
    options: [
      {
        id: 'model_z_image_turbo',
        labelZh: 'z-image-turbo (极致超快加速生图)',
        labelEn: 'Z-Image Turbo (Ultra Fast)',
        valuePrompt: 'z-image-turbo',
        suggestedParams: { cfg_scale: 3.0, steps: 20, sampler: 'res_multistep' }
      },
      {
        id: 'model_krea2_turbo',
        labelZh: 'krea2-turbo (实时流式极速)',
        labelEn: 'Krea-2 Turbo (Realtime Stream)',
        valuePrompt: 'krea2-turbo',
        suggestedParams: { cfg_scale: 1.0, steps: 12, sampler: 'Euler' }
      },
      {
        id: 'model_qwen_image',
        labelZh: 'qwen-image-2512 (通义万相旗舰，极擅中英双语与国风)',
        labelEn: 'Qwen-Image 2512 (Multilingual & Oriental)',
        valuePrompt: 'qwen-image-2512',
        suggestedParams: { cfg_scale: 6.5, steps: 28, sampler: 'FlowMatchEuler' }
      },
      {
        id: 'model_flux2',
        labelZh: 'flux2 (纯自然语言长句，免负向词)',
        labelEn: 'FLUX.2 (Natural Language)',
        valuePrompt: 'flux2',
        suggestedParams: { cfg_scale: 3.5, steps: 28, sampler: 'Euler' }
      },
      {
        id: 'model_ideogram_v4',
        labelZh: 'ideogram-v4 (文字排版与海报概念)',
        labelEn: 'Ideogram v4.0 (Typography & Graphic)',
        valuePrompt: 'ideogram-v4',
        suggestedParams: { cfg_scale: 5.0, steps: 25, sampler: 'Euler' }
      },
      {
        id: 'model_sd3',
        labelZh: 'stable-diffusion-3 (SD3.5 T5-XXL 语义)',
        labelEn: 'Stable Diffusion 3.5 (SD3)',
        valuePrompt: 'stable-diffusion-3',
        suggestedParams: { cfg_scale: 4.5, steps: 28, sampler: 'FlowMatchEuler' }
      }
    ]
  },
  {
    id: 'negativePreset',
    titleZh: '反向提示词方案 (Negative Prompt Preset)',
    titleEn: 'Negative Prompt Strategy',
    iconName: 'ShieldAlert',
    descriptionZh: '针对目标风格配置反向过滤词（例如3D渲染需要排除照片词，真人需要排除3D词）',
    fieldKey: 'negativePreset',
    options: [
      {
        id: 'neg_for_3d_render',
        labelZh: '3D/CG专属负向词 (排除真人照片与平涂)',
        labelEn: 'For 3D & CG (Block Photorealism & 2D)',
        valuePrompt: 'photorealistic, raw photo, realistic human skin pores, 2d drawing, flat illustration, low quality, distortion, blurry, ugly, bad hands',
        valueZh: '排除真实照片与平涂插画'
      },
      {
        id: 'neg_for_photoreal',
        labelZh: '真人写实专属负向词 (排除3D、卡通与画作)',
        labelEn: 'For Realism (Block 3D, Cartoon, Anime)',
        valuePrompt: '3d, render, cartoon, anime, illustration, painting, drawing, CGI, fake skin, plastic, bad anatomy, bad hands, extra limbs, watermark, text, blurry',
        valueZh: '排除3D模型、卡通、动漫与插画感'
      },
      {
        id: 'neg_for_anime',
        labelZh: '二次元动漫专属负向词 (排除写实与多指畸变)',
        labelEn: 'For Anime & Illustration (Block Realistic)',
        valuePrompt: 'photorealistic, realistic, 3d render, creepy eyes, bad anatomy, extra fingers, deformed hands, worst quality, low quality, watermark',
        valueZh: '排除写实摄影与低画质畸变'
      },
      {
        id: 'neg_minimal_none',
        labelZh: '极简纯净 / 空负向词 (适用于 Flux 等现代模型)',
        labelEn: 'Minimal / Empty (For Flux Models)',
        valuePrompt: '',
        valueZh: '无需负向词'
      }
    ]
  }
];

// 2. One-Click Quick Style Transformation Presets (一键风格改写全套方案)
export const QUICK_STYLE_PRESETS: QuickStylePreset[] = [
  {
    id: 'to_3d_pixar',
    nameZh: '🎨 转为 3D 渲染 / 皮克斯动画风格',
    nameEn: 'Transform to 3D Pixar Style',
    icon: 'Sparkles',
    badge: '最常用替换',
    descriptionZh: '一键将当前提示词的真人写实/摄影要素替换为 3D Pixar 动画、UE5 渲染材质与专属负向词',
    targetElements: {
      style: '3D Pixar style animation render, Octane Render 3D, smooth volumetric plastic & clay textures, cute stylization, Unreal Engine 5 render, cinematic 3D lighting, Ray Tracing',
      medium: '3D Popmart style collectible designer figurine, studio product lighting, clean pedestal',
      renderQuality: 'Unreal Engine 5 render, Octane Render 3D, RTX Ray Tracing reflections, subsurface scattering SSS materials',
      negativePreset: 'photorealistic, raw photo, realistic human skin pores, 2d drawing, flat illustration, low quality, distortion, bad hands',
      camera: 'shot on 3D virtual cine camera, smooth depth of field, high resolution 3D render'
    },
    suggestedModel: 'z-image-turbo'
  },
  {
    id: 'to_photoreal_cinema',
    nameZh: '📸 转为 真人写实 / 8K 电影大片质感',
    nameEn: 'Transform to Photorealistic Cinema',
    icon: 'Camera',
    badge: '超逼真写实',
    descriptionZh: '一键替换为顶级单反、ARRI电影机、胶片色调与真实皮肤毛孔微距质感',
    targetElements: {
      style: 'photorealistic portrait photography, cinematic realism, natural skin texture with visible pores, 8k uhd, dslr photo, film grain, hyperrealistic masterpiece',
      medium: 'high-end commercial studio portrait photography, magazine cover framing',
      camera: 'shot on ARRI Alexa 65 large format cinema camera, Kodak Portra 800 film stock',
      lens: '85mm f/1.4 portrait prime lens, creamy circular bokeh in background',
      isoParams: 'ISO 100, f/1.4 aperture, 1/250s shutter speed, crystal clear sensor',
      renderQuality: 'masterpiece, best quality, ultra-detailed, 8k uhd, sharp focus, raw photo',
      negativePreset: '3d, render, cartoon, anime, illustration, painting, drawing, CGI, fake skin, plastic, bad anatomy, bad hands, extra limbs, watermark'
    },
    suggestedModel: 'flux2'
  },
  {
    id: 'to_cyberpunk_neon',
    nameZh: '🌆 转为 赛博朋克 / 霓虹科幻雨夜',
    nameEn: 'Transform to Cyberpunk Neon',
    icon: 'Zap',
    badge: '赛博科幻',
    descriptionZh: '一键将背景与光影重塑为未来赛博都市、冷暖双色霓虹反光与科技义体质感',
    targetElements: {
      style: 'cyberpunk aesthetic, futuristic sci-fi neon lighting, chromatic aberration, holographic glow, rainy wet reflection, raytracing reflections, 8k uhd',
      background: 'backdrop of a futuristic rainy cyberpunk metropolis at night, glowing neon billboards, wet asphalt with colorful light reflections, steam rising',
      lighting: 'dual-tone split lighting, electric cyan fill light paired with hot magenta neon rim light, vivid chromatic contrast',
      renderQuality: 'Unreal Engine 5 render, RTX Ray Tracing reflections, volumetric fog'
    },
    suggestedModel: 'flux2'
  },
  {
    id: 'to_chinese_xianxia',
    nameZh: '⛩️ 转为 国风水墨 / 东方仙侠玄幻',
    nameEn: 'Transform to Chinese Ink & Xianxia',
    icon: 'Flower2',
    badge: '东方国韵',
    descriptionZh: '一键转换为传统写意水墨、仙侠缥缈宣纸肌理与东方古韵汉服',
    targetElements: {
      style: 'traditional Chinese ink painting style, ethereal Xianxia aesthetic, fluid brushwork, misty atmospheric perspective, Xuan paper texture, poetic oriental elegance',
      background: 'misty ancient mountain peaks in spring mist, ethereal clouds, classical pavilions, tranquil waters',
      lighting: 'ethereal soft diffused celestial light, subtle golden glow through mist',
      renderQuality: 'masterpiece, traditional Chinese brush texture, high resolution artwork',
      negativePreset: 'photorealistic, western modern clothing, modern buildings, 3d render, blurry'
    },
    suggestedModel: 'qwen-image-2512'
  },
  {
    id: 'to_anime_shinkai',
    nameZh: '🍙 转为 日系唯美动漫 / 新海诚画风',
    nameEn: 'Transform to Makoto Shinkai Anime',
    icon: 'Smile',
    badge: '唯美治愈',
    descriptionZh: '一键转换为新海诚治愈系二次元赛璐璐、明亮清透云彩与通透光斑',
    targetElements: {
      style: 'anime aesthetic, Makoto Shinkai art style, cel shaded, vibrant anime sky with fluffy cumulus clouds, painterly light rays, delicate anime lines',
      lighting: 'vibrant sunshine with magical anime lens flare and floating light dust particles',
      renderQuality: 'Kyoto Animation visual aesthetic, masterpiece anime artwork, clean lines',
      negativePreset: 'photorealistic, real photo, 3d render, creepy realistic eyes, bad anatomy'
    },
    suggestedModel: 'krea2-turbo'
  },
  {
    id: 'to_claymation_stopmotion',
    nameZh: '🧸 转为 黏土定格动画 / 手工偶玩具',
    nameEn: 'Transform to Claymation Toy',
    icon: 'Box',
    badge: '趣味手作',
    descriptionZh: '一键将画面改造成富有指纹触感的手工黏土模型与微缩定格动画场景',
    targetElements: {
      style: 'claymation plasticine stop-motion animation style, tactile handmade clay texture, fingerprint marks on surface, Aardman animations aesthetic',
      medium: 'miniature clay model on tabletop studio set, tilt-shift macro photography',
      lighting: 'warm tabletop spotlight, soft miniature shadows',
      renderQuality: 'tactile plasticine clay material, detailed surface imperfections',
      negativePreset: 'photorealistic real human, digital 2d vector, low quality, flat'
    },
    suggestedModel: 'z-image-turbo'
  }
];

// 3. Helper: Extract Initial State from HistoryItem or Skill JSON
export function extractElementStateFromItem(item: HistoryItem): PromptElementState {
  const json = item.skill_result_json || {};
  const s1Multi = json.skill_01_multidim_classification;
  const s1Legacy = json.skill_01_image_type;
  const s2 = json.skill_02_image_style;
  const s3 = json.skill_03_camera_param;
  const s4 = json.skill_04_scene_content;
  const s5 = json.skill_05_detail_desc;

  const styleText = s2?.style?.join(', ') || s1Multi?.visual_medium || s1Legacy?.sub_category || 'photorealistic';
  const mediumText = s1Multi?.commercial_use || s1Legacy?.image_type || 'commercial portrait';
  const subjectText = s4?.subject || 'the main character';
  const bgText = s4?.background || 'scenic background';
  const lightText = s3?.light || s1Multi?.lighting_color || 'soft natural lighting';
  const compText = s3?.composition || s1Multi?.composition_camera || 'rule of thirds';
  const camText = s3?.camera || 'ARRI Alexa / DSLR camera';
  const lensText = s3?.lens_focal || '85mm f/1.4 lens';
  const isoText = s3?.aperture ? `${s3.aperture}, ISO 100` : 'ISO 100, f/1.4';
  const typoText = '';
  const qualText = 'masterpiece, 8k uhd, ultra-detailed';
  const targetModel = item.target_model || 'SDXL 1.0';
  const negPreset = item.negative_prompt || 'blurry, low quality, distortion, watermark';

  return {
    style: styleText,
    medium: mediumText,
    subject: subjectText,
    background: bgText,
    lighting: lightText,
    composition: compText,
    camera: camText,
    lens: lensText,
    isoParams: isoText,
    typography: typoText,
    renderQuality: qualText,
    targetModel: targetModel,
    negativePreset: negPreset,
    customModifiers: ''
  };
}

// 4. Helper: Reconstruct Positive & Negative Prompt from Elements
export function reconstructPromptFromElements(
  elements: PromptElementState,
  promptTemplates: PromptModelTemplate[] = DEFAULT_PROMPT_TEMPLATES
): {
  positivePrompt: string;
  negativePrompt: string;
  targetModel: string;
} {
  const modelName = elements.targetModel;
  const foundTemplate = promptTemplates.find(
    (t) => t.model_name.toLowerCase() === modelName.toLowerCase()
  );

  const styleList = elements.style;
  const subject = elements.subject;
  const background = elements.background;
  const light = elements.lighting;
  const camera = elements.camera;
  const lens = elements.lens;
  const composition = elements.composition;
  const iso = elements.isoParams;
  const typo = elements.typography;
  const detail = elements.renderQuality;
  const custom = elements.customModifiers;

  // Assembling dynamic parts
  const fullCameraString = [camera, lens, iso].filter(Boolean).join(', ');
  const fullDetailString = [detail, typo, custom].filter(Boolean).join(', ');

  let pos = '';
  let neg = elements.negativePreset || '';

  if (foundTemplate) {
    pos = foundTemplate.template_pos
      .replaceAll('{style_list}', styleList)
      .replaceAll('{style_weighted}', `(${styleList}:1.2)`)
      .replaceAll('{subject}', subject)
      .replaceAll('{action}', '')
      .replaceAll('{background}', background)
      .replaceAll('{light}', light)
      .replaceAll('{color_tone}', light)
      .replaceAll('{camera}', fullCameraString)
      .replaceAll('{lens_focal}', lens)
      .replaceAll('{aperture}', iso)
      .replaceAll('{composition}', composition)
      .replaceAll('{detail}', fullDetailString)
      .replaceAll('{visual_mood}', styleList)
      .replaceAll('{environment}', background);

    // Clean any empty double commas or brackets left by templates
    pos = cleanPromptString(pos);

    if (!neg && foundTemplate.template_neg) {
      neg = foundTemplate.template_neg;
    }
  } else {
    // Standard robust fallback assembly
    const parts = [
      styleList ? `(${styleList}:1.2)` : '',
      subject,
      background ? `in ${background}` : '',
      light,
      fullCameraString,
      composition,
      fullDetailString
    ].filter(Boolean);

    pos = cleanPromptString(parts.join(', '));
  }

  return {
    positivePrompt: pos,
    negativePrompt: neg,
    targetModel: modelName
  };
}

// 5. Clean up redundant commas and spaces in prompt string
export function cleanPromptString(str: string): string {
  return str
    .replace(/,\s*,+/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/,\s*\./g, '.')
    .replace(/^\s*,\s*/, '')
    .replace(/\s*,\s*$/, '')
    .trim();
}

// 6. Apply element replacement to a HistoryItem and produce a new or updated HistoryItem
export function applyElementsToHistoryItem(
  originalItem: HistoryItem,
  newElements: PromptElementState,
  options: {
    asNewFork?: boolean; // If true, generates a new item ID and new filename with _variant
    promptTemplates?: PromptModelTemplate[];
  } = {}
): HistoryItem {
  const { positivePrompt, negativePrompt, targetModel } = reconstructPromptFromElements(
    newElements,
    options.promptTemplates || DEFAULT_PROMPT_TEMPLATES
  );

  // Deep clone skill result JSON and inject updated properties
  const updatedSkillJson: SkillResultJson = JSON.parse(JSON.stringify(originalItem.skill_result_json || {}));

  // Update Skill 02 (Style)
  if (!updatedSkillJson.skill_02_image_style) {
    updatedSkillJson.skill_02_image_style = { style: [newElements.style], style_weight: [1.0] };
  } else {
    updatedSkillJson.skill_02_image_style.style = [newElements.style];
  }

  // Update Skill 03 (Camera / Lighting)
  if (!updatedSkillJson.skill_03_camera_param) {
    updatedSkillJson.skill_03_camera_param = {
      light: newElements.lighting,
      color_tone: newElements.lighting,
      camera: newElements.camera,
      composition: newElements.composition,
      lens_focal: newElements.lens,
      aperture: newElements.isoParams
    };
  } else {
    updatedSkillJson.skill_03_camera_param.light = newElements.lighting;
    updatedSkillJson.skill_03_camera_param.camera = newElements.camera;
    updatedSkillJson.skill_03_camera_param.composition = newElements.composition;
    updatedSkillJson.skill_03_camera_param.lens_focal = newElements.lens;
    updatedSkillJson.skill_03_camera_param.aperture = newElements.isoParams;
  }

  // Update Skill 04 (Scene content)
  if (!updatedSkillJson.skill_04_scene_content) {
    updatedSkillJson.skill_04_scene_content = {
      subject: newElements.subject,
      background: newElements.background,
      action: ''
    };
  } else {
    updatedSkillJson.skill_04_scene_content.subject = newElements.subject;
    updatedSkillJson.skill_04_scene_content.background = newElements.background;
  }

  // Update Skill 06 (Prompt Generate)
  if (!updatedSkillJson.skill_06_prompt_generate) {
    updatedSkillJson.skill_06_prompt_generate = {
      positive: positivePrompt,
      negative: negativePrompt,
      target_model: targetModel
    };
  } else {
    updatedSkillJson.skill_06_prompt_generate.positive = positivePrompt;
    updatedSkillJson.skill_06_prompt_generate.negative = negativePrompt;
    updatedSkillJson.skill_06_prompt_generate.target_model = targetModel;
  }

  // Update 7D multi classification if present
  if (updatedSkillJson.skill_01_multidim_classification) {
    updatedSkillJson.skill_01_multidim_classification.visual_medium = newElements.style;
    updatedSkillJson.skill_01_multidim_classification.lighting_color = newElements.lighting;
    updatedSkillJson.skill_01_multidim_classification.composition_camera = newElements.composition;
  }

  const itemId = options.asNewFork
    ? 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
    : originalItem.id;

  const fileName = options.asNewFork
    ? `${originalItem.file_name.replace(/\.[^.]+$/, '')}_${newElements.style.substring(0, 8).replace(/\s+/g, '_')}_variant.png`
    : originalItem.file_name;

  return {
    ...originalItem,
    id: itemId,
    file_name: fileName,
    target_model: targetModel,
    positive_prompt: positivePrompt,
    negative_prompt: negativePrompt,
    skill_result_json: updatedSkillJson,
    create_at: options.asNewFork
      ? new Date().toISOString().replace('T', ' ').substring(0, 19)
      : originalItem.create_at,
    execution_status: 'unexecuted', // Reset execution status for the newly morphed variant
    execution_progress: 0,
    execution_result: undefined
  };
}
