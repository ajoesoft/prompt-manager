import { GgufModelInfo, ModelDownloadRegistry, QuantizationOption, DownloadSourceProvider } from '../types';
import rawModelData from './model_downloads.json';

export const DEFAULT_MODEL_REGISTRY: ModelDownloadRegistry = rawModelData as ModelDownloadRegistry;

export const DEFAULT_MODELS: GgufModelInfo[] = DEFAULT_MODEL_REGISTRY.models;

/**
 * Generates ready-to-run shell commands for downloading GGUF model files
 */
export function generateDownloadCommands(
  model: GgufModelInfo,
  quantOption: QuantizationOption,
  source: DownloadSourceProvider,
  outputDir: string = './models'
) {
  const url = source === 'modelscope' ? quantOption.download_urls.modelscope : quantOption.download_urls.huggingface;
  const fileName = quantOption.file_name;
  const targetPath = `${outputDir.replace(/\/$/, '')}/${fileName}`;

  return {
    url,
    fileName,
    targetPath,
    wget: `mkdir -p ${outputDir} && wget -c -O "${targetPath}" "${url}"`,
    curl: `mkdir -p ${outputDir} && curl -L -C - -o "${targetPath}" "${url}"`,
    aria2c: `aria2c -c -s 16 -x 16 -k 1M -d "${outputDir}" -o "${fileName}" "${url}"`,
    modelscopeCli: source === 'modelscope' 
      ? `modelscope download --model '${model.ms_repo}' --include '${fileName}' --local_dir '${outputDir}'`
      : `modelscope download --model '${model.ms_repo}' --local_dir '${outputDir}'`,
    hfCli: `huggingface-cli download ${model.hf_repo} ${fileName} --local-dir ${outputDir}`
  };
}

/**
 * Returns the recommended quantization for a model or default Q4_K_M
 */
export function getRecommendedQuant(model: GgufModelInfo): QuantizationOption {
  return model.quantizations.find((q) => q.recommended) || model.quantizations[0];
}

/**
 * Returns human readable badge style for quant
 */
export function getQuantBadgeStyle(quant: string): { bg: string; text: string; border: string } {
  switch (quant) {
    case 'Q4_K_M':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'Q5_K_M':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'Q2_K':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'Q6_K':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'Q8_0':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'F16':
    case 'BF16':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}
