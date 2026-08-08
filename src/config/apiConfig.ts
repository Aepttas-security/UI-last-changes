import { Platform } from 'react-native';

/**
 * Central API Configuration for Parent Control Backend
 * - Dynamically extracts Host LAN IP from Expo environment when running on physical devices
 * - Android Emulator uses 10.0.2.2 to reach host machine localhost
 * - Web / Desktop uses 127.0.0.1 or localhost
 * - Port 8000 is the running FastAPI server
 */
const getHostFromExpo = (): string | null => {
  try {
    const g = globalThis as any;
    const constants = g?.expo?.modules?.ExponentConstants || g?.NativeModules?.ExponentConstants;
    const hostUri = constants?.debuggerHost || constants?.manifest?.debuggerHost || constants?.manifest2?.extra?.expoGo?.developer?.tool;
    if (hostUri) {
      const ip = String(hostUri).split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch {}
  return null;
};

export const POSTGRES_DB_URL = 'postgresql://db_team:intern@100.112.49.39:5432/aepttas_xdr';
export const TARGET_DB_HOST = '100.112.49.39';
export const TARGET_DB_PORT = 5432;

const expoIp = getHostFromExpo();
const DEFAULT_HOST = expoIp || TARGET_DB_HOST || (Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1');
const DEFAULT_PORT = '8000';

let customBaseUrl: string | null = null;

export const getApiBaseUrl = (): string => {
  if (customBaseUrl) {
    return customBaseUrl;
  }
  return `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
};

export const getAuthBaseUrl = (): string => {
  if (customBaseUrl) {
    return customBaseUrl;
  }
  return `http://${DEFAULT_HOST}:8002`;
};

export const getGeoBaseUrl = (): string => {
  if (customBaseUrl) {
    return `${customBaseUrl}/api/v1/geolocation`;
  }
  return `http://${DEFAULT_HOST}:8003/api/v1/geolocation`;
};

export const setApiBaseUrl = (url: string) => {
  customBaseUrl = url.trim().replace(/\/+$/, '');
};

export const API_BASE_URL = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
