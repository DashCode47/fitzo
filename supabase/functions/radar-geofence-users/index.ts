import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RADAR_SECRET_KEY = Deno.env.get('RADAR_SECRET_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log(`[radar-geofence-users] Request received: ${req.method}`)

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('[radar-geofence-users] Payload:', JSON.stringify(payload))

    const { tag, externalId } = payload

    if (!tag || !externalId) {
      console.error('[radar-geofence-users] Missing tag or externalId')
      return new Response(
        JSON.stringify({ error: 'Missing tag or externalId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!RADAR_SECRET_KEY) {
      console.error('[radar-geofence-users] RADAR_SECRET_KEY is missing')
      return new Response(
        JSON.stringify({ error: 'RADAR_SECRET_KEY not set in Edge Function' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const url = `https://api.radar.io/v1/geofences/${tag}/${externalId}/users`
    console.log(`[radar-geofence-users] Fetching Radar users from: ${url}`)

    const response = await fetch(
      url,
      {
        headers: {
          'Authorization': RADAR_SECRET_KEY,
          'Content-Type': 'application/json'
        },
      }
    )

    console.log(`[radar-geofence-users] Radar API response status: ${response.status}`)
    const data = await response.json()
    console.log('[radar-geofence-users] Radar API response data received')

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Use 200 for debugging
      }
    )
  } catch (error: any) {
    console.error('[radar-geofence-users] Exception:', error.message)
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        debug: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
