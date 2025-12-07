/**
 * Trending Topics Service
 * Fetches current viral trends that can bridge to fitness/wellness content
 */

import { GoogleGenAI } from "@google/genai";

export interface TrendingTopic {
  name: string;
  category: 'wellness' | 'lifestyle' | 'culture' | 'tech' | 'humor';
  bridgePotential: 'high' | 'medium' | 'low';
}

export interface TrendingTopicsCache {
  topics: TrendingTopic[];
  fetchedAt: number;
  expiresAt: number;
}

const STORAGE_KEY = 'oracle_trending_topics';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Default fallback trends (used if API fails or on first load)
export const DEFAULT_TRENDS: TrendingTopic[] = [
  { name: 'Brown noise sleep', category: 'wellness', bridgePotential: 'high' },
  { name: '5am club', category: 'lifestyle', bridgePotential: 'high' },
  { name: 'Touch grass', category: 'wellness', bridgePotential: 'high' },
  { name: 'Main character energy', category: 'culture', bridgePotential: 'medium' },
  { name: 'Roman Empire thoughts', category: 'humor', bridgePotential: 'medium' },
  { name: 'Very demure very mindful', category: 'lifestyle', bridgePotential: 'high' },
  { name: 'Seasonal depression', category: 'wellness', bridgePotential: 'high' },
  { name: 'Soft life era', category: 'lifestyle', bridgePotential: 'high' },
  { name: 'That girl aesthetic', category: 'lifestyle', bridgePotential: 'high' },
  { name: 'Hot girl walk', category: 'wellness', bridgePotential: 'high' }
];

const getAiInstance = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Get cached trending topics from localStorage
 */
export function getCachedTrendingTopics(): TrendingTopicsCache | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Save trending topics to localStorage
 */
function saveTrendingTopics(topics: TrendingTopic[]): TrendingTopicsCache {
  const cache: TrendingTopicsCache = {
    topics,
    fetchedAt: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION_MS
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  return cache;
}

/**
 * Calculate days since last refresh
 */
export function getDaysSinceRefresh(cache: TrendingTopicsCache | null): number | null {
  if (!cache) return null;
  const diffMs = Date.now() - cache.fetchedAt;
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Get lifespan status for UI badge
 */
export function getLifespanStatus(cache: TrendingTopicsCache | null): {
  label: string;
  color: string;
  bgColor: string;
  shouldRefresh: boolean;
} {
  if (!cache) {
    return {
      label: 'No data',
      color: 'text-slate-500',
      bgColor: 'bg-slate-500/10',
      shouldRefresh: true
    };
  }

  const days = getDaysSinceRefresh(cache);
  if (days === null) {
    return {
      label: 'Unknown',
      color: 'text-slate-500',
      bgColor: 'bg-slate-500/10',
      shouldRefresh: true
    };
  }

  if (days === 0) {
    return {
      label: 'Fresh today',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      shouldRefresh: false
    };
  } else if (days <= 3) {
    return {
      label: `${days}d ago`,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      shouldRefresh: false
    };
  } else if (days <= 7) {
    return {
      label: `${days}d ago`,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      shouldRefresh: false
    };
  } else if (days <= 14) {
    return {
      label: `${days}d ago`,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      shouldRefresh: true
    };
  } else {
    return {
      label: `${days}d ago`,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      shouldRefresh: true
    };
  }
}

/**
 * Fetch fresh trending topics from AI
 */
export async function fetchTrendingTopics(): Promise<TrendingTopicsCache> {
  const ai = getAiInstance();

  const prompt = `You are a social media trend analyst. Identify the TOP 10 current viral trends, memes, or cultural moments that could authentically bridge to fitness, wellness, mindfulness, or personal transformation content.

Focus on trends that are:
- Currently active on TikTok, Instagram, or Twitter/X
- Have emotional resonance (identity, struggle, aspiration, humor)
- Can naturally connect to: physical movement/exercise, mindfulness/awareness, or identity/consciousness shifts

For each trend, provide:
- name: The trend name as people search/use it (keep it concise)
- category: One of: wellness, lifestyle, culture, tech, humor
- bridgePotential: high/medium/low (how naturally it connects to fitness/wellness)

Prioritize trends with HIGH bridge potential - we need authentic connections, not forced ones.

Return ONLY valid JSON array, no markdown:
[
  {"name": "trend name", "category": "wellness", "bridgePotential": "high"},
  ...
]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });

    const text = response.text || '';
    
    // Clean response
    let cleanJson = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    // Extract JSON array
    const startIdx = cleanJson.indexOf('[');
    const endIdx = cleanJson.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1) {
      cleanJson = cleanJson.slice(startIdx, endIdx + 1);
    }

    const topics: TrendingTopic[] = JSON.parse(cleanJson);
    
    // Validate and limit to 10
    const validTopics = topics
      .filter(t => t.name && t.category && t.bridgePotential)
      .slice(0, 10);

    if (validTopics.length === 0) {
      throw new Error('No valid topics parsed');
    }

    return saveTrendingTopics(validTopics);
  } catch (error) {
    console.error('Failed to fetch trending topics:', error);
    // Return defaults on failure
    return saveTrendingTopics(DEFAULT_TRENDS);
  }
}

/**
 * Get trending topics - from cache or fetch fresh
 */
export async function getTrendingTopics(forceRefresh = false): Promise<TrendingTopicsCache> {
  const cached = getCachedTrendingTopics();
  
  if (!forceRefresh && cached && Date.now() < cached.expiresAt) {
    return cached;
  }

  return fetchTrendingTopics();
}

/**
 * Initialize trending topics on first load
 */
export function initializeTrendingTopics(): TrendingTopicsCache {
  const cached = getCachedTrendingTopics();
  if (cached) return cached;
  
  // First time - save defaults
  return saveTrendingTopics(DEFAULT_TRENDS);
}