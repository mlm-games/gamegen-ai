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

    const parameterConstraints = {
      'flappy-bird': {
        gravity: { min: 200, max: 1500, description: 'How fast the bird falls' },
        jumpVelocity: { min: -500, max: -200, description: 'How high the bird jumps (negative value)' },
        pipeSpeed: { min: 100, max: 400, description: 'How fast pipes move' },
        gapSize: { min: 100, max: 250, description: 'Gap between pipes' },
        pipeSpawnDelay: { min: 1000, max: 3000, description: 'Time between pipe spawns in ms' }
      },
      'endless-runner': {
        speed: { min: 100, max: 500, description: 'Player running speed' },
        jumpVelocity: { min: -600, max: -250, description: 'How high the player jumps' },
        gravity: { min: 500, max: 2000, description: 'Gravity strength' },
        spawnRate: { min: 1000, max: 4000, description: 'Time between obstacle spawns in ms' }
      },
      'whack-a-mole': {
          spawnRate: { min: 300, max: 2000, description: 'How often moles appear in ms' },
          moleUpTime: { min: 500, max: 2500, description: 'How long a mole stays visible in ms' }
      },
      'crossy-road': {
          speed: {min: 50, max: 300, description: 'Base speed of cars'},
          spawnRate: {min: 500, max: 3000, description: 'How often cars appear in ms'}
      },
      'match-3': {
          gridSize: { min: 6, max: 10, description: 'The size of the grid (e.g., 8 means 8x8)'},
      }
    };

    const constraints = parameterConstraints[gameType as keyof typeof parameterConstraints] || {};

    const systemPrompt = `You are a game parameter tuning assistant. Based on the user's request, adjust the game parameters within the given constraints. Return ONLY valid JSON with the updated parameters.

Current parameters: ${JSON.stringify(currentParameters)}

Constraints: ${JSON.stringify(constraints)}

Rules:
- Only modify parameters relevant to the user's request.
- Keep values within the min/max constraints.
- Consider game balance and playability. For "easier", increase gaps, reduce speed/gravity. For "harder", do the opposite.
- Your entire response must be a single, valid JSON object, and nothing else.
- For 'jumpVelocity', a smaller absolute number (e.g., -300) is a higher jump than a larger absolute number (e.g., -450).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content || '{}';
    const parameters = JSON.parse(responseText);

    const validatedParameters: Record<string, number> = {};
    for (const key in parameters) {
      if (Object.prototype.hasOwnProperty.call(parameters, key) && constraints[key]) {
        const value = Number(parameters[key]);
        const constraint = constraints[key] as { min: number, max: number};
        if (!isNaN(value)) {
            validatedParameters[key] = Math.max(constraint.min, Math.min(constraint.max, value));
        }
      }
    }

    return NextResponse.json({ parameters: validatedParameters });
  } catch (error) {
    console.error('Parameter update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: `Failed to update parameters: ${errorMessage}` },
      { status: 500 }
    );
  }
}
