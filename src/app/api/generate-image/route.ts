import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: NextRequest) {
  try {
    const { prompt, type } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check if API token exists
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    console.log('Generating image with prompt:', prompt, 'type:', type);

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Use SDXL Lightning for faster generation
    const model = "bytedance/sdxl-lightning-4step:727e49a643e999d602a896c774a0658ffefea21465756a6ce24b7ea4165eba6a";
    
    // Customize prompt based on asset type
    let enhancedPrompt = prompt;
    if (type === 'character') {
      enhancedPrompt = `${prompt}, game sprite, centered, clean design, vibrant colors, simple shapes, white background, 2D game asset`;
    } else if (type === 'background') {
      enhancedPrompt = `${prompt}, 2D game background, vibrant colors, simple design, side-scrolling game background`;
    } else if (type === 'obstacle') {
      enhancedPrompt = `${prompt}, game obstacle, simple design, vibrant colors, 2D game asset`;
    }

    console.log('Enhanced prompt:', enhancedPrompt);

    const output = await replicate.run(model, {
      input: {
        prompt: enhancedPrompt,
        negative_prompt: "blurry, bad quality, text, watermark, signature, 3d render, realistic, photograph",
        width: type === 'background' ? 1024 : 512,
        height: type === 'background' ? 768 : 512,
        num_inference_steps: 4,
        guidance_scale: 0,
        scheduler: "K_EULER",
        num_outputs: 1,
      }
    });

    console.log('Replicate output:', output);

    const imageUrl = Array.isArray(output) ? output[0] : output;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from Replicate');
    }

    console.log('Generated image URL:', imageUrl);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
