/**
 * Feedback Loop Service - Performance Tracking & Learning
 * Tracks what works and feeds insights back into campaign strategy
 */

import { oracleStorage } from './storageService';

export interface PerformanceMetrics {
  views?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  engagementRate?: number;
  clickThroughRate?: number;
  reach?: number;
  followers?: number;
}

export interface AssetPerformance {
  id: string;
  assetId: string;
  assetType: 'meme' | 'banner' | 'storyboard' | 'carousel' | 'video';
  campaignId?: string;
  platform: string;
  postUrl?: string;
  metrics: PerformanceMetrics;
  recordedAt: number;
  notes?: string;
}

export interface PerformanceInsight {
  type: 'top_performer' | 'underperformer' | 'trend' | 'recommendation';
  title: string;
  message: string;
  assetIds?: string[];
  metric?: string;
  value?: number;
}

// In-memory storage (would be IndexedDB in full implementation)
const performanceData: Map<string, AssetPerformance[]> = new Map();

export function recordPerformance(data: Omit<AssetPerformance, 'id' | 'recordedAt'>): AssetPerformance {
  const record: AssetPerformance = {
    ...data,
    id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    recordedAt: Date.now()
  };

  const existing = performanceData.get(data.assetId) || [];
  existing.push(record);
  performanceData.set(data.assetId, existing);

  return record;
}

export function getAssetPerformance(assetId: string): AssetPerformance[] {
  return performanceData.get(assetId) || [];
}

export function getAllPerformanceData(): AssetPerformance[] {
  const all: AssetPerformance[] = [];
  performanceData.forEach(records => all.push(...records));
  return all.sort((a, b) => b.recordedAt - a.recordedAt);
}

// Calculate engagement rate
export function calculateEngagementRate(metrics: PerformanceMetrics): number {
  const engagements = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0) + (metrics.saves || 0);
  const reach = metrics.reach || metrics.impressions || metrics.views || 1;
  return (engagements / reach) * 100;
}

// Analyze performance and generate insights
export async function generatePerformanceInsights(): Promise<PerformanceInsight[]> {
  const insights: PerformanceInsight[] = [];
  const allData = getAllPerformanceData();

  if (allData.length === 0) {
    return [{
      type: 'recommendation',
      title: 'Start Tracking',
      message: 'Log performance metrics for your published assets to unlock insights.'
    }];
  }

  // Group by asset type
  const byType: Record<string, AssetPerformance[]> = {};
  allData.forEach(d => {
    if (!byType[d.assetType]) byType[d.assetType] = [];
    byType[d.assetType].push(d);
  });

  // Find top performers
  const withEngagement = allData
    .map(d => ({
      ...d,
      engagementRate: calculateEngagementRate(d.metrics)
    }))
    .filter(d => d.engagementRate > 0)
    .sort((a, b) => b.engagementRate - a.engagementRate);

  if (withEngagement.length > 0) {
    const top = withEngagement[0];
    insights.push({
      type: 'top_performer',
      title: 'Top Performing Asset',
      message: `Your ${top.assetType} on ${top.platform} achieved ${top.engagementRate.toFixed(2)}% engagement.`,
      assetIds: [top.assetId],
      metric: 'engagementRate',
      value: top.engagementRate
    });
  }

  // Find best performing type
  const typeAvgEngagement: Record<string, number> = {};
  Object.entries(byType).forEach(([type, records]) => {
    const avgEng = records.reduce((sum, r) => sum + calculateEngagementRate(r.metrics), 0) / records.length;
    typeAvgEngagement[type] = avgEng;
  });

  const bestType = Object.entries(typeAvgEngagement)
    .sort((a, b) => b[1] - a[1])[0];

  if (bestType && bestType[1] > 0) {
    insights.push({
      type: 'trend',
      title: 'Best Content Type',
      message: `${bestType[0].charAt(0).toUpperCase() + bestType[0].slice(1)}s perform best with ${bestType[1].toFixed(2)}% avg engagement.`,
      metric: 'avgEngagement',
      value: bestType[1]
    });
  }

  // Platform comparison
  const byPlatform: Record<string, AssetPerformance[]> = {};
  allData.forEach(d => {
    if (!byPlatform[d.platform]) byPlatform[d.platform] = [];
    byPlatform[d.platform].push(d);
  });

  const platformAvgEngagement: Record<string, number> = {};
  Object.entries(byPlatform).forEach(([platform, records]) => {
    const avgEng = records.reduce((sum, r) => sum + calculateEngagementRate(r.metrics), 0) / records.length;
    platformAvgEngagement[platform] = avgEng;
  });

  const bestPlatform = Object.entries(platformAvgEngagement)
    .sort((a, b) => b[1] - a[1])[0];

  if (bestPlatform && bestPlatform[1] > 0) {
    insights.push({
      type: 'trend',
      title: 'Top Platform',
      message: `${bestPlatform[0]} drives the highest engagement at ${bestPlatform[1].toFixed(2)}%.`,
      metric: 'platformEngagement',
      value: bestPlatform[1]
    });
  }

  // Check for underperformers
  const underperformers = withEngagement.filter(d => d.engagementRate < 1);
  if (underperformers.length > 2) {
    insights.push({
      type: 'underperformer',
      title: 'Low Engagement Assets',
      message: `${underperformers.length} assets have under 1% engagement. Consider revising hooks or visuals.`,
      assetIds: underperformers.slice(0, 3).map(d => d.assetId)
    });
  }

  // Recommendations based on patterns
  if (Object.keys(byType).length < 3) {
    const missingTypes = ['meme', 'banner', 'carousel', 'video'].filter(t => !byType[t]);
    if (missingTypes.length > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Diversify Content',
        message: `You haven't tracked any ${missingTypes.slice(0, 2).join(' or ')} performance. Consider testing these formats.`
      });
    }
  }

  return insights.slice(0, 5);
}

// Score an asset based on historical performance patterns
export interface AssetScorePrediction {
  predictedEngagement: 'low' | 'medium' | 'high';
  confidence: number;
  factors: string[];
}

export async function predictAssetPerformance(
  assetType: string,
  platform: string,
  promptKeywords: string[]
): Promise<AssetScorePrediction> {
  const allData = getAllPerformanceData();
  
  // Find similar historical assets
  const similar = allData.filter(d => 
    d.assetType === assetType || d.platform === platform
  );

  if (similar.length < 3) {
    return {
      predictedEngagement: 'medium',
      confidence: 0.3,
      factors: ['Insufficient historical data for accurate prediction']
    };
  }

  const avgEngagement = similar.reduce((sum, d) => 
    sum + calculateEngagementRate(d.metrics), 0
  ) / similar.length;

  const factors: string[] = [];

  // Analyze by type
  const typeData = similar.filter(d => d.assetType === assetType);
  if (typeData.length > 0) {
    const typeAvg = typeData.reduce((sum, d) => sum + calculateEngagementRate(d.metrics), 0) / typeData.length;
    if (typeAvg > avgEngagement * 1.2) {
      factors.push(`${assetType}s historically outperform`);
    } else if (typeAvg < avgEngagement * 0.8) {
      factors.push(`${assetType}s historically underperform`);
    }
  }

  // Analyze by platform
  const platformData = similar.filter(d => d.platform === platform);
  if (platformData.length > 0) {
    const platformAvg = platformData.reduce((sum, d) => sum + calculateEngagementRate(d.metrics), 0) / platformData.length;
    if (platformAvg > avgEngagement * 1.2) {
      factors.push(`${platform} shows strong engagement`);
    }
  }

  let prediction: 'low' | 'medium' | 'high' = 'medium';
  if (avgEngagement >= 5) prediction = 'high';
  else if (avgEngagement < 2) prediction = 'low';

  return {
    predictedEngagement: prediction,
    confidence: Math.min(0.9, 0.3 + (similar.length * 0.05)),
    factors: factors.length > 0 ? factors : ['Based on overall historical performance']
  };
}

// Export performance report
export interface PerformanceReport {
  period: string;
  totalAssets: number;
  avgEngagement: number;
  topAssets: { id: string; type: string; platform: string; engagement: number }[];
  byPlatform: Record<string, { count: number; avgEngagement: number }>;
  byType: Record<string, { count: number; avgEngagement: number }>;
  insights: PerformanceInsight[];
}

export async function generatePerformanceReport(
  startDate?: number,
  endDate?: number
): Promise<PerformanceReport> {
  const now = Date.now();
  const start = startDate || now - 30 * 24 * 60 * 60 * 1000; // Default 30 days
  const end = endDate || now;

  const allData = getAllPerformanceData().filter(d => 
    d.recordedAt >= start && d.recordedAt <= end
  );

  const withEngagement = allData.map(d => ({
    ...d,
    engagement: calculateEngagementRate(d.metrics)
  }));

  // By platform
  const byPlatform: Record<string, { count: number; totalEng: number }> = {};
  withEngagement.forEach(d => {
    if (!byPlatform[d.platform]) byPlatform[d.platform] = { count: 0, totalEng: 0 };
    byPlatform[d.platform].count++;
    byPlatform[d.platform].totalEng += d.engagement;
  });

  // By type
  const byType: Record<string, { count: number; totalEng: number }> = {};
  withEngagement.forEach(d => {
    if (!byType[d.assetType]) byType[d.assetType] = { count: 0, totalEng: 0 };
    byType[d.assetType].count++;
    byType[d.assetType].totalEng += d.engagement;
  });

  const avgEngagement = withEngagement.length > 0
    ? withEngagement.reduce((sum, d) => sum + d.engagement, 0) / withEngagement.length
    : 0;

  const topAssets = withEngagement
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5)
    .map(d => ({
      id: d.assetId,
      type: d.assetType,
      platform: d.platform,
      engagement: d.engagement
    }));

  const insights = await generatePerformanceInsights();

  return {
    period: `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`,
    totalAssets: allData.length,
    avgEngagement,
    topAssets,
    byPlatform: Object.fromEntries(
      Object.entries(byPlatform).map(([k, v]) => [k, { 
        count: v.count, 
        avgEngagement: v.totalEng / v.count 
      }])
    ),
    byType: Object.fromEntries(
      Object.entries(byType).map(([k, v]) => [k, { 
        count: v.count, 
        avgEngagement: v.totalEng / v.count 
      }])
    ),
    insights
  };
}
