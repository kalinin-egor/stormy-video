import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Upload, Video, Download, RotateCcw, Sparkles, Play, FileImage, Zap, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

type GenerationState = 'idle' | 'generating' | 'complete';

const ParticleEffect = ({ progress }: { progress: number }) => {
  const particles = Array.from({ length: 20 }, (_, i) => i);
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
          initial={{ 
            x: Math.random() * 400,
            y: Math.random() * 200,
            opacity: 0,
            scale: 0
          }}
          animate={{
            x: Math.random() * 400,
            y: Math.random() * 200,
            opacity: progress > particle * 5 ? [0, 1, 0] : 0,
            scale: progress > particle * 5 ? [0, 1, 0] : 0,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: particle * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

const LoadingAnimation = ({ progress }: { progress: number }) => {
  return (
    <div className="relative">
      <motion.div
        className="w-20 h-20 border-4 border-transparent rounded-full mx-auto relative"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1">
          <div className="w-full h-full bg-white rounded-full" />
        </div>
      </motion.div>
      
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="w-8 h-8 text-purple-500" />
      </motion.div>
    </div>
  );
};

export function VideoGenerator() {
  const [script, setScript] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [voiceParameter, setVoiceParameter] = useState('durov');
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  // Debug logging for state changes
  useEffect(() => {
    console.log('Generation state changed:', generationState, 'Progress:', progress);
  }, [generationState, progress]);

  // Auto-increment progress during generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (generationState === 'generating' && progress < 90) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 1, 90);
          console.log(`Auto progress: ${prev} -> ${newProgress}`);
          return newProgress;
        });
      }, 2000); // Update every 2 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [generationState, progress]);

  // Check backend connection on component mount
  useEffect(() => {
    const checkBackendConnection = async () => {
      try {
        await apiService.checkHealth();
        setIsBackendConnected(true);
        setError(null);
      } catch (err) {
        setIsBackendConnected(false);
        setError('Backend connection failed. Please make sure the server is running.');
      }
    };

    checkBackendConnection();
  }, []);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogo(file);
    }
  };

  const handleGenerate = async () => {
    if (!script.trim()) return;
    
    console.log('Starting video generation...');
    setGenerationState('generating');
    setProgress(0);
    setError(null);
    
    try {
      // Create video task
      const createResponse = await apiService.createVideo(script, voiceParameter, logo || undefined);
      console.log('Video task created:', createResponse);
      
      // Set initial progress
      setProgress(10);
      
      // Start polling for status
      const statusResponse = await apiService.pollVideoStatus(createResponse.task_id, (status) => {
        console.log('Status update received:', status);
        // Update progress based on status
        if (status === 'processing') {
          setProgress(prev => {
            const newProgress = Math.min(prev + 5, 90);
            console.log(`Progress updated: ${prev} -> ${newProgress}`);
            return newProgress;
          });
        }
      });
      
      if (statusResponse.status === 'completed' && statusResponse.result_url) {
        setProgress(100);
        setGeneratedVideoUrl(statusResponse.result_url);
        setTimeout(() => setGenerationState('complete'), 500);
      } else if (statusResponse.status === 'error') {
        throw new Error(statusResponse.error || 'Video generation failed');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setGenerationState('idle');
      setProgress(0);
    }
  };

  const handleNewGeneration = () => {
    setGenerationState('idle');
    setProgress(0);
    setGeneratedVideoUrl(null);
    setScript('');
    setLogo(null);
    setVoiceParameter('durov');
    setError(null);
  };

  const handleDownload = () => {
    if (generatedVideoUrl) {
      const link = document.createElement('a');
      link.href = generatedVideoUrl;
      link.download = 'generated-video.mp4';
      link.click();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {generationState === 'idle' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <Card className="backdrop-blur-xl bg-white/70 shadow-2xl border-0 shadow-purple-500/10">
              <CardHeader className="pb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <CardTitle className="flex items-center gap-3 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    <motion.div
                      className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Video className="w-6 h-6 text-white" />
                    </motion.div>
                    AI Video Generator
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">Transform your ideas into compelling videos with AI</p>
                </motion.div>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Script Input */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <Label htmlFor="script" className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    Script / Text
                  </Label>
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Textarea
                      id="script"
                      placeholder="Enter your script or text here... Make it engaging and creative!"
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      className="min-h-32 resize-none backdrop-blur-sm bg-white/60 border-purple-200/50 focus:border-purple-400 focus:ring-purple-400/20 transition-all duration-300"
                    />
                  </motion.div>
                </motion.div>

                {/* Logo Upload */}
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <Label htmlFor="logo" className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-emerald-500" />
                    Logo (Optional)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('logo')?.click()}
                        className="flex items-center gap-2 backdrop-blur-sm bg-white/60 border-emerald-200/50 hover:border-emerald-400 hover:bg-emerald-50/80 transition-all duration-300"
                      >
                        <motion.div
                          animate={{ rotate: logo ? 360 : 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Upload className="w-4 h-4" />
                        </motion.div>
                        {logo ? logo.name : 'Choose Logo'}
                      </Button>
                    </motion.div>
                    <AnimatePresence>
                      {logo && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md"
                        >
                          ✓ {logo.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Voice Parameter Selection */}
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <Label className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-purple-500" />
                    Video Type
                  </Label>
                  <RadioGroup
                    value={voiceParameter}
                    onValueChange={setVoiceParameter}
                    className="grid grid-cols-2 gap-4"
                  >
                    {[
                      { value: 'durov', label: 'Durov', description: 'Dynamic & Engaging' },
                      { value: 'tucker', label: 'Tucker', description: 'Professional & Clear' }
                    ].map((option, index) => (
                      <motion.div
                        key={option.value}
                        className="relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <label
                          htmlFor={option.value}
                          className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-sm ${
                            voiceParameter === option.value
                              ? 'border-purple-400 bg-purple-50/80 shadow-lg shadow-purple-200/50'
                              : 'border-gray-200/50 bg-white/60 hover:border-purple-200 hover:bg-purple-25/80'
                          }`}
                        >
                          <RadioGroupItem value={option.value} id={option.value} />
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </label>
                      </motion.div>
                    ))}
                  </RadioGroup>
                </motion.div>

                {/* Backend Connection Status */}
                {isBackendConnected === false && (
                  <motion.div
                    className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Backend Connection Error</span>
                    </div>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </motion.div>
                )}

                {/* Error Display */}
                {error && isBackendConnected !== false && (
                  <motion.div
                    className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Error</span>
                    </div>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </motion.div>
                )}

                {/* Generate Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleGenerate}
                      disabled={!script.trim() || isBackendConnected === false || generationState !== 'idle'}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      size="lg"
                    >
                      <motion.div
                        className="flex items-center gap-2"
                        animate={{ scale: script.trim() ? 1 : 0.95 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Sparkles className="w-5 h-5" />
                        Generate Video
                      </motion.div>
                    </Button>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {generationState === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <Card className="backdrop-blur-xl bg-white/70 shadow-2xl border-0 shadow-purple-500/10">
              <CardContent className="py-16 relative overflow-hidden">
                <ParticleEffect progress={progress} />
                <div className="text-center space-y-6 relative z-10">
                  <LoadingAnimation progress={progress} />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Generating your video...
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      Our AI is crafting something amazing for you
                    </p>
                  </motion.div>
                  
                  <motion.div
                    className="max-w-md mx-auto"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="relative">
                      <Progress 
                        value={progress} 
                        className="w-full h-2 bg-purple-100"
                      />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"
                        animate={{ x: [-100, 400] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <motion.p
                      className="text-sm text-muted-foreground mt-3"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {Math.round(progress)}% complete
                    </motion.p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {generationState === 'complete' && generatedVideoUrl && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <Card className="backdrop-blur-xl bg-white/70 shadow-2xl border-0 shadow-purple-500/10">
              <CardHeader>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CardTitle className="flex items-center gap-3 text-2xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    <motion.div
                      className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                    >
                      <Video className="w-6 h-6 text-white" />
                    </motion.div>
                    Your Video is Ready!
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">Your AI-generated video has been created successfully</p>
                </motion.div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Video Player */}
                <motion.div
                  className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-2xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <video
                    src={generatedVideoUrl}
                    controls
                    className="w-full h-full"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  className="flex gap-4 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      className="flex items-center gap-2 backdrop-blur-sm bg-white/60 border-emerald-200/50 hover:border-emerald-400 hover:bg-emerald-50/80 transition-all duration-300"
                    >
                      <Download className="w-4 h-4" />
                      Download Video
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleNewGeneration}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/25 transition-all duration-300"
                    >
                      <RotateCcw className="w-4 h-4" />
                      New Generation
                    </Button>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}