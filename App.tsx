import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { BriefForm } from './components/BriefForm';
import { BlueprintView } from './components/BlueprintView';
import { WarRoomDashboard } from './components/WarRoomDashboard';
import { AssetLibrary } from './components/AssetLibrary';
import { TemplateManager } from './components/TemplateManager';
import { BrandVoiceTrainer } from './components/BrandVoiceTrainer';
// Tier 3 & 4 Components
import { ProactiveWhispers } from './components/ProactiveWhispers';
import { CompetitorScanner } from './components/CompetitorScanner';
import { VoiceNarrationControls, VoiceNarrationMini } from './components/VoiceNarrationControls';
import { PublishingHub } from './components/PublishingHub';
import { FeedbackDashboard } from './components/FeedbackDashboard';
import { generateCampaignBlueprint } from './services/geminiService';
import { analyzeHealthScore, HealthScoreResult } from './services/healthScore';
import { oracleStorage, StoredCampaign, BrandVoice } from './services/storageService';
import { CampaignProvider, useCampaign } from './context';
import { CampaignBrief } from './types';
import { DEFAULT_BRIEF } from './constants';

type ViewMode = 'dashboard' | 'brief' | 'blueprint' | 'library' | 'templates' | 'voice' | 'compete' | 'publish' | 'feedback';

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
    <path 
      d="M60 5 C25 5 5 30 5 30 C5 30 25 55 60 55 C95 55 115 30 115 30 C115 30 95 5 60 5Z" 
      stroke="url(#eyeGradient)" 
      strokeWidth="2" 
      fill="none"
      className="animate-pulse"
    />
    <circle cx="60" cy="30" r="18" fill="url(#irisGradient)" />
    <circle cx="60" cy="30" r="8" fill="#04040a" />
    <circle cx="54" cy="24" r="3" fill="rgba(255,255,255,0.6)" />
  </svg>
);

const NAV_ITEMS: { id: ViewMode; label: string; icon: string; section?: string }[] = [
  { id: 'dashboard', label: 'War Room', icon: '⚔', section: 'core' },
  { id: 'brief', label: 'Brief', icon: '📝', section: 'core' },
  { id: 'blueprint', label: 'Blueprint', icon: '📋', section: 'core' },
  { id: 'library', label: 'Library', icon: '🖼️', section: 'assets' },
  { id: 'templates', label: 'Templates', icon: '📐', section: 'assets' },
  { id: 'voice', label: 'Voice', icon: '🎤', section: 'assets' },
  { id: 'compete', label: 'Compete', icon: '🔍', section: 'intel' },
  { id: 'publish', label: 'Publish', icon: '📤', section: 'scale' },
  { id: 'feedback', label: 'Feedback', icon: '📊', section: 'scale' },
];

const MainLayout: React.FC = () => {
  const { blueprint, brief, setBrief, setBlueprint, isGeneratingBlueprint, setIsGeneratingBlueprint } = useCampaign();
  const [view, setView] = useState<ViewMode>('dashboard');
  const [healthScore, setHealthScore] = useState<HealthScoreResult | null>(null);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<BrandVoice | null>(null);

  // Initialize storage on mount
  useEffect(() => {
    oracleStorage.init();
  }, []);

  // Calculate health score when blueprint changes
  useEffect(() => {
    if (blueprint && brief) {
      const score = analyzeHealthScore(brief, blueprint);
      setHealthScore(score);
    } else {
      setHealthScore(null);
    }
  }, [blueprint, brief]);

  const handleGenerate = async () => {
    setIsGeneratingBlueprint(true);
    setView('blueprint');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const loadingToast = toast.loading('The Oracle is seeing...', {
      description: 'Channeling the 30,000 ft view'
    });
    
    try {
      const result = await generateCampaignBlueprint(brief);
      setBlueprint(result);
      
      // Calculate health score
      const score = analyzeHealthScore(brief, result);
      setHealthScore(score);
      
      // Save campaign to storage
      const campaignId = `campaign_${Date.now()}`;
      const campaign: StoredCampaign = {
        id: campaignId,
        name: brief.meta.campaign_name,
        brief: brief,
        blueprint: result,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        healthScore: score.overall,
        tags: brief.meta.pillars
      };
      await oracleStorage.saveCampaign(campaign);
      setCurrentCampaignId(campaignId);
      
      toast.success('Vision Manifested', { 
        id: loadingToast,
        description: `Health Score: ${score.overall}/100`
      });
    } catch (error: any) {
      console.error("Error generating blueprint:", error);
      toast.error('Vision Obscured', { 
        id: loadingToast,
        description: error.message || 'The Oracle could not see clearly.'
      });
    } finally {
      setIsGeneratingBlueprint(false);
    }
  };

  const handleLoadCampaign = (campaign: StoredCampaign) => {
    setBrief(campaign.brief);
    setBlueprint(campaign.blueprint);
    setCurrentCampaignId(campaign.id);
    if (campaign.healthScore) {
      const score = analyzeHealthScore(campaign.brief, campaign.blueprint);
      setHealthScore(score);
    }
    setView('blueprint');
    toast.success(`Loaded: ${campaign.name}`);
  };

  const handleLoadTemplate = (templateBrief: CampaignBrief) => {
    setBrief(templateBrief);
    setBlueprint(null);
    setHealthScore(null);
    setCurrentCampaignId(null);
    setView('brief');
  };

  const handleNewCampaign = () => {
    setBrief(DEFAULT_BRIEF);
    setBlueprint(null);
    setHealthScore(null);
    setCurrentCampaignId(null);
    setView('brief');
  };

  const handleVoiceSelect = (voice: BrandVoice) => {
    setSelectedVoice(voice);
    toast.success(`Voice activated: ${voice.name}`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-void-900/80 border-r border-white/5 flex flex-col fixed h-full z-40">
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <OracleEye className="w-10 h-5 opacity-80" />
            <span className="hidden lg:block font-display text-xl font-bold oracle-gradient">
              The Oracle
            </span>
          </div>
        </div>

        {/* Nav Items with Sections */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {/* Core Section */}
          <div className="px-4 lg:px-6 mb-2">
            <span className="text-[9px] text-slate-700 uppercase tracking-widest hidden lg:block">Core</span>
          </div>
          {NAV_ITEMS.filter(i => i.section === 'core').map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              disabled={item.id === 'blueprint' && !blueprint}
              className={`
                w-full flex items-center gap-3 px-4 lg:px-6 py-3 transition-all
                ${view === item.id 
                  ? 'bg-gold-500/10 text-gold-400 border-r-2 border-gold-500' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                ${item.id === 'blueprint' && !blueprint ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="hidden lg:block text-sm font-medium">{item.label}</span>
            </button>
          ))}

          {/* Assets Section */}
          <div className="px-4 lg:px-6 mb-2 mt-6">
            <span className="text-[9px] text-slate-700 uppercase tracking-widest hidden lg:block">Assets</span>
          </div>
          {NAV_ITEMS.filter(i => i.section === 'assets').map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 lg:px-6 py-3 transition-all
                ${view === item.id 
                  ? 'bg-gold-500/10 text-gold-400 border-r-2 border-gold-500' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="hidden lg:block text-sm font-medium">{item.label}</span>
            </button>
          ))}

          {/* Intel Section */}
          <div className="px-4 lg:px-6 mb-2 mt-6">
            <span className="text-[9px] text-slate-700 uppercase tracking-widest hidden lg:block">Intel</span>
          </div>
          {NAV_ITEMS.filter(i => i.section === 'intel').map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 lg:px-6 py-3 transition-all
                ${view === item.id 
                  ? 'bg-gold-500/10 text-gold-400 border-r-2 border-gold-500' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="hidden lg:block text-sm font-medium">{item.label}</span>
            </button>
          ))}

          {/* Scale Section */}
          <div className="px-4 lg:px-6 mb-2 mt-6">
            <span className="text-[9px] text-slate-700 uppercase tracking-widest hidden lg:block">Scale</span>
          </div>
          {NAV_ITEMS.filter(i => i.section === 'scale').map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 lg:px-6 py-3 transition-all
                ${view === item.id 
                  ? 'bg-gold-500/10 text-gold-400 border-r-2 border-gold-500' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="hidden lg:block text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Voice indicator */}
        {selectedVoice && (
          <div className="p-4 border-t border-white/5">
            <div className="bg-void-800/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Active Voice</p>
              <p className="text-sm text-gold-400 font-medium truncate">{selectedVoice.name}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <p className="text-[10px] text-slate-700 text-center hidden lg:block">
            Powered by Yonathan
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64">
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Header - only show on non-dashboard views */}
          {view !== 'dashboard' && (
            <header className="mb-10 text-center relative">
              <div className="flex items-center justify-center gap-2 mb-3">
                <OracleEye className="w-12 h-6 opacity-60" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
                <span className="oracle-gradient">The Oracle</span>
              </h1>
              <p className="text-slate-500 text-sm uppercase tracking-[0.2em]">
                {view === 'brief' && 'Campaign Brief'}
                {view === 'blueprint' && 'Vision Manifest'}
                {view === 'library' && 'Asset Library'}
                {view === 'templates' && 'Templates'}
                {view === 'voice' && 'Brand Voice'}
                {view === 'compete' && 'Competitor Intel'}
                {view === 'publish' && 'Publishing Hub'}
                {view === 'feedback' && 'Performance Loop'}
              </p>
            </header>
          )}

          {/* View Router */}
          {view === 'dashboard' && (
            <WarRoomDashboard 
              onSelectCampaign={handleLoadCampaign}
              onNewCampaign={handleNewCampaign}
              currentHealthScore={healthScore}
            />
          )}

          {view === 'brief' && (
            <BriefForm onGenerate={handleGenerate} />
          )}

          {view === 'blueprint' && blueprint && (
            <>
              {/* Health Score Bar with Voice Narration */}
              {healthScore && (
                <div className="glass-panel rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className={`text-4xl font-bold ${
                        healthScore.overall >= 80 ? 'text-emerald-400' : 
                        healthScore.overall >= 60 ? 'text-gold-400' : 'text-rose-400'
                      }`}>
                        {healthScore.overall}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Health Score</p>
                    </div>
                    <div className="h-12 w-px bg-white/10"></div>
                    <div className="flex flex-wrap gap-2">
                      {healthScore.insights.slice(0, 2).map((insight, i) => (
                        <span key={i} className={`text-xs px-3 py-1.5 rounded-lg border ${
                          insight.type === 'strength' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}>
                          {insight.message}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Voice Narration Mini */}
                    <VoiceNarrationMini blueprint={blueprint} />
                    <button
                      onClick={() => setView('brief')}
                      className="px-6 py-2 bg-void-800 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-gold-400 hover:border-gold-500/30 transition-all"
                    >
                      ← Edit Brief
                    </button>
                  </div>
                </div>
              )}
              
              {/* Voice Narration Full Controls */}
              <div className="mb-8">
                <VoiceNarrationControls blueprint={blueprint} />
              </div>
              
              <BlueprintView />
            </>
          )}

          {view === 'library' && (
            <AssetLibrary />
          )}

          {view === 'templates' && (
            <TemplateManager 
              currentBrief={brief}
              onLoadTemplate={handleLoadTemplate}
            />
          )}

          {view === 'voice' && (
            <BrandVoiceTrainer 
              onVoiceSelect={handleVoiceSelect}
              selectedVoiceId={selectedVoice?.id}
            />
          )}

          {view === 'compete' && (
            <CompetitorScanner currentBrief={brief} />
          )}

          {view === 'publish' && (
            <PublishingHub />
          )}

          {view === 'feedback' && (
            <FeedbackDashboard />
          )}

          {/* Footer */}
          <footer className="mt-20 pb-8 text-center">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent mx-auto mb-6"></div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-700">
              The Oracle · Est. 2024 · All seeing
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <CampaignProvider>
      <div className="min-h-screen relative font-sans text-slate-300 overflow-x-hidden situation-grid">
        <Toaster 
          position="bottom-right" 
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(15, 15, 26, 0.95)',
              border: '1px solid rgba(212, 160, 19, 0.2)',
              color: '#e2e8f0',
            },
          }}
        />
        
        {/* Background Ambience */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full opacity-30"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(212, 160, 19, 0.15) 0%, rgba(212, 160, 19, 0.05) 30%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          ></div>
          <div className="absolute bottom-[-20%] right-[-15%] w-[50%] h-[50%] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.2) 0%, transparent 60%)',
              filter: 'blur(100px)',
            }}
          ></div>
          <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[40%] h-[30%] rounded-full opacity-10"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.3) 0%, transparent 60%)',
              filter: 'blur(60px)',
            }}
          ></div>
          <div className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 0%, rgba(4, 4, 10, 0.4) 70%, rgba(4, 4, 10, 0.8) 100%)',
            }}
          ></div>
        </div>

        <MainLayout />
      </div>
    </CampaignProvider>
  );
}

export default App;
