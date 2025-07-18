'use client';

import { useGameStore } from '@/lib/store';
import { GameTemplate, ParameterConfig } from '@/types/game';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const gameTemplates: GameTemplate[] = [
  {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    thumbnail: '/thumbnails/flappy-bird.png',
    description: 'Navigate through pipes in this addictive endless flyer',
    assetTypes: ['player', 'background', 'obstacles'],
    parameterConfigs: {
      gravity: { label: 'Gravity', min: 200, max: 1500, step: 50 },
      jumpVelocity: { label: 'Jump Power', min: -500, max: -200, step: 25 },
      pipeSpeed: { label: 'Pipe Speed', min: 100, max: 400, step: 25 },
      gapSize: { label: 'Gap Size', min: 100, max: 250, step: 10 },
    },
    defaultConfig: {
      id: 'flappy-bird',
      name: 'Flappy Bird',
      theme: 'classic',
      difficulty: 'medium',
      assets: {
        player: '/games/flappy-bird/assets/bird.png',
        background: '/games/flappy-bird/assets/background.png',
        obstacles: ['/games/flappy-bird/assets/pipe.png']
      },
      parameters: {
        gravity: 800,
        jumpVelocity: -350,
        pipeSpeed: 200,
        pipeSpawnDelay: 1500,
        gapSize: 150
      },
    },
  },
  {
    id: 'endless-runner',
    name: 'Speed Runner',
    thumbnail: '/thumbnails/endless-runner.png',
    description: 'Run and jump through an endless world',
    assetTypes: ['player', 'background', 'obstacles'],
    parameterConfigs: {
      speed: { label: 'Run Speed', min: 100, max: 500, step: 10 },
      jumpVelocity: { label: 'Jump Power', min: -600, max: -250, step: 25 },
      gravity: { label: 'Gravity', min: 500, max: 2000, step: 100 },
      spawnRate: { label: 'Obstacle Rate (ms)', min: 1000, max: 4000, step: 100 },
    },
    defaultConfig: {
      id: 'endless-runner',
      name: 'Speed Runner',
      theme: 'classic',
      difficulty: 'medium',
      assets: {
        player: '/games/endless-runner/assets/player.png',
        background: '/games/endless-runner/assets/background.png',
        obstacles: ['/games/endless-runner/assets/obstacle.png']
      },
      parameters: {
        speed: 200,
        jumpVelocity: -400,
        spawnRate: 2000,
        gravity: 800
      },
    },
  },
  {
    id: 'whack-a-mole',
    name: 'Whack-a-Mole',
    thumbnail: '/thumbnails/whack-a-mole.png',
    description: 'Test your reflexes by whacking moles',
    assetTypes: ['player', 'background'],
    parameterConfigs: {
      spawnRate: { label: 'Appear Rate (ms)', min: 300, max: 2000, step: 50 },
      moleUpTime: { label: 'Visible Time (ms)', min: 500, max: 2500, step: 50 },
    },
    defaultConfig: {
      id: 'whack-a-mole',
      name: 'Whack-a-Mole',
      theme: 'classic',
      difficulty: 'medium',
      assets: {
        player: '/games/whack-a-mole/assets/mole.png',
        background: '/games/whack-a-mole/assets/background.png',
        obstacles: []
      },
      parameters: {
        spawnRate: 1000,
        moleUpTime: 800,
      },
    },
  },
  {
    id: 'match-3',
    name: 'Match-3',
    thumbnail: '/thumbnails/match-3.png',
    description: 'Match colorful gems in this puzzle game',
    assetTypes: ['background', 'items'],
    parameterConfigs: {
      gridSize: { label: 'Grid Size', min: 6, max: 10, step: 1 },
    },
    defaultConfig: {
      id: 'match-3',
      name: 'Match-3',
      theme: 'classic',
      difficulty: 'medium',
      assets: {
        background: '/games/match-3/assets/background.png',
        items: [
          '/games/match-3/assets/gem-red.png',
          '/games/match-3/assets/gem-blue.png',
          '/games/match-3/assets/gem-green.png',
          '/games/match-3/assets/gem-yellow.png',
          '/games/match-3/assets/gem-purple.png'
        ]
      },
      parameters: {
        gridSize: 8,
      },
    },
  },
  {
    id: 'crossy-road',
    name: 'Crossy Road',
    thumbnail: '/thumbnails/crossy-road.png',
    description: 'Cross roads and avoid vehicles',
    assetTypes: ['player', 'background', 'obstacles'],
    parameterConfigs: {
      speed: { label: 'Vehicle Speed', min: 50, max: 300, step: 10 },
      spawnRate: { label: 'Vehicle Rate (ms)', min: 500, max: 3000, step: 100 },
    },
    defaultConfig: {
      id: 'crossy-road',
      name: 'Crossy Road',
      theme: 'classic',
      difficulty: 'medium',
      assets: {
        player: '/games/crossy-road/assets/chicken.png',
        background: '/games/crossy-road/assets/background.png',
        obstacles: ['/games/crossy-road/assets/car.png']
      },
      parameters: {
        speed: 150,
        spawnRate: 1000,
      },
    },
  },
];


interface GameSelectorProps {
  onNext: () => void;
}

export default function GameSelector({ onNext }: GameSelectorProps) {
  const { setSelectedTemplate, selectedTemplate } = useGameStore();

  const handleSelectTemplate = (template: GameTemplate) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="p-8 border rounded-2xl shadow-xl bg-card text-card-foreground">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Choose Your Game Template
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {gameTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            className={`
              relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2
              ${selectedTemplate?.id === template.id
                ? 'ring-4 ring-primary border-primary shadow-lg scale-105'
                : 'border-border hover:shadow-md hover:scale-102 hover:border-primary/50'
              }
            `}
          >
            <div className="aspect-video relative">
              <Image src={template.thumbnail} alt={template.name} layout="fill" objectFit="cover" className="bg-gray-200" />
            </div>
            <div className="p-4 bg-card">
              <h3 className="font-bold text-lg text-gray-800">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </div>
            {selectedTemplate?.id === template.id && (
              <div className="absolute top-2 right-2 p-1 text-white rounded-full bg-primary">
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!selectedTemplate}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
            ${selectedTemplate
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          Continue to AI Reskin
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}