import { HistoryItem } from '../types';

export const SAMPLE_PRESET_ITEMS: HistoryItem[] = [
  {
    id: 'sample_00_portrait',
    origin_path: '/samples/neoclassical_portrait_blonde_woman.png',
    thumb_path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    file_name: 'neoclassical_portrait_cinema.png',
    file_size_kb: 1860,
    dimensions: { width: 1024, height: 1365 },
    create_at: '2026-08-22 10:15:30',
    target_model: 'SDXL 1.0',
    positive_prompt: '(masterpiece, best quality, ultra-detailed:1.2), (neoclassical portrait photography:1.2), (cinematic realism:1.3), a young woman with blonde hair tied up, light blue eyes, serene yet slightly melancholy expression, lips parted, gazing towards right, beige off-shoulder top, shot on ARRI Alexa Mini LF, Kodak Portra 800, 85mm portrait lens, f/1.4 aperture, rule of thirds, eye-level slight low angle, foreground bokeh guide, soft diffused facial lighting, gentle fill light, subtle rim light, warm creamy tones with subtle cool blue accents, muted Morandi warm grey, ultra delicate skin texture, shallow depth of field, 8k uhd, photorealistic',
    negative_prompt: 'blurry, low quality, distortion, cartoon, 3d, bad anatomy, bad hands, deformed limbs, watermark, text, flat lighting, high saturation',
    is_favorite: true,
    execution_time_ms: 1920,
    notes: '标准流水线反推样例：含光影、色调、机位、景深与五维分镜拆解',
    formatted_report: `因此，主分类为：人物

最终分类：真人写实（艺术化方向） / 新古典主义肖像摄影（风格归属）


Light: 柔和漫射面光 + 微弱填充光 + 极轻轮廓光
Color Tone: 暖奶油主调 + 冷蓝点缀 / 莫兰迪低饱和暖灰
Camera: ARRI Alexa Mini LF / Kodak Portra 800
Composition: 三分法 + 平视微仰角 + 前景虚化引导
Lens Focal: 85mm 人像大光圈
Aperture: f/1.4 极致浅景深



🎬 Subject（核心主体）
一位年轻女性，金发盘起，浅蓝眼眸，面部表情沉静而略带忧郁，嘴唇微启，正凝视画面右侧人物。她身穿米色露肩上衣，颈部线条清晰，皮肤质感细腻，是画面绝对视觉焦点。

🌄 Background（背景环境与远景建筑/气候）
背景完全虚化，呈现暖黄色调的模糊色块，无法辨识具体建筑或环境，但营造出室内柔和光线的氛围。无明确地标、家具或自然元素，仅以抽象色块强化人物情绪与空间纵深感。

🌀 Action（主体的动态姿态与交互动作）
女性处于静态凝视状态，头部微微侧向右方，目光聚焦于画面外右侧人物（仅可见其蓝色衣袖轮廓）。嘴唇微张，似在倾听或即将回应，形成无声的情感对话。整体姿态优雅内敛，传递出专注、期待或轻微不安的情绪张力。

🖼️ Foreground（前景遮挡物或视线引导元素）
画面右下角有一块深蓝色布料（推测为另一人物衣物），呈虚化状态，作为前景遮挡物，不仅增加画面层次，也引导观众视线向中心女性集中，并暗示“对话对象”的存在，强化互动关系。

🌍 Environment（宏观世界观环境设定）
未明确指定具体世界观，但从光影、服饰、妆容及构图风格判断，属于“现代都市室内场景”或“浪漫剧情片特写镜头”。整体氛围偏向温情、私密、情感浓烈，适合爱情、家庭或心理剧情类影视作品。

最后结果。`,
    skill_result_json: {
      skill_01_image_type: {
        image_type: '人物',
        confidence: 0.98,
        sub_category: '真人写实（艺术化方向） / 新古典主义肖像摄影（风格归属）',
        tags: ['真人写实', '肖像摄影', '新古典主义', '艺术质感']
      },
      skill_02_image_style: {
        style: ['真人写实', '新古典主义肖像', '胶片摄影'],
        style_weight: [0.70, 0.20, 0.10],
        visual_mood: '温情私密, 深沉优雅, 略带忧郁',
        medium: '35mm Film / Kodak Portra 800'
      },
      skill_03_camera_param: {
        light: '柔和漫射面光 + 微弱填充光 + 极轻轮廓光',
        color_tone: '暖奶油主调 + 冷蓝点缀 / 莫兰迪低饱和暖灰',
        camera: 'ARRI Alexa Mini LF / Kodak Portra 800',
        composition: '三分法 + 平视微仰角 + 前景虚化引导',
        lens_focal: '85mm 人像大光圈',
        aperture: 'f/1.4 极致浅景深'
      },
      skill_04_scene_content: {
        subject: '一位年轻女性，金发盘起，浅蓝眼眸，面部表情沉静而略带忧郁，嘴唇微启，正凝视画面右侧人物。她身穿米色露肩上衣，颈部线条清晰，皮肤质感细腻，是画面绝对视觉焦点。',
        background: '背景完全虚化，呈现暖黄色调的模糊色块，无法辨识具体建筑或环境，但营造出室内柔和光线的氛围。无明确地标、家具或自然元素，仅以抽象色块强化人物情绪与空间纵深感。',
        action: '女性处于静态凝视状态，头部微微侧向右方，目光聚焦于画面外右侧人物（仅可见其蓝色衣袖轮廓）。嘴唇微张，似在倾听或即将回应，形成无声的情感对话。整体姿态优雅内敛，传递出专注、期待或轻微不安的情绪张力。',
        foreground: '画面右下角有一块深蓝色布料（推测为另一人物衣物），呈虚化状态，作为前景遮挡物，不仅增加画面层次，也引导观众视线向中心女性集中，并暗示“对话对象”的存在，强化互动关系。',
        environment: '未明确指定具体世界观，但从光影、服饰、妆容及构图风格判断，属于“现代都市室内场景”或“浪漫剧情片特写镜头”。整体氛围偏向温情、私密、情感浓烈，适合爱情、家庭或心理剧情类影视作品。'
      },
      skill_05_detail_desc: {
        detail: '皮肤质感细腻通透，毛孔与微小肌理清晰可见，金发丝丝分明并在边缘柔光中泛着微金光晕，米色露肩上衣针织纹理清晰柔软。',
        emotion: '沉静中略带忧郁与探寻，眼神专注而内敛，饱含未尽言说的复杂情绪张力。',
        textures: '细腻皮肤纹理, 柔软针织织物, 柔和发丝微光',
        attire_or_props: '米色露肩上衣'
      },
      skill_06_prompt_generate: {
        positive: '(masterpiece, best quality, ultra-detailed:1.2), (neoclassical portrait photography:1.2), (cinematic realism:1.3), a young woman with blonde hair tied up, light blue eyes, serene yet slightly melancholy expression, lips parted, gazing towards right, beige off-shoulder top, shot on ARRI Alexa Mini LF, Kodak Portra 800, 85mm portrait lens, f/1.4 aperture, rule of thirds, eye-level slight low angle, foreground bokeh guide, soft diffused facial lighting, gentle fill light, subtle rim light, warm creamy tones with subtle cool blue accents, muted Morandi warm grey, ultra delicate skin texture, shallow depth of field, 8k uhd, photorealistic',
        negative: 'blurry, low quality, distortion, cartoon, 3d, bad anatomy, bad hands, deformed limbs, watermark, text, flat lighting, high saturation',
        target_model: 'SDXL 1.0',
        suggested_params: {
          cfg_scale: 7.0,
          steps: 30,
          sampler: 'Euler A',
          aspect_ratio: '3:4'
        }
      }
    }
  },
  {
    id: 'sample_01',
    origin_path: '/samples/pixar_robot_workshop.png',
    thumb_path: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    file_name: 'pixar_cute_mechanic_bot.png',
    file_size_kb: 1420,
    dimensions: { width: 1024, height: 1024 },
    create_at: '2026-08-20 14:32:10',
    target_model: 'Krea2 Turbo',
    positive_prompt: 'Pixar 3D animated style, miniature brass clockwork robot with glowing sapphire eyes, carefully assembling a glowing crystal orb on a cluttered wooden workbench, soft warm volumetric desk lamp lighting, cinematic depth of field f/2.0, whimsical and heartwarming visual mood, intricate copper gears and delicate brass engravings, 8k resolution, cinematic masterpiece',
    negative_prompt: 'blurry, low quality, distortion, bad anatomy, duplicate, artifact, deformed limbs, watermark, text, flat lighting',
    is_favorite: true,
    execution_time_ms: 1840,
    notes: '反推效果极佳，适合用于盲盒玩具与 3D 动画短片参考',
    skill_result_json: {
      skill_01_image_type: {
        image_type: '3D渲染',
        confidence: 0.98,
        sub_category: '卡通三维角色与场景',
        tags: ['3D模型', '皮克斯动画', '机械生物', '手办质感']
      },
      skill_02_image_style: {
        style: ['PIXAR皮克斯', '迪士尼3D', '微缩模型摄影'],
        style_weight: [0.65, 0.25, 0.10],
        visual_mood: '温馨治愈, 奇幻童趣',
        medium: '3D Blender / Octane Render'
      },
      skill_03_camera_param: {
        light: '主光为温暖台灯漫射光，配合冷蓝边缘轮廓光',
        color_tone: '琥珀暖黄与深蓝对比色调',
        camera: 'Virtual 50mm Prime Lens, f/2.0',
        composition: '居中对角线构图，黄金视线聚焦于微型水晶球',
        lens_focal: '50mm',
        aperture: 'f/2.0'
      },
      skill_04_scene_content: {
        subject: '戴着微型黄铜单片眼镜的呆萌发条机械人',
        background: '堆满古董钟表齿轮、卷轴图纸与松木刨花的工坊阁楼',
        action: '双手小心翼翼托举着发光能量宝石，神情专注',
        foreground: '散落桌角的小螺丝与微型润滑油瓶',
        environment: '充满蒸汽朋克色彩的维多利亚式发明家工作室'
      },
      skill_05_detail_desc: {
        detail: '黄铜外壳表面带有微小氧化铜绿与精细发丝拉丝纹理，玻璃眼眶内折射出细密微型仪表刻度',
        emotion: '专注探寻，略带天真好奇的喜悦',
        textures: '拉丝黄铜, 抛光水晶玻璃, 粗粝胡桃木纹',
        attire_or_props: '单边精细黄铜放大镜, 微型发条钥匙'
      },
      skill_06_prompt_generate: {
        positive: 'Pixar 3D animated style, miniature brass clockwork robot with glowing sapphire eyes, carefully assembling a glowing crystal orb on a cluttered wooden workbench, soft warm volumetric desk lamp lighting, cinematic depth of field f/2.0, whimsical and heartwarming visual mood, intricate copper gears and delicate brass engravings, 8k resolution, cinematic masterpiece',
        negative: 'blurry, low quality, distortion, bad anatomy, duplicate, artifact, deformed limbs, watermark, text, flat lighting',
        target_model: 'Krea2 Turbo',
        suggested_params: {
          cfg_scale: 2.0,
          steps: 8,
          sampler: 'Euler A',
          aspect_ratio: '1:1'
        }
      }
    }
  },
  {
    id: 'sample_02',
    origin_path: '/samples/cyberpunk_rainy_street.png',
    thumb_path: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    file_name: 'neo_tokyo_cyber_ronin.png',
    file_size_kb: 2150,
    dimensions: { width: 1344, height: 768 },
    create_at: '2026-08-20 12:15:44',
    target_model: 'SDXL 1.0',
    positive_prompt: '(masterpiece, best quality, ultra-detailed:1.2), cybernetic augmented ronin warrior holding glowing katana, standing under rain-slicked neon street, (cyberpunk aesthetics:1.2), dark misty Neo-Tokyo alley with hologram advertisements, ARRI Alexa Mini LF, anamorphic lens flare, cyan and magenta rim light, low angle dynamic composition, wet asphalt reflections, carbon fiber armor scratches, hyperrealistic, 8k uhd, dslr:1.1',
    negative_prompt: 'canvas frame, cartoon, 3d, sketch, anime, bad hands, bad eyes, cropped, bad proportions, bad art, monochrome, ugly, worst quality, low quality, normal quality, lowres, extra limbs, watermark',
    is_favorite: true,
    execution_time_ms: 2210,
    notes: '胶片感与雨夜反光极强，SDXL 直接出图质感极高',
    skill_result_json: {
      skill_01_image_type: {
        image_type: '电影截图',
        confidence: 0.95,
        sub_category: '科幻动作电影剧照',
        tags: ['电影质感', '雨夜街头', '赛博朋克', '武士']
      },
      skill_02_image_style: {
        style: ['赛博朋克', '电影写实', '新黑色电影(Neo-Noir)'],
        style_weight: [0.70, 0.20, 0.10],
        visual_mood: '冷峻肃杀, 压抑张力',
        medium: '35mm Anamorphic Film Photography'
      },
      skill_03_camera_param: {
        light: '高反差霓虹招牌背光，青色与品红侧逆光勾勒人物轮廓',
        color_tone: '青冷蓝调与炽烈荧光粉',
        camera: 'ARRI Alexa Mini LF with Cooke Anamorphic /i Full Frame Plus',
        composition: '低机位仰拍全景，利用雨水倒影形成垂直对称轴',
        lens_focal: '40mm Anamorphic',
        aperture: 'f/1.8'
      },
      skill_04_scene_content: {
        subject: '身着机能战术斗篷的机械改造武士，手握充能等离子太刀',
        background: '摩天大楼林立的垂直都市，悬浮全息歌姬广告与淅淅沥沥的暴雨',
        action: '静止伫立于湿漉漉的柏油路面积水中，警惕环视四周',
        foreground: '雨水顺着黑色碳纤维斗篷下摆滴落激起的水花',
        environment: '2088年阴雨绵绵的近未来反乌托邦都市九龙区'
      },
      skill_05_detail_desc: {
        detail: '面部半机械镀铬接口处闪烁微弱红色自检指示灯，太刀刀刃凝聚着等离子电弧跳跃光芒，潮湿衣料贴合肌理',
        emotion: '孤狼独行般的决绝与冷酷',
        textures: '湿水柏油地面, 哑光碳纤维, 镀铬金属反光',
        attire_or_props: '磨损机能斗篷, 高频振动等离子太刀, 神经接驳目镜'
      },
      skill_06_prompt_generate: {
        positive: '(masterpiece, best quality, ultra-detailed:1.2), cybernetic augmented ronin warrior holding glowing katana, standing under rain-slicked neon street, (cyberpunk aesthetics:1.2), dark misty Neo-Tokyo alley with hologram advertisements, ARRI Alexa Mini LF, anamorphic lens flare, cyan and magenta rim light, low angle dynamic composition, wet asphalt reflections, carbon fiber armor scratches, hyperrealistic, 8k uhd, dslr:1.1',
        negative: 'canvas frame, cartoon, 3d, sketch, anime, bad hands, bad eyes, cropped, bad proportions, bad art, monochrome, ugly, worst quality, low quality, normal quality, lowres, extra limbs, watermark',
        target_model: 'SDXL 1.0',
        suggested_params: {
          cfg_scale: 7.0,
          steps: 32,
          sampler: 'DPM++ 2M Karras',
          aspect_ratio: '16:9'
        }
      }
    }
  },
  {
    id: 'sample_03',
    origin_path: '/samples/cinematic_nordic_portrait.png',
    thumb_path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    file_name: 'nordic_winter_portrait.png',
    file_size_kb: 1890,
    dimensions: { width: 896, height: 1152 },
    create_at: '2026-08-19 18:22:30',
    target_model: 'Flux.1 Dev',
    positive_prompt: 'A cinematic high-resolution capture of an ethereal Scandinavian woman with windblown platinum blonde hair and striking emerald eyes who is gently gazing directly into the camera lens amidst a gentle snowfall. The scene takes place in a frozen coastal fjord, characterized by frosted pine trees and distant misty glaciers. Shot on Hasselblad H6D-100c with 85mm f/1.4 lens, illuminated with soft diffused overcast arctic daylight and subtle silver reflector bounce. The color grading exhibits muted earthy Nordic tones with subtle skin warmth, revealing fine details such as delicate individual snowflakes melting on wool sweater knit, authentic skin pores, and natural catchlights in the pupils. The overall aesthetic embodies high fashion editorial photography with a serene and introspective mood.',
    negative_prompt: '',
    is_favorite: false,
    execution_time_ms: 1950,
    notes: '自然语言大段落反推，Flux 完美还原人像自然皮肤与毛衣编织纹理',
    skill_result_json: {
      skill_01_image_type: {
        image_type: '人物',
        confidence: 0.99,
        sub_category: '户外纪实摄影 / 时尚人像',
        tags: ['北欧风', '冬季肖像', '自然光', '高级质感']
      },
      skill_02_image_style: {
        style: ['真人写实', '胶片摄影', 'Vogue时尚大片'],
        style_weight: [0.75, 0.15, 0.10],
        visual_mood: '空灵宁静, 清冷淡雅',
        medium: 'Medium Format Digital Photography'
      },
      skill_03_camera_param: {
        light: '极北多云天气的柔和自然漫射光，配合银色反光板补光',
        color_tone: '低饱和莫兰迪冷色系，肤色温润通透',
        camera: 'Hasselblad H6D-100c Medium Format',
        composition: '经典三分法特写，视线位于上三分之一黄金分割点',
        lens_focal: '85mm Portrait Prime',
        aperture: 'f/1.4'
      },
      skill_04_scene_content: {
        subject: '一位身穿燕麦色粗针粗花呢高领毛衣的北欧女性',
        background: '银装素裹的针叶林海与隐约可见的冰蚀峡湾雾气',
        action: '微侧脸望向镜头，发丝在凛冽微风中自然飘拂',
        foreground: '空中飞舞的朦胧半透明雪花光斑',
        environment: '冬季挪威特罗姆瑟高纬度户外苔原'
      },
      skill_05_detail_desc: {
        detail: '眼睫毛与毛衣肩部附着晶莹剔透的细碎霜花，皮肤呈现真实的微小毛孔与自然红晕，瞳孔倒映着苍茫冰雪天地',
        emotion: '纯净通透，深邃而平静的心灵凝视',
        textures: '粗针羊毛织物, 真实皮肤角质纹理, 冰霜微晶',
        attire_or_props: '燕麦色手工编织厚羊毛衫'
      },
      skill_06_prompt_generate: {
        positive: 'A cinematic high-resolution capture of an ethereal Scandinavian woman with windblown platinum blonde hair and striking emerald eyes who is gently gazing directly into the camera lens amidst a gentle snowfall. The scene takes place in a frozen coastal fjord, characterized by frosted pine trees and distant misty glaciers. Shot on Hasselblad H6D-100c with 85mm f/1.4 lens, illuminated with soft diffused overcast arctic daylight and subtle silver reflector bounce. The color grading exhibits muted earthy Nordic tones with subtle skin warmth, revealing fine details such as delicate individual snowflakes melting on wool sweater knit, authentic skin pores, and natural catchlights in the pupils. The overall aesthetic embodies high fashion editorial photography with a serene and introspective mood.',
        negative: '',
        target_model: 'Flux.1 Dev',
        suggested_params: {
          cfg_scale: 3.5,
          steps: 28,
          sampler: 'Euler',
          aspect_ratio: '3:4'
        }
      }
    }
  },
  {
    id: 'sample_04',
    origin_path: '/samples/ancient_ink_landscape.png',
    thumb_path: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    file_name: 'song_dynasty_misty_mountains.png',
    file_size_kb: 1680,
    dimensions: { width: 1024, height: 1024 },
    create_at: '2026-08-18 09:45:12',
    target_model: 'Midjourney v6.1',
    positive_prompt: 'Traditional Chinese Song Dynasty ink wash painting aesthetic of towering limestone mountain peaks wrapped in swirling white mist, a lone scholar in ancient Hanfu robes standing on a precipitous pine cliff observing a flock of distant cranes soaring into the clouds, soft monochromatic morning haze, poetic balanced negative space with留白 composition, Xuan paper texture with delicate mineral ink splatters, highly atmospheric --ar 16:9 --v 6.1 --style raw --c 5',
    negative_prompt: '--no 3d render, modern elements, harsh digital colors, photorealism, bright neon lights',
    is_favorite: true,
    execution_time_ms: 1720,
    notes: '水墨写意流派，包含留白构图与宣纸材质特征',
    skill_result_json: {
      skill_01_image_type: {
        image_type: '插画',
        confidence: 0.97,
        sub_category: '国风水墨传统山水画',
        tags: ['宋代山水', '水墨画', '文人写意', '留白艺术']
      },
      skill_02_image_style: {
        style: ['中国传统水墨', '新中式东方美学', '工笔写意结合'],
        style_weight: [0.80, 0.15, 0.05],
        visual_mood: '旷远幽深, 禅意悠然',
        medium: 'Ink and mineral pigment on Xuan paper'
      },
      skill_03_camera_param: {
        light: '漫无焦点的高雅晨雾散射光，水墨浓淡自然晕染',
        color_tone: '水墨黑白灰基底，点缀极淡赭石与花青',
        camera: 'Traditional Eastern Panoramic Perspective (散点透视)',
        composition: '经典高远法与深远法结合，大面积灵动留白',
        lens_focal: 'None (Panoramic Scroll)',
        aperture: 'Infinite Depth'
      },
      skill_04_scene_content: {
        subject: '绝壁苍松之巅负手而立的青衫隐士',
        background: '层峦叠嶂、隐没于苍茫云海中的奇险峰峦，远处一行白鹭隐入烟岚',
        action: '驻足观云，衣袂随山风舒卷',
        foreground: '如龙盘曲的老松古枝与嶙峋苔石',
        environment: '烟波浩渺的武陵仙境或黄山云海仙山'
      },
      skill_05_detail_desc: {
        detail: '笔触可见精妙的披麻皴与斧劈皴法，宣纸纤维的微观吸墨晕染肌理历历在目，松针丝丝分明',
        emotion: '超脱世俗的旷达与宇宙沉思',
        textures: '粗粝手工宣纸纤维, 墨分五色的浓淡干湿水痕',
        attire_or_props: '宋式宽袖儒雅青衫, 束发木簪'
      },
      skill_06_prompt_generate: {
        positive: 'Traditional Chinese Song Dynasty ink wash painting aesthetic of towering limestone mountain peaks wrapped in swirling white mist, a lone scholar in ancient Hanfu robes standing on a precipitous pine cliff observing a flock of distant cranes soaring into the clouds, soft monochromatic morning haze, poetic balanced negative space with留白 composition, Xuan paper texture with delicate mineral ink splatters, highly atmospheric --ar 16:9 --v 6.1 --style raw --c 5',
        negative: '--no 3d render, modern elements, harsh digital colors, photorealism, bright neon lights',
        target_model: 'Midjourney v6.1',
        suggested_params: {
          cfg_scale: 6.0,
          steps: 25,
          sampler: 'Midjourney Internal',
          aspect_ratio: '16:9'
        }
      }
    }
  }
];
