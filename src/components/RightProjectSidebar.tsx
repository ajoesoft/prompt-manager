import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Edit3,
  Trash2,
  Check,
  Sparkles,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Calendar,
  Layers,
  Settings2,
  FolderOpen,
  AlertTriangle,
  Play
} from 'lucide-react';
import { Project, PromptModelTemplate, HistoryItem } from '../types';

interface RightProjectSidebarProps {
  projects: Project[];
  activeProjectUuid: string | null;
  historyList: HistoryItem[];
  promptTemplates: PromptModelTemplate[];
  onSelectProject: (uuid: string) => void;
  onOpenProjectModal: (targetProjectUuid?: string, startInEditMode?: boolean) => void;
  onCreateProject: (data: Partial<Project>) => Project;
  onUpdateProject: (uuid: string, updates: Partial<Project>) => void;
  onDeleteProject: (uuid: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const RightProjectSidebar: React.FC<RightProjectSidebarProps> = ({
  projects,
  activeProjectUuid,
  historyList,
  promptTemplates,
  onSelectProject,
  onOpenProjectModal,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  isCollapsed,
  onToggleCollapse,
}) => {
  // Local quick modal states
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [quickEditingProject, setQuickEditingProject] = useState<Project | null>(null);
  const [quickEditName, setQuickEditName] = useState('');
  const [quickEditDesc, setQuickEditDesc] = useState('');
  const [quickEditModel, setQuickEditModel] = useState('');

  const handleStartQuickEdit = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickEditingProject(proj);
    setQuickEditName(proj.name);
    setQuickEditDesc(proj.description || '');
    setQuickEditModel(proj.target_model || promptTemplates[0]?.model_name || 'Krea2 Turbo');
  };

  const handleSaveQuickEdit = () => {
    if (!quickEditingProject || !quickEditName.trim()) return;
    onUpdateProject(quickEditingProject.uuid, {
      name: quickEditName.trim(),
      description: quickEditDesc.trim(),
      target_model: quickEditModel,
    });
    setQuickEditingProject(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingProject) return;
    onDeleteProject(deletingProject.uuid);
    setDeletingProject(null);
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-white border-l border-slate-200 flex flex-col items-center py-3 space-y-4 text-slate-500 select-none shadow-2xs z-10">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition"
          title="展开项目列表"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-slate-200" />

        <button
          onClick={() => onOpenProjectModal(undefined, true)}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
          title="新建项目"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="flex-1 flex flex-col items-center space-y-2 overflow-y-auto w-full px-1">
          {projects.map((p) => {
            const isActive = p.uuid === activeProjectUuid;
            const pCount = historyList.filter((h) => !h.project_uuid || h.project_uuid === p.uuid).length;
            return (
              <button
                key={p.uuid}
                onClick={() => onSelectProject(p.uuid)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={`${p.name} (${pCount} 项)`}
              >
                {p.name.slice(0, 1)}
                {pCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onOpenProjectModal()}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition"
          title="项目管理与调度"
        >
          <FolderKanban className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col select-none shadow-2xs z-10">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-slate-800 tracking-tight">项目列表</h3>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                {projects.length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">独立管理生图任务与提示词</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onOpenProjectModal(undefined, true)}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold shadow-2xs transition"
            title="新建文生图项目"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建</span>
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            title="折叠项目列表"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects List Body */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {projects.map((proj) => {
          const isActive = proj.uuid === activeProjectUuid;
          const projectItems = historyList.filter(
            (i) => !i.project_uuid || i.project_uuid === proj.uuid
          );
          const executedCount = projectItems.filter((i) => i.execution_status === 'completed').length;

          return (
            <div
              key={proj.uuid}
              onClick={() => onSelectProject(proj.uuid)}
              className={`group p-3 rounded-xl border transition cursor-pointer relative flex flex-col space-y-2 ${
                isActive
                  ? 'bg-blue-50/50 border-blue-300 shadow-xs ring-1 ring-blue-500/20'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Row 1: Project Name & Action Icons (Edit, Delete) */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-slate-300'
                    }`}
                  />
                  <h4
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-blue-900' : 'text-slate-800'
                    }`}
                    title={proj.name}
                  >
                    {proj.name}
                  </h4>
                </div>

                {/* Right Action Icons (Edit & Delete) */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {/* Edit Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProjectModal(proj.uuid, true);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-100/70 transition"
                    title="修改项目配置 (编辑)"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingProject(proj);
                    }}
                    disabled={projects.length <= 1}
                    className={`p-1 rounded-md transition ${
                      projects.length <= 1
                        ? 'text-slate-200 cursor-not-allowed'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-100/70'
                    }`}
                    title={projects.length <= 1 ? '至少保留一个项目' : '删除项目'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Description preview if available */}
              {proj.description && (
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {proj.description}
                </p>
              )}

              {/* Row 3: Tags, Model & Execution Stats */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                <span className="font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[120px]">
                  {proj.target_model || '通用模型'}
                </span>

                <div className="flex items-center space-x-1 font-mono">
                  {proj.aspect_ratio && (
                    <span className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60">
                      {proj.aspect_ratio}
                    </span>
                  )}
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                    {executedCount}/{projectItems.length}
                  </span>
                </div>
              </div>

              {/* Active Indicator Strip */}
              {isActive && (
                <div className="absolute -left-px top-2 bottom-2 w-1 bg-blue-600 rounded-r" />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Action */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 flex flex-col space-y-2">
        <button
          onClick={() => onOpenProjectModal()}
          className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 hover:border-blue-300 text-xs font-semibold shadow-2xs transition"
        >
          <Settings2 className="w-3.5 h-3.5 text-blue-600" />
          <span>项目管理与 ComfyUI 调度中心</span>
        </button>
      </div>

      {/* Quick Delete Confirmation Dialog */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">确认删除项目</h4>
                <p className="text-xs text-slate-500">删除后无法恢复</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-4">
              确定要删除项目 <strong className="text-slate-800">"{deletingProject.name}"</strong> 吗？
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeletingProject(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Dialog */}
      {quickEditingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-800">快速修改项目</h4>
              </div>
              <button
                onClick={() => setQuickEditingProject(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  项目名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickEditName}
                  onChange={(e) => setQuickEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-500"
                  placeholder="项目名称"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  项目描述
                </label>
                <textarea
                  rows={2}
                  value={quickEditDesc}
                  onChange={(e) => setQuickEditDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-500"
                  placeholder="项目描述..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  默认文生图模型
                </label>
                <select
                  value={quickEditModel}
                  onChange={(e) => setQuickEditModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  {promptTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.model_name}>
                      {tpl.model_name} ({tpl.display_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const pUuid = quickEditingProject.uuid;
                  setQuickEditingProject(null);
                  onOpenProjectModal(pUuid, true);
                }}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                打开完整高级配置 ➔
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => setQuickEditingProject(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveQuickEdit}
                  disabled={!quickEditName.trim()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
