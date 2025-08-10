const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface VideoGenerationRequest {
  logo: File;
  screenClip: File;
  productDescription: string;
  voiceScript: string;
  brandColor: string;
  duration: number;
  ctaText: string;
  ctaFrom: number;
}

export interface VideoGenerationResponse {
  task_id: string;
  status: string;
  message: string;
}

export interface VideoStatusResponse {
  task_id: string;
  status: 'processing' | 'completed' | 'error';
  progress: number;
  video_url?: string;
  error?: string;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async generateVideo(data: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const formData = new FormData();
    formData.append('logo', data.logo);
    formData.append('screen_clip', data.screenClip);
    formData.append('product_description', data.productDescription);
    formData.append('voice_script', data.voiceScript);
    formData.append('brand_color', data.brandColor);
    formData.append('duration', data.duration.toString());
    formData.append('cta_text', data.ctaText);
    formData.append('cta_from', data.ctaFrom.toString());

    return this.makeRequest<VideoGenerationResponse>('/api/generate-video', {
      method: 'POST',
      body: formData,
    });
  }

  async getVideoStatus(taskId: string): Promise<VideoStatusResponse> {
    return this.makeRequest<VideoStatusResponse>(`/api/video-status/${taskId}`);
  }

  async downloadVideo(taskId: string): Promise<Blob> {
    const url = `${API_BASE_URL}/api/download-video/${taskId}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  getVideoUrl(taskId: string): string {
    return `${API_BASE_URL}/api/download-video/${taskId}`;
  }
}

export const apiService = new ApiService();
