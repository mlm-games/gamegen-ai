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
      return NextResponse.json({ error: 'Template and config are required' }, { status: 400 });
    }

    const defaultAssetMap: Record<string, Record<string, string>> = {
      'flappy-bird': {
        bird: 'bird',
        background: 'background',
        pipe: 'pipe'
      },
      'endless-runner': {
        player: 'player',
        background: 'background',
        obstacle: 'obstacle',
        ground: 'ground'
      },
      'whack-a-mole': {
        mole: 'mole',
        hole: 'hole',
        background: 'background',
        hammer: 'hammer'
      },
      'match-3': {
        background: 'background',
        red: 'gem-red',
        blue: 'gem-blue',
        green: 'gem-green',
        yellow: 'gem-yellow',
        purple: 'gem-purple',
        orange: 'gem-orange'
      },
      'crossy-road': {
        player: 'chicken',
        background: 'background',
        vehicle: 'car',
        road: 'road',
        grass: 'grass'
      },
    };

    const assetMap = defaultAssetMap[template];
    if (!assetMap) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    const zip = new JSZip();
    const gamePath = path.join(process.cwd(), 'public', 'games', template);

    let gameJs = await fs.readFile(path.join(gamePath, 'game.js'), 'utf-8');
    // Load default assets as base64
    const defaultAssets: Record<string, string> = {};
    for (const key in assetMap) {

      const filename = assetMap[key];
      const assetPath = path.join(process.cwd(), 'public', `games/${template}/assets/${filename}.png`);
      const base64 = await imageToBase64(assetPath);
      try {
        if (base64) {
          defaultAssets[key] = await imageToBase64(assetPath);
        }
      } catch (e) {
        console.error(`Failed to load default asset ${key} for ${template}:`, e);
      }
    }

    // Special cases for external or unique assets
    if (template === 'endless-runner' && !defaultAssets['particle']) {
      defaultAssets['particle'] = await fetchImageAsBase64('https://labs.phaser.io/assets/particles/white.png');
    }

    // Create modified config with base64 assets
    const modifiedConfig = JSON.parse(JSON.stringify(config));

    // Handle player asset
    if (modifiedConfig.assets.player) {
      if (modifiedConfig.assets.player.startsWith('http')) {
        modifiedConfig.assets.player = await fetchImageAsBase64(modifiedConfig.assets.player);
      } else if (modifiedConfig.assets.player.startsWith('/')) {
        const localPath = path.join(process.cwd(), 'public', modifiedConfig.assets.player);
        modifiedConfig.assets.player = await imageToBase64(localPath);
      }
    }

    // Handle background asset
    if (modifiedConfig.assets.background) {
      if (modifiedConfig.assets.background.startsWith('http')) {
        modifiedConfig.assets.background = await fetchImageAsBase64(modifiedConfig.assets.background);
      } else if (modifiedConfig.assets.background.startsWith('/')) {
        const localPath = path.join(process.cwd(), 'public', modifiedConfig.assets.background);
        modifiedConfig.assets.background = await imageToBase64(localPath);
      }
    }

    // Handle obstacles
    if (modifiedConfig.assets.obstacles && Array.isArray(modifiedConfig.assets.obstacles)) {
      for (let i = 0; i < modifiedConfig.assets.obstacles.length; i++) {
        let obs = modifiedConfig.assets.obstacles[i];
        if (obs.startsWith('http')) {
          obs = await fetchImageAsBase64(obs);
        } else if (obs.startsWith('/')) {
          const localPath = path.join(process.cwd(), 'public', obs);
          obs = await imageToBase64(localPath);
        }
        modifiedConfig.assets.obstacles[i] = obs;
      }
    }

    // Handle items
    if (modifiedConfig.assets.items && Array.isArray(modifiedConfig.assets.items)) {
      for (let i = 0; i < modifiedConfig.assets.items.length; i++) {
        let item = modifiedConfig.assets.items[i];
        if (item.startsWith('http')) {
          item = await fetchImageAsBase64(item);
        } else if (item.startsWith('/')) {
          const localPath = path.join(process.cwd(), 'public', item);
          item = await imageToBase64(localPath);
        }
        modifiedConfig.assets.items[i] = item;
      }
    }

    // Create a self-contained game.js with embedded assets
    let gameJsContent = `
    // Embedded default assets
    const DEFAULT_ASSETS = ${JSON.stringify(defaultAssets, null, 2)};

    // Embedded game configuration
    window.GAME_CONFIG = ${JSON.stringify(modifiedConfig, null, 2)};

    ${gameJs}
    `;

    // Apply replacements to use embedded assets instead of paths
    let modifiedGameJs = gameJsContent;

    // Flexible regex to match load.image with any quote type and string literals
    const assetPatterns = [
      // For default -default loads
      { pattern: /this\.load\.image\(\s*['"`]([^'"`]+)-default['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\);/g, replacement: "if (DEFAULT_ASSETS['$1']) { this.textures.addBase64('$1-default', DEFAULT_ASSETS['$1']); }" },
      // For path-based loads, including template literals like `/games/.../gem-${color}.png`
      {
        pattern: /this\.load\.image\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:`([^`]+)`|'([^']+)'|"([^"]+)")\s*\);/g, replacement: (match: any, key: any, pathBacktick: any, pathSingle: any, pathDouble: any) => {
          const assetPath = pathBacktick || pathSingle || pathDouble;
          // Extract the base asset name (e.g., 'gem-red' from 'gem-${color}')
          const assetNameMatch = assetPath.match(/assets\/(gem-)?([^\/.]+)(?:\$\{[^}]+\})?\.png/);
          const assetName = assetNameMatch ? assetNameMatch[2] : key;
          console.log(`Replacing load for key '${key}' with asset '${assetName}'`); // Debug log
          return `if (DEFAULT_ASSETS['${assetName}']) { this.textures.addBase64('${key}', DEFAULT_ASSETS['${assetName}']); }`;
        }
      },
      // For external URLs like particles
      { pattern: /this\.load\.image\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`](https?:\/\/[^'"`]+)['"`]\s*\);/g, replacement: "if (DEFAULT_ASSETS['$1']) { this.textures.addBase64('$1', DEFAULT_ASSETS['$1']); }" }
    ];


    assetPatterns.forEach(({ pattern, replacement }) => {
      modifiedGameJs = modifiedGameJs.replace(pattern, replacement as any);
    });

    // Special replacement for cursor in whack-a-mole
    if (template === 'whack-a-mole') {
      modifiedGameJs = modifiedGameJs.replace(
        /this\.input\.setDefaultCursor\(\s*['"`]url\(\/games\/whack-a-mole\/assets\/hammer\.png\),\s*pointer['"`]\s*\);/g,
        "this.input.setDefaultCursor(`url(${DEFAULT_ASSETS['hammer'] || '/games/whack-a-mole/assets/hammer.png'}), pointer`);"
      );
    }

    // Create a minimal HTML file
    const modifiedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name}</title>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #2d3748;
        }
        #game-container {
            border: 2px solid #333;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div id="game-container"></div>
    <script src="game.js"></script>
</body>
</html>`;

    // Add files to zip
    zip.file('index.html', modifiedHtml);
    zip.file('game.js', modifiedGameJs);
    zip.file('config.json', JSON.stringify(modifiedConfig, null, 2));
    zip.file('README.txt', `${config.name || 'Your Game'}
    
This game is fully self-contained. Just open index.html in any web browser to play!

Game created with GameGen AI - No coding required!`);

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