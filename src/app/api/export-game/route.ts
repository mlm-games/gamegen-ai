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

    // Create the HTML file
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #1a1a1a;
        }
        #game-container {
            border: 2px solid #333;
            border-radius: 8px;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <div id="game-container"></div>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    <script src="game.js"></script>
    <script>
        // Initialize game with config
        const gameConfig = ${JSON.stringify(config, null, 2)};
        
        // Start the game
        window.addEventListener('load', () => {
            new GameMain(gameConfig);
        });
    </script>
</body>
</html>`;

    zip.file('index.html', htmlContent);

    // Read the game template file
    const gameTemplatePath = path.join(
      process.cwd(),
      'src',
      'games',
      'templates',
      template,
      'game.ts'
    );
    
    let gameCode = await fs.readFile(gameTemplatePath, 'utf-8');
    
    // Convert TypeScript to JavaScript (simple transformation)
    gameCode = gameCode
      .replace(/import.*from.*['"]/g, '') // Remove imports
      .replace(/export default class/g, 'class')
      .replace(/: \w+/g, '') // Remove type annotations
      .replace(/private |public |protected /g, '') // Remove access modifiers
      .replace(/\?:/g, ':') // Remove optional property markers
      .replace(/interface \w+ {[^}]*}/g, '') // Remove interfaces
      
    // Wrap in a main game class
    const gameJs = `
${gameCode}

class GameMain {
    constructor(config) {
        const phaserConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'game-container',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: new ${template.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Game(config)
        };
        
        new Phaser.Game(phaserConfig);
    }
}`;

    zip.file('game.js', gameJs);

    // Create assets folder and add a readme
    zip.folder('assets');
    zip.file('assets/README.txt', 'Place your game assets in this folder');

    // Add config.json for reference
    zip.file('config.json', JSON.stringify(config, null, 2));

    // Generate the zip file
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
