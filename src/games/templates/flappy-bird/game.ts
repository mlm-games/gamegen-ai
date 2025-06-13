import type { GameConfig } from '@/types/game';

interface FlappyBirdData {
  config: GameConfig;
  bird?: any;
  pipes?: any;
  score: number;
  bgm?: any;
}

export default class FlappyBirdGame {
  private gameData: FlappyBirdData;
  private scene: any;

  constructor(config: GameConfig) {
    // Store config for later use
    this.gameData = {
      config: config,
      score: 0
    };
  }

  init() {
    // This will be called by Phaser
    this.scene = this;
  }

  preload() {
    const { config } = this.gameData;
    
    // Load assets from config
    if (config.assets.player) {
      this.scene.load.image('bird', config.assets.player);
    }
    if (config.assets.background) {
      this.scene.load.image('background', config.assets.background);
    }
    if (config.assets.obstacles?.[0]) {
      this.scene.load.image('pipe', config.assets.obstacles[0]);
    }
    
    if (config.audio?.bgm) {
      this.scene.load.audio('bgm', config.audio.bgm);
    }
  }

  create() {
    const { config } = this.gameData;
    
    // Background
    if (config.assets.background) {
      this.scene.add.image(400, 300, 'background');
    }
    
    // Player
    this.gameData.bird = this.scene.physics.add.sprite(100, 300, 'bird');
    this.gameData.bird.setGravityY(config.parameters.gravity || 800);
    
    // Pipes group
    this.gameData.pipes = this.scene.physics.add.group();
    
    // Timer for spawning pipes
    this.scene.time.addEvent({
      delay: config.parameters.pipeSpawnDelay || 1500,
      callback: this.spawnPipe.bind(this),
      callbackScope: this,
      loop: true
    });
    
    // Controls
    this.scene.input.on('pointerdown', this.jump.bind(this));
    this.scene.input.keyboard?.on('keydown-SPACE', this.jump.bind(this));
    
    // Mobile controls
    if (this.scene.sys.game.device.input.touch) {
      this.scene.input.addPointer(1);
    }
    
    // Play BGM
    if (config.audio?.bgm) {
      this.gameData.bgm = this.scene.sound.add('bgm', { loop: true, volume: 0.5 });
      this.gameData.bgm.play();
    }
  }

  update() {
    if (!this.gameData.bird) return;
    
    // Game over if bird goes out of bounds
    if (this.gameData.bird.y < 0 || this.gameData.bird.y > 600) {
      this.gameOver();
    }
    
    // Move and clean up pipes
    if (this.gameData.pipes) {
      this.gameData.pipes.children.entries.forEach((pipe: any) => {
        if (pipe.x < -50) {
          pipe.destroy();
        }
      });
    }
  }

  private jump() {
    if (!this.gameData.bird) return;
    this.gameData.bird.setVelocityY(this.gameData.config.parameters.jumpVelocity || -350);
  }

  private spawnPipe() {
    if (!this.gameData.pipes) return;
    
    const gap = this.gameData.config.parameters.gapSize || 120;
    const pipeTop = Math.floor(Math.random() * (400 - gap - 100)) + 100;
    
    // Top pipe
    const topPipe = this.gameData.pipes.create(800, pipeTop, 'pipe');
    topPipe.setVelocityX(-(this.gameData.config.parameters.pipeSpeed || 200));
    
    // Bottom pipe
    const bottomPipe = this.gameData.pipes.create(800, pipeTop + gap + 100, 'pipe');
    bottomPipe.setVelocityX(-(this.gameData.config.parameters.pipeSpeed || 200));
    bottomPipe.setFlipY(true);
  }

  private gameOver() {
    this.scene.scene.restart();
  }
}
