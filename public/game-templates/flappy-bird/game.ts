import * as Phaser from 'phaser';
import type { GameConfig } from '@/types/game'; // This type import is for development, it won't be in the final JS

interface FlappyBirdData {
  config: GameConfig;
  bird?: Phaser.Physics.Arcade.Sprite;
  pipes?: Phaser.Physics.Arcade.Group;
}

class FlappyBirdGame extends Phaser.Scene {
  private gameData!: FlappyBirdData;

  constructor() {
    super({ key: 'FlappyBirdGame' });
  }


  init() {
    // Read config from the global window object
    const config = (window as any).GAME_CONFIG;
    this.gameData = { config: config };
  }

  preload() {
    // ... your existing preload code is fine ...
    this.load.image('bird', this.gameData.config.assets.player!);
    this.load.image('background', this.gameData.config.assets.background!);
    this.load.image('pipe', this.gameData.config.assets.obstacles![0]);
  }

  create() {
    this.add.image(400, 300, 'background');
    this.gameData.bird = this.physics.add.sprite(100, 300, 'bird');
    this.gameData.bird.setGravityY(this.gameData.config.parameters.gravity!);
    
    this.gameData.pipes = this.physics.add.group();
    this.time.addEvent({
      delay: this.gameData.config.parameters.pipeSpawnDelay!,
      callback: this.spawnPipe,
      callbackScope: this,
      loop: true
    });
    
    this.input.on('pointerdown', this.jump, this);
  }

  update() {
    if (!this.gameData.bird) return;
    if (this.gameData.bird.y < 0 || this.gameData.bird.y > 600) {
      this.scene.restart();
    }
  }

  private jump = () => {
    this.gameData.bird?.setVelocityY(this.gameData.config.parameters.jumpVelocity!);
  }

  private spawnPipe = () => {
    const gap = this.gameData.config.parameters.gapSize!;
    const pipeY = Phaser.Math.Between(150, 450 - gap);
    
    const topPipe = this.gameData.pipes?.create(800, pipeY - gap / 2, 'pipe').setFlipY(true);
    const bottomPipe = this.gameData.pipes?.create(800, pipeY + gap / 2, 'pipe');
    
    [topPipe, bottomPipe].forEach((pipe) => {
      pipe?.setOrigin(0.5, 0);
      pipe?.setVelocityX(-(this.gameData.config.parameters.pipeSpeed!));
    });
  }
}


const phaserConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: { default: 'arcade' },
  scene: [FlappyBirdGame] // It knows to start itself!
};

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        const game = new Phaser.Game(phaserConfig);
    });
} else {
    const game = new Phaser.Game(phaserConfig);
}

(window as any).FlappyBirdGame = FlappyBirdGame;
