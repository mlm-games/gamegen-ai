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
    const gamePath = path.join(process.cwd(), 'game-templates', template);

    // Read game files
    let gameJs = await fs.readFile(path.join(gamePath, 'game.js'), 'utf-8');

    // Create modified config with base64 assets
    const modifiedConfig = JSON.parse(JSON.stringify(config));
    
    // Handle player asset
    if (modifiedConfig.assets.player) {
      if (modifiedConfig.assets.player.startsWith('http')) {
        modifiedConfig.assets.player = await fetchImageAsBase64(modifiedConfig.assets.player);
      } else if (modifiedConfig.assets.player.startsWith('/games/')) {
        // These are served from public/games/ for the preview
        const assetPath = modifiedConfig.assets.player.replace('/games/', '');
        const localPath = path.join(process.cwd(), 'public', 'games', assetPath);
        modifiedConfig.assets.player = await imageToBase64(localPath);
      }
    }

    // Handle background asset
    if (modifiedConfig.assets.background) {
      if (modifiedConfig.assets.background.startsWith('http')) {
        modifiedConfig.assets.background = await fetchImageAsBase64(modifiedConfig.assets.background);
      } else if (modifiedConfig.assets.background.startsWith('/games/')) {
        const assetPath = modifiedConfig.assets.background.replace('/games/', '');
        const localPath = path.join(process.cwd(), 'public', 'games', assetPath);
        modifiedConfig.assets.background = await imageToBase64(localPath);
      }
    }

    // Handle obstacles
    if (modifiedConfig.assets.obstacles && Array.isArray(modifiedConfig.assets.obstacles)) {
      for (let i = 0; i < modifiedConfig.assets.obstacles.length; i++) {
        const asset = modifiedConfig.assets.obstacles[i];
        if (asset.startsWith('http')) {
          modifiedConfig.assets.obstacles[i] = await fetchImageAsBase64(asset);
        } else if (asset.startsWith('/games/')) {
          const assetPath = asset.replace('/games/', '');
          const localPath = path.join(process.cwd(), 'public', 'games', assetPath);
          modifiedConfig.assets.obstacles[i] = await imageToBase64(localPath);
        }
      }
    }

    // Handle items
    if (modifiedConfig.assets.items && Array.isArray(modifiedConfig.assets.items)) {
      for (let i = 0; i < modifiedConfig.assets.items.length; i++) {
        const asset = modifiedConfig.assets.items[i];
        if (asset.startsWith('http')) {
          modifiedConfig.assets.items[i] = await fetchImageAsBase64(asset);
        } else if (asset.startsWith('/games/')) {
          const assetPath = asset.replace('/games/', '');
          const localPath = path.join(process.cwd(), 'public', 'games', assetPath);
          modifiedConfig.assets.items[i] = await imageToBase64(localPath);
        }
      }
    }

    // Load default assets from public/games/[template]/assets for embedding
    const defaultAssets: Record<string, string> = {};
    try {
      const publicAssetsPath = path.join(process.cwd(), 'public', 'games', template, 'assets');
      const assetFiles = await fs.readdir(publicAssetsPath);
      
      for (const file of assetFiles) {
        if (file.endsWith('.png') || file.endsWith('.jpg')) {
          const assetName = file.replace(/\.(png|jpg)$/, '');
          const assetPath = path.join(publicAssetsPath, file);
          defaultAssets[assetName] = await imageToBase64(assetPath);
        }
      }
    } catch (e) {
      console.log('No default assets found in public folder');
    }

    // Create a self-contained game.js with embedded assets
    const gameJsContent = `
// Embedded default assets
const DEFAULT_ASSETS = ${JSON.stringify(defaultAssets, null, 2)};

// Embedded game configuration
window.GAME_CONFIG = ${JSON.stringify(modifiedConfig, null, 2)};

${gameJs}
`;

    // Update all default asset loading to use embedded assets
    let modifiedGameJs = gameJsContent;
    
    // Replace all default asset loading patterns
    const assetPatterns = [
      { pattern: /this\.load\.image\('([^']+)-default',\s*'[^']+'\);/g, replacement: "if (DEFAULT_ASSETS['$1']) { this.textures.addBase64('$1-default', DEFAULT_ASSETS['$1']); }" },
      { pattern: /this\.load\.image\('([^']+)',\s*'\/games\/[^\/]+\/assets\/([^']+)\.png'\);/g, replacement: "if (DEFAULT_ASSETS['$2']) { this.textures.addBase64('$1', DEFAULT_ASSETS['$2']); }" }
    ];

    assetPatterns.forEach(({ pattern, replacement }) => {
      modifiedGameJs = modifiedGameJs.replace(pattern, replacement);
    });

    // Create a minimal HTML file
    const modifiedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
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
    zip.file('README.txt', `${config.name}
    
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