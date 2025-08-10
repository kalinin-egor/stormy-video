import React, { useState, useEffect } from 'react';
import { VideoGeneratorForm } from './components/VideoGeneratorForm';
import { GenerationLoader } from './components/GenerationLoader';
import { VideoResult } from './components/VideoResult';
import { apiService, VideoGenerationRequest, VideoStatusResponse } from './services/api';

type AppState = 'form' | 'generating' | 'result';

interface FormData {
  logo: File | null;
  productDescription: string;
  voiceScript: string;
  brandColor: string;
  screenClip: File | null;
  duration: number;
  ctaText: string;
  ctaFrom: number;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('form');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (data: FormData) => {
    if (!data.logo || !data.screenClip) {
      setError('Please upload logo and screen clip');
      return;
    }

    try {
      setAppState('generating');
      setGenerationProgress(0);
      setError(null);

      const request: VideoGenerationRequest = {
        logo: data.logo,
        screenClip: data.screenClip,
        productDescription: data.productDescription,
        voiceScript: data.voiceScript,
        brandColor: data.brandColor,
        duration: data.duration,
        ctaText: data.ctaText,
        ctaFrom: data.ctaFrom
      };

      const response = await apiService.generateVideo(request);
      setCurrentTaskId(response.task_id);

      // Start polling for status
      pollVideoStatus(response.task_id);
    } catch (err) {
      console.error('Failed to start video generation:', err);
      setError('Failed to start video generation. Please try again.');
      setAppState('form');
    }
  };

  const pollVideoStatus = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await apiService.getVideoStatus(taskId);
        setGenerationProgress(status.progress);

        if (status.status === 'completed') {
          clearInterval(pollInterval);
          setVideoUrl(status.video_url || null);
          setTimeout(() => setAppState('result'), 500);
        } else if (status.status === 'error') {
          clearInterval(pollInterval);
          setError(status.error || 'Video generation failed');
          setAppState('form');
        }
      } catch (err) {
        console.error('Failed to get video status:', err);
        clearInterval(pollInterval);
        setError('Failed to get video status');
        setAppState('form');
      }
    }, 1000); // Poll every second
  };

  const handleEdit = (prompt: string) => {
    console.log('Editing video with prompt:', prompt);
    // For now, just go back to form
    setAppState('form');
  };

  const handleStartOver = () => {
    setAppState('form');
    setGenerationProgress(0);
    setCurrentTaskId(null);
    setVideoUrl(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-screen flex items-center justify-center p-8">
        {appState === 'form' && (
          <VideoGeneratorForm 
            onGenerate={handleGenerate}
            isLoading={false}
          />
        )}
        
        {appState === 'generating' && (
          <GenerationLoader progress={generationProgress} />
        )}
        
        {appState === 'result' && (
          <VideoResult 
            onEdit={handleEdit}
            onStartOver={handleStartOver}
            videoUrl={videoUrl}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {error}
          </div>
        )}
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}