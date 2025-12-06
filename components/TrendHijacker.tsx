import React, { useState } from 'react';
import { 
  analyzeTrend, 
  TrendAnalysis, 
  MOMENTS_CATEGORIES, 
  getBridgeStrengthLabel,
  getProductionEffortInfo,
  ContentBrief
} from '../services/trendService';
import { useCampaign } from '../context';
import { toast } from 'sonner';

interface Props {
  onPopulateBrief?: (analysis: TrendAnalysis) => void;
  onGenerateCampaign?: () => void;
}

const PILLAR_STYLES = {
  PFF: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Primal Flow Fusion', icon: '💪', gradient: 'from-amber-500/20 to-amber-600/5' },
  TAS: { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', label: 'The Animator Shift', icon: '🧘', gradient: 'from-violet-500/20 to-violet-600/5' },
  Moments: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Moments', icon: '⚡', gradient: 'from-emerald-500/20 to-emerald-600/5' }
};

const LIFESPAN_LABELS = {
  flash: { label: 'Flash Trend', color: 'text-rose-400', icon: '⚡', desc: '24-72 hours' },
  wave: { label: 'Wave', color: 'text-blue-400', icon: '🌊', desc: '1-4 weeks' },
  cultural_shift: { label: 'Cultural Shift', color: 'text-gold-400', icon: '🌍', desc: 'Months+' }
};

const URGENCY_STYLES = {
  immediate: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: '🔥 Act Now', border: 'border-rose-500/30' },
  this_week: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '📅 This Week', border: 'border-amber-500/30' },
  evergreen: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '🌲 Evergreen', border: 'border-emerald-500/30' }
};

const FORMAT_ICONS: Record<string, string> = {
  meme: '🖼️',
  video: '🎬',
  carousel: '📱',
  ugc: '🎤'
};

// Phone Mockup Component
const PhoneMockup: React.FC<{ platform: string; children: React.ReactNode }> = ({ platform, children }) => {
  const platformColors: Record<string, string> = {
    TikTok: 'from-pink-500 to-cyan-400',
    Instagram: 'from-purple-500 via-pink-500 to-orange-400',
    YouTube: 'from-red-600 to-red-500',
    Twitter: 'from-blue-400 to-blue-500',
    LinkedIn: 'from-blue-600 to-blue-700'
  };
  
  return (
    <div className="relative mx-auto" style={{ width: '140px' }}>
      {/* Phone Frame */}
      <div className="relative bg-void-950 rounded-[20px] p-1.5 border-2 border-slate-700 shadow-xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-void-950 rounded-b-xl z-10" />
        
        {/* Screen */}
        <div className="relative bg-void-900 rounded-[14px] overflow-hidden" style={{ height: '260px' }}>
          {/* Status Bar */}
          <div className={`h-6 bg-gradient-to-r ${platformColors[platform] || 'from-gold-500 to-gold-600'} flex items-center justify-center`}>
            <span className="text-[8px] font-bold text-white">{platform}</span>
          </div>
          
          {/* Content */}
          <div className="p-2 h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Content Preview inside phone
const ContentPreview: React.FC<{ brief: ContentBrief }> = ({ brief }) => {
  return (
    <div className="h-full flex flex-col text-[9px]">
      <div className="flex-1 bg-void-800/50 rounded-lg p-2 mb-1">
        <p className="text-gold-400 font-bold leading-tight mb-1">"{brief.hook.slice(0, 60)}..."</p>
        <p className="text-slate-500 leading-tight">{brief.concept.slice(0, 50)}...</p>
      </div>
      <div className="flex flex-wrap gap-0.5">
        {brief.hashtags.slice(0, 3).map((tag, i) => (
          <span key={i} className="text-blue-400">{tag.slice(0, 10)}</span>
        ))}
      </div>
    </div>
  );
};

// Bridge Strength Gauge
const BridgeStrengthGauge: React.FC<{ score: number; rationale: string }> = ({ score, rationale }) => {
  const { label, color } = getBridgeStrengthLabel(score);
  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees
  
  return (
    <div className="bg-void-800/50 rounded-xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Bridge Strength</span>
        <span className={`text-lg font-bold ${color}`}>{score}/100</span>
      </div>
      
      {/* Gauge */}
      <div className="relative h-16 mb-3">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#1e1e2e"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Colored segments */}
          <path d="M 10 50 A 40 40 0 0 1 30 15" fill="none" stroke="#f43f5e" strokeWidth="8" strokeLinecap="round" />
          <path d="M 30 15 A 40 40 0 0 1 50 10" fill="none" stroke="#f97316" strokeWidth="8" strokeLinecap="round" />
          <path d="M 50 10 A 40 40 0 0 1 70 15" fill="none" stroke="#eab308" strokeWidth="8" strokeLinecap="round" />
          <path d="M 70 15 A 40 40 0 0 1 90 50" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
          
          {/* Needle */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="20"
            stroke="#f5c542"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${rotation}, 50, 50)`}
          />
          <circle cx="50" cy="50" r="4" fill="#f5c542" />
        </svg>
      </div>
      
      <div className="text-center">
        <span className={`font-bold ${color}`}>{label}</span>
      </div>
      <p className="text-slate-500 text-xs mt-2 text-center">{rationale}</p>
    </div>
  );
};

// LocalStorage keys for persistence
const STORAGE_KEYS = {
  currentAnalysis: 'oracle_trend_current',
  savedAnalyses: 'oracle_trend_saved',
  lastTrendInput: 'oracle_trend_input'
};

// Persistence helpers
const saveToPersistence = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
};

const loadFromPersistence = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
    return fallback;
  }
};

export const TrendHijacker: React.FC<Props> = ({ onPopulateBrief, onGenerateCampaign }) => {
  const { setBrief } = useCampaign();
  
  // Initialize state from localStorage
  const [trendInput, setTrendInput] = useState(() => 
    loadFromPersistence(STORAGE_KEYS.lastTrendInput, '')
  );
  const [context, setContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(() => 
    loadFromPersistence(STORAGE_KEYS.currentAnalysis, null)
  );
  const [selectedBrief, setSelectedBrief] = useState<number | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<TrendAnalysis[]>(() => 
    loadFromPersistence(STORAGE_KEYS.savedAnalyses, [])
  );

  // Persist analysis when it changes
  React.useEffect(() => {
    if (analysis) {
      saveToPersistence(STORAGE_KEYS.currentAnalysis, analysis);
    }
  }, [analysis]);

  // Persist saved analyses when they change
  React.useEffect(() => {
    saveToPersistence(STORAGE_KEYS.savedAnalyses, savedAnalyses);
  }, [savedAnalyses]);

  // Persist trend input
  React.useEffect(() => {
    saveToPersistence(STORAGE_KEYS.lastTrendInput, trendInput);
  }, [trendInput]);

  const handleAnalyze = async () => {
    if (!trendInput.trim()) {
      toast.error('Enter a trend to analyze');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    
    try {
      const result = await analyzeTrend(trendInput, context);
      setAnalysis(result);
      toast.success('Trend decoded');
    } catch (error: any) {
      toast.error(error.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyHook = () => {
    if (analysis?.bridgeStrategy.hook) {
      navigator.clipboard.writeText(analysis.bridgeStrategy.hook);
      toast.success('Hook copied to clipboard');
    }
  };

  const handleSaveAnalysis = () => {
    if (analysis) {
      // Check if already saved (by trend name and timestamp)
      const isDuplicate = savedAnalyses.some(
        a => a.trend === analysis.trend && a.analyzedAt === analysis.analyzedAt
      );
      if (isDuplicate) {
        toast.info('Analysis already saved');
        return;
      }
      setSavedAnalyses(prev => [analysis, ...prev].slice(0, 20)); // Keep last 20
      toast.success('Analysis saved to memory');
    }
  };

  const handleLoadSavedAnalysis = (saved: TrendAnalysis) => {
    setAnalysis(saved);
    setTrendInput(saved.trend);
    toast.success(`Loaded: "${saved.trend}"`);
  };

  const handleClearAnalysis = () => {
    setAnalysis(null);
    localStorage.removeItem(STORAGE_KEYS.currentAnalysis);
    toast.success('Analysis cleared');
  };

  const handleDeleteSavedAnalysis = (index: number) => {
    setSavedAnalyses(prev => prev.filter((_, i) => i !== index));
    toast.success('Removed from saved');
  };

  const handlePopulateBrief = (briefIndex: number) => {
    if (!analysis) return;
    
    const contentBrief = analysis.contentBriefs[briefIndex];
    const pillar = analysis.pillarRouting.primary;
    
    const pillarMap: Record<string, string> = {
      'PFF': 'primal_flow_fusion',
      'TAS': 'animator_shift',
      'Moments': 'moments'
    };

    const pillarsArray = [pillarMap[pillar]];
    if (analysis.pillarRouting.secondary) pillarsArray.push(pillarMap[analysis.pillarRouting.secondary]);
    if (analysis.pillarRouting.tertiary) pillarsArray.push(pillarMap[analysis.pillarRouting.tertiary]);

    // Build audience archetypes from trend context
    const audienceFromTrend = analysis.trendContext.audienceDemo
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    setBrief(prev => ({
      ...prev,
      meta: {
        ...prev.meta,
        campaign_name: `Trend Hijack: ${analysis.trend}`,
        primary_theme: analysis.bridgeStrategy.angle,
        pillars: pillarsArray,
        purpose: `Intercept the "${analysis.trend}" trend and bridge it to EcoGym's ${pillar} pillar through ${analysis.bridgeStrategy.angle}`
      },
      audience: {
        ...prev.audience,
        archetypes: audienceFromTrend.length > 0 ? audienceFromTrend : prev.audience.archetypes,
        hidden_truth: `They're drawn to "${analysis.trend}" because: ${analysis.trendContext.emotionalCore}`,
        fears: ['Missing out on the trend', 'Not being authentic', 'Wasting time on fads'],
        secret_desires: ['Quick transformation', 'Social validation', 'Deeper meaning in daily habits']
      },
      creative: {
        ...prev.creative,
        raw_brain_dump: `TREND: ${analysis.trend}

BRIDGE ANGLE: ${analysis.bridgeStrategy.angle}

HOOK: ${analysis.bridgeStrategy.hook}

SUBVERSION: ${analysis.bridgeStrategy.subversion || 'N/A'}

CONCEPT: ${contentBrief.concept}

PILLAR ANGLES:
- PFF: ${analysis.pillarRouting.pffAngle || 'N/A'}
- TAS: ${analysis.pillarRouting.tasAngle || 'N/A'}
- Moments: ${analysis.pillarRouting.momentsAngle || 'N/A'}

HASHTAGS: ${contentBrief.hashtags.join(' ')}`,
        must_include_phrases: [analysis.bridgeStrategy.hook, ...contentBrief.hashtags.slice(0, 3)],
        must_avoid_phrases: ['gym bro', 'no pain no gain', 'hustle culture'],
        voice_reference: 'Brutally honest but loving best friend who\'s also a mystic',
        cta_flavor: 'curiosity_based',
        emotional_frequency: {
          humor: 7,
          relatability: 9,
          shock: 5,
          inspiration: 8,
          identity_shift: 8
        }
      },
      visual: {
        ...prev.visual,
        style_tags: ['meme_chaos', 'clean_fitness_ad', 'cosmic_identity_shift'],
        palette: 'ecogym_primal'
      },
      outputs: {
        ...prev.outputs,
        formats: {
          memes: contentBrief.format === 'meme' || true, // Always include memes
          static_banners: true, // Always include banners
          short_vertical_videos: contentBrief.format === 'video' || true,
          carousels: contentBrief.format === 'carousel',
          ugc_scripts: contentBrief.format === 'ugc' || true
        },
        platforms: contentBrief.platforms.length > 0 ? contentBrief.platforms : ['TikTok', 'Instagram'],
        quantities: {
          memes: 2,
          static_banners: 1,
          short_vertical_videos: 1,
          ugc_scripts: 1,
          carousels: contentBrief.format === 'carousel' ? 1 : 0
        }
      },
      constraints: {
        ...prev.constraints,
        humor_edge_level: 'medium_spicy',
        spirituality_flavor: 'grounded_cosmic',
        body_sensitivity: 'no_body_shaming'
      }
    }));

    toast.success('Brief populated from trend analysis');
    if (onPopulateBrief) onPopulateBrief(analysis);
  };

  const handleGenerateFullCampaign = (briefIndex: number) => {
    handlePopulateBrief(briefIndex);
    setTimeout(() => {
      if (onGenerateCampaign) onGenerateCampaign();
    }, 100);
  };

  const quickTrends = [
    'Brown noise sleep',
    '5am club',
    'Touch grass',
    'Main character energy',
    'Roman Empire thoughts',
    'Very demure very mindful',
    'Seasonal depression',
    'Soft life era',
    'That girl aesthetic',
    'Hot girl walk',
    'Bed rotting',
    'Girl dinner'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gold-400 flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            Trend Hijacker
          </h2>
          <p className="text-slate-500 text-sm mt-1">Decode viral moments. Bridge to your pillars.</p>
        </div>
        <div className="flex items-center gap-3">
          {analysis && (
            <button
              onClick={handleClearAnalysis}
              className="px-3 py-1.5 text-xs font-medium bg-void-700/50 text-slate-400 rounded-lg hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            >
              ✕ Clear
            </button>
          )}
          {savedAnalyses.length > 0 && (
            <div className="relative group">
              <button className="px-3 py-1.5 text-xs font-medium bg-void-700/50 text-gold-400 rounded-lg hover:bg-void-600/50 transition-all flex items-center gap-2">
                💾 Saved ({savedAnalyses.length})
                <span className="text-slate-600">▾</span>
              </button>
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-void-800 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-80 overflow-y-auto">
                {savedAnalyses.map((saved, idx) => (
                  <div 
                    key={`${saved.trend}-${saved.analyzedAt}`}
                    className="flex items-center justify-between p-3 hover:bg-void-700/50 border-b border-white/5 last:border-0"
                  >
                    <button
                      onClick={() => handleLoadSavedAnalysis(saved)}
                      className="flex-1 text-left"
                    >
                      <span className="text-slate-200 text-sm font-medium block">{saved.trend}</span>
                      <span className="text-slate-600 text-xs">
                        {new Date(saved.analyzedAt).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSavedAnalysis(idx);
                      }}
                      className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-void-800/50 rounded-2xl border border-white/5 p-6 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-2">
            Trend / Viral Moment
          </label>
          <input
            type="text"
            value={trendInput}
            onChange={(e) => setTrendInput(e.target.value)}
            placeholder="e.g. 'Brown noise', 'Very demure', 'Brat summer'..."
            className="w-full bg-void-900/80 border border-white/10 rounded-xl p-4 text-lg text-slate-200 placeholder-slate-600 focus:border-gold-500/50 transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
        </div>

        {/* Quick Trends */}
        <div className="flex flex-wrap gap-2">
          {quickTrends.map(trend => (
            <button
              key={trend}
              onClick={() => setTrendInput(trend)}
              className="px-3 py-1.5 text-xs font-medium bg-void-700/50 text-slate-400 rounded-lg border border-white/5 hover:border-gold-500/30 hover:text-gold-400 transition-all"
            >
              {trend}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            Additional Context <span className="text-slate-700">(optional)</span>
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Any specific angle or audience you want to target..."
            className="w-full bg-void-900/80 border border-white/10 rounded-xl p-3 text-slate-300 h-20 resize-none focus:border-gold-500/50 transition-all"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !trendInput.trim()}
          className={`
            w-full py-4 rounded-xl font-bold text-lg transition-all
            ${isAnalyzing 
              ? 'bg-void-700 text-slate-500 cursor-wait' 
              : 'bg-gradient-to-r from-gold-600 to-gold-500 text-void-950 hover:shadow-lg hover:shadow-gold-500/20'
            }
          `}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">◈</span> Decoding Trend...
            </span>
          ) : (
            '🎯 Analyze & Bridge'
          )}
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Row: Context + Bridge Strength */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Context Card */}
            <div className="lg:col-span-2 bg-void-800/50 rounded-2xl border border-white/5 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-200">"{analysis.trend}"</h3>
                  <p className="text-slate-500 text-sm">{analysis.trendContext.origin}</p>
                </div>
                <div className="flex gap-2">
                  <div className={`px-3 py-1 rounded-lg ${LIFESPAN_LABELS[analysis.trendContext.lifespan].color} bg-white/5 text-sm font-medium`}>
                    {LIFESPAN_LABELS[analysis.trendContext.lifespan].icon} {LIFESPAN_LABELS[analysis.trendContext.lifespan].label}
                  </div>
                  <button
                    onClick={handleSaveAnalysis}
                    className="px-3 py-1 rounded-lg bg-void-700 text-slate-400 hover:text-gold-400 text-sm transition-all"
                    title="Save to memory"
                  >
                    💾
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 block text-xs uppercase tracking-wide">Platforms</span>
                  <span className="text-slate-300">{analysis.trendContext.peakPlatforms.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-xs uppercase tracking-wide">Audience</span>
                  <span className="text-slate-300">{analysis.trendContext.audienceDemo}</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-xs uppercase tracking-wide">Emotional Core</span>
                  <span className="text-slate-300">{analysis.trendContext.emotionalCore}</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-xs uppercase tracking-wide">Timing</span>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${URGENCY_STYLES[analysis.timing.urgency].bg} ${URGENCY_STYLES[analysis.timing.urgency].text} text-xs font-medium`}>
                    {URGENCY_STYLES[analysis.timing.urgency].label}
                  </div>
                </div>
              </div>
            </div>

            {/* Bridge Strength Gauge */}
            <BridgeStrengthGauge 
              score={analysis.bridgeStrategy.bridgeStrength} 
              rationale={analysis.bridgeStrategy.bridgeRationale}
            />
          </div>

          {/* Pillar Routing - All 3 Angles */}
          <div className="bg-void-800/50 rounded-2xl border border-white/5 p-6">
            <h4 className="text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-4">Pillar Routing</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {(['PFF', 'TAS', 'Moments'] as const).map((pillar) => {
                const isPrimary = analysis.pillarRouting.primary === pillar;
                const isSecondary = analysis.pillarRouting.secondary === pillar;
                const isTertiary = analysis.pillarRouting.tertiary === pillar;
                const isActive = isPrimary || isSecondary || isTertiary;
                const angleKey = pillar === 'PFF' ? 'pffAngle' : pillar === 'TAS' ? 'tasAngle' : 'momentsAngle';
                const angle = analysis.pillarRouting[angleKey];
                
                return (
                  <div 
                    key={pillar}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive 
                        ? `bg-gradient-to-br ${PILLAR_STYLES[pillar].gradient} ${PILLAR_STYLES[pillar].border}` 
                        : 'bg-void-900/30 border-white/5 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-lg font-bold ${isActive ? PILLAR_STYLES[pillar].color : 'text-slate-600'} flex items-center gap-2`}>
                        {PILLAR_STYLES[pillar].icon} {pillar}
                      </span>
                      {isPrimary && <span className="text-[10px] bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full">Primary</span>}
                      {isSecondary && <span className="text-[10px] bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">Secondary</span>}
                      {isTertiary && <span className="text-[10px] bg-white/5 text-slate-500 px-2 py-0.5 rounded-full">Tertiary</span>}
                    </div>
                    {angle && (
                      <p className="text-slate-400 text-sm">{angle}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-slate-400 text-sm">{analysis.pillarRouting.reasoning}</p>

            {/* Moments Category */}
            {analysis.momentsCategory && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-xs text-emerald-400/70 uppercase tracking-wide">Moments Category</span>
                <div className="text-emerald-400 font-bold flex items-center gap-2 mt-1">
                  {MOMENTS_CATEGORIES[analysis.momentsCategory.category]?.icon || '⚡'} 
                  {analysis.momentsCategory.category.replace(/_/g, ' ')}
                </div>
                <p className="text-slate-500 text-sm mt-1">{analysis.momentsCategory.rationale}</p>
              </div>
            )}
          </div>

          {/* Bridge Strategy with Copy Hook */}
          <div className="bg-void-800/50 rounded-2xl border border-white/5 p-6">
            <h4 className="text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-4">Bridge Strategy</h4>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-600 uppercase tracking-wide">Entry Angle</span>
                <p className="text-slate-200 text-lg">{analysis.bridgeStrategy.angle}</p>
              </div>
              
              {/* Hook with Copy Button */}
              <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 relative group">
                <span className="text-xs text-gold-400/70 uppercase tracking-wide">Hook</span>
                <p className="text-gold-400 text-xl font-bold pr-12">"{analysis.bridgeStrategy.hook}"</p>
                <button
                  onClick={handleCopyHook}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-gold-500/20 text-gold-400 opacity-0 group-hover:opacity-100 hover:bg-gold-500/30 transition-all"
                  title="Copy hook"
                >
                  📋
                </button>
              </div>
              
              {analysis.bridgeStrategy.subversion && (
                <div>
                  <span className="text-xs text-violet-400/70 uppercase tracking-wide">Subversion Twist</span>
                  <p className="text-violet-300">{analysis.bridgeStrategy.subversion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Platform Timing */}
          {analysis.timing.bestPostTimes && analysis.timing.bestPostTimes.length > 0 && (
            <div className="bg-void-800/50 rounded-2xl border border-white/5 p-6">
              <h4 className="text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-4">Best Post Times</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {analysis.timing.bestPostTimes.map((timing, idx) => (
                  <div key={idx} className="bg-void-900/50 rounded-xl p-3 border border-white/5">
                    <span className="text-xs text-slate-500 uppercase">{timing.platform}</span>
                    <div className="text-slate-300 text-sm mt-1">{timing.days.join(', ')}</div>
                    <div className="text-gold-400 text-xs mt-0.5">{timing.times.join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Briefs with Phone Mockups */}
          <div className="bg-void-800/50 rounded-2xl border border-white/5 p-6">
            <h4 className="text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-4">Content Briefs</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analysis.contentBriefs.map((brief, idx) => {
                const effortInfo = getProductionEffortInfo(brief.productionEffort);
                const isSelected = selectedBrief === idx;
                
                return (
                  <div 
                    key={idx}
                    className={`rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-gold-500/10 border-gold-500/40' 
                        : 'bg-void-900/50 border-white/5 hover:border-gold-500/20'
                    }`}
                  >
                    <div className="p-4">
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{FORMAT_ICONS[brief.format]}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/5 text-slate-400 uppercase">
                            {brief.format}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${effortInfo.color}`} title={effortInfo.time}>
                            {effortInfo.icon} {effortInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Content + Phone Preview */}
                      <div className="flex gap-4">
                        {/* Details */}
                        <div className="flex-1">
                          <p className="text-slate-200 font-medium mb-2">{brief.concept}</p>
                          <p className="text-slate-500 text-sm mb-2">
                            <span className="text-gold-400/70">Hook:</span> "{brief.hook}"
                          </p>
                          <p className="text-slate-600 text-xs mb-3">
                            <span className="text-slate-500">CTA:</span> {brief.cta}
                          </p>
                          
                          {/* Hashtags */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {brief.hashtags.map((tag, i) => (
                              <span 
                                key={i} 
                                className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-500/20 transition-all"
                                onClick={() => {
                                  navigator.clipboard.writeText(tag);
                                  toast.success(`Copied ${tag}`);
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Platforms + Reach */}
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{brief.platforms.join(', ')}</span>
                            <span className="text-slate-700">•</span>
                            <span className={
                              brief.estimatedReach === 'viral' ? 'text-emerald-400' :
                              brief.estimatedReach === 'moderate' ? 'text-amber-400' : 'text-slate-500'
                            }>
                              {brief.estimatedReach} reach
                            </span>
                          </div>
                        </div>

                        {/* Phone Mockup */}
                        <div className="hidden md:block">
                          <PhoneMockup platform={brief.platforms[0] || 'TikTok'}>
                            <ContentPreview brief={brief} />
                          </PhoneMockup>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                        <button
                          onClick={() => handlePopulateBrief(idx)}
                          className="flex-1 px-3 py-2 text-sm font-medium bg-void-700/50 text-slate-300 rounded-lg hover:bg-void-600/50 transition-all"
                        >
                          📝 Use Brief
                        </button>
                        <button
                          onClick={() => handleGenerateFullCampaign(idx)}
                          className="flex-1 px-3 py-2 text-sm font-medium bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition-all"
                        >
                          🚀 Generate Campaign
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Related Trends */}
          {analysis.relatedTrends && analysis.relatedTrends.length > 0 && (
            <div className="bg-void-800/50 rounded-2xl border border-white/5 p-6">
              <h4 className="text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-4">Related Trends</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {analysis.relatedTrends.map((related, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTrendInput(related.trend)}
                    className="p-3 rounded-xl bg-void-900/50 border border-white/5 hover:border-gold-500/30 transition-all text-left group"
                  >
                    <span className="text-slate-300 font-medium group-hover:text-gold-400 transition-colors block">
                      {related.trend}
                    </span>
                    <span className="text-slate-600 text-xs">{related.synergy}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {analysis.risks.length > 0 && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
              <h4 className="text-xs font-bold text-rose-400/70 uppercase tracking-widest mb-2">⚠️ Risks to Watch</h4>
              <ul className="text-rose-300/80 text-sm space-y-1">
                {analysis.risks.map((risk, idx) => (
                  <li key={idx}>• {risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendHijacker;