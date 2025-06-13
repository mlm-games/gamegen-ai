'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';
import GameCanvas from '@/components/GameCanvas';
import toast from 'react-hot-toast';

interface ParameterControlsProps {
  onNext: () => void;
}

export default function ParameterControls({ onNext }: ParameterControlsProps) {
  const { selectedTemplate, gameConfig, updateGameConfig } = useGameStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const difficultyPresets = {
    easy: {
      gravity: 600,
      jumpVelocity: -300,
      pipeSpeed: 150,
      gapSize: 150
    },
    medium: {
      gravity: 800,
      jumpVelocity: -350,
      pipeSpeed: 200,
      gapSize: 120
    },
    hard: {
      gravity: 1000,
      jumpVelocity: -400,
      pipeSpeed: 250,
      gapSize: 100
    }
  };

  const handleDifficultyChange = (difficulty: 'easy' | 'medium' | 'hard') => {
    updateGameConfig({
      difficulty,
      parameters: {
        ...gameConfig?.parameters,
        ...difficultyPresets[difficulty]
      }
    });
  };

  const handleParameterChange = (key: string, value: number) => {
    updateGameConfig({
      parameters: {
        ...gameConfig?.parameters,
        [key]: value
      }
    });
  };

  const handleAIUpdate = async () => {
    if (!aiPrompt) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/update-parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          currentParameters: gameConfig?.parameters,
          gameType: selectedTemplate?.id
        })
      });

      const data = await response.json();
      if (data.parameters) {
        updateGameConfig({
          parameters: {
            ...gameConfig?.parameters,
            ...data.parameters
          }
        });
        toast.success('Parameters updated!');
        setAiPrompt('');
      }
    } catch (error) {
      toast.error('Failed to update parameters');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const parameterConfigs = [
    { key: 'gravity', label: 'Gravity', min: 200, max: 1500, step: 50 },
    { key: 'jumpVelocity', label: 'Jump Power', min: -500, max: -200, step: 25 },
    { key: 'pipeSpeed', label: 'Pipe Speed', min: 100, max: 400, step: 25 },
    { key: 'gapSize', label: 'Gap Size', min: 80, max: 200, step: 10 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Panel - Parameter Controls */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Game Parameters
        </h2>

        {/* Difficulty Presets */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Difficulty</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'medium', 'hard'] as const).map((level) => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                className={`
                  px-4 py-2 rounded-lg font-medium capitalize transition-all
                  ${gameConfig?.difficulty === level
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Controls */}
        <div className="space-y-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-700">Fine-tune</h3>
          {parameterConfigs.map((param) => (
            <div key={param.key}>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  {param.label}
                </label>
                <span className="text-sm font-mono text-gray-600">
                  {gameConfig?.parameters[param.key] || 0}
                </span>
              </div>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={gameConfig?.parameters[param.key] || 0}
                onChange={(e) => handleParameterChange(param.key, Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          ))}
        </div>

        {/* AI Prompt */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">AI Assistant</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Make it super challenging, Make jumps floaty"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
            <button
              onClick={handleAIUpdate}
              disabled={isProcessing || !aiPrompt}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${isProcessing || !aiPrompt
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                }
              `}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 shadow-lg transition-all"
        >
          Continue to Export
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Live Preview</h3>
        
        {selectedTemplate && gameConfig && (
          <GameCanvas
            key={JSON.stringify(gameConfig.parameters)} // Force re-render on parameter change
            gameTemplate={selectedTemplate.id}
            config={gameConfig}
          />
        )}
      </div>
    </div>
  );
}
