import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// API URL configuration
//const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3001'; // Android emulator
const API_URL = "http://192.168.0.92:3001"
//const API_URL = "http://localhost:3001"
//const API_URL = "http://10.0.2.2:3001"
// ==================== 인증 API ====================
export interface User {
  id: string;
  username: string;
  role: 'driver' | 'passenger';
}

export const authAPI = {
  register: async (username: string, password: string, role: 'driver' | 'passenger'): Promise<User> => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      username,
      password,
      role,
    });
    return response.data;
  },

  login: async (username: string, password: string): Promise<User> => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      username,
      password,
    });
    return response.data;
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await axios.get(`${API_URL}/api/auth/user/${userId}`);
    return response.data;
  },

  getUserByUsername: async (username: string): Promise<User | null> => {
    const response = await axios.get(`${API_URL}/api/auth/user/by-username/${username}`);
    if (response.data.error) return null;
    return response.data;
  },
};

// ==================== 매칭 API ====================
export interface Match {
  id: string;
  driverId?: string;
  driverUsername?: string;
  passengerId?: string;
  passengerUsername?: string;
  driverConfirmed: boolean;
  passengerConfirmed: boolean;
  status: 'pending' | 'matched' | 'completed' | 'none';
  driverLatitude?: number;
  driverLongitude?: number;
  passengerLatitude?: number;
  passengerLongitude?: number;
}

export const matchAPI = {
  request: async (
    userId: string,
    username: string,
    role: 'driver' | 'passenger',
    targetUsername: string
  ): Promise<Match> => {
    const response = await axios.post(`${API_URL}/api/match/request`, {
      userId,
      username,
      role,
      targetUsername,
    });
    return response.data;
  },

  getStatus: async (userId: string, role: 'driver' | 'passenger'): Promise<Match> => {
    const response = await axios.get(`${API_URL}/api/match/status`, {
      params: { userId, role },
    });
    return response.data;
  },

  getMatch: async (matchId: string): Promise<Match> => {
    const response = await axios.get(`${API_URL}/api/match/${matchId}`);
    return response.data;
  },

  updateGPS: async (
    matchId: string,
    userId: string,
    role: 'driver' | 'passenger',
    latitude: number,
    longitude: number
  ): Promise<Match> => {
    const response = await axios.put(`${API_URL}/api/match/${matchId}/gps`, {
      userId,
      role,
      latitude,
      longitude,
    });
    return response.data;
  },

  cancel: async (matchId: string): Promise<void> => {
    await axios.delete(`${API_URL}/api/match/${matchId}`);
  },

  complete: async (matchId: string): Promise<void> => {
    await axios.post(`${API_URL}/api/match/${matchId}/complete`);
  },
};

// ==================== 안내문 API ====================
export interface Instruction {
  id: string;
  matchId: string;
  content: string;
  sentToPassenger: boolean;
  detectionData?: any;
  imageWidth?: number;
  imageHeight?: number;
  status?: string;
}

export const instructionAPI = {
  create: async (
    matchId: string,
    content: string,
    detectionData: any,
    imageWidth?: number,
    imageHeight?: number
  ): Promise<Instruction> => {
    const response = await axios.post(`${API_URL}/api/instruction/create`, {
      matchId,
      content,
      detectionData,
      imageWidth,
      imageHeight,
    });
    return response.data;
  },

  send: async (instructionId: string): Promise<Instruction> => {
    const response = await axios.post(`${API_URL}/api/instruction/${instructionId}/send`);
    return response.data;
  },

  cancel: async (instructionId: string): Promise<void> => {
    await axios.delete(`${API_URL}/api/instruction/${instructionId}/cancel`);
  },

  getPending: async (matchId: string): Promise<Instruction | { status: string }> => {
    const response = await axios.get(`${API_URL}/api/instruction/pending`, {
      params: { matchId },
    });
    return response.data;
  },

  getLatest: async (matchId: string): Promise<Instruction | null> => {
    const response = await axios.get(`${API_URL}/api/instruction/latest`, {
      params: { matchId },
    });
    return response.data;
  },
};

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  class_name: string;
  class_id: number;
  ocr_text?: string;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  address?: string;
}

export interface DetectionRequest {
  imageUri: string;
  userMode?: 'driver' | 'passenger';
  driverLocation?: GPSLocation;
  passengerLocation?: GPSLocation;
}

export interface DetectionResponse {
  id: string;
  detections: BoundingBox[];
  instruction: string;
  image_width: number;
  image_height: number;
  driver_latitude?: number;
  driver_longitude?: number;
  passenger_latitude?: number;
  passenger_longitude?: number;
  distance_meters?: number;
  direction?: string;
}

export const detectObjects = async (request: DetectionRequest): Promise<DetectionResponse> => {
  const { imageUri, userMode, driverLocation, passengerLocation } = request;
  const formData = new FormData();

  console.log('[DEBUG] detectObjects called');
  console.log('[DEBUG] imageUri:', imageUri);
  console.log('[DEBUG] API_URL:', API_URL);

  // Extract filename from URI
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  console.log('[DEBUG] filename:', filename, 'type:', type);

  if (Platform.OS === 'web') {
    // In web, we need to fetch the blob from the URI
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append('image', blob, filename);
  } else {
    // In mobile (React Native), we use the object format
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);
  }

  // Add GPS data
  if (userMode) {
    formData.append('user_mode', userMode);
  }

  if (driverLocation) {
    formData.append('driver_latitude', driverLocation.latitude.toString());
    formData.append('driver_longitude', driverLocation.longitude.toString());
  }

  if (passengerLocation) {
    formData.append('passenger_latitude', passengerLocation.latitude.toString());
    formData.append('passenger_longitude', passengerLocation.longitude.toString());
  }

  console.log('[DEBUG] Sending request to:', `${API_URL}/api/detection/detect`);

  try {
    const response = await axios.post(
      `${API_URL}/api/detection/detect`,
      formData,
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data,
      }
    );

    console.log('[DEBUG] Response received:', response.status);
    return response.data;
  } catch (error) {
    console.log('[DEBUG] Error caught:', error);
    if (axios.isAxiosError(error)) {
      console.log('[DEBUG] Axios error code:', error.code);
      console.log('[DEBUG] Axios error message:', error.message);
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error(
          `서버 연결 실패 (${API_URL})\n` +
          '- 서버가 실행 중인지 확인하세요\n' +
          '- 기기가 같은 네트워크에 연결되어 있는지 확인하세요'
        );
      }
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        '이미지 감지에 실패했습니다'
      );
    }
    throw error;
  }
};

export const getDetectionHistory = async (limit: number = 10) => {
  try {
    const response = await axios.get(`${API_URL}/api/detection/history`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch history:', error);
    throw error;
  }
};

// Calculate distance between two GPS coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

// Calculate bearing/direction between two GPS coordinates
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  const normalized = (bearing + 360) % 360;

  // Convert to cardinal direction
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
};


/* Using FETCH (에뮬레이터에서 매우 오래 걸리지만 작동은 함..)

import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// API URL configuration
//const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3001'; // Android emulator
//const API_URL = "http://10.249.88.14:3001"
const API_URL = "http://10.0.2.2:3001"
// ==================== 인증 API ====================
export interface User {
  id: string;
  username: string;
  role: 'driver' | 'passenger';
}

export const authAPI = {
  register: async (username: string, password: string, role: 'driver' | 'passenger'): Promise<User> => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      username,
      password,
      role,
    });
    return response.data;
  },

  login: async (username: string, password: string): Promise<User> => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      username,
      password,
    });
    return response.data;
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await axios.get(`${API_URL}/api/auth/user/${userId}`);
    return response.data;
  },

  getUserByUsername: async (username: string): Promise<User | null> => {
    const response = await axios.get(`${API_URL}/api/auth/user/by-username/${username}`);
    if (response.data.error) return null;
    return response.data;
  },
};

// ==================== 매칭 API ====================
export interface Match {
  id: string;
  driverId?: string;
  driverUsername?: string;
  passengerId?: string;
  passengerUsername?: string;
  driverConfirmed: boolean;
  passengerConfirmed: boolean;
  status: 'pending' | 'matched' | 'completed' | 'none';
  driverLatitude?: number;
  driverLongitude?: number;
  passengerLatitude?: number;
  passengerLongitude?: number;
}

export const matchAPI = {
  request: async (
    userId: string,
    username: string,
    role: 'driver' | 'passenger',
    targetUsername: string
  ): Promise<Match> => {
    const response = await axios.post(`${API_URL}/api/match/request`, {
      userId,
      username,
      role,
      targetUsername,
    });
    return response.data;
  },

  getStatus: async (userId: string, role: 'driver' | 'passenger'): Promise<Match> => {
    const response = await axios.get(`${API_URL}/api/match/status`, {
      params: { userId, role },
    });
    return response.data;
  },

  getMatch: async (matchId: string): Promise<Match> => {
    const response = await axios.get(`${API_URL}/api/match/${matchId}`);
    return response.data;
  },

  updateGPS: async (
    matchId: string,
    userId: string,
    role: 'driver' | 'passenger',
    latitude: number,
    longitude: number
  ): Promise<Match> => {
    const response = await axios.put(`${API_URL}/api/match/${matchId}/gps`, {
      userId,
      role,
      latitude,
      longitude,
    });
    return response.data;
  },

  cancel: async (matchId: string): Promise<void> => {
    await axios.delete(`${API_URL}/api/match/${matchId}`);
  },

  complete: async (matchId: string): Promise<void> => {
    await axios.post(`${API_URL}/api/match/${matchId}/complete`);
  },
};

// ==================== 안내문 API ====================
export interface Instruction {
  id: string;
  matchId: string;
  content: string;
  sentToPassenger: boolean;
  detectionData?: any;
  imageWidth?: number;
  imageHeight?: number;
  status?: string;
}

export const instructionAPI = {
  create: async (
    matchId: string,
    content: string,
    detectionData: any,
    imageWidth?: number,
    imageHeight?: number
  ): Promise<Instruction> => {
    const response = await axios.post(`${API_URL}/api/instruction/create`, {
      matchId,
      content,
      detectionData,
      imageWidth,
      imageHeight,
    });
    return response.data;
  },

  send: async (instructionId: string): Promise<Instruction> => {
    const response = await axios.post(`${API_URL}/api/instruction/${instructionId}/send`);
    return response.data;
  },

  cancel: async (instructionId: string): Promise<void> => {
    await axios.delete(`${API_URL}/api/instruction/${instructionId}/cancel`);
  },

  getPending: async (matchId: string): Promise<Instruction | { status: string }> => {
    const response = await axios.get(`${API_URL}/api/instruction/pending`, {
      params: { matchId },
    });
    return response.data;
  },

  getLatest: async (matchId: string): Promise<Instruction | null> => {
    const response = await axios.get(`${API_URL}/api/instruction/latest`, {
      params: { matchId },
    });
    return response.data;
  },
};

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  class_name: string;
  class_id: number;
  ocr_text?: string;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  address?: string;
}

export interface DetectionRequest {
  imageUri: string;
  userMode?: 'driver' | 'passenger';
  driverLocation?: GPSLocation;
  passengerLocation?: GPSLocation;
}

export interface DetectionResponse {
  id: string;
  detections: BoundingBox[];
  instruction: string;
  image_width: number;
  image_height: number;
  driver_latitude?: number;
  driver_longitude?: number;
  passenger_latitude?: number;
  passenger_longitude?: number;
  distance_meters?: number;
  direction?: string;
}

export const detectObjects = async (request: DetectionRequest): Promise<DetectionResponse> => {
  const { imageUri, userMode, driverLocation, passengerLocation } = request;
  const formData = new FormData();

  console.log('[DEBUG] detectObjects called');
  console.log('[DEBUG] imageUri:', imageUri);
  console.log('[DEBUG] API_URL:', API_URL);

  // Extract filename from URI
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  console.log('[DEBUG] filename:', filename, 'type:', type);

  if (Platform.OS === 'web') {
    // In web, we need to fetch the blob from the URI
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append('image', blob, filename);
  } else {
    // In mobile (React Native), we use the object format
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);
  }

  // Add GPS data
  if (userMode) {
    formData.append('user_mode', userMode);
  }

  if (driverLocation) {
    formData.append('driver_latitude', driverLocation.latitude.toString());
    formData.append('driver_longitude', driverLocation.longitude.toString());
  }

  if (passengerLocation) {
    formData.append('passenger_latitude', passengerLocation.latitude.toString());
    formData.append('passenger_longitude', passengerLocation.longitude.toString());
  }

  console.log('[DEBUG] Sending request to:', `${API_URL}/api/detection/detect`);

  try {
    // Use fetch instead of axios for better multipart handling on Android
    const fetchResponse = await fetch(`${API_URL}/api/detection/detect`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - fetch will set it automatically with boundary
    });

    console.log('[DEBUG] Fetch response status:', fetchResponse.status);

    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${fetchResponse.status}`);
    }

    const data = await fetchResponse.json();
    console.log('[DEBUG] Response received');
    return data;
  } catch (error: any) {
    console.log('[DEBUG] Error caught:', error);
    console.log('[DEBUG] Error message:', error.message);

    // Network error
    if (error.message === 'Network request failed' || error.message?.includes('Network')) {
      throw new Error(
        `서버 연결 실패 (${API_URL})\n` +
        '- 서버가 실행 중인지 확인하세요\n' +
        '- 기기가 같은 네트워크에 연결되어 있는지 확인하세요'
      );
    }
    throw new Error(error.message || '이미지 감지에 실패했습니다');
  }
};

export const getDetectionHistory = async (limit: number = 10) => {
  try {
    const response = await axios.get(`${API_URL}/api/detection/history`, {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch history:', error);
    throw error;
  }
};

// Calculate distance between two GPS coordinates (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

// Calculate bearing/direction between two GPS coordinates
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): string => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  const normalized = (bearing + 360) % 360;

  // Convert to cardinal direction
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
};

*/