
import { GoogleGenAI, Type } from "@google/genai";
import { CampaignBrief, CampaignBlueprint } from "../types";
import { SYSTEM_PROMPT } from "../constants";
import { CampaignBlueprintSchema } from "../schemas";

const getAiInstance = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY is missing. Please configure your environment.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateCampaignBlueprint = async (brief: CampaignBrief): Promise<CampaignBlueprint> => {
  const ai = getAiInstance();
  
  const primaryModel = 'gemini-3-pro-preview';
  const fallbackModel = 'gemini-2.5-flash';

  const jsonSchema = {
    type: Type.OBJECT,
    properties: {
      campaign_summary: { type: Type.OBJECT, properties: { one_liner: { type: Type.STRING }, pillars: { type: Type.ARRAY, items: { type: Type.STRING } }, core_promise: { type: Type.STRING }, primary_emotions: { type: Type.ARRAY, items: { type: Type.STRING } }, tone_description: { type: Type.STRING } } },
      narrative_pack: { type: Type.OBJECT, properties: { hooks: { type: Type.ARRAY, items: { type: Type.STRING } }, pain_points: { type: Type.ARRAY, items: { type: Type.STRING } }, micro_transformations: { type: Type.ARRAY, items: { type: Type.STRING } }, cta_variants: { type: Type.ARRAY, items: { type: Type.STRING } }, taglines: { type: Type.ARRAY, items: { type: Type.STRING } } } },
      memes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, angle: { type: Type.STRING }, top_text: { type: Type.STRING }, bottom_text: { type: Type.STRING }, alt_text: { type: Type.STRING }, caption_options: { type: Type.ARRAY, items: { type: Type.STRING } }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }, image_prompt: { type: Type.STRING }, recommended_aspect_ratios: { type: Type.ARRAY, items: { type: Type.STRING } } } } },
      static_banners: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, headline: { type: Type.STRING }, subheadline: { type: Type.STRING }, bullets: { type: Type.ARRAY, items: { type: Type.STRING } }, cta_text: { type: Type.STRING }, layout_description: { type: Type.STRING }, image_prompt: { type: Type.STRING }, recommended_aspect_ratios: { type: Type.ARRAY, items: { type: Type.STRING } } } } },
      short_videos: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, title: { type: Type.STRING }, platform_targets: { type: Type.ARRAY, items: { type: Type.STRING } }, max_duration_seconds: { type: Type.NUMBER }, script_beats: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { beat_index: { type: Type.NUMBER }, approx_seconds: { type: Type.NUMBER }, voiceover_text: { type: Type.STRING }, on_screen_text: { type: Type.STRING }, visual_direction: { type: Type.STRING } } } }, storyboard_prompt: { type: Type.STRING }, subtitles_block: { type: Type.STRING } } } },
      ugc_scripts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, hook_line: { type: Type.STRING }, persona: { type: Type.STRING }, script_blocks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { block_index: { type: Type.NUMBER }, approx_seconds: { type: Type.NUMBER }, spoken_text: { type: Type.STRING }, emotion_note: { type: Type.STRING }, framing_note: { type: Type.STRING } } } }, wardrobe_note: { type: Type.STRING }, lighting_note: { type: Type.STRING }, overlay_text_cues: { type: Type.ARRAY, items: { type: Type.STRING } }, cta_line: { type: Type.STRING } } } },
      carousels: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, title: { type: Type.STRING }, slides: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { slide_number: { type: Type.NUMBER }, visual_description: { type: Type.STRING }, image_prompt: { type: Type.STRING }, headline: { type: Type.STRING }, body_copy: { type: Type.STRING } } } } } } },
      moments_mapping: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { moment_type: { type: Type.STRING }, use_case: { type: Type.STRING }, suggested_line: { type: Type.STRING }, where_to_use: { type: Type.STRING } } } }
    }
  };

  const generateWithModel = async (model: string) => {
    return await ai.models.generateContent({
      model: model,
      contents: JSON.stringify({ campaign_brief: brief }),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: jsonSchema
      }
    });
  };

  try {
      let response;
      
      try {
        console.log(`Attempting blueprint generation with ${primaryModel}...`);
        response = await generateWithModel(primaryModel);
      } catch (primaryError: any) {
        const isAvailabilityIssue = 
            primaryError.status === 503 || 
            primaryError.status === 429 || 
            (primaryError.message && (
                primaryError.message.includes('overloaded') || 
                primaryError.message.includes('quota')
            ));

        if (isAvailabilityIssue) {
            console.warn(`Primary model ${primaryModel} is busy (${primaryError.status || 'overloaded'}). Falling back to ${fallbackModel}.`);
            response = await generateWithModel(fallbackModel);
        } else {
            throw primaryError;
        }
      }

      if (!response.text) {
        throw new Error("Empty response from Gemini");
      }

      const rawJson = JSON.parse(response.text);
      const validatedData = CampaignBlueprintSchema.parse(rawJson);
      
      return validatedData as CampaignBlueprint;
  } catch (error: any) {
      console.error("Blueprint Generation Error:", error);
      const msg = error.message?.includes('overloaded') 
        ? "The AI models are currently at capacity. Please try again in a moment." 
        : "Failed to generate a valid blueprint. The oracle was unclear.";
      throw new Error(msg);
  }
};

export const generateMemeImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  const ai = getAiInstance();
  const model = 'gemini-2.5-flash-image';

  if (!prompt || prompt.trim().length < 5) {
      throw new Error("Image prompt is too short or empty. Cannot generate.");
  }

  const isMeme = aspectRatio === "1:1" && !prompt.toLowerCase().includes("professional") && !prompt.toLowerCase().includes("cinematic");
  const isStoryboard = aspectRatio === "9:16" && (prompt.toLowerCase().includes("storyboard") || prompt.toLowerCase().includes("shot"));
  
  let enhancedPrompt = "";
  
  if (isMeme) {
      enhancedPrompt = `Create a viral internet meme image of: ${prompt} . Style: highly expressive, amateur photography aesthetic, high contrast, humorous context. Do NOT include any text in the image.`;
  } else if (isStoryboard) {
      enhancedPrompt = `Create a cinematic storyboard concept frame for: ${prompt} . Style: digital concept art, dramatic lighting, keyframe illustration, expressive composition, wide angle, visual storytelling.`;
  } else {
      enhancedPrompt = `Generate a professional commercial photograph of: ${prompt} . Style: cinematic lighting, 8k resolution, photorealistic, highly detailed, sharp focus, clean background space for text.`;
  }

  const validAspects = ["1:1", "3:4", "4:3", "9:16", "16:9"];
  const finalAspect = validAspects.includes(aspectRatio) ? aspectRatio : "1:1";

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [{ text: enhancedPrompt }]
    },
    config: {
        imageConfig: {
            aspectRatio: finalAspect
        }
    }
  });

  let imageUrl = '';
  let textResponse = '';

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
      if (part.text) {
          textResponse += part.text;
      }
    }
  }

  if (!imageUrl) {
      console.warn("Gemini Image Generation Failed. Text response:", textResponse);
      const errorMsg = textResponse 
        ? `Model refused: "${textResponse.slice(0, 100)}..."` 
        : "Gemini generated no image data (Safety filter may have triggered).";
      throw new Error(errorMsg);
  }
  
  return imageUrl;
};

/**
 * Generate short video using Veo
 */
export const generateVideo = async (prompt: string, durationSeconds: number = 5): Promise<string> => {
  const ai = getAiInstance();
  
  // Veo-compatible prompt enhancement
  const enhancedPrompt = `Create a cinematic short video: ${prompt}. Style: professional commercial quality, smooth motion, engaging visuals, ${durationSeconds} seconds duration.`;

  try {
    // Note: Veo API structure - adjust based on actual API when available
    const response = await ai.models.generateContent({
      model: 'veo-2.0-generate-001', // Veo model for video generation
      contents: {
        parts: [{ text: enhancedPrompt }]
      },
      config: {
        // Video-specific config
      }
    });

    // Extract video URL from response
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        if ((part as any).videoUri) {
          return (part as any).videoUri;
        }
      }
    }

    throw new Error("No video generated");
  } catch (error: any) {
    console.warn("Veo generation failed, returning placeholder:", error.message);
    // Return a placeholder or fall back to storyboard image
    throw new Error("Video generation not yet available. Try generating a storyboard instead.");
  }
};
