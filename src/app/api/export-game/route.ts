import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function assetToBase64(assetUrl: string): Promise<string> {
  if (!assetUrl) return '';
  if (assetUrl.startsWith('data:')) return assetUrl; // Already base64

  try {
    if (assetUrl.startsWith('http')) {
      const response = await fetch(assetUrl);
      if (!response.ok) throw new Error(`Failed to fetch ${assetUrl}: ${response.statusText}`);
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/png';
      return `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
    } else {
      const localPath = path.join(process.cwd(), 'public', assetUrl);
      const imageBuffer = await fs.readFile(localPath);
      const mimeType = assetUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    }
  } catch (error) {
    console.error(`Failed to process asset: ${assetUrl}`, error);
    return ''; // Return empty string on failure
  }
}

// --- Main Export Logic ---

export async function POST(request: NextRequest) {
  try {
    const { template, config } = await request.json();

    if (!template || !config) {
      return NextResponse.json({ error: 'Template and config are required' }, { status: 400 });
    }

    // --- 1. Collect and Convert All Assets ---

    const allAssets: { [key: string]: string } = {};
    const gameJsPath = path.join(process.cwd(), 'public', 'games', template, 'game.js');
    let gameJsContent = await fs.readFile(gameJsPath, 'utf-8');

    // Find and process all default assets from the original game.js
    const assetRegex = /this\.load\.image\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g;
    for (const match of gameJsContent.matchAll(assetRegex)) {
      const key = match[1];
      const url = match[2];
      allAssets[key] = await assetToBase64(url);
    }

    // Process special-case assets
    if (template === 'endless-runner') {
      allAssets['particle'] = await assetToBase64('https://labs.phaser.io/assets/particles/white.png');
    }
    if (template === 'whack-a-mole') {
      allAssets['hammer'] = await assetToBase64('/games/whack-a-mole/assets/hammer.png');
    }

    // Override defaults with custom assets from the config, using explicit mapping
    const customAssets = config.assets || {};
    const assetMap: { [key: string]: [string, string] } = {
      'flappy-bird': ['player', 'bird'],
      'endless-runner': ['player', 'player'],
      'whack-a-mole': ['player', 'mole'],
      'crossy-road': ['player', 'chicken']
    };
    if (assetMap[template] && customAssets[assetMap[template][0]]) {
      allAssets[assetMap[template][1]] = await assetToBase64(customAssets[assetMap[template][0]]);
      allAssets[`${assetMap[template][1]}-default`] = allAssets[assetMap[template][1]];
    }

    if (customAssets.background) {
      allAssets['background'] = await assetToBase64(customAssets.background);
      allAssets['background-default'] = allAssets['background'];
    }

    const obstacleMap: { [key: string]: string } = {
      'flappy-bird': 'pipe',
      'endless-runner': 'obstacle',
      'crossy-road': 'vehicle'
    };
    if (obstacleMap[template] && customAssets.obstacles && customAssets.obstacles.length > 0) {
      allAssets[obstacleMap[template]] = await assetToBase64(customAssets.obstacles[0]);
      allAssets[`${obstacleMap[template]}-default`] = allAssets[obstacleMap[template]];
    }

    // Correctly map custom Match-3 items
    if (template === 'match-3' && customAssets.items && customAssets.items.length > 0) {
      for (let i = 0; i < customAssets.items.length; i++) {
        const itemBase64 = await assetToBase64(customAssets.items[i]);
        // The game code checks for 'gem' + index for custom assets
        allAssets[`gem${i}`] = itemBase64;
      }
    }

    // --- 2. Create the Boot Scene ---

    const gameSceneKey = gameJsContent.match(/class\s+(\w+)\s+extends\s+Phaser\.Scene/)?.[1] || 'MainGame';

    const bootloaderCode = `
class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }
    preload() {
        const assets = window.ALL_ASSETS || {};
        for (const [key, data] of Object.entries(assets)) {
            if (data && !this.textures.exists(key)) {
                try { this.textures.addBase64(key, data); } catch (e) { console.error('Failed to load texture:', key, e); }
            }
        }
    }
    create() { this.scene.start('${gameSceneKey}'); }
}`;

    // Remove all asset loading calls
    let modifiedGameJs = gameJsContent.replace(/this\.load\.image\([^)]+\);?/g, '// Asset preloaded in BootScene');

    modifiedGameJs = modifiedGameJs.replace(/window\.addEventListener\('load'[\s\S]*/, '');

    // For whack-a-mole cursor, replace with base64 data
    if (template === 'whack-a-mole' && allAssets['hammer']) {
      modifiedGameJs = modifiedGameJs.replace(
        /url\([^)]+\)/,
        `url(${allAssets['hammer']})`
      );
    }

    // --- 4. Assemble the Final HTML File ---

    const finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name}</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }
        #game-container { border-radius: 8px; overflow: hidden; }
    </style>
</head>
<body>
    <div id="game-container"></div>
    <script>
        // --- EMBEDDED DATA ---
        window.GAME_CONFIG = ${JSON.stringify(config)};
        window.ALL_ASSETS = ${JSON.stringify(allAssets)};

        ${bootloaderCode}

        ${modifiedGameJs}

        // --- FINAL PHASER CONFIG ---
        const originalPhaserConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'game-container',
            physics: {
                default: 'arcade',
                arcade: { debug: false }
            },
            scene: [BootScene, ${gameSceneKey}]
        };
        new Phaser.Game(originalPhaserConfig);
    </script>
</body>
</html>`;

    return new NextResponse(finalHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${config.name.toLowerCase().replace(/\s+/g, '-')}.html"`
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