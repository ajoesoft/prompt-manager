import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Camera,
  Palette,
  Bot,
  Star,
  Search,
  SlidersHorizontal,
  X,
  Layers,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { FilterRule } from '../types';

interface SideCollapseTreeProps {
  filterRule: FilterRule;
  onFilterChange: (newFilter: FilterRule) => void;
  categoryStats: {
    total: number;
    favorites: number;
    types: Record<string, number>;
    styles: Record<string, number>;
    models: Record<string, number>;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const SideCollapseTree: React.FC<SideCollapseTreeProps> = ({
  filterRule,
  onFilterChange,
  categoryStats,
  isCollapsed,
  onToggleCollapse,
}) => {
  // Tree folder expansion states
  const [openSections, setOpenSections] = useState<{
    types: boolean;
    styles: boolean;
    models: boolean;
  }>({
    types: true,
    styles: true,
    models: true,
  });

  const toggleSection = (key: 'types' | 'styles' | 'models') => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClearAllFilters = () => {
    onFilterChange({
      searchQuery: '',
      imageType: null,
      style: null,
      targetModel: null,
      onlyFavorites: false,
      sortBy: 'date_desc',
    });
  };

  const hasActiveFilters =
    filterRule.imageType !== null ||
    filterRule.style !== null ||
    filterRule.targetModel !== null ||
    filterRule.onlyFavorites ||
    filterRule.searchQuery.trim() !== '';

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-white border-r border-slate-200 flex flex-col items-center py-3 space-y-4 text-slate-500 select-none shadow-xs">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition"
          title="展开侧边分类栏"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-slate-200" />

        <button
          onClick={() => onFilterChange({ ...filterRule, onlyFavorites: false, imageType: null, style: null, targetModel: null })}
          className={`p-2 rounded-lg transition ${
            !filterRule.onlyFavorites && !filterRule.imageType && !filterRule.style && !filterRule.targetModel
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-slate-100 hover:text-slate-800'
          }`}
          title={`全部记录 (${categoryStats.total})`}
        >
          <Folder className="w-4 h-4" />
        </button>

        <button
          onClick={() => onFilterChange({ ...filterRule, onlyFavorites: !filterRule.onlyFavorites })}
          className={`p-2 rounded-lg transition ${
            filterRule.onlyFavorites ? 'bg-amber-50 text-amber-500' : 'hover:bg-slate-100 hover:text-slate-800'
          }`}
          title={`收藏星标 (${categoryStats.favorites})`}
        >
          <Star className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full text-slate-700 text-xs select-none shadow-xs">
      {/* Search Header */}
      <div className="p-3.5 border-b border-slate-100 space-y-2.5 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-900 text-xs flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>分类导航与检索</span>
          </span>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="折叠侧边栏"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={filterRule.searchQuery}
            onChange={(e) => onFilterChange({ ...filterRule, searchQuery: e.target.value })}
            placeholder="搜索提示词/文件名/标签..."
            className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs shadow-2xs"
          />
          {filterRule.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filterRule, searchQuery: '' })}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Filter Reset */}
        <div className="flex items-center justify-between pt-0.5">
          <select
            value={filterRule.sortBy}
            onChange={(e) => onFilterChange({ ...filterRule, sortBy: e.target.value as any })}
            className="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            <option value="date_desc">按时间倒序</option>
            <option value="date_asc">按时间正序</option>
            <option value="name">按文件名升序</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="flex items-center space-x-1 text-[11px] text-rose-600 hover:text-rose-700 font-medium transition"
            >
              <X className="w-3 h-3" />
              <span>重置筛选</span>
            </button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {/* 1. All Items */}
        <button
          onClick={() =>
            onFilterChange({
              ...filterRule,
              imageType: null,
              style: null,
              targetModel: null,
              onlyFavorites: false,
            })
          }
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition ${
            !filterRule.imageType && !filterRule.style && !filterRule.targetModel && !filterRule.onlyFavorites
              ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/80 shadow-2xs'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <span>📁 全部反推记录</span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            !filterRule.imageType && !filterRule.style && !filterRule.targetModel && !filterRule.onlyFavorites
              ? 'bg-blue-100 text-blue-800'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {categoryStats.total}
          </span>
        </button>

        {/* 2. Favorites */}
        <button
          onClick={() =>
            onFilterChange({
              ...filterRule,
              onlyFavorites: !filterRule.onlyFavorites,
            })
          }
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition ${
            filterRule.onlyFavorites
              ? 'bg-amber-50 text-amber-800 font-semibold border border-amber-200/80 shadow-2xs'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Star className={`w-4 h-4 ${filterRule.onlyFavorites ? 'fill-amber-400 text-amber-500' : 'text-amber-500'}`} />
            <span>⭐ 重点收藏与精选</span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            filterRule.onlyFavorites
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {categoryStats.favorites}
          </span>
        </button>

        <div className="pt-2 pb-1">
          <div className="h-px bg-slate-100" />
        </div>

        {/* 3. Image Type Section */}
        <div>
          <button
            onClick={() => toggleSection('types')}
            className="w-full flex items-center justify-between px-2 py-1 text-slate-500 hover:text-slate-800 font-medium text-[11px]"
          >
            <div className="flex items-center space-x-1.5">
              {openSections.types ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <Camera className="w-3.5 h-3.5 text-sky-500" />
              <span className="font-semibold text-slate-700">📷 图片类型筛选</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{Object.keys(categoryStats.types).length} 类</span>
          </button>

          {openSections.types && (
            <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-slate-200 ml-3.5 mt-0.5">
              {Object.entries(categoryStats.types).map(([typeName, count]) => {
                const isSelected = filterRule.imageType === typeName;
                return (
                  <button
                    key={typeName}
                    onClick={() =>
                      onFilterChange({
                        ...filterRule,
                        imageType: isSelected ? null : typeName,
                      })
                    }
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] transition ${
                      isSelected
                        ? 'bg-sky-50 text-sky-800 font-semibold border border-sky-200'
                        : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{typeName}</span>
                    <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-400'}`}>{count}</span>
                  </button>
                );
              })}
              {Object.keys(categoryStats.types).length === 0 && (
                <div className="text-[11px] text-slate-400 py-1 pl-2">暂无分类数据</div>
              )}
            </div>
          )}
        </div>

        {/* 4. Style Section */}
        <div className="pt-1">
          <button
            onClick={() => toggleSection('styles')}
            className="w-full flex items-center justify-between px-2 py-1 text-slate-500 hover:text-slate-800 font-medium text-[11px]"
          >
            <div className="flex items-center space-x-1.5">
              {openSections.styles ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <Palette className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-semibold text-slate-700">🎨 美术风格筛选</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{Object.keys(categoryStats.styles).length} 种</span>
          </button>

          {openSections.styles && (
            <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-slate-200 ml-3.5 mt-0.5">
              {Object.entries(categoryStats.styles).map(([styleName, count]) => {
                const isSelected = filterRule.style === styleName;
                return (
                  <button
                    key={styleName}
                    onClick={() =>
                      onFilterChange({
                        ...filterRule,
                        style: isSelected ? null : styleName,
                      })
                    }
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] transition ${
                      isSelected
                        ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200'
                        : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{styleName}</span>
                    <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-400'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Target Model Section */}
        <div className="pt-1">
          <button
            onClick={() => toggleSection('models')}
            className="w-full flex items-center justify-between px-2 py-1 text-slate-500 hover:text-slate-800 font-medium text-[11px]"
          >
            <div className="flex items-center space-x-1.5">
              {openSections.models ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-slate-700">🤖 目标生成模型</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{Object.keys(categoryStats.models).length} 个</span>
          </button>

          {openSections.models && (
            <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-slate-200 ml-3.5 mt-0.5">
              {Object.entries(categoryStats.models).map(([modelName, count]) => {
                const isSelected = filterRule.targetModel === modelName;
                return (
                  <button
                    key={modelName}
                    onClick={() =>
                      onFilterChange({
                        ...filterRule,
                        targetModel: isSelected ? null : modelName,
                      })
                    }
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] transition ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                        : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{modelName}</span>
                    <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between bg-slate-50">
        <span>6 阶段 SKILL 流水线</span>
        <span className="text-emerald-600 font-medium font-mono">100% 离线可用</span>
      </div>
    </aside>
  );
};

