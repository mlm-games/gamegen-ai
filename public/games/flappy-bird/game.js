// public/games/flappy-bird/game.js
class FlappyBirdGame extends Phaser.Scene {
  constructor() {
    super({ key: 'FlappyBirdGame' });
    this.gameConfig = window.GAME_CONFIG || {};
    if (!this.gameConfig.assets) this.gameConfig.assets = {};
    if (!this.gameConfig.parameters) this.gameConfig.parameters = {};
    this.score = 0;
  }

  preload() {
    // Load custom assets if provided
    if (this.gameConfig.assets && this.gameConfig.assets.player) {
      const playerAsset = this.gameConfig.assets.player;
      if (playerAsset.startsWith('data:')) {
        this.textures.addBase64('bird', playerAsset);
      } else {
        this.load.image('bird', playerAsset);
      }
    }
    
    if (this.gameConfig.assets && this.gameConfig.assets.background) {
      const bgAsset = this.gameConfig.assets.background;
      if (bgAsset.startsWith('data:')) {
        this.textures.addBase64('background', bgAsset);
      } else {
        this.load.image('background', bgAsset);
      }
    }
    
    if (this.gameConfig.assets && this.gameConfig.assets.obstacles && Array.isArray(this.gameConfig.assets.obstacles) && this.gameConfig.assets.obstacles[0]) {
      const pipeAsset = this.gameConfig.assets.obstacles[0];
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
    this.cameras.main.setBackgroundColor('#87CEEB');
    
    const birdAsset = this.textures.exists('bird') ? 'bird' : 'bird-default';
    const bgAsset = this.textures.exists('background') ? 'background' : 'background-default';
    const pipeAsset = this.textures.exists('pipe') ? 'pipe' : 'pipe-default';
    
    this.add.tileSprite(400, 300, 800, 600, bgAsset);
    
    this.bird = this.physics.add.sprite(100, 300, birdAsset);
    this.bird.setGravityY(this.gameConfig.parameters?.gravity || 800);
    this.bird.setCollideWorldBounds(true);
    
    this.pipes = this.physics.add.group({
        allowGravity: false,
        immovable: true
    });
    
    this.time.addEvent({
      delay: this.gameConfig.parameters?.pipeSpawnDelay || 1500,
      callback: () => this.spawnPipes(pipeAsset),
      callbackScope: this,
      loop: true
    });
    
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    });
    
    this.input.on('pointerdown', () => this.jump());
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.jump());
    }
    
    this.physics.add.collider(this.bird, this.pipes, () => this.gameOver());
  }

  update() {
    if (!this.bird) return;

    if (this.bird.angle < 20) {
        this.bird.angle += 1;
    }
    
    if (this.bird.y < 0 || this.bird.y > 600) {
      this.gameOver();
    }
    
    const scorePipes = [];
    this.pipes.children.each(pipe => {
      if (pipe.getBounds().right < 0) {
        pipe.destroy();
      } else if (pipe.x < this.bird.x && !pipe.userData?.scored) {
        scorePipes.push(pipe);
      }
    });

    if (scorePipes.length > 0) {
        this.score += 0.5; // Each pair of pipes counts as 1
        this.scoreText.setText('Score: ' + Math.floor(this.score));
        scorePipes.forEach(p => p.userData = { scored: true });
    }
  }

  jump() {
    if (this.bird && this.bird.body) {
      this.bird.setVelocityY(this.gameConfig.parameters?.jumpVelocity || -350);
      this.tweens.add({
        targets: this.bird,
        angle: -20,
        duration: 100,
        ease: 'Linear'
      });
    }
  }

  spawnPipes(pipeAsset) {
    const gap = this.gameConfig.parameters?.gapSize || 150;
    const pipeY = Phaser.Math.Between(150, 450);

    const pipeSpeed = -(this.gameConfig.parameters?.pipeSpeed || 200);

    const topPipe = this.pipes.create(800, pipeY - gap / 2, pipeAsset);
    topPipe.setOrigin(0.5, 1).setFlipY(true);
    topPipe.setVelocityX(pipeSpeed);

    const bottomPipe = this.pipes.create(800, pipeY + gap / 2, pipeAsset);
    bottomPipe.setOrigin(0.5, 0);
    bottomPipe.setVelocityX(pipeSpeed);
  }

  gameOver() {
    if (this.scene.isActive()) {
        this.physics.pause();
        this.bird.setTint(0xff0000);
        this.time.delayedCall(1000, () => this.scene.restart());
    }
  }
}

const phaserGameConfig = {
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
    scene: [FlappyBirdGame]
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    new Phaser.Game(phaserGameConfig);
} else {
    document.addEventListener('DOMContentLoaded', () => new Phaser.Game(phaserGameConfig));
}
