import React, { useRef, useState } from 'react';
import { CampaignBlueprint } from '../types';
import { generateMemeImage } from '../services/geminiService';
import { oracleStorage } from '../services/storageService';
import { useCampaign } from '../context';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { PlatformPreviewCarousel } from './PlatformPreviews';

export const BlueprintView: React.FC = () => {
  const { blueprint, assets, setAssetUrl, setAssetLoading } = useCampaign();
  const { generatedAssets, loadingAssets } = assets;

  const memeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const bannerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const storyboardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const carouselSlideRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [activeSlide, setActiveSlide] = useState<{ [carouselId: string]: number }>({});
  const [previewAsset, setPreviewAsset] = useState<{ url: string; topText?: string; bottomText?: string; caption?: string } | null>(null);

  if (!blueprint) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-600">
        <p>No vision available.</p>
      </div>
    );
  }

  const handleGenerateAsset = async (id: string, prompt: string, type: 'image' | 'storyboard', aspectRatio: string = "1:1") => {
    setAssetLoading(id, true);
    
    const toastId = toast.loading(
      type === 'image' ? `Manifesting visual...` : `Sketching storyboard...`
    );

    try {
      const url = await generateMemeImage(prompt, aspectRatio);
      setAssetUrl(id, url);
      
      // Save to asset library
      await oracleStorage.saveAsset({
        id: `asset_${id}_${Date.now()}`,
        campaignId: blueprint?.campaign_summary?.one_liner || 'unknown',
        type: type === 'storyboard' ? 'storyboard' : (aspectRatio === '9:16' ? 'storyboard' : 'meme'),
        dataUrl: url,
        prompt: prompt,
        createdAt: Date.now(),
        tags: []
      });
      
      toast.success(`Vision materialized`, { id: toastId });
    } catch (e: any) {
      console.error("Asset generation error:", e.message);
      toast.error(`Generation failed: ${e.message}`, { id: toastId });
    } finally {
      setAssetLoading(id, false);
    }
  };

  const handleDownloadComposite = async (id: string, type: string) => {
    let ref;
    if (type === 'meme') ref = memeRefs.current[id];
    else if (type === 'banner') ref = bannerRefs.current[id];
    else if (type === 'storyboard') ref = storyboardRefs.current[id];
    else ref = carouselSlideRefs.current[id];

    if (!ref) {
      toast.error("Could not locate element.");
      return;
    }

    const toastId = toast.loading("Compositing...");
    
    try {
      const canvas = await html2canvas(ref, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
      });

      const url = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_${id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Download initiated", { id: toastId });
    } catch (e) {
      console.error("Composite download failed:", e);
      toast.error("Failed to generate download.", { id: toastId });
    }
  };

  const handleExportManus = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blueprint, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "oracle_payload.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("Exported payload");
  };
  
  const summary = blueprint.campaign_summary;
  const narrative = blueprint.narrative_pack;
  const memes = Array.isArray(blueprint.memes) ? blueprint.memes : [];
  const banners = Array.isArray(blueprint.static_banners) ? blueprint.static_banners : [];
  const videos = Array.isArray(blueprint.short_videos) ? blueprint.short_videos : [];
  const scripts = Array.isArray(blueprint.ugc_scripts) ? blueprint.ugc_scripts : [];
  const carousels = Array.isArray(blueprint.carousels) ? blueprint.carousels : [];
  const moments = Array.isArray(blueprint.moments_mapping) ? blueprint.moments_mapping : [];

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-40 animate-fade-in px-4 md:px-0">
      
      {/* 1. Header Summary Card */}
      <div className="glass-panel p-8 md:p-10 rounded-[2rem] text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600"></div>
        
        <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
          <span className="text-[9px] uppercase font-bold text-slate-600 tracking-widest">Active Pillars</span>
          <div className="flex gap-2">
            {(summary.pillars || []).map((p, i) => (
              <span key={i} className="px-3 py-1.5 bg-gold-500/10 text-gold-400 text-[10px] font-bold rounded-full border border-gold-500/20 uppercase tracking-wide">
                {p.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto pt-6">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 text-slate-100 leading-tight">
            {summary.one_liner || "Campaign Generated"}
          </h2>
          <p className="text-gold-400/80 font-serif italic mb-8 text-xl md:text-2xl leading-relaxed">
            "{summary.tone_description || "..."}"
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-10">
            <div className="bg-void-800/50 p-5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">Core Promise</span>
              <p className="font-bold text-slate-300 mt-2 text-base leading-snug">{summary.core_promise || "N/A"}</p>
            </div>
            <div className="bg-void-800/50 p-5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">Emotional Mix</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {(summary.primary_emotions || []).map((e, i) => (
                  <span key={i} className="px-2 py-1 bg-gold-500/10 text-gold-400 text-xs font-bold rounded-lg">{e}</span>
                ))}
              </div>
            </div>
            <div className="bg-void-800/50 p-5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">Key Taglines</span>
              <ul className="mt-2 space-y-1.5">
                {(narrative.taglines || []).slice(0, 3).map((t, i) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                    <span className="text-gold-500">→</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 1.5 Narrative Intelligence */}
      <section className="space-y-6 animate-fade-in-up">
        <div className="flex items-center gap-4 px-2">
          <span className="p-2.5 bg-mystic-500/20 rounded-xl text-mystic-400 text-xl">🧠</span>
          <h3 className="text-2xl font-bold text-slate-200 tracking-tight">Narrative Intelligence</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-5 glass-panel-inner p-6 rounded-2xl flex flex-col">
            <h4 className="font-bold text-base text-slate-300 mb-5 flex items-center gap-2">
              <span className="text-lg">🪝</span> Scroll-Stopping Hooks
            </h4>
            <ul className="space-y-3 flex-1 overflow-y-auto pr-2">
              {(narrative.hooks || []).map((hook, i) => (
                <li key={i} className="group flex gap-3 text-sm text-slate-400 hover:text-slate-200 transition-colors p-2.5 hover:bg-white/5 rounded-xl">
                  <span className="text-gold-500/50 font-mono text-xs group-hover:text-gold-400">{(i+1).toString().padStart(2, '0')}</span>
                  <span className="leading-snug">{hook}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-5 flex flex-col">
            <div className="glass-panel-inner p-5 rounded-2xl flex-1">
              <h4 className="font-bold text-sm text-slate-400 mb-3 flex items-center gap-2">
                <span>💔</span> Pain Points
              </h4>
              <ul className="space-y-2">
                {(narrative.pain_points || []).map((pain, i) => (
                  <li key={i} className="text-slate-400 text-xs font-medium flex gap-2 items-start bg-rose-500/5 p-2.5 rounded-lg border border-rose-500/10">
                    <span className="text-rose-400">•</span> {pain}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="glass-panel-inner p-5 rounded-2xl flex-1">
              <h4 className="font-bold text-sm text-slate-400 mb-3 flex items-center gap-2">
                <span>🦋</span> Micro Shifts
              </h4>
              <ul className="space-y-2">
                {(narrative.micro_transformations || []).map((trans, i) => (
                  <li key={i} className="text-slate-400 text-xs font-medium flex gap-2 items-start bg-gold-500/5 p-2.5 rounded-lg border border-gold-500/10">
                    <span className="text-gold-400">→</span> {trans}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="md:col-span-3 space-y-5 flex flex-col">
            <div className="bg-mystic-500/5 p-5 rounded-2xl border border-mystic-500/10 flex-1">
              <h4 className="font-bold text-sm text-mystic-400 mb-3">CTA Variants</h4>
              <div className="flex flex-col gap-2">
                {(narrative.cta_variants || []).map((cta, i) => (
                  <span key={i} className="px-3 py-2.5 bg-void-900/80 text-mystic-300 font-medium text-xs rounded-xl border border-mystic-500/10 text-center">
                    {cta}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-void-900 p-5 rounded-2xl border border-gold-500/10 flex-1">
              <h4 className="font-bold text-sm mb-3 text-gold-400">Taglines</h4>
              <ul className="space-y-3">
                {(narrative.taglines || []).slice(0, 5).map((tag, i) => (
                  <li key={i} className="font-serif italic text-sm text-slate-400 leading-snug border-l-2 border-gold-500/30 pl-3">
                    "{tag}"
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Memes Section */}
      {memes.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <span className="p-2.5 bg-ember-500/20 rounded-xl text-ember-400 text-xl">🖼️</span> 
            <h3 className="text-2xl font-bold text-slate-200 tracking-tight">Memes & Visuals</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {memes.map((meme) => (
              <div key={meme.id || Math.random()} className="glass-panel rounded-2xl p-2 hover:border-gold-500/20 transition-all flex flex-col h-full group">
                
                <div 
                  ref={(el) => { memeRefs.current[meme.id] = el; }}
                  className="relative w-full aspect-square bg-void-950 rounded-xl overflow-hidden mb-4 border border-white/5"
                >
                  {generatedAssets[meme.id] ? (
                    <>
                      <img 
                        src={generatedAssets[meme.id]} 
                        alt="Generated Meme" 
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                        <p className="text-2xl md:text-3xl text-white uppercase text-center leading-[0.9] tracking-tighter"
                           style={{ 
                             fontFamily: 'Impact, fantasy, sans-serif', 
                             textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                           }}
                        >
                          {meme.top_text}
                        </p>
                        <p className="text-2xl md:text-3xl text-white uppercase text-center leading-[0.9] tracking-tighter"
                           style={{ 
                             fontFamily: 'Impact, fantasy, sans-serif', 
                             textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                           }}
                        >
                          {meme.bottom_text}
                        </p>
                      </div>
                    </>
                  ) : loadingAssets[meme.id] ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 animate-pulse">
                      <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-2"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Manifesting...</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                      <p className="font-bold text-lg text-slate-600 uppercase text-center" style={{ fontFamily: 'Impact, sans-serif' }}>{meme.top_text}</p>
                      <div className="text-center text-slate-700 font-bold text-2xl">◇</div>
                      <p className="font-bold text-lg text-slate-600 uppercase text-center" style={{ fontFamily: 'Impact, sans-serif' }}>{meme.bottom_text}</p>
                    </div>
                  )}
                </div>
                
                <div className="px-3 pb-3 flex-1 flex flex-col">
                  <h4 className="font-bold text-base text-slate-300 leading-tight mb-2">{meme.angle}</h4>
                  <div className="text-[10px] text-slate-600 font-mono mb-4 bg-void-900/50 p-2.5 rounded-lg line-clamp-2">
                    {meme.image_prompt}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => handleGenerateAsset(meme.id, meme.image_prompt, 'image', meme.recommended_aspect_ratios?.[0] || '1:1')}
                      className="flex-1 py-2.5 bg-gold-500 text-void-950 rounded-xl font-bold text-sm hover:bg-gold-400 transition-colors"
                    >
                      {generatedAssets[meme.id] ? "Regenerate" : "Generate"}
                    </button>
                    {generatedAssets[meme.id] && (
                      <button 
                        onClick={() => handleDownloadComposite(meme.id, 'meme')}
                        className="px-4 bg-void-800 border border-white/10 rounded-xl hover:border-gold-500/30 hover:text-gold-400 transition-colors text-slate-500"
                      >
                        ⬇
                      </button>
                    )}
                    {generatedAssets[meme.id] && (
                      <button 
                        onClick={() => setPreviewAsset({ 
                          url: generatedAssets[meme.id], 
                          topText: meme.top_text, 
                          bottomText: meme.bottom_text 
                        })}
                        className="px-4 bg-void-800 border border-white/10 rounded-xl hover:border-cyan-500/30 hover:text-cyan-400 transition-colors text-slate-500"
                        title="Preview on platforms"
                      >
                        📱
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Static Banners */}
      {banners.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <span className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400 text-xl">🎨</span>
            <h3 className="text-2xl font-bold text-slate-200 tracking-tight">Static Banners</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {banners.map((banner) => (
              <div key={banner.id || Math.random()} className="glass-panel p-5 rounded-2xl flex flex-col">
                
                <div 
                  ref={(el) => { bannerRefs.current[banner.id] = el; }}
                  className="relative rounded-xl overflow-hidden aspect-video bg-void-950 mb-5 border border-white/5"
                >
                  {generatedAssets[banner.id] ? (
                    <div className="relative w-full h-full">
                      <img src={generatedAssets[banner.id]} alt="Generated Banner" crossOrigin="anonymous" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5">
                        <span className="text-cyan-400 font-bold tracking-widest text-[10px] uppercase mb-1">{banner.subheadline}</span>
                        <h3 className="text-white font-bold text-xl leading-none mb-3">{banner.headline}</h3>
                        <div className="bg-gold-500 text-void-950 px-4 py-2 rounded-full text-xs font-bold w-fit uppercase tracking-wider">{banner.cta_text}</div>
                      </div>
                    </div>
                  ) : loadingAssets[banner.id] ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 text-3xl">
                      ◆
                    </div>
                  )}
                </div>
                
                <div className="flex-1 bg-void-800/30 p-4 rounded-xl mb-5 border border-white/5">
                  <ul className="space-y-2">
                    {(banner.bullets || []).map((b,i) => (
                      <li key={i} className="text-sm text-slate-400 flex gap-2">
                        <span className="text-cyan-500">•</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateAsset(banner.id, banner.image_prompt, 'image', banner.recommended_aspect_ratios?.[0] || '16:9')}
                    className="flex-1 py-3 bg-void-800 border border-white/10 text-slate-300 hover:border-cyan-500/30 hover:text-cyan-400 rounded-xl font-bold transition-all"
                  >
                    {generatedAssets[banner.id] ? "Redesign" : "Generate Design"}
                  </button>
                  {generatedAssets[banner.id] && (
                    <button 
                      onClick={() => handleDownloadComposite(banner.id, 'banner')}
                      className="px-5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-colors font-bold"
                    >
                      ⬇
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Carousels */}
      {carousels.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <span className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400 text-xl">🎠</span>
            <h3 className="text-2xl font-bold text-slate-200 tracking-tight">Carousel Builder</h3>
          </div>
          
          {carousels.map((carousel) => {
            const currentSlideIndex = activeSlide[carousel.id] || 0;
            if (!carousel.slides || carousel.slides.length === 0) return null;
            const currentSlide = carousel.slides[currentSlideIndex];
            const slideId = `${carousel.id}_slide_${currentSlideIndex}`;

            return (
              <div key={carousel.id || Math.random()} className="glass-panel p-6 md:p-10 rounded-2xl flex flex-col md:flex-row gap-10">
                <div className="flex-1 max-w-sm mx-auto w-full">
                  <h4 className="font-bold text-xl text-slate-200 mb-5 text-center">{carousel.title}</h4>
                  
                  <div 
                    ref={(el) => { carouselSlideRefs.current[slideId] = el; }}
                    className="aspect-[4/5] bg-void-950 rounded-2xl overflow-hidden shadow-xl border border-white/5 relative mb-6"
                  >
                    {generatedAssets[slideId] ? (
                      <div className="relative w-full h-full">
                        <img src={generatedAssets[slideId]} alt="Slide Background" crossOrigin="anonymous" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 p-6 flex flex-col justify-center items-center text-center">
                          <h3 className="text-white font-bold text-2xl mb-3 drop-shadow-lg leading-tight uppercase">{currentSlide.headline}</h3>
                          <p className="text-white font-medium text-base leading-snug drop-shadow-md">{currentSlide.body_copy}</p>
                        </div>
                        <div className="absolute bottom-4 w-full flex justify-center gap-1">
                          {carousel.slides.map((_, idx) => (
                            <div key={idx} className={`h-1 rounded-full ${idx === currentSlideIndex ? 'w-5 bg-gold-400' : 'w-1.5 bg-white/30'}`}></div>
                          ))}
                        </div>
                      </div>
                    ) : loadingAssets[slideId] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 animate-pulse">
                        <span className="text-xs font-bold uppercase tracking-widest">Designing Slide {currentSlide.slide_number}...</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-indigo-950 to-void-950">
                        <h3 className="text-slate-600 font-bold text-xl mb-4 uppercase">{currentSlide.headline}</h3>
                        <button
                          onClick={() => handleGenerateAsset(slideId, currentSlide.image_prompt, 'image', '4:5')}
                          className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-400 transition-colors"
                        >
                          Generate Slide {currentSlide.slide_number}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center bg-void-800/50 p-2 rounded-full border border-white/5">
                    <button 
                      onClick={() => setActiveSlide(prev => ({...prev, [carousel.id]: Math.max(0, currentSlideIndex - 1)}))}
                      disabled={currentSlideIndex === 0}
                      className="w-9 h-9 rounded-full bg-void-900 flex items-center justify-center disabled:opacity-30 hover:text-gold-400 font-bold text-slate-500"
                    >←</button>
                    <span className="font-mono text-xs font-bold text-slate-600">
                      {currentSlide.slide_number} / {carousel.slides.length}
                    </span>
                    <button 
                      onClick={() => setActiveSlide(prev => ({...prev, [carousel.id]: Math.min(carousel.slides.length - 1, currentSlideIndex + 1)}))}
                      disabled={currentSlideIndex === carousel.slides.length - 1}
                      className="w-9 h-9 rounded-full bg-void-900 flex items-center justify-center disabled:opacity-30 hover:text-gold-400 font-bold text-slate-500"
                    >→</button>
                  </div>
                  
                  {generatedAssets[slideId] && (
                    <button 
                      onClick={() => handleDownloadComposite(slideId, 'carousel_slide')}
                      className="w-full mt-4 py-2.5 border border-indigo-500/20 text-indigo-400 rounded-xl font-bold hover:bg-indigo-500/10 transition-colors"
                    >
                      Download Slide {currentSlide.slide_number}
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-5 flex flex-col justify-center">
                  <div className="bg-void-800/30 p-5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase text-slate-600 tracking-widest mb-2 block">Visual Direction</span>
                    <p className="text-slate-400 font-medium italic">"{currentSlide.visual_description}"</p>
                  </div>
                  <div className="bg-void-800/30 p-5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase text-slate-600 tracking-widest mb-2 block">Copy</span>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase">Headline</span>
                        <p className="font-bold text-slate-200 text-lg">{currentSlide.headline}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase">Body</span>
                        <p className="text-slate-400">{currentSlide.body_copy}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* 5. Video Storyboards */}
      {videos.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <span className="p-2.5 bg-rose-500/20 rounded-xl text-rose-400 text-xl">🎬</span>
            <h3 className="text-2xl font-bold text-slate-200 tracking-tight">Director's Storyboards</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((video) => (
              <div key={video.id || Math.random()} className="glass-panel p-6 rounded-2xl flex flex-col lg:flex-row gap-6">
                
                <div className="flex-1 order-2 lg:order-1">
                  <div className="mb-5">
                    <h4 className="font-bold text-xl text-slate-200 leading-none mb-2">{video.title}</h4>
                    <div className="flex gap-2">
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded">{video.max_duration_seconds}s</span>
                      <span className="text-xs font-bold text-slate-500 bg-void-800 px-2 py-1 rounded uppercase">{(video.platform_targets || []).join(', ')}</span>
                    </div>
                  </div>

                  <div className="space-y-0 relative border-l border-white/10 ml-2 pl-5 py-2">
                    {(video.script_beats || []).map((beat, idx) => (
                      <div key={idx} className="relative mb-5 last:mb-0">
                        <span className="absolute -left-[23px] top-0 w-2 h-2 rounded-full bg-slate-600 ring-4 ring-void-900"></span>
                        <span className="text-[10px] font-mono font-bold text-rose-400 block mb-1">{beat.approx_seconds}s</span>
                        <p className="font-medium text-slate-300 text-sm leading-snug">"{beat.voiceover_text}"</p>
                        <p className="text-xs text-slate-600 italic mt-1">{beat.visual_direction}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full lg:w-56 order-1 lg:order-2 flex flex-col gap-4">
                  <div 
                    ref={(el) => { storyboardRefs.current[video.id] = el; }}
                    className="relative w-full aspect-[9/16] bg-void-950 rounded-2xl overflow-hidden border border-white/5"
                  >
                    {generatedAssets[video.id] ? (
                      <>
                        <img src={generatedAssets[video.id]} alt="Storyboard Frame" crossOrigin="anonymous" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur">Concept</div>
                      </>
                    ) : loadingAssets[video.id] ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 animate-pulse">
                        <div className="w-8 h-8 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-2"></div>
                        <p className="text-xs font-bold uppercase tracking-widest">Sketching...</p>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center">
                        <span className="text-3xl mb-3">✏️</span>
                        <button
                          onClick={() => handleGenerateAsset(video.id, video.storyboard_prompt, 'storyboard', '9:16')}
                          className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold transition-colors text-sm"
                        >
                          Draw Storyboard
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {generatedAssets[video.id] && (
                    <button 
                      onClick={() => handleDownloadComposite(video.id, 'storyboard')}
                      className="w-full py-2 bg-void-800 border border-white/10 text-slate-500 text-xs font-bold rounded-lg hover:border-rose-500/30 hover:text-rose-400 transition-colors"
                    >
                      Download Frame
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. UGC Scripts */}
      {scripts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <span className="p-2.5 bg-gold-500/20 rounded-xl text-gold-400 text-xl">🤳</span>
            <h3 className="text-2xl font-bold text-slate-200 tracking-tight">UGC Scripts</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scripts.map((script) => (
              <div key={script.id || Math.random()} className="glass-panel rounded-2xl overflow-hidden">
                <div className="h-1 w-full bg-gold-500"></div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-5">
                    <h4 className="font-bold text-lg text-slate-200">{script.persona}</h4>
                    <span className="text-[10px] bg-gold-500/10 text-gold-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wide">Talking Head</span>
                  </div>

                  <div className="bg-gold-500/5 p-5 rounded-xl mb-6 border border-gold-500/10 relative">
                    <span className="absolute -top-2 left-5 bg-gold-500/20 text-gold-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded">Hook</span>
                    <p className="text-lg font-bold text-gold-300 leading-snug">"{script.hook_line}"</p>
                  </div>
                  
                  <div className="flex gap-3 mb-6">
                    <div className="flex-1 bg-void-800/30 p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Wardrobe</span>
                      <p className="text-xs font-medium text-slate-400">{script.wardrobe_note || "Authentic casual"}</p>
                    </div>
                    <div className="flex-1 bg-void-800/30 p-3 rounded-xl border border-white/5">
                      <span className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Lighting</span>
                      <p className="text-xs font-medium text-slate-400">{script.lighting_note || "Natural window light"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(script.script_blocks || []).map((block) => (
                      <div key={block.block_index} className="flex gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-void-800 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {block.block_index}
                        </div>
                        <div className="space-y-1">
                          <div className="flex gap-2 text-[9px] font-bold text-slate-600 uppercase">
                            <span>{block.framing_note}</span>
                            <span className="text-gold-500/50">•</span>
                            <span>{block.emotion_note}</span>
                          </div>
                          <p className="text-slate-300 font-medium leading-relaxed">"{block.spoken_text}"</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Overlay Text</span>
                    <p className="font-bold text-slate-300 bg-void-800/50 px-4 py-2 rounded-lg">{script.cta_line}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Moments Mapping */}
      {moments.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <span className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400 text-xl">✨</span>
            <h3 className="text-2xl font-bold text-slate-200 tracking-tight">Moments & Shift</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {moments.map((m, i) => (
              <div key={i} className="glass-panel-inner p-5 rounded-2xl hover:border-gold-500/20 transition-colors group">
                <span className="text-[9px] font-bold uppercase text-gold-500/60 tracking-widest mb-2 block">{m.moment_type.replace(/_/g, ' ')}</span>
                <h4 className="font-bold text-base text-slate-200 mb-3">{m.use_case}</h4>
                <div className="bg-gold-500/5 p-4 rounded-xl mb-3 relative border border-gold-500/10">
                  <span className="absolute -top-1.5 -left-1.5 text-xl text-gold-500/30">"</span>
                  <p className="italic text-gold-300 font-medium text-sm relative z-10">{m.suggested_line}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-void-800/50 text-slate-500 text-[10px] font-bold uppercase rounded-lg border border-white/5">
                    {m.where_to_use}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Floating Export FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={handleExportManus}
          className="btn-oracle py-4 px-8 rounded-xl flex items-center gap-3 shadow-2xl shadow-gold-500/20"
        >
          <span className="text-lg">💾</span> Export Payload
        </button>
      </div>

      {/* Platform Preview Modal */}
      {previewAsset && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewAsset(null)}
        >
          <div 
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-200">Platform Preview</h3>
              <button
                onClick={() => setPreviewAsset(null)}
                className="text-slate-500 hover:text-slate-300 text-2xl"
              >
                ✕
              </button>
            </div>
            <PlatformPreviewCarousel 
              imageUrl={previewAsset.url}
              topText={previewAsset.topText}
              bottomText={previewAsset.bottomText}
              caption={previewAsset.caption}
            />
          </div>
        </div>
      )}

    </div>
  );
};
