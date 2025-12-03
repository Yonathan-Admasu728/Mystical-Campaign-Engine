
// Input Types (The Brief)

export interface CampaignMeta {
  campaign_name: string;
  purpose: string;
  pillars: string[]; // "primal_flow_fusion" | "animator_shift" | "moments"
  primary_theme: string;
}

export interface Audience {
  archetypes: string[];
  hidden_truth: string;
  fears: string[];
  secret_desires: string[];
}

export interface CreativeInputs {
  raw_brain_dump: string;
  must_include_phrases: string[];
  must_avoid_phrases: string[];
  voice_reference: string;
  cta_flavor: 'soft_cosmic' | 'direct_push' | 'challenge_based' | 'curiosity_based';
  emotional_frequency: {
    humor: number;
    relatability: number;
    shock: number;
    inspiration: number;
    identity_shift: number;
  };
}

export interface VisualInputs {
  style_tags: string[];
  palette: string;
  instructor_image_url: string;
  logo_image_url: string;
}

export interface OutputsConfig {
  formats: {
    memes: boolean;
    static_banners: boolean;
    short_vertical_videos: boolean;
    ugc_scripts: boolean;
    carousels: boolean;
  };
  quantities: {
    memes: number;
    static_banners: number;
    short_vertical_videos: number;
    ugc_scripts: number;
    carousels: number;
  };
  platforms: string[];
  aspect_ratios: string[];
  video_max_duration_seconds: number;
}

export interface Constraints {
  humor_edge_level: 'safe' | 'medium_spicy' | 'spicy_but_kind';
  body_sensitivity: 'no_body_shaming' | 'neutral' | 'soft_body_language';
  language_filter: 'clean' | 'pg13' | 'mild_swear';
  spirituality_flavor: 'grounded' | 'grounded_cosmic' | 'very_cosmic';
}

export interface CampaignBrief {
  meta: CampaignMeta;
  audience: Audience;
  creative: CreativeInputs;
  visual: VisualInputs;
  outputs: OutputsConfig;
  constraints: Constraints;
  special_notes: string;
}

// Output Types (The Blueprint from Gemini)

export interface Meme {
  id: string;
  angle: string;
  top_text: string;
  bottom_text: string;
  alt_text: string;
  caption_options: string[];
  hashtags: string[];
  image_prompt: string;
  recommended_aspect_ratios: string[];
}

export interface StaticBanner {
  id: string;
  headline: string;
  subheadline: string;
  bullets: string[];
  cta_text: string;
  layout_description: string;
  image_prompt: string;
  recommended_aspect_ratios: string[];
}

export interface ShortVideo {
  id: string;
  title: string;
  platform_targets: string[];
  max_duration_seconds: number;
  script_beats: {
    beat_index: number;
    approx_seconds: number;
    voiceover_text: string;
    on_screen_text: string;
    visual_direction: string;
  }[];
  storyboard_prompt: string;
  subtitles_block: string;
}

export interface UGCScript {
  id: string;
  hook_line: string;
  persona: string;
  script_blocks: {
    block_index: number;
    approx_seconds: number;
    spoken_text: string;
    emotion_note: string;
    framing_note: string;
  }[];
  wardrobe_note: string;
  lighting_note: string;
  overlay_text_cues: string[];
  cta_line: string;
}

export interface CarouselSlide {
  slide_number: number;
  visual_description: string;
  image_prompt: string;
  headline: string;
  body_copy: string;
}

export interface Carousel {
  id: string;
  title: string;
  slides: CarouselSlide[];
}

export interface MomentsMapping {
  moment_type: 'primal_flow_fusion' | 'animator_shift' | 'moments';
  use_case: string;
  suggested_line: string;
  where_to_use: string;
}

export interface CampaignBlueprint {
  campaign_summary: {
    one_liner: string;
    pillars: string[];
    core_promise: string;
    primary_emotions: string[];
    tone_description: string;
  };
  narrative_pack: {
    hooks: string[];
    pain_points: string[];
    micro_transformations: string[];
    cta_variants: string[];
    taglines: string[];
  };
  memes: Meme[];
  static_banners: StaticBanner[];
  short_videos: ShortVideo[];
  ugc_scripts: UGCScript[];
  carousels: Carousel[];
  moments_mapping: MomentsMapping[];
}
