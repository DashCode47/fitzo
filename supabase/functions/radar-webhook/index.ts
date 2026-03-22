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

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('[radar-webhook] Webhook payload:', JSON.stringify(payload))

    const events = payload.events || (payload.event ? [payload.event] : [])

    if (!events || events.length === 0) {
      console.log('[radar-webhook] No events in payload')
      return new Response(
        JSON.stringify({ success: true, message: 'No events to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

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
        // Cerrar visitas previas abiertas del mismo usuario (evitar duplicados)
        await supabase
          .from('gym_visits')
          .update({
            exited_at: new Date().toISOString(),
            exit_method: 'replaced_by_new_entry'
          })
          .eq('user_id', userId)
          .eq('geofence_id', geofenceId)
          .is('exited_at', null)

        // Crear nueva visita con salida esperada en 80 min
        const expectedExit = new Date(Date.now() + 80 * 60 * 1000).toISOString()
        const { error: visitError } = await supabase
          .from('gym_visits')
          .insert({
            user_id: userId,
            geofence_id: geofenceId,
            entered_at: new Date().toISOString(),
            expected_exit_at: expectedExit,
          })

        if (visitError) {
          console.error('[radar-webhook] Error inserting visit:', visitError.message)
        }

        // Recalcular count basado en visitas abiertas
        const { count } = await supabase
          .from('gym_visits')
          .select('*', { count: 'exact', head: true })
          .eq('geofence_id', geofenceId)
          .is('exited_at', null)

        await supabase
          .from('gym_occupancy')
          .update({
            current_count: count ?? 0,
            updated_at: new Date().toISOString()
          })
          .eq('geofence_id', geofenceId)

        results.push({ eventType, geofenceId, userId, action: 'entered' })
        console.log(`[radar-webhook] User ${userId} entered geofence ${geofenceId}. Open visits: ${count}`)

      } else if (eventType === 'user.exited_geofence') {
        // Cerrar la visita abierta del usuario
        const { data: closedVisit, error: exitError } = await supabase
          .from('gym_visits')
          .update({
            exited_at: new Date().toISOString(),
            exit_method: 'radar'
          })
          .eq('user_id', userId)
          .eq('geofence_id', geofenceId)
          .is('exited_at', null)
          .select()

        if (exitError) {
          console.error('[radar-webhook] Error closing visit:', exitError.message)
        }

        if (!closedVisit || closedVisit.length === 0) {
          console.log(`[radar-webhook] No open visit found for user ${userId}, ignoring exit`)
        }

        // Recalcular count basado en visitas abiertas
        const { count } = await supabase
          .from('gym_visits')
          .select('*', { count: 'exact', head: true })
          .eq('geofence_id', geofenceId)
          .is('exited_at', null)

        await supabase
          .from('gym_occupancy')
          .update({
            current_count: count ?? 0,
            updated_at: new Date().toISOString()
          })
          .eq('geofence_id', geofenceId)

        results.push({ eventType, geofenceId, userId, action: 'exited' })
        console.log(`[radar-webhook] User ${userId} exited geofence ${geofenceId}. Open visits: ${count}`)
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
