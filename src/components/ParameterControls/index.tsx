'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';
import GameCanvas from '@/components/GameCanvas';
import toast from 'react-hot-toast';

interface ParameterControlsProps {
  onNext: () => void;
}

const PARAMETER_CONFIGS = {
    'flappy-bird': [
        { key: 'gravity', label: 'Gravity', min: 200, max: 1500, step: 50 },
        { key: 'jumpVelocity', label: 'Jump Power', min: -500, max: -200, step: 25 },
        { key: 'pipeSpeed', label: 'Pipe Speed', min: 100, max: 400, step: 25 },
        { key: 'gapSize', label: 'Gap Size', min: 100, max: 250, step: 10 },
    ],
    'endless-runner': [
        { key: 'speed', label: 'Run Speed', min: 100, max: 500, step: 10 },
        { key: 'jumpVelocity', label: 'Jump Power', min: -600, max: -250, step: 25 },
        { key: 'gravity', label: 'Gravity', min: 500, max: 2000, step: 100 },
        { key: 'spawnRate', label: 'Obstacle Rate (ms)', min: 1000, max: 4000, step: 100 },
    ],
    'whack-a-mole': [
        { key: 'spawnRate', label: 'Appear Rate (ms)', min: 300, max: 2000, step: 50 },
        { key: 'moleUpTime', label: 'Visible Time (ms)', min: 500, max: 2500, step: 50 },
    ],
    'crossy-road': [
        { key: 'speed', label: 'Vehicle Speed', min: 50, max: 300, step: 10 },
        { key: 'spawnRate', label: 'Vehicle Rate (ms)', min: 500, max: 3000, step: 100 },
    ],
    'match-3': [
        { key: 'gridSize', label: 'Grid Size', min: 6, max: 10, step: 1 },
    ]
}


export default function ParameterControls({ onNext }: ParameterControlsProps) {
  const { selectedTemplate, gameConfig, updateGameConfig } = useGameStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

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
    toast.loading('AI is adjusting parameters...', { id: 'ai-params' });
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
      if (response.ok && data.parameters) {
        updateGameConfig({
          parameters: {
            ...gameConfig?.parameters,
            ...data.parameters
          }
        });
        toast.success('Parameters updated!', { id: 'ai-params' });
        setAiPrompt('');
      } else {
        throw new Error(data.error || 'Failed to get AI response.');
      }
    } catch (error) {
      toast.error(`Error: ${(error as Error).message}`, { id: 'ai-params' });
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentParamConfigs = selectedTemplate ? PARAMETER_CONFIGS[selectedTemplate.id as keyof typeof PARAMETER_CONFIGS] || [] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Panel - Parameter Controls */}
      <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Game Parameters
        </h2>

        {/* Manual Controls */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-700">Fine-tune Gameplay</h3>
          {currentParamConfigs.map((param) => (
            <div key={param.key}>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  {param.label}
                </label>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {gameConfig?.parameters?.[param.key] || 0}
                </span>
              </div>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={gameConfig?.parameters?.[param.key] || 0}
                onChange={(e) => handleParameterChange(param.key, Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          ))}
        </div>

        {/* AI Prompt */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">AI Assistant</h3>
          <p className="text-sm text-gray-500 mb-3">Describe how you want to change the difficulty.</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Make it super challenging, or make jumps floaty"
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
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              <span>Update</span>
            </button>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 shadow-lg transition-all"
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
            key={JSON.stringify(gameConfig)} // Force re-render on any config change
            gameTemplate={selectedTemplate.id}
            config={gameConfig}
          />
        )}
      </div>
    </div>
  );
}
