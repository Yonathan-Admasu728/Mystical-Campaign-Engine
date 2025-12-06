
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CampaignBrief, CampaignBlueprint } from './types';
import { DEFAULT_BRIEF } from './constants';

interface AssetStore {
  generatedAssets: { [id: string]: string };
  loadingAssets: { [id: string]: boolean };
  mediaReady: { [id: string]: boolean };
}

interface CampaignContextType {
  brief: CampaignBrief;
  setBrief: React.Dispatch<React.SetStateAction<CampaignBrief>>;
  blueprint: CampaignBlueprint | null;
  setBlueprint: React.Dispatch<React.SetStateAction<CampaignBlueprint | null>>;
  
  // Asset Management
  assets: AssetStore;
  setAssetUrl: (id: string, url: string) => void;
  setAssetLoading: (id: string, isLoading: boolean) => void;
  setMediaReady: (id: string, isReady: boolean) => void;
  
  // Global Loading
  isGeneratingBlueprint: boolean;
  setIsGeneratingBlueprint: (loading: boolean) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brief, setBrief] = useState<CampaignBrief>(DEFAULT_BRIEF);
  const [blueprint, setBlueprint] = useState<CampaignBlueprint | null>(null);
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  
  const [assets, setAssets] = useState<AssetStore>({
    generatedAssets: {},
    loadingAssets: {},
    mediaReady: {}
  });

  const setAssetUrl = useCallback((id: string, url: string) => {
    setAssets(prev => ({
      ...prev,
      generatedAssets: { ...prev.generatedAssets, [id]: url }
    }));
  }, []);

  const setAssetLoading = useCallback((id: string, isLoading: boolean) => {
    setAssets(prev => ({
      ...prev,
      loadingAssets: { ...prev.loadingAssets, [id]: isLoading }
    }));
  }, []);

  const setMediaReady = useCallback((id: string, isReady: boolean) => {
    setAssets(prev => ({
      ...prev,
      mediaReady: { ...prev.mediaReady, [id]: isReady }
    }));
  }, []);

  return (
    <CampaignContext.Provider value={{
      brief,
      setBrief,
      blueprint,
      setBlueprint,
      assets,
      setAssetUrl,
      setAssetLoading,
      setMediaReady,
      isGeneratingBlueprint,
      setIsGeneratingBlueprint
    }}>
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};

export default CampaignContext;
