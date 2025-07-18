'use client';

import { useState } from 'react';
import GameSelector from '@/components/GameSelector';
import AICustomizer from '@/components/AICustomizer';
import ParameterControls from '@/components/ParameterControls';
import ExportManager from '@/components/ExportManager';
import { useGameStore } from '@/lib/store';
import { useTheme } from '@/lib/useTheme';
import { ChevronRight, Moon, Sparkles, Sun } from 'lucide-react';

type Step = 'select' | 'reskin' | 'parameters' | 'export';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const { selectedTemplate, gameConfig } = useGameStore();
  const { theme, toggleTheme } = useTheme();

  const steps = [
    { id: 'select', label: 'Select Template', icon: '🎮' },
    { id: 'reskin', label: 'AI Reskin', icon: '🎨' },
    { id: 'parameters', label: 'Set Parameters', icon: '⚙️' },
    { id: 'export', label: 'Export Game', icon: '📦' },
  ];

  const canProceed = (step: Step): boolean => {
    switch (step) {
      case 'select':
        return true;
      case 'reskin':
        return selectedTemplate !== null;
      case 'parameters':
        return selectedTemplate !== null && gameConfig !== null;
      case 'export':
        return selectedTemplate !== null && gameConfig !== null;
      default:
        return false;
    }
  };

  const handleStepClick = (step: Step) => {
    if (canProceed(step)) {
      setCurrentStep(step);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-12 h-12 text-purple-600" />
            GameGen AI
          </h1>
          <p className="text-xl text-gray-600">
            Create custom games with AI - No coding required!
          </p>
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle dark mode">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300 flex items-center gap-1">
                {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </span>
            </label>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.id as Step)}
                  disabled={!canProceed(step.id as Step)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full transition-all
                    ${currentStep === step.id
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : canProceed(step.id as Step)
                        ? 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <span className="text-xl">{step.icon}</span>
                  <span className="font-medium">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          {currentStep === 'select' && (
            <GameSelector onNext={() => setCurrentStep('reskin')} />
          )}
          {currentStep === 'reskin' && (
            <AICustomizer onNext={() => setCurrentStep('parameters')} />
          )}
          {currentStep === 'parameters' && (
            <ParameterControls onNext={() => setCurrentStep('export')} />
          )}
          {currentStep === 'export' && (
            <ExportManager />
          )}
        </div>
      </div>
    </main>
  );
}
