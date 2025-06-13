import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, currentParameters, gameType } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Define parameter constraints based on game type
    const parameterConstraints = {
      'flappy-bird': {
        gravity: { min: 200, max: 1500, description: 'How fast the bird falls' },
        jumpVelocity: { min: -500, max: -200, description: 'How high the bird jumps (negative value)' },
        pipeSpeed: { min: 100, max: 400, description: 'How fast pipes move' },
        gapSize: { min: 80, max: 200, description: 'Gap between pipes' },
        pipeSpawnDelay: { min: 1000, max: 3000, description: 'Time between pipe spawns in ms' }
      },
      // Add constraints for other game types
    };

    const constraints = parameterConstraints[gameType as keyof typeof parameterConstraints] || {};

    const systemPrompt = `You are a game parameter tuning assistant. Based on the user's request, adjust the game parameters within the given constraints. Return only valid JSON with the updated parameters.

Current parameters: ${JSON.stringify(currentParameters)}

Constraints: ${JSON.stringify(constraints)}

Rules:
- Only modify parameters mentioned in the user's request
- Keep values within the min/max constraints
- Consider game balance and playability
- Return only the parameters that should be changed`;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    // const responseText = completion.choices[0].message.content || '{}';
    // const parameters = JSON.parse(responseText);

    // Validate parameters are within constraints
    const validatedParameters: Record<string, number> = {};
    // for (const [key, value] of Object.entries(parameters)) {
    //   if (constraints[key] && typeof value === 'number') {
    //     const constraint = constraints[key] as any;
    //     validatedParameters[key] = Math.max(
    //       constraint.min,
    //       Math.min(constraint.max, value)
    //     );
    //   }
    // }

    return NextResponse.json({ parameters: validatedParameters });
  } catch (error) {
    console.error('Parameter update error:', error);
    return NextResponse.json(
      { error: 'Failed to update parameters' },
      { status: 500 }
    );
  }
}
