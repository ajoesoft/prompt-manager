import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  X,
  Play
} from 'lucide-react';
import { PromptModelTemplate } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import {
  isTauri,
  listenTauriDragDrop,
  tauriReadImageFiles
} from '../services/tauriLlamaService';

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
  const { t } = useLanguage();
  const [selectedFiles, setSelectedFiles] = useState<{ dataUrl: string; name: string; size: number }[]>([]);
  const [targetModel, setTargetModel] = useState<string>(promptTemplates[0]?.model_name || 'Krea2 Turbo');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);

  // Global window listeners to prevent Linux/Ubuntu browser default actions (such as navigating away to the file)
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', handleGlobalDragOver, false);
    window.addEventListener('drop', handleGlobalDrop, false);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver, false);
      window.removeEventListener('drop', handleGlobalDrop, false);
    };
  }, []);

  // Listen for native Tauri drag-and-drop events on Linux (Ubuntu Nautilus / GTK) / Windows / macOS
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    listenTauriDragDrop(
      async (paths: string[]) => {
        if (!paths || paths.length === 0) return;
        setErrorMsg(null);
        try {
          const imageFiles = await tauriReadImageFiles(paths);
          if (imageFiles && imageFiles.length > 0) {
            setSelectedFiles((prev) => [...prev, ...imageFiles]);
          } else {
            setErrorMsg(t('dropzone.invalidFormat'));
          }
        } catch (err) {
          console.warn('[ImageDropzone] Failed to load dropped paths in Tauri:', err);
          setErrorMsg(t('dropzone.invalidFormat'));
        }
      },
      (dragging) => {
        setIsDragging(dragging);
      }
    ).then((cleanup) => {
      unlistenFn = cleanup;
    });

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [t]);

  const handleFiles = useCallback((files: FileList | File[] | null) => {
    if (!files || (files instanceof FileList && files.length === 0) || (Array.isArray(files) && files.length === 0)) return;
    setErrorMsg(null);

    const validFiles: File[] = [];
    const fileListArray = Array.from(files);

    const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'jfif', 'avif', 'gif', 'svg', 'tiff', 'tif'];
    const nonImageExts = ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'tar', 'gz', 'exe', 'bin', 'sh', 'json', 'mp4', 'mp3'];

    for (const file of fileListArray) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isMimeImage = file.type ? file.type.startsWith('image/') : false;
      const isExtImage = imageExts.includes(ext);
      // On Ubuntu/Linux, file.type is often "" when dropped from Nautilus; fallback to ext inspection or size check
      const isProbableImage = isMimeImage || isExtImage || (file.type === '' && file.size > 0 && !nonImageExts.includes(ext));

      if (isProbableImage) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      setErrorMsg(t('dropzone.invalidFormat'));
      return;
    }

    const readers = validFiles.map((file) => {
      return new Promise<{ dataUrl: string; name: string; size: number }>((resolve) => {
        const reader = new FileReader();
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        reader.onload = (e) => {
          let dataUrl = (e.target?.result as string) || '';
          // Fix Linux generic octet-stream mime if present
          if (dataUrl.startsWith('data:application/octet-stream') || dataUrl.startsWith('data:;base64')) {
            const detectedMime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
            dataUrl = dataUrl.replace(/^data:[^;]*/, `data:${detectedMime}`);
          }
          resolve({
            dataUrl,
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
  }, [t]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDragging(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    // 1. Standard HTML5 File list
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      return;
    }

    // 2. DataTransfer items
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const itemFiles: File[] = [];
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) itemFiles.push(f);
        }
      }
      if (itemFiles.length > 0) {
        handleFiles(itemFiles);
        return;
      }
    }

    // 3. Ubuntu Linux Nautilus text/uri-list / text/plain fallback
    const uriList = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain') || '';
    if (uriList && (uriList.includes('file://') || uriList.startsWith('/'))) {
      const paths = uriList
        .split(/[\r\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('#'));

      if (paths.length > 0) {
        if (isTauri()) {
          const imageFiles = await tauriReadImageFiles(paths);
          if (imageFiles.length > 0) {
            setSelectedFiles((prev) => [...prev, ...imageFiles]);
            setErrorMsg(null);
            return;
          }
        }
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedFiles.length === 0) return;
    onStartAnalysis(selectedFiles, targetModel);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-slate-800 max-w-3xl w-full mx-auto animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden"
    >
      {/* Visual drag indicator overlay when dragging over the modal */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[1px] border-2 border-blue-500 rounded-2xl pointer-events-none z-30 flex flex-col items-center justify-center animate-in fade-in duration-100">
          <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-xl flex items-center space-x-3">
            <UploadCloud className="w-8 h-8 animate-bounce" />
            <span className="text-sm font-bold tracking-wide">
              {t('dropzone.dragText')} ({t('dropzone.title')})
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">{t('dropzone.title')}</h3>
            <p className="text-xs text-slate-500">{t('dropzone.subtitle')}</p>
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
          <span className="text-xs font-semibold text-slate-700">{t('dropzone.targetSyntax')}:</span>
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
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 select-none ${
          isDragging
            ? 'border-blue-500 bg-blue-50/70 scale-[1.01] shadow-inner'
            : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/bmp, image/jfif, image/avif, image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition ${
          isDragging ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-blue-50 text-blue-600 border-blue-100'
        }`}>
          <ImageIcon className="w-7 h-7" />
        </div>

        <div className="pointer-events-none">
          <p className="text-xs font-semibold text-slate-800">
            {t('dropzone.dragText')}{' '}
            <span className="text-blue-600 underline cursor-pointer">{t('dropzone.browseFiles')}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{t('dropzone.formatNote')}</p>
        </div>
      </div>

      {/* Error Notification */}
      {errorMsg && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* File Queue List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
            <span>{t('dropzone.queueTitle', { count: selectedFiles.length })}</span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-rose-600 hover:underline hover:text-rose-700 font-semibold"
            >
              {t('dropzone.clearQueue')}
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
              >
                <div className="flex items-center space-x-2.5 truncate max-w-[80%]">
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    className="w-8 h-8 rounded object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="truncate">
                    <p className="font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(idx);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            {t('dropzone.cancel')}
          </button>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedFiles.length === 0 || isAnalyzing}
          className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-medium transition shadow-md ${
            selectedFiles.length === 0 || isAnalyzing
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('dropzone.analyzing')}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t('dropzone.startAnalysis', { count: selectedFiles.length })}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
