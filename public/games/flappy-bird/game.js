class FlappyBirdGame extends Phaser.Scene {
  constructor() {
    super({ key: 'FlappyBirdGame' });
  }

  init() {
    this.gameConfig = window.GAME_CONFIG || {};
    console.log('Game initialized with config:', this.gameConfig);
    this.score = 0;
  }

  preload() {
    console.log('Preloading with config:', this.gameConfig);
    
    // Load custom assets if provided
    if (this.gameConfig.assets && this.gameConfig.assets.player) {
      const playerAsset = this.gameConfig.assets.player;
      console.log('Loading custom player');
      if (playerAsset.startsWith('data:')) {
        this.textures.addBase64('bird', playerAsset);
      } else {
        this.load.image('bird', playerAsset);
      }
    }
    
    if (this.gameConfig.assets && this.gameConfig.assets.background) {
      const bgAsset = this.gameConfig.assets.background;
      console.log('Loading custom background');
      if (bgAsset.startsWith('data:')) {
        this.textures.addBase64('background', bgAsset);
      } else {
        this.load.image('background', bgAsset);
      }
    }
    
    if (this.gameConfig.assets && this.gameConfig.assets.obstacles && Array.isArray(this.gameConfig.assets.obstacles) && this.gameConfig.assets.obstacles[0]) {
      const pipeAsset = this.gameConfig.assets.obstacles[0];
      console.log('Loading custom pipe');
      if (pipeAsset.startsWith('data:')) {
        this.textures.addBase64('pipe', pipeAsset);
      } else {
        this.load.image('pipe', pipeAsset);
      }
    }
    
    // Load default assets as fallback
    this.load.image('bird-default', '/games/flappy-bird/assets/bird.png');
    this.load.image('background-default', '/games/flappy-bird/assets/background.png');
    this.load.image('pipe-default', '/games/flappy-bird/assets/pipe.png');
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
    
    // Bird with adjusted collision box
    this.bird = this.physics.add.sprite(100, 300, birdAsset);
    this.bird.setGravityY(this.gameConfig.parameters?.gravity || 800);
    this.bird.setCollideWorldBounds(true);
    
    // Scale the bird
    const birdScale = 0.4;
    this.bird.setScale(birdScale);
    // this.bird.setCircle(20);
    this.bird.debugShowBody = true;
    
    // This makes the game more forgiving and fun
    const birdWidth = this.bird.width * birdScale;
    const birdHeight = this.bird.height * birdScale;
    this.bird.body.setSize(birdWidth * 0.4, birdHeight * 0.4); // 60% of actual size
    
    // Debug: Show collision boxes
    // this.physics.world.createDebugGraphic();
    
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
    if (!this.bird || !this.bird.body) return;
    
    // Rotate bird based on velocity
    const velocity = this.bird.body.velocity.y;
    this.bird.angle = Phaser.Math.Clamp(velocity * 0.1, -30, 90);
    
    // Check if bird is out of bounds
    if (this.bird.y < 0 || this.bird.y > 600) {
      this.gameOver();
    }
    
    // Remove pipes that have gone off screen
    this.pipes.children.entries.forEach(pipe => {
      if (pipe.x < -100) {
        // Check if this pipe hasn't been scored yet
        if (!pipe.getData('scored')) {
          this.score++;
          this.scoreText.setText('Score: ' + this.score);
          // Mark the pipe pair as scored
          this.pipes.children.entries.forEach(p => {
            if (Math.abs(p.x - pipe.x) < 10) {
              p.setData('scored', true);
            }
          });
        }
        pipe.destroy();
      }
    });
  }

  jump() {
    if (this.bird && this.bird.body) {
      this.bird.setVelocityY(this.gameConfig.parameters?.jumpVelocity || -350);
    }
  }

  spawnPipe(pipeAsset) {
    const gap = this.gameConfig.parameters?.gapSize || 120;
    const pipeTop = Phaser.Math.Between(100, 400 - gap);
    
    // Top pipe
    const topPipe = this.pipes.create(850, pipeTop, pipeAsset);
    topPipe.setVelocityX(-(this.gameConfig.parameters?.pipeSpeed || 200));
    topPipe.setOrigin(0.5, 1);
    topPipe.setImmovable(true);
    
    // Scale pipes
    const pipeScaleX = 0.5;
    const pipeScaleY = 1;
    topPipe.setScale(pipeScaleX, pipeScaleY);
    
    // Adjust pipe collision box to be more forgiving
    const pipeWidth = topPipe.width * pipeScaleX;
    topPipe.body.setSize(pipeWidth * 0.8, topPipe.height); // 80% width for more forgiving gameplay
    topPipe.body.setOffset(pipeWidth * 0.1, 0);
    
    // Bottom pipe
    const bottomPipe = this.pipes.create(850, pipeTop + gap, pipeAsset);
    bottomPipe.setVelocityX(-(this.gameConfig.parameters?.pipeSpeed || 200));
    bottomPipe.setOrigin(0.5, 0);
    bottomPipe.setFlipY(true);
    bottomPipe.setScale(pipeScaleX, pipeScaleY);
    bottomPipe.setImmovable(true);
    
    // Adjust bottom pipe collision box
    bottomPipe.body.setSize(pipeWidth * 0.8, bottomPipe.height);
    bottomPipe.body.setOffset(pipeWidth * 0.1, 0);
  }

  gameOver() {
    this.physics.pause();
    this.bird.setTint(0xff0000);
    
    const gameOverText = this.add.text(400, 250, 'Game Over!', {
      fontSize: '64px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 8
    }).setOrigin(0.5);
    
    const finalScoreText = this.add.text(400, 320, 'Score: ' + this.score, {
      fontSize: '32px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    const restartText = this.add.text(400, 380, 'Click to restart', {
      fontSize: '24px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Restart on click
    this.input.once('pointerdown', () => {
      this.scene.restart();
      this.score = 0;
    });
  }
}

// Initialize the game
window.addEventListener('load', () => {
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false // Set to true to see collision boxes
      }
    },
    scene: FlappyBirdGame
  };
  
  new Phaser.Game(config);
});
