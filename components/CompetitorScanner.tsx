import React, { useState } from 'react';
import { analyzeCompetitor, compareStrategies, CompetitorInsight, quickScan } from '../services/competitorService';
import { CampaignBrief } from '../types';
import { toast } from 'sonner';

interface Props {
  currentBrief?: CampaignBrief;
}

export const CompetitorScanner: React.FC<Props> = ({ currentBrief }) => {
  const [url, setUrl] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<CompetitorInsight | null>(null);
  const [comparison, setComparison] = useState<{
    advantages: string[];
    gaps: string[];
    differentiation: string[];
    actionItems: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'brand' | 'strategy' | 'visual' | 'compete'>('brand');

  const handleScan = async () => {
    if (!url.trim()) {
      toast.error('Enter a competitor URL');
      return;
    }

    setLoading(true);
    setInsight(null);
    setComparison(null);

    try {
      const result = await analyzeCompetitor(url, context);
      setInsight(result);
      toast.success('Competitor analysis complete');

      // Auto-compare if brief available
      if (currentBrief) {
        const comp = await compareStrategies(
          { meta: currentBrief.meta, audience: currentBrief.audience, creative: currentBrief.creative },
          result
        );
        setComparison(comp);
      }
    } catch (error: any) {
      console.error('Scan failed:', error);
      // Fall back to quick scan
      const quick = quickScan(url);
      setInsight(quick as CompetitorInsight);
      toast.error('Full analysis failed. Showing basic info.');
    } finally {
      setLoading(false);
    }
  };

  const renderTagList = (items: string[], color: string = 'slate') => (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span 
          key={i} 
          className={`px-3 py-1.5 bg-${color}-500/10 text-${color}-400 text-xs rounded-lg border border-${color}-500/20`}
        >
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🔍</span>
        <div>
          <h2 className="text-xl font-bold text-slate-200">Competitor Scanner</h2>
          <p className="text-sm text-slate-500">Reverse-engineer competitor strategy from any URL</p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Competitor URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://competitor.com"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Additional Context <span className="text-slate-600">(optional)</span>
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., fitness app competitor, direct rival in NYC"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all"
          />
        </div>

        <button
          onClick={handleScan}
          disabled={loading || !url.trim()}
          className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-bold rounded-xl hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>🔍 Scan Competitor</>
          )}
        </button>
      </div>

      {/* Results */}
      {insight && (
        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-200">{insight.brand.name}</h3>
                <p className="text-sm text-slate-500">{insight.brand.industry}</p>
              </div>
              <span className="text-xs text-slate-600">
                Analyzed {new Date(insight.analyzedAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-3 text-slate-400 text-sm italic">"{insight.brand.positioning}"</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700/50">
            {(['brand', 'strategy', 'visual', 'compete'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? 'text-amber-400 border-b-2 border-amber-400 bg-slate-800/30' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'brand' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Voice & Tone</h4>
                  {renderTagList(insight.voice.tone, 'blue')}
                  <p className="mt-3 text-slate-400 text-sm">{insight.voice.personality}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Key Phrases</h4>
                  {renderTagList(insight.voice.keyPhrases, 'purple')}
                </div>
              </div>
            )}

            {activeTab === 'strategy' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">🪝 Hooks</h4>
                  <ul className="space-y-2">
                    {insight.strategy.hooks.map((hook, i) => (
                      <li key={i} className="text-slate-300 text-sm flex gap-2">
                        <span className="text-amber-500">•</span> {hook}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">💔 Pain Points</h4>
                  <ul className="space-y-2">
                    {insight.strategy.painPoints.map((pain, i) => (
                      <li key={i} className="text-slate-300 text-sm flex gap-2">
                        <span className="text-red-400">•</span> {pain}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">💎 Value Props</h4>
                  {renderTagList(insight.strategy.valueProps, 'emerald')}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">📢 CTA Styles</h4>
                  {renderTagList(insight.strategy.ctaStyles, 'cyan')}
                </div>
              </div>
            )}

            {activeTab === 'visual' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Color Scheme</h4>
                  <p className="text-slate-300 text-sm">{insight.visual.colorScheme}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Style Notes</h4>
                  <p className="text-slate-300 text-sm">{insight.visual.styleNotes}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Content Types</h4>
                  {renderTagList(insight.visual.contentTypes, 'pink')}
                </div>
              </div>
            )}

            {activeTab === 'compete' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">⚠️ Their Weaknesses</h4>
                    <ul className="space-y-2">
                      {insight.weaknesses.map((w, i) => (
                        <li key={i} className="text-slate-300 text-sm flex gap-2">
                          <span className="text-red-400">→</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">🎯 Your Opportunities</h4>
                    <ul className="space-y-2">
                      {insight.opportunities.map((o, i) => (
                        <li key={i} className="text-slate-300 text-sm flex gap-2">
                          <span className="text-emerald-400">→</span> {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">💡 Recommendations</h4>
                  <ul className="space-y-2">
                    {insight.recommendations.map((r, i) => (
                      <li key={i} className="text-slate-300 text-sm flex gap-2">
                        <span className="text-amber-400">{i + 1}.</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {comparison && (
                  <div className="mt-8 pt-6 border-t border-slate-700/50">
                    <h4 className="text-sm font-bold text-slate-200 mb-4">📊 Head-to-Head Comparison</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                        <h5 className="text-xs font-bold text-emerald-400 uppercase mb-2">Your Advantages</h5>
                        <ul className="space-y-1">
                          {comparison.advantages.map((a, i) => (
                            <li key={i} className="text-slate-300 text-xs">✓ {a}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                        <h5 className="text-xs font-bold text-red-400 uppercase mb-2">Gaps to Address</h5>
                        <ul className="space-y-1">
                          {comparison.gaps.map((g, i) => (
                            <li key={i} className="text-slate-300 text-xs">! {g}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 bg-slate-800/50 rounded-xl p-4">
                      <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Action Items</h5>
                      <ul className="space-y-1">
                        {comparison.actionItems.map((a, i) => (
                          <li key={i} className="text-amber-400 text-sm">→ {a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
