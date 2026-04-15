import axios from 'axios';

const BASE_API_URL = '/api';

const API_ENDPOINTS = {
  LIST: `${BASE_API_URL}/earthquakes`,
  STATS: `${BASE_API_URL}/earthquakes/stats`,
  DETAIL: (id: string) => `${BASE_API_URL}/earthquakes/${id}`,
};

export interface Earthquake {
  earthquake_id: string;
  provider: string;
  title: string;
  date: string;
  mag: number;
  depth: number;
  geojson: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  location_properties: {
    closestCity: {
      name: string;
      cityCode: number;
      distance: number;
      population: number;
    };
    epiCenter: {
      name: string;
      cityCode: number;
      population: number | null;
    };
    closestCities: Array<{
      name: string;
      cityCode: number;
      distance: number;
      population: number;
    }>;
    airports: Array<{
      distance: number;
      name: string;
      code: string;
      coordinates: {
        type: string;
        coordinates: [number, number];
      };
    }>;
  };
  date_time: string;
  created_at: number;
  location_tz: string;
  rev?: string | null;
}

export interface EarthquakeResponse {
  status: boolean;
  httpStatus: number;
  desc: string;
  serverloadms: number;
  metadata: {
    date_starts: string;
    date_ends: string;
    count: number;
  };
  result: Earthquake[];
}

export interface EarthquakeStatsResponse {
  status: boolean;
  httpStatus: number;
  desc: string;
  serverloadms: number;
  result: {
    total: number;
    avg_magnitude: number;
    avg_depth: number;
    max_magnitude: number;
    min_magnitude: number;
    max_depth: number;
    min_depth: number;
    magnitude_distribution: {
      [key: string]: number;
    };
    depth_distribution: {
      [key: string]: number;
    };
    cities: {
      [key: string]: number;
    };
  };
}

export interface FilterParams {
  limit?: number;
  skip?: number;
  min_mag?: number;
  max_mag?: number;
  min_depth?: number;
  max_depth?: number;
  start_date?: string;
  end_date?: string;
  city_code?: number;
}

export const fetchLiveEarthquakes = async (): Promise<EarthquakeResponse> => {
  const response = await axios.get<EarthquakeResponse>(API_ENDPOINTS.LIST, {
    params: { limit: 500 },
  });
  return response.data;
};

export const fetchFilteredEarthquakes = async (
  params: FilterParams
): Promise<EarthquakeResponse> => {
  const response = await axios.get<EarthquakeResponse>(API_ENDPOINTS.LIST, { params });
  return response.data;
};

export const fetchEarthquakeStats = async (
  params?: FilterParams
): Promise<EarthquakeStatsResponse> => {
  const response = await axios.get<EarthquakeStatsResponse>(API_ENDPOINTS.STATS, { params });
  return response.data;
};

export const fetchEarthquakesByCity = async (
  cityCode: number,
  params?: FilterParams
): Promise<EarthquakeResponse> => {
  const response = await axios.get<EarthquakeResponse>(API_ENDPOINTS.LIST, {
    params: { ...params, city_code: cityCode },
  });
  return response.data;
};

// Get color based on magnitude and depth - glowing blue effect
export const getMagnitudeColor = (magnitude: number, depth: number = 10): string => {
  // Create a glowing blue effect similar to the reference image
  // For radial gradients, we need RGB format
  
  // Intensity increases with magnitude
  const intensity = Math.min(255, 150 + (magnitude * 20));
  
  // Pure blue for smaller earthquakes, more cyan/white for larger ones
  const r = Math.min(255, Math.floor(magnitude > 4 ? magnitude * 30 : 0));
  const g = Math.min(255, Math.floor(magnitude > 3 ? 150 + (magnitude * 15) : 150));
  const b = 255; // Always max blue
  
  return `rgb(${r}, ${g}, ${b})`;
};

export const getMagnitudeSize = (magnitude: number): number => {
  // Much larger circles for a diffuse radial gradient effect
  // Small earthquakes: 15-20px, Large earthquakes: up to 50px
  return Math.max(15, Math.pow(magnitude, 2.0) * 2);
};

// Get opacity based on depth and magnitude
export const getMarkerOpacity = (magnitude: number, depth: number): number => {
  // For radial gradients, we want a lower base opacity to create a diffuse effect
  // Deeper earthquakes are more transparent
  const depthFactor = Math.max(0.3, 1 - (depth / 400)); // Increase max depth consideration
  
  // Higher magnitude = slightly higher opacity at center
  const magnitudeFactor = Math.min(0.9, 0.4 + (magnitude / 10));
  
  // Lower base opacity for more diffuse gradients
  return Math.min(0.8, Math.max(0.3, depthFactor * magnitudeFactor));
};

// Get border width based on magnitude
export const getBorderWidth = (magnitude: number): number => {
  // Thinner borders for the glow effect
  if (magnitude >= 6.0) return 1.5;
  if (magnitude >= 5.0) return 1;
  if (magnitude >= 4.0) return 0.5;
  return 0.25; // Very thin border for small earthquakes
};

// Get blur radius for the glow effect
export const getBlurRadius = (magnitude: number): number => {
  // Higher magnitude = more blur/glow
  return Math.max(5, magnitude * 3);
};

// Export CSV data from earthquakes
export const exportToCSV = (earthquakes: Earthquake[]): string => {
  if (!earthquakes.length) return '';
  
  const headers = [
    'ID', 'Title', 'Date', 'Magnitude', 'Depth', 
    'Latitude', 'Longitude', 'Closest City', 'Distance (km)'
  ].join(',');
  
  const rows = earthquakes.map(eq => {
    const [lng, lat] = eq.geojson.coordinates;
    const distance = (eq.location_properties.closestCity.distance / 1000).toFixed(2);
    
    return [
      eq.earthquake_id,
      `"${eq.title}"`,
      eq.date_time,
      eq.mag.toFixed(1),
      eq.depth.toFixed(1),
      lat.toFixed(4),
      lng.toFixed(4),
      `"${eq.location_properties.closestCity.name}"`,
      distance
    ].join(',');
  });
  
  return [headers, ...rows].join('\n');
};
