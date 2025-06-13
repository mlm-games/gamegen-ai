import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, type } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('Generating image with prompt:', prompt);

    // Use SDXL for better game asset generation
    const model = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";
    
    // Customize prompt based on asset type
    let enhancedPrompt = prompt;
    if (type === 'character') {
      enhancedPrompt = `${prompt}, centered, game sprite, clean design, vibrant colors, simple shapes, white background`;
    } else if (type === 'background') {
      enhancedPrompt = `${prompt}, 2D game background, parallax layer, vibrant colors, detailed`;
    } else if (type === 'obstacle') {
      enhancedPrompt = `${prompt}, game obstacle, simple design, vibrant colors`;
    }

    const output = await replicate.run(model, {
      input: {
        prompt: enhancedPrompt,
        negative_prompt: "blurry, bad quality, text, watermark, signature, 3d render, realistic",
        width: type === 'background' ? 1024 : 512,
        height: type === 'background' ? 768 : 512,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 25,
      }
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;
    console.log('Generated image URL:', imageUrl);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
