/**
 * Asset Library
 * Browse, search, and manage all generated assets
 */

import React, { useState, useEffect } from 'react';
import { oracleStorage, StoredAsset } from '../services/storageService';
import { toast } from 'sonner';

type AssetType = 'all' | 'meme' | 'banner' | 'storyboard' | 'carousel' | 'video';

interface Props {
  onSelectAsset?: (asset: StoredAsset) => void;
}

export const AssetLibrary: React.FC<Props> = ({ onSelectAsset }) => {
  const [assets, setAssets] = useState<StoredAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<StoredAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<AssetType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<StoredAsset | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [assets, activeFilter, searchQuery]);

  const loadAssets = async () => {
    try {
      const allAssets = await oracleStorage.getAllAssets();
      setAssets(allAssets);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = [...assets];

    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === activeFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.prompt.toLowerCase().includes(query) ||
        a.type.toLowerCase().includes(query) ||
        a.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    setFilteredAssets(filtered);
  };

  const handleDelete = async (id: string) => {
    await oracleStorage.deleteAsset(id);
    toast.success('Asset deleted');
    setSelectedAsset(null);
    loadAssets();
  };

  const handleDownload = (asset: StoredAsset) => {
    const link = document.createElement('a');
    link.href = asset.dataUrl;
    link.download = `${asset.type}_${asset.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const typeColors: Record<string, string> = {
    meme: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    banner: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    storyboard: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    carousel: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    video: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  const typeIcons: Record<string, string> = {
    meme: '🖼️',
    banner: '🎨',
    storyboard: '🎬',
    carousel: '🎠',
    video: '📹',
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 text-sm">Loading assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <span className="text-gold-400">🖼️</span> Asset Library
          </h3>
          <p className="text-slate-500 text-sm mt-1">{assets.length} assets generated</p>
        </div>
        
        {/* View toggle */}
        <div className="flex items-center gap-2 bg-void-800/50 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'grid' ? 'bg-gold-500 text-void-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ▦ Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'list' ? 'bg-gold-500 text-void-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ☰ List
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by prompt or tag..."
            className="w-full bg-void-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-300 focus:border-gold-500/50"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        </div>
        
        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {(['all', 'meme', 'banner', 'storyboard', 'carousel', 'video'] as AssetType[]).map(type => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`
                px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all
                ${activeFilter === type 
                  ? 'bg-gold-500 text-void-950' 
                  : 'bg-void-800 text-slate-400 hover:text-gold-400 border border-white/5'}
              `}
            >
              {type === 'all' ? '📁 All' : `${typeIcons[type]} ${type}`}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
          : 'space-y-3'
        }>
          {filteredAssets.map(asset => (
            viewMode === 'grid' ? (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="group cursor-pointer"
              >
                <div className="aspect-square bg-void-800 rounded-xl overflow-hidden border border-white/5 hover:border-gold-500/30 transition-all relative">
                  <img 
                    src={asset.dataUrl} 
                    alt={asset.type}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className={`text-[10px] px-2 py-1 rounded-lg border ${typeColors[asset.type]}`}>
                      {asset.type}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="flex items-center gap-4 p-4 bg-void-800/50 rounded-xl border border-white/5 hover:border-gold-500/20 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-void-900 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={asset.dataUrl} 
                    alt={asset.type}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${typeColors[asset.type]}`}>
                      {typeIcons[asset.type]} {asset.type}
                    </span>
                    <span className="text-xs text-slate-600">{formatDate(asset.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{asset.prompt}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(asset);
                  }}
                  className="px-3 py-2 text-slate-500 hover:text-gold-400 transition-colors"
                >
                  ⬇
                </button>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <span className="text-5xl block mb-4">📭</span>
          <h4 className="font-bold text-slate-300 mb-2">
            {assets.length === 0 ? 'No Assets Yet' : 'No Matching Assets'}
          </h4>
          <p className="text-slate-500 text-sm">
            {assets.length === 0 
              ? 'Generate your first campaign to start building your library.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedAsset(null)}
        >
          <div 
            className="glass-panel rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <span className={`text-xs px-3 py-1.5 rounded-lg border ${typeColors[selectedAsset.type]}`}>
                {typeIcons[selectedAsset.type]} {selectedAsset.type}
              </span>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-slate-500 hover:text-slate-300 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Image */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-void-900">
              <img 
                src={selectedAsset.dataUrl} 
                alt={selectedAsset.type}
                className="w-full h-auto"
              />
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Prompt
                </label>
                <p className="text-sm text-slate-300 bg-void-800/50 p-3 rounded-lg">
                  {selectedAsset.prompt}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Created {formatDate(selectedAsset.createdAt)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => handleDownload(selectedAsset)}
                  className="flex-1 btn-oracle py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <span>⬇</span> Download
                </button>
                <button
                  onClick={() => {
                    onSelectAsset?.(selectedAsset);
                    setSelectedAsset(null);
                  }}
                  className="flex-1 bg-void-800 border border-white/10 text-slate-300 py-3 rounded-xl font-bold hover:border-gold-500/30 transition-colors"
                >
                  Use in Campaign
                </button>
                <button
                  onClick={() => handleDelete(selectedAsset.id)}
                  className="px-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-colors"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetLibrary;
