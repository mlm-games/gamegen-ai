'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/store';
import { Loader2, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import GameCanvas from '@/components/GameCanvas';
import toast from 'react-hot-toast';
import { GameConfig } from '@/types/game';

interface ParameterControlsProps {
  onNext: () => void;
}

export default function ParameterControls({ onNext }: ParameterControlsProps) {
  const { selectedTemplate, gameConfig, updateGameConfig } = useGameStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [debouncedConfig, setDebouncedConfig] = useState<GameConfig | null>(gameConfig);
  const [reloadKey, setReloadKey] = useState(0);

  const handleParameterChange = (key: string, value: number) => {
    updateGameConfig({
      parameters: {
        ...gameConfig?.parameters,
        [key]: value
      }
    });
  };

  // Debounce the config update to avoid excessive iframe reloads
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedConfig(gameConfig);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [gameConfig]);

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
          parameterConfigs: selectedTemplate?.parameterConfigs || {},
        }),
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

  const currentParamConfigs = selectedTemplate?.parameterConfigs ? Object.entries(selectedTemplate.parameterConfigs) : [];

  const forceReload = useCallback(() => setReloadKey(k => k + 1), []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Panel - Parameter Controls */}
      <div className="p-8 space-y-8 border rounded-2xl shadow-xl bg-card text-card-foreground">
        <h2 className="text-3xl font-bold text-gray-800">
          Game Parameters
        </h2>

        {/* Manual Controls */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-700">Fine-tune Gameplay</h3>
          {currentParamConfigs.map(([key, param]) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  {param.label}
                </label>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {gameConfig?.parameters?.[key] || 0}
                </span>
              </div>
              <input
                type="range"
                min={param.min ?? 0}
                max={param.max ?? 100}
                step={param.step ?? 1}
                value={gameConfig?.parameters?.[key] || 0}
                onChange={(e) => handleParameterChange(key, Number(e.target.value))}
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
              className="flex-1 px-4 py-2 border rounded-lg border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <button
              onClick={handleAIUpdate}
              disabled={isProcessing || !aiPrompt}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${(isProcessing || !aiPrompt)
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
          className="flex items-center justify-center w-full gap-2 px-6 py-3 font-semibold text-white transition-all bg-green-600 rounded-lg shadow-lg hover:bg-green-700"
        >
          Continue to Export
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="p-8 border rounded-2xl shadow-xl bg-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Live Preview</h3>
          <button onClick={forceReload} className="flex items-center gap-2 px-3 text-sm border rounded-md py-1.5 border-input hover:bg-muted">
            <RefreshCw className="w-4 h-4" />
            <span>Reload</span>
          </button>
        </div>

        {selectedTemplate && debouncedConfig && (
          <GameCanvas
            key={reloadKey} // Force re-render only when button is clicked
            gameTemplate={selectedTemplate.id}
            config={debouncedConfig}
          />
        )}
      </div>
    </div>
  );
}