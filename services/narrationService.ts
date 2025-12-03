/**
 * Voice Narration Service - Text-to-Speech for Campaign Briefings
 * Uses Web Speech API for browser-native TTS
 */

import { CampaignBlueprint } from '../types';

export interface NarrationOptions {
  rate?: number;      // 0.1 to 10, default 1
  pitch?: number;     // 0 to 2, default 1
  volume?: number;    // 0 to 1, default 1
  voiceIndex?: number; // Index of available voice
}

export interface NarrationState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSection: string;
  progress: number; // 0-100
}

let currentUtterance: SpeechSynthesisUtterance | null = null;
let stateCallback: ((state: NarrationState) => void) | null = null;

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis?.getVoices() || [];
}

export function setStateCallback(callback: (state: NarrationState) => void) {
  stateCallback = callback;
}

function updateState(state: Partial<NarrationState>) {
  if (stateCallback) {
    stateCallback({
      isPlaying: false,
      isPaused: false,
      currentSection: '',
      progress: 0,
      ...state
    });
  }
}

export function stopNarration() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
  updateState({ isPlaying: false, isPaused: false, progress: 0 });
}

export function pauseNarration() {
  if (window.speechSynthesis) {
    window.speechSynthesis.pause();
    updateState({ isPlaying: false, isPaused: true });
  }
}

export function resumeNarration() {
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
    updateState({ isPlaying: true, isPaused: false });
  }
}

export async function narrateBlueprint(
  blueprint: CampaignBlueprint,
  options: NarrationOptions = {}
): Promise<void> {
  if (!window.speechSynthesis) {
    throw new Error('Speech synthesis not supported in this browser');
  }

  stopNarration();

  const script = generateBriefingScript(blueprint);
  const sections = script.sections;
  const totalSections = sections.length;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    await speakSection(section.title, section.content, options, () => {
      updateState({
        isPlaying: true,
        isPaused: false,
        currentSection: section.title,
        progress: Math.round(((i + 1) / totalSections) * 100)
      });
    });
  }

  updateState({ isPlaying: false, isPaused: false, currentSection: 'Complete', progress: 100 });
}

function speakSection(
  title: string,
  content: string,
  options: NarrationOptions,
  onStart: () => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(content);
    currentUtterance = utterance;

    utterance.rate = options.rate || 0.95;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    const voices = getAvailableVoices();
    if (voices.length > 0) {
      const englishVoice = voices.find(v => v.lang.startsWith('en-')) || voices[0];
      utterance.voice = options.voiceIndex !== undefined 
        ? voices[options.voiceIndex] 
        : englishVoice;
    }

    utterance.onstart = () => onStart();
    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      if (event.error !== 'canceled') {
        reject(new Error(`Speech error: ${event.error}`));
      } else {
        resolve();
      }
    };

    window.speechSynthesis.speak(utterance);
  });
}

interface BriefingScript {
  title: string;
  duration: number;
  sections: { title: string; content: string }[];
}

function generateBriefingScript(blueprint: CampaignBlueprint): BriefingScript {
  const sections: { title: string; content: string }[] = [];
  const summary = blueprint.campaign_summary;
  const narrative = blueprint.narrative_pack;

  // Introduction
  sections.push({
    title: 'Campaign Overview',
    content: `Campaign briefing ready. ${summary.one_liner}. The core promise: ${summary.core_promise}. This campaign targets emotions of ${summary.primary_emotions.slice(0, 3).join(', ')}. The tone is ${summary.tone_description}.`
  });

  // Strategic Pillars
  if (summary.pillars.length > 0) {
    sections.push({
      title: 'Strategic Pillars',
      content: `Active strategic pillars: ${summary.pillars.map(p => p.replace(/_/g, ' ')).join(', ')}.`
    });
  }

  // Hooks
  if (narrative.hooks.length > 0) {
    sections.push({
      title: 'Scroll-Stopping Hooks',
      content: `Top hooks for this campaign. ${narrative.hooks.slice(0, 3).map((h, i) => `Hook ${i + 1}: ${h}`).join('. ')}.`
    });
  }

  // Pain Points
  if (narrative.pain_points.length > 0) {
    sections.push({
      title: 'Audience Pain Points',
      content: `Key pain points to address: ${narrative.pain_points.slice(0, 3).join('. ')}.`
    });
  }

  // CTAs
  if (narrative.cta_variants.length > 0) {
    sections.push({
      title: 'Call to Action Options',
      content: `Recommended CTAs: ${narrative.cta_variants.slice(0, 3).join('. ')}.`
    });
  }

  // Assets Summary
  const assetCounts = {
    memes: blueprint.memes.length,
    banners: blueprint.static_banners.length,
    videos: blueprint.short_videos.length,
    scripts: blueprint.ugc_scripts.length,
    carousels: blueprint.carousels.length
  };

  const assetSummary = Object.entries(assetCounts)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');

  if (assetSummary) {
    sections.push({
      title: 'Asset Inventory',
      content: `This blueprint includes: ${assetSummary}. All assets are ready for generation.`
    });
  }

  // Closing
  sections.push({
    title: 'Summary',
    content: `Briefing complete. Campaign is ready for execution. Review assets in the blueprint view and generate visuals as needed. Good luck.`
  });

  // Estimate duration (roughly 150 words per minute)
  const totalWords = sections.reduce((sum, s) => sum + s.content.split(' ').length, 0);
  const duration = Math.ceil(totalWords / 150 * 60);

  return { title: 'Campaign Briefing', duration, sections };
}

// Narrate custom text
export async function narrateText(
  text: string,
  options: NarrationOptions = {}
): Promise<void> {
  if (!window.speechSynthesis) {
    throw new Error('Speech synthesis not supported');
  }

  stopNarration();

  await speakSection('Custom', text, options, () => {
    updateState({
      isPlaying: true,
      isPaused: false,
      currentSection: 'Speaking',
      progress: 50
    });
  });

  updateState({ isPlaying: false, currentSection: 'Complete', progress: 100 });
}

// Generate summary for quick narration
export function generateQuickSummary(blueprint: CampaignBlueprint): string {
  const summary = blueprint.campaign_summary;
  return `${summary.one_liner}. Core promise: ${summary.core_promise}. Focus on ${summary.primary_emotions.slice(0, 2).join(' and ')}.`;
}
