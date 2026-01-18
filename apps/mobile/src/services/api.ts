import axios from 'axios';
import Constants from 'expo-constants';

// API URL configuration
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:3001'; // Android emulator

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
  
  // Extract filename from URI
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

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

  try {
    const response = await axios.post<DetectionResponse>(
      `${API_URL}/api/detection/detect`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
