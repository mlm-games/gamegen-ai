import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { template: string } }
) {
  try {
    const template = params.template;
    const gamePath = path.join(process.cwd(), 'game-templates', template, 'index.html');
    
    const html = await fs.readFile(gamePath, 'utf-8');
    
    // Modify paths to use the API route for game.js
    const modifiedHtml = html.replace(
      'src="game.js"',
      `src="/api/game-preview/${template}/game.js"`
    );
    
    return new NextResponse(modifiedHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    return new NextResponse('Game not found', { status: 404 });
  }
}