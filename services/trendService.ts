/**
 * Trend Hijacker Service v2.0
 * Analyzes viral trends and bridges them to EcoGym's three pillars
 * Enhanced with: All-pillar routing, hashtags, related trends, bridge strength
 */

import { GoogleGenAI } from "@google/genai";

// The 10 Moments Categories for precise routing
const MOMENTS_CATEGORIES = {
  // Mindfulness Series (001-050)
  awareness: { icon: '🧠', focus: 'Presence, internal witnessing' },
  energy: { icon: '⚡', focus: 'Activating vitality, somatic intelligence' },
  intention: { icon: '✨', focus: 'Purposeful direction, conscious choice' },
  spiritual: { icon: '⭐', focus: 'Transcendent connection, expanded identity' },
  transformation: { icon: '✓', focus: 'Identity shifts, integration, embodiment' },
  // Animist Shift Series (051-100)
  earth_awareness: { icon: '🌿', focus: 'Grounding, relational ecology' },
  elemental_energy: { icon: '🌊', focus: 'Water, fire, earth, air wisdom' },
  kinship_reciprocity: { icon: '🤝', focus: 'Mutual aid, gift cycles' },
  seasonal_wisdom: { icon: '☀️🌙', focus: 'Natural rhythms, cyclical intelligence' },
  living_world: { icon: '👁️', focus: 'Planetary self-recognition' }
} as const;

export interface ContentBrief {
  format: 'meme' | 'video' | 'carousel' | 'ugc';
  concept: string;
  hook: string;
  cta: string;
  hashtags: string[];
  platforms: string[];
  productionEffort: 'low' | 'medium' | 'high';
  estimatedReach: 'niche' | 'moderate' | 'viral';
}

export interface TrendAnalysis {
  trend: string;
  trendContext: {
    origin: string;
    peakPlatforms: string[];
    audienceDemo: string;
    emotionalCore: string;
    lifespan: 'flash' | 'wave' | 'cultural_shift';
  };
  pillarRouting: {
    primary: 'PFF' | 'TAS' | 'Moments';
    secondary?: 'PFF' | 'TAS' | 'Moments';
    tertiary?: 'PFF' | 'TAS' | 'Moments';
    reasoning: string;
    pffAngle?: string;
    tasAngle?: string;
    momentsAngle?: string;
  };
  momentsCategory?: {
    category: keyof typeof MOMENTS_CATEGORIES;
    icon: string;
    rationale: string;
  };
  bridgeStrategy: {
    angle: string;
    hook: string;
    subversion?: string;
    bridgeStrength: number;
    bridgeRationale: string;
  };
  contentBriefs: ContentBrief[];
  timing: {
    urgency: 'immediate' | 'this_week' | 'evergreen';
    bestPostTimes: {
      platform: string;
      days: string[];
      times: string[];
    }[];
    peakWindow?: string;
  };
  relatedTrends: {
    trend: string;
    synergy: string;
  }[];
  risks: string[];
  analyzedAt: number;
}

const getAiInstance = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export async function analyzeTrend(
  trendInput: string,
  additionalContext?: string
): Promise<TrendAnalysis> {
  const ai = getAiInstance();

  const prompt = `You are a viral trend strategist for EcoGym, a fitness/wellness brand with three content pillars:

**PILLAR 1: Primal Flow Fusion (PFF)** 💪
- Domain: Body/Physical
- Philosophy: Power refined into intelligent strength (70/30 formula)
- Content: Home workouts, form guides, challenges, morning routines, physical movement
- Keywords: strength, movement, body, workout, physical, exercise, energy, vitality

**PILLAR 2: The Animator Shift (TAS)** 🧘
- Domain: Consciousness/Identity
- Philosophy: Change the current, not the content
- Content: 7-min meditations, outcome-based practices, walking meditations, identity work
- Keywords: identity, mindset, consciousness, meditation, intention, awareness, shift

**PILLAR 3: Moments** ⚡
- Domain: Micro-awareness/Daily Practice
- Philosophy: Chip away at autopilot with 200+ one-minute micro-practices
- Categories:
  - Mindfulness: Awareness 🧠, Energy ⚡, Intention ✨, Spiritual ⭐, Transformation ✓
  - Animist Shift: Earth Awareness 🌿, Elemental Energy 🌊, Kinship 🤝, Seasonal Wisdom ☀️🌙, Living World 👁️
- Keywords: micro-practice, daily, routine, habit, moment, presence, autopilot

**IMPORTANT**: Most trends can connect to ALL THREE pillars from different angles. Always consider how the trend could authentically bridge to each pillar, even if one is primary.

Analyze this trend and create a strategic bridge to EcoGym:

**TREND:** ${trendInput}
${additionalContext ? `**CONTEXT:** ${additionalContext}` : ''}

Respond in this exact JSON structure:
{
  "trend": "the trend name/phrase",
  "trendContext": {
    "origin": "where this trend originated",
    "peakPlatforms": ["TikTok", "Instagram", etc],
    "audienceDemo": "who's engaging with this",
    "emotionalCore": "the underlying emotional driver",
    "lifespan": "flash|wave|cultural_shift"
  },
  "pillarRouting": {
    "primary": "PFF|TAS|Moments",
    "secondary": "PFF|TAS|Moments or null",
    "tertiary": "PFF|TAS|Moments or null (include if authentically relevant)",
    "reasoning": "why these pillars in this order",
    "pffAngle": "specific angle for PFF content (always include if any physical/body connection exists)",
    "tasAngle": "specific angle for TAS content (always include if any identity/consciousness connection exists)",
    "momentsAngle": "specific angle for Moments content (always include if any micro-practice connection exists)"
  },
  "momentsCategory": {
    "category": "awareness|energy|intention|spiritual|transformation|earth_awareness|elemental_energy|kinship_reciprocity|seasonal_wisdom|living_world",
    "icon": "the emoji",
    "rationale": "why this category fits"
  },
  "bridgeStrategy": {
    "angle": "how EcoGym enters this conversation",
    "hook": "the attention-grabbing opener (make this POWERFUL and memorable)",
    "subversion": "twist that makes it uniquely EcoGym",
    "bridgeStrength": 85,
    "bridgeRationale": "why this bridge works (or doesn't) - score 1-100 based on authenticity and fit"
  },
  "contentBriefs": [
    {
      "format": "meme|video|carousel|ugc",
      "concept": "detailed concept description",
      "hook": "opening line/text",
      "cta": "call to action",
      "hashtags": ["#EcoGym", "#relevant", "#tags", "#5-8total"],
      "platforms": ["TikTok", "Instagram"],
      "productionEffort": "low|medium|high",
      "estimatedReach": "niche|moderate|viral"
    }
  ],
  "timing": {
    "urgency": "immediate|this_week|evergreen",
    "bestPostTimes": [
      {
        "platform": "TikTok",
        "days": ["Tuesday", "Thursday"],
        "times": ["7am EST", "6pm EST"]
      }
    ],
    "peakWindow": "if flash trend, when does it expire"
  },
  "relatedTrends": [
    {
      "trend": "related viral trend name",
      "synergy": "how it connects and could be combined"
    }
  ],
  "risks": ["potential pitfalls to avoid"]
}

Generate 4 content briefs covering different formats. Be creative but strategic. The bridge should feel AUTHENTIC, not forced. Rate bridgeStrength honestly - some trends fit better than others.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    const analysis = JSON.parse(response.text) as TrendAnalysis;
    analysis.analyzedAt = Date.now();
    
    return analysis;
  } catch (error: any) {
    console.error("Trend analysis error:", error);
    throw new Error("Failed to analyze trend. The oracle's vision was unclear.");
  }
}

export async function batchAnalyzeTrends(trends: string[]): Promise<TrendAnalysis[]> {
  const results = await Promise.allSettled(
    trends.map(trend => analyzeTrend(trend))
  );
  
  return results
    .filter((r): r is PromiseFulfilledResult<TrendAnalysis> => r.status === 'fulfilled')
    .map(r => r.value);
}

export function getMomentsCategoryInfo(category: keyof typeof MOMENTS_CATEGORIES) {
  return MOMENTS_CATEGORIES[category];
}

export function getBridgeStrengthLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Perfect Fit', color: 'text-emerald-400' };
  if (score >= 70) return { label: 'Strong Bridge', color: 'text-green-400' };
  if (score >= 50) return { label: 'Viable', color: 'text-amber-400' };
  if (score >= 30) return { label: 'Stretch', color: 'text-orange-400' };
  return { label: 'Forced', color: 'text-rose-400' };
}

export function getProductionEffortInfo(effort: 'low' | 'medium' | 'high') {
  const info = {
    low: { label: 'Quick Win', icon: '⚡', color: 'text-emerald-400', time: '< 1 hour' },
    medium: { label: 'Standard', icon: '🔧', color: 'text-amber-400', time: '1-4 hours' },
    high: { label: 'Production', icon: '🎬', color: 'text-rose-400', time: '4+ hours' }
  };
  return info[effort];
}

export { MOMENTS_CATEGORIES };