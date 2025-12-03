/**
 * Template Manager
 * Save and reuse successful campaign briefs
 */

import React, { useState, useEffect } from 'react';
import { oracleStorage, StoredTemplate } from '../services/storageService';
import { CampaignBrief } from '../types';
import { toast } from 'sonner';

interface Props {
  currentBrief?: CampaignBrief;
  onLoadTemplate?: (brief: CampaignBrief) => void;
}

export const TemplateManager: React.FC<Props> = ({ currentBrief, onLoadTemplate }) => {
  const [templates, setTemplates] = useState<StoredTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const allTemplates = await oracleStorage.getAllTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentBrief) {
      toast.error('No brief to save');
      return;
    }

    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const template: StoredTemplate = {
      id: `template_${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim(),
      brief: currentBrief,
      createdAt: Date.now(),
      usageCount: 0
    };

    await oracleStorage.saveTemplate(template);
    toast.success('Template saved!');
    
    setNewTemplateName('');
    setNewTemplateDesc('');
    setShowSaveModal(false);
    loadTemplates();
  };

  const handleLoadTemplate = async (template: StoredTemplate) => {
    await oracleStorage.incrementTemplateUsage(template.id);
    onLoadTemplate?.(template.brief);
    toast.success(`Loaded: ${template.name}`);
    loadTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    await oracleStorage.deleteTemplate(id);
    toast.success('Template deleted');
    loadTemplates();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 text-sm">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <span className="text-gold-400">📐</span> Templates
          </h3>
          <p className="text-slate-500 text-sm mt-1">Reuse successful campaign blueprints</p>
        </div>
        {currentBrief && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-2 bg-gold-500 text-void-950 rounded-xl font-bold text-sm hover:bg-gold-400 transition-colors flex items-center gap-2"
          >
            <span>💾</span> Save Current
          </button>
        )}
      </div>

      {/* Templates Grid */}
      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div 
              key={template.id}
              className="glass-panel-inner p-5 rounded-xl hover:border-gold-500/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-slate-200 group-hover:text-gold-400 transition-colors">
                  {template.name}
                </h4>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-slate-600 hover:text-rose-400 transition-colors text-sm opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
              
              {template.description && (
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {template.description}
                </p>
              )}
              
              {/* Brief preview */}
              <div className="bg-void-900/50 p-3 rounded-lg mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600">Campaign:</span>
                  <span className="text-xs text-slate-400 truncate">
                    {template.brief.meta.campaign_name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.brief.meta.pillars?.map((pillar: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-gold-500/10 text-gold-400/70 rounded">
                      {pillar.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-600">
                  <span>
                    {Object.entries(template.brief.outputs.quantities)
                      .filter(([_, v]) => (v as number) > 0)
                      .map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`)
                      .join(', ')
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-600">
                  <span>{formatDate(template.createdAt)}</span>
                  {template.usageCount > 0 && (
                    <span className="ml-2">• Used {template.usageCount}x</span>
                  )}
                </div>
                <button
                  onClick={() => handleLoadTemplate(template)}
                  className="px-4 py-2 bg-void-800 border border-white/10 text-slate-300 rounded-lg text-xs font-bold hover:border-gold-500/30 hover:text-gold-400 transition-all"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <span className="text-5xl block mb-4">📐</span>
          <h4 className="font-bold text-slate-300 mb-2">No Templates Yet</h4>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Save your successful campaign briefs as templates to quickly launch similar campaigns in the future.
          </p>
          {currentBrief && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="mt-6 btn-oracle py-3 px-8 rounded-xl"
            >
              Save Current Brief as Template
            </button>
          )}
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowSaveModal(false)}
        >
          <div 
            className="glass-panel rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-slate-200 text-lg">Save as Template</h4>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., No Excuse Campaign, Product Launch..."
                  className="w-full bg-void-900 border border-white/10 rounded-xl p-4 text-slate-200 focus:border-gold-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="What is this template best used for?"
                  className="w-full bg-void-900 border border-white/10 rounded-xl p-4 text-slate-300 h-24 resize-none focus:border-gold-500/50"
                />
              </div>

              {/* Brief preview */}
              {currentBrief && (
                <div className="bg-void-800/30 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-600 uppercase mb-2">Saving brief:</p>
                  <p className="text-sm text-slate-400">{currentBrief.meta.campaign_name}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {currentBrief.meta.pillars?.map((pillar: string, i: number) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-gold-500/10 text-gold-400/70 rounded">
                        {pillar.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveTemplate}
                className="w-full btn-oracle py-4 rounded-xl flex items-center justify-center gap-2"
              >
                <span>💾</span> Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
