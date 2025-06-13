class CrossyRoadGame extends Phaser.Scene {
  constructor(config) {
    super({ key: 'CrossyRoadGame' });
    this.gameConfig = config;
    this.score = 0;
    this.lanes = [];
    this.vehicles = [];
    this.canMove = true;
  }

  preload() {
    // Load custom assets
    if (this.gameConfig.assets.player) {
      this.load.image('player', this.gameConfig.assets.player);
    }
    if (this.gameConfig.assets.background) {
      this.load.image('background', this.gameConfig.assets.background);
    }
    if (this.gameConfig.assets.obstacles && this.gameConfig.assets.obstacles[0]) {
      this.load.image('vehicle', this.gameConfig.assets.obstacles[0]);
    }
    
    // Load default assets
    this.load.image('player-default', '/games/crossy-road/assets/chicken.png');
    this.load.image('background-default', '/games/crossy-road/assets/background.png');
    this.load.image('vehicle-default', '/games/crossy-road/assets/car.png');
    this.load.image('road-default', '/games/crossy-road/assets/road.png');
    this.load.image('grass-default', '/games/crossy-road/assets/grass.png');
  }

  create() {
    // Use custom or default assets
    const playerAsset = this.textures.exists('player') ? 'player' : 'player-default';
    const bgAsset = this.textures.exists('background') ? 'background' : 'background-default';
    const vehicleAsset = this.textures.exists('vehicle') ? 'vehicle' : 'vehicle-default';
    
    // Background
    this.add.image(400, 300, bgAsset);
    
    // Create lanes
    for (let i = 0; i < 10; i++) {
      const y = 550 - i * 50;
      const isRoad = i % 2 === 1;
      
      if (isRoad) {
        this.add.tileSprite(400, y, 800, 50, 'road-default');
        this.lanes.push({ y: y, type: 'road', speed: Phaser.Math.Between(-200, 200) });
      } else {
        this.add.tileSprite(400, y, 800, 50, 'grass-default');
        this.lanes.push({ y: y, type: 'grass', speed: 0 });
      }
    }
    
    // Player
    this.player = this.physics.add.sprite(400, 550, playerAsset);
    this.player.setScale(0.8);
    this.player.setDepth(10);
    
    // Spawn vehicles
    this.time.addEvent({
      delay: this.gameConfig.parameters.spawnRate || 2000,
      callback: () => this.spawnVehicle(vehicleAsset),
      callbackScope: this,
      loop: true
    });
    
    // Score
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    });
    
    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', (pointer) => this.handleTouch(pointer));
    
    // Collisions
    this.physics.add.overlap(this.player, this.vehicles, () => this.gameOver());
  }

  update() {
    // Keyboard controls
    if (this.canMove) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this.movePlayer(0, -50);
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        this.movePlayer(0, 50);
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this.movePlayer(-50, 0);
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.movePlayer(50, 0);
      }
    }
    
    // Update vehicles
    this.vehicles.children.entries.forEach(vehicle => {
      if (vehicle.x < -100 || vehicle.x > 900) {
        vehicle.destroy();
      }
    });
  }

  handleTouch(pointer) {
    if (!this.canMove) return;
    
    const dx = pointer.x - this.player.x;
    const dy = pointer.y - this.player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      this.movePlayer(dx > 0 ? 50 : -50, 0);
    } else {
      this.movePlayer(0, dy > 0 ? 50 : -50);
    }
  }

  movePlayer(dx, dy) {
    this.canMove = false;
    
    const newX = this.player.x + dx;
    const newY = this.player.y + dy;
    
    // Check bounds
    if (newX < 50 || newX > 750 || newY < 50 || newY > 550) {
      this.canMove = true;
      return;
    }
    
    // Update score if moving forward
    if (dy < 0) {
      this.score++;
      this.scoreText.setText('Score: ' + this.score);
    }
    
    this.tweens.add({
      targets: this.player,
      x: newX,
      y: newY,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.canMove = true;
      }
    });
  }

  spawnVehicle(vehicleAsset) {
    const roadLanes = this.lanes.filter(lane => lane.type === 'road');
    if (roadLanes.length === 0) return;
    
    const lane = Phaser.Utils.Array.GetRandom(roadLanes);
    const side = lane.speed > 0 ? -50 : 850;
    
    const vehicle = this.physics.add.sprite(side, lane.y, vehicleAsset);
    vehicle.setVelocityX(lane.speed || this.gameConfig.parameters.speed || 150);
    
    if (lane.speed < 0) {
      vehicle.setFlipX(true);
    }
    
    if (!this.vehicles) {
      this.vehicles = this.physics.add.group();
    }
    this.vehicles.add(vehicle);
  }

  gameOver() {
    this.canMove = false;
    
    this.add.text(400, 300, 'Game Over!\nScore: ' + this.score, {
      fontSize: '48px',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5);
    
    this.scene.pause();
  }
}

class GameMain {
  constructor(config) {
    const phaserConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: new CrossyRoadGame(config)
    };
    
    this.game = new Phaser.Game(phaserConfig);
  }
}
