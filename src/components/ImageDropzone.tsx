import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Check,
  AlertCircle,
  FileText,
  FolderUp,
  X,
  Play
} from 'lucide-react';
import { PromptModelTemplate } from '../types';

interface ImageDropzoneProps {
  promptTemplates: PromptModelTemplate[];
  isAnalyzing: boolean;
  onStartAnalysis: (files: { dataUrl: string; name: string; size: number }[], targetModel: string) => void;
  onClose?: () => void;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  promptTemplates,
  isAnalyzing,
  onStartAnalysis,
  onClose,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<{ dataUrl: string; name: string; size: number }[]>([]);
  const [targetModel, setTargetModel] = useState<string>(promptTemplates[0]?.model_name || 'Krea2 Turbo');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setErrorMsg('请上传有效的图片格式 (PNG, JPG, WEBP, BMP)');
      return;
    }

    const readers = validFiles.map((file) => {
      return new Promise<{ dataUrl: string; name: string; size: number }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            dataUrl: e.target?.result as string,
            name: file.name,
            size: file.size,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((results) => {
      setSelectedFiles((prev) => [...prev, ...results]);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick preset sample picker
  const handleSelectPresetSample = (url: string, name: string) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedFiles((prev) => [
            ...prev,
            {
              dataUrl: reader.result as string,
              name,
              size: blob.size,
            },
          ]);
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        console.error('Failed to load sample image:', err);
      });
  };

  const handleSubmit = () => {
    if (selectedFiles.length === 0) return;
    onStartAnalysis(selectedFiles, targetModel);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-800 max-w-3xl w-full mx-auto animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">图片导入与多模态反推</h3>
            <p className="text-xs text-slate-500">支持单图精细拆解或多图批量排队反推，基于 6 阶段 SKILL 流水线</p>
          </div>
        </div>

        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Target Model Selector */}
      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-slate-700">目标提示词模板语法:</span>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={targetModel}
            onChange={(e) => setTargetModel(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-blue-700 font-semibold focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            {promptTemplates.map((t) => (
              <option key={t.id} value={t.model_name}>
                {t.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dropzone Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/bmp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
          <ImageIcon className="w-6 h-6" />
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-800">
            拖拽图片至此处，或 <span className="text-blue-600 underline">点击浏览文件</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">支持 PNG, JPG, WEBP · 支持单张或多图批量排队</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selected Files Queue Preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>待处理图片队列 ({selectedFiles.length} 张)</span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-rose-600 hover:text-rose-700 text-[11px] font-semibold"
            >
              清空队列
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="relative group bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-2xs"
              >
                <img
                  src={file.dataUrl}
                  alt={file.name}
                  className="w-full h-24 object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(idx);
                  }}
                  className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-slate-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition shadow-xs"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="p-1.5 text-[10px] truncate text-slate-700 bg-white border-t border-slate-100 font-medium">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset Fast Testing Presets */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="text-[11px] text-slate-500 mb-2 flex items-center justify-between">
          <span>或快速体验预设场景样本:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              handleSelectPresetSample(
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
                'preset_3d_robot.png'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs border border-slate-200 shadow-2xs transition font-medium"
          >
            🤖 皮克斯 3D 机械人
          </button>
          <button
            type="button"
            onClick={() =>
              handleSelectPresetSample(
                'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
                'preset_cyberpunk_neon.png'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs border border-slate-200 shadow-2xs transition font-medium"
          >
            🏙️ 赛博朋克霓虹雨夜
          </button>
          <button
            type="button"
            onClick={() =>
              handleSelectPresetSample(
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
                'preset_nordic_portrait.png'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs border border-slate-200 shadow-2xs transition font-medium"
          >
            ❄️ 北欧胶片人像
          </button>
          <button
            type="button"
            onClick={() =>
              handleSelectPresetSample(
                'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
                'preset_song_ink.png'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs border border-slate-200 shadow-2xs transition font-medium"
          >
            🎨 宋代水墨仙山
          </button>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
          >
            取消
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={selectedFiles.length === 0 || isAnalyzing}
          className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition ${
            selectedFiles.length === 0 || isAnalyzing
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>SKILL 流水线执行中...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>开始反推 ({selectedFiles.length} 张图片)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

