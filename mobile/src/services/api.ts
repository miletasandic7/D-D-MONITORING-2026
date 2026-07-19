import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Camera, Incident, User, DashboardStats, AIDetection, LoginCredentials, AuthResponse, StreamToken } from '../types';

// Configure your backend URL here
// For local development, use your computer's IP address
// For production, use your deployed API URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.api.interceptors.request.use(
      async (config) => {
        if (!this.token) {
          this.token = await SecureStore.getItemAsync('auth_token');
        }
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== AUTH ====================

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.api.post<AuthResponse>('/auth/login', credentials);
      this.token = response.data.token;
      await SecureStore.setItemAsync('auth_token', this.token);
      await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      // Fallback for demo mode - simulate login
      if (__DEV__) {
        const demoUser: User = {
          id: 'demo-admin-id',
          email: credentials.email,
          display_name: 'Admin User',
          user_type: 'admin',
        };
        const demoToken = 'demo-token-' + Date.now();
        await SecureStore.setItemAsync('auth_token', demoToken);
        await SecureStore.setItemAsync('user', JSON.stringify(demoUser));
        return { token: demoToken, user: demoUser };
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.token = null;
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user');
  }

  async getCurrentUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync('user');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('auth_token');
    return !!token;
  }

  // ==================== DASHBOARD ====================

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await this.api.get<DashboardStats>('/dashboard/stats');
      return response.data;
    } catch (error) {
      // Return demo data
      return {
        total_cameras: 12,
        online_cameras: 10,
        offline_cameras: 2,
        active_incidents: 3,
        critical_incidents: 1,
      };
    }
  }

  // ==================== CAMERAS ====================

  async getCameras(): Promise<Camera[]> {
    try {
      const response = await this.api.get<Camera[]>('/cameras');
      return response.data;
    } catch (error) {
      // Return demo cameras
      return this.getDemoCameras();
    }
  }

  async getCamera(id: string): Promise<Camera> {
    try {
      const response = await this.api.get<Camera>(`/cameras/${id}`);
      return response.data;
    } catch (error) {
      const cameras = this.getDemoCameras();
      const camera = cameras.find(c => c.id === id);
      if (camera) return camera;
      throw error;
    }
  }

  async getCameraStreamToken(cameraId: string): Promise<StreamToken> {
    try {
      const response = await this.api.get<StreamToken>(`/cameras/${cameraId}/stream-token`);
      return response.data;
    } catch (error) {
      // Return demo token
      return {
        camera_id: cameraId,
        token: 'demo-token-' + Date.now(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };
    }
  }

  private getDemoCameras(): Camera[] {
    return [
      {
        id: '1',
        name: 'Ulaz - Glavna kapija',
        location: 'Beograd, Novi Beograd',
        rtsp_url: 'rtsp://demo/cam1',
        enabled: true,
        status: 'online',
        stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Parking - Sever',
        location: 'Beograd, Novi Beograd',
        rtsp_url: 'rtsp://demo/cam2',
        enabled: true,
        status: 'online',
        stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Skladište A',
        location: 'Beograd, Zemun',
        rtsp_url: 'rtsp://demo/cam3',
        enabled: true,
        status: 'recording',
        stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        created_at: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Kancelarije - Floor 1',
        location: 'Beograd, Stari Grad',
        rtsp_url: 'rtsp://demo/cam4',
        enabled: true,
        status: 'online',
        stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        created_at: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'Ulaz - Stražnji',
        location: 'Beograd, Vračar',
        rtsp_url: 'rtsp://demo/cam5',
        enabled: false,
        status: 'offline',
        created_at: new Date().toISOString(),
      },
      {
        id: '6',
        name: 'Proizvodnja - Linija 1',
        location: 'Beograd, Zemun',
        rtsp_url: 'rtsp://demo/cam6',
        enabled: true,
        status: 'online',
        stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        created_at: new Date().toISOString(),
      },
    ];
  }

  // ==================== INCIDENTS ====================

  async getIncidents(status?: string): Promise<Incident[]> {
    try {
      const params = status ? { status } : {};
      const response = await this.api.get<Incident[]>('/incidents', { params });
      return response.data;
    } catch (error) {
      return this.getDemoIncidents();
    }
  }

  async getIncident(id: string): Promise<Incident> {
    try {
      const response = await this.api.get<Incident>(`/incidents/${id}`);
      return response.data;
    } catch (error) {
      const incidents = this.getDemoIncidents();
      const incident = incidents.find(i => i.id === id);
      if (incident) return incident;
      throw error;
    }
  }

  async updateIncidentStatus(id: string, status: string): Promise<Incident> {
    try {
      const response = await this.api.patch<Incident>(`/incidents/${id}`, { status });
      return response.data;
    } catch (error) {
      // Update locally
      const incidents = this.getDemoIncidents();
      const incident = incidents.find(i => i.id === id);
      if (incident) {
        incident.status = status as Incident['status'];
        return incident;
      }
      throw error;
    }
  }

  async createIncident(data: Partial<Incident>): Promise<Incident> {
    try {
      const response = await this.api.post<Incident>('/incidents', data);
      return response.data;
    } catch (error) {
      // Create locally
      const newIncident: Incident = {
        id: 'new-' + Date.now(),
        title: data.title || 'New Incident',
        description: data.description || '',
        status: 'new',
        priority: data.priority || 'medium',
        camera_id: data.camera_id,
        camera_name: data.camera_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newIncident;
    }
  }

  private getDemoIncidents(): Incident[] {
    return [
      {
        id: '1',
        title: 'Nepoznata osoba na parkingu',
        description: 'Detektovana osoba u neovlašćenom terminu na sever parkingu',
        status: 'new',
        priority: 'high',
        camera_id: '2',
        camera_name: 'Parking - Sever',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '2',
        title: 'Pokret u magacinu van radnog vremena',
        description: 'AI detekcija pokreta u skladištu A nakon 22:00',
        status: 'acknowledged',
        priority: 'critical',
        camera_id: '3',
        camera_name: 'Skladište A',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: '3',
        title: 'Slab video signal - Kamera 5',
        description: 'Periodični gubitak signala, potrebna provera konekcije',
        status: 'in_progress',
        priority: 'medium',
        camera_id: '5',
        camera_name: 'Ulaz - Stražnji',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '4',
        title: 'Test incident - može se ignorisati',
        description: 'Sistem test - može se označiti kao false alarm',
        status: 'new',
        priority: 'low',
        created_at: new Date(Date.now() - 600000).toISOString(),
        updated_at: new Date(Date.now() - 600000).toISOString(),
      },
    ];
  }

  // ==================== AI DETECTIONS ====================

  async getAIDetections(limit = 20): Promise<AIDetection[]> {
    try {
      const response = await this.api.get<AIDetection[]>('/ai-detections', { 
        params: { limit } 
      });
      return response.data;
    } catch (error) {
      return [];
    }
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/health');
      return response.data.success === true;
    } catch (error) {
      return false;
    }
  }
}

export const api = new ApiService();
export default api;
