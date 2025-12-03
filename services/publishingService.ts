/**
 * Direct Publishing Service - Platform API Integration Stubs
 * Ready for OAuth and API integration when credentials are available
 */

export type Platform = 'meta' | 'tiktok' | 'linkedin' | 'twitter';

export interface PlatformCredentials {
  platform: Platform;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  accountId?: string;
  accountName?: string;
}

export interface PublishRequest {
  platform: Platform;
  content: {
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
    link?: string;
    hashtags?: string[];
  };
  scheduling?: {
    publishAt?: Date;
    timezone?: string;
  };
}

export interface PublishResult {
  success: boolean;
  platform: Platform;
  postId?: string;
  postUrl?: string;
  error?: string;
  publishedAt?: number;
}

export interface PlatformConfig {
  platform: Platform;
  name: string;
  icon: string;
  color: string;
  supportsImages: boolean;
  supportsVideo: boolean;
  supportsScheduling: boolean;
  maxTextLength: number;
  aspectRatios: string[];
  authUrl?: string;
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  meta: {
    platform: 'meta',
    name: 'Meta (Instagram/Facebook)',
    icon: '📘',
    color: '#1877F2',
    supportsImages: true,
    supportsVideo: true,
    supportsScheduling: true,
    maxTextLength: 2200,
    aspectRatios: ['1:1', '4:5', '9:16'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth'
  },
  tiktok: {
    platform: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    supportsImages: false,
    supportsVideo: true,
    supportsScheduling: false,
    maxTextLength: 2200,
    aspectRatios: ['9:16'],
    authUrl: 'https://www.tiktok.com/auth/authorize/'
  },
  linkedin: {
    platform: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    supportsImages: true,
    supportsVideo: true,
    supportsScheduling: true,
    maxTextLength: 3000,
    aspectRatios: ['1:1', '16:9', '4:5'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization'
  },
  twitter: {
    platform: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    color: '#000000',
    supportsImages: true,
    supportsVideo: true,
    supportsScheduling: true,
    maxTextLength: 280,
    aspectRatios: ['16:9', '1:1'],
    authUrl: 'https://twitter.com/i/oauth2/authorize'
  }
};

// In-memory credential storage (would use secure storage in production)
const storedCredentials: Map<Platform, PlatformCredentials> = new Map();

export function getStoredCredentials(platform: Platform): PlatformCredentials | null {
  return storedCredentials.get(platform) || null;
}

export function storeCredentials(credentials: PlatformCredentials): void {
  storedCredentials.set(credentials.platform, credentials);
}

export function removeCredentials(platform: Platform): void {
  storedCredentials.delete(platform);
}

export function getConnectedPlatforms(): Platform[] {
  return Array.from(storedCredentials.keys());
}

// OAuth Flow Stubs
export async function initiateOAuth(platform: Platform): Promise<string> {
  const config = PLATFORM_CONFIGS[platform];
  
  // In production, this would redirect to the OAuth URL with proper client_id, redirect_uri, etc.
  console.log(`[Publishing] Initiating OAuth for ${platform}`);
  
  // Return mock auth URL for now
  return `${config.authUrl}?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=publish`;
}

export async function handleOAuthCallback(
  platform: Platform, 
  code: string
): Promise<PlatformCredentials> {
  // In production, this would exchange the code for access tokens
  console.log(`[Publishing] Handling OAuth callback for ${platform} with code: ${code}`);
  
  // Mock credentials
  const credentials: PlatformCredentials = {
    platform,
    accessToken: `mock_access_token_${platform}_${Date.now()}`,
    refreshToken: `mock_refresh_token_${platform}`,
    expiresAt: Date.now() + 3600000, // 1 hour
    accountId: `account_${platform}`,
    accountName: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`
  };
  
  storeCredentials(credentials);
  return credentials;
}

// Publishing Functions
export async function publishToMeta(request: PublishRequest): Promise<PublishResult> {
  const credentials = getStoredCredentials('meta');
  
  if (!credentials) {
    return {
      success: false,
      platform: 'meta',
      error: 'Not authenticated with Meta. Please connect your account.'
    };
  }
  
  // API stub - would call Meta Graph API
  console.log('[Publishing] Publishing to Meta:', request);
  
  // Mock success response
  return {
    success: true,
    platform: 'meta',
    postId: `meta_post_${Date.now()}`,
    postUrl: `https://www.instagram.com/p/mock_post_id/`,
    publishedAt: Date.now()
  };
}

export async function publishToTikTok(request: PublishRequest): Promise<PublishResult> {
  const credentials = getStoredCredentials('tiktok');
  
  if (!credentials) {
    return {
      success: false,
      platform: 'tiktok',
      error: 'Not authenticated with TikTok. Please connect your account.'
    };
  }
  
  if (!request.content.videoUrl) {
    return {
      success: false,
      platform: 'tiktok',
      error: 'TikTok requires video content.'
    };
  }
  
  console.log('[Publishing] Publishing to TikTok:', request);
  
  return {
    success: true,
    platform: 'tiktok',
    postId: `tiktok_post_${Date.now()}`,
    postUrl: `https://www.tiktok.com/@user/video/mock_video_id`,
    publishedAt: Date.now()
  };
}

export async function publishToLinkedIn(request: PublishRequest): Promise<PublishResult> {
  const credentials = getStoredCredentials('linkedin');
  
  if (!credentials) {
    return {
      success: false,
      platform: 'linkedin',
      error: 'Not authenticated with LinkedIn. Please connect your account.'
    };
  }
  
  console.log('[Publishing] Publishing to LinkedIn:', request);
  
  return {
    success: true,
    platform: 'linkedin',
    postId: `linkedin_post_${Date.now()}`,
    postUrl: `https://www.linkedin.com/feed/update/mock_update_id/`,
    publishedAt: Date.now()
  };
}

export async function publishToTwitter(request: PublishRequest): Promise<PublishResult> {
  const credentials = getStoredCredentials('twitter');
  
  if (!credentials) {
    return {
      success: false,
      platform: 'twitter',
      error: 'Not authenticated with X. Please connect your account.'
    };
  }
  
  if (request.content.text && request.content.text.length > 280) {
    return {
      success: false,
      platform: 'twitter',
      error: 'Tweet exceeds 280 character limit.'
    };
  }
  
  console.log('[Publishing] Publishing to X:', request);
  
  return {
    success: true,
    platform: 'twitter',
    postId: `tweet_${Date.now()}`,
    postUrl: `https://twitter.com/user/status/mock_tweet_id`,
    publishedAt: Date.now()
  };
}

// Universal publish function
export async function publish(request: PublishRequest): Promise<PublishResult> {
  switch (request.platform) {
    case 'meta':
      return publishToMeta(request);
    case 'tiktok':
      return publishToTikTok(request);
    case 'linkedin':
      return publishToLinkedIn(request);
    case 'twitter':
      return publishToTwitter(request);
    default:
      return {
        success: false,
        platform: request.platform,
        error: 'Unknown platform'
      };
  }
}

// Bulk publish to multiple platforms
export async function publishToAll(
  platforms: Platform[],
  content: PublishRequest['content']
): Promise<PublishResult[]> {
  const results = await Promise.all(
    platforms.map(platform => publish({ platform, content }))
  );
  return results;
}

// Schedule a post
export interface ScheduledPost {
  id: string;
  request: PublishRequest;
  scheduledFor: number;
  status: 'pending' | 'published' | 'failed';
  result?: PublishResult;
}

const scheduledPosts: Map<string, ScheduledPost> = new Map();

export function schedulePost(request: PublishRequest): ScheduledPost {
  const id = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const scheduledFor = request.scheduling?.publishAt?.getTime() || Date.now() + 3600000;
  
  const post: ScheduledPost = {
    id,
    request,
    scheduledFor,
    status: 'pending'
  };
  
  scheduledPosts.set(id, post);
  return post;
}

export function getScheduledPosts(): ScheduledPost[] {
  return Array.from(scheduledPosts.values())
    .filter(p => p.status === 'pending')
    .sort((a, b) => a.scheduledFor - b.scheduledFor);
}

export function cancelScheduledPost(id: string): boolean {
  return scheduledPosts.delete(id);
}
