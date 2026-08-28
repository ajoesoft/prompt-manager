import React, { useState, useEffect } from 'react';
import { usePromptStore } from './store/promptStore';
import { DesktopHeader } from './components/DesktopHeader';
import { SideCollapseTree } from './components/SideCollapseTree';
import { PromptResultCard } from './components/PromptResultCard';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { ImageDropzone } from './components/ImageDropzone';
import { EditPromptDialog } from './components/EditPromptDialog';
import { SettingPanel } from './components/SettingPanel';
import { BatchExportDialog } from './components/BatchExportDialog';
import { AboutDialog } from './components/AboutDialog';
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
  List
} from 'lucide-react';
import { HistoryItem } from './types';

export default function App() {
  const { t } = useLanguage();
  const {
    historyList,
    filteredHistory,
    categoryStats,
    modelConfig,
    apiProfiles,
    sqliteStats,
    skillTemplates,
    promptTemplates,
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
    saveApiProfile,
    deleteApiProfile,
    activateApiProfile,
    refreshSqliteStats,
    resetSqliteDatabase,
    updateSkillTemplate,
    toggleSkillEnable,
    updatePromptTemplate,
    addPromptTemplate,
    deletePromptTemplate,
    reAssemblePrompt,
    runReversePipeline,
  } = usePromptStore();

  // Dialog states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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
    targetModel: string
  ) => {
    setShowImportModal(false);
    for (const file of files) {
      await runReversePipeline(file, targetModel);
    }
  };

  const handleRerunItem = async (item: HistoryItem) => {
    await runReversePipeline(
      {
        dataUrl: item.thumb_path,
        name: item.file_name,
        size: item.file_size_kb * 1024,
      },
      item.target_model
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
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenImportModal={() => setShowImportModal(true)}
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
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'list' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-700'
                }`}
                title={t('main.listView')}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'grid' ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-700'
                }`}
                title={t('main.gridView')}
              >
                <LayoutGrid className="w-4 h-4" />
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
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                }
              >
                {filteredHistory.map((item) => (
                  <PromptResultCard
                    key={item.id}
                    item={item}
                    layoutMode={viewMode}
                    onEdit={setActiveItem}
                    onDelete={deleteHistoryItem}
                    onToggleFavorite={toggleFavorite}
                    onRerun={handleRerunItem}
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
                    {t('main.noMatchTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {t('main.noMatchDesc')}
                  </p>
                </div>
                <div className="flex items-center space-x-3 pt-2">
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
                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs border border-slate-200 shadow-xs transition"
                  >
                    {t('main.resetFilterBtn')}
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    {t('main.uploadReverseBtn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL 1: Image Import & Batch Dropzone */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <ImageDropzone
            promptTemplates={promptTemplates}
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
          apiProfiles={apiProfiles}
          sqliteStats={sqliteStats}
          skillTemplates={skillTemplates}
          promptTemplates={promptTemplates}
          onSaveModelConfig={saveModelConfig}
          onSaveApiProfile={saveApiProfile}
          onDeleteApiProfile={deleteApiProfile}
          onActivateApiProfile={activateApiProfile}
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

      {/* MODAL 5: About Dialog */}
      {showAboutModal && (
        <AboutDialog onClose={() => setShowAboutModal(false)} />
      )}
    </div>
  );
}

