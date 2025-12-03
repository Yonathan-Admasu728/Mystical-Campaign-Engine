/**
 * Brand Voice Training
 * Upload examples, extract voice traits, apply to generations
 */

import React, { useState, useEffect } from 'react';
import { oracleStorage, BrandVoice } from '../services/storageService';
import { toast } from 'sonner';

interface Props {
  onVoiceSelect?: (voice: BrandVoice) => void;
  selectedVoiceId?: string;
}

export const BrandVoiceTrainer: React.FC<Props> = ({ onVoiceSelect, selectedVoiceId }) => {
  const [voices, setVoices] = useState<BrandVoice[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [examples, setExamples] = useState<string[]>(['', '', '']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    const allVoices = await oracleStorage.getAllBrandVoices();
    setVoices(allVoices);
  };

  const handleAddExample = () => {
    if (examples.length < 10) {
      setExamples([...examples, '']);
    }
  };

  const handleRemoveExample = (index: number) => {
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index));
    }
  };

  const handleExampleChange = (index: number, value: string) => {
    const newExamples = [...examples];
    newExamples[index] = value;
    setExamples(newExamples);
  };

  const analyzeVoice = (exampleTexts: string[]): string[] => {
    // Local voice analysis - extract patterns without API call
    const traits: string[] = [];
    const allText = exampleTexts.join(' ').toLowerCase();
    
    // Tone analysis
    if (/\?/.test(allText)) traits.push('Questioning, curious');
    if (/!/.test(allText)) traits.push('Energetic, emphatic');
    if (/\.\.\./.test(allText)) traits.push('Reflective, trailing');
    
    // Style patterns
    if (/you|your|you're/i.test(allText)) traits.push('Direct, second-person address');
    if (/we|our|us/i.test(allText)) traits.push('Inclusive, community-focused');
    if (/i |i'm|my/i.test(allText)) traits.push('Personal, first-person narrative');
    
    // Emotional patterns
    if (/love|amazing|incredible|beautiful/i.test(allText)) traits.push('Warm, appreciative');
    if (/stop|never|dont|don't/i.test(allText)) traits.push('Bold, confrontational');
    if (/imagine|what if|picture/i.test(allText)) traits.push('Visionary, aspirational');
    if (/truth|real|honest|actually/i.test(allText)) traits.push('Authentic, transparent');
    
    // Structure patterns
    const avgLength = allText.split(/[.!?]/).filter(Boolean).reduce((a, s) => a + s.length, 0) / 
                      allText.split(/[.!?]/).filter(Boolean).length;
    if (avgLength < 50) traits.push('Punchy, short sentences');
    else if (avgLength > 100) traits.push('Flowing, long-form');
    else traits.push('Balanced sentence structure');
    
    // Word choice patterns
    if (/gonna|wanna|gotta|kinda/i.test(allText)) traits.push('Casual, colloquial');
    if (/therefore|however|moreover/i.test(allText)) traits.push('Formal, structured');
    if (/fuck|damn|shit|hell/i.test(allText)) traits.push('Raw, unfiltered');
    
    // Metaphor/imagery
    if (/like a|as if|imagine|picture/i.test(allText)) traits.push('Metaphorical, visual');
    
    // Call-to-action style
    if (/click|join|start|get|try|discover/i.test(allText)) traits.push('Action-oriented CTAs');
    
    return traits.length > 0 ? traits : ['Neutral, adaptable tone'];
  };

  const handleSaveVoice = async () => {
    if (!newVoiceName.trim()) {
      toast.error('Please enter a voice name');
      return;
    }

    const validExamples = examples.filter(e => e.trim().length > 20);
    if (validExamples.length < 2) {
      toast.error('Please provide at least 2 examples (min 20 characters each)');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Analyze the voice
      const extractedTraits = analyzeVoice(validExamples);

      const voice: BrandVoice = {
        id: `voice_${Date.now()}`,
        name: newVoiceName.trim(),
        examples: validExamples,
        extractedTraits,
        createdAt: Date.now()
      };

      await oracleStorage.saveBrandVoice(voice);
      toast.success('Brand voice saved!');
      
      // Reset form
      setNewVoiceName('');
      setExamples(['', '', '']);
      setIsCreating(false);
      loadVoices();
    } catch (error) {
      toast.error('Failed to save voice');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteVoice = async (id: string) => {
    await oracleStorage.deleteBrandVoice(id);
    toast.success('Voice deleted');
    loadVoices();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <span className="text-gold-400">🎤</span> Brand Voice
          </h3>
          <p className="text-slate-500 text-sm mt-1">Train The Oracle to speak your language</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-gold-500 text-void-950 rounded-xl font-bold text-sm hover:bg-gold-400 transition-colors"
          >
            + New Voice
          </button>
        )}
      </div>

      {/* Existing Voices */}
      {voices.length > 0 && !isCreating && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {voices.map(voice => (
            <div 
              key={voice.id}
              className={`
                glass-panel-inner p-5 rounded-xl cursor-pointer transition-all
                ${selectedVoiceId === voice.id 
                  ? 'border-gold-500/50 bg-gold-500/5' 
                  : 'hover:border-gold-500/20'}
              `}
              onClick={() => onVoiceSelect?.(voice)}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-slate-200">{voice.name}</h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVoice(voice.id);
                  }}
                  className="text-slate-600 hover:text-rose-400 transition-colors text-sm"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {voice.extractedTraits.slice(0, 4).map((trait, i) => (
                  <span key={i} className="text-[10px] px-2 py-1 bg-void-800 text-slate-400 rounded-lg">
                    {trait}
                  </span>
                ))}
                {voice.extractedTraits.length > 4 && (
                  <span className="text-[10px] px-2 py-1 bg-void-800 text-slate-500 rounded-lg">
                    +{voice.extractedTraits.length - 4} more
                  </span>
                )}
              </div>
              
              <p className="text-xs text-slate-600">
                {voice.examples.length} examples · Created {new Date(voice.createdAt).toLocaleDateString()}
              </p>
              
              {selectedVoiceId === voice.id && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">
                    ✓ Active Voice
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create New Voice Form */}
      {isCreating && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-200">Create New Voice</h4>
            <button
              onClick={() => setIsCreating(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>

          {/* Voice Name */}
          <div>
            <label className="block text-[10px] font-bold text-gold-500/70 uppercase tracking-widest mb-2">
              Voice Name
            </label>
            <input
              type="text"
              value={newVoiceName}
              onChange={(e) => setNewVoiceName(e.target.value)}
              placeholder="e.g., Playful Challenger, Wise Mentor..."
              className="w-full bg-void-900 border border-white/10 rounded-xl p-4 text-slate-200 focus:border-gold-500/50"
            />
          </div>

          {/* Examples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold text-gold-500/70 uppercase tracking-widest">
                Copy Examples ({examples.filter(e => e.trim().length > 20).length}/10)
              </label>
              <button
                onClick={handleAddExample}
                disabled={examples.length >= 10}
                className="text-xs text-gold-400 hover:text-gold-300 disabled:opacity-50"
              >
                + Add Example
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Paste 2-10 examples of copy you love. The more examples, the better The Oracle learns your voice.
            </p>
            
            <div className="space-y-3">
              {examples.map((example, index) => (
                <div key={index} className="relative">
                  <textarea
                    value={example}
                    onChange={(e) => handleExampleChange(index, e.target.value)}
                    placeholder={`Example ${index + 1}: Paste a headline, caption, or paragraph...`}
                    className="w-full bg-void-900 border border-white/10 rounded-xl p-4 text-slate-300 text-sm h-24 resize-none focus:border-gold-500/50"
                  />
                  {examples.length > 1 && (
                    <button
                      onClick={() => handleRemoveExample(index)}
                      className="absolute top-2 right-2 text-slate-600 hover:text-rose-400 text-sm"
                    >
                      ✕
                    </button>
                  )}
                  {example.trim().length > 0 && (
                    <span className={`absolute bottom-2 right-2 text-[10px] ${
                      example.trim().length >= 20 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {example.trim().length} chars {example.trim().length < 20 && '(min 20)'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveVoice}
            disabled={isAnalyzing}
            className="w-full btn-oracle py-4 rounded-xl flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-void-950/30 border-t-void-950 rounded-full animate-spin"></div>
                Analyzing Voice...
              </>
            ) : (
              <>
                <span>🧬</span> Analyze & Save Voice
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty State */}
      {voices.length === 0 && !isCreating && (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <span className="text-5xl block mb-4">🎤</span>
          <h4 className="font-bold text-slate-300 mb-2">No Brand Voices Yet</h4>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Train The Oracle to write in your unique voice. Upload examples of copy you love and watch the magic happen.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="btn-oracle py-3 px-8 rounded-xl"
          >
            Create Your First Voice
          </button>
        </div>
      )}
    </div>
  );
};

export default BrandVoiceTrainer;
