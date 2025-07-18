import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error in fetchImageAsBase64:', error);
    return '';
  }
}

// Define consistent dimensions for different asset types
const ASSET_DIMENSIONS = {
  character: { width: 512, height: 512 },
  obstacle: { width: 512, height: 512 },
  item: { width: 256, height: 256 },
  background: { width: 1024, height: 768 }
};

export async function POST(request: NextRequest) {
  try {
    const { prompt, type, style } = await request.json();

    if (!prompt || !process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'Prompt or API token is missing' }, { status: 400 });
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    // Get dimensions based on asset type
    const dimensions = ASSET_DIMENSIONS[type as keyof typeof ASSET_DIMENSIONS] || ASSET_DIMENSIONS.character;

    // INITIAL IMAGE
    const generationVersion = "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
    
    let enhancedPrompt = prompt;
    let negativePrompt = "multiple objects, collage, blurry, text, watermark, signature, ugly, deformed, extra limbs";

    if (type === 'character' || type === 'obstacle' || type === 'item') {
      enhancedPrompt = `${prompt}, ${style} style, single object, centered, game asset, on a solid plain white background, no shadows, perfect square composition`;
      negativePrompt += ", multiple subjects, scene, environment, photo, realistic, asymmetric";
    } else { // Background
      enhancedPrompt = `${prompt}, ${style} style, 2d game background, no characters, landscape, beautiful, simple, wide aspect ratio`;
    }
    
    console.log(`[API] Creating prediction with prompt: "${enhancedPrompt}"`);
    console.log(`[API] Using dimensions: ${dimensions.width}x${dimensions.height}`);
    
    const prediction = await replicate.predictions.create({
        version: generationVersion,
        input: {
            prompt: enhancedPrompt,
            negative_prompt: negativePrompt,
            width: dimensions.width,
            height: dimensions.height,
            num_inference_steps: 30,
            guidance_scale: 7.5
        }
    });

    const finalPrediction = await replicate.wait(prediction);

    if (finalPrediction.status === 'failed') {
        throw new Error(`Image generation failed: ${finalPrediction.error}`);
    }

    if (!Array.isArray(finalPrediction.output) || finalPrediction.output.length === 0 || typeof finalPrediction.output[0] !== 'string') {
      throw new Error('Image generation returned an invalid format.');
    }
    const initialImageUrl = finalPrediction.output[0];
    console.log(`[API] Initial image URL: ${initialImageUrl}`);
    
    let finalImageUrl = initialImageUrl;

    // REMOVE BACKGROUND FOR RELEVANT ASSETS
    if (type === 'character' || type === 'obstacle' || type === 'item') {
        console.log(`[API] Removing background...`);
        const removalVersion = "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";
        
        const removalPrediction = await replicate.predictions.create({
            version: removalVersion,
            input: { image: initialImageUrl }
        });

        const finalRemovalPrediction = await replicate.wait(removalPrediction);

        if (finalRemovalPrediction.status === 'failed' || typeof finalRemovalPrediction.output !== 'string') {
            console.warn("Background removal failed, using original image instead.");
        } else {
            finalImageUrl = finalRemovalPrediction.output;
            console.log(`[API] Transparent image URL: ${finalImageUrl}`);
        }
    }

    return NextResponse.json({ 
      assetUrl: finalImageUrl,
      dimensions: dimensions 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error("[API] Full error in image generation route:", error);
    return NextResponse.json({ error: `Image generation pipeline failed: ${errorMessage}` }, { status: 500 });
  }
}