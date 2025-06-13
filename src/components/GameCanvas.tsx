'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameConfig } from '@/types/game';

interface GameCanvasProps {
  gameTemplate: string;
  config: GameConfig;
  onGameReady?: () => void;
}

export default function GameCanvas({ gameTemplate, config, onGameReady }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadGame = async () => {
      try {
        let GameScene: any;
        
        // Dynamic import based on template
        switch (gameTemplate) {
          case 'flappy-bird':
            const flappyModule = await import('@/games/templates/flappy-bird/game');
            GameScene = flappyModule.default;
            break;
          // Add other game cases here
          default:
            console.error(`Unknown game template: ${gameTemplate}`);
            return;
        }
        
        // Create scene instance with config
        const scene = new GameScene(config);
        
        const phaserConfig: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: 800,
          height: 600,
          parent: containerRef.current,
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 0 },
              debug: false
            }
          },
          scene: scene
        };
        
        gameRef.current = new Phaser.Game(phaserConfig);
        onGameReady?.();
      } catch (error) {
        console.error('Failed to load game:', error);
      }
    };

    loadGame();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [gameTemplate, config, onGameReady]);

  return (
    <div 
      ref={containerRef} 
      className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg"
    />
  );
}
