import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Code,
  Terminal,
  Cpu,
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { PipelineStageProgress } from '../types';

interface PipelineVisualizerProps {
  isAnalyzing: boolean;
  progress: PipelineStageProgress[];
  logs: string[];
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  isAnalyzing,
  progress,
  logs,
}) => {
  const [showLogs, setShowLogs] = useState(true);
  const [selectedStageJson, setSelectedStageJson] = useState<any | null>(null);

  if (!isAnalyzing && progress.length === 0) return null;

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm mb-6 transition">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900 flex items-center space-x-2">
              <span>6 阶段 SKILL 分解流水线引擎</span>
              {isAnalyzing ? (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium animate-pulse">
                  多模态流水线分析中...
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                  全阶段解析完成
                </span>
              )}
            </h4>
          </div>
        </div>

        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center space-x-1 text-[11px] text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
        >
          <Terminal className="w-3 h-3 text-blue-600" />
          <span>{showLogs ? '收起日志' : '展开日志'}</span>
        </button>
      </div>

      {/* 6 Stage Indicators Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3">
        {progress.map((stage) => {
          const isRunning = stage.status === 'running';
          const isSuccess = stage.status === 'success';
          const isError = stage.status === 'error';
          const isPending = stage.status === 'pending';

          return (
            <div
              key={stage.stageNumber}
              onClick={() => stage.outputJson && setSelectedStageJson(stage.outputJson)}
              className={`p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                isRunning
                  ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-400/20 shadow-xs font-medium'
                  : isSuccess
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 hover:border-emerald-400'
                  : isError
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                  isRunning ? 'bg-blue-100 text-blue-800' : isSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  Stage 0{stage.stageNumber}
                </span>
                {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
                {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {isError && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
              </div>

              <div className="font-semibold truncate text-[11px] text-slate-800">{stage.stageTitle}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{stage.skillName}</div>

              {stage.outputJson && (
                <div className="mt-2 pt-1 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-blue-600 font-medium">
                  <span className="flex items-center space-x-1">
                    <Code className="w-3 h-3" />
                    <span>查看 JSON</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Stage JSON Popup Drawer */}
      {selectedStageJson && (
        <div className="mt-3 p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-xs shadow-sm">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-slate-300 font-mono text-[11px]">
            <span className="flex items-center space-x-1 text-blue-400">
              <Code className="w-3.5 h-3.5" />
              <span>SKILL 阶段结构化解析输出 (JSON Schema 校验通过)</span>
            </span>
            <button
              onClick={() => setSelectedStageJson(null)}
              className="text-slate-400 hover:text-white"
            >
              关闭
            </button>
          </div>
          <pre className="mt-2 p-2.5 bg-slate-950 rounded overflow-x-auto text-[11px] font-mono text-emerald-400 max-h-44 border border-slate-800">
            {JSON.stringify(selectedStageJson, null, 2)}
          </pre>
        </div>
      )}

      {/* Terminal Log Console */}
      {showLogs && logs.length > 0 && (
        <div className="mt-3 bg-slate-900 rounded-lg p-3 border border-slate-800 font-mono text-[11px] max-h-36 overflow-y-auto shadow-2xs">
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`${
                  log.includes('❌')
                    ? 'text-rose-400'
                    : log.includes('✅')
                    ? 'text-emerald-400'
                    : log.includes('⏳')
                    ? 'text-blue-300'
                    : 'text-slate-300'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

