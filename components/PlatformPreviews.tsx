/**
 * Platform Preview Components
 * Live mockups for Instagram, TikTok, LinkedIn, etc.
 */

import React from 'react';

interface PreviewProps {
  imageUrl?: string;
  topText?: string;
  bottomText?: string;
  caption?: string;
  headline?: string;
  username?: string;
}

// Phone frame wrapper
const PhoneFrame: React.FC<{ children: React.ReactNode; platform: string }> = ({ children, platform }) => (
  <div className="relative mx-auto" style={{ width: '280px' }}>
    {/* Phone bezel */}
    <div className="relative bg-void-950 rounded-[2.5rem] p-2 shadow-2xl border border-white/10">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-void-950 rounded-b-2xl z-20 flex items-center justify-center">
        <div className="w-12 h-1 bg-void-800 rounded-full"></div>
      </div>
      
      {/* Screen */}
      <div className="relative bg-black rounded-[2rem] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
        {children}
      </div>
    </div>
    
    {/* Platform label */}
    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-void-800 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/10">
      {platform}
    </div>
  </div>
);

// Instagram Feed Preview
export const InstagramFeedPreview: React.FC<PreviewProps> = ({ 
  imageUrl, 
  topText, 
  bottomText, 
  caption,
  username = 'yourbrand' 
}) => (
  <PhoneFrame platform="Instagram Feed">
    <div className="h-full flex flex-col bg-black text-white">
      {/* Status bar */}
      <div className="h-11 flex items-center justify-between px-5 pt-6">
        <span className="text-xs font-medium">9:41</span>
        <div className="flex gap-1">
          <div className="w-4 h-2 bg-white rounded-sm"></div>
          <div className="w-4 h-2 bg-white rounded-sm"></div>
        </div>
      </div>
      
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-0.5">
          <div className="w-full h-full rounded-full bg-black"></div>
        </div>
        <span className="text-sm font-semibold flex-1">{username}</span>
        <span className="text-lg">•••</span>
      </div>
      
      {/* Image */}
      <div className="relative flex-1 bg-void-900">
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
            {(topText || bottomText) && (
              <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none">
                {topText && (
                  <p className="text-lg text-white uppercase text-center font-bold"
                     style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    {topText}
                  </p>
                )}
                {bottomText && (
                  <p className="text-lg text-white uppercase text-center font-bold"
                     style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    {bottomText}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <span className="text-4xl">📷</span>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-xl">♡</span>
          <span className="text-xl">💬</span>
          <span className="text-xl">↗</span>
          <span className="text-xl ml-auto">⚐</span>
        </div>
        <p className="text-xs"><span className="font-semibold">{username}</span> {caption?.slice(0, 60) || 'Your caption here...'}</p>
      </div>
    </div>
  </PhoneFrame>
);

// Instagram Story Preview
export const InstagramStoryPreview: React.FC<PreviewProps> = ({ 
  imageUrl, 
  headline,
  username = 'yourbrand' 
}) => (
  <PhoneFrame platform="Instagram Story">
    <div className="h-full flex flex-col bg-black text-white relative">
      {/* Background */}
      {imageUrl ? (
        <img src={imageUrl} alt="Story" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400"></div>
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Progress bar */}
        <div className="px-2 pt-8 pb-2">
          <div className="h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-white rounded-full"></div>
          </div>
        </div>
        
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-pink-500 p-0.5">
            <div className="w-full h-full rounded-full bg-black"></div>
          </div>
          <span className="text-sm font-semibold">{username}</span>
          <span className="text-xs text-white/70">2h</span>
        </div>
        
        {/* Center content */}
        <div className="flex-1 flex items-center justify-center p-6">
          {headline && (
            <p className="text-2xl font-bold text-center leading-tight"
               style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
              {headline}
            </p>
          )}
        </div>
        
        {/* Reply bar */}
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm text-white/70">
              Send message
            </div>
            <span className="text-xl">♡</span>
            <span className="text-xl">↗</span>
          </div>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

// TikTok Preview
export const TikTokPreview: React.FC<PreviewProps> = ({ 
  imageUrl, 
  caption,
  username = 'yourbrand' 
}) => (
  <PhoneFrame platform="TikTok">
    <div className="h-full flex flex-col bg-black text-white relative">
      {/* Background */}
      {imageUrl ? (
        <img src={imageUrl} alt="Video" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-red-500 to-yellow-500"></div>
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-center gap-6 pt-12 pb-4">
          <span className="text-sm text-white/60">Following</span>
          <span className="text-sm font-semibold border-b-2 border-white pb-1">For You</span>
        </div>
        
        {/* Spacer */}
        <div className="flex-1"></div>
        
        {/* Right sidebar */}
        <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">♡</span>
            <span className="text-[10px]">24.5K</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">💬</span>
            <span className="text-[10px]">1,234</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl">↗</span>
            <span className="text-[10px]">Share</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur animate-spin-slow"></div>
        </div>
        
        {/* Bottom content */}
        <div className="p-3 pr-16">
          <p className="font-semibold text-sm mb-1">@{username}</p>
          <p className="text-xs text-white/90 leading-relaxed">
            {caption?.slice(0, 100) || 'Your caption here...'} 
            <span className="text-white/60"> #fyp #viral</span>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs">🎵</span>
            <div className="overflow-hidden">
              <p className="text-xs text-white/70 whitespace-nowrap animate-marquee">
                Original sound - {username}
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom nav */}
        <div className="flex items-center justify-around py-2 bg-black">
          <span className="text-xl">🏠</span>
          <span className="text-xl">🔍</span>
          <div className="w-10 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black text-lg">+</span>
          </div>
          <span className="text-xl">💬</span>
          <span className="text-xl">👤</span>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

// LinkedIn Preview
export const LinkedInPreview: React.FC<PreviewProps> = ({ 
  imageUrl, 
  headline,
  caption,
  username = 'Your Brand' 
}) => (
  <PhoneFrame platform="LinkedIn">
    <div className="h-full flex flex-col bg-white text-gray-900">
      {/* Status bar */}
      <div className="h-11 flex items-center justify-between px-5 pt-6 bg-white">
        <span className="text-xs font-medium text-gray-900">9:41</span>
      </div>
      
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">in</div>
        <div className="flex-1">
          <div className="h-8 bg-gray-100 rounded-md flex items-center px-3">
            <span className="text-gray-400 text-sm">🔍 Search</span>
          </div>
        </div>
        <span className="text-xl">💬</span>
      </div>
      
      {/* Post */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="bg-white mt-2">
          {/* Author */}
          <div className="flex items-start gap-2 p-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700"></div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{username}</p>
              <p className="text-xs text-gray-500">Marketing Leader • 1d</p>
            </div>
            <span className="text-gray-400">•••</span>
          </div>
          
          {/* Content */}
          <div className="px-3 pb-2">
            <p className="text-sm text-gray-800 leading-relaxed">
              {headline || caption?.slice(0, 150) || 'Your post content here...'}
            </p>
          </div>
          
          {/* Image */}
          <div className="aspect-video bg-gray-200">
            {imageUrl ? (
              <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-4xl">📊</span>
              </div>
            )}
          </div>
          
          {/* Engagement */}
          <div className="px-3 py-2 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500 mb-2">
              <span className="text-blue-500">👍❤️</span>
              <span className="ml-1">1,234 • 56 comments</span>
            </div>
            <div className="flex items-center justify-around border-t border-gray-100 pt-2">
              <span className="text-xs text-gray-600 font-medium">👍 Like</span>
              <span className="text-xs text-gray-600 font-medium">💬 Comment</span>
              <span className="text-xs text-gray-600 font-medium">↗ Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PhoneFrame>
);

// Preview Carousel Component - shows multiple platforms side by side
export const PlatformPreviewCarousel: React.FC<{
  imageUrl?: string;
  topText?: string;
  bottomText?: string;
  caption?: string;
  headline?: string;
}> = (props) => {
  const [activePlatform, setActivePlatform] = React.useState<'instagram' | 'story' | 'tiktok' | 'linkedin'>('instagram');

  const platforms = [
    { id: 'instagram', label: 'IG Feed', icon: '📱' },
    { id: 'story', label: 'IG Story', icon: '📲' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Platform selector */}
      <div className="flex justify-center gap-2">
        {platforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => setActivePlatform(platform.id)}
            className={`
              px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2
              ${activePlatform === platform.id 
                ? 'bg-gold-500 text-void-950' 
                : 'bg-void-800 text-slate-400 hover:text-gold-400 border border-white/5'}
            `}
          >
            <span>{platform.icon}</span>
            {platform.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        {activePlatform === 'instagram' && <InstagramFeedPreview {...props} />}
        {activePlatform === 'story' && <InstagramStoryPreview {...props} />}
        {activePlatform === 'tiktok' && <TikTokPreview {...props} />}
        {activePlatform === 'linkedin' && <LinkedInPreview {...props} />}
      </div>
    </div>
  );
};

export default PlatformPreviewCarousel;
