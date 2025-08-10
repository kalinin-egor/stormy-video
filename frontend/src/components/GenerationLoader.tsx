import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Video } from 'lucide-react';

interface GenerationLoaderProps {
  progress: number;
}

export function GenerationLoader({ progress }: GenerationLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <div className="relative">
        {/* Animated rings */}
        <motion.div
          className="w-32 h-32 border-4 border-purple-200 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-2 left-2 w-28 h-28 border-4 border-transparent border-t-purple-500 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute top-4 left-4 w-24 h-24 border-4 border-transparent border-t-blue-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Center icon */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Video className="w-8 h-8 text-purple-600" />
          </motion.div>
        </div>
      </div>

      {/* Floating icons */}
      <div className="relative w-full h-20">
        <motion.div
          className="absolute left-1/4"
          animate={{ y: [-10, -20, -10] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
        >
          <Sparkles className="w-6 h-6 text-purple-400" />
        </motion.div>
        <motion.div
          className="absolute right-1/4"
          animate={{ y: [-20, -10, -20] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <Zap className="w-6 h-6 text-blue-400" />
        </motion.div>
        <motion.div
          className="absolute left-1/2 transform -translate-x-1/2"
          animate={{ y: [-15, -25, -15] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        >
          <Sparkles className="w-5 h-5 text-indigo-400" />
        </motion.div>
      </div>

      {/* Text */}
      <div className="space-y-4">
        <motion.h2 
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Generating Your Video
        </motion.h2>
        <p className="text-gray-600 max-w-md">
          Our AI is analyzing your inputs and creating a stunning promotional video...
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}