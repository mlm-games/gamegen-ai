// public/games/flappy-bird/game.js
class FlappyBirdGame extends Phaser.Scene {
  constructor(config) {
    super({ key: 'FlappyBirdGame' });
    this.gameConfig = config || {};
    this.score = 0;
  }

  preload() {
    console.log('Game config:', this.gameConfig);
    
    // Load custom assets if provided
    if (this.gameConfig.assets && this.gameConfig.assets.player) {
      const playerAsset = this.gameConfig.assets.player;
      console.log('Loading custom player:', playerAsset.substring ? playerAsset.substring(0, 50) + '...' : playerAsset);
      if (playerAsset.startsWith && playerAsset.startsWith('data:')) {
        // Base64 image
        this.textures.addBase64('bird', playerAsset);
      } else {
        // URL
        this.load.image('bird', playerAsset);
      }
    }
    
    if (this.gameConfig.assets && this.gameConfig.assets.background) {
      const bgAsset = this.gameConfig.assets.background;
      console.log('Loading custom background:', bgAsset.substring ? bgAsset.substring(0, 50) + '...' : bgAsset);
      if (bgAsset.startsWith && bgAsset.startsWith('data:')) {
        // Base64 image
        this.textures.addBase64('background', bgAsset);
      } else {
        // URL
        this.load.image('background', bgAsset);
      }
    }
    
    if (this.gameConfig.assets && this.gameConfig.assets.obstacles && Array.isArray(this.gameConfig.assets.obstacles) && this.gameConfig.assets.obstacles[0]) {
      const pipeAsset = this.gameConfig.assets.obstacles[0];
      console.log('Loading custom pipe:', pipeAsset.substring ? pipeAsset.substring(0, 50) + '...' : pipeAsset);
      if (pipeAsset.startsWith && pipeAsset.startsWith('data:')) {
        // Base64 image
        this.textures.addBase64('pipe', pipeAsset);
      } else {
        // URL
        this.load.image('pipe', pipeAsset);
      }
    }
    
    // Load default assets as fallback (these will be embedded in exported version)
    this.load.image('bird-default', '/games/flappy-bird/assets/bird.png');
    this.load.image('background-default', '/games/flappy-bird/assets/background.png');
    this.load.image('pipe-default', '/games/flappy-bird/assets/pipe.png');
    
    // Add load complete handler
    this.load.on('complete', () => {
      console.log('All assets loaded');
    });
    
    // Add error handling
    this.load.on('loaderror', (file) => {
      console.error('Failed to load:', file.src);
    });
  }

  create() {
    // Set background color first
    this.cameras.main.setBackgroundColor('#87CEEB');
    
    // Check which assets loaded successfully
    const birdAsset = this.textures.exists('bird') ? 'bird' : 'bird-default';
    const bgAsset = this.textures.exists('background') ? 'background' : 'background-default';
    const pipeAsset = this.textures.exists('pipe') ? 'pipe' : 'pipe-default';
    
    console.log('Using assets:', { bird: birdAsset, background: bgAsset, pipe: pipeAsset });
    
    // Background
    const bg = this.add.image(400, 300, bgAsset);
    bg.setDisplaySize(800, 600);
    
    // Bird
    this.bird = this.physics.add.sprite(100, 300, birdAsset);
    this.bird.setGravityY(this.gameConfig.parameters?.gravity || 800);
    this.bird.setCollideWorldBounds(true);
    this.bird.setScale(0.5); // Scale down if needed
    
    // Pipes
    this.pipes = this.physics.add.group();
    
    // Spawn pipes timer
    this.time.addEvent({
      delay: this.gameConfig.parameters?.pipeSpawnDelay || 1500,
      callback: () => this.spawnPipe(pipeAsset),
      callbackScope: this,
      loop: true
    });
    
    // Score text
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    });
    
    // Controls
    this.input.on('pointerdown', () => this.jump());
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.jump());
    }
    
    // Collisions
    this.physics.add.collider(this.bird, this.pipes, () => this.gameOver());
  }

  update() {
    if (!this.bird) return;
    
    // Check if bird is out of bounds
    if (this.bird.y < 0 || this.bird.y > 600) {
      this.gameOver();
    }
    
    // Remove pipes that have gone off screen
    this.pipes.children.entries.forEach(pipe => {
      if (pipe.x < -50) {
        pipe.destroy();
        this.score++;
        this.scoreText.setText('Score: ' + this.score);
      }
    });
  }

  jump() {
    if (this.bird) {
      this.bird.setVelocityY(this.gameConfig.parameters?.jumpVelocity || -350);
    }
  }

  spawnPipe(pipeAsset) {
    const gap = this.gameConfig.parameters?.gapSize || 120;
    const pipeTop = Phaser.Math.Between(50, 350 - gap);
    
    // Top pipe
    const topPipe = this.pipes.create(800, pipeTop, pipeAsset);
    topPipe.setVelocityX(-(this.gameConfig.parameters?.pipeSpeed || 200));
    topPipe.setOrigin(0.5, 1);
    topPipe.setScale(0.5, 1); // Scale width if needed
    
    // Bottom pipe
    const bottomPipe = this.pipes.create(800, pipeTop + gap, pipeAsset);
    bottomPipe.setVelocityX(-(this.gameConfig.parameters?.pipeSpeed || 200));
    bottomPipe.setOrigin(0.5, 0);
    bottomPipe.setFlipY(true);
    bottomPipe.setScale(0.5, 1); // Scale width if needed
  }

  gameOver() {
    this.scene.restart();
    this.score = 0;
  }
}

// Main game class that initializes Phaser
class GameMain {
  constructor(config) {
    console.log('GameMain constructor received:', config);
    console.log('Config type:', typeof config);
    console.log('Config stringified:', JSON.stringify(config));
    
    // Ensure config has proper structure
    if (!config || typeof config !== 'object') {
      console.warn('Invalid config, using defaults');
      config = {};
    }
    
    if (!config.assets || typeof config.assets !== 'object') {
      config.assets = {};
    }
    
    if (!config.parameters || typeof config.parameters !== 'object') {
      config.parameters = {};
    }
    
    // Fix obstacles if it's not an array
    if (!Array.isArray(config.assets.obstacles)) {
      console.log('Obstacles is not an array:', config.assets.obstacles);
      if (config.assets.obstacles && typeof config.assets.obstacles === 'object') {
        // If it's an object, try to convert it to array
        config.assets.obstacles = Object.values(config.assets.obstacles);
      } else {
        config.assets.obstacles = [];
      }
    }
    
    console.log('Final config after fixes:', config);
    
    const phaserConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      backgroundColor: '#87CEEB',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: new FlappyBirdGame(config)
    };
    
    this.game = new Phaser.Game(phaserConfig);
  }
}
