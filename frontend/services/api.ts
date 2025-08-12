import { API_CONFIG, CreateVideoResponse, VideoStatusResponse, HealthResponse } from '../config/api';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  // Health check
  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.HEALTH}`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Create video
  async createVideo(script: string, videoType: string, logo?: File): Promise<CreateVideoResponse> {
    const formData = new FormData();
    formData.append('script', script);
    formData.append('video_type', videoType);
    
    if (logo) {
      formData.append('logo', logo);
    }

    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.CREATE_VIDEO}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create video: ${errorText}`);
    }

    return response.json();
  }

  // Check video status with long polling
  async checkVideoStatus(taskId: string): Promise<VideoStatusResponse> {
    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.VIDEO_STATUS}/${taskId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Task not found');
      }
      throw new Error(`Failed to check video status: ${response.statusText}`);
    }

    return response.json();
  }

  // Poll video status until completion
  async pollVideoStatus(taskId: string, onProgress?: (status: string) => void): Promise<VideoStatusResponse> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await this.checkVideoStatus(taskId);
        
        if (onProgress) {
          onProgress(status.status);
        }

        if (status.status === 'completed' || status.status === 'error') {
          return status;
        }

        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('Error polling video status:', error);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    throw new Error('Video generation timeout');
  }
}

export const apiService = new ApiService();
