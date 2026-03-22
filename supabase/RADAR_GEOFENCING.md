# Radar Geofencing - Documentación del Sistema

## Descripción General

Sistema de detección de presencia en el gym usando Radar.io como proveedor de geofencing. Registra entradas y salidas automáticamente, mantiene un contador de ocupación en tiempo real, y garantiza consistencia mediante tres capas de protección.

---

## Arquitectura del Flujo

```
Usuario entra al gym
        ↓
Radar SDK detecta entrada (geofence event)
        ↓
Radar Server → Webhook (Supabase Edge Function)
        ↓
┌─────────────────────────────────────┐
│  gym_visits: INSERT nueva visita    │
│  entered_at = NOW()                 │
│  expected_exit_at = NOW() + 80 min  │
│  exited_at = NULL                   │
└─────────────────────────────────────┘
        ↓
gym_occupancy.current_count = COUNT(visitas abiertas)
        ↓
Realtime → UI actualiza CrowdMeter
```

---

## Capas de Protección para Salidas

El mayor problema del geofencing es que las salidas no siempre se detectan confiablemente (app en background, permisos insuficientes, señal GPS débil). Por eso hay tres capas:

### Capa 1: Salida real detectada por Radar
- Radar detecta que el usuario salió de la geoballa
- El webhook recibe `user.exited_geofence`
- Se cierra la visita con `exit_method = 'radar'`
- El contador se recalcula inmediatamente

### Capa 2: Salida automática a los 80 minutos
- Si Radar no detectó la salida, un cron job la fuerza
- Corre cada hora en horario del gym (7 AM - 9 PM)
- Busca visitas con `expected_exit_at < NOW()` y `exited_at IS NULL`
- Las cierra con `exit_method = 'auto_expire'`
- Recalcula el contador

### Capa 3: Reset nocturno
- Corre diariamente a las 9 PM (hora de cierre del gym)
- Cierra todas las visitas que quedaron abiertas
- Resetea `gym_occupancy.current_count = 0`
- `exit_method = 'nightly_reset'`

```
Entrada registrada
  │
  ├─ Capa 1: Radar detecta salida real               → se cierra inmediatamente
  │
  ├─ Capa 2: No detectó salida → cron cada hora      → se cierra máx. 1 hora después de los 80 min
  │
  └─ Capa 3: Todo falló → reset a las 9 PM           → se cierra al final del día
```

---

## Tablas en Base de Datos

### `gym_occupancy`
Contador de ocupación en tiempo real.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK |
| geofence_id | text | ID de la geoballa en Radar |
| current_count | integer | Usuarios actualmente en el gym |
| max_capacity | integer | Capacidad máxima (default 80) |
| updated_at | timestamptz | Última actualización |

### `gym_visits`
Registro histórico de visitas individuales.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK |
| user_id | text | ID del usuario en Radar |
| geofence_id | text | ID de la geoballa |
| entered_at | timestamptz | Hora de entrada |
| expected_exit_at | timestamptz | Entrada + 80 min |
| exited_at | timestamptz | Hora real de salida (null si aún adentro) |
| exit_method | text | `radar`, `auto_expire`, `nightly_reset`, `replaced_by_new_entry` |
| created_at | timestamptz | Timestamp de creación del registro |

---

## Cron Jobs (pg_cron)

| Nombre | Schedule | Descripción |
|---|---|---|
| `close-expired-visits` | `0 13-23,0-3 * * *` | Cada hora en horario del gym (7AM-9PM CST) |
| `nightly-gym-reset` | `0 3 * * *` | Reset a las 9 PM CST (3 AM UTC) |

> Timezone del gym: CST (UTC-6)
> Horario: 7 AM - 9 PM

Para verificar los crons:
```sql
SELECT jobname, schedule, active FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## Archivos del Sistema

| Archivo | Descripción |
|---|---|
| `lib/radar.ts` | Servicio cliente de Radar (inicialización, permisos, tracking, eventos) |
| `app/_layout.tsx` | Inicializa Radar al arrancar la app, escucha eventos de entrada/salida |
| `supabase/functions/radar-webhook/index.ts` | Edge Function que procesa eventos de Radar y actualiza DB |
| `supabase/gym_visits_setup.sql` | SQL de setup: tabla gym_visits, funciones y cron jobs |
| `hooks/useGymOccupancy.ts` | Hook para leer ocupación con suscripción realtime |

---

## Configuración de Radar

### Variables de entorno (.env)
```
EXPO_PUBLIC_RADAR_PUBLISHABLE_KEY=prj_live_pk_...
EXPO_PUBLIC_RADAR_SECRET_KEY=prj_live_sk_...
EXPO_PUBLIC_GEOFENCE_ID=<id de la geoballa>
```

### Permisos requeridos
- **iOS**: "Always Allow" (background location) para detectar salidas con app en background
- **Android**: `ACCESS_BACKGROUND_LOCATION`

### Modo de tracking
- Desarrollo (`__DEV__`): `continuous`
- Producción: `responsive`

### Webhook en Radar Dashboard
- Debe estar configurado para enviar eventos: `user.entered_geofence` y `user.exited_geofence`
- URL: `https://<project>.supabase.co/functions/v1/radar-webhook`

---

## Monitoreo

### Ver visitas activas en el gym ahora mismo
```sql
SELECT user_id, entered_at, expected_exit_at
FROM gym_visits
WHERE exited_at IS NULL
ORDER BY entered_at DESC;
```

### Ver historial de visitas recientes
```sql
SELECT user_id, entered_at, exited_at, exit_method
FROM gym_visits
ORDER BY entered_at DESC
LIMIT 20;
```

### Ver ocupación actual
```sql
SELECT * FROM gym_occupancy;
```

### Forzar el cierre de visitas expiradas manualmente
```sql
SELECT close_expired_visits();
```

### Forzar el reset nocturno manualmente
```sql
SELECT nightly_gym_reset();
```

---

## Troubleshooting

**El contador no sube cuando alguien entra**
- Verificar que el webhook está configurado en el Radar Dashboard
- Revisar logs: Supabase → Functions → radar-webhook → Logs

**El contador no baja cuando alguien sale**
- Normal si Radar no detectó la salida → el cron lo corregirá en max. 1 hora
- Verificar permisos de background location en el dispositivo
- En iOS: Configuración → App → Ubicación → "Siempre"

**El contador quedó inflado de un día para el otro**
- El reset nocturno debería haberlo corregido a las 9 PM
- Verificar que el cron `nightly-gym-reset` está activo: `SELECT * FROM cron.job;`
