/**
 * Proactive Whispers - Pattern Detection & Insights
 * Oracle notices patterns across campaigns and provides strategic suggestions
 */

import { oracleStorage, StoredCampaign, StoredAsset } from './storageService';

export interface Whisper {
  id: string;
  type: 'insight' | 'suggestion' | 'warning' | 'opportunity';
  category: 'assets' | 'engagement' | 'trends' | 'optimization' | 'timing';
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high';
  icon: string;
  createdAt: number;
}

export async function generateWhispers(): Promise<Whisper[]> {
  const whispers: Whisper[] = [];
  
  try {
    const [campaigns, assets] = await Promise.all([
      oracleStorage.getAllCampaigns(),
      oracleStorage.getAllAssets()
    ]);

    // Analyze patterns
    whispers.push(...analyzeAssetDistribution(assets));
    whispers.push(...analyzeCampaignPatterns(campaigns));
    whispers.push(...analyzeTimingPatterns(campaigns));
    whispers.push(...generateOpportunities(campaigns, assets));
    whispers.push(...analyzePillarUsage(campaigns));

  } catch (error) {
    console.error('Failed to generate whispers:', error);
  }

  // Sort by priority and limit
  return whispers
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5);
}

function analyzeAssetDistribution(assets: StoredAsset[]): Whisper[] {
  const whispers: Whisper[] = [];
  
  if (assets.length === 0) return whispers;

  const byType: Record<string, number> = {};
  assets.forEach(a => {
    byType[a.type] = (byType[a.type] || 0) + 1;
  });

  const total = assets.length;
  const types = Object.entries(byType);

  // Check for underused asset types
  const assetTypes = ['meme', 'banner', 'storyboard', 'carousel'];
  assetTypes.forEach(type => {
    if (!byType[type] || byType[type] < total * 0.1) {
      whispers.push({
        id: `whisper_asset_${type}_${Date.now()}`,
        type: 'suggestion',
        category: 'assets',
        title: `${type.charAt(0).toUpperCase() + type.slice(1)}s Underused`,
        message: `You've created few ${type}s. ${getAssetSuggestion(type)}`,
        priority: 'medium',
        icon: getAssetIcon(type),
        createdAt: Date.now()
      });
    }
  });

  // Check for over-reliance on one type
  types.forEach(([type, count]) => {
    if (count > total * 0.6) {
      whispers.push({
        id: `whisper_overuse_${type}_${Date.now()}`,
        type: 'insight',
        category: 'assets',
        title: 'Asset Mix Imbalance',
        message: `${Math.round(count/total*100)}% of your assets are ${type}s. Diversifying could reach different audience segments.`,
        priority: 'low',
        icon: '⚖️',
        createdAt: Date.now()
      });
    }
  });

  return whispers;
}

function analyzeCampaignPatterns(campaigns: StoredCampaign[]): Whisper[] {
  const whispers: Whisper[] = [];
  
  if (campaigns.length < 2) return whispers;

  // Analyze health score trends
  const recentCampaigns = campaigns.slice(0, 5);
  const avgHealth = recentCampaigns.reduce((sum, c) => sum + (c.healthScore || 0), 0) / recentCampaigns.length;

  if (avgHealth < 60) {
    whispers.push({
      id: `whisper_health_${Date.now()}`,
      type: 'warning',
      category: 'optimization',
      title: 'Health Scores Trending Low',
      message: `Your recent campaigns average ${Math.round(avgHealth)} health. Focus on stronger hooks and clearer CTAs.`,
      priority: 'high',
      icon: '💊',
      createdAt: Date.now()
    });
  } else if (avgHealth >= 80) {
    whispers.push({
      id: `whisper_health_good_${Date.now()}`,
      type: 'insight',
      category: 'optimization',
      title: 'Strong Campaign Performance',
      message: `Your campaigns are averaging ${Math.round(avgHealth)} health. Keep up the momentum!`,
      priority: 'low',
      icon: '🌟',
      createdAt: Date.now()
    });
  }

  // Check for declining health scores
  if (recentCampaigns.length >= 3) {
    const scores = recentCampaigns.map(c => c.healthScore || 0);
    if (scores[0] < scores[1] && scores[1] < scores[2]) {
      whispers.push({
        id: `whisper_declining_${Date.now()}`,
        type: 'warning',
        category: 'optimization',
        title: 'Declining Campaign Quality',
        message: 'Health scores have dropped for 3 consecutive campaigns. Review what changed in your approach.',
        priority: 'high',
        icon: '📉',
        createdAt: Date.now()
      });
    }
  }

  return whispers;
}

function analyzeTimingPatterns(campaigns: StoredCampaign[]): Whisper[] {
  const whispers: Whisper[] = [];
  
  if (campaigns.length === 0) return whispers;

  const lastCampaign = campaigns[0];
  const daysSinceLast = Math.floor((Date.now() - lastCampaign.updatedAt) / (1000 * 60 * 60 * 24));

  if (daysSinceLast > 14) {
    whispers.push({
      id: `whisper_inactive_${Date.now()}`,
      type: 'suggestion',
      category: 'timing',
      title: 'Time for Fresh Content',
      message: `It's been ${daysSinceLast} days since your last campaign. Consistency builds audience trust.`,
      actionLabel: 'Start New Campaign',
      priority: 'medium',
      icon: '📅',
      createdAt: Date.now()
    });
  }

  // Check campaign frequency
  const thisWeek = campaigns.filter(c => 
    c.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  if (thisWeek >= 5) {
    whispers.push({
      id: `whisper_prolific_${Date.now()}`,
      type: 'insight',
      category: 'timing',
      title: 'Prolific Week',
      message: `You've created ${thisWeek} campaigns this week. Make sure quality matches quantity.`,
      priority: 'low',
      icon: '🔥',
      createdAt: Date.now()
    });
  }

  return whispers;
}

function generateOpportunities(campaigns: StoredCampaign[], assets: StoredAsset[]): Whisper[] {
  const whispers: Whisper[] = [];

  // Suggest trending content types
  const now = new Date();
  const month = now.getMonth();
  const dayOfWeek = now.getDay();

  // Seasonal suggestions
  if (month === 11 || month === 0) { // Dec or Jan
    whispers.push({
      id: `whisper_seasonal_${Date.now()}`,
      type: 'opportunity',
      category: 'trends',
      title: 'New Year Campaign Opportunity',
      message: 'New Year resolutions drive high engagement. Consider "fresh start" and "transformation" themes.',
      priority: 'medium',
      icon: '🎯',
      createdAt: Date.now()
    });
  }

  // Day-specific suggestions
  if (dayOfWeek === 1) { // Monday
    whispers.push({
      id: `whisper_monday_${Date.now()}`,
      type: 'opportunity',
      category: 'timing',
      title: 'Monday Motivation',
      message: 'Motivation content performs well on Mondays. Perfect time for a new campaign launch.',
      priority: 'low',
      icon: '💪',
      createdAt: Date.now()
    });
  }

  // Suggest carousels for LinkedIn if underused
  const carouselCount = assets.filter(a => a.type === 'carousel').length;
  if (carouselCount < 3 && campaigns.length > 2) {
    whispers.push({
      id: `whisper_carousel_${Date.now()}`,
      type: 'opportunity',
      category: 'trends',
      title: 'LinkedIn Carousel Opportunity',
      message: 'Carousels are driving high engagement on LinkedIn. Consider adding more to your mix.',
      priority: 'medium',
      icon: '🎠',
      createdAt: Date.now()
    });
  }

  return whispers;
}

function analyzePillarUsage(campaigns: StoredCampaign[]): Whisper[] {
  const whispers: Whisper[] = [];
  
  if (campaigns.length < 3) return whispers;

  const pillarCount: Record<string, number> = {};
  campaigns.forEach(c => {
    (c.brief?.meta?.pillars || []).forEach((p: string) => {
      pillarCount[p] = (pillarCount[p] || 0) + 1;
    });
  });

  const total = campaigns.length;
  const pillars = Object.entries(pillarCount);

  // Find underused pillars
  const allPillars = ['primal_flow_fusion', 'animator_shift', 'moments'];
  allPillars.forEach(pillar => {
    if (!pillarCount[pillar] || pillarCount[pillar] < total * 0.2) {
      whispers.push({
        id: `whisper_pillar_${pillar}_${Date.now()}`,
        type: 'suggestion',
        category: 'optimization',
        title: `Underused Pillar: ${pillar.replace(/_/g, ' ')}`,
        message: `The "${pillar.replace(/_/g, ' ')}" pillar hasn't been featured much. It could open new creative angles.`,
        priority: 'low',
        icon: '🏛️',
        createdAt: Date.now()
      });
    }
  });

  return whispers;
}

function getAssetSuggestion(type: string): string {
  const suggestions: Record<string, string> = {
    meme: 'Memes drive high shareability and relatability.',
    banner: 'Banners are great for professional platforms and ads.',
    storyboard: 'Storyboards help visualize video concepts before production.',
    carousel: 'Carousels drive deep engagement, especially on LinkedIn.',
  };
  return suggestions[type] || '';
}

function getAssetIcon(type: string): string {
  const icons: Record<string, string> = {
    meme: '🖼️',
    banner: '🎨',
    storyboard: '🎬',
    carousel: '🎠',
  };
  return icons[type] || '📦';
}

export default generateWhispers;
