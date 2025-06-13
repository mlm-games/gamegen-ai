import * as Phaser from 'phaser';
import type { GameConfig } from '@/types/game';

class EndlessRunnerGame extends Phaser.Scene {
  private config!: GameConfig;
  private player!: Phaser.Physics.Arcade.Sprite;

  constructor() { super({ key: 'EndlessRunnerGame' }); }

  init() { this.config = (window as any).GAME_CONFIG; }

  preload() {
    this.load.image('player', this.config.assets.player!);
    this.load.image('background', this.config.assets.background!);
    this.load.image('obstacle', this.config.assets.obstacles![0]);
    this.load.image('ground', '/game-assets/endless-runner/platform.png'); // Assuming a static ground asset
  }

  create() {
    this.add.image(400, 300, 'background').setScrollFactor(0);
    const ground = this.physics.add.staticImage(400, 568, 'ground').setScale(2).refreshBody();
    
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2).setCollideWorldBounds(true);
    this.player.setGravityY(this.config.parameters.gravity!);

    this.physics.add.collider(this.player, ground);
    
    this.input.on('pointerdown', () => {
      if (this.player.body.touching.down) {
        this.player.setVelocityY(this.config.parameters.jumpVelocity!);
      }
    });
  }
}
(window as any).EndlessRunnerGame = EndlessRunnerGame;
