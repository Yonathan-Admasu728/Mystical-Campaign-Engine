/**
 * Competitor Scan - Reverse-engineer competitor strategy
 * Analyzes competitor content and extracts strategic insights
 */

import { GoogleGenAI } from "@google/genai";

export interface CompetitorInsight {
  url: string;
  analyzedAt: number;
  brand: {
    name: string;
    industry: string;
    positioning: string;
  };
  voice: {
    tone: string[];
    personality: string;
    keyPhrases: string[];
  };
  strategy: {
    hooks: string[];
    painPoints: string[];
    valueProps: string[];
    ctaStyles: string[];
  };
  visual: {
    colorScheme: string;
    styleNotes: string;
    contentTypes: string[];
  };
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
}

const getAiInstance = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export async function analyzeCompetitor(url: string, additionalContext?: string): Promise<CompetitorInsight> {
  const ai = getAiInstance();
  
  const prompt = `You are a competitive intelligence analyst. Analyze this competitor URL and extract strategic marketing insights.

URL: ${url}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Based on the URL and any knowledge you have about this brand, provide a strategic analysis. If you don't have specific knowledge, make reasonable inferences based on the URL structure and domain.

Respond with valid JSON only:
{
  "brand": {
    "name": "string - brand name",
    "industry": "string - their industry",
    "positioning": "string - how they position themselves"
  },
  "voice": {
    "tone": ["array of tone descriptors like 'professional', 'playful', 'urgent'"],
    "personality": "string - brand personality summary",
    "keyPhrases": ["phrases they likely use repeatedly"]
  },
  "strategy": {
    "hooks": ["attention-grabbing tactics they use"],
    "painPoints": ["customer problems they address"],
    "valueProps": ["key value propositions"],
    "ctaStyles": ["types of calls-to-action they use"]
  },
  "visual": {
    "colorScheme": "description of their color palette",
    "styleNotes": "visual style observations",
    "contentTypes": ["types of content they create"]
  },
  "weaknesses": ["potential gaps in their strategy"],
  "opportunities": ["ways to differentiate from them"],
  "recommendations": ["specific tactical recommendations for competing"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (!response.text) {
      throw new Error("Empty response from analysis");
    }

    const analysis = JSON.parse(response.text);
    
    return {
      url,
      analyzedAt: Date.now(),
      ...analysis
    };
  } catch (error: any) {
    console.error("Competitor analysis failed:", error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

export async function compareStrategies(
  yourBrief: { meta: any; audience: any; creative: any },
  competitorInsight: CompetitorInsight
): Promise<{
  advantages: string[];
  gaps: string[];
  differentiation: string[];
  actionItems: string[];
}> {
  const ai = getAiInstance();
  
  const prompt = `Compare these two marketing strategies and identify competitive advantages.

YOUR STRATEGY:
- Campaign: ${yourBrief.meta.campaign_name}
- Purpose: ${yourBrief.meta.purpose}
- Target: ${yourBrief.audience.archetypes.join(', ')}
- Voice: ${yourBrief.creative.voice_reference}
- Emotional Focus: ${Object.entries(yourBrief.creative.emotional_frequency).map(([k,v]) => `${k}:${v}`).join(', ')}

COMPETITOR (${competitorInsight.brand.name}):
- Positioning: ${competitorInsight.brand.positioning}
- Voice: ${competitorInsight.voice.personality}
- Hooks: ${competitorInsight.strategy.hooks.join(', ')}
- Value Props: ${competitorInsight.strategy.valueProps.join(', ')}
- Weaknesses: ${competitorInsight.weaknesses.join(', ')}

Respond with valid JSON:
{
  "advantages": ["things you do better than competitor"],
  "gaps": ["areas where competitor is stronger"],
  "differentiation": ["unique angles you can own"],
  "actionItems": ["specific next steps to compete effectively"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (!response.text) {
      throw new Error("Empty comparison response");
    }

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Strategy comparison failed:", error);
    throw new Error(`Comparison failed: ${error.message}`);
  }
}

// Quick scan without AI - basic URL parsing
export function quickScan(url: string): Partial<CompetitorInsight> {
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace('www.', '');
  const brandName = domain.split('.')[0];
  
  return {
    url,
    analyzedAt: Date.now(),
    brand: {
      name: brandName.charAt(0).toUpperCase() + brandName.slice(1),
      industry: 'Unknown',
      positioning: 'Analysis pending'
    },
    voice: {
      tone: [],
      personality: 'Requires full analysis',
      keyPhrases: []
    },
    strategy: {
      hooks: [],
      painPoints: [],
      valueProps: [],
      ctaStyles: []
    },
    visual: {
      colorScheme: 'Unknown',
      styleNotes: 'Requires visual analysis',
      contentTypes: []
    },
    weaknesses: [],
    opportunities: ['Run full AI analysis for detailed insights'],
    recommendations: []
  };
}
