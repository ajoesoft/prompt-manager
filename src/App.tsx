import React, { useState, useEffect } from 'react';
import { usePromptStore } from './store/promptStore';
import { DesktopHeader } from './components/DesktopHeader';
import { SideCollapseTree } from './components/SideCollapseTree';
import { RightProjectSidebar } from './components/RightProjectSidebar';
import { PromptResultCard } from './components/PromptResultCard';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { ImageDropzone } from './components/ImageDropzone';
import { EditPromptDialog } from './components/EditPromptDialog';
import { SettingPanel } from './components/SettingPanel';
import { BatchExportDialog } from './components/BatchExportDialog';
import { AboutDialog } from './components/AboutDialog';
import { ProjectManagementModal } from './components/ProjectManagementModal';
import { ManualPromptModal } from './components/ManualPromptModal';
import { PromptElementReplacerModal } from './components/PromptElementReplacerModal';
import { useLanguage } from './i18n/LanguageContext';
import { listenTauriDragDrop } from './services/tauriLlamaService';
import {
  UploadCloud,
  Layers,
  Sparkles,
  SlidersHorizontal,
  FolderOpen,
  Filter,
  Plus,
  RefreshCw,
  Search,
  LayoutGrid,
  Columns3,
  List,
  FolderKanban,
  PenTool,
  Wand2
} from 'lucide-react';
import { HistoryItem, GenerationParams } from './types';

export default function App() {
  const { t } = useLanguage();
  const {
    historyList,
    filteredHistory,
    categoryStats,
    modelConfig,
    sqliteStats,
    skillTemplates,
    promptTemplates,
    projects,
    activeProjectUuid,
    setActiveProjectUuid,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    isComfyUiBatchRunning,
    executeItemComfyUi,
    executeProjectUnexecuted,
    exportProjectJson,
    downloadProjectJson,
    filterRule,
    setFilterRule,
    activeItem,
    setActiveItem,
    isAnalyzing,
    pipelineProgress,
    pipelineLogs,
    addHistoryItem,
    updateHistoryItem,
    deleteHistoryItem,
    toggleFavorite,
    clearAllHistory,
    saveModelConfig,
    refreshSqliteStats,
    resetSqliteDatabase,
    updateSkillTemplate,
    toggleSkillEnable,
    updatePromptTemplate,
    addPromptTemplate,
    deletePromptTemplate,
    reAssemblePrompt,
    runReversePipeline,
    comfyWorkflows,
    activeComfyWorkflowId,
    updateComfyWorkflow,
    addComfyWorkflow,
    deleteComfyWorkflow,
    setActiveComfyWorkflowId,
    resetComfyWorkflows,
    updateComfyEndpoint,
  } = usePromptStore();

  const activeProject = projects.find((p) => p.uuid === activeProjectUuid) || projects[0] || null;

  // Dialog states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showManualPromptModal, setShowManualPromptModal] = useState(false);
  const [showElementReplacerModal, setShowElementReplacerModal] = useState(false);
  const [replacerTargetItem, setReplacerTargetItem] = useState<HistoryItem | null>(null);
  const [replacerBatchItems, setReplacerBatchItems] = useState<HistoryItem[]>([]);
  const [modalTargetProjectUuid, setModalTargetProjectUuid] = useState<string | null>(null);
  const [modalStartInEditMode, setModalStartInEditMode] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'flow'>('flow');

  const handleOpenProjectModal = (targetUuid?: string, startInEditMode = false) => {
    setModalTargetProjectUuid(targetUuid || activeProjectUuid || null);
    setModalStartInEditMode(startInEditMode);
    setShowProjectModal(true);
  };

  const handleOpenElementReplacer = (item: HistoryItem) => {
    setReplacerTargetItem(item);
    setReplacerBatchItems([]);
    setShowElementReplacerModal(true);
  };

  const handleOpenBatchElementReplacer = () => {
    if (filteredHistory.length > 0) {
      setReplacerTargetItem(null);
      setReplacerBatchItems(filteredHistory);
      setShowElementReplacerModal(true);
    } else if (historyList.length > 0) {
      setReplacerTargetItem(null);
      setReplacerBatchItems(historyList);
      setShowElementReplacerModal(true);
    }
  };

  const handleBatchSaveReplacedItems = (updatedItems: HistoryItem[]) => {
    updatedItems.forEach((itm) => updateHistoryItem(itm));
  };

  const handleSaveAsNewFork = (newItem: HistoryItem) => {
    addHistoryItem(newItem);
  };

  const handleAddManualPrompt = (newItem: HistoryItem, autoRunComfyUi = false) => {
    addHistoryItem(newItem);
    if (autoRunComfyUi) {
      setTimeout(() => {
        executeItemComfyUi(newItem.id);
      }, 300);
    }
  };

  // Listen for native Tauri drag-and-drop events at root level (Ubuntu Linux / GTK Webview)
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    listenTauriDragDrop((paths) => {
      if (paths && paths.length > 0) {
        setShowImportModal(true);
      }
    }).then((cleanup) => {
      unlistenFn = cleanup;
    });

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, []);

  // Handle batch queue or single run from dropzone
  const handleStartAnalysis = async (
    files: { dataUrl: string; name: string; size: number }[],
    targetModel: string,
    outputLanguage: 'zh' | 'en' = 'zh',
    options?: {
      projectUuid?: string;
      dimensions?: { width: number; height: number };
      aspectRatio?: string;
      generationParams?: GenerationParams;
    }
  ) => {
    if (isAnalyzing || !files || files.length === 0) return;
    setShowImportModal(false);
    // Deduplicate files by name + size
    const uniqueFiles: { dataUrl: string; name: string; size: number }[] = [];
    const seen = new Set<string>();
    for (const f of files) {
      const key = `${f.name}__${f.size}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFiles.push(f);
      }
    }
    for (const file of uniqueFiles) {
      await runReversePipeline(file, targetModel, outputLanguage, options);
    }
  };

  const handleRerunItem = async (item: HistoryItem) => {
    await runReversePipeline(
      {
        dataUrl: item.thumb_path,
        name: item.file_name,
        size: item.file_size_kb * 1024,
      },
      item.target_model,
      item.output_language || 'zh',
      {
        projectUuid: item.project_uuid,
        dimensions: item.dimensions,
        aspectRatio: item.aspect_ratio,
        generationParams: item.generation_params,
      }
    );
  };

  const handleWindowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleWindowDrop = (e: React.DragEvent) => {
    if (!showImportModal) {
      if (
        (e.dataTransfer.files && e.dataTransfer.files.length > 0) ||
        (e.dataTransfer.types && e.dataTransfer.types.includes('Files'))
      ) {
        e.preventDefault();
        setShowImportModal(true);
      }
    }
  };

  const getProjectName = (uuid?: string): string | undefined => {
    if (!uuid) return undefined;
    return projects.find((p) => p.uuid === uuid)?.name;
  };

  return (
    <div
      onDragOver={handleWindowDragOver}
      onDrop={handleWindowDrop}
      className="flex flex-col h-screen w-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden select-none"
    >
      {/* Top Desktop Window Bar & Header */}
      <DesktopHeader
        modelConfig={modelConfig}
        totalCount={historyList.length}
        projects={projects}
        activeProject={activeProject}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenImportModal={() => setShowImportModal(true)}
        onOpenProjectModal={() => handleOpenProjectModal()}
        onOpenManualPromptModal={() => setShowManualPromptModal(true)}
        onOpenElementReplacerModal={handleOpenBatchElementReplacer}
        onSelectProject={setActiveProjectUuid}
      />

      {/* Main Workspace Area (Sidebar + Content) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Collapsible Taxonomy Tree */}
        <SideCollapseTree
          filterRule={filterRule}
          onFilterChange={setFilterRule}
          categoryStats={categoryStats}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Center Main Stage Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
          {/* Active Filter Chips & View Controls Toolbar */}
          <div className="px-6 py-3 bg-white/90 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-10 backdrop-blur-md shadow-2xs">
            <div className="flex items-center space-x-2 flex-wrap gap-1.5 text-xs">
              <span className="text-slate-500 font-medium flex items-center space-x-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('main.currentView')}</span>
              </span>

              {/* Filter tags */}
              {filterRule.onlyFavorites && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                  {t('main.onlyFavorites')}
                </span>
              )}

              {filterRule.imageType && (
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-medium">
                  {t('main.typeLabel', { type: filterRule.imageType })}
                </span>
              )}

              {filterRule.style && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-medium">
                  {t('main.styleLabel', { style: filterRule.style })}
                </span>
              )}

              {filterRule.targetModel && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                  {t('main.modelLabel', { model: filterRule.targetModel })}
                </span>
              )}

              {filterRule.searchQuery && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                  {t('main.keywordLabel', { query: filterRule.searchQuery })}
                </span>
              )}

              {!filterRule.onlyFavorites &&
                !filterRule.imageType &&
                !filterRule.style &&
                !filterRule.targetModel &&
                !filterRule.searchQuery && (
                  <span className="text-slate-500 text-[11px] font-medium">{t('main.allRecordsView')}</span>
                )}

              <span className="text-slate-400 text-[11px] ml-1 font-mono">
                {t('main.totalItems', { count: filteredHistory.length })}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Prompt Element Replacer / Style Transformer Quick Button */}
              <button
                onClick={handleOpenBatchElementReplacer}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 border border-purple-200 text-xs font-semibold shadow-2xs transition"
                title="拆解画面要素（风格、类型、人物IP、背景、灯光、镜头等）并进行分别替换与风格重塑"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                <span>要素替换重塑</span>
              </button>

              {/* Manual Write Prompt Quick Button */}
              <button
                onClick={() => setShowManualPromptModal(true)}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition"
                title="手动输入正负提示词与参数加入项目"
              >
                <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                <span>手写提示词</span>
              </button>

              {/* Quick Project Switcher */}
              <button
                onClick={() => handleOpenProjectModal()}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition"
                title="项目管理与 ComfyUI 队列调度"
              >
                <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                <span className="max-w-[120px] truncate">{activeProject?.name || '项目管理'}</span>
              </button>

              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'list' ? 'bg-slate-100 text-blue-600 font-semibold shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title={t('main.listView')}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('flow')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'flow' ? 'bg-slate-100 text-blue-600 font-semibold shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title={t('main.flowView')}
              >
                <Columns3 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition ml-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('main.reverseNewImage')}</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 flex-1 max-w-7xl w-full mx-auto">
            {/* Live Pipeline Visualizer (when analyzing or has active progress) */}
            <PipelineVisualizer
              isAnalyzing={isAnalyzing}
              progress={pipelineProgress}
              logs={pipelineLogs}
            />

            {/* Results List */}
            {filteredHistory.length > 0 ? (
              <div
                className={
                  viewMode === 'list'
                    ? 'space-y-4'
                    : 'columns-1 md:columns-2 lg:columns-3 xl:columns-3 gap-4 [column-fill:_balance]'
                }
              >
                {filteredHistory.map((item) => (
                  <PromptResultCard
                    key={item.id}
                    item={item}
                    projectName={getProjectName(item.project_uuid)}
                    layoutMode={viewMode}
                    promptTemplates={promptTemplates}
                    onEdit={setActiveItem}
                    onSave={updateHistoryItem}
                    onDelete={deleteHistoryItem}
                    onToggleFavorite={toggleFavorite}
                    onRerun={handleRerunItem}
                    onExecuteComfyUi={executeItemComfyUi}
                    onOpenElementReplacer={handleOpenElementReplacer}
                    onReassemble={reAssemblePrompt}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400">
                  <FolderOpen className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {activeProject ? `「${activeProject.name}」暂无提示词` : t('main.noMatchTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    您可以手动编写提示词加入该项目，或导入图片进行视觉反推。
                  </p>
                </div>
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => setShowManualPromptModal(true)}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>手动添加提示词</span>
                  </button>

                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    {t('main.uploadReverseBtn')}
                  </button>

                  <button
                    onClick={() =>
                      setFilterRule({
                        searchQuery: '',
                        imageType: null,
                        style: null,
                        targetModel: null,
                        onlyFavorites: false,
                        sortBy: 'date_desc',
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs border border-slate-200 shadow-xs transition"
                  >
                    {t('main.resetFilterBtn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Project List Sidebar with Modify & Delete Icons */}
        <RightProjectSidebar
          projects={projects}
          activeProjectUuid={activeProjectUuid}
          historyList={historyList}
          promptTemplates={promptTemplates}
          onSelectProject={setActiveProjectUuid}
          onOpenProjectModal={handleOpenProjectModal}
          onCreateProject={createProject}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          isCollapsed={isRightSidebarCollapsed}
          onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
        />
      </div>

      {/* MODAL 1: Image Import & Batch Dropzone */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <ImageDropzone
            promptTemplates={promptTemplates}
            projects={projects}
            activeProject={activeProject}
            onSelectProject={setActiveProjectUuid}
            onOpenProjectModal={() => {
              setShowImportModal(false);
              setShowProjectModal(true);
            }}
            isAnalyzing={isAnalyzing}
            onStartAnalysis={handleStartAnalysis}
            onClose={() => setShowImportModal(false)}
          />
        </div>
      )}

      {/* MODAL 2: Single Item Detailed Inspector & Editor */}
      {activeItem && (
        <EditPromptDialog
          item={activeItem}
          promptTemplates={promptTemplates}
          onSave={updateHistoryItem}
          onClose={() => setActiveItem(null)}
          onReassemble={reAssemblePrompt}
        />
      )}

      {/* MODAL 3: System & SKILL Settings Panel */}
      {showSettingsModal && (
        <SettingPanel
          modelConfig={modelConfig}
          sqliteStats={sqliteStats}
          skillTemplates={skillTemplates}
          promptTemplates={promptTemplates}
          comfyWorkflows={comfyWorkflows}
          activeComfyWorkflowId={activeComfyWorkflowId}
          onUpdateComfyWorkflow={updateComfyWorkflow}
          onAddComfyWorkflow={addComfyWorkflow}
          onDeleteComfyWorkflow={deleteComfyWorkflow}
          onSetActiveComfyWorkflowId={setActiveComfyWorkflowId}
          onResetComfyWorkflows={resetComfyWorkflows}
          onUpdateComfyEndpoint={updateComfyEndpoint}
          onSaveModelConfig={saveModelConfig}
          onRefreshSqliteStats={refreshSqliteStats}
          onResetSqliteDatabase={resetSqliteDatabase}
          onUpdateSkillTemplate={updateSkillTemplate}
          onToggleSkillEnable={toggleSkillEnable}
          onUpdatePromptTemplate={updatePromptTemplate}
          onAddPromptTemplate={addPromptTemplate}
          onDeletePromptTemplate={deletePromptTemplate}
          onClearHistory={clearAllHistory}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* MODAL 4: Batch Dataset Export Dialog */}
      {showExportModal && (
        <BatchExportDialog
          items={filteredHistory}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* MODAL 5: Project Management & ComfyUI Queue Modal */}
      {showProjectModal && (
        <ProjectManagementModal
          projects={projects}
          activeProjectUuid={activeProjectUuid}
          initialProjectUuid={modalTargetProjectUuid}
          initialEditing={modalStartInEditMode}
          historyList={historyList}
          promptTemplates={promptTemplates}
          onSelectProject={setActiveProjectUuid}
          onSelectActiveProject={setActiveProjectUuid}
          onCreateProject={createProject}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          onDuplicateProject={duplicateProject}
          onExecuteItem={executeItemComfyUi}
          onExecuteProjectUnexecuted={executeProjectUnexecuted}
          onExecuteUnexecuted={executeProjectUnexecuted}
          onExportProjectJson={exportProjectJson}
          onDownloadProjectJson={downloadProjectJson}
          isComfyUiBatchRunning={isComfyUiBatchRunning}
          onClose={() => setShowProjectModal(false)}
        />
      )}

      {/* MODAL 6: Manual Prompt Writer Modal */}
      {showManualPromptModal && (
        <ManualPromptModal
          isOpen={showManualPromptModal}
          onClose={() => setShowManualPromptModal(false)}
          projects={projects}
          activeProjectUuid={activeProjectUuid}
          promptTemplates={promptTemplates}
          onAddPrompt={handleAddManualPrompt}
        />
      )}

      {/* MODAL 7: Prompt Element Replacer & Style Transformer Modal */}
      {showElementReplacerModal && (
        <PromptElementReplacerModal
          isOpen={showElementReplacerModal}
          onClose={() => {
            setShowElementReplacerModal(false);
            setReplacerTargetItem(null);
            setReplacerBatchItems([]);
          }}
          item={replacerTargetItem}
          batchItems={replacerBatchItems}
          promptTemplates={promptTemplates}
          projectName={activeProject?.name}
          onSaveItem={(updated) => updateHistoryItem(updated)}
          onSaveAsNewFork={handleSaveAsNewFork}
          onBatchSaveItems={handleBatchSaveReplacedItems}
          onExecuteComfyUi={executeItemComfyUi}
        />
      )}

      {/* MODAL 8: About Dialog */}
      {showAboutModal && (
        <AboutDialog onClose={() => setShowAboutModal(false)} />
      )}
    </div>
  );
}


