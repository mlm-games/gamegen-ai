import Phaser from 'phaser';
import { GameConfig } from '@/types/game';

interface FlappyBirdData {
  config: GameConfig;
  bird?: Phaser.Physics.Arcade.Sprite;
  pipes?: Phaser.Physics.Arcade.Group;
  score: number;
  bgm?: Phaser.Sound.BaseSound;
}

export default class FlappyBirdGame extends Phaser.Scene {
  private gameData: FlappyBirdData;

  constructor(config: GameConfig) {
    super({ key: 'FlappyBirdGame' });
    this.gameData = {
      config: config,
      score: 0
    };
  }

  preload(): void {
    const { config } = this.gameData;
    
    // Load assets from config
    if (config.assets.player) {
      this.load.image('bird', config.assets.player);
    }
    if (config.assets.background) {
      this.load.image('background', config.assets.background);
    }
    if (config.assets.obstacles?.[0]) {
      this.load.image('pipe', config.assets.obstacles[0]);
    }
    
    if (config.audio?.bgm) {
      this.load.audio('bgm', config.audio.bgm);
    }
  }

  create(): void {
    const { config } = this.gameData;
    
    // Background
    if (config.assets.background) {
      this.add.image(400, 300, 'background');
    }
    
    // Player
    this.gameData.bird = this.physics.add.sprite(100, 300, 'bird');
    this.gameData.bird.setGravityY(config.parameters.gravity || 800);
    
    // Pipes group
    this.gameData.pipes = this.physics.add.group();
    
    // Timer for spawning pipes
    this.time.addEvent({
      delay: config.parameters.pipeSpawnDelay || 1500,
      callback: this.spawnPipe,
      callbackScope: this,
      loop: true
    });
    
    // Controls
    this.input.on('pointerdown', this.jump, this);
    this.input.keyboard?.on('keydown-SPACE', this.jump, this);
    
    // Mobile controls
    if (this.sys.game.device.input.touch) {
      this.input.addPointer(1);
    }
    
    // Play BGM
    if (config.audio?.bgm) {
      this.gameData.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
      this.gameData.bgm.play();
    }
  }

  update(): void {
    if (!this.gameData.bird) return;
    
    // Game over if bird goes out of bounds
    if (this.gameData.bird.y < 0 || this.gameData.bird.y > 600) {
      this.gameOver();
    }
    
    // Move and clean up pipes
    if (this.gameData.pipes) {
      this.gameData.pipes.children.entries.forEach((pipe) => {
        const pipeSprite = pipe as Phaser.Physics.Arcade.Sprite;
        if (pipeSprite.x < -50) {
          pipeSprite.destroy();
        }
      });
    }
  }

  private jump = (): void => {
    if (!this.gameData.bird) return;
    this.gameData.bird.setVelocityY(this.gameData.config.parameters.jumpVelocity || -350);
  }

  private spawnPipe = (): void => {
    if (!this.gameData.pipes) return;
    
    const gap = this.gameData.config.parameters.gapSize || 120;
    const pipeTop = Phaser.Math.Between(100, 400 - gap);
    
    // Top pipe
    const topPipe = this.gameData.pipes.create(800, pipeTop, 'pipe') as Phaser.Physics.Arcade.Sprite;
    topPipe.setVelocityX(-(this.gameData.config.parameters.pipeSpeed || 200));
    
    // Bottom pipe
    const bottomPipe = this.gameData.pipes.create(800, pipeTop + gap + 100, 'pipe') as Phaser.Physics.Arcade.Sprite;
    bottomPipe.setVelocityX(-(this.gameData.config.parameters.pipeSpeed || 200));
    bottomPipe.setFlipY(true);
  }

  private gameOver = (): void => {
    this.scene.restart();
  }
}
