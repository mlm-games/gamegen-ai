import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, currentParameters, parameterConfigs } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a game parameter tuning assistant. Based on the user's request, adjust the game parameters within the given constraints. Return ONLY valid JSON with the updated parameters.

Current parameters: ${JSON.stringify(currentParameters)}

Constraints: ${JSON.stringify(parameterConfigs)}

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
      if (Object.prototype.hasOwnProperty.call(parameters, key) && parameterConfigs[key]) {
        const value = Number(parameters[key]);
        const constraint = parameterConfigs[key] as { min: number; max: number };
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