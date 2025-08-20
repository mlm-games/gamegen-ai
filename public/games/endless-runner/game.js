class EndlessRunnerGame extends Phaser.Scene {
  constructor() {
    super({ key: 'EndlessRunnerGame' });
    this.gameConfig = window.GAME_CONFIG || {};
    if (!this.gameConfig.assets) this.gameConfig.assets = {};
    if (!this.gameConfig.parameters) this.gameConfig.parameters = {};

    this.score = 0;
    this.gameSpeed = this.gameConfig.parameters.speed || 200;
    this.isGameOver = false;
  }

  preload() {
    if (this.gameConfig.assets && this.gameConfig.assets.player) {
      const asset = this.gameConfig.assets.player;
      if (asset.startsWith('data:')) {
        this.textures.addBase64('player', asset);
      } else {
        this.load.image('player', asset);
      }
    }
    if (this.gameConfig.assets.background) {
      this.load.image('background', this.gameConfig.assets.background);
    }
    if (this.gameConfig.assets.obstacles && this.gameConfig.assets.obstacles[0]) {
      const asset = this.gameConfig.assets.obstacles[0];
      if (asset.startsWith('data:')) {
        this.textures.addBase64('obstacle', asset);
      } else {
        this.load.image('obstacle', asset);
      }
    }

    this.load.image('player-default', '/games/endless-runner/assets/player.png');
    this.load.image('background-default', '/games/endless-runner/assets/background.png');
    this.load.image('obstacle-default', '/games/endless-runner/assets/obstacle.png');
    this.load.image('ground-default', '/games/endless-runner/assets/ground.png');

    // Load particles for jump effect
    this.load.image('particle', 'https://labs.phaser.io/assets/particles/white.png'); // Placeholder particle
  }

  create() {
    // Delay setup to allow Base64 textures to load
    this.time.delayedCall(100, this.setupGame, [], this);
  }

  setupGame() {
    const playerAsset = this.textures.exists('player') ? 'player' : 'player-default';
    const bgAsset = this.textures.exists('background') ? 'background' : 'background-default';
    const obstacleAsset = this.textures.exists('obstacle') ? 'obstacle' : 'obstacle-default';

    // Parallax background layers for better looks
    this.bgFar = this.add.tileSprite(400, 300, 800, 600, bgAsset).setDepth(0);
    this.bgNear = this.add.tileSprite(400, 300, 800, 600, bgAsset).setDepth(1).setAlpha(0.8); // Slightly overlay for depth

    this.ground = this.physics.add.staticGroup();
    this.ground.create(400, 580, 'ground-default').setScale(2, 1).refreshBody();

    this.player = this.physics.add.sprite(100, 450, playerAsset);

    const targetHeight = 80; // Fixed size for player
    const playerTexture = this.textures.get(playerAsset);
    const playerFrame = playerTexture.get(0);
    const scale = targetHeight / playerFrame.height;
    this.player.setScale(scale);

    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(this.gameConfig.parameters.gravity || 800);

    // Jump particles
    this.jumpParticles = this.add.particles(0, 0, 'particle', {
      speed: 100,
      scale: { start: 0.1, end: 0 },
      lifespan: 300,
      frequency: -1, // Emit on demand
    });
    this.jumpParticles.setDepth(2);

    this.obstacles = this.physics.add.group();

    this.time.addEvent({
      delay: this.gameConfig.parameters.spawnRate || 2000,
      callback: () => this.spawnObstacle(obstacleAsset),
      callbackScope: this,
      loop: true
    });

    // score text with shadow
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, stroke: true, fill: true } // Shadow for better visibility
    });

    // Game over text (hidden initially)
    this.gameOverText = this.add.text(400, 250, 'Game Over!\nScore: 0\nClick to Restart', {
      fontSize: '48px',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5).setVisible(false).setDepth(10);

    this.input.on('pointerdown', () => {
      if (this.isGameOver) {
        this.scene.restart();
      } else {
        this.jump();
      }
    });
    this.input.keyboard.on('keydown-SPACE', () => this.jump(), this);

    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.obstacles, this.handleGameOver, null, this);
  }

  update(time, delta) {
    if (this.isGameOver) return;

    // Increase speed slightly over time for challenge
    const base = this.gameConfig.parameters.speed || 200;
    this.gameSpeed = base + Math.floor(this.score * 2);

    const deltaSec = delta / 1000;

    // Parallax scrolling
    this.bgFar.tilePositionX += this.gameSpeed * 0.2 * deltaSec;
    this.bgNear.tilePositionX += this.gameSpeed * 0.5 * deltaSec;

    // Cleanup and scoring when obstacles leave screen
    this.obstacles.children.iterate(obstacle => {
      if (!obstacle) return;
      if (obstacle.x < -50) {
        obstacle.destroy();
        this.score++;
        this.scoreText.setText('Score: ' + this.score);
      }
    });
  }

  jump() {
    if (this.player.body.touching.down) {
      this.player.setVelocityY(this.gameConfig.parameters.jumpVelocity || -400);
      // Emit particles on jump for visual flair
      this.jumpParticles.emitParticleAt(this.player.x, this.player.y + 20, 20);
    }
  }

  spawnObstacle(obstacleAsset) {
    const obstacleTargetHeight = 60; // 512→scaled
    const obstacleTexture = this.textures.get(obstacleAsset);
    const obstacleFrame = obstacleTexture.get(0);
    const obstacleScale = obstacleTargetHeight / obstacleFrame.height;

    const obstacle = this.obstacles.create(900, 515, obstacleAsset);
    obstacle.setScale(obstacleScale);
    obstacle.setImmovable(true);
    obstacle.body.setAllowGravity(false);

    // Use physics velocity (scaled to feel similar to the old -x movement)
    obstacle.setVelocityX(-this.gameSpeed * 1.5);
  }

  handleGameOver() {
    this.physics.pause();
    this.player.setTint(0xff0000);
    this.isGameOver = true;

    // Show animated game over text
    this.gameOverText.setText(`Game Over!\nScore: ${this.score}\nClick to Restart`);
    this.gameOverText.setVisible(true);
    this.tweens.add({
      targets: this.gameOverText,
      scale: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Bounce.Out'
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
        gravity: { y: 300 },
        debug: false
      }
    },
    scene: EndlessRunnerGame,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  };

  new Phaser.Game(config);
});