/**
 * Oracle Health Score - Campaign Analysis Engine
 * Analyzes blueprint coherence, emotional balance, and strategic alignment
 */

import { CampaignBlueprint, CampaignBrief } from '../types';

export interface HealthScoreResult {
  overall: number; // 0-100
  breakdown: {
    narrativeStrength: number;
    emotionalBalance: number;
    assetCoverage: number;
    hookQuality: number;
    ctaClarity: number;
    pillarAlignment: number;
  };
  insights: HealthInsight[];
  recommendations: string[];
}

export interface HealthInsight {
  type: 'strength' | 'warning' | 'opportunity';
  category: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
}

export function analyzeHealthScore(brief: CampaignBrief, blueprint: CampaignBlueprint): HealthScoreResult {
  const breakdown = {
    narrativeStrength: analyzeNarrativeStrength(blueprint),
    emotionalBalance: analyzeEmotionalBalance(brief, blueprint),
    assetCoverage: analyzeAssetCoverage(brief, blueprint),
    hookQuality: analyzeHookQuality(blueprint),
    ctaClarity: analyzeCtaClarity(blueprint),
    pillarAlignment: analyzePillarAlignment(brief, blueprint),
  };

  const weights = {
    narrativeStrength: 0.20,
    emotionalBalance: 0.15,
    assetCoverage: 0.20,
    hookQuality: 0.20,
    ctaClarity: 0.15,
    pillarAlignment: 0.10,
  };

  const overall = Math.round(
    breakdown.narrativeStrength * weights.narrativeStrength +
    breakdown.emotionalBalance * weights.emotionalBalance +
    breakdown.assetCoverage * weights.assetCoverage +
    breakdown.hookQuality * weights.hookQuality +
    breakdown.ctaClarity * weights.ctaClarity +
    breakdown.pillarAlignment * weights.pillarAlignment
  );

  const insights = generateInsights(brief, blueprint, breakdown);
  const recommendations = generateRecommendations(breakdown, insights);

  return { overall, breakdown, insights, recommendations };
}

function analyzeNarrativeStrength(blueprint: CampaignBlueprint): number {
  let score = 0;
  const narrative = blueprint.narrative_pack;

  // Check hooks (0-25 points)
  const hookCount = narrative.hooks?.length || 0;
  score += Math.min(hookCount * 5, 25);

  // Check pain points (0-20 points)
  const painCount = narrative.pain_points?.length || 0;
  score += Math.min(painCount * 5, 20);

  // Check transformations (0-20 points)
  const transCount = narrative.micro_transformations?.length || 0;
  score += Math.min(transCount * 5, 20);

  // Check taglines (0-20 points)
  const taglineCount = narrative.taglines?.length || 0;
  score += Math.min(taglineCount * 4, 20);

  // Check summary completeness (0-15 points)
  const summary = blueprint.campaign_summary;
  if (summary.one_liner && summary.one_liner.length > 10) score += 5;
  if (summary.core_promise && summary.core_promise.length > 10) score += 5;
  if (summary.tone_description && summary.tone_description.length > 10) score += 5;

  return Math.min(score, 100);
}

function analyzeEmotionalBalance(brief: CampaignBrief, blueprint: CampaignBlueprint): number {
  const freq = brief.creative.emotional_frequency;
  const emotions = blueprint.campaign_summary.primary_emotions || [];
  
  let score = 50; // Base score

  // Check if high-frequency emotions are represented
  const highFreqEmotions = Object.entries(freq)
    .filter(([_, val]) => val >= 7)
    .map(([key]) => key);

  // Bonus for balanced emotional mix
  if (emotions.length >= 2 && emotions.length <= 5) {
    score += 20;
  }

  // Check for emotional diversity
  const hasPositive = emotions.some(e => 
    ['joy', 'inspiration', 'hope', 'excitement', 'empowerment'].some(p => e.toLowerCase().includes(p))
  );
  const hasTension = emotions.some(e => 
    ['urgency', 'fomo', 'frustration', 'challenge'].some(t => e.toLowerCase().includes(t))
  );

  if (hasPositive) score += 15;
  if (hasTension) score += 15;

  // Penalty for extreme imbalance
  const maxFreq = Math.max(...Object.values(freq));
  const minFreq = Math.min(...Object.values(freq));
  if (maxFreq - minFreq > 7) score -= 15;

  return Math.max(0, Math.min(score, 100));
}

function analyzeAssetCoverage(brief: CampaignBrief, blueprint: CampaignBlueprint): number {
  let score = 0;
  const requested = brief.outputs.quantities;
  const generated = {
    memes: blueprint.memes?.length || 0,
    static_banners: blueprint.static_banners?.length || 0,
    short_vertical_videos: blueprint.short_videos?.length || 0,
    ugc_scripts: blueprint.ugc_scripts?.length || 0,
    carousels: blueprint.carousels?.length || 0,
  };

  let totalRequested = 0;
  let totalGenerated = 0;

  Object.keys(requested).forEach(key => {
    const req = requested[key as keyof typeof requested];
    const gen = generated[key as keyof typeof generated] || 0;
    
    if (req > 0) {
      totalRequested++;
      if (gen >= req) {
        totalGenerated++;
      } else if (gen > 0) {
        totalGenerated += gen / req;
      }
    }
  });

  if (totalRequested > 0) {
    score = Math.round((totalGenerated / totalRequested) * 100);
  } else {
    score = 100; // No assets requested
  }

  return score;
}

function analyzeHookQuality(blueprint: CampaignBlueprint): number {
  const hooks = blueprint.narrative_pack.hooks || [];
  if (hooks.length === 0) return 0;

  let score = 0;

  hooks.forEach(hook => {
    // Length check (good hooks are punchy)
    if (hook.length >= 20 && hook.length <= 100) score += 10;
    else if (hook.length < 20) score += 5;
    
    // Pattern recognition for strong hooks
    const hasQuestion = hook.includes('?');
    const hasNumber = /\d/.test(hook);
    const hasEmotionWord = /stop|never|secret|truth|why|how|what if|imagine|finally/i.test(hook);
    const hasYou = /\byou\b/i.test(hook);

    if (hasQuestion) score += 5;
    if (hasNumber) score += 3;
    if (hasEmotionWord) score += 5;
    if (hasYou) score += 2;
  });

  return Math.min(Math.round(score / hooks.length * 4), 100);
}

function analyzeCtaClarity(blueprint: CampaignBlueprint): number {
  const ctas = blueprint.narrative_pack.cta_variants || [];
  if (ctas.length === 0) return 30; // Baseline if no CTAs

  let score = 50;

  // Variety bonus
  if (ctas.length >= 3) score += 20;
  else if (ctas.length >= 2) score += 10;

  // Action word analysis
  const actionWords = ['start', 'join', 'get', 'try', 'discover', 'unlock', 'claim', 'begin', 'transform'];
  const hasActionWords = ctas.some(cta => 
    actionWords.some(word => cta.toLowerCase().includes(word))
  );
  if (hasActionWords) score += 15;

  // Urgency analysis
  const urgencyWords = ['now', 'today', 'free', 'limited', 'exclusive'];
  const hasUrgency = ctas.some(cta => 
    urgencyWords.some(word => cta.toLowerCase().includes(word))
  );
  if (hasUrgency) score += 15;

  return Math.min(score, 100);
}

function analyzePillarAlignment(brief: CampaignBrief, blueprint: CampaignBlueprint): number {
  const requestedPillars = brief.meta.pillars || [];
  const generatedPillars = blueprint.campaign_summary.pillars || [];

  if (requestedPillars.length === 0) return 100;

  const matchCount = requestedPillars.filter(p => 
    generatedPillars.some(gp => gp.toLowerCase().includes(p.toLowerCase()))
  ).length;

  return Math.round((matchCount / requestedPillars.length) * 100);
}

function generateInsights(
  brief: CampaignBrief, 
  blueprint: CampaignBlueprint, 
  breakdown: HealthScoreResult['breakdown']
): HealthInsight[] {
  const insights: HealthInsight[] = [];

  // Narrative insights
  if (breakdown.narrativeStrength >= 80) {
    insights.push({
      type: 'strength',
      category: 'Narrative',
      message: 'Strong narrative foundation with compelling hooks and transformations.',
      impact: 'high'
    });
  } else if (breakdown.narrativeStrength < 50) {
    insights.push({
      type: 'warning',
      category: 'Narrative',
      message: 'Narrative needs more hooks and pain point articulation.',
      impact: 'high'
    });
  }

  // Emotional balance insights
  if (breakdown.emotionalBalance >= 75) {
    insights.push({
      type: 'strength',
      category: 'Emotion',
      message: 'Well-balanced emotional mix creates compelling tension.',
      impact: 'medium'
    });
  } else if (breakdown.emotionalBalance < 50) {
    insights.push({
      type: 'warning',
      category: 'Emotion',
      message: 'Emotional frequencies are imbalanced. Consider adjusting.',
      impact: 'medium'
    });
  }

  // Asset coverage insights
  if (breakdown.assetCoverage < 80) {
    insights.push({
      type: 'warning',
      category: 'Assets',
      message: 'Some requested asset types are under-delivered.',
      impact: 'medium'
    });
  }

  // Hook quality insights
  if (breakdown.hookQuality >= 80) {
    insights.push({
      type: 'strength',
      category: 'Hooks',
      message: 'Scroll-stopping hooks with strong pattern interrupts.',
      impact: 'high'
    });
  } else if (breakdown.hookQuality < 50) {
    insights.push({
      type: 'opportunity',
      category: 'Hooks',
      message: 'Hooks could be punchier. Add questions or numbers.',
      impact: 'high'
    });
  }

  // CTA insights
  if (breakdown.ctaClarity >= 80) {
    insights.push({
      type: 'strength',
      category: 'CTAs',
      message: 'Clear, action-oriented calls to action.',
      impact: 'medium'
    });
  }

  // Pillar alignment
  if (breakdown.pillarAlignment < 100 && breakdown.pillarAlignment > 0) {
    insights.push({
      type: 'warning',
      category: 'Strategy',
      message: 'Not all strategic pillars are reflected in the blueprint.',
      impact: 'low'
    });
  }

  return insights;
}

function generateRecommendations(
  breakdown: HealthScoreResult['breakdown'],
  insights: HealthInsight[]
): string[] {
  const recommendations: string[] = [];

  if (breakdown.hookQuality < 70) {
    recommendations.push('Add more questions and numbers to your hooks for higher engagement.');
  }

  if (breakdown.emotionalBalance < 60) {
    recommendations.push('Balance positive emotions (inspiration, hope) with tension (urgency, FOMO).');
  }

  if (breakdown.narrativeStrength < 60) {
    recommendations.push('Develop more micro-transformations to show the journey.');
  }

  if (breakdown.ctaClarity < 60) {
    recommendations.push('Use stronger action verbs in CTAs: "Unlock", "Claim", "Transform".');
  }

  if (breakdown.assetCoverage < 80) {
    recommendations.push('Consider regenerating the blueprint to meet all asset requirements.');
  }

  // Always add a growth-oriented recommendation
  if (recommendations.length === 0) {
    recommendations.push('Campaign is strong. Consider A/B testing hooks for optimization.');
  }

  return recommendations;
}

// Utility function to get score color
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-gold-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-rose-400';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Strong';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Solid';
  if (score >= 50) return 'Fair';
  if (score >= 40) return 'Needs Work';
  return 'Weak';
}
