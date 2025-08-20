'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { GameConfig } from '@/types/game';

interface GameCanvasProps {
  gameTemplate: string;
  config: GameConfig;
  onGameReady?: () => void;
}

export default function GameCanvas({ gameTemplate, config, onGameReady }: GameCanvasProps) {
  const [key, setKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    console.log('GameCanvas received config:', JSON.stringify(config, null, 2));
    console.log('Obstacles type:', typeof config.assets?.obstacles);
    console.log('Obstacles value:', config.assets?.obstacles);

    localStorage.setItem('gameConfig', JSON.stringify(config));
    setKey(prev => prev + 1);
    setIsLoading(true);
  }, [config]);

  const handleLoad = () => {
    setIsLoading(false);
    onGameReady?.();
  };

  return (
    <div className="flex flex-col h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/50 z-10">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        key={key}
        src={`/games/${gameTemplate}/index.html`}
        className="flex-grow w-full border-0 rounded-lg bg-gray-100"
        title="Game Preview"
        onLoad={handleLoad}
      />
      <div className="h-4"></div> {/* Add some space below iframe */}
    </div>
  );
}