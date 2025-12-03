/**
 * War Room Dashboard
 * Command center overview with metrics, charts, and campaign timeline
 */

import React, { useEffect, useState } from 'react';
import { oracleStorage, StoredCampaign, StoredAsset } from '../services/storageService';
import { HealthScoreResult, getScoreColor, getScoreLabel } from '../services/healthScore';
import { ProactiveWhispers } from './ProactiveWhispers';

// Oracle Eye SVG Component
const OracleEye: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 120 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5c542" />
        <stop offset="50%" stopColor="#d4a013" />
        <stop offset="100%" stopColor="#b8860b" />
      </linearGradient>
      <radialGradient id="irisGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f5c542" />
        <stop offset="60%" stopColor="#d4a013" />
        <stop offset="100%" stopColor="#04040a" />
      </radialGradient>
    </defs>
    {/* Outer eye shape */}
    <path 
      d="M60 5 C25 5 5 30 5 30 C5 30 25 55 60 55 C95 55 115 30 115 30 C115 30 95 5 60 5Z" 
      stroke="url(#eyeGradient)" 
      strokeWidth="2" 
      fill="none"
      className="animate-pulse"
    />
    {/* Iris */}
    <circle cx="60" cy="30" r="18" fill="url(#irisGradient)" />
    {/* Pupil */}
    <circle cx="60" cy="30" r="8" fill="#04040a" />
    {/* Highlight */}
    <circle cx="54" cy="24" r="3" fill="rgba(255,255,255,0.6)" />
  </svg>
);

interface DashboardStats {
  totalCampaigns: number;
  totalAssets: number;
  totalTemplates: number;
  assetsByType: Record<string, number>;
  recentCampaigns: StoredCampaign[];
  recentAssets: StoredAsset[];
}

interface Props {
  onSelectCampaign?: (campaign: StoredCampaign) => void;
  onNewCampaign?: () => void;
  currentHealthScore?: HealthScoreResult | null;
}

export const WarRoomDashboard: React.FC<Props> = ({ 
  onSelectCampaign, 
  onNewCampaign,
  currentHealthScore 
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [campaigns, assets, templates] = await Promise.all([
        oracleStorage.getAllCampaigns(),
        oracleStorage.getAllAssets(),
        oracleStorage.getAllTemplates()
      ]);

      const assetsByType: Record<string, number> = {};
      assets.forEach(asset => {
        assetsByType[asset.type] = (assetsByType[asset.type] || 0) + 1;
      });

      setStats({
        totalCampaigns: campaigns.length,
        totalAssets: assets.length,
        totalTemplates: templates.length,
        assetsByType,
        recentCampaigns: campaigns.slice(0, 5),
        recentAssets: assets.slice(0, 8)
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 text-sm">Loading War Room...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
    <header className="mb-16 text-center relative">
        {/* Decorative lines */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"></div>
          <div className="mx-8"></div>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"></div>
        </div>
        
        {/* Oracle Eye */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <OracleEye className="w-24 h-12 opacity-80" />
        </div>

        {/* Title */}
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-4 animate-fade-in-up">
          <span className="oracle-gradient">The Oracle</span>
        </h1>
        
        {/* Tagline */}
        <p className="text-gold-500/60 text-sm md:text-base uppercase tracking-[0.3em] font-medium mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Situation Room
        </p>
        
        {/* Description */}
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          The 30,000 ft view. Above your day. Above your projects. 
          <br className="hidden md:block" />
          <span className="text-slate-500">Above the undercurrent.</span>
        </p>
        
        {/* Powered by */}
        <div className="mt-8 flex items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Powered by</span>
          <span className="text-gold-500 font-bold text-sm tracking-wide">Yonathan</span>
          <span className="text-slate-700">×</span>
          <span className="text-slate-500 font-mono text-xs">Gemini 3 Pro</span>
        </div>
      </header>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-3">
            <span className="text-gold-400">⚔</span> War Room
          </h2>
          <p className="text-slate-500 text-sm mt-1">Command center overview</p>
        </div>
        <button
          onClick={onNewCampaign}
          className="btn-oracle py-3 px-6 rounded-xl flex items-center gap-2 text-sm"
        >
          <span>+</span> New Campaign
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Campaigns" 
          value={stats?.totalCampaigns || 0} 
          icon="📋"
          color="gold"
        />
        <StatCard 
          label="Assets Generated" 
          value={stats?.totalAssets || 0} 
          icon="🎨"
          color="cyan"
        />
        <StatCard 
          label="Templates" 
          value={stats?.totalTemplates || 0} 
          icon="📐"
          color="purple"
        />
        <StatCard 
          label="This Week" 
          value={stats?.recentCampaigns.filter(c => 
            c.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000
          ).length || 0} 
          icon="📈"
          color="emerald"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Current Health Score */}
        {currentHealthScore && (
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span>💊</span> Campaign Health
            </h3>
            
            {/* Score Circle */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-void-800"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(currentHealthScore.overall / 100) * 352} 352`}
                    strokeLinecap="round"
                    className={getScoreColor(currentHealthScore.overall).replace('text-', 'text-')}
                    style={{ color: currentHealthScore.overall >= 80 ? '#34d399' : currentHealthScore.overall >= 60 ? '#d4a013' : '#f87171' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${getScoreColor(currentHealthScore.overall)}`}>
                    {currentHealthScore.overall}
                  </span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">
                    {getScoreLabel(currentHealthScore.overall)}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown bars */}
            <div className="space-y-3">
              {Object.entries(currentHealthScore.breakdown).map(([key, value]) => {
                const numValue = value as number;
                return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-slate-400 font-bold">{numValue}</span>
                  </div>
                  <div className="h-1.5 bg-void-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${numValue}%`,
                        backgroundColor: numValue >= 80 ? '#34d399' : numValue >= 60 ? '#d4a013' : '#f87171'
                      }}
                    ></div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Top insight */}
            {currentHealthScore.insights[0] && (
              <div className={`mt-4 p-3 rounded-xl border ${
                currentHealthScore.insights[0].type === 'strength' 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                  : currentHealthScore.insights[0].type === 'warning'
                  ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                  : 'bg-blue-500/5 border-blue-500/20 text-blue-400'
              }`}>
                <p className="text-xs font-medium">{currentHealthScore.insights[0].message}</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Campaigns */}
        <div className={`glass-panel rounded-2xl p-6 ${currentHealthScore ? '' : 'lg:col-span-2'}`}>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>📋</span> Recent Campaigns
          </h3>
          
          {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
            <div className="space-y-3">
              {stats.recentCampaigns.map(campaign => (
                <button
                  key={campaign.id}
                  onClick={() => onSelectCampaign?.(campaign)}
                  className="w-full p-4 bg-void-800/50 hover:bg-void-700/50 rounded-xl border border-white/5 hover:border-gold-500/20 transition-all text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-200 group-hover:text-gold-400 transition-colors">
                        {campaign.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDate(campaign.updatedAt)}
                      </p>
                    </div>
                    {campaign.healthScore && (
                      <span className={`text-sm font-bold ${getScoreColor(campaign.healthScore)}`}>
                        {campaign.healthScore}
                      </span>
                    )}
                  </div>
                  {campaign.tags && campaign.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {campaign.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 bg-void-900/50 text-slate-500 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 text-sm mb-4">No campaigns yet</p>
              <button
                onClick={onNewCampaign}
                className="text-gold-400 hover:text-gold-300 text-sm font-medium"
              >
                Create your first campaign →
              </button>
            </div>
          )}
        </div>

        {/* Asset Distribution */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>📊</span> Asset Distribution
          </h3>
          
          {stats?.assetsByType && Object.keys(stats.assetsByType).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.assetsByType).map(([type, count]) => {
                const numCount = count as number;
                const total = stats.totalAssets || 1;
                const percentage = Math.round((numCount / total) * 100);
                const colors: Record<string, string> = {
                  meme: 'bg-amber-500',
                  banner: 'bg-cyan-500',
                  storyboard: 'bg-rose-500',
                  carousel: 'bg-indigo-500',
                  video: 'bg-purple-500'
                };
                
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 capitalize">{type}s</span>
                      <span className="text-slate-500">{numCount} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-void-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${colors[type] || 'bg-gold-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 text-sm">No assets generated yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Assets Gallery */}
      {stats?.recentAssets && stats.recentAssets.length > 0 && (
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🖼️</span> Recent Assets
          </h3>
          
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {stats.recentAssets.map(asset => (
              <div 
                key={asset.id}
                className="aspect-square bg-void-800 rounded-xl overflow-hidden border border-white/5 hover:border-gold-500/30 transition-all cursor-pointer group"
              >
                <img 
                  src={asset.dataUrl} 
                  alt={asset.type}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Oracle Whispers - Proactive Insights */}
      <div className="glass-panel rounded-2xl p-6">
        <ProactiveWhispers onActionClick={(whisper) => {
          if (whisper.actionLabel?.includes('Campaign')) {
            onNewCampaign?.();
          }
        }} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction 
          icon="📝" 
          label="New Brief" 
          onClick={onNewCampaign}
        />
        <QuickAction 
          icon="📐" 
          label="Templates" 
          onClick={() => {/* TODO */}}
        />
        <QuickAction 
          icon="🎨" 
          label="Asset Library" 
          onClick={() => {/* TODO */}}
        />
        <QuickAction 
          icon="🎤" 
          label="Brand Voice" 
          onClick={() => {/* TODO */}}
        />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  color: 'gold' | 'cyan' | 'purple' | 'emerald';
}> = ({ label, value, icon, color }) => {
  const colors = {
    gold: 'from-gold-500/20 to-gold-500/5 border-gold-500/20',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 border`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-slate-200">{value}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">{label}</p>
        </div>
        <span className="text-2xl opacity-60">{icon}</span>
      </div>
    </div>
  );
};

// Quick Action Button
const QuickAction: React.FC<{
  icon: string;
  label: string;
  onClick?: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="bg-void-800/50 hover:bg-void-700/50 border border-white/5 hover:border-gold-500/20 rounded-xl p-4 text-left transition-all group"
  >
    <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">{icon}</span>
    <span className="text-sm font-medium text-slate-400 group-hover:text-gold-400 transition-colors">{label}</span>
  </button>
);

export default WarRoomDashboard;
