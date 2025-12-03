import React, { useState, useEffect } from 'react';
import { generateWhispers, Whisper } from '../services/whisperService';

interface Props {
  onActionClick?: (whisper: Whisper) => void;
}

export const ProactiveWhispers: React.FC<Props> = ({ onActionClick }) => {
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadWhispers();
  }, []);

  const loadWhispers = async () => {
    setLoading(true);
    try {
      const data = await generateWhispers();
      setWhispers(data);
    } catch (error) {
      console.error('Failed to load whispers:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissWhisper = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const visibleWhispers = whispers.filter(w => !dismissed.has(w.id));

  const getTypeStyles = (type: Whisper['type']) => {
    switch (type) {
      case 'warning':
        return 'border-red-500/30 bg-red-500/5';
      case 'opportunity':
        return 'border-amber-500/30 bg-amber-500/5';
      case 'suggestion':
        return 'border-blue-500/30 bg-blue-500/5';
      default:
        return 'border-slate-700 bg-slate-800/50';
    }
  };

  const getPriorityBadge = (priority: Whisper['priority']) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold uppercase rounded">Urgent</span>;
      case 'medium':
        return <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase rounded">Important</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse text-amber-400/50 text-sm">The Oracle is observing patterns...</div>
      </div>
    );
  }

  if (visibleWhispers.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-800/30 rounded-2xl border border-slate-700/50">
        <div className="text-3xl mb-3">🔮</div>
        <p className="text-slate-400 text-sm">The Oracle sees clearly. No whispers at this time.</p>
        <button 
          onClick={loadWhispers}
          className="mt-4 text-xs text-amber-500 hover:text-amber-400 transition-colors"
        >
          Refresh Insights
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔮</span>
          <div>
            <h3 className="font-bold text-slate-200">Oracle Whispers</h3>
            <p className="text-xs text-slate-500">Patterns detected across your campaigns</p>
          </div>
        </div>
        <button 
          onClick={loadWhispers}
          className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {visibleWhispers.map((whisper) => (
        <div 
          key={whisper.id}
          className={`relative p-5 rounded-xl border transition-all hover:scale-[1.01] ${getTypeStyles(whisper.type)}`}
        >
          {/* Dismiss button */}
          <button 
            onClick={() => dismissWhisper(whisper.id)}
            className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors text-sm"
          >
            ✕
          </button>

          <div className="flex items-start gap-4">
            <span className="text-2xl flex-shrink-0">{whisper.icon}</span>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-slate-200 text-sm">{whisper.title}</h4>
                {getPriorityBadge(whisper.priority)}
              </div>
              
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                {whisper.message}
              </p>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  {whisper.category}
                </span>
                
                {whisper.actionLabel && onActionClick && (
                  <button
                    onClick={() => onActionClick(whisper)}
                    className="text-xs text-amber-500 hover:text-amber-400 font-medium transition-colors"
                  >
                    {whisper.actionLabel} →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
