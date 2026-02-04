import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log(`[radar-webhook] Request received: ${req.method}`)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('[radar-webhook] Webhook payload:', JSON.stringify(payload))

    // Radar webhooks can send single event or array of events
    const events = payload.events || (payload.event ? [payload.event] : [])

    if (!events || events.length === 0) {
      console.log('[radar-webhook] No events in payload')
      return new Response(
        JSON.stringify({ success: true, message: 'No events to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Initialize Supabase client with service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const results: { eventType: string; geofenceId: string; userId: string; action: string }[] = []

    for (const event of events) {
      const eventType = event.type
      const geofence = event.geofence
      const user = event.user

      console.log(`[radar-webhook] Processing event: ${eventType}`)

      if (!geofence?._id) {
        console.log('[radar-webhook] No geofence ID in event, skipping')
        continue
      }

      const geofenceId = geofence._id
      const userId = user?.userId || 'unknown'

      if (eventType === 'user.entered_geofence') {
        // Increment current_count atomically
        const { error } = await supabase.rpc('update_gym_occupancy', {
          p_geofence_id: geofenceId,
          p_delta: 1
        })

        if (error) {
          console.error('[radar-webhook] Error incrementing:', error.message)
          // Fallback: manual update
          const { data: currentData } = await supabase
            .from('gym_occupancy')
            .select('current_count')
            .eq('geofence_id', geofenceId)
            .single()

          if (currentData) {
            await supabase
              .from('gym_occupancy')
              .update({
                current_count: currentData.current_count + 1,
                updated_at: new Date().toISOString()
              })
              .eq('geofence_id', geofenceId)
          }
        }

        results.push({ eventType, geofenceId, userId, action: 'incremented' })
        console.log(`[radar-webhook] User ${userId} entered geofence ${geofenceId}`)

      } else if (eventType === 'user.exited_geofence') {
        // Decrement current_count atomically (never below 0)
        const { error } = await supabase.rpc('update_gym_occupancy', {
          p_geofence_id: geofenceId,
          p_delta: -1
        })

        if (error) {
          console.error('[radar-webhook] Error decrementing:', error.message)
          // Fallback: manual update
          const { data: currentData } = await supabase
            .from('gym_occupancy')
            .select('current_count')
            .eq('geofence_id', geofenceId)
            .single()

          if (currentData && currentData.current_count > 0) {
            await supabase
              .from('gym_occupancy')
              .update({
                current_count: currentData.current_count - 1,
                updated_at: new Date().toISOString()
              })
              .eq('geofence_id', geofenceId)
          }
        }

        results.push({ eventType, geofenceId, userId, action: 'decremented' })
        console.log(`[radar-webhook] User ${userId} exited geofence ${geofenceId}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('[radar-webhook] Exception:', error.message, error.stack)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
