import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  Archive,
  CheckCircle2
} from 'lucide-react';
import JSZip from 'jszip';
import { HistoryItem } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface BatchExportDialogProps {
  items: HistoryItem[];
  onClose: () => void;
}

export const BatchExportDialog: React.FC<BatchExportDialogProps> = ({
  items,
  onClose,
}) => {
  const { t } = useLanguage();
  const [exportFormat, setExportFormat] = useState<'lora_zip' | 'json' | 'csv' | 'markdown'>('lora_zip');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (exportFormat === 'json') {
        const jsonStr = JSON.stringify(items, null, 2);
        downloadBlob(new Blob([jsonStr], { type: 'application/json' }), `prompt_manager_export_${Date.now()}.json`);
      } else if (exportFormat === 'csv') {
        const headers = ['id', 'file_name', 'target_model', 'positive_prompt', 'negative_prompt', 'create_at'];
        const rows = items.map((it) => [
          `"${it.id}"`,
          `"${it.file_name.replace(/"/g, '""')}"`,
          `"${it.target_model}"`,
          `"${it.positive_prompt.replace(/"/g, '""')}"`,
          `"${it.negative_prompt.replace(/"/g, '""')}"`,
          `"${it.create_at}"`,
        ]);
        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        downloadBlob(new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }), `prompt_manager_export_${Date.now()}.csv`);
      } else if (exportFormat === 'markdown') {
        let md = `# Prompt Manager Dataset Export Report\n\nGenerated At: ${new Date().toLocaleString()}\nTotal Count: ${items.length}\n\n---\n\n`;
        items.forEach((it, idx) => {
          md += `### ${idx + 1}. ${it.file_name} (${it.target_model})\n\n`;
          md += `**Positive Prompt:**\n\`\`\`\n${it.positive_prompt}\n\`\`\`\n\n`;
          if (it.negative_prompt) {
            md += `**Negative Prompt:**\n\`\`\`\n${it.negative_prompt}\n\`\`\`\n\n`;
          }
          md += `*Type*: ${it.skill_result_json.skill_01_image_type?.image_type || 'General'} | *Style*: ${(it.skill_result_json.skill_02_image_style?.style || []).join(', ')} | *Date*: ${it.create_at}\n\n---\n\n`;
        });
        downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8;' }), `prompt_manager_export_${Date.now()}.md`);
      } else if (exportFormat === 'lora_zip') {
        const zip = new JSZip();
        const folder = zip.folder('dataset');

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const baseName = item.file_name.replace(/\.[^/.]+$/, '') || `sample_${i + 1}`;

          // Prompt txt
          folder?.file(`${baseName}.txt`, item.positive_prompt);

          // If thumbnail has data URL base64, save image too
          if (item.thumb_path.startsWith('data:image')) {
            const base64Data = item.thumb_path.split(',')[1];
            folder?.file(`${baseName}.png`, base64Data, { base64: true });
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `lora_dataset_prompts_${Date.now()}.zip`);
      }

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">{t('export.title')}</h3>
              <p className="text-[11px] text-slate-500">{t('export.selectedCount', { count: items.length })}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs bg-white">
          <div className="space-y-2">
            <label className="font-semibold text-slate-800 block">{t('export.selectFormat')}:</label>

            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => setExportFormat('lora_zip')}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  exportFormat === 'lora_zip'
                    ? 'bg-blue-50/70 border-blue-400 text-blue-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold">
                  <Archive className="w-4 h-4 text-blue-600" />
                  <span>{t('export.loraZipTitle')}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{t('export.loraZipDesc')}</p>
              </div>

              <div
                onClick={() => setExportFormat('json')}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  exportFormat === 'json'
                    ? 'bg-blue-50/70 border-blue-400 text-blue-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  <span>{t('export.jsonTitle')}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{t('export.jsonDesc')}</p>
              </div>

              <div
                onClick={() => setExportFormat('csv')}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  exportFormat === 'csv'
                    ? 'bg-blue-50/70 border-blue-400 text-blue-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold">
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <span>{t('export.csvTitle')}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{t('export.csvDesc')}</p>
              </div>

              <div
                onClick={() => setExportFormat('markdown')}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  exportFormat === 'markdown'
                    ? 'bg-blue-50/70 border-blue-400 text-blue-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>{t('export.markdownTitle')}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{t('export.markdownDesc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium shadow-2xs transition"
          >
            {t('export.cancel')}
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{t('export.exportSuccess')}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isExporting ? t('export.packing') : t('export.startExport')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


