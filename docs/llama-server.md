# ✅ 适配图片提示词反推（图生提示词）最终命令
> 目标：**稳定、精准输出绘画提示词，减少多余废话、抑制发散、降低显存压力，适合Qwen3.8-27B-UD多模态**
> 你硬件：3060 12G，原 `-ngl 40` 保留，**新增 --mmproj-offload on**（非常关键，mmproj投影器也进GPU加速图像编码）
```bash
llama-server -m Qwen3.8-27B-UD-IQ3_XXS.gguf \
--mmproj qwen38mmproj-F16.gguf \
--mmproj-offload on \
--jinja \
--reasoning off \
-ngl 40 \
-c 12800 \
-fa on \
--cache-type-k q4_0 \
--cache-type-v q4_0 \
--image-min-tokens 1024 \
--image-max-tokens 2048 \
--port 8080 \
--host 0.0.0.0 \
--parallel 1 \
--temp 0.2 \
--top-p 0.3 \
--top-k 10 \
--min-p 0.02 \
--repeat-penalty 1.02
```

## 📌 参数改动说明（为什么这么改）
### 采样核心（提示词反推最重要）
原 `temp 0.7 top-p 0.95 top-k 20` 随机性太高，容易脑补多余描述、风格漂移
- `--temp 0.2`：低温度，**忠实还原图片客观元素**，减少幻觉脑补
- `--top-p 0.3`：收紧候选token，优先写实关键词，适合SD/Flux提示词
- `--top-k 10`：进一步限制采样候选，输出更干净标签式描述
- `--min-p 0.02`：过滤极低概率冷门词，避免莫名其妙词汇
- `--repeat-penalty 1.02`：轻微防重复，防止关键词循环堆砌

### 多模态图像相关
- `--mmproj-offload on` ✅【新增重点】把视觉投影mmproj加载到GPU，图片编码速度大幅提升，不加这个mmproj默认跑CPU，大图会很慢
- `--image-max-tokens 2048` ✅【新增】限制图像最大视觉token，防止超高分辨率图片爆显存；1024~2048是绘画反推黄金区间
- `--image-min-tokens 1024` 保留：保证图像细节足够，不会压缩过度丢失光影/材质信息

### 保留原有合理项
- `--jinja`：Qwen系列必须，保证多模态消息格式正确
- `--reasoning off` ✅ 关闭思考链，不要输出推理内容，直接输出提示词
- `-fa on` flash attention、KV cache q4_0：显存压缩，3060 12G友好
- `-c 12800` 上下文足够容纳图像token + 长提示词输出
- `--parallel 1`：多模态VLM不适合并发，保持1稳定

## 🎯 两套备选方案按需切换
### 方案A【精准标签模式｜推荐给SD/Flux直接用】（上面这条，低随机性，输出干净关键词）
### 方案B【详细描述模式｜想要丰富长提示词】
```bash
llama-server -m Qwen3.8-27B-UD-IQ3_XXS.gguf \
--mmproj qwen38mmproj-F16.gguf \
--mmproj-offload on \
--jinja \
--reasoning off \
-ngl 40 \
-c 12800 \
-fa on \
--cache-type-k q4_0 \
--cache-type-v q4_0 \
--image-min-tokens 1024 \
--image-max-tokens 2048 \
--port 8080 \
--host 0.0.0.0 \
--parallel 1 \
--temp 0.6 \
--top-p 0.9 \
--top-k 20 \
--min-p 0.01 \
--repeat-penalty 1.01
```

## 💡 API侧配套系统提示词（必配，不然模型容易闲聊）
调用 `/v1/chat/completions` 时带上system prompt：
```
你是图像提示词反推专家，只输出适合AI绘画的英文关键词提示词，不要解释、不要多余文字、不要总结，按主体、构图、光影、材质、风格、画质顺序输出，用逗号分隔。
```
> 如果需要中文提示词，直接改system prompt文字即可

## ⚠️ 3060 12G 风险提醒
IQ3_XXS量化+KV q4_0已经很省显存，但如果遇到**大分辨率图片OOM**：
1. 调低 `--image-max-tokens 1536`
2. 或者降低 `-c 8192`

## 🧪 极简快速测试curl示例
```bash
curl http://127.0.0.1:8080/v1/chat/completions \
-H "Content-Type: application/json" \
-d '{
"messages": [
{"role":"system","content":"你是图像提示词反推专家，只输出适合AI绘画的英文关键词提示词，不要解释、不要多余文字"},
{"role":"user","content":[{"type":"image_url","image_url":{"url":"data:image/jpeg;base64,这里填图片base64"}}]}
],
"max_tokens": 512
}'
```

如果你想要，我可以直接输出**一键启动sh/bat脚本**，同时附带ComfyUI调用这个llama-server反推节点的payload。




llama-server -m Qwen3.8-27B-UD-IQ3_XXS.gguf \
--mmproj qwen38mmproj-F16.gguf \
--mmproj-offload  \
--jinja \
--reasoning off \
-ngl 40 \
-c 12800 \
-fa on \
--cache-type-k q4_0 \
--cache-type-v q4_0 \
--image-min-tokens 1024 \
--image-max-tokens 2048 \
--port 8080 \
--host 0.0.0.0 \
--parallel 1 \
--temp 0.2 \
--top-p 0.3 \
--top-k 10 \
--min-p 0.02 \
--repeat-penalty 1.02



llama-server -m Qwen3.8-27B-UD-IQ3_XXS.gguf \
--mmproj qwen38mmproj-F16.gguf \
--mmproj-offload on \
--jinja \
--reasoning off \
-ngl 40 \
-c 24000 \
-fa on \
--cache-type-k q4_0 \
--cache-type-v q4_0 \
--image-min-tokens 1024 \
--image-max-tokens 2048 \
--port 8080 \
--host 0.0.0.0 \
--parallel 1 \
--temp 0.2 \
--top-p 0.3 \
--top-k 10 \
--min-p 0.02 \
--repeat-penalty 1.02
