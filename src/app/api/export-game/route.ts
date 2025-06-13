// src/app/api/export-game/route.ts
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';

async function imageToBase64(imagePath: string): Promise<string> {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    return '';
  }
}

async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Failed to fetch image as base64:', error);
    return '';
  }
}

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
    let gameJs = await fs.readFile(path.join(gamePath, 'game.js'), 'utf-8');
    const indexHtml = await fs.readFile(path.join(gamePath, 'index.html'), 'utf-8');

    // Create a modified config with base64 assets
    const modifiedConfig = JSON.parse(JSON.stringify(config));
    
    // Convert assets to base64
    if (modifiedConfig.assets.player) {
      if (modifiedConfig.assets.player.startsWith('http')) {
        modifiedConfig.assets.player = await fetchImageAsBase64(modifiedConfig.assets.player);
      } else if (modifiedConfig.assets.player.startsWith('/')) {
        const localPath = path.join(process.cwd(), 'public', modifiedConfig.assets.player);
        modifiedConfig.assets.player = await imageToBase64(localPath);
      }
    }

    if (modifiedConfig.assets.background) {
      if (modifiedConfig.assets.background.startsWith('http')) {
        modifiedConfig.assets.background = await fetchImageAsBase64(modifiedConfig.assets.background);
      } else if (modifiedConfig.assets.background.startsWith('/')) {
        const localPath = path.join(process.cwd(), 'public', modifiedConfig.assets.background);
        modifiedConfig.assets.background = await imageToBase64(localPath);
      }
    }

    if (modifiedConfig.assets.obstacles && Array.isArray(modifiedConfig.assets.obstacles)) {
      for (let i = 0; i < modifiedConfig.assets.obstacles.length; i++) {
        if (modifiedConfig.assets.obstacles[i].startsWith('http')) {
          modifiedConfig.assets.obstacles[i] = await fetchImageAsBase64(modifiedConfig.assets.obstacles[i]);
        } else if (modifiedConfig.assets.obstacles[i].startsWith('/')) {
          const localPath = path.join(process.cwd(), 'public', modifiedConfig.assets.obstacles[i]);
          modifiedConfig.assets.obstacles[i] = await imageToBase64(localPath);
        }
      }
    }

    // Also convert default assets to base64
    const defaultAssets: Record<string, string> = {};
    try {
      const assetsPath = path.join(gamePath, 'assets');
      const assetFiles = await fs.readdir(assetsPath);
      
      for (const file of assetFiles) {
        const filePath = path.join(assetsPath, file);
        const base64Data = await imageToBase64(filePath);
        const assetKey = file.replace('.png', '').replace('.jpg', '');
        defaultAssets[assetKey] = base64Data;
      }
    } catch (e) {
      console.log('No default assets folder found');
    }

    // Modify game.js to include embedded default assets
    const defaultAssetsScript = `
// Embedded default assets
const DEFAULT_ASSETS = ${JSON.stringify(defaultAssets, null, 2)};
`;

    // Update game.js to use embedded assets
    gameJs = gameJs.replace(
      "this.load.image('bird-default', '/games/flappy-bird/assets/bird.png');",
      "if (DEFAULT_ASSETS.bird) { this.textures.addBase64('bird-default', DEFAULT_ASSETS.bird); } else { this.load.image('bird-default', '/games/flappy-bird/assets/bird.png'); }"
    );
    gameJs = gameJs.replace(
      "this.load.image('background-default', '/games/flappy-bird/assets/background.png');",
      "if (DEFAULT_ASSETS.background) { this.textures.addBase64('background-default', DEFAULT_ASSETS.background); } else { this.load.image('background-default', '/games/flappy-bird/assets/background.png'); }"
    );
    gameJs = gameJs.replace(
      "this.load.image('pipe-default', '/games/flappy-bird/assets/pipe.png');",
      "if (DEFAULT_ASSETS.pipe) { this.textures.addBase64('pipe-default', DEFAULT_ASSETS.pipe); } else { this.load.image('pipe-default', '/games/flappy-bird/assets/pipe.png'); }"
    );

    // Add the default assets at the beginning of the file
    gameJs = defaultAssetsScript + gameJs;

    // Modify the HTML to embed the config
    const modifiedHtml = indexHtml.replace(
      "window.GAME_CONFIG = JSON.parse(localStorage.getItem('gameConfig') || '{}');",
      `window.GAME_CONFIG = ${JSON.stringify(modifiedConfig, null, 2)};`
    );

    // Add files to zip
    zip.file('index.html', modifiedHtml);
    zip.file('game.js', gameJs);
    zip.file('config.json', JSON.stringify(modifiedConfig, null, 2));
    zip.file('README.txt', 'This game is fully self-contained. Just open index.html in any web browser to play!');

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
      { error: 'Failed to export game: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
