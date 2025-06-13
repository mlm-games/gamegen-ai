class EndlessRunnerGame extends Phaser.Scene {
  constructor(config) {
    super({ key: 'EndlessRunnerGame' });
    this.gameConfig = config;
    this.score = 0;
    this.gameSpeed = config.parameters.speed || 200;
  }

  preload() {
   
    if (this.gameConfig.assets.player) {
      this.load.image('player', this.gameConfig.assets.player);
    }
    if (this.gameConfig.assets.background) {
      this.load.image('background', this.gameConfig.assets.background);
    }
    if (this.gameConfig.assets.obstacles && this.gameConfig.assets.obstacles[0]) {
      this.load.image('obstacle', this.gameConfig.assets.obstacles[0]);
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
    this.ground.create(400, 568, 'ground-default').setScale(2, 1).refreshBody();
    
   
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
    
   
    this.input.on('pointerdown', () => this.jump());
    this.input.keyboard.on('keydown-SPACE', () => this.jump());
    
   
    this.physics.add.collider(this.player, this.ground);
    this.physics.add.collider(this.player, this.obstacles, () => this.gameOver());
  }

  update() {
   
    this.bg.tilePositionX += this.gameSpeed * 0.02;
    
   
    this.obstacles.children.entries.forEach(obstacle => {
      obstacle.x -= this.gameSpeed * 0.016;
      
      if (obstacle.x < -50) {
        obstacle.destroy();
        this.score++;
        this.scoreText.setText('Score: ' + this.score);
      }
    });
  }

  jump() {
    if (this.player.body.touching.down) {
      this.player.setVelocityY(this.gameConfig.parameters.jumpVelocity || -330);
    }
  }

  spawnObstacle(obstacleAsset) {
    const obstacle = this.obstacles.create(850, 500, obstacleAsset);
    obstacle.setImmovable(true);
  }

  gameOver() {
    this.scene.restart();
    this.score = 0;
  }
}

const phaserGameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: { default: 'arcade' },
    scene: [EndlessRunnerGame]
};
new Phaser.Game(phaserGameConfig);
