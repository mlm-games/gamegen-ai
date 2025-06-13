import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to fetch image as base64:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, type, style } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const model = "bytedance/sdxl-lightning-4step:727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165eba6a";
    
    let enhancedPrompt = prompt;
    if (type === 'character') {
      enhancedPrompt = `${prompt}, ${style} style, game sprite, character sheet, centered, clean design, vibrant colors, simple shapes, white background, 2D game asset`;
    } else if (type === 'background') {
      enhancedPrompt = `${prompt}, ${style} style, 2D game background, vibrant colors, simple design, side-scrolling game background`;
    } else if (type === 'obstacle') {
      enhancedPrompt = `${prompt}, ${style} style, game obstacle, simple design, vibrant colors, white background, 2D game asset`;
    } else if (type === 'item') {
        enhancedPrompt = `${prompt}, ${style} style, game item, icon, simple design, vibrant colors, white background, 2D game asset`
    }

    const output = await replicate.run(model, {
      input: {
        prompt: enhancedPrompt,
        negative_prompt: "blurry, bad quality, text, watermark, signature, 3d render, realistic, photograph, complex, detailed",
        width: type === 'background' ? 1024 : 512,
        height: type === 'background' ? 576 : 512,
        num_inference_steps: 4,
        guidance_scale: 0,
        scheduler: "K_EULER",
        num_outputs: 1,
      }
    });

    let imageUrl: string | undefined;
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    }
    
    if (!imageUrl) {
      console.error('No image URL found in output:', output);
      throw new Error('No image URL returned from Replicate');
    }

    const base64Image = await fetchImageAsBase64(imageUrl);
    if (!base64Image) {
        throw new Error('Failed to convert generated image to Base64');
    }

    // Return the base64 string directly
    return NextResponse.json({ assetUrl: base64Image });
  } catch (error) {
    console.error('Image generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: `Failed to generate image: ${errorMessage}` },
      { status: 500 }
    );
  }
}
