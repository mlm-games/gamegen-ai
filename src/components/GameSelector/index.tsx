'use client';

import { useGameStore } from '@/lib/store';
import { GameTemplate } from '@/types/game';
import { Play, ArrowRight } from 'lucide-react';
// import Image from 'next/image';

const gameTemplates: GameTemplate[] = [
  {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    thumbnail: '/thumbnails/flappy-bird.png',
    description: 'Navigate through pipes in this addictive endless flyer',
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
        gapSize: 120
      }
    }
  },
  {
    id: 'endless-runner',
    name: 'Speed Runner',
    thumbnail: '/thumbnails/endless-runner.png',
    description: 'Run and jump through an endless world',
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
        jumpVelocity: -330,
        spawnRate: 2000,
        gravity: 800
      }
    }
  },
  {
    id: 'whack-a-mole',
    name: 'Whack-a-Mole',
    thumbnail: '/thumbnails/whack-a-mole.png',
    description: 'Test your reflexes by whacking moles',
    defaultConfig: {
      id: 'whack-a-mole',
      name: 'Whack-a-Mole',
      theme: 'classic',
      difficulty: 'medium',
      assets: {
        player: '/games/whack-a-mole/assets/mole.png',
        background: '/games/whack-a-mole/assets/background.png',
        obstacles: ['/games/whack-a-mole/assets/hole.png']
      },
      parameters: {
        spawnRate: 1000,
        moleUpTime: 1500,
        speed: 1
      }
    }
  },
  {
    id: 'match-3',
    name: 'Match-3',
    thumbnail: '/thumbnails/match-3.png',
    description: 'Match colorful gems in this puzzle game',
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
        matchSize: 3,
        swapSpeed: 300
      }
    }
  },
  {
    id: 'crossy-road',
    name: 'Crossy Road',
    thumbnail: '/thumbnails/crossy-road.png',
    description: 'Cross roads and avoid vehicles',
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
        spawnRate: 2000,
        moveDistance: 50
      }
    }
  }
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
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Choose Your Game Template
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {gameTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            className={`
              relative rounded-xl overflow-hidden cursor-pointer transition-all
              ${selectedTemplate?.id === template.id 
                ? 'ring-4 ring-purple-600 shadow-lg scale-105' 
                : 'hover:shadow-lg hover:scale-102'
              }
            `}
          >
            <div className="aspect-video bg-gradient-to-br from-purple-400 to-pink-400 relative">
              {/* Placeholder for game thumbnail */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-16 h-16 text-white opacity-80" />
              </div>
            </div>
            <div className="p-4 bg-white">
              <h3 className="font-bold text-lg text-gray-800">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </div>
            {selectedTemplate?.id === template.id && (
              <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
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
              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
