import React, { useState, useEffect } from 'react';
import { 
  recordPerformance,
  getAllPerformanceData,
  generatePerformanceInsights,
  generatePerformanceReport,
  AssetPerformance,
  PerformanceInsight,
  PerformanceReport,
  PerformanceMetrics
} from '../services/feedbackService';
import { oracleStorage } from '../services/storageService';
import { toast } from 'sonner';

export const FeedbackDashboard: React.FC = () => {
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [performanceData, setPerformanceData] = useState<AssetPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'log' | 'insights'>('overview');

  // Form state for adding new performance data
  const [formData, setFormData] = useState({
    assetId: '',
    platform: 'instagram',
    views: '',
    likes: '',
    comments: '',
    shares: '',
    saves: '',
    clicks: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [insightsData, reportData, allData] = await Promise.all([
        generatePerformanceInsights(),
        generatePerformanceReport(),
        Promise.resolve(getAllPerformanceData())
      ]);
      
      setInsights(insightsData);
      setReport(reportData);
      setPerformanceData(allData);
    } catch (error) {
      console.error('Failed to load feedback data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPerformance = async () => {
    if (!formData.assetId) {
      toast.error('Please select an asset');
      return;
    }

    const metrics: PerformanceMetrics = {};
    if (formData.views) metrics.views = parseInt(formData.views);
    if (formData.likes) metrics.likes = parseInt(formData.likes);
    if (formData.comments) metrics.comments = parseInt(formData.comments);
    if (formData.shares) metrics.shares = parseInt(formData.shares);
    if (formData.saves) metrics.saves = parseInt(formData.saves);
    if (formData.clicks) metrics.clicks = parseInt(formData.clicks);

    recordPerformance({
      assetId: formData.assetId,
      assetType: 'meme', // Would be dynamic based on asset
      platform: formData.platform,
      metrics
    });

    toast.success('Performance data logged');
    setShowAddForm(false);
    setFormData({
      assetId: '',
      platform: 'instagram',
      views: '',
      likes: '',
      comments: '',
      shares: '',
      saves: '',
      clicks: ''
    });
    loadData();
  };

  const getInsightIcon = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'top_performer': return '🏆';
      case 'underperformer': return '⚠️';
      case 'trend': return '📈';
      case 'recommendation': return '💡';
      default: return '📊';
    }
  };

  const getInsightColor = (type: PerformanceInsight['type']) => {
    switch (type) {
      case 'top_performer': return 'border-emerald-500/30 bg-emerald-500/5';
      case 'underperformer': return 'border-red-500/30 bg-red-500/5';
      case 'trend': return 'border-blue-500/30 bg-blue-500/5';
      case 'recommendation': return 'border-amber-500/30 bg-amber-500/5';
      default: return 'border-slate-700 bg-slate-800/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-amber-400/50 animate-pulse">Loading performance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📊</span>
          <div>
            <h2 className="text-xl font-bold text-slate-200">Feedback Loop</h2>
            <p className="text-sm text-slate-500">Track performance and learn what works</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors text-sm font-medium"
        >
          + Log Performance
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        {(['overview', 'log', 'insights'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'text-amber-400 border-b-2 border-amber-400' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && report && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Total Tracked</span>
              <p className="text-3xl font-bold text-slate-200 mt-2">{report.totalAssets}</p>
            </div>
            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Avg Engagement</span>
              <p className="text-3xl font-bold text-amber-400 mt-2">{report.avgEngagement.toFixed(2)}%</p>
            </div>
            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Platforms</span>
              <p className="text-3xl font-bold text-slate-200 mt-2">{Object.keys(report.byPlatform).length}</p>
            </div>
            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Period</span>
              <p className="text-sm font-medium text-slate-400 mt-2">{report.period}</p>
            </div>
          </div>

          {/* Top Performers */}
          {report.topAssets.length > 0 && (
            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
              <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                🏆 Top Performers
              </h3>
              <div className="space-y-3">
                {report.topAssets.map((asset, i) => (
                  <div 
                    key={asset.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-amber-400">#{i + 1}</span>
                      <div>
                        <span className="text-slate-300 text-sm">{asset.type}</span>
                        <span className="text-slate-600 text-xs ml-2">on {asset.platform}</span>
                      </div>
                    </div>
                    <span className="text-emerald-400 font-medium">{asset.engagement.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Breakdown */}
          {Object.keys(report.byPlatform).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
                <h3 className="font-semibold text-slate-200 mb-4">By Platform</h3>
                <div className="space-y-3">
                  {Object.entries(report.byPlatform).map(([platform, data]) => {
                    const platformData = data as { count: number; avgEngagement: number };
                    return (
                    <div key={platform} className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm capitalize">{platform}</span>
                      <div className="text-right">
                        <span className="text-slate-200 font-medium">{platformData.avgEngagement.toFixed(2)}%</span>
                        <span className="text-slate-600 text-xs ml-2">({platformData.count} posts)</span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
                <h3 className="font-semibold text-slate-200 mb-4">By Content Type</h3>
                <div className="space-y-3">
                  {Object.entries(report.byType).map(([type, data]) => {
                    const typeData = data as { count: number; avgEngagement: number };
                    return (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm capitalize">{type}</span>
                      <div className="text-right">
                        <span className="text-slate-200 font-medium">{typeData.avgEngagement.toFixed(2)}%</span>
                        <span className="text-slate-600 text-xs ml-2">({typeData.count})</span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {report.totalAssets === 0 && (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <span className="text-4xl block mb-3">📊</span>
              <p className="text-slate-400">No performance data yet</p>
              <p className="text-slate-600 text-sm mt-1">Log your first metrics to see insights</p>
            </div>
          )}
        </div>
      )}

      {/* Log Tab */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          {performanceData.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <span className="text-4xl block mb-3">📝</span>
              <p className="text-slate-400">No performance logs</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-amber-400 hover:text-amber-300 text-sm"
              >
                Log your first performance data →
              </button>
            </div>
          ) : (
            performanceData.map(record => (
              <div 
                key={record.id}
                className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded capitalize">
                      {record.assetType}
                    </span>
                    <span className="text-slate-500 text-xs capitalize">{record.platform}</span>
                  </div>
                  <span className="text-slate-600 text-xs">
                    {new Date(record.recordedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {record.metrics.views !== undefined && (
                    <div>
                      <span className="text-xs text-slate-600">Views</span>
                      <p className="text-slate-200 font-medium">{record.metrics.views.toLocaleString()}</p>
                    </div>
                  )}
                  {record.metrics.likes !== undefined && (
                    <div>
                      <span className="text-xs text-slate-600">Likes</span>
                      <p className="text-slate-200 font-medium">{record.metrics.likes.toLocaleString()}</p>
                    </div>
                  )}
                  {record.metrics.comments !== undefined && (
                    <div>
                      <span className="text-xs text-slate-600">Comments</span>
                      <p className="text-slate-200 font-medium">{record.metrics.comments.toLocaleString()}</p>
                    </div>
                  )}
                  {record.metrics.shares !== undefined && (
                    <div>
                      <span className="text-xs text-slate-600">Shares</span>
                      <p className="text-slate-200 font-medium">{record.metrics.shares.toLocaleString()}</p>
                    </div>
                  )}
                  {record.metrics.saves !== undefined && (
                    <div>
                      <span className="text-xs text-slate-600">Saves</span>
                      <p className="text-slate-200 font-medium">{record.metrics.saves.toLocaleString()}</p>
                    </div>
                  )}
                  {record.metrics.clicks !== undefined && (
                    <div>
                      <span className="text-xs text-slate-600">Clicks</span>
                      <p className="text-slate-200 font-medium">{record.metrics.clicks.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.map((insight, i) => (
            <div 
              key={i}
              className={`p-5 rounded-xl border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                <div>
                  <h4 className="font-semibold text-slate-200 mb-1">{insight.title}</h4>
                  <p className="text-slate-400 text-sm">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Performance Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-200">Log Performance</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase mb-2">Asset ID</label>
                <input
                  type="text"
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  placeholder="Enter asset ID"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-amber-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 uppercase mb-2">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-amber-500/50 outline-none"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['views', 'likes', 'comments', 'shares', 'saves', 'clicks'].map(metric => (
                  <div key={metric}>
                    <label className="block text-xs text-slate-500 uppercase mb-1 capitalize">{metric}</label>
                    <input
                      type="number"
                      value={formData[metric as keyof typeof formData]}
                      onChange={(e) => setFormData({ ...formData, [metric]: e.target.value })}
                      placeholder="0"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-amber-500/50 outline-none text-sm"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmitPerformance}
                className="w-full py-3 bg-amber-500 text-slate-900 font-bold rounded-xl hover:bg-amber-400 transition-colors mt-4"
              >
                Save Performance Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
