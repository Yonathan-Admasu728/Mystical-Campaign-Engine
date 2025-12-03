
import { z } from "zod";

// --- Output Schemas (The Blueprint) ---

export const MemeSchema = z.object({
  id: z.string().optional().default(() => Math.random().toString(36).substr(2, 9)),
  angle: z.string().optional().default(""),
  top_text: z.string().optional().default(""),
  bottom_text: z.string().optional().default(""),
  alt_text: z.string().optional().default(""),
  caption_options: z.array(z.string()).default([]),
  hashtags: z.array(z.string()).default([]),
  image_prompt: z.string().optional().default(""),
  recommended_aspect_ratios: z.array(z.string()).default([])
});

export const StaticBannerSchema = z.object({
  id: z.string().optional().default(() => Math.random().toString(36).substr(2, 9)),
  headline: z.string().optional().default(""),
  subheadline: z.string().optional().default(""),
  bullets: z.array(z.string()).default([]),
  cta_text: z.string().optional().default(""),
  layout_description: z.string().optional().default(""),
  image_prompt: z.string().optional().default(""),
  recommended_aspect_ratios: z.array(z.string()).default([])
});

export const ShortVideoSchema = z.object({
  id: z.string().optional().default(() => Math.random().toString(36).substr(2, 9)),
  title: z.string().optional().default("Untitled Video"),
  platform_targets: z.array(z.string()).default([]),
  max_duration_seconds: z.number().optional().default(30),
  script_beats: z.array(z.object({
    beat_index: z.number().optional().default(0),
    approx_seconds: z.number().optional().default(5),
    voiceover_text: z.string().optional().default(""),
    on_screen_text: z.string().optional().default(""),
    visual_direction: z.string().optional().default("")
  })).default([]),
  storyboard_prompt: z.string().optional().default(""),
  subtitles_block: z.string().optional().default("")
});

export const UGCScriptSchema = z.object({
  id: z.string().optional().default(() => Math.random().toString(36).substr(2, 9)),
  hook_line: z.string().optional().default(""),
  persona: z.string().optional().default(""),
  script_blocks: z.array(z.object({
    block_index: z.number().optional().default(0),
    approx_seconds: z.number().optional().default(5),
    spoken_text: z.string().optional().default(""),
    emotion_note: z.string().optional().default(""),
    framing_note: z.string().optional().default("")
  })).default([]),
  wardrobe_note: z.string().optional().default(""),
  lighting_note: z.string().optional().default(""),
  overlay_text_cues: z.array(z.string()).default([]),
  cta_line: z.string().optional().default("")
});

export const CarouselSlideSchema = z.object({
  slide_number: z.number().optional().default(1),
  visual_description: z.string().optional().default(""),
  image_prompt: z.string().optional().default(""),
  headline: z.string().optional().default(""),
  body_copy: z.string().optional().default("")
});

export const CarouselSchema = z.object({
  id: z.string().optional().default(() => Math.random().toString(36).substr(2, 9)),
  title: z.string().optional().default("Untitled Carousel"),
  slides: z.array(CarouselSlideSchema).default([])
});

export const MomentsMappingSchema = z.object({
  moment_type: z.string().optional().default("moments"),
  use_case: z.string().optional().default(""),
  suggested_line: z.string().optional().default(""),
  where_to_use: z.string().optional().default("")
});

export const CampaignBlueprintSchema = z.object({
  campaign_summary: z.object({
    one_liner: z.string().optional().default(""),
    pillars: z.array(z.string()).default([]),
    core_promise: z.string().optional().default("Promise not generated"),
    primary_emotions: z.array(z.string()).default([]),
    tone_description: z.string().optional().default("")
  }).optional().default({
    one_liner: "",
    pillars: [],
    core_promise: "Promise not generated",
    primary_emotions: [],
    tone_description: ""
  }),
  narrative_pack: z.object({
    hooks: z.array(z.string()).default([]),
    pain_points: z.array(z.string()).default([]),
    micro_transformations: z.array(z.string()).default([]),
    cta_variants: z.array(z.string()).default([]),
    taglines: z.array(z.string()).default([])
  }).optional().default({
    hooks: [],
    pain_points: [],
    micro_transformations: [],
    cta_variants: [],
    taglines: []
  }),
  memes: z.array(MemeSchema).default([]),
  static_banners: z.array(StaticBannerSchema).default([]),
  short_videos: z.array(ShortVideoSchema).default([]),
  ugc_scripts: z.array(UGCScriptSchema).default([]),
  carousels: z.array(CarouselSchema).default([]),
  moments_mapping: z.array(MomentsMappingSchema).default([])
});

export type ParsedCampaignBlueprint = z.infer<typeof CampaignBlueprintSchema>;
