// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    CREATE_VIDEO: '/create-video',
    VIDEO_STATUS: '/video-status',
    HEALTH: '/health',
  }
};

// API Response Types
export interface CreateVideoResponse {
  task_id: string;
  status: string;
  message: string;
}

export interface VideoStatusResponse {
  task_id: string;
  status: 'processing' | 'completed' | 'error';
  result_url?: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  active_tasks: number;
  mode?: string;
}
