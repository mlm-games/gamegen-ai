import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { template, config } = await request.json();

    if (!template || !config) {
      return NextResponse.json(
        { error: 'Template and config are required' },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    const gamePath = path.join(process.cwd(), 'public', 'games', template);

    // Read the game files
    const gameJs = await fs.readFile(path.join(gamePath, 'game.js'), 'utf-8');
    const indexHtml = await fs.readFile(path.join(gamePath, 'index.html'), 'utf-8');

    // Modify the HTML to embed the config directly
    const modifiedHtml = indexHtml.replace(
      "window.GAME_CONFIG = JSON.parse(localStorage.getItem('gameConfig') || '{}');",
      `window.GAME_CONFIG = ${JSON.stringify(config, null, 2)};`
    );

    // Add files to zip
    zip.file('index.html', modifiedHtml);
    zip.file('game.js', gameJs);
    
    // Add config for reference
    zip.file('config.json', JSON.stringify(config, null, 2));

    // Create assets folder
    zip.folder('assets');
    zip.file('assets/README.txt', 'Place your game assets in this folder');

    // Generate the zip
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${config.name.toLowerCase().replace(/\s+/g, '-')}-game.zip"`
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export game' },
      { status: 500 }
    );
  }
}
