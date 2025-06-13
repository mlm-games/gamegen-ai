import Phaser from 'phaser';
import type { GameConfig } from '@/types/game';

interface EndlessRunnerData {
  config: GameConfig;
  player?: Phaser.Physics.Arcade.Sprite;
  platforms?: Phaser.Physics.Arcade.StaticGroup;
  obstacles?: Phaser.Physics.Arcade.Group;
  score: number;
  gameSpeed: number;
}

export default class EndlessRunnerGame extends Phaser.Scene {
  private gameData: EndlessRunnerData;

  constructor(config: GameConfig) {
    super({ key: 'EndlessRunnerGame' });
    this.gameData = {
      config: config,
      score: 0,
      gameSpeed: config.parameters.speed || 200
    };
  }

  preload(): void {
    const { config } = this.gameData;
    
    if (config.assets.player) {
      this.load.image('player', config.assets.player);
    }
    if (config.assets.background) {
      this.load.image('background', config.assets.background);
    }
    if (config.assets.obstacles?.[0]) {
      this.load.image('obstacle', config.assets.obstacles[0]);
    }
  }

  create(): void {
    const { config } = this.gameData;
    
    // Background
    if (config.assets.background) {
      this.add.image(400, 300, 'background');
    }
    
    // Ground
    this.gameData.platforms = this.physics.add.staticGroup();
    this.gameData.platforms.create(400, 568, 'ground').setScale(2, 1).refreshBody();
    
    // Player
    this.gameData.player = this.physics.add.sprite(100, 450, 'player');
    this.gameData.player.setBounce(0.2);
    this.gameData.player.setCollideWorldBounds(true);
    
    // Obstacles
    this.gameData.obstacles = this.physics.add.group();
    
    // Spawn obstacles
    this.time.addEvent({
      delay: config.parameters.spawnRate || 2000,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });
    
    // Controls
    this.input.on('pointerdown', this.jump, this);
    this.input.keyboard?.on('keydown-SPACE', this.jump, this);
    
    // Collisions
    this.physics.add.collider(this.gameData.player, this.gameData.platforms);
    this.physics.add.collider(this.gameData.player, this.gameData.obstacles, this.gameOver, undefined, this);
  }

  update(): void {
    if (!this.gameData.obstacles) return;
    
    // Move obstacles
    this.gameData.obstacles.children.entries.forEach((obstacle) => {
      const obstacleSprite = obstacle as Phaser.Physics.Arcade.Sprite;
      obstacleSprite.x -= this.gameData.gameSpeed * 0.016; // Delta time approximation
      
      if (obstacleSprite.x < -50) {
        obstacleSprite.destroy();
        this.gameData.score++;
      }
    });
  }

  private jump = (): void => {
    if (!this.gameData.player) return;
    if (this.gameData.player.body?.touching.down) {
      this.gameData.player.setVelocityY(this.gameData.config.parameters.jumpVelocity || -330);
    }
  }

  private spawnObstacle = (): void => {
    if (!this.gameData.obstacles) return;
    
    const obstacle = this.gameData.obstacles.create(800, 500, 'obstacle');
    obstacle.setVelocityX(-this.gameData.gameSpeed);
  }

  private gameOver = (): void => {
    this.scene.restart();
  }
}
