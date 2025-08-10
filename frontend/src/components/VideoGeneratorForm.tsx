import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Upload, Image, Video, Palette } from 'lucide-react';

interface FormData {
  logo: File | null;
  productDescription: string;
  voiceScript: string;
  brandColor: string;
  screenClip: File | null;
  audioFile: File | null;
  duration: number;
  ctaText: string;
  ctaFrom: number;
}

interface VideoGeneratorFormProps {
  onGenerate: (data: FormData) => void;
  isLoading: boolean;
}

export function VideoGeneratorForm({ onGenerate, isLoading }: VideoGeneratorFormProps) {
  const [formData, setFormData] = useState<FormData>({
    logo: null,
    productDescription: '',
    voiceScript: '',
    brandColor: '#6366f1',
    screenClip: null,
    audioFile: null,
    duration: 10,
    ctaText: 'Get Started',
    ctaFrom: 8.0
  });

  const handleFileUpload = (field: 'logo' | 'screenClip') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  const isFormValid = formData.logo && formData.productDescription && formData.screenClip;

  return (
    <Card className="w-full max-w-2xl bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              AI Video Generator
            </h1>
            <p className="text-gray-600">Create stunning promotional videos in seconds</p>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Logo *
            </Label>
            <div className="relative">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleFileUpload('logo')}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full h-20 border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors"
                onClick={() => document.getElementById('logo')?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm">
                    {formData.logo ? formData.logo.name : 'Click to upload logo'}
                  </span>
                </div>
              </Button>
            </div>
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Product Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your product or service..."
              value={formData.productDescription}
              onChange={handleInputChange('productDescription')}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Voice Script */}
          <div className="space-y-2">
            <Label htmlFor="script">Voice-over Script</Label>
            <Textarea
              id="script"
              placeholder="Enter the script for voice-over (optional)..."
              value={formData.voiceScript}
              onChange={handleInputChange('voiceScript')}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Brand Color */}
          <div className="space-y-2">
            <Label htmlFor="color" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Brand Color
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="color"
                type="color"
                value={formData.brandColor}
                onChange={handleInputChange('brandColor')}
                className="w-20 h-12 p-1 rounded-lg cursor-pointer"
              />
              <Input
                type="text"
                value={formData.brandColor}
                onChange={handleInputChange('brandColor')}
                className="flex-1"
                placeholder="#6366f1"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Video Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              min="5"
              max="30"
              value={formData.duration}
              onChange={handleInputChange('duration')}
              className="w-full"
            />
          </div>

          {/* CTA Text */}
          <div className="space-y-2">
            <Label htmlFor="ctaText">CTA Text</Label>
            <Input
              id="ctaText"
              type="text"
              value={formData.ctaText}
              onChange={handleInputChange('ctaText')}
              className="w-full"
              placeholder="Get Started"
            />
          </div>

          {/* CTA Timing */}
          <div className="space-y-2">
            <Label htmlFor="ctaFrom">Show CTA at (seconds)</Label>
            <Input
              id="ctaFrom"
              type="number"
              min="0"
              step="0.5"
              value={formData.ctaFrom}
              onChange={handleInputChange('ctaFrom')}
              className="w-full"
            />
          </div>

          {/* Screen Clip Upload */}
          <div className="space-y-2">
            <Label htmlFor="clip" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Screen Recording/App Clip *
            </Label>
            <div className="relative">
              <Input
                id="clip"
                type="file"
                accept="video/*"
                onChange={handleFileUpload('screenClip')}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full h-20 border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors"
                onClick={() => document.getElementById('clip')?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm">
                    {formData.screenClip ? formData.screenClip.name : 'Click to upload video clip'}
                  </span>
                </div>
              </Button>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-lg shadow-lg"
          >
            {isLoading ? 'Generating...' : 'Generate Video'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}