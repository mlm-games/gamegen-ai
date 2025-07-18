import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { template: string } }
) {
  try {
    const template = params.template;
    const gamePath = path.join(process.cwd(), 'game-templates', template);
    
    // Check if we're requesting the JS file
    const url = new URL(request.url);
    if (url.pathname.endsWith('.js')) {
      const jsPath = path.join(gamePath, 'game.js');
      const js = await fs.readFile(jsPath, 'utf-8');
      return new NextResponse(js, {
        headers: { 'Content-Type': 'application/javascript' },
      });
    }

    // Otherwise, return the HTML
    const htmlPath = path.join(gamePath, 'index.html');
    let html = await fs.readFile(htmlPath, 'utf-8');
    
    // Modify the script src to point to this API route
    html = html.replace(
      'src="game.js"',
      `src="/api/game-preview/${template}/game.js"`
    );
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    return new NextResponse('Game not found', { status: 404 });
  }
}