'use client';

import { useEffect, useRef, useState } from 'react';
import type { GameConfig } from '@/types/game';

interface GameCanvasProps {
  gameTemplate: string;
  config: GameConfig;
  onGameReady?: () => void;
}

export default function GameCanvas({ gameTemplate, config, onGameReady }: GameCanvasProps) {
  const [key, setKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    console.log('GameCanvas received config:', JSON.stringify(config, null, 2));
    console.log('Obstacles type:', typeof config.assets?.obstacles);
    console.log('Obstacles value:', config.assets?.obstacles);

    localStorage.setItem('gameConfig', JSON.stringify(config));
    setKey(prev => prev + 1);
  }, [config]);

  return (
    <div className="flex flex-col h-full">
      <iframe
        ref={iframeRef}
        key={key}
        src={`/games/${gameTemplate}/index.html`}
        className="flex-grow w-full border-0 rounded-lg bg-gray-100"
        title="Game Preview"
        onLoad={() => onGameReady?.()}
      />
      <div className="h-4"></div> {/* Add some space below iframe */}
    </div>
  );
}