import React, { useState, useEffect } from 'react';
import { 
  Platform, 
  PLATFORM_CONFIGS, 
  getConnectedPlatforms,
  getStoredCredentials,
  initiateOAuth,
  handleOAuthCallback,
  publish,
  PublishRequest,
  PublishResult,
  getScheduledPosts,
  schedulePost,
  cancelScheduledPost,
  ScheduledPost,
  removeCredentials
} from '../services/publishingService';
import { toast } from 'sonner';

interface Props {
  selectedAsset?: {
    id: string;
    type: string;
    imageUrl?: string;
    caption?: string;
  };
}

export const PublishingHub: React.FC<Props> = ({ selectedAsset }) => {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [caption, setCaption] = useState(selectedAsset?.caption || '');
  const [hashtags, setHashtags] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[]>([]);
  const [scheduledPosts, setScheduledPostsList] = useState<ScheduledPost[]>([]);
  const [activeTab, setActiveTab] = useState<'publish' | 'scheduled' | 'connect'>('publish');

  useEffect(() => {
    loadConnectedPlatforms();
    loadScheduledPosts();
  }, []);

  useEffect(() => {
    if (selectedAsset?.caption) {
      setCaption(selectedAsset.caption);
    }
  }, [selectedAsset]);

  const loadConnectedPlatforms = () => {
    setConnectedPlatforms(getConnectedPlatforms());
  };

  const loadScheduledPosts = () => {
    setScheduledPostsList(getScheduledPosts());
  };

  const handleConnect = async (platform: Platform) => {
    try {
      // In production, this would open OAuth popup
      const authUrl = await initiateOAuth(platform);
      toast.info(`OAuth URL: ${authUrl}`, { duration: 5000 });
      
      // Simulate callback for demo
      setTimeout(async () => {
        await handleOAuthCallback(platform, 'mock_code');
        loadConnectedPlatforms();
        toast.success(`Connected to ${PLATFORM_CONFIGS[platform].name}`);
      }, 1000);
    } catch (error) {
      toast.error(`Failed to connect to ${platform}`);
    }
  };

  const handleDisconnect = (platform: Platform) => {
    removeCredentials(platform);
    loadConnectedPlatforms();
    setSelectedPlatforms(prev => prev.filter(p => p !== platform));
    toast.success(`Disconnected from ${PLATFORM_CONFIGS[platform].name}`);
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }

    setPublishing(true);
    setResults([]);

    const content: PublishRequest['content'] = {
      text: caption,
      imageUrl: selectedAsset?.imageUrl,
      hashtags: hashtags.split(' ').filter(h => h.startsWith('#'))
    };

    try {
      const publishResults: PublishResult[] = [];
      
      for (const platform of selectedPlatforms) {
        const request: PublishRequest = {
          platform,
          content,
          scheduling: scheduledDate && scheduledTime ? {
            publishAt: new Date(`${scheduledDate}T${scheduledTime}`)
          } : undefined
        };

        if (request.scheduling?.publishAt) {
          const scheduled = schedulePost(request);
          toast.success(`Scheduled for ${PLATFORM_CONFIGS[platform].name}`);
          publishResults.push({
            success: true,
            platform,
            postId: scheduled.id
          });
        } else {
          const result = await publish(request);
          publishResults.push(result);
          
          if (result.success) {
            toast.success(`Published to ${PLATFORM_CONFIGS[platform].name}`);
          } else {
            toast.error(`${platform}: ${result.error}`);
          }
        }
      }

      setResults(publishResults);
      loadScheduledPosts();
    } catch (error: any) {
      toast.error(`Publishing failed: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleCancelScheduled = (id: string) => {
    cancelScheduledPost(id);
    loadScheduledPosts();
    toast.success('Scheduled post cancelled');
  };

  const platforms = Object.values(PLATFORM_CONFIGS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📤</span>
        <div>
          <h2 className="text-xl font-bold text-slate-200">Publishing Hub</h2>
          <p className="text-sm text-slate-500">Connect accounts and publish directly</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        {(['publish', 'scheduled', 'connect'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab 
                ? 'text-amber-400 border-b-2 border-amber-400' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'scheduled' && scheduledPosts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                {scheduledPosts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Publish Tab */}
      {activeTab === 'publish' && (
        <div className="space-y-6">
          {/* Asset Preview */}
          {selectedAsset && (
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex gap-4">
              {selectedAsset.imageUrl && (
                <img 
                  src={selectedAsset.imageUrl} 
                  alt="Asset" 
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div>
                <span className="text-xs text-slate-500 uppercase">{selectedAsset.type}</span>
                <p className="text-slate-300 text-sm mt-1">Ready to publish</p>
              </div>
            </div>
          )}

          {/* Platform Selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Select Platforms
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map(config => {
                const isConnected = connectedPlatforms.includes(config.platform);
                const isSelected = selectedPlatforms.includes(config.platform);
                
                return (
                  <button
                    key={config.platform}
                    onClick={() => isConnected && togglePlatform(config.platform)}
                    disabled={!isConnected}
                    className={`p-4 rounded-xl border transition-all ${
                      !isConnected 
                        ? 'border-slate-700/30 bg-slate-800/20 opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{config.icon}</span>
                    <span className={`text-xs font-medium ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                      {config.name.split(' ')[0]}
                    </span>
                    {!isConnected && (
                      <span className="block text-[10px] text-slate-600 mt-1">Not connected</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption..."
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-amber-500/50 outline-none resize-none"
            />
            <div className="flex justify-between mt-1 text-xs text-slate-600">
              <span>{caption.length} characters</span>
              {selectedPlatforms.includes('twitter') && caption.length > 280 && (
                <span className="text-red-400">Exceeds Twitter limit</span>
              )}
            </div>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Hashtags
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#fitness #motivation #workout"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:border-amber-500/50 outline-none"
            />
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Schedule Date <span className="text-slate-600">(optional)</span>
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-amber-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-amber-500/50 outline-none"
              />
            </div>
          </div>

          {/* Publish Button */}
          <button
            onClick={handlePublish}
            disabled={publishing || selectedPlatforms.length === 0}
            className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-bold rounded-xl hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {publishing ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                Publishing...
              </>
            ) : scheduledDate && scheduledTime ? (
              <>📅 Schedule Post</>
            ) : (
              <>📤 Publish Now</>
            )}
          </button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, i) => (
                <div 
                  key={i}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    result.success 
                      ? 'bg-emerald-500/10 border border-emerald-500/20' 
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  <span className={`text-sm ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {PLATFORM_CONFIGS[result.platform].icon} {result.success ? 'Published' : result.error}
                  </span>
                  {result.postUrl && (
                    <a 
                      href={result.postUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-amber-400 hover:underline"
                    >
                      View Post →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          {scheduledPosts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <span className="text-4xl block mb-3">📅</span>
              <p>No scheduled posts</p>
            </div>
          ) : (
            scheduledPosts.map(post => (
              <div 
                key={post.id}
                className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{PLATFORM_CONFIGS[post.request.platform].icon}</span>
                    <span className="text-slate-200 font-medium">
                      {PLATFORM_CONFIGS[post.request.platform].name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Scheduled for {new Date(post.scheduledFor).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelScheduled(post.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Connect Tab */}
      {activeTab === 'connect' && (
        <div className="space-y-4">
          {platforms.map(config => {
            const isConnected = connectedPlatforms.includes(config.platform);
            const credentials = getStoredCredentials(config.platform);
            
            return (
              <div 
                key={config.platform}
                className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{config.icon}</span>
                  <div>
                    <h3 className="font-medium text-slate-200">{config.name}</h3>
                    {isConnected && credentials ? (
                      <p className="text-xs text-emerald-400">
                        ✓ Connected as {credentials.accountName}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">Not connected</p>
                    )}
                  </div>
                </div>
                
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(config.platform)}
                    className="px-4 py-2 bg-red-500/10 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(config.platform)}
                    className="px-4 py-2 bg-amber-500/10 text-amber-400 text-sm rounded-lg hover:bg-amber-500/20 transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}

          <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
            <p className="text-xs text-slate-500 text-center">
              🔐 OAuth connections are simulated in this demo. Production deployment requires API credentials from each platform.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
