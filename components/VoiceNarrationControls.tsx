import React, { useState, useEffect } from 'react';
import { 
  narrateBlueprint, 
  narrateText,
  stopNarration, 
  pauseNarration, 
  resumeNarration,
  getAvailableVoices,
  setStateCallback,
  NarrationState,
  NarrationOptions,
  generateQuickSummary
} from '../services/narrationService';
import { CampaignBlueprint } from '../types';

interface Props {
  blueprint: CampaignBlueprint;
}

export const VoiceNarrationControls: React.FC<Props> = ({ blueprint }) => {
  const [state, setState] = useState<NarrationState>({
    isPlaying: false,
    isPaused: false,
    currentSection: '',
    progress: 0
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
  const [rate, setRate] = useState(0.95);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      const available = getAvailableVoices();
      setVoices(available);
    };

    loadVoices();
    // Voices may load async
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Set up state callback
    setStateCallback(setState);

    return () => {
      stopNarration();
    };
  }, []);

  const handlePlay = async () => {
    const options: NarrationOptions = {
      rate,
      voiceIndex: selectedVoiceIndex
    };

    try {
      await narrateBlueprint(blueprint, options);
    } catch (error) {
      console.error('Narration failed:', error);
    }
  };

  const handleQuickSummary = async () => {
    const summary = generateQuickSummary(blueprint);
    try {
      await narrateText(summary, { rate, voiceIndex: selectedVoiceIndex });
    } catch (error) {
      console.error('Quick summary failed:', error);
    }
  };

  const handlePause = () => {
    if (state.isPaused) {
      resumeNarration();
    } else {
      pauseNarration();
    }
  };

  const handleStop = () => {
    stopNarration();
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎙️</span>
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">Voice Briefing</h3>
            <p className="text-xs text-slate-500">Audio narration of your campaign</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-slate-700 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          ⚙️
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 space-y-4">
          {/* Voice Selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Voice
            </label>
            <select
              value={selectedVoiceIndex}
              onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-amber-500/50 outline-none"
            >
              {voices.map((voice, i) => (
                <option key={i} value={i}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
              {voices.length === 0 && <option value={0}>Default Voice</option>}
            </select>
          </div>

          {/* Speed Control */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Speed: {rate.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Display */}
      {(state.isPlaying || state.isPaused) && (
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">{state.currentSection}</span>
            <span className="text-xs text-amber-400">{state.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 flex items-center gap-3">
        {!state.isPlaying && !state.isPaused ? (
          <>
            <button
              onClick={handlePlay}
              className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-bold rounded-xl hover:from-amber-500 hover:to-amber-400 transition-all flex items-center justify-center gap-2"
            >
              ▶ Full Briefing
            </button>
            <button
              onClick={handleQuickSummary}
              className="px-4 py-3 bg-slate-700 text-slate-300 font-medium rounded-xl hover:bg-slate-600 transition-colors text-sm"
              title="30-second summary"
            >
              ⚡ Quick
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="flex-1 py-3 bg-slate-700 text-slate-200 font-bold rounded-xl hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              {state.isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button
              onClick={handleStop}
              className="px-4 py-3 bg-red-500/20 text-red-400 font-medium rounded-xl hover:bg-red-500/30 transition-colors"
            >
              ⏹ Stop
            </button>
          </>
        )}
      </div>

      {/* Speaking Indicator */}
      {state.isPlaying && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-amber-400 rounded-full animate-pulse"
                style={{
                  height: `${8 + Math.random() * 16}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for sidebar/header
export const VoiceNarrationMini: React.FC<Props> = ({ blueprint }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setStateCallback((state) => setIsPlaying(state.isPlaying));
    return () => stopNarration();
  }, []);

  const handleToggle = async () => {
    if (isPlaying) {
      stopNarration();
    } else {
      try {
        await narrateBlueprint(blueprint, { rate: 0.95 });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-lg transition-all ${
        isPlaying 
          ? 'bg-amber-500/20 text-amber-400 animate-pulse' 
          : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
      }`}
      title={isPlaying ? 'Stop narration' : 'Play briefing'}
    >
      {isPlaying ? '🔊' : '🎙️'}
    </button>
  );
};
