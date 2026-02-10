import { GEOFENCE_ID } from '@/env';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export interface GymOccupancy {
  id: string;
  geofence_id: string;
  current_count: number;
  max_capacity: number;
  updated_at: string;
}

const DEFAULT_GEOFENCE_ID = GEOFENCE_ID;

export function useGymOccupancy(geofenceId: string = DEFAULT_GEOFENCE_ID) {
  const [occupancy, setOccupancy] = useState<GymOccupancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchOccupancy = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('gym_occupancy')
          .select('*')
          .eq('geofence_id', geofenceId)
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error('[useGymOccupancy] Fetch error:', fetchError.message);
          setError(fetchError.message);
        } else {
          setOccupancy(data);
          setError(null);
        }
      } catch (e: any) {
        console.error('[useGymOccupancy] Exception:', e.message);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOccupancy();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('gym_occupancy_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'gym_occupancy',
          filter: `geofence_id=eq.${geofenceId}`,
        },
        (payload) => {
          console.log('[useGymOccupancy] Realtime update:', payload);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setOccupancy(payload.new as GymOccupancy);
          } else if (payload.eventType === 'DELETE') {
            setOccupancy(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('[useGymOccupancy] Subscription status:', status);
      });

    // Cleanup on unmount
    return () => {
      console.log('[useGymOccupancy] Unsubscribing from channel');
      supabase.removeChannel(channel);
    };
  }, [geofenceId]);

  return {
    occupancy,
    loading,
    error,
    count: occupancy?.current_count ?? 0,
    maxCapacity: occupancy?.max_capacity ?? 80,
  };
}
