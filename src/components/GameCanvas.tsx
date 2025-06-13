'use client';

import { useEffect, useRef, useState } from 'react';
import type { GameConfig } from '@/types/game';

export default function GameCanvas({ gameTemplate, config }: GameConfig) {
  const [key, setKey] = useState(0); // A key to force iframe re-render

  useEffect(() => {
    // When the config changes, we update the key, which creates a new iframe.
    setKey(prev => prev + 1);
  }, [config]);

  // We need to pass the config to the iframe somehow.
  // Using localStorage is a simple and effective way.
  useEffect(() => {
    localStorage.setItem('gameConfig', JSON.stringify(config));
  }, [config]);

  return (
    <iframe
      key={key}
      src={`/game-templates/${gameTemplate}/index.html`}
      className="w-full aspect-[4/3] border-0 rounded-lg"
      title="Game Preview"
    />
  );
}
