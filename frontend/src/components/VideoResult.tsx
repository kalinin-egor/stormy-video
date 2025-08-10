import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Download, Edit3, Play, RefreshCw, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoResultProps {
  onEdit: (prompt: string) => void;
  onStartOver: () => void;
  videoUrl?: string | null;
}

export function VideoResult({ onEdit, onStartOver, videoUrl }: VideoResultProps) {
  const [editPrompt, setEditPrompt] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  const handleEdit = () => {
    if (editPrompt.trim()) {
      onEdit(editPrompt);
      setEditPrompt('');
      setShowEditForm(false);
    }
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = 'generated-video.mp4';
      link.click();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl space-y-6"
    >
      {/* Success message */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Play className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Video is Ready!</h2>
        <p className="text-gray-600">Here's your generated promotional video</p>
      </div>

      {/* Video player */}
      <Card className="overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          {videoUrl ? (
            <div className="relative bg-black aspect-video">
              <video
                controls
                className="w-full h-full object-contain"
                src={videoUrl}
                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1080 1920'%3E%3Crect width='1080' height='1920' fill='%23000'/%3E%3C/svg%3E"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="relative bg-gradient-to-br from-purple-900 to-blue-900 aspect-video flex items-center justify-center">
              {/* Mock video player */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20" />
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer border-2 border-white/30"
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </motion.div>
              
              {/* Video overlay text */}
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-sm opacity-90">Generated Video • 00:30</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          onClick={handleDownload}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Video
        </Button>
        
        <Button
          onClick={() => setShowEditForm(!showEditForm)}
          variant="outline"
          className="border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-3"
        >
          <Edit3 className="w-5 h-5 mr-2" />
          Edit with Prompt
        </Button>
        
        <Button
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share
        </Button>
        
        <Button
          onClick={onStartOver}
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Start Over
        </Button>
      </div>

      {/* Edit form */}
      {showEditForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gray-50">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Label htmlFor="edit-prompt">Describe the changes you'd like to make:</Label>
                <Textarea
                  id="edit-prompt"
                  placeholder="e.g., Make the video more energetic, change the background color, add more text animations..."
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleEdit}
                    disabled={!editPrompt.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Apply Changes
                  </Button>
                  <Button
                    onClick={() => setShowEditForm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}