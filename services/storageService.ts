/**
 * Oracle Memory - IndexedDB Storage Service
 * Persists campaigns, assets, templates, and brand voice across sessions
 */

const DB_NAME = 'TheOracleDB';
const DB_VERSION = 1;

interface StoredCampaign {
  id: string;
  name: string;
  brief: any;
  blueprint: any;
  createdAt: number;
  updatedAt: number;
  healthScore?: number;
  tags?: string[];
}

interface StoredAsset {
  id: string;
  campaignId: string;
  type: 'meme' | 'banner' | 'storyboard' | 'carousel' | 'video';
  dataUrl: string;
  prompt: string;
  createdAt: number;
  tags?: string[];
}

interface StoredTemplate {
  id: string;
  name: string;
  description: string;
  brief: any;
  createdAt: number;
  usageCount: number;
}

interface BrandVoice {
  id: string;
  name: string;
  examples: string[];
  extractedTraits: string[];
  createdAt: number;
}

class OracleStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Campaigns store
        if (!db.objectStoreNames.contains('campaigns')) {
          const campaignStore = db.createObjectStore('campaigns', { keyPath: 'id' });
          campaignStore.createIndex('name', 'name', { unique: false });
          campaignStore.createIndex('createdAt', 'createdAt', { unique: false });
          campaignStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Assets store
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetStore.createIndex('campaignId', 'campaignId', { unique: false });
          assetStore.createIndex('type', 'type', { unique: false });
          assetStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Templates store
        if (!db.objectStoreNames.contains('templates')) {
          const templateStore = db.createObjectStore('templates', { keyPath: 'id' });
          templateStore.createIndex('name', 'name', { unique: false });
          templateStore.createIndex('usageCount', 'usageCount', { unique: false });
        }

        // Brand Voice store
        if (!db.objectStoreNames.contains('brandVoices')) {
          const voiceStore = db.createObjectStore('brandVoices', { keyPath: 'id' });
          voiceStore.createIndex('name', 'name', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // ============ CAMPAIGNS ============

  async saveCampaign(campaign: StoredCampaign): Promise<void> {
    const store = await this.getStore('campaigns', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(campaign);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCampaign(id: string): Promise<StoredCampaign | undefined> {
    const store = await this.getStore('campaigns');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCampaigns(): Promise<StoredCampaign[]> {
    const store = await this.getStore('campaigns');
    return new Promise((resolve, reject) => {
      const request = store.index('updatedAt').getAll();
      request.onsuccess = () => resolve(request.result.reverse());
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCampaign(id: string): Promise<void> {
    const store = await this.getStore('campaigns', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============ ASSETS ============

  async saveAsset(asset: StoredAsset): Promise<void> {
    const store = await this.getStore('assets', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(asset);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAssetsByCampaign(campaignId: string): Promise<StoredAsset[]> {
    const store = await this.getStore('assets');
    return new Promise((resolve, reject) => {
      const request = store.index('campaignId').getAll(campaignId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllAssets(): Promise<StoredAsset[]> {
    const store = await this.getStore('assets');
    return new Promise((resolve, reject) => {
      const request = store.index('createdAt').getAll();
      request.onsuccess = () => resolve(request.result.reverse());
      request.onerror = () => reject(request.error);
    });
  }

  async getAssetsByType(type: StoredAsset['type']): Promise<StoredAsset[]> {
    const store = await this.getStore('assets');
    return new Promise((resolve, reject) => {
      const request = store.index('type').getAll(type);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAsset(id: string): Promise<void> {
    const store = await this.getStore('assets', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============ TEMPLATES ============

  async saveTemplate(template: StoredTemplate): Promise<void> {
    const store = await this.getStore('templates', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(template);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTemplates(): Promise<StoredTemplate[]> {
    const store = await this.getStore('templates');
    return new Promise((resolve, reject) => {
      const request = store.index('usageCount').getAll();
      request.onsuccess = () => resolve(request.result.reverse());
      request.onerror = () => reject(request.error);
    });
  }

  async getTemplate(id: string): Promise<StoredTemplate | undefined> {
    const store = await this.getStore('templates');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async incrementTemplateUsage(id: string): Promise<void> {
    const template = await this.getTemplate(id);
    if (template) {
      template.usageCount++;
      await this.saveTemplate(template);
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    const store = await this.getStore('templates', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============ BRAND VOICE ============

  async saveBrandVoice(voice: BrandVoice): Promise<void> {
    const store = await this.getStore('brandVoices', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(voice);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllBrandVoices(): Promise<BrandVoice[]> {
    const store = await this.getStore('brandVoices');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getBrandVoice(id: string): Promise<BrandVoice | undefined> {
    const store = await this.getStore('brandVoices');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBrandVoice(id: string): Promise<void> {
    const store = await this.getStore('brandVoices', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ============ STATS ============

  async getStats(): Promise<{
    totalCampaigns: number;
    totalAssets: number;
    totalTemplates: number;
    assetsByType: Record<string, number>;
  }> {
    const [campaigns, assets, templates] = await Promise.all([
      this.getAllCampaigns(),
      this.getAllAssets(),
      this.getAllTemplates()
    ]);

    const assetsByType: Record<string, number> = {};
    assets.forEach(asset => {
      assetsByType[asset.type] = (assetsByType[asset.type] || 0) + 1;
    });

    return {
      totalCampaigns: campaigns.length,
      totalAssets: assets.length,
      totalTemplates: templates.length,
      assetsByType
    };
  }
}

// Singleton instance
export const oracleStorage = new OracleStorage();

// Type exports
export type { StoredCampaign, StoredAsset, StoredTemplate, BrandVoice };
