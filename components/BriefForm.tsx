import React, { useState } from 'react';
import { CampaignMeta, Audience, CreativeInputs, VisualInputs, Constraints, OutputsConfig } from '../types';
import { useCampaign } from '../context';

interface Props {
  onGenerate: () => void;
}

const ASSET_LABELS: Record<string, string> = {
  short_vertical_videos: "Video Storyboards",
  static_banners: "Static Banners",
  ugc_scripts: "UGC Scripts",
  memes: "Memes",
  carousels: "Carousels"
};

const TAB_ICONS: Record<string, string> = {
  meta: '◈',
  audience: '◉',
  creative: '◇',
  visual: '◆'
};

export const BriefForm: React.FC<Props> = ({ onGenerate }) => {
  const { brief, setBrief, isGeneratingBlueprint } = useCampaign();
  const [activeTab, setActiveTab] = useState<'meta' | 'audience' | 'creative' | 'visual'>('meta');

  const updateMeta = (field: keyof CampaignMeta, value: any) => {
    setBrief(prev => ({ ...prev, meta: { ...prev.meta, [field]: value } }));
  };
  const updateAudience = (field: keyof Audience, value: any) => {
    setBrief(prev => ({ ...prev, audience: { ...prev.audience, [field]: value } }));
  };
  const updateCreative = (field: keyof CreativeInputs, value: any) => {
    setBrief(prev => ({ ...prev, creative: { ...prev.creative, [field]: value } }));
  };
  const updateVisual = (field: keyof VisualInputs, value: any) => {
    setBrief(prev => ({ ...prev, visual: { ...prev.visual, [field]: value } }));
  };
  const updateConstraints = (field: keyof Constraints, value: any) => {
    setBrief(prev => ({ ...prev, constraints: { ...prev.constraints, [field]: value } }));
  };
  const updateEmotionalFreq = (field: keyof CreativeInputs['emotional_frequency'], value: number) => {
    setBrief(prev => ({
      ...prev,
      creative: {
        ...prev.creative,
        emotional_frequency: {
          ...prev.creative.emotional_frequency,
          [field]: value
        }
      }
    }));
  };
  const updateOutputsFormat = (key: keyof OutputsConfig['formats'], value: boolean) => {
    setBrief(prev => ({
      ...prev,
      outputs: {
        ...prev.outputs,
        formats: { ...prev.outputs.formats, [key]: value }
      }
    }));
  };
  const updateOutputsQuantity = (key: keyof OutputsConfig['quantities'], value: number) => {
    setBrief(prev => ({
      ...prev,
      outputs: {
        ...prev.outputs,
        quantities: { ...prev.outputs.quantities, [key]: value }
      }
    }));
  };

  const handleArrayChange = (setter: Function, field: string, valueStr: string) => {
    setter(field, valueStr.split(',').map(s => s.trim()).filter(Boolean));
  };

  const togglePillar = (e: React.MouseEvent, pillar: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBrief(prev => {
      const current = prev.meta.pillars || [];
      const updated = current.includes(pillar) 
        ? current.filter(p => p !== pillar) 
        : [...current, pillar];
      return {
        ...prev,
        meta: {
          ...prev.meta,
          pillars: updated
        }
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof VisualInputs) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateVisual(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderAssetConfig = () => {
    const formatKeys = Object.keys(brief.outputs.formats) as Array<keyof OutputsConfig['formats']>;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formatKeys.map((format) => {
          const isActive = brief.outputs.formats[format];
          const label = ASSET_LABELS[format] || format.replace(/_/g, ' ');

          return (
            <div key={format} 
              className={`
                relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between
                ${isActive 
                  ? 'bg-void-800/80 border-gold-500/40 shadow-lg shadow-gold-500/10' 
                  : 'bg-void-900/50 border-white/5 opacity-60 hover:opacity-100 hover:border-white/10'
                }
              `}>
              {/* Header Toggle */}
              <div 
                className="flex items-center justify-between mb-4 cursor-pointer group/toggle select-none"
                onClick={() => updateOutputsFormat(format, !isActive)}
              >
                <span className={`font-bold text-xs uppercase tracking-wider transition-colors ${isActive ? 'text-gold-400' : 'text-slate-500'}`}>
                  {label}
                </span>
                {/* Toggle Switch */}
                <div className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 flex items-center ${isActive ? 'bg-gold-500' : 'bg-void-700 border border-white/10'}`}>
                  <div className={`w-5 h-5 bg-void-950 rounded-full shadow-md transform transition-transform duration-300 ${isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </div>
              
              {/* Quantity Controls */}
              <div className={`transition-all duration-300 origin-top overflow-hidden ${isActive ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-void-950/50 rounded-xl p-2 flex items-center gap-2 border border-white/5" onClick={(e) => e.stopPropagation()}>
                  <button 
                    type="button"
                    onClick={() => updateOutputsQuantity(format, Math.max(0, brief.outputs.quantities[format] - 1))}
                    className="w-9 h-9 flex items-center justify-center bg-void-800 rounded-lg border border-white/5 text-slate-400 hover:text-gold-400 hover:border-gold-500/30 active:scale-95 transition-all font-bold"
                  >−</button>
                  
                  <div className="flex-1 text-center">
                    <span className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Qty</span>
                    <input 
                      type="number" 
                      min="0" 
                      value={brief.outputs.quantities[format]} 
                      onChange={(e) => updateOutputsQuantity(format, parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-center text-lg font-bold text-gold-400 focus:outline-none p-0" 
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={() => updateOutputsQuantity(format, brief.outputs.quantities[format] + 1)}
                    className="w-9 h-9 flex items-center justify-center bg-void-800 rounded-lg border border-white/5 text-slate-400 hover:text-gold-400 hover:border-gold-500/30 active:scale-95 transition-all font-bold"
                  >+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-[2rem] p-6 md:p-10 max-w-5xl mx-auto animate-fade-in-up relative overflow-hidden">
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-gold-500/20 rounded-tl-[2rem] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-gold-500/20 rounded-br-[2rem] pointer-events-none"></div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-10 pb-8 border-b border-white/5">
        {['meta', 'audience', 'creative', 'visual'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab as any)}
            className={`
              relative px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2
              ${activeTab === tab
                ? 'bg-gold-500 text-void-950 shadow-lg shadow-gold-500/30'
                : 'bg-void-800/50 text-slate-500 hover:text-gold-400 hover:bg-void-700/50 border border-white/5'
              }
            `}
          >
            <span className="text-xs opacity-60">{TAB_ICONS[tab]}</span>
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-[480px]">
        {/* META TAB */}
        {activeTab === 'meta' && (
          <div className="space-y-10 animate-fade-in">
            
            {/* Campaign Identity */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campaign Name */}
              <div className="group">
                <label className="block text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-3 ml-1">
                  Campaign Name
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={brief.meta.campaign_name} 
                    onChange={(e) => updateMeta('campaign_name', e.target.value)}
                    className="w-full bg-void-900/80 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xl font-bold text-slate-200 placeholder-slate-600 focus:border-gold-500/50 transition-all"
                    placeholder="Operation Phoenix..." 
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/50">
                    ⚡
                  </div>
                </div>
              </div>

              {/* Primary Theme */}
              <div className="group">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
                  Primary Theme <span className="text-slate-700">(Optional)</span>
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={brief.meta.primary_theme} 
                    onChange={(e) => updateMeta('primary_theme', e.target.value)}
                    className="w-full bg-void-900/80 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-lg font-medium text-slate-300 placeholder-slate-600 focus:border-gold-500/50 transition-all"
                    placeholder="#NoExcusePrimal" 
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                    #
                  </div>
                </div>
              </div>
            </section>

            {/* Pillars */}
            <section>
              <label className="block text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-4 ml-1">Strategic Pillars</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['primal_flow_fusion', 'animator_shift', 'moments'].map(pillar => {
                  const isSelected = brief.meta.pillars.includes(pillar);
                  return (
                    <button key={pillar}
                      type="button"
                      onClick={(e) => togglePillar(e, pillar)}
                      className={`
                        group p-5 rounded-xl border text-left transition-all duration-300
                        ${isSelected
                          ? 'bg-gold-500/10 border-gold-500/40 shadow-lg shadow-gold-500/5'
                          : 'bg-void-900/50 border-white/5 hover:border-gold-500/20'
                        }
                      `}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-3 transition-colors ${isSelected ? 'bg-gold-500 text-void-950' : 'bg-void-700 text-slate-600'}`}>
                        {isSelected ? '✓' : '·'}
                      </div>
                      <span className={`block font-bold text-xs uppercase tracking-wide ${isSelected ? 'text-gold-400' : 'text-slate-500'}`}>
                        {pillar.replace(/_/g, ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Purpose */}
            <section className="group">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Core Purpose</label>
              <textarea 
                value={brief.meta.purpose} 
                onChange={(e) => updateMeta('purpose', e.target.value)}
                className="w-full bg-void-900/80 border border-white/10 rounded-2xl p-5 text-lg text-slate-300 leading-relaxed h-28 resize-none focus:border-gold-500/50 transition-all" 
                placeholder="Why does this campaign exist?"
              />
            </section>

            {/* Deliverables */}
            <section className="bg-void-800/30 rounded-2xl p-6 border border-white/5">
              <h4 className="text-[10px] font-bold text-gold-500/70 uppercase mb-5 tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span> 
                Asset Configuration
              </h4>
              {renderAssetConfig()}
            </section>
          </div>
        )}

        {/* AUDIENCE TAB */}
        {activeTab === 'audience' && (
          <div className="space-y-10 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-3">Archetypes (CSV)</label>
                  <textarea 
                    value={brief.audience.archetypes.join(', ')}
                    onChange={(e) => handleArrayChange(updateAudience, 'archetypes', e.target.value)}
                    className="w-full bg-void-900/80 border border-white/10 rounded-2xl p-5 text-slate-300 h-32 resize-none focus:border-gold-500/50 transition-all"
                    placeholder="busy_professional, tired_parent..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Hidden Truth</label>
                  <textarea 
                    value={brief.audience.hidden_truth} 
                    onChange={(e) => updateAudience('hidden_truth', e.target.value)}
                    className="w-full bg-void-900/80 border border-white/10 rounded-2xl p-5 text-slate-300 h-32 resize-none focus:border-gold-500/50 transition-all"
                    placeholder="What they won't say out loud..."
                  />
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-rose-400/70 uppercase tracking-widest mb-3">Main Fears</label>
                  <textarea 
                    value={brief.audience.fears.join(', ')}
                    onChange={(e) => handleArrayChange(updateAudience, 'fears', e.target.value)}
                    className="w-full bg-rose-950/20 border border-rose-500/20 rounded-2xl p-5 text-slate-300 h-32 resize-none focus:border-rose-400/50 transition-all"
                    placeholder="wasting_time, failing_again..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest mb-3">Secret Desires</label>
                  <textarea 
                    value={brief.audience.secret_desires.join(', ')}
                    onChange={(e) => handleArrayChange(updateAudience, 'secret_desires', e.target.value)}
                    className="w-full bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5 text-slate-300 h-32 resize-none focus:border-emerald-400/50 transition-all"
                    placeholder="small_wins, roasted_lovingly..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATIVE TAB */}
        {activeTab === 'creative' && (
          <div className="space-y-10 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left Col */}
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-3">Raw Brain Dump</label>
                  <textarea 
                    value={brief.creative.raw_brain_dump} 
                    onChange={(e) => updateCreative('raw_brain_dump', e.target.value)}
                    className="w-full bg-void-900/80 border border-white/10 rounded-2xl p-5 text-slate-300 h-40 resize-none focus:border-gold-500/50 transition-all"
                    placeholder="Pour your thoughts here..." 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Voice Reference</label>
                  <input 
                    type="text" 
                    value={brief.creative.voice_reference} 
                    onChange={(e) => updateCreative('voice_reference', e.target.value)}
                    className="w-full bg-void-900/80 border border-white/10 rounded-xl p-4 text-slate-300 focus:border-gold-500/50 transition-all" 
                  />
                </div>
                
                <div className="bg-void-800/30 p-5 rounded-2xl border border-white/5 space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">CTA Flavor</label>
                    <select 
                      value={brief.creative.cta_flavor} 
                      onChange={(e) => updateCreative('cta_flavor', e.target.value)}
                      className="w-full bg-void-900 border border-white/10 rounded-xl p-3 text-slate-300 font-medium focus:border-gold-500/50 cursor-pointer"
                    >
                      <option value="soft_cosmic">Soft Cosmic</option>
                      <option value="direct_push">Direct Push</option>
                      <option value="challenge_based">Challenge Based</option>
                      <option value="curiosity_based">Curiosity Based</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Must Include (CSV)</label>
                    <input 
                      type="text" 
                      value={brief.creative.must_include_phrases.join(', ')} 
                      onChange={(e) => handleArrayChange(updateCreative, 'must_include_phrases', e.target.value)}
                      className="w-full bg-void-900 border border-white/10 rounded-xl p-3 text-slate-300 focus:border-gold-500/50 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-400/60 uppercase tracking-widest mb-3">Must Avoid (CSV)</label>
                    <input 
                      type="text" 
                      value={brief.creative.must_avoid_phrases.join(', ')} 
                      onChange={(e) => handleArrayChange(updateCreative, 'must_avoid_phrases', e.target.value)}
                      className="w-full bg-void-900 border border-rose-500/20 rounded-xl p-3 text-slate-300 focus:border-rose-400/50 transition-all" 
                    />
                  </div>
                </div>
              </div>

              {/* Right Col */}
              <div className="space-y-6">
                {/* Emotional Sliders */}
                <div className="bg-void-800/50 p-6 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-bold text-gold-500/70 uppercase mb-6 tracking-widest flex items-center gap-2">
                    🎚️ Emotional Frequency
                  </h4>
                  <div className="space-y-5">
                    {Object.entries(brief.creative.emotional_frequency).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-2 items-center">
                          <span className="text-xs font-bold uppercase text-slate-500 tracking-wide">{key.replace('_', ' ')}</span>
                          <span className={`text-sm font-bold w-6 text-right ${(val as number) > 7 ? 'text-gold-400' : 'text-slate-600'}`}>{val as number}</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={val as number} 
                          onChange={(e) => updateEmotionalFreq(key as any, parseInt(e.target.value))}
                          className="w-full h-1.5 bg-void-700 rounded-full appearance-none cursor-pointer accent-gold-500" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tone Selectors */}
                <div className="bg-void-800/30 p-6 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-5 tracking-widest">Safety & Tone</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Humor Edge', field: 'humor_edge_level', opts: [['safe','Safe'], ['medium_spicy','Medium Spicy'], ['spicy_but_kind','Spicy But Kind']] },
                      { label: 'Spirituality', field: 'spirituality_flavor', opts: [['grounded','Grounded'], ['grounded_cosmic','Grounded Cosmic'], ['very_cosmic','Very Cosmic']] },
                      { label: 'Body Sensitivity', field: 'body_sensitivity', opts: [['no_body_shaming','No Shaming'], ['neutral','Neutral'], ['soft_body_language','Soft Lang']] }
                    ].map((item) => (
                      <div key={item.field}>
                        <span className="text-[10px] font-bold text-slate-600 uppercase mb-2 block">{item.label}</span>
                        <select 
                          value={brief.constraints[item.field as keyof Constraints]} 
                          onChange={(e) => updateConstraints(item.field as keyof Constraints, e.target.value)}
                          className="w-full bg-void-900 border border-white/10 rounded-xl p-3 text-sm font-medium text-slate-400 focus:border-gold-500/50 cursor-pointer"
                        >
                          {item.opts.map(([val, txt]) => <option key={val} value={val}>{txt}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-mystic-400/70 uppercase tracking-widest mb-3">Special Notes / Director's Whisper</label>
              <textarea 
                value={brief.special_notes} 
                onChange={(e) => setBrief(p => ({...p, special_notes: e.target.value}))}
                className="w-full bg-mystic-950/20 border border-mystic-500/20 rounded-2xl p-5 text-slate-300 h-28 resize-none focus:border-mystic-400/50 transition-all" 
                placeholder="Any final instructions for The Oracle?"
              />
            </div>
          </div>
        )}

        {/* VISUAL TAB */}
        {activeTab === 'visual' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-3">Style Tags (CSV)</label>
                <input 
                  type="text" 
                  value={brief.visual.style_tags.join(', ')} 
                  onChange={(e) => handleArrayChange(updateVisual, 'style_tags', e.target.value)}
                  className="w-full bg-void-900/80 border border-white/10 rounded-xl p-4 text-slate-300 focus:border-gold-500/50 transition-all" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Brand Palette</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={brief.visual.palette} 
                    onChange={(e) => updateVisual('palette', e.target.value)}
                    className="flex-1 bg-void-900/80 border border-white/10 rounded-xl p-4 text-slate-300 focus:border-gold-500/50 transition-all"
                    placeholder="e.g. Neon Cyber or #FF0055"
                  />
                  <div className="relative h-auto w-14 shrink-0">
                    <input 
                      type="color"
                      value={brief.visual.palette.match(/^#[0-9A-F]{6}$/i) ? brief.visual.palette : '#d4a013'}
                      onChange={(e) => updateVisual('palette', e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="w-full h-full rounded-xl border border-white/10 flex items-center justify-center transition-all hover:border-gold-500/50"
                      style={{ backgroundColor: brief.visual.palette.match(/^#[0-9A-F]{6}$/i) ? brief.visual.palette : '#1e1e30' }}
                    >
                      {!brief.visual.palette.match(/^#[0-9A-F]{6}$/i) && (
                        <span className="text-xl">🎨</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Instructor Image */}
              <div className="bg-void-800/30 p-5 rounded-2xl border border-white/5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Instructor Reference</label>
                <div className="flex gap-3 items-stretch mb-4">
                  <input 
                    type="text" 
                    value={brief.visual.instructor_image_url} 
                    onChange={(e) => updateVisual('instructor_image_url', e.target.value)}
                    className="flex-1 bg-void-900 border border-white/10 rounded-xl p-3 text-sm text-slate-400 focus:border-gold-500/50 transition-all" 
                    placeholder="https://... or upload" 
                  />
                  <label className="cursor-pointer bg-void-800 border border-white/10 hover:border-gold-500/30 text-slate-500 hover:text-gold-400 rounded-xl px-4 flex items-center justify-center transition-all">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'instructor_image_url')} />
                    ↑
                  </label>
                </div>
                {brief.visual.instructor_image_url && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-white/10">
                    <img src={brief.visual.instructor_image_url} alt="Instructor" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Logo */}
              <div className="bg-void-800/30 p-5 rounded-2xl border border-white/5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Brand Logo</label>
                <div className="flex gap-3 items-stretch mb-4">
                  <input 
                    type="text" 
                    value={brief.visual.logo_image_url} 
                    onChange={(e) => updateVisual('logo_image_url', e.target.value)}
                    className="flex-1 bg-void-900 border border-white/10 rounded-xl p-3 text-sm text-slate-400 focus:border-gold-500/50 transition-all" 
                    placeholder="https://... or upload" 
                  />
                  <label className="cursor-pointer bg-void-800 border border-white/10 hover:border-gold-500/30 text-slate-500 hover:text-gold-400 rounded-xl px-4 flex items-center justify-center transition-all">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo_image_url')} />
                    ↑
                  </label>
                </div>
                {brief.visual.logo_image_url && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-white/10 bg-void-900/50">
                    <img src={brief.visual.logo_image_url} alt="Logo" className="w-full h-full object-contain p-4" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTION */}
      <div className="mt-10 pt-8 border-t border-white/5 flex justify-end">
        <button
          onClick={onGenerate}
          disabled={isGeneratingBlueprint}
          className={`
            btn-oracle relative overflow-hidden group py-5 px-12 rounded-xl
            flex items-center gap-4 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          `}
        >
          <span className={`relative z-10 flex items-center gap-3 ${isGeneratingBlueprint ? 'opacity-0' : 'opacity-100'}`}>
            <span className="text-lg">👁</span>
            Invoke The Oracle
          </span>
          {isGeneratingBlueprint && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <svg className="animate-spin h-6 w-6 text-void-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
