import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { template, config } = await request.json();

    if (!template || !config) {
      return NextResponse.json({ error: 'Template and config are required' }, { status: 400 });
    }

    const zip = new JSZip();
    const gameTemplatePath = path.join(process.cwd(), 'public', 'game-templates', template);

    // 1. Read the pre-compiled game.js
    const gameCode = await fs.readFile(path.join(gameTemplatePath, 'game.js'), 'utf-8');
    zip.file('game.js', gameCode);

    // 2. Read the template index.html
    const htmlTemplate = await fs.readFile(path.join(gameTemplatePath, 'index.html'), 'utf-8');

    // 3. Inject the final config directly into the HTML
    // This replaces the localStorage part for the exported version
    const finalHtml = htmlTemplate.replace(
      "window.GAME_CONFIG = JSON.parse(localStorage.getItem('gameConfig'));",
      `window.GAME_CONFIG = ${JSON.stringify(config, null, 2)};`
    );
    zip.file('index.html', finalHtml);
    
    // ... logic to fetch and add assets to the zip ...

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${config.name.toLowerCase().replace(/\s+/g, '-')}-game.zip"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export game' }, { status: 500 });
  }
}
