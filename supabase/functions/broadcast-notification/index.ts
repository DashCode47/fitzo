import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { title, body, data } = await req.json()

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios: title y body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Obtener todos los perfiles que tienen un push_token
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, push_token')
      .not('push_token', 'is', null)

    if (fetchError) throw fetchError

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No hay usuarios con tokens registrados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // 2. Preparar los mensajes para Expo
    const messages = profiles.map(profile => ({
      to: profile.push_token,
      sound: 'default',
      title: title,
      body: body,
      data: data || {},
    }))

    // 3. Enviar en bloques de 100 (límite de Expo)
    const results = []
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100)
      
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      })
      
      const resData = await response.json()
      results.push(resData)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Enviadas ${messages.length} notificaciones en ${results.length} bloques.`,
        details: results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
