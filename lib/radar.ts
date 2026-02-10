import { GEOFENCE_ID, RADAR_PUBLISHABLE_KEY } from '@/env';
import { Platform } from 'react-native';

// We use a lazy-loaded Radar object to prevent the 'RNRadar not found' crash on import
let Radar: any = null;

try {
  // Only attempt to load if we are in a native environment and the module might exist
  // We check NativeModules or just try the require
  Radar = require('react-native-radar').default;
} catch (e) {
  // Radar not found in this binary (e.g. Expo Go)
  Radar = null;
}

const isRadarAvailable = !!Radar;

export const RadarService = {
  initialize: () => {
    console.log('[RadarService] Initializing with key:', (RADAR_PUBLISHABLE_KEY || '').substring(0, 12) + '...');
    if (!isRadarAvailable) {
      console.warn('[RadarService] Radar native module not found in this binary. Geofencing disabled.');
      return;
    }
    try {
      Radar.initialize(RADAR_PUBLISHABLE_KEY);
      if (__DEV__) {
        Radar.setLogLevel('debug');
      }
    } catch (e) {
      console.warn('[RadarService] Failed to initialize Radar:', e);
    }
  },

  getPermissionsStatus: async () => {
    if (!isRadarAvailable) return 'DENIED' as any;
    return await Radar.getPermissionsStatus();
  },

  identify: (userId: string, metadata: any = {}, tags: string[] = []) => {
    if (!isRadarAvailable) return;
    Radar.setUserId(userId);
    Radar.setMetadata(metadata);
    if (tags.length > 0) {
      Radar.setTags(tags);
    }
  },

  activate: async (userId: string, metadata: any, tags: string[] = [], mode: 'responsive' | 'continuous' | 'efficient' = 'responsive') => {
    if (!isRadarAvailable) return;

    // 1. Identify
    console.log('[RadarService] Identifying user in activate:', userId);
    RadarService.identify(userId, metadata, tags);

    // 2. Check permissions and start tracking if possible
    const status = await RadarService.getPermissionsStatus();
    console.log('[RadarService] Current permission status:', status);
    if (status === 'GRANTED_BACKGROUND' || status === 'GRANTED_FOREGROUND') {
      RadarService.startTracking(mode);
      console.log("📡 Radar tracking activado para:", userId, "Modo:", mode);
    } else {
      console.warn('[RadarService] Tracking not started: lack of permissions');
    }
  },

  requestPermissions: async () => {
    if (!isRadarAvailable) {
      console.warn('[RadarService] Cannot request permissions: native module missing.');
      return 'DENIED' as any;
    }
    try {
      const status = await Radar.getPermissionsStatus();
      if (status === 'NOT_DETERMINED') {
        const foregroundStatus = await Radar.requestPermissions(false);
        if (foregroundStatus === 'GRANTED_FOREGROUND' && Platform.OS === 'android') {
          await Radar.requestPermissions(true);
        }
        return foregroundStatus;
      }
      return status;
    } catch (e) {
      console.error('Radar permission error:', e);
      return 'DENIED' as any;
    }
  },

  startTracking: (mode: 'responsive' | 'continuous' | 'efficient' = 'responsive') => {
    if (!isRadarAvailable) return;
    console.log('[RadarService] Starting tracking mode:', mode);
    if (mode === 'continuous') {
      Radar.startTrackingContinuous();
    } else if (mode === 'efficient') {
      Radar.startTrackingEfficient();
    } else {
      Radar.startTrackingResponsive();
    }
  },

  stopTracking: () => {
    if (!isRadarAvailable) return;
    Radar.stopTracking();
  },

  onLocation: (callback: (result: any) => void) => {
    if (!isRadarAvailable) return;
    Radar.onLocationUpdated(callback);
  },

  onEvents: (callback: (result: any) => void) => {
    if (!isRadarAvailable) return;
    Radar.onEventsReceived(callback);
  },

  off: () => {
    if (!isRadarAvailable) return;
    Radar.onLocationUpdated(null);
    Radar.onEventsReceived(null);
  },

  getGeofenceUsers: async (tag: string, externalId: string) => {
    // ... (existing code)
  },

  getGeofenceId: () => GEOFENCE_ID,
};
