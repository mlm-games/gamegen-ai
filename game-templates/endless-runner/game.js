class EndlessRunnerGame extends Phaser.Scene {
  constructor() {
    super({ key: 'EndlessRunnerGame' });
    this.gameConfig = window.GAME_CONFIG || {};
    if (!this.gameConfig.assets) this.gameConfig.assets = {};
    if (!this.gameConfig.parameters) this.gameConfig.parameters = {};

    this.score = 0;
    this.gameSpeed = this.gameConfig.parameters.speed || 200;
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
  }

  create() {
    const playerAsset = this.textures.exists('player') ? 'player' : 'player-default';
    const bgAsset = this.textures.exists('background') ? 'background' : 'background-default';
    const obstacleAsset = this.textures.exists('obstacle') ? 'obstacle' : 'obstacle-default';
    
    this.bg = this.add.tileSprite(400, 300, 800, 600, bgAsset);
    
    this.ground = this.physics.add.staticGroup();
    this.ground.create(400, 580, 'ground-default').setScale(2, 1).refreshBody();
    
    this.player = this.physics.add.sprite(100, 450, playerAsset);
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(this.gameConfig.parameters.gravity || 800);
    
    this.obstacles = this.physics.add.group();
    
    this.time.addEvent({
      delay: this.gameConfig.parameters.spawnRate || 2000,
      callback: () => this.spawnObstacle(obstacleAsset),
      callbackScope: this,
      loop: true
    });
    
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    });
    
    this.input.on('pointerdown', () => this.jump(), this);
    this.input.keyboard.on('keydown-SPACE', () => this.jump(), this);
    
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.obstacles, this.gameOver, null, this);
  }

  update(time, delta) {
    this.bg.tilePositionX += (this.gameSpeed / 1000) * delta * 20;
    
    this.obstacles.children.iterate(obstacle => {
      if (obstacle) {
        obstacle.x -= (this.gameSpeed / 1000) * delta * 60;
        
        if (obstacle.x < -50) {
          obstacle.destroy();
          this.score++;
          this.scoreText.setText('Score: ' + this.score);
        }
      }
    });
  }

  jump() {
    if (this.player.body.touching.down) {
      this.player.setVelocityY(this.gameConfig.parameters.jumpVelocity || -400);
    }
  }

  spawnObstacle(obstacleAsset) {
    const obstacle = this.obstacles.create(900, 515, obstacleAsset);
    obstacle.setImmovable(true);
    obstacle.body.setAllowGravity(false);
  }

  gameOver() {
    this.physics.pause();
    this.player.setTint(0xff0000);
    this.time.addEvent({
        delay: 1500,
        callback: () => {
            this.scene.restart();
        },
        loop: false
    });
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
    scene: EndlessRunnerGame
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    new Phaser.Game(phaserGameConfig);
} else {
    document.addEventListener('DOMContentLoaded', () => new Phaser.Game(phaserGameConfig));
}
